<div align="center">

# Modules (ESM vs CJS)

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#modules`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CommonJS (`require`) is **synchronous, dynamic, and copies values**; ES Modules (`import`) are **asynchronous, static, and export live bindings**. The static, live-binding nature of ESM is what makes tree-shaking and top-level `await` possible — and what makes mixing the two painful.

---

## 🧠 Mental model

The one distinction everything else follows from: **CJS resolves at *runtime*, ESM resolves at *parse time*.**

`require('x')` is a function call — it runs when execution reaches it, can be conditional, can take a computed path, and hands you a **snapshot** of `module.exports` at that instant. `import` is a *declaration* — the engine scans it before running a single line, builds the full dependency graph, and wires up **live bindings** (read-only views onto the exporter's variables, not copies).

```
CJS:  require() → run file top-to-bottom → return module.exports object (a value copy)
ESM:  parse ALL imports (static) → construct graph → instantiate (link bindings) → evaluate
```

Because ESM's graph is known before execution, a bundler can *see* which exports are unused and delete them (tree-shaking), and the runtime can fetch modules in parallel. CJS can't: `require` could be behind an `if`, so nothing is statically knowable.

## ⚙️ How it actually works

**Live bindings vs. value copies** — the deepest and most-tested difference:

```js
// counter.mjs
export let count = 0;
export const inc = () => count++;

// main.mjs
import { count, inc } from './counter.mjs';
console.log(count); // 0
inc();
console.log(count); // 1  ← ESM: you see the UPDATED value (live binding)
```

In CJS the equivalent prints `0` twice — you imported a *copy* of the number at require-time. ESM imports are read-only *views* onto the exporter's live variable; you can't reassign them (`count = 5` throws), but you observe the exporter's mutations.

**Circular dependencies** expose the models. ESM handles cycles gracefully via hoisted bindings — the binding exists (possibly in a "temporal dead zone" if accessed too early) but the reference is wired. CJS returns a *partially-populated* `module.exports` — whatever had executed before the cycle closed — so you silently get `undefined` for anything defined later. ESM turns the same mistake into a loud `ReferenceError`.

**Async and hoisting:** ESM is asynchronously evaluated and supports **top-level `await`** (the module graph waits). `import` statements are hoisted to the top and always run first, so you can't conditionally `import` — you use dynamic `import()`, which returns a promise, for that. `require` is just a call: synchronous, conditional, wherever you like.

**Interop:** in Node, an ESM file can `import` a CJS module (its `module.exports` becomes the `default`), but a CJS file **cannot `require` an ESM module** — ESM is async, `require` is sync. You must use dynamic `import()`. `.mjs`/`.cjs` extensions or `"type": "module"` in `package.json` decide how a `.js` file is parsed.

## 💻 Code

```js
// ── CommonJS ──────────────────────────────
const { readFile } = require('fs');       // synchronous, runtime resolution
if (flag) require('./optional');          // legal: conditional require
module.exports = { a, b };                // exports a value snapshot

// ── ES Modules ────────────────────────────
import { readFile } from 'node:fs/promises'; // static, hoisted, parse-time
export const a = 1;                           // named export (tree-shakeable)
export default fn;                            // default export
const mod = await import('./optional.mjs');   // dynamic: async, conditional, code-split

// ❌ Can't conditionally use a static import.
if (flag) import './x';                    // SyntaxError — imports are declarations
// ✅ Dynamic import for conditional / lazy loading (route-based code splitting).
if (flag) await import('./x.mjs');
```

## ⚖️ Trade-offs

- **ESM is the correct default** for new code and the browser's native module system — static analysis, tree-shaking, top-level await, and lazy `import()` for code-splitting all depend on it.
- **CJS still wins** for quick scripts and where synchronous, conditional loading is genuinely needed, and it remains the lingua franca of the legacy npm ecosystem. Dual-publishing (`exports` map with `import`/`require` conditions) is the pragmatic reality for library authors.
- **When NOT to force ESM:** a large CJS codebase mid-migration — half-migrated graphs hit the "CJS can't require ESM" wall constantly. Migrate leaf-first.
- **Bundlers blur the line** — Webpack/Vite/esbuild consume both and emit whatever the target needs, so in app code the distinction is mostly about *authoring* semantics, not shipping.

## 💣 Gotchas interviewers probe

- **Live bindings vs. copies.** The signature question. ESM imports reflect the exporter's later mutations; CJS gives a snapshot. If you say "they're basically the same", that's a fail.
- **You can't `require` an ESM module** from CJS — it's async. Only dynamic `import()` works across the boundary. Endless real-world breakage lives here.
- **`import` is hoisted and static** — no conditional imports; the whole graph loads. Use `import()` for lazy/conditional.
- **Imports are read-only.** Reassigning an imported binding throws in ESM; in CJS you can freely mutate the exports object.
- **Circular deps:** CJS silently gives `undefined` from a half-finished module; ESM gives a clear TDZ `ReferenceError`. ESM makes the bug visible.
- **`this` at top level:** `undefined` in ESM, `module.exports` in CJS. `__dirname`/`__filename` don't exist in ESM (use `import.meta.url`).

## 🎯 Say this in the interview

> "CommonJS is synchronous and dynamic — `require` is a function call that runs at runtime and hands you a copy of the exports at that moment. ES Modules are static and asynchronous — the engine parses all the imports before executing, builds the dependency graph, and wires up live bindings, which are read-only views onto the exporter's variables, so you see later mutations, not a snapshot. That static graph is exactly what enables tree-shaking, parallel loading, and top-level await. The interop trap is that a CJS file can't `require` an ESM module because ESM is async — you need dynamic `import()`, which is also how I do conditional and lazy loading for code-splitting. And circular dependencies are where they diverge sharply: CJS quietly returns a half-built exports object, while ESM gives a clear temporal-dead-zone error."

## 🔗 Go deeper

- [javascript.info — Modules, introduction](https://javascript.info/modules-intro) — the mental model and browser specifics.
- [MDN — JavaScript modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules) — syntax, `import.meta`, dynamic import.
- [Node.js — Modules: ECMAScript modules](https://nodejs.org/api/esm.html) — the definitive interop rules and `package.json` `exports` map.
