<div align="center">

# Security headers (HSTS, X-Frame-Options…)

<sub>🔒 Security · 🟡 Medium · ⏱ 45m · `#headers`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Security headers are cheap, server-side instructions that shrink the browser's attack surface: force HTTPS forever (HSTS), forbid framing (frame-ancestors), stop MIME-sniffing (nosniff), and control what leaks in the `Referer`. None fix a vulnerability — each closes a *class* of exploitation.

---

## 🧠 Mental model

Think of response headers as a **hardening checklist the browser enforces for you.** Your app code decides *what* to serve; these headers decide *how strictly the browser treats it.* They're defense in depth: individually modest, collectively they eliminate whole categories of attack — protocol downgrade, clickjacking, content-type confusion, referrer leakage — for the price of a config change.

The senior instinct is knowing **which header maps to which threat**, that several old headers are now superseded, and that a header set wrong is worse than absent because it creates false confidence.

## ⚙️ How it actually works

The set worth knowing cold:

| Header | Threat it addresses | Good value |
|---|---|---|
| `Strict-Transport-Security` | HTTPS-strip / downgrade (sslstrip) | `max-age=63072000; includeSubDomains; preload` |
| `X-Content-Type-Options` | MIME sniffing → stored XSS | `nosniff` |
| `Content-Security-Policy: frame-ancestors` | Clickjacking | `frame-ancestors 'none'` |
| `X-Frame-Options` | Clickjacking (legacy fallback) | `DENY` |
| `Referrer-Policy` | Referrer URL leakage | `strict-origin-when-cross-origin` |
| `Cross-Origin-Opener-Policy` | Cross-window attacks (Spectre, tabnabbing) | `same-origin` |

**HSTS** is the subtle one. On the first plaintext visit the header can be stripped, so there's a trust-on-first-use gap. The **preload list** closes it: browsers ship a baked-in list of HSTS domains, so they *never* speak HTTP to you, even on the very first request. `max-age` is how long the browser remembers; `includeSubDomains` extends it to every subdomain (a real commitment — an internal HTTP-only subdomain will break).

**`nosniff`** stops the browser from second-guessing your `Content-Type`. Without it, a file you serve as `text/plain` but that *looks* like HTML can be sniffed and executed as HTML — turning a user-uploaded "text" file into stored XSS.

**Clickjacking**: `frame-ancestors` in CSP is the modern control and supersedes `X-Frame-Options`; you keep XFO only for ancient browsers. Note XFO's `ALLOW-FROM` is dead — use `frame-ancestors` for allowlisting specific parents.

## 💻 Code

```js
// Express-style: a sane baseline (helmet sets most of these for you)
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Content-Security-Policy', "frame-ancestors 'none'");
  res.setHeader('X-Frame-Options', 'DENY'); // legacy fallback only
  next();
});
```

```
❌ Deprecated / harmful — do NOT ship these:
X-XSS-Protection: 1; mode=block   # legacy auditor, removed from Chrome, can INTRODUCE bugs
Feature-Policy: ...               # renamed to Permissions-Policy
Public-Key-Pins: ...             # HPKP — dead, footgun that bricked sites
```

## ⚖️ Trade-offs

- **HSTS `preload` is a one-way door.** Getting *onto* the list is easy; getting *off* is slow. If any subdomain must ever serve plain HTTP, `includeSubDomains; preload` will break it and you can't quickly undo it. Commit deliberately.
- **`Referrer-Policy` trades analytics for privacy.** `no-referrer` is safest but blinds attribution; `strict-origin-when-cross-origin` (now the browser default) is the pragmatic middle — full URL same-origin, only the origin cross-origin, nothing over a downgrade.
- **Headers are per-response and easy to miss on edge cases.** Error pages, static assets served by a CDN, and redirects often skip your middleware — attackers target exactly those. Set them at the edge/proxy, not only in app code.
- **A wrong header is worse than none.** A too-loose `frame-ancestors` or a stale `X-XSS-Protection` gives a false sense of coverage.

## 💣 Gotchas interviewers probe

- **"Set `X-XSS-Protection: 1; mode=block`."** Outdated advice. The XSS Auditor is **removed** from Chromium and could itself be abused to create leaks. Modern answer: CSP, not XSS-Protection.
- **HSTS only works over HTTPS.** The header is **ignored when sent over HTTP** — by design — which is why the preload list exists to cover the first-visit gap.
- **`frame-ancestors` beats `X-Frame-Options`, and browsers that support both ignore XFO.** Don't rely on XFO's `ALLOW-FROM`; it never worked in Chrome.
- **`nosniff` also hardens `script`/`style` loading** — it makes the browser refuse a script whose `Content-Type` isn't a JS MIME type, blocking a subtle injection vector.
- **COOP/COEP are prerequisites for `SharedArrayBuffer`** and precise timers — a header topic that shows up when someone asks why cross-origin isolation is needed post-Spectre.

## 🎯 Say this in the interview

> "I treat these as a hardening checklist, each mapped to a threat. HSTS forces HTTPS forever and I'll add `preload` so the very first request can't be downgraded — knowing `includeSubDomains; preload` is basically a one-way commitment. `nosniff` stops MIME confusion turning an uploaded file into stored XSS. For clickjacking I use CSP `frame-ancestors 'none'` and keep `X-Frame-Options: DENY` only as a legacy fallback, since `frame-ancestors` supersedes it. `Referrer-Policy: strict-origin-when-cross-origin` to limit URL leakage. The two things I flag as traps: `X-XSS-Protection` is deprecated and I don't set it, and I make sure the headers are applied at the edge so error pages, redirects and CDN-served assets aren't silently uncovered."

## 🔗 Go deeper

- [OWASP — Secure Headers Project](https://owasp.org/www-project-secure-headers/) — the canonical list with recommended values and which are deprecated.
- [MDN — Strict-Transport-Security](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) — HSTS mechanics, `max-age`, and the preload caveats.
- [hstspreload.org](https://hstspreload.org/) — submit/remove domains and read the exact preload requirements.
- [web.dev — Why COOP/COEP for cross-origin isolation](https://web.dev/articles/coop-coep) — the post-Spectre window-isolation headers.
