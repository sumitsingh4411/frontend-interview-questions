<div align="center">

# Project references & monorepos

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 1h · `#monorepo` `#config`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Project references split one giant `tsc` invocation into a **graph of independently-buildable units**, each emitting a `.d.ts` + `.tsbuildinfo` so downstream packages typecheck against *compiled declarations* instead of re-parsing source — that's what makes incremental, cache-friendly builds possible across a monorepo.

---

## 🧠 Mental model

Without references, `tsc` is monolithic: it loads every file reachable from your `include`, holds the whole program in memory, and re-checks all of it on every run. In a 40-package monorepo that's fatal — one edit re-checks the world.

Project references turn that single program into a **DAG of small programs**. Each leaf compiles itself, writes a declaration file, and hands *only that `.d.ts`* to its dependents. The mental shift: **a referenced project is consumed as a published library, not as source.** Package B doesn't see A's implementation — it sees A's *types*, exactly as if A were an npm dependency you'd already built.

```
   @app/ui ───► @app/core ───► @app/utils
      │                           ▲
      └───────────────────────────┘
   each node: tsc -b → emits .d.ts + .tsbuildinfo (its build fingerprint)
   tsc walks the graph in topological order, skipping nodes whose inputs are unchanged
```

That `.tsbuildinfo` file is the whole trick: it records the hash/timestamp of every input. On the next `tsc -b`, unchanged nodes are skipped entirely.

## ⚙️ How it actually works

Three things must line up, and interviewers probe each:

1. **`composite: true`** on every referenced project. This is the enabler flag — it forces `declaration: true`, requires all input files to be covered by `include`/`files`, and makes the project emit `.tsbuildinfo`. Without it, `tsc -b` refuses to treat the project as a buildable node.

2. **`references: [{ path: "../core" }]`** in the *consumer's* tsconfig. This is a build-graph edge, and it is **separate from module resolution.** A reference tells `tsc -b` "build core first and read its declarations"; it does **not** tell `import` where to find `@app/core`. You still need `paths` (or workspace symlinks) so the module specifier resolves.

3. **`tsc -b` (build mode), not plain `tsc`.** Build mode is the orchestrator that reads the reference graph, topologically sorts it, checks each `.tsbuildinfo`, and rebuilds only stale nodes. Plain `tsc` ignores `references` for orchestration.

The subtle, senior-level detail: because dependents read `.d.ts`, **your build is only as fresh as your declarations.** If A's `.d.ts` is stale, B typechecks against a lie. That's why `tsc -b --clean` and correct dependency ordering matter, and why editor "go to definition" landing in a `.d.ts` (not the source) is *expected* behaviour, not a bug.

## 💻 Code

Root solution file — references only, no files of its own:

```jsonc
// tsconfig.json (repo root) — the "solution" that builds everything
{
  "files": [],
  "references": [
    { "path": "packages/utils" },
    { "path": "packages/core" },
    { "path": "packages/ui" }
  ]
}
```

A shared base plus a leaf package:

```jsonc
// tsconfig.base.json — one source of truth for compiler options
{
  "compilerOptions": {
    "composite": true,          // ← required for any referenced project
    "declaration": true,        // implied by composite, but be explicit
    "declarationMap": true,     // lets editors jump to SOURCE, not .d.ts
    "incremental": true,
    "strict": true
  }
}
```

```jsonc
// packages/core/tsconfig.json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "paths": { "@app/utils": ["../utils/src"] } // module RESOLUTION (separate concern)
  },
  "include": ["src"],
  "references": [{ "path": "../utils" }]          // build GRAPH edge
}
```

```bash
tsc -b                    # build the whole graph, skipping unchanged nodes
tsc -b --watch            # incremental watch across all packages
tsc -b --clean            # delete outputs + .tsbuildinfo
tsc -b --verbose          # see exactly which projects were up-to-date vs rebuilt
```

## ⚖️ Trade-offs

- **You get real incremental builds and enforced boundaries** — package B *cannot* import A's internals, only its public `.d.ts`. That architectural pressure is often worth more than the speed.
- **The cost is config sprawl and a hard invariant:** every referenced project needs `composite`, every edge must be declared in two places conceptually (references for build, paths/symlinks for resolution), and forgetting one produces baffling "cannot find module" or "referenced project may not disable declaration emit" errors.
- **When NOT to use it:** a single app with no shareable libraries gains nothing but ceremony — plain `incremental: true` already gives you `.tsbuildinfo` caching. And if you use a bundler (Vite/esbuild/tsup) that transpiles per-file and a separate `tsc --noEmit` for checking, references buy you far less; many modern monorepos run `tsc -b` purely as a *typecheck* orchestrator and let the bundler emit JS.
- **`declarationMap` is non-negotiable in practice** — without it, cmd-click lands you in generated `.d.ts` files and refactoring across packages becomes miserable.

## 💣 Gotchas interviewers probe

- **References ≠ module resolution.** The most common misconception. `references` drives `tsc -b` ordering; it does nothing for `import`. You still need `paths`, `workspaces` symlinks, or published packages for the specifier to resolve. State this and you sound like you've actually run a monorepo.
- **`composite` forces full `include` coverage.** Every file must be matched by `include`/`files` — a stray script outside `src` throws "file is not listed within the file list of project." Bites everyone once.
- **Dependents read `.d.ts`, not source.** So a bug fix in A that doesn't change its *types* still needs A rebuilt before B sees consistent behaviour at runtime — types can be fresh while emitted JS is stale if you skip the build.
- **`isolatedModules` matters for bundlers.** Per-file transpilers can't do cross-file type elision, so `export type` / `import type` become mandatory to avoid emitting phantom runtime imports.
- **Circular references are rejected.** The graph must be a DAG; `tsc -b` errors on cycles. Untangling them is a real architecture task, not a config tweak.
- **`tsc -b` vs `tsc`** — running plain `tsc` in a referenced project "works" but ignores the graph and can silently typecheck against stale declarations.

## 🎯 Say this in the interview

> "Project references let `tsc` treat a monorepo as a DAG of independently-buildable projects instead of one monolithic program. Each referenced project sets `composite: true`, which forces declaration emit and a `.tsbuildinfo` fingerprint, and its dependents consume the emitted `.d.ts` rather than re-parsing source — so `tsc -b` can topologically sort the graph and skip any node whose inputs haven't changed. The key thing I always call out is that a `reference` is a *build-graph* edge, not module resolution — it tells build mode what order to compile in, but you still need `paths` or workspace symlinks for `import` to resolve. It also enforces real boundaries: a package can only see another's public declarations, never its internals. I'd pair it with `declarationMap` so editors jump to source, and in a bundler-based setup I'd often run `tsc -b` purely as a typecheck orchestrator and let esbuild emit the JS."

## 🔗 Go deeper

- [TS Handbook — Project References](https://www.typescriptlang.org/docs/handbook/project-references.html) — the canonical spec for `composite`, `references`, and build mode.
- [TS Handbook — `tsc -b` build mode](https://www.typescriptlang.org/docs/handbook/project-references.html#build-mode-for-typescript) — how the orchestrator sorts and caches the graph.
- [TSConfig reference — `composite`](https://www.typescriptlang.org/tsconfig#composite) — exactly what the flag implies and requires.
- [TSConfig reference — `declarationMap`](https://www.typescriptlang.org/tsconfig#declarationMap) — why cross-package "go to definition" needs it.
