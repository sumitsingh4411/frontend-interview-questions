<div align="center">

# Vitest

<sub>🧪 Testing · 🟢 Easy · ⏱ 45m · `#unit` `#vitest`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Vitest is a Jest-compatible runner that reuses your Vite config and transform pipeline, so it runs native ESM through esbuild and shares one module graph across tests — dramatically faster startup and watch mode, with an almost identical `expect`/`vi.mock` API.

---

## 🧠 Mental model

Think of Vitest as **"Jest, but it runs inside your Vite build."** Instead of maintaining a separate Babel/ts-jest transform that you have to keep in sync with your app's bundler, Vitest asks Vite to resolve and transform modules exactly the way your dev server already does. Your aliases, your PostCSS, your TS paths, your `import.meta.env` — all just work, because it's the same pipeline.

The API surface is deliberately a near-drop-in for Jest: `describe/it/expect`, `vi.fn()` instead of `jest.fn()`, `vi.mock()` instead of `jest.mock()`. The reason to switch isn't a better API — it's **speed and config unification**.

## ⚙️ How it actually works

**Vite as the transform layer.** Vitest boots a Vite server in middleware mode. Test files and their imports are transformed on demand by esbuild (10–100× faster than Babel) and served through Vite's module graph. Native ESM means no CommonJS interop dance.

**Smart watch mode.** Because Vite already tracks the module dependency graph, Vitest knows *exactly* which test files import a changed module. Edit one file and it re-runs only the affected tests — instantly. This is the feature people fall in love with.

**Isolation via workers or threads.** By default each test file runs in an isolated environment (worker threads via Tinypool, or `forks`). You can trade isolation for speed with `pool: 'threads'` and `isolate: false` when your tests are genuinely side-effect-free.

**Environments.** Same idea as Jest: `environment: 'jsdom'` or `'happy-dom'` (lighter, faster, less complete) for DOM tests, `'node'` otherwise — settable per-file with a `// @vitest-environment jsdom` docblock.

## 💻 Code

```ts
// vitest.config.ts — often just merged into your existing vite.config
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,            // exposes describe/it/expect without imports
    setupFiles: ['./test/setup.ts'],
    coverage: { provider: 'v8' }, // native V8 coverage, no instrumentation
  },
});
```

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getName } from './user';
import * as api from './api';

// vi.mock is hoisted, just like jest.mock
vi.mock('./api');

describe('getName', () => {
  beforeEach(() => vi.clearAllMocks());

  it('formats the name', async () => {
    vi.mocked(api.fetchUser).mockResolvedValue({ first: 'Ada', last: 'Lovelace' });
    await expect(getName(1)).resolves.toBe('Ada Lovelace');
  });
});
```

```ts
// Fake timers read almost identically to Jest's:
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

## ⚖️ Trade-offs

- **Speed + config reuse vs ecosystem maturity.** Vitest is faster and needs near-zero config in a Vite repo. Jest still has a larger ecosystem of guides, and some legacy tooling assumes it. For a greenfield Vite/React/Vue app, Vitest is the default; for a webpack/CRA monolith, migrating may not pay off.
- **`happy-dom` vs `jsdom`.** `happy-dom` is markedly faster but implements less of the DOM spec — occasional missing APIs bite you. Start on `jsdom` unless DOM-env time dominates your suite.
- **When NOT to use it:** a project with no Vite anywhere and a huge existing Jest suite. The `vi`↔`jest` differences (hoisting rules, `vi.mock` factory semantics) create real migration friction. Don't churn a working suite for a benchmark win.

## 💣 Gotchas interviewers probe

- **`vi.mock` hoisting + `vi.hoisted`.** Like Jest, `vi.mock` is lifted above imports. To use a variable inside the factory you must define it with `vi.hoisted(() => ...)`, or you get a temporal-dead-zone error.
- **`globals: false` is the default.** Unlike Jest, you must import `describe/it/expect` — or set `globals: true`. Copy-pasting a Jest test and getting "expect is not defined" is common.
- **Coverage provider matters.** `v8` (native) is fast but line-based; `istanbul` instruments source for more precise branch coverage. Know that the numbers differ.
- **In-source testing.** Vitest can run tests written *inside* the source file under `import.meta.vitest`, stripped in production builds — a genuinely useful feature Jest lacks.
- **ESM-first surprises.** Because it's real ESM, `__mocks__` CommonJS conventions and some `jest.requireActual` patterns don't translate 1:1 — use `vi.importActual`.
- **Isolation off = shared globals.** `isolate: false` is a speed lever that reintroduces cross-test leakage. Only flip it for pure suites.

## 🎯 Say this in the interview

> "Vitest is basically Jest's API running inside Vite. The win is that it reuses my Vite config and transform pipeline, so aliases, TypeScript paths, and env handling all work with zero extra config, and esbuild plus a shared module graph make startup and watch mode far faster than Jest's per-file Babel transform. The watch mode is the killer feature — Vite already knows the dependency graph, so editing a module re-runs only the tests that import it. The API is a near-drop-in: `vi` instead of `jest`. The gotchas I watch for are that globals aren't on by default, and `vi.mock` is hoisted so shared variables need `vi.hoisted`. For a Vite-based app it's my default; I wouldn't churn a large healthy Jest suite in a webpack project just for the speed."

## 🔗 Go deeper

- [Vitest — Guide](https://vitest.dev/guide/) — setup, config, and the Vite integration model.
- [Vitest — Migrating from Jest](https://vitest.dev/guide/migration) — the exact `jest`→`vi` API deltas.
- [Vitest — Mocking](https://vitest.dev/guide/mocking) — `vi.mock`, `vi.hoisted`, `vi.importActual`.
- [Vitest — In-source testing](https://vitest.dev/guide/in-source) — tests co-located in source, stripped from builds.
