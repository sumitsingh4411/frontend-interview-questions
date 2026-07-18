<div align="center">

# Security basics (XSS/CSRF overview)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#security`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **XSS** is the attacker running *their* JavaScript in *your* origin (a confidentiality/integrity break); **CSRF** is the attacker making the *victim's browser* send an authenticated request they didn't intend (an authority break). Different bugs, different fixes: XSS → output encoding + CSP; CSRF → `SameSite` cookies + tokens.

---

## 🧠 Mental model

Both attacks exploit the browser's trust — but they trust *different* things:

| | XSS | CSRF |
|---|---|---|
| What's abused | The site trusts the **content** it renders | The server trusts the **cookie** it receives |
| Attacker runs | Their JS in your origin | A forged request from the victim's session |
| Needs the victim to | Load your poisoned page | Be logged in, then visit a hostile page |
| Root fix | Never let data become code | Never authorise on ambient cookies alone |

The one-liner that shows you understand the difference: **XSS defeats CSRF defenses.** If an attacker can run JS in your origin, they can read your CSRF token, read your `SameSite` cookie's effects, and forge any request from *inside*. So XSS is the more severe bug — CSRF mitigations assume your JS isn't already compromised.

## ⚙️ How it actually works

**XSS** comes in three flavours. **Stored** (persisted to your DB, e.g. a comment, served to everyone), **Reflected** (bounced off a URL param into the response), and **DOM-based** (never touches the server — client JS reads `location.hash` and writes it into `innerHTML`). The mechanism is always the same: **untrusted data crosses into an HTML/JS/URL parsing context without being encoded for that context.** Context matters — encoding for HTML text (`&lt;`) does nothing if the sink is a `<script>` block or an `onclick` attribute.

The modern defense-in-depth layer is **Content-Security-Policy**: a response header that tells the browser which script sources to trust. A strict nonce-based CSP (`script-src 'nonce-xyz' 'strict-dynamic'`) makes injected `<script>` tags inert *even if* an injection slips through, because they lack the nonce.

**CSRF** works because cookies are **ambient authority** — the browser attaches them to *every* request to your origin, including ones triggered by a hostile third-party page (`<form action="https://bank.com/transfer" method="POST">` auto-submitted). The server can't tell "user clicked transfer" from "user was tricked". Fixes: `SameSite=Lax` (the modern default) stops cookies riding along on cross-site POSTs; a **CSRF token** (a random value the attacker's page can't read due to same-origin policy) proves the request came from your own page.

## 💻 Code

```jsx
// ❌ DOM XSS: user input flows straight into an HTML-parsing sink
el.innerHTML = `<p>Welcome ${username}</p>`;   // username = '<img src=x onerror=steal()>'
element.setAttribute('href', userUrl);          // userUrl = 'javascript:steal()'

// ✅ Use sinks that DON'T parse HTML — textContent treats input as text, never markup
el.textContent = `Welcome ${username}`;
// ✅ In React, {value} is auto-escaped. The ONLY XSS door is:
<div dangerouslySetInnerHTML={{ __html: sanitize(userHtml) }} />  // must sanitize (DOMPurify)
```

```http
# ✅ Defense-in-depth headers most apps should ship
Content-Security-Policy: script-src 'nonce-r4nd0m' 'strict-dynamic'; object-src 'none'; base-uri 'none'
Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax
# HttpOnly  → JS can't read the cookie, so XSS can't exfiltrate the session token
# Secure    → cookie only sent over HTTPS
# SameSite  → cookie not sent on cross-site requests → kills classic CSRF
```

```js
// ✅ CSRF token pattern (double-submit): the attacker's page can't read this value
fetch('/api/transfer', {
  method: 'POST',
  headers: { 'X-CSRF-Token': readTokenFromMeta() }, // same-origin policy blocks cross-site read
  body: JSON.stringify(payload),
});
```

## ⚖️ Trade-offs

- **Sanitizing HTML is a last resort, not a first choice.** Prefer sinks that can't execute (`textContent`, framework escaping). Only reach for a sanitizer like DOMPurify when you *must* render user HTML (rich-text editors). Hand-rolled regex "sanitizers" are always bypassable — never write your own.
- **CSP is powerful but operationally heavy.** A strict nonce policy breaks inline scripts, third-party widgets, and analytics until you migrate them. Roll it out in `Content-Security-Policy-Report-Only` first, watch the violation reports, then enforce. `unsafe-inline` throws away most of the benefit.
- **`SameSite=Lax` is not complete CSRF coverage.** It doesn't protect top-level GETs that mutate state (so never mutate on GET), and `SameSite=None` (needed for legitimate cross-site cookies) reopens the hole — those still need tokens.

## 💣 Gotchas interviewers probe

- **"Does `HttpOnly` prevent XSS?"** No — it prevents the *cookie theft* that XSS enables. The XSS still runs; it just can't read the session cookie. Conflating "mitigate the damage" with "prevent the bug" is a common miss.
- **XSS beats CSRF tokens.** If you have XSS, CSRF protection is moot — the attacker's script reads the token. Say this; it shows you understand the hierarchy.
- **React is not immune.** `dangerouslySetInnerHTML`, `href={userUrl}` with a `javascript:` URL, and `ref` + `innerHTML` are all live XSS vectors. Auto-escaping only covers the `{value}` text path.
- **Encoding is context-sensitive.** HTML-escaping a value that lands inside a `<script>` string or a URL doesn't help — you need JS-string or URL encoding respectively. "I'll just escape it" without naming the context is a weak answer.
- **CORS is not a defense against CSRF.** CORS governs *reading responses* cross-origin; the forged CSRF request still *sends* and mutates even if the attacker can't read the reply.

## 🎯 Say this in the interview

> "XSS and CSRF both abuse browser trust but at different layers. XSS is code injection — untrusted data reaches an HTML or JS parsing context and executes in my origin; I defend by using non-executing sinks like `textContent` or framework escaping, sanitizing with DOMPurify only when I must render user HTML, and layering a strict nonce-based CSP so injected scripts are inert anyway. CSRF is the browser sending my session cookie on a request the user didn't intend, because cookies are ambient authority; I defend with `SameSite=Lax` cookies plus a CSRF token the attacker's cross-site page can't read. The key relationship I'd flag: XSS is the more severe bug because it defeats CSRF defenses outright — a script in my origin can just read the token — so `HttpOnly` on the session cookie limits the blast radius even if I get popped."

## 🔗 Go deeper

- [OWASP — Top 10](https://owasp.org/www-project-top-ten/) — the canonical risk list; XSS and CSRF in context.
- [OWASP — XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) — context-by-context output encoding rules.
- [web.dev — Strict CSP](https://web.dev/articles/strict-csp) — how to deploy a nonce-based policy that actually works.
- [MDN — SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) — Lax/Strict/None semantics and defaults.
