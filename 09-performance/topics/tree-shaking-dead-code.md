<div align="center">

# Tree shaking & dead code

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#bundling`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Tree shaking is **dead-code elimination across the module graph**: the bundler statically traces which exports are actually imported and drops the rest. It only works because **ES modules are statically analysable** — imports/exports are fixed at parse time. Break that (CommonJS, dynamic access, side effects) and the shaker gives up and keeps everything.

---

## 🧠 Mental model

Imagine your entire app as one graph. The bundler starts at the entry, follows every `import`, and marks each **binding** it can reach. Anything unmarked is dead — shake the tree and it falls out.

```
import { debounce } from 'lodash-es';
   │
   ▼  reachable: debounce  ✓   ← kept
       throttle, cloneDeep, ... ✗  ← never imported → shaken out
```

The critical insight: **tree shaking is a static-analysis feature, not a runtime one.** It can only remove what it can *prove* is unused. The moment you introduce something the bundler can't reason about at build time — a conditional require, a property lookup by dynamic key, a module with side effects — it must conservatively assume the code is needed and keep it. So "why is my bundle huge" is usually "something defeated static analysis," not "the shaker is weak."

## ⚙️ How it actually works

Three conditions must all hold, or nothing shakes:

**1. ES module syntax.** `import`/`export` are *static* — bindings are resolved before execution, so the bundler knows the exact dependency graph without running the code. **CommonJS `require()` is dynamic** — it's a function call that can return anything, computed at runtime, so it's fundamentally un-shakeable. This is why you import `lodash-es` (ESM) not `lodash` (CJS): same functions, but only one can be shaken.

**2. No unexpected side effects.** If importing a module *does something* just by being loaded (registers a polyfill, mutates a global, injects CSS), the bundler can't remove it even if you use none of its exports — dropping it would change behaviour. Packages declare `"sideEffects": false` in `package.json` to promise "importing my modules is pure, feel free to drop unused ones." Without that flag, bundlers keep whole modules to be safe.

**3. The minifier finishes the job.** Tree shaking marks unreachable exports; the **minifier** (Terser/esbuild) does the actual DCE — removing unreferenced functions, unreachable branches (`if (false)`), and dead variables. Tree shaking and minification are a **pipeline**, not one step.

The usual leaks:

- **Barrel files** (`export * from './x'`) — re-exporting a whole library through one `index.js`. Importing one symbol can drag the entire barrel in if side-effect analysis is imperfect.
- **`import * as _ from` namespace imports** used dynamically — the bundler can't tell which members you touch.
- **Transpiling ESM to CJS** before bundling (old Babel config) — you destroy the static structure the shaker needs. Ship ESM to the bundler.

## 💻 Code

```js
// ❌ CommonJS default import — pulls ALL of lodash (~70KB). Un-shakeable.
import _ from 'lodash';
_.debounce(fn, 200);

// ❌ Named import from a CJS build — still not shakeable; the whole lib loads.
import { debounce } from 'lodash';

// ✅ ESM build + named import — only `debounce` and its deps survive.
import debounce from 'lodash-es/debounce';   // or from 'lodash-es'
```

```jsonc
// package.json — tell bundlers your modules are pure so unused ones drop.
{
  "sideEffects": false,
  // …unless some files genuinely have side effects (e.g. global CSS):
  "sideEffects": ["*.css", "./src/polyfills.js"]
}
```

```js
// ❌ Dynamic member access defeats analysis — bundler keeps every method.
import * as utils from './utils';
utils[methodName]();          // which one? unknowable at build time → keep all

// ✅ Static named imports — only what's referenced is kept.
import { formatDate } from './utils';
formatDate(now);
```

## ⚖️ Trade-offs

- **Tree shaking is best-effort, not guaranteed.** It only removes what it can *prove* dead. Treat it as a safety net over disciplined imports, not a licence to import whole libraries and hope. If you rely on it and it silently fails, you ship the lot.
- **`sideEffects: false` is a promise you must keep.** Flag it wrong and the bundler drops a module that actually mattered — a global registration vanishes, and you get a heisenbug that only appears in the production build. Audit before you set it.
- **Not every dependency ships an ESM build.** For CJS-only libraries, tree shaking simply doesn't apply — reach for a lighter alternative (`date-fns` over `moment`, per-method imports) or accept the cost.
- **Diminishing returns on small libs.** Shaking a 4 KB utility isn't worth restructuring imports; spend the effort on the 200 KB dependency the analyzer flags.

## 💣 Gotchas interviewers probe

- **Tree shaking requires ESM.** "Why doesn't lodash tree-shake?" → because you imported the CommonJS build. `import` from `lodash-es`. This is *the* canonical question.
- **Tree shaking ≠ minification.** Tree shaking marks unused *exports*; the minifier does the DCE. Separate steps in a pipeline — conflating them is a knowledge gap.
- **Side effects block it.** A module that mutates globals or injects CSS on import can't be dropped even if unused. `"sideEffects"` in `package.json` is how you opt in to aggressive shaking.
- **Barrel files leak.** `export *` re-exports can pull far more than you imported. A leading cause of "I imported one icon and got the whole set."
- **`process.env.NODE_ENV` gating** only removes dev code if the bundler statically replaces the value (`DefinePlugin`) *before* minification — otherwise the branch survives. Dead-code elimination needs a literal, not a runtime lookup.
- **Verify, don't assume.** Always confirm with a bundle analyzer that the code actually left — tree shaking failures are silent.

## 🎯 Say this in the interview

> "Tree shaking is dead-code elimination across the module graph — the bundler statically traces which exports are reachable from the entry and drops the rest. The crucial constraint is that it only works on ES modules, because `import`/`export` are statically analysable; CommonJS `require` is a runtime function call, so it's fundamentally un-shakeable. That's why the classic fix is importing from `lodash-es` instead of `lodash`. Two other things gate it: side effects — if importing a module does something globally, the bundler keeps it unless the package declares `sideEffects: false` — and the fact that tree shaking only *marks* dead code; the minifier does the actual removal, so they're a pipeline. The failures are almost always static-analysis defeats: barrel files, namespace imports with dynamic access, or ESM transpiled to CJS before bundling. And because it fails silently, I always verify with a bundle analyzer that the code actually left."

## 🔗 Go deeper

- [web.dev — Reduce JavaScript payloads with tree shaking](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking) — the canonical walkthrough.
- [MDN — Tree shaking](https://developer.mozilla.org/en-US/docs/Glossary/Tree_shaking) — the concept and its ESM dependency.
- [webpack — Tree Shaking & sideEffects](https://webpack.js.org/guides/tree-shaking/) — the `sideEffects` flag semantics in detail.
- [MDN — import (static analysis)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import) — why ESM is statically analysable.
