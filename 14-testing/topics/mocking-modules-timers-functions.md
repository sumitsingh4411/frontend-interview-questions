<div align="center">

# Mocking (modules, timers, functions)

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#mocking`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A mock is a test double you *control*: a stand-in that records how it was called and returns whatever you tell it. The senior skill isn't the API — it's knowing **what** to replace (nondeterministic seams: network, clock, randomness, the module boundary) and what to leave real, because every mock you add is a coupling to implementation you'll pay for on the next refactor.

---

## 🧠 Mental model

"Mock" is an overloaded word. There are really four kinds of test double, and precision here is a senior signal:

| Double | What it does |
|---|---|
| **Stub** | Returns canned values. No assertions. "When asked, say 42." |
| **Spy** | Wraps a *real* function and records calls while still running it. |
| **Mock** | A stub that also *asserts* on how it was called. |
| **Fake** | A working lightweight implementation (in-memory DB, `jsdom`). |

`jest.fn()` / `vi.fn()` is the atom of all of these — a function that both records every call (`mock.calls`) and lets you script its return. Everything else (`spyOn`, `jest.mock`) is sugar on top.

The framing that keeps you out of trouble: **mock at the seams, not in the middle.** Replace the things you don't own or can't control — the network, `Date.now()`, `Math.random`, a payments SDK. Leave your own logic real, or you end up asserting that your mock does what you told your mock to do.

## ⚙️ How it actually works

**`jest.mock('./mod')` is hoisted** to the top of the file, above your imports, by a Babel/SWC transform. That's why the factory can't reference outer variables — they don't exist yet when it runs. It swaps the entry in the **module registry** so every `import` of that path — including transitive ones deep in the tree — gets your fake.

Two knobs on a mock function people conflate:

```js
fn.mockReturnValue(3);              // always returns 3, ignores args
fn.mockImplementation((a) => a*2);  // full control: logic, throws, async
fn.mockResolvedValue(user);         // sugar for () => Promise.resolve(user)
fn.mockReturnValueOnce(1).mockReturnValueOnce(2); // queue, then falls through
```

**Reset semantics** are the classic trap — three different verbs:

- `mockClear()` — wipes `.mock.calls`/`.results`. Keeps the implementation.
- `mockReset()` — clears **and** removes the implementation (returns `undefined`).
- `mockRestore()` — only for `spyOn`; puts the **original** function back.

`spyOn` is the one that leaks across files if you forget to restore it — hence `restoreMocks: true` in config, or `afterEach(() => jest.restoreAllMocks())`.

**ESM changes the game.** Native ES modules have live, read-only bindings, so you can't reassign an export. Jest needs `jest.unstable_mockModule` + dynamic `import()`; Vitest's `vi.mock` is hoisted like Jest's but plays nicer with ESM. This distinction comes up the moment a codebase moves off CommonJS.

## 💻 Code

```js
// ✅ Partial mock: fake ONE export, keep the rest real via requireActual.
jest.mock('./api', () => ({
  ...jest.requireActual('./api'),
  fetchUser: jest.fn(),          // only this is faked
}));
import { fetchUser } from './api';

test('renders the name', async () => {
  fetchUser.mockResolvedValue({ name: 'Ada' });
  render(<Profile id="1" />);
  expect(await screen.findByText('Ada')).toBeInTheDocument();
  expect(fetchUser).toHaveBeenCalledWith('1'); // assert the contract
});
```

```js
// ✅ spyOn: assert a side effect without silencing it, then restore.
const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
doThing();
expect(warn).toHaveBeenCalledTimes(1);
warn.mockRestore(); // or restoreMocks: true globally
```

## ⚖️ Trade-offs

- **Every mock couples the test to implementation.** Mock `fetchUser` and later rename it, and green tests hide a broken app. The more you mock, the more you test wiring instead of behaviour — which is why the modern default is to mock *lower* (the network, via MSW) rather than *higher* (your own service functions).
- **When NOT to mock:** pure functions, your own reducers/selectors, anything cheap and deterministic. Mocking these is pure overhead with negative value.
- **Auto-mocking (`jest.mock('x')` with no factory) is a footgun at scale** — it silently turns every export into `jest.fn()` returning `undefined`, producing confusing failures far from the cause. Prefer explicit factories.

## 💣 Gotchas interviewers probe

- **`jest.mock` hoisting.** It runs *before* imports, so referencing a top-level `const` in the factory throws `ReferenceError: Cannot access before initialization`. The escape hatch is the `mock`-prefixed variable name that Jest allow-lists.
- **`mockReset` vs `mockClear` vs `mockRestore`.** If a candidate can't distinguish these, they've never debugged cross-test state bleed. `clearMocks` clears calls between tests; only `restoreMocks` un-spies.
- **Mocking `Date`/`Math.random` by hand is fragile** — use fake timers and a seeded `spyOn(Math, 'random')`. Tests that assert on real time are flaky by construction.
- **A mock of a default export** needs `{ __esModule: true, default: jest.fn() }` — forgetting `__esModule` is a silent `undefined`.
- **Mocking `fetch` globally** loses request-matching and leaks between tests; this is exactly the pain MSW exists to remove.

## 🎯 Say this in the interview

> "I think in terms of test doubles — stub, spy, mock, fake — and `jest.fn` is the primitive under all of them. My rule is to mock at the seams: the network, the clock, randomness, third-party SDKs — the stuff that's nondeterministic or that I don't own — and to leave my own logic real, so I'm testing behaviour, not my own mocks. For modules I lean on partial mocks with `requireActual` so I only fake the one export I need. The details I stay sharp on: `jest.mock` is hoisted above imports, and I keep `mockClear`, `mockReset`, and `mockRestore` straight — the last one only applies to `spyOn` and it's the usual cause of state bleeding between tests. And I know ESM breaks naive mocking because bindings are live, so on modern stacks I reach for Vitest's `vi.mock` or Jest's `unstable_mockModule`."

## 🔗 Go deeper

- [Jest — Mock Functions](https://jestjs.io/docs/mock-functions) — the canonical reference for `jest.fn`, calls, and return-value scripting.
- [Jest — `jest.mock` & module mocking](https://jestjs.io/docs/jest-object) — hoisting rules, auto-mock, `requireActual`.
- [Vitest — Mocking](https://vitest.dev/guide/mocking) — the ESM-first take, with `vi.mock`/`vi.spyOn` and how it differs from Jest.
- [Kent C. Dodds — But really, what is a JavaScript mock?](https://kentcdodds.com/blog/but-really-what-is-a-javascript-mock) — the mental model, from first principles.
