<div align="center">

# Dependency & supply-chain security

<sub>🔒 Security · 🟡 Medium · ⏱ 45m · `#supply-chain`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Your app is only as trustworthy as its `node_modules`, and a modern frontend ships **thousands** of transitive packages you never chose. Supply-chain security is about shrinking that trust: lockfiles, integrity hashes, provenance, and treating every dependency (and its install scripts) as running with your build's full privileges.

---

## 🧠 Mental model

When you `npm install`, you are not adding "a library" — you are executing, at build time and runtime, **code written by hundreds of strangers**, most of whom you'll never audit, plus whatever their `postinstall` scripts decide to run. A single popular utility can pull in a dependency tree of thousands. Your actual trust boundary isn't your code — it's the transitive closure of everything you import.

The mental frame: **there is no "just a dependency."** A compromised package runs with the same privileges as your build server (env vars, tokens, source) and, if it reaches the bundle, in your users' browsers with your origin's privileges. The `event-stream`, `ua-parser-js`, and `node-ipc` incidents weren't exotic — a maintainer account was phished or a maintainer went rogue, and the malicious version auto-installed everywhere within hours.

## ⚙️ How it actually works

The attack surface has several distinct vectors — name them:

| Vector | What happens |
|---|---|
| **Malicious version** | Attacker compromises a maintainer account, publishes a trojaned patch release; semver `^` auto-adopts it. |
| **Typosquatting** | `crossenv` vs `cross-env` — a package one keystroke away exfiltrates env vars. |
| **Dependency confusion** | Attacker publishes a *public* package with your *internal* package's name and a higher version; the resolver prefers it. |
| **Install scripts** | `postinstall` runs arbitrary code on every dev/CI machine, before your app even starts. |
| **Compromised CDN** | Third-party script served from a CDN is swapped (Magecart / British Airways). |

The defenses map onto these:

1. **Lockfiles + `npm ci`** — `package-lock.json`/`yarn.lock` pin *exact* versions with **integrity hashes** (`sha512-…`); `npm ci` installs strictly from the lockfile and fails on drift. This is the single highest-leverage control.
2. **Automated scanning** — `npm audit`, Snyk, Dependabot, GitHub Advisory match your tree against known CVEs and open PRs.
3. **Provenance & signatures** — npm provenance (built via trusted CI, sigstore-signed) proves *where* a package came from.
4. **SRI** for third-party `<script>`/`<link>` — the browser refuses to run a CDN asset whose hash changed.
5. **Scoped/private registries** + reserved names to defeat dependency confusion.
6. **`--ignore-scripts`** / vetting install scripts in CI.

## 💻 Code

```bash
# ✅ Deterministic, lockfile-only install — the CI default. Fails on any drift.
npm ci                       # NOT `npm install` in CI

# ✅ Surface known vulnerabilities; gate the build on severity
npm audit --audit-level=high

# ✅ Neutralise install-script RCE for untrusted trees
npm ci --ignore-scripts
```

```json
// package-lock.json — the integrity hash the client verifies on install
"node_modules/left-pad": {
  "version": "1.3.0",
  "resolved": "https://registry.npmjs.org/left-pad/-/left-pad-1.3.0.tgz",
  "integrity": "sha512-XI5MPzVNApjAyhQzphX8BkmKsKUxD4LdyK24iZeQGinBN9yTQT3bFlCBy/aVx2HrNcqQGsdot8ghrjyrvMCoEA=="
}
```

```html
<!-- ✅ SRI: browser runs the script only if its hash matches -->
<script src="https://cdn.example/lib.js"
        integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8w"
        crossorigin="anonymous"></script>
```

## ⚖️ Trade-offs

- **Pinning vs staying current.** Exact pins give reproducibility but let you rot on unpatched versions; loose `^` ranges auto-adopt fixes *and* auto-adopt compromises. The resolution: **lockfile for determinism + automated update PRs** so upgrades are deliberate and reviewed, not silent.
- **`npm audit` is noisy.** It flags dev-only and unreachable vulns, producing alert fatigue. Triage by *reachability and exploitability*, not raw count — a high-severity CVE in a build-only tool that never ships is lower priority than a medium one in your runtime bundle.
- **Fewer dependencies is itself a control.** Every package is trust and attack surface. The cheapest supply-chain win is often *not adding the dependency* — a 3-line utility rarely justifies a 200-package tree.
- **SRI breaks on legitimate CDN updates.** The hash pins one exact file; auto-updating CDN libraries and SRI are mutually exclusive by design — that's the point.

## 💣 Gotchas interviewers probe

- **"What's dependency confusion?"** Publishing a public package with your *internal* name and a higher version so the resolver prefers it over your private one. The fix is scoped packages and registry configuration — a favourite senior question after the 2021 disclosures.
- **`npm install` vs `npm ci`.** `install` can *mutate* the lockfile and resolve new versions; `ci` installs exactly what's locked and fails on mismatch. Using `install` in CI is a real red flag.
- **Lockfiles carry integrity hashes**, so they're not just version pins — they detect tampered tarballs. Many candidates miss the integrity role.
- **`postinstall` runs before your code.** A malicious dependency owns your CI the moment it's installed, not when it's imported. `--ignore-scripts` for untrusted trees.
- **Transitive is where the risk lives.** You vet your 30 direct deps; the danger is in the 1,500 you've never heard of. Tooling has to walk the whole tree.
- **SRI only covers what you *reference* by URL** — it doesn't help with npm packages bundled into your build; those need lockfile integrity, not SRI.

## 🎯 Say this in the interview

> "My mental model is that `npm install` executes code from thousands of strangers with my build's full privileges, so supply-chain security is about shrinking and pinning that trust. The highest-leverage control is a lockfile with integrity hashes plus `npm ci` in CI, so installs are deterministic and tampered tarballs fail. On top of that I run automated scanning — Dependabot or Snyk — to get reviewed upgrade PRs instead of silent `^`-range adoption, which is exactly how the event-stream and ua-parser incidents spread. I watch specifically for dependency confusion by scoping internal packages, and I disable install scripts for untrusted trees since `postinstall` runs before my app does. For third-party scripts I add SRI so the browser refuses a swapped CDN file. And the cheapest win is often just not adding the dependency."

## 🔗 Go deeper

- [OWASP — Dependency-Check](https://owasp.org/www-project-dependency-check/) — scanning your tree against known-vulnerable components.
- [npm — About package-lock.json](https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json) — how integrity hashes and pinning actually work.
- [npm — Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements) — signed build provenance via sigstore.
- [MDN — Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) — pinning third-party scripts by hash.
