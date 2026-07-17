<div align="center">

# Mocking network with MSW

<sub>🧪 Testing · 🟡 Medium · ⏱ 1h · `#mocking` `#msw`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Mock Service Worker intercepts requests at the **network layer** (a Service Worker in the browser, a request interceptor in Node) instead of stubbing `fetch`. Your code runs its *real* data-fetching path — same client, same URL, same headers — and MSW answers with a canned response, so one set of handlers serves unit tests, Storybook, and the dev server without a single line of app code knowing it's faked.

---

## 🧠 Mental model

Every other approach fakes something *inside* your app: you replace `fetch`, or you mock the module that calls `fetch`, or you inject a fake client. MSW moves the seam **all the way out to the wire**. Your component calls `axios.get('/api/user')` for real; the request genuinely leaves the client; MSW catches it on the way out and hands back a response.

```
  Component → React Query → fetch/axios → [MSW interceptor] → handler → mocked Response
              ^^^^ all of this is your REAL code path ^^^^
```

The payoff is that mocks stop coupling to your implementation. Rename your API module, swap `fetch` for `axios`, add a caching layer — the handlers don't change, because they only care about the HTTP contract. That's why MSW became the default: it's the mock that survives refactors.

## ⚙️ How it actually works

**Two runtimes, one handler set.** In the browser MSW registers a **Service Worker** (`mockServiceWorker.js`) that intercepts `fetch`/`XHR` via the `fetch` event. In Node (Jest/Vitest) there's no Service Worker, so `setupServer` monkey-patches the request layer (`ClientRequest`, `fetch`) directly. You author handlers once with the same `http.get(...)` API and point them at whichever setup the environment needs.

```js
// handlers.js — the single source of truth
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/user/:id', ({ params }) =>
    HttpResponse.json({ id: params.id, name: 'Ada' })),
  http.post('/api/login', async ({ request }) => {
    const { password } = await request.json();
    return password === 'ok'
      ? HttpResponse.json({ token: 't' })
      : new HttpResponse(null, { status: 401 });
  }),
];
```

The Node lifecycle that keeps tests isolated:

```js
import { setupServer } from 'msw/node';
const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers()); // undo per-test overrides
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` is the setting that earns its keep — it fails loudly when your code hits a URL you forgot to mock, instead of silently returning a hung promise. **Per-test overrides** are the real superpower: `server.use(http.get('/api/user/:id', () => new HttpResponse(null, { status: 500 })))` lets one test simulate a 500 without touching the global happy-path handlers, and `resetHandlers()` wipes it afterward.

## 💻 Code

```jsx
// ✅ One test file, real fetch path, three network conditions.
test('shows the user on success', async () => {
  render(<Profile id="1" />);
  expect(await screen.findByText('Ada')).toBeInTheDocument();
});

test('shows an error banner on 500', async () => {
  server.use(
    http.get('/api/user/:id', () => new HttpResponse(null, { status: 500 }))
  );
  render(<Profile id="1" />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/went wrong/i);
});

test('shows a spinner while pending', async () => {
  server.use(
    http.get('/api/user/:id', async () => {
      await delay(100);                 // MSW's delay util
      return HttpResponse.json({ name: 'Ada' });
    })
  );
  render(<Profile id="1" />);
  expect(screen.getByRole('status')).toBeInTheDocument(); // spinner first
});
```

## ⚖️ Trade-offs

- **MSW tests the request/response contract, not the server.** It won't catch a backend that changed its schema — pair it with contract tests (Pact) or typed clients generated from OpenAPI if drift is a real risk.
- **When NOT to use it:** a pure function with no I/O needs no network mock at all. And for true end-to-end confidence you sometimes *want* the real API — MSW is for the layers below e2e.
- **The Service Worker file must be served and versioned.** `npx msw init public/` generates it; forget to redeploy it after an MSW upgrade and browser mocks silently stop matching. Node has no such wrinkle.
- **v1 → v2 was a breaking rewrite** (`rest` → `http`, `res(ctx.json())` → `HttpResponse.json()`). Copy-pasting old blog snippets is a common time sink.

## 💣 Gotchas interviewers probe

- **"How is this different from mocking `fetch`?"** Mocking `fetch` couples to the client and skips your real serialization/error handling. MSW exercises the whole path and is client-agnostic. This is *the* question.
- **Forgetting `resetHandlers()`** between tests leaks a `server.use()` override into later tests — a textbook order-dependent flake.
- **`onUnhandledRequest` defaults to `warn`, not `error`.** Leaving it as warn means typo'd URLs fail as timeouts, not clear errors. Flip it to `error` in CI.
- **Relative vs absolute URLs.** In Node (jsdom) there's no origin, so `/api/user` may need a base URL or an absolute handler pattern — a frequent "works in browser, fails in Jest".
- **MSW doesn't run your network middleware** (retries, auth refresh) unless that logic lives in your client — it lives *below* your app, so anything in a proxy or gateway is invisible.

## 🎯 Say this in the interview

> "MSW intercepts at the network boundary — a Service Worker in the browser, a request interceptor in Node — so my component runs its real fetch path and MSW answers on the wire. The big win over stubbing `fetch` is decoupling: the handlers describe the HTTP contract, so they survive swapping the client or refactoring the data layer, and I reuse the exact same handlers in unit tests, Storybook, and local dev. In tests I set `onUnhandledRequest: 'error'` so a forgotten URL fails loudly, and I lean on `server.use()` to override a single endpoint per test — 500s, slow responses, empty states — then `resetHandlers()` in `afterEach` to keep tests isolated. The one thing I watch is that Node has no origin, so URL matching sometimes needs an absolute base that the browser doesn't."

## 🔗 Go deeper

- [MSW — Documentation](https://mswjs.io/docs/) — the canonical guide; start with the "Getting started" and "Best practices".
- [MSW — Request handlers](https://mswjs.io/docs/concepts/request-handler) — how matching and resolvers work, including runtime overrides.
- [Kent C. Dodds — Stop mocking fetch](https://kentcdodds.com/blog/stop-mocking-fetch) — the argument for network-level mocking, from MSW's biggest advocate.
- [MSW — Migrating to v2](https://mswjs.io/docs/migrations/1.x-to-2.x/) — the `http`/`HttpResponse` API you'll actually write today.
