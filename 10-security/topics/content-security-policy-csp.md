<div align="center">

# Content Security Policy (CSP)

<sub>🔒 Security · 🔴 Hard · ⏱ 1h · `#csp` `#headers`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSP is a browser-enforced allowlist of where scripts, styles and connections may come from. It does **not** stop XSS — it's the *seatbelt* for when your XSS defenses fail: it turns "attacker runs arbitrary JS" into "attacker's injected `<script>` is blocked before it executes."

---

## 🧠 Mental model

CSP is **defense in depth, not a fix.** Output encoding and sanitization are your first line — they stop the injection. CSP is the second line: it assumes an attacker *did* get a payload into your page and constrains what that payload can do. If your only XSS defense is CSP, you've already lost; if your only defense is encoding, one missed sink owns the page. You want both.

The header answers one question per resource type: *"is this source trusted?"* A `<script src>` from a host not in `script-src` never runs. An inline `<script>` without a matching nonce never runs. `eval()` throws. That's the whole game — the browser is now refusing to execute code you didn't explicitly bless.

## ⚙️ How it actually works

You ship a `Content-Security-Policy` response header made of directives:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'nonce-r4nd0m' 'strict-dynamic';
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  report-to csp-endpoint;
```

The interviewer is listening for **why host allowlists are dead.** A policy like `script-src 'self' https://cdn.example.com` looks safe but is routinely bypassed: an open redirect, a JSONP endpoint, or an old Angular build on any allowlisted host lets an attacker smuggle execution through a "trusted" origin. Google's own research found the majority of host-based CSPs are trivially bypassable.

The modern answer is a **nonce-based strict CSP**:

- The server generates a fresh, unguessable **nonce per response** and puts it in both the header (`'nonce-r4nd0m'`) and every legitimate inline script's `nonce` attribute.
- `'strict-dynamic'` says: *trust propagates.* Any script loaded by an already-trusted script is also trusted — so you don't have to allowlist every analytics/CDN host by hand. This is what makes strict CSP maintainable.
- `object-src 'none'` kills legacy plugin/Flash vectors; `base-uri 'none'` stops an injected `<base>` from hijacking relative script URLs.

**Roll it out in report-only mode first:** `Content-Security-Policy-Report-Only` enforces nothing but POSTs violations to your `report-to` endpoint, so you find what breaks before you break production.

## 💻 Code

```html
<!-- Server sets header: script-src 'nonce-r4nd0m' 'strict-dynamic' -->

<!-- ✅ Executes: nonce matches the header -->
<script nonce="r4nd0m">initApp();</script>

<!-- ❌ Blocked: no nonce, and there is no 'unsafe-inline' -->
<script>stealCookies()</script>

<!-- ❌ Blocked: inline event handlers are inline script too -->
<button onclick="doThing()">Go</button>   <!-- use addEventListener instead -->
```

```js
// The clever backwards-compat trick worth knowing:
// script-src 'nonce-abc' 'unsafe-inline'
// → CSP3 browsers see the nonce and IGNORE 'unsafe-inline' (strict).
// → Ancient browsers ignore the nonce and honor 'unsafe-inline' (still works).
// One policy, graceful degradation.
```

## ⚖️ Trade-offs

- **Nonce CSP requires server-rendered HTML.** A fully static/CDN-cached page can't inject a per-request nonce, so you fall back to **hashes** (`'sha256-...'`) of known-good inline scripts — fine for fixed content, painful for anything dynamic.
- **`'unsafe-inline'`/`'unsafe-eval'` gut the policy.** They're the easy way to stop CSP breaking your app and the reason so many real-world CSPs are theater. If you need `eval` (some templating libs), that's a signal to fix the lib, not weaken CSP globally.
- **CSP is not free to adopt.** Inline styles, `javascript:` URLs, third-party widgets and framework quirks all fight it. Budget real engineering time; don't promise it as a one-line header.
- **Not a substitute for `frame-ancestors`/CORS/auth.** CSP governs *your* page's resource loading, not who can call your API.

## 💣 Gotchas interviewers probe

- **"Does CSP prevent XSS?"** No — it *mitigates* it. Saying "yes" is a fail signal. It reduces the blast radius of an XSS that already happened.
- **Static nonces are worthless.** A nonce reused across responses (or hardcoded) is fully guessable/copyable — attacker just reuses it. It must be per-response and CSPRNG-generated.
- **`meta`-tag CSP is second-class.** `frame-ancestors`, `report-uri`/`report-to`, and `sandbox` are **ignored** in a `<meta http-equiv>` policy — those only work as a real header.
- **`default-src` is a fallback, not a cascade.** Setting `default-src 'self'` does *not* cover `base-uri`, `form-action`, or `frame-ancestors` — those have no fallback and must be set explicitly.
- **`'strict-dynamic'` disables host allowlisting.** Once present, `'self'` and `https:` in `script-src` are ignored — a surprise if you mix the two styles.

## 🎯 Say this in the interview

> "I treat CSP as the second layer under output encoding — it's what catches the XSS that slips past encoding. The mistake I see is host-based allowlists like `script-src 'self' cdn.com`; those get bypassed through JSONP endpoints and open redirects on trusted hosts, so I go straight to a nonce-based strict CSP with `'strict-dynamic'`: a fresh unguessable nonce per response, and trust propagates to scripts that trusted scripts load, which keeps it maintainable. I lock down `object-src 'none'` and `base-uri 'none'` too, and I always roll it out in `Report-Only` first with a reporting endpoint so I learn what breaks before enforcing. The line I'm careful never to cross is claiming CSP *prevents* XSS — it mitigates it, and `'unsafe-inline'` throws the whole thing away."

## 🔗 Go deeper

- [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) — directive reference and the header vs meta differences.
- [web.dev — Mitigate XSS with a strict CSP](https://web.dev/articles/strict-csp) — the nonce + `strict-dynamic` playbook, from the team that measured allowlist bypasses.
- [Google — CSP Evaluator](https://csp-evaluator.withgoogle.com/) — paste a policy, see exactly how it's bypassable.
- [W3C — CSP Level 3](https://www.w3.org/TR/CSP3/) — the spec, for the nonce/hash/`strict-dynamic` semantics.
