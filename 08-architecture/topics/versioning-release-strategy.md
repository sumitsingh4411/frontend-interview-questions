<div align="center">

# Versioning & release strategy

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#tooling`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Semver is a **promise about breakage**, not a changelog ritual: the number you bump encodes what consumers must do to upgrade, and the whole game in a monorepo is deciding *which packages* changed, *how their version should move*, and *what to tell humans* — which is exactly the problem Changesets automates.

---

## 🧠 Mental model

A version number is a message to your consumers about **the cost of upgrading**. `MAJOR.MINOR.PATCH` means: major = "you must change your code", minor = "new stuff, safe to take", patch = "bug fix, safe to take". That's the entire contract. Everything else — release notes, git tags, npm publish — is plumbing around communicating that one decision honestly.

The failure mode teams fall into is decoupling the *decision* ("is this breaking?") from the *moment* the code is written, and pushing it to release time when nobody remembers. The insight behind Changesets is to **capture intent at PR time**: the author who wrote the change declares "this is a minor bump to `@acme/button`, here's why," as a markdown file committed alongside the diff. Release becomes a mechanical aggregation of those declarations, not a judgment call under deadline.

The second big axis is **fixed vs independent versioning**. Do all packages share one version (Angular, Next.js style — everything is `15.2.0`), or does each move on its own (most component libraries)? Fixed is simpler to reason about and communicate; independent avoids forcing a version bump on 200 untouched packages because one changed.

## ⚙️ How it actually works

**Changesets flow, concretely:**

1. A contributor runs `npx changeset`, picks which packages changed and the bump type, and writes a human summary. This produces a file in `.changeset/`.
2. Those files accumulate on `main` across many PRs — an *unreleased* pile of intent.
3. At release, `changeset version` consumes them: it computes final version numbers, **bumps internal dependents automatically** (if `button` goes major and `card` depends on it, `card` gets bumped too), writes `CHANGELOG.md`, and deletes the changeset files.
4. `changeset publish` pushes to npm and tags git.

The automatic dependent-bumping is the part people underrate. In a monorepo, a breaking change ripples: everything that depends on the changed package must be re-released so the dependency graph stays coherent. Doing that by hand is where mistakes live.

**Release channels** decouple "published" from "recommended." `npm publish --tag next` puts a build on the `next` dist-tag so `npm install pkg` (which resolves `latest`) is untouched — early adopters opt in with `pkg@next`. Canary/nightly builds (`0.0.0-canary-<sha>`) let you dogfood a specific commit without minting a real version.

## 💻 Code

A changeset file is just markdown with frontmatter — reviewable in the PR:

```markdown
---
"@acme/button": minor
"@acme/theme": patch
---

Add `variant="ghost"` to Button. Theme gets a patch for the new token.
```

Automating the release with the Changesets GitHub Action — the standard setup:

```yaml
# .github/workflows/release.yml
name: Release
on: { push: { branches: [main] } }
jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, registry-url: 'https://registry.npmjs.org' }
      - run: npm ci
      - uses: changesets/action@v1
        with:
          # If changesets exist → open a "Version Packages" PR.
          # If that PR is merged (no changesets left) → publish.
          publish: npm run release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

The elegant bit: the action opens a **"Version Packages" PR** that shows the exact version bumps and changelog *before* anything publishes. Release becomes a reviewable, mergeable event — not a magic incantation someone runs locally.

## ⚖️ Trade-offs

- **Fixed versioning trades precision for simplicity.** One version for everything is trivial to communicate ("we're on v15") but forces phantom releases and makes changelogs noisy. Independent versioning is honest per-package but you lose the single number humans anchor to.
- **Automating publish removes human judgment — which is the point and the risk.** A mis-declared changeset ships a breaking change as a patch, and consumers' `^` ranges silently pull it. The safeguard is the review gate on the Version Packages PR, plus honest changeset authoring culture.
- **Don't hand-edit versions in `package.json`.** It's the single biggest source of a broken dependency graph. Let the tool own the numbers.
- **Pre-1.0 semver is a footgun.** In `0.x`, minor is the *breaking* slot (`^0.3.0` won't take `0.4.0`). Consumers who don't know this get surprised either way.

## 💣 Gotchas interviewers probe

- **"What does a major bump actually cost?"** It costs your *consumers* a migration. That's why you batch breaking changes and ship codemods — not because the number is scary, but because every human downstream pays.
- **Caret ranges + a mis-versioned patch = silent breakage.** `^1.2.0` auto-takes `1.9.0`. If someone ships a breaking change as a minor/patch, every consumer breaks on their next `npm install`. Semver is only as safe as the discipline behind the bump.
- **Peer dependencies don't auto-bump.** Changesets bumps *dependencies*; peer deps (like `react`) are a manual policy decision — widening a peer range is itself a breaking change for some consumers.
- **Lockfiles vs ranges.** Apps commit a lockfile for reproducibility; libraries publish *ranges* so they compose. Publishing a library with pinned deps causes duplicate/conflicting installs downstream.
- **"Just tag the git commit" isn't a release strategy** — it says nothing about breakage, doesn't update dependents, and doesn't communicate to npm consumers.

## 🎯 Say this in the interview

> "I treat the version number as a promise about upgrade cost — major means the consumer changes code, minor and patch are safe to take — so the real work is deciding *is this breaking* and doing it honestly. In a monorepo I use Changesets because it captures that decision at PR time: the author declares which packages changed and the bump type in a committed markdown file, with a human summary. At release, that aggregates into version bumps — including automatically bumping internal dependents so the graph stays coherent — a generated changelog, and a reviewable 'Version Packages' PR before anything publishes. I lean toward independent versioning for a component library so I'm not forcing phantom releases, and I use dist-tags like `next` to ship pre-releases without touching what `latest` resolves to. The thing I stay paranoid about is caret ranges: a breaking change mislabeled as a patch silently breaks every consumer on their next install."

## 🔗 Go deeper

- [Changesets](https://github.com/changesets/changesets) — the intent-at-PR-time workflow and the automated dependent-bumping.
- [Semantic Versioning 2.0.0](https://semver.org/) — the exact contract each number encodes, including the 0.x rules.
- [npm — dist-tags](https://docs.npmjs.com/cli/v10/commands/npm-dist-tag) — how `latest`/`next` channels decouple published from recommended.
- [pnpm — Workspaces](https://pnpm.io/workspaces) — internal `workspace:` protocol that Changesets resolves at publish time.
