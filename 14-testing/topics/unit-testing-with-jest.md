<div align="center">

# Unit testing with Jest

<sub>🧪 Testing · 🟢 Easy · ⏱ 1h · `#unit` `#jest`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Jest is a batteries-included test runner: assertions, mocking, a fake JSDOM browser, coverage, and snapshots all in one binary — the tax you pay is a slow, Babel-transformed, sandbox-per-file execution model that Vitest was built to undercut.

---

## 🧠 Mental model

Jest is three tools wearing one trenchcoat: a **runner** (finds `*.test.js`, schedules them across worker processes), an **assertion library** (`expect(...).toBe(...)`), and a **mocking framework** (`jest.fn`, `jest.mock`). Most "Jest questions" are really about which of the three you're using.

The mental model that matters for interviews: **each test file runs in its own isolated module registry, inside its own worker process, with a fresh fake DOM.** That isolation is why tests don't leak globals into each other — and also why Jest is slow: it re-instantiates the world per file and transforms every module through Babel/ts-jest on the way in.

## ⚙️ How it actually works

**Isolation via workers.** Jest spawns a pool of worker processes (`--maxWorkers`) and hands each a test file. Within a file, tests run *sequentially*; across files, in *parallel*. Shared mutable state between test files is impossible by design — which is the point.

**Module transformation.** Node can't natively run JSX or (until recently) ESM, so Jest pipes every imported file through a `transform` (babel-jest or ts-jest). This is the single biggest cost. `jest.mock('./api')` works by hijacking that module registry — Jest replaces the module *before* your code imports it, which is why mock calls are **hoisted** above imports.

**The environment.** `testEnvironment: 'jsdom'` gives you a fake `window`/`document` implemented in pure JS — no real rendering, no layout, `getBoundingClientRect()` returns zeros. `'node'` is faster when you're not touching the DOM.

**Matchers and async.** A test passes if it returns without throwing. For async, you must **return or await the promise** — forget that and Jest reports a false pass because the assertion runs after the test has "finished".

## 💻 Code

```js
// sum.test.js
import { fetchUser } from './api';
import { getName } from './user';

jest.mock('./api'); // HOISTED above the imports — Jest rewrites the registry

describe('getName', () => {
  afterEach(() => jest.clearAllMocks()); // reset call history between tests

  test('formats the user name', async () => {
    fetchUser.mockResolvedValue({ first: 'Ada', last: 'Lovelace' });

    // ❌ Silent false-pass: nothing awaited, assertion never runs in-band
    // getName(1).then((n) => expect(n).toBe('Ada Lovelace'));

    // ✅ await so a rejection or failed assertion actually fails the test
    await expect(getName(1)).resolves.toBe('Ada Lovelace');
    expect(fetchUser).toHaveBeenCalledWith(1);
  });
});
```

```js
// Spying without replacing the whole module:
const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
// ...exercise code...
expect(spy).toHaveBeenCalledTimes(1);
spy.mockRestore(); // put the real console.error back
```

## ⚖️ Trade-offs

- **All-in-one convenience vs speed.** Jest's bundled mocking + JSDOM + coverage means near-zero config to get running. The cost is startup and transform overhead; on large suites Vitest (esbuild + shared module graph) is often 2–4× faster.
- **`jest.mock` is powerful and dangerous.** Auto-mocking a whole module is a blunt instrument — it replaces *everything* with `jest.fn()`, so a partial change downstream silently returns `undefined`. Prefer `jest.spyOn` or explicit factory mocks for surgical control.
- **When NOT to reach for Jest:** a Vite project. Aligning Jest's transform pipeline with Vite's is a config tax; Vitest reuses your `vite.config` and ESM handling for free. Also skip unit tests entirely for pure glue code — an integration test buys more confidence per line.

## 💣 Gotchas interviewers probe

- **`toBe` vs `toEqual`.** `toBe` is `Object.is` (reference identity); `toEqual` is deep structural equality. Comparing two objects with `toBe` fails even when they're identical in content — a classic.
- **`toEqual` vs `toStrictEqual`.** `toEqual` ignores `undefined` properties and sparse-array holes; `toStrictEqual` doesn't, and also checks the prototype/class. `{a: undefined}` **equals** `{}` under `toEqual`.
- **Mock hoisting.** `jest.mock` is lifted to the top of the file by Babel. A variable referenced inside the factory that isn't prefixed `mock` throws "cannot access before initialization".
- **Forgotten `await`.** The number-one cause of tests that pass but shouldn't. Use `expect.assertions(n)` to force a count when testing error paths.
- **Leaky timers/listeners.** An un-cleared `setInterval` or open handle keeps the worker alive — Jest warns "did not exit one second after". `--detectOpenHandles` finds it.
- **`clearAllMocks` vs `resetAllMocks` vs `restoreAllMocks`.** Clear wipes call history; reset also wipes implementations; restore returns spies to the original. Mixing them up gives flaky cross-test state.

## 🎯 Say this in the interview

> "Jest is a runner, an assertion library, and a mocking framework in one. The model I keep in mind is that every test file gets its own isolated module registry in its own worker process, with a fresh JSDOM — that's what makes tests independent, and also what makes Jest slower than esbuild-based runners. I lean on `jest.spyOn` over auto-mocking whole modules because auto-mock silently stubs everything to `undefined`. The two things I'm most careful about are awaiting async assertions — an unawaited promise is a false pass — and choosing the right equality matcher: `toBe` is reference identity, `toEqual` is deep but ignores `undefined` keys, `toStrictEqual` is the strict one. And I always reset mock state between tests so history doesn't leak."

## 🔗 Go deeper

- [Jest — Getting started](https://jestjs.io/docs/getting-started) — install, first test, config surface.
- [Jest — Mock functions](https://jestjs.io/docs/mock-functions) — `jest.fn`, `spyOn`, and the reset/clear/restore distinction.
- [Jest — Expect (matchers)](https://jestjs.io/docs/expect) — the full matcher list, including the equality nuances.
- [Jest — Testing async code](https://jestjs.io/docs/asynchronous) — the return/await rules that prevent false passes.
