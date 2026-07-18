<div align="center">

# Integration testing

<sub>🧪 Testing · 🟡 Medium · ⏱ 1h · `#integration`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An integration test renders a **real component tree** and drives it like a user, mocking **only the network boundary** — it's the highest confidence-per-millisecond test you can write, because frontend bugs live in the wiring between units, and that wiring is precisely what unit tests mock away.

---

## 🧠 Mental model

Every test draws a circle. Everything inside is real; everything outside is a lie you control. **The whole craft of integration testing is drawing that circle in the right place.**

```
   ┌─ your app ──────────────────────────────────┐
   │  component tree · state · router · hooks    │ ← REAL. all of it.
   │  reducers · context · form validation       │
   └─────────────────────────────────────────────┘
             ↕  ← ✂️ CUT HERE (HTTP). Mock with MSW.
   ┌─ the outside world ─────────────────────────┐
   │  your API · third-party services · auth      │ ← faked
   └─────────────────────────────────────────────┘
```

Unit tests draw the circle around one function. E2E draws it around the whole system including the server. Integration draws it **exactly at HTTP** — the one seam that is a genuine contract, versioned, and owned by someone else.

The payoff: a passing integration test means *"a user can do this thing, assuming the API behaves as specified."* That's a claim worth making. A passing unit test means *"this function returns what I told it to"* — which is very nearly a tautology.

## ⚙️ How it actually works

**Cut at the network, not at the module.** `jest.mock('./api')` looks equivalent to mocking HTTP and is strictly worse: it deletes your fetch wrapper, your error handling, your retry logic, your response parsing, and your cache from the test. Those are exactly where bugs live. MSW intercepts at the `fetch`/XHR layer, so every line of your data layer runs for real and only the wire is fake.

**Query the way a user perceives, not the way you built.** Testing Library's priority order is a confidence gradient, not a style guide:

| Priority | Query | Why |
|---|---|---|
| 1 | `getByRole('button', { name: /save/i })` | how assistive tech *and* sighted users identify it |
| 2 | `getByLabelText` | the actual form contract |
| 3 | `getByText` | visible content |
| ⚠️ last | `getByTestId` | an escape hatch, not a default |

`getByRole` is doing double duty: **a test that can't find your button by role is telling you screen readers can't either.** Every `getByTestId` you write silently opts out of that free accessibility check.

**Render the tree the way the app does.** A component that reads from context, router, and a query client must be tested with all three — so wrap once, in a custom `render`, and never think about it again. Tests that hand-roll providers per file drift out of sync with the real app and start passing for the wrong reasons.

**Async is the default, not the exception.** `findBy*` = `getBy*` + `waitFor`, polling until it appears or a 1000ms timeout. Use it for anything downstream of a network call. Never assert on a loading spinner's *absence* with `getBy` — that's a race.

## 💻 Code

The reusable render — the single highest-leverage file in your test suite:

```jsx
// test/render.jsx — mirrors the real provider stack in src/App.jsx
function AllProviders({ children }) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } }, // ✅ retries turn a 500-test
  });                                              //    into a 3× timeout
  return (
    <QueryClientProvider client={client}>
      <MemoryRouter><ThemeProvider>{children}</ThemeProvider></MemoryRouter>
    </QueryClientProvider>
  );
}
export function renderApp(ui, opts) {
  return { user: userEvent.setup(), ...render(ui, { wrapper: AllProviders, ...opts }) };
}
```

The network boundary, faked once:

```js
// test/server.js
export const server = setupServer(
  http.get('/api/cart', () => HttpResponse.json({ items: [] }))
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' })); // ✅ fail loudly on
afterEach(() => server.resetHandlers());                          //    unmocked calls
afterAll(() => server.close());
```

`onUnhandledRequest: 'error'` is non-negotiable. Without it, a request you forgot to mock silently hangs and you debug a timeout instead of reading a clear error.

Wrong altitude vs right altitude:

```jsx
// ❌ Tests React, not your feature. Passes while the app is broken.
const { result } = renderHook(() => useCart());
act(() => result.current.add(shoe));
expect(result.current.items).toHaveLength(1);   // asserts on internals

// ✅ Tests the feature. Fails when the app is broken.
test('adding an item shows it in the cart and updates the total', async () => {
  const { user } = renderApp(<ProductPage product={shoe} />);

  await user.click(screen.getByRole('button', { name: /add to cart/i }));

  expect(await screen.findByRole('status')).toHaveTextContent('1 item');
  expect(screen.getByText('$89.00')).toBeInTheDocument();
});

// ✅ And the path that actually breaks in production — the sad one
test('shows a retry affordance when the cart API fails', async () => {
  server.use(http.get('/api/cart', () => new HttpResponse(null, { status: 500 })));
  renderApp(<CartPage />);
  expect(await screen.findByRole('alert')).toHaveTextContent(/couldn't load/i);
});
```

## ⚖️ Trade-offs

- **Integration tests fail with worse error messages.** When a unit test breaks you know the function; when an integration test breaks you get "unable to find role=status" and a DOM dump. You trade **diagnostic precision for realism** — and that's the right trade, because a failing integration test means something a *user* cares about broke, which is why you'd interrupt your day for it.
- **They're slower than unit, and it's not close.** ~50–200ms each vs ~1ms. A thousand of them is a real CI cost. But they're 20–50× faster than the equivalent E2E and don't flake, so they're where the volume belongs.
- **MSW handlers are a fixture you must maintain.** They can drift from the real API and give you a suite that's green against an API that no longer exists. That risk is real and the answer isn't "mock less" — it's **contract tests or typed handlers generated from the OpenAPI schema**. Anyone who claims mocked integration tests prove the backend works is overselling.
- **When NOT to use them:** pure algorithmic code (a date parser, a diffing routine) — that's genuinely unit-shaped, and an integration test around it is indirection with no confidence gain. Also: anything whose value *is* the real infrastructure — auth redirects, CDN behaviour, third-party payment iframes. Those want E2E.

## 💣 Gotchas interviewers probe

- **`jest.mock('./api')` is not integration testing.** It mocks *your own code*, deleting the data layer from the test. Mock the network (MSW), not your modules. Candidates who reach for module mocks by default reveal they've never felt the difference.
- **`getByTestId` as the default query.** It couples the test to markup while skipping the accessibility check `getByRole` gives free. Test IDs are the escape hatch for the genuinely un-queryable (a chart canvas), not the first move.
- **`getBy*` doesn't wait; `findBy*` does.** Using `getBy` after a click that triggers a fetch is a race that passes locally and flakes in CI. And `waitFor` with a `getBy` inside is the *manual* version of `findBy`.
- **Asserting implementation details.** State shape, hook internals, "was this child component rendered," prop values. If a refactor that changes nothing a user sees breaks the test, the test is wrong — that's the definition of a false positive, and it's how suites become the thing everyone deletes.
- **Not resetting handlers between tests.** A `server.use()` override leaks forward and the next test passes for a reason you didn't intend. `resetHandlers()` in `afterEach`, always.
- **Only testing the happy path.** Loading, empty, error, and permission-denied states are where real users live and where the bugs are. An interviewer noting you tested a 500 response is noting seniority.
- **Retries on in a test config.** React Query's default 3 retries turn one error-path assertion into a multi-second timeout. Turn them off in the test provider.

## 🎯 Say this in the interview

> "An integration test renders the real component tree — state, router, context, my whole data layer — and drives it through the DOM like a user. The only thing I fake is the network, with MSW, because HTTP is the one true boundary I don't own. I specifically avoid `jest.mock` on my own modules: that deletes my fetch wrapper and error handling from the test, which is exactly where the bugs are. I query by role rather than test ID, partly because it's how users identify things and partly because if `getByRole` can't find my button, a screen reader can't either — so it's a free accessibility check. The reason I put most of my budget here is that frontend bugs are almost always wiring bugs, and wiring is what unit tests mock away. The honest limitation is that mocked handlers can drift from the real API, so I still keep a few E2E on the critical paths to prove the contract."

## 🔗 Go deeper

- [Kent C. Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests) — the argument this whole approach rests on.
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/) — "the more your tests resemble the way your software is used, the more confidence they can give you."
- [Testing Library — About queries](https://testing-library.com/docs/queries/about/) — the priority order, and *why* it's ordered that way.
- [MSW — Introduction](https://mswjs.io/docs/) — intercepting at the network layer instead of stubbing your modules.
- [Kent C. Dodds — Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) — the clearest statement of what makes a test brittle.
