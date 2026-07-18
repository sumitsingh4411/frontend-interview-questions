<div align="center">

# Subresource Integrity (SRI)

<sub>🔒 Security · 🟡 Medium · ⏱ 30m · `#sri` `#headers`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — SRI puts a cryptographic hash of a `<script>`/`<link>` file in an `integrity` attribute; the browser downloads the file, hashes it, and **refuses to run it if the hashes don't match** — so a compromised CDN can't silently swap your code for malware.

---

## 🧠 Mental model

When you load `https://cdn.example.com/lib.js`, you are trusting that CDN — and everyone who can push to it, and everyone who can MITM the connection — with **full execution rights in your origin**. SRI flips that trust model from "trust the source" to "trust the *bytes*". You commit to an exact hash at build time; the browser verifies the delivered file matches before executing. If the CDN is breached and serves a tampered file, verification fails and the resource is blocked.

Think of `integrity` as a checksum with teeth: not "did this download correctly" (that's TCP's job) but "is this the *specific version I vetted*, byte for byte."

## ⚙️ How it actually works

The value is `<algorithm>-<base64(hash-of-raw-bytes)>`. Allowed algorithms are `sha256`, `sha384`, `sha512`. Use **sha384 or sha512** — sha256 is fine cryptographically but the spec and tooling default to sha384.

```
integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux..."
```

The browser hashes the **response body as received** (after decompression) and compares. Key mechanics interviewers probe:

- **It applies to the raw bytes.** Change one character, whitespace, or a version bump, and the hash changes — SRI pins you to an *exact* file. This is a feature (immutability) and a maintenance cost (every update needs a new hash).
- **Cross-origin resources must be CORS-enabled.** A cross-origin script with `integrity` **also needs `crossorigin="anonymous"`**. Without CORS, the browser can't read the body to hash it (opaque response), so it refuses to load rather than leak whether the hash matched. This is the #1 gotcha.
- **Multiple hashes = "any of these is acceptable."** Space-separate them to support several valid versions during a rollout. The browser accepts the file if it matches *any* listed hash (strongest algorithm wins).
- **Failure mode:** a mismatch is a network error — the resource is *not applied*, and an `error` event fires. There is no "run it anyway." SRI is fail-closed.

SRI only covers `<script>` and `<link rel="stylesheet">` (and `<link rel="preload">`/`modulepreload`). It does **not** cover images, fonts loaded via CSS, or `import()` of a bare URL without a matching preload.

## 💻 Code

```html
<!-- ✅ Third-party script, pinned + CORS so the browser can verify it -->
<script
  src="https://cdn.example.com/framework@3.2.1/dist.js"
  integrity="sha384-oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/uxy9rx7HNQlGYl1kPzQho1wx4JwY8w"
  crossorigin="anonymous"
></script>

<!-- ❌ Cross-origin with integrity but NO crossorigin → silently blocked -->
<script src="https://cdn.example.com/x.js" integrity="sha384-…"></script>
```

Generate the hash from the exact file you're shipping:

```bash
# The canonical one-liner — hash raw bytes, base64-encode, prefix the algorithm
cat dist.js | openssl dgst -sha384 -binary | openssl base64 -A
# → oqVuAfXRKap7fdgcCY5uykM6+R9GqQ8K/ux...
```

Most bundlers automate this — Webpack's `SubresourceIntegrityPlugin`, Vite plugins — injecting fresh hashes at build so you never hand-maintain them.

## ⚖️ Trade-offs

- **When NOT to use it:** on resources you serve from your **own origin behind good deploy hygiene** — SRI adds friction without much gain there, since an attacker who can rewrite your own files can also rewrite the `integrity` attribute. Its value is squarely for **third-party/CDN** code you don't control.
- **Auto-updating scripts become impossible to pin.** Anything meant to change silently — analytics snippets that self-update, `latest` tags, ad tags — is *incompatible* with SRI by design. Either pin a version (and accept manual updates) or don't use SRI on it.
- **Availability risk:** if the CDN serves a legitimately different file (recompression, a byte-level change) your app breaks hard. Pair SRI with a local fallback for critical scripts, or self-host.

## 💣 Gotchas interviewers probe

- **"Does SRI protect against a compromised *first-party* server?"** Largely no — the attacker rewrites both the file and its hash. SRI's threat model is a compromised *third party* while your HTML stays intact.
- **Missing `crossorigin` on a cross-origin resource** → the response is opaque, unhashable, and *blocked*. Candidates forget this constantly.
- **SRI is not a substitute for CSP.** They compose: CSP `require-sri-for` (limited support) or a strict `script-src` controls *what may load*; SRI controls *whether the loaded bytes are authentic*.
- **Dynamic `import()`** doesn't carry an `integrity` attribute directly — you need an import map with integrity (newer) or a preload with matching integrity.
- **A CDN that recompresses or edits responses** (some do minification on the fly) will break SRI even with no malicious intent.

## 🎯 Say this in the interview

> "SRI is about shifting trust from the source to the exact bytes. I put a sha384 hash of a third-party file in the `integrity` attribute; the browser hashes what it downloads and blocks execution on any mismatch, so a compromised CDN can't inject malware into my origin. The detail people miss is CORS — a cross-origin script needs `crossorigin=\"anonymous\"` too, otherwise the response is opaque, the browser can't hash it, and it's blocked. I'd scope SRI to code I don't control — vendored CDN libraries — because for first-party files an attacker who can change the file can also change the hash. And I'd flag that it pins you to an exact version: anything designed to auto-update is fundamentally incompatible, so I generate hashes at build time with my bundler."

## 🔗 Go deeper

- [MDN — Subresource Integrity](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) — the canonical reference, including the CORS requirement.
- [W3C — SRI specification](https://www.w3.org/TR/SRI/) — the precise algorithm and the "strongest metadata wins" rule.
- [web.dev — Subresource Integrity](https://web.dev/articles/subresource-integrity) — practical guidance and generation tooling.
