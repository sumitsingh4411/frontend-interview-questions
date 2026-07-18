<div align="center">

# Monorepos (Nx / Turborepo)

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1.5h · `#monorepo` `#scale`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A monorepo is many projects in one repo sharing one dependency graph and one toolchain; tools like Nx and Turborepo make it *fast* by understanding that graph — building and testing **only what a change actually affects**, and caching task outputs so work is never repeated across machines.

---

## 🧠 Mental model

A monorepo is not "put everything in one folder" — that's just a big repo, and it gets slow and tangled fast. The thing that makes a monorepo *work* is a **task graph** the tooling can reason about. Every package declares its dependencies; the tool derives the graph; and from the graph it answers two questions that define monorepo performance:

1. **What is affected by this change?** Only rebuild/retest the packages downstream of what you touched. A change to `ui/button` reruns `button`'s tests and its dependents — not the other 200 packages.
2. **Have I done this exact task before?** Task outputs are cached by a hash of their inputs (source, deps, config, env). Unchanged inputs ⇒ cache hit ⇒ the task is *replayed*, not rerun — locally and, via **remote cache**, across the whole team and CI.

That's the whole pitch: a monorepo trades the isolation of many repos for a single source of truth and atomic cross-project changes, and the tooling exists to stop that trade from tanking your build times. **The value is atomic changes; the tooling is what keeps it fast.**

## ⚙️ How it actually works

- **Workspace + graph.** A workspace tool (pnpm/yarn/npm workspaces) links local packages so `import '@acme/ui'` resolves to the sibling folder. Nx/Turborepo read `package.json` deps (and, for Nx, import statements) to build the project graph.
- **Affected computation.** `nx affected` / `turbo run --filter=...[HEAD^]` diff against a base commit, map changed files to packages, and walk the graph to find every dependent. CI then runs tasks for that set only — the single biggest CI-time win at scale.
- **Content-addressed caching.** Each task's inputs are hashed; the output (files + terminal log) is stored under that hash. Same hash later ⇒ restore outputs instantly. **Remote cache** shares this store, so if CI already built `main`, your machine downloads the result instead of rebuilding.
- **Task orchestration.** The tool topologically sorts and parallelises: `ui` builds before `web` that depends on it, independent packages build concurrently, all cores saturated.

**Nx vs Turborepo, honestly:** Turborepo is deliberately minimal — a fast task runner with caching, config in `turbo.json`, low buy-in, framework-agnostic. Nx is a *platform* — the same caching plus code generators, module-boundary lint enforcement, dependency-graph visualisation, and plugins. Turborepo when you want speed with little ceremony; Nx when you want structure and governance across many teams and are willing to adopt its opinions.

## 💻 Code

```jsonc
// turbo.json — declare the pipeline; the tool infers order + caches outputs
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],        // build my deps first (^ = upstream)
      "outputs": ["dist/**"]          // what to cache; wrong globs = silent cache misses
    },
    "test": { "dependsOn": ["build"], "outputs": ["coverage/**"] },
    "lint": {},
    "dev":  { "cache": false, "persistent": true } // long-running, never cache
  }
}
```

```bash
# Only build/test what a PR actually changed (vs the merge base)
turbo run build test --filter='...[origin/main]'

# Nx equivalent, plus enforce that 'feature' libs can't import each other
nx affected -t build test --base=origin/main
# eslint: @nx/enforce-module-boundaries reads tags to police the graph
```

## ⚖️ Trade-offs

- **When NOT to use it:** a couple of unrelated apps with different release cadences and no shared code gain little and inherit the tooling tax. Monorepos shine when projects **share code and want to change it atomically**; forcing unrelated things together just couples their CI and their dependency upgrades.
- **One dependency version, like it or not.** A monorepo pushes toward a single version of React/TypeScript across everything. That's a feature (no version drift) and a curse (one app can't lag on an upgrade) — a real organisational cost, not just technical.
- **`git` and CI at scale need investment.** Huge histories, sparse checkouts, cache infrastructure, and CODEOWNERS become their own project. Below a certain size that's overhead; above it, it's what keeps you sane.
- **Cache correctness is on you.** Mis-declared `outputs` or unhashed inputs (env vars!) produce *wrong* cache hits — the worst failure mode, because it's silent.

## 💣 Gotchas interviewers probe

- **"Monorepo vs monolith"** — orthogonal. A monorepo can hold many independently deployed services; a polyrepo can hold one monolith. Repo layout ≠ deployment architecture. Conflating them is a junior tell.
- **Caching is only as correct as its input hash.** Forget to declare an env var or a config file as an input and you get stale/wrong cache hits across machines. Interviewers probe whether you understand *why* a cache hit is safe.
- **Affected depends on a correct graph.** Dynamic imports, string-built paths, or `require` the analyser can't see mean a real dependency is invisible — the tool skips a package it should have rebuilt, and you ship a break.
- **Remote cache is the real ROI.** Local caching helps one dev; sharing the cache across the whole team and CI is where hours disappear. If a candidate only mentions local caching, they've missed the point.
- **Boundaries aren't automatic.** Nothing stops `app-a` importing `app-b`'s internals unless you *enforce* module boundaries (Nx tags / lint rules). Without that, a monorepo rots into a big ball of mud faster than polyrepos would.

## 🎯 Say this in the interview

> "A monorepo's real value is atomic cross-project changes and one source of truth — you can change a shared library and every consumer in the same PR. The reason it doesn't collapse under its own weight is tooling that understands the task graph: Nx and Turborepo compute what's *affected* by a change so CI only builds and tests the downstream packages, and they cache task outputs by a hash of their inputs so unchanged work is replayed instead of rerun. The remote cache is where the big wins are — sharing that cache across the team and CI, so nobody rebuilds what CI already built. I'd pick Turborepo when I want speed with minimal buy-in and Nx when I need generators and enforced module boundaries across many teams. The thing I'm most careful about is cache-input correctness — an undeclared env var gives you a silent wrong cache hit, which is worse than a slow build."

## 🔗 Go deeper

- [Turborepo docs](https://turborepo.com/docs) — pipelines, filtering, and remote caching explained by the tool itself.
- [Nx docs](https://nx.dev/getting-started/intro) — affected commands, module boundaries, and the plugin platform.
- [monorepo.tools](https://monorepo.tools/) — a neutral comparison of monorepo tooling and the concepts behind them.
- [Google's "Why Google Stores Billions of Lines of Code in a Single Repository"](https://cacm.acm.org/research/why-google-stores-billions-of-lines-of-code-in-a-single-repository/) — the definitive case for monorepos at extreme scale.
