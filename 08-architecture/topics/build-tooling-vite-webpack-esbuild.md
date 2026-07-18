<div align="center">

# Build tooling (Vite/Webpack/esbuild)

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 1h · `#bundling` `#tooling`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A bundler exists to solve two different problems that people conflate: **dev-time feedback loop** and **production output**. Webpack bundles everything for both; Vite serves unbundled native ESM in dev (instant) and bundles with Rollup for prod; esbuild/SWC are the Go/Rust compilers underneath that made "instant" possible by replacing JS-based transforms.

---

## 🧠 Mental model

There are three distinct jobs hiding under "build tooling", and every tool is really a bet on how to split them:

| Job | What it does | Who's fastest |
|---|---|---|
| **Transform** | TS/JSX → JS, one file at a time | esbuild, SWC (native code) |
| **Dev serve** | Serve modules to the browser while you edit | Vite (native ESM, no bundle) |
| **Bundle** | Tree-shake + chunk + minify for prod | Rollup, webpack, esbuild |

The historical insight is that **the browser now understands ESM natively** (`<script type="module">`). In dev, you don't *need* to bundle at all — the browser can request modules on demand. Webpack predates that reality, so it bundles your entire app before serving the first byte; cold start scales with app size. Vite's bet: skip the bundle in dev, let the browser pull modules, and only pay bundling cost in production where output quality matters.

The reason Vite still bundles for prod: unbundled ESM means hundreds of tiny HTTP requests and no cross-module tree-shaking — fine for one dev, catastrophic for real users on real networks.

## ⚙️ How it actually works

**Vite dev = native ESM + esbuild pre-bundling.** On startup Vite doesn't crawl your whole app. It serves `index.html`, the browser requests `main.js`, which imports `./App.jsx`, which the browser then requests — lazy, on demand. Vite transforms each file *as it's requested* using esbuild (Go, ~20–100× faster than Babel). Two optimizations make this viable:

- **Dependency pre-bundling.** `node_modules` packages (React, lodash) are bundled *once* with esbuild into a single ESM file and cached, because a library like lodash-es can be 600 internal modules — 600 requests. Your own source stays unbundled.
- **HTTP caching + HMR over ESM.** Edit one file and only that module is re-fetched and hot-swapped. HMR time is roughly constant regardless of app size — this is the headline feature.

**Webpack = full dependency graph, always.** It builds a graph from the entry, runs every file through loaders (babel-loader, ts-loader), applies plugins, and emits chunks. Powerful and universal, but cold start and HMR both scale with graph size. Persistent caching (webpack 5) helps a lot but the model is fundamentally "bundle first, serve second."

**esbuild/SWC are compilers, not full bundlers you'd ship prod with — usually.** esbuild is blazing but its tree-shaking and code-splitting are less mature than Rollup's, and its plugin API is narrower. That's exactly why Vite uses esbuild for *transforms* and Rollup for the *prod bundle* — best of both. (Rolldown, a Rust Rollup, is collapsing that split.)

## 💻 Code

```js
// vite.config.js — the prod bundle is Rollup; manualChunks is where you earn caching wins
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        // Split vendor from app so a code change doesn't bust the vendor cache
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor';
        },
      },
    },
  },
  optimizeDeps: {
    // Force-include a dep that isn't statically discoverable (e.g. imported dynamically)
    include: ['some-cjs-package'],
  },
});
```

```js
// Route-level code splitting — the single biggest bundle win, works in any bundler
const Settings = lazy(() => import('./routes/Settings')); // its own chunk, loaded on demand
```

```js
// esbuild used directly as a build script — fast, but you own the config for splitting/CSS
require('esbuild').build({
  entryPoints: ['src/main.tsx'],
  bundle: true,
  minify: true,
  splitting: true,     // requires format: 'esm'
  format: 'esm',
  outdir: 'dist',
}).catch(() => process.exit(1));
```

## ⚖️ Trade-offs

- **Vite's dev/prod asymmetry is a feature and a footgun.** Dev uses esbuild + native ESM; prod uses Rollup. Behaviour can differ — a module that resolves in dev's lenient ESM can break in the Rollup bundle. Test the *production build*, not just the dev server.
- **Webpack's maturity still wins on the long tail.** Obscure loaders, Module Federation, complex legacy setups — webpack's ecosystem is unmatched. If you need Module Federation at scale, that's still webpack's home turf (though Vite plugins exist).
- **esbuild alone: pick it for libraries and simple apps, not complex SPAs.** No mature CSS-modules story, weaker tree-shaking, minimal plugin ecosystem. Great as a *transform engine*, riskier as your *only* bundler.
- **"Fast dev" ≠ "fast build."** Vite dev start is instant, but its *production* build is a normal Rollup build — not dramatically faster than webpack. Don't promise stakeholders faster CI just because dev feels instant.

## 💣 Gotchas interviewers probe

- **"Why is Vite fast in dev?"** The senior answer is *not* "it uses esbuild" — it's "it doesn't bundle in dev; the browser loads native ESM on demand, so cold start is O(1) instead of O(app size)." esbuild is the transform layer, not the reason.
- **Vite still bundles for production.** Candidates often think Vite ships unbundled ESM to users. It doesn't — unbundled means a request storm and no tree-shaking. Rollup does the prod bundle.
- **Tree-shaking needs static ESM.** `import()` of a computed path, CommonJS `require`, and re-exports with side effects all defeat it. `"sideEffects": false` in package.json is how libraries tell the bundler it's safe to drop unused exports.
- **Dependency pre-bundling is why CJS deps work in Vite.** The browser can't `import` CommonJS; esbuild converts CJS `node_modules` to ESM once at startup. A dep that's *dynamically* required may need `optimizeDeps.include`.
- **Code splitting is a bundle-quality question, not a speed question.** The real prod win is `import()` at route boundaries so users download less, and stable `manualChunks` so a one-line change doesn't invalidate the whole cached vendor bundle.

## 🎯 Say this in the interview

> "I separate the two problems build tooling solves: dev feedback loop and production output. Webpack bundles the whole graph for both, so its cold start and HMR scale with app size. Vite's insight is that the browser understands native ESM now, so in dev it doesn't bundle at all — it serves modules on demand and transforms each with esbuild, which is why cold start is basically instant regardless of app size. The nuance I'd flag is that Vite still bundles for production with Rollup, because shipping unbundled ESM to real users means hundreds of requests and no tree-shaking. esbuild and SWC are the native-code compilers underneath that replaced Babel for transforms. The trap I watch for is the dev/prod asymmetry — dev and prod use different engines, so I always test the actual production build, and I lean on route-level `import()` and stable vendor chunks because that's where the real user-facing wins are."

## 🔗 Go deeper

- [Vite — Why Vite](https://vitejs.dev/guide/why.html) — the native-ESM-in-dev rationale, straight from the source.
- [esbuild — Why is it fast?](https://esbuild.github.io/faq/#why-is-esbuild-fast) — the Go-vs-JS, parallelism argument.
- [webpack — Concepts](https://webpack.js.org/concepts/) — the entry/loader/plugin/output model, canonical.
- [web.dev — Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting) — why splitting matters for real users.
