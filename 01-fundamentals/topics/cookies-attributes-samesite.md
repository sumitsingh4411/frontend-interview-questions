<div align="center">

# Cookies (attributes, SameSite)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#storage` `#security`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A cookie is a string the browser re-sends on every matching request. The value is trivial; the **attributes are the entire security story**. `HttpOnly` blocks XSS theft, `Secure` blocks eavesdropping, and `SameSite` is your first-line CSRF defence by controlling whether the cookie rides along on *cross-site* requests.

---

## 🧠 Mental model

Think of a cookie as **ambient authority**: once set, the browser attaches it automatically to every qualifying request — you don't opt in per fetch, the browser opts you in. That's exactly why cookies power sessions *and* exactly why they're the vector for CSRF: the attacker's page can trigger a request to *your* site, and the browser helpfully includes your login cookie.

Each attribute is a knob that narrows *when* the browser will attach it:

| Attribute | Narrows | Defends against |
|---|---|---|
| `Secure` | HTTPS only | network sniffing |
| `HttpOnly` | hidden from `document.cookie` | XSS token theft |
| `SameSite` | cross-site behaviour | CSRF |
| `Domain`/`Path` | which URLs match | over-sharing |
| `Max-Age`/`Expires` | lifetime | stale sessions |

## ⚙️ How it actually works

**`SameSite` is the one interviewers dig into.** "Site" here means *registrable domain* (eTLD+1) — `a.example.com` and `b.example.com` are the *same site* but *different origins*. The three values:

- **`SameSite=Strict`** — cookie is withheld on *all* cross-site requests, including top-level navigations. Follow a link from Gmail to your app and you arrive *logged out* until the next same-site request. Great for CSRF, poor UX for session cookies.
- **`SameSite=Lax`** — the modern default. Cookie is sent on **top-level GET navigations** (clicking a link) but withheld on cross-site *subresource* requests and non-GET (form POST, `fetch`, image pings). This kills most CSRF while keeping "click a link, stay logged in" working.
- **`SameSite=None`** — sent on all cross-site requests; **required for third-party cookies** (embeds, SSO iframes). Browsers *mandate* `Secure` alongside it, or the cookie is rejected.

Since ~2020, **browsers treat a cookie with no `SameSite` as `Lax`** — so the historical CSRF-by-default footgun is largely closed, but you should still set it explicitly.

**Cookie prefixes** are the underrated hardening layer:

- `__Secure-` prefix → browser rejects the cookie unless it's `Secure`.
- `__Host-` prefix → requires `Secure`, no `Domain`, and `Path=/` — meaning it's locked to the exact host and can't be overwritten by a subdomain. The gold standard for session cookies.

## 💻 Code

A session cookie, hardened — set by the *server*, not JS:

```http
Set-Cookie: __Host-sid=a1b2c3; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=3600
```

Line by line, why each token is there:

```
__Host-   → locked to this exact host; a subdomain can't overwrite it
HttpOnly  → document.cookie can't read it; XSS can't exfiltrate the session
Secure    → never sent over plain http (also required by __Host- and SameSite=None)
SameSite=Lax → not attached to cross-site POST/fetch → blocks the common CSRF
Path=/    → required by __Host-
Max-Age=3600 → expires in 1h; short-lived sessions limit theft window
```

A third-party cookie (analytics pixel, embedded widget) has *no choice*:

```http
Set-Cookie: _track=xyz; Secure; SameSite=None
# SameSite=None WITHOUT Secure → silently rejected by the browser.
```

## ⚖️ Trade-offs

- **`SameSite=Strict` is the most secure and the most annoying.** For a bank, worth it. For a consumer app where inbound links must land logged-in, `Lax` is the pragmatic default — and you back it with a real CSRF defence (token/double-submit) rather than relying on `SameSite` alone.
- **`SameSite` is not a complete CSRF solution.** It doesn't cover same-site sub-domains you don't control, and older browsers ignore it. Treat it as defence-in-depth, not the whole wall.
- **`HttpOnly` breaks the "read the token in JS" pattern — on purpose.** If your SPA needs to attach a bearer token in a header, you're choosing an XSS-readable store. `HttpOnly` cookies + `SameSite` is the more defensible design for session auth.
- **Big cookies tax every request.** Cookies ride on *all* requests to the domain, including static assets. A bloated cookie inflates request headers and hurts TTFB — serve static assets from a cookieless domain if it's significant.

## 💣 Gotchas interviewers probe

- **"Same site" ≠ "same origin".** `SameSite` keys on the registrable domain (eTLD+1), ignoring scheme-until-recently, subdomain, and port. Conflating it with the same-origin policy is the classic slip.
- **`SameSite=None` without `Secure` is silently dropped.** People debug a "cookie not setting" bug for an hour over this.
- **Default is now `Lax`, not "none".** Saying "cookies are sent everywhere by default" is out of date and a red flag.
- **`HttpOnly` cookies are invisible to `document.cookie`** — so you can't debug them there; check DevTools → Application → Cookies. And no, JS *cannot* delete an `HttpOnly` cookie.
- **`Domain=example.com` widens scope to all subdomains** — the opposite of what people expect. Omitting `Domain` (host-only) is *narrower* and safer.
- **A cookie set on `Path=/app` isn't sent to `/api`** — path scoping silently drops it, a common "why is my session gone" bug.

## 🎯 Say this in the interview

> "The cookie value barely matters — the attributes are the security model. For a session cookie I set it server-side with `HttpOnly` so XSS can't steal it, `Secure` so it never crosses plain HTTP, and `SameSite` to control cross-site behaviour. `SameSite=Lax` is my default — the cookie still rides top-level GET navigations so inbound links stay logged in, but it's withheld from cross-site POSTs and fetches, which blocks the common CSRF pattern. If I need maximum protection I go `Strict`, accepting that users following an external link arrive logged out. For third-party contexts I need `SameSite=None`, which mandates `Secure`. And I'll use the `__Host-` prefix to pin the cookie to the exact host so a compromised subdomain can't overwrite it. `SameSite` is defence-in-depth, though — I still pair it with a CSRF token for anything state-changing."

## 🔗 Go deeper

- [MDN — HTTP cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) — every attribute, prefixes, and the `Set-Cookie` grammar.
- [web.dev — SameSite cookies explained](https://web.dev/articles/samesite-cookies-explained) — the clearest walkthrough of `Lax`/`Strict`/`None` and the default change.
- [MDN — SameSite attribute](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) — precise semantics, including the `None`+`Secure` requirement.
- [OWASP — Cross-Site Request Forgery Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — why `SameSite` alone isn't enough.
