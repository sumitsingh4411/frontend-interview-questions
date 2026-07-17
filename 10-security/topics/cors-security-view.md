<div align="center">

# CORS (security view)

<sub>🔒 Security · 🟡 Medium · ⏱ 45m · `#cors`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CORS is **not** a defense that protects *your* server — it's a mechanism that *relaxes* the Same-Origin Policy so browsers will let a page **read** cross-origin responses. It guards the reader, never the resource. Treating CORS as authorization is the single most common security misunderstanding.

---

## 🧠 Mental model

The Same-Origin Policy (SOP) is the real security boundary: a page on `a.com` can *send* a request to `b.com`, but the browser blocks it from *reading the response* unless `b.com` opts in. CORS is that opt-in.

So flip the usual framing. Candidates say "I enabled CORS to secure my API." **CORS never secures anything you own** — it *loosens* SOP so a browser will hand a cross-origin response back to JavaScript. The request often reaches your server and executes regardless; CORS only decides whether the *browser* lets the calling page see the reply. Your API is protected by **authentication and authorization**, not by an `Access-Control-Allow-Origin` header.

## ⚙️ How it actually works

Two flavors, and the interviewer wants you to know the difference:

**Simple requests** (GET/HEAD/POST with only "safe" headers and a basic content type) go straight to the server. The browser then checks the response's `Access-Control-Allow-Origin` before revealing it. The request already ran — the check is purely about *readability*.

**Preflighted requests** (anything else — `PUT`, `DELETE`, `Content-Type: application/json`, custom headers) trigger an automatic `OPTIONS` preflight. The browser asks *"may I send this?"* and only sends the real request if the server approves the method/headers. This is why a JSON `POST` fires two requests.

```
Browser (a.com JS)                Server (api.b.com)
   │  OPTIONS /data                    │
   │  Origin: https://a.com            │
   │  Access-Control-Request-Method: PUT
   │─────────────────────────────────▶│
   │  200 + Allow-Origin: https://a.com│
   │◀─────────────────────────────────│
   │  PUT /data (the real request)     │
   │─────────────────────────────────▶│
```

The credentials rule is the security-critical one: to send cookies cross-origin you need `credentials: 'include'` **and** the server must return `Access-Control-Allow-Credentials: true` **and** `Access-Control-Allow-Origin` must be a **specific origin — never `*`**. The browser hard-refuses wildcard + credentials. This pairing is exactly where misconfigurations become vulnerabilities.

## 💻 Code

```js
// Client explicitly opting into sending cookies cross-origin
fetch('https://api.b.com/me', { credentials: 'include' });
```

```js
// ❌ Dangerous server config: reflect any origin AND allow credentials
res.setHeader('Access-Control-Allow-Origin', req.headers.origin); // reflects attacker.com
res.setHeader('Access-Control-Allow-Credentials', 'true');
// → any site can now make authenticated requests as the logged-in user
//   and READ the response. This is an account-takeover-grade bug.

// ✅ Allowlist explicit, trusted origins only
const ALLOWED = new Set(['https://app.b.com', 'https://admin.b.com']);
const origin = req.headers.origin;
if (ALLOWED.has(origin)) {
  res.setHeader('Access-Control-Allow-Origin', origin); // echo only if trusted
  res.setHeader('Vary', 'Origin');                      // don't cache the wrong ACAO
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}
```

## ⚖️ Trade-offs

- **`Access-Control-Allow-Origin: *` is fine for public, unauthenticated data** (a public CDN, open API) and *only* then. The moment cookies or auth are involved, wildcard is both forbidden-with-credentials and a design smell.
- **Reflecting `Origin` is convenient and a classic footgun.** "Echo whatever origin asked" plus `Allow-Credentials: true` = every website can act as your logged-in users. Always match against an allowlist.
- **Preflights cost a round trip.** For latency-sensitive APIs, keeping requests "simple" or setting `Access-Control-Max-Age` to cache the preflight matters — but never widen `Content-Type` handling just to dodge preflight; that preflight is a safety feature.

## 💣 Gotchas interviewers probe

- **"CORS protects my API."** No. **CORS is not a server-side access control.** `curl`, Postman, a mobile app, or any non-browser client ignores it entirely. It's a *browser* policy about reading responses.
- **CORS ≠ CSRF defense.** CORS doesn't stop a cross-site *write*; a form POST or simple request still hits your server. CSRF tokens / SameSite cookies handle that. Conflating the two is a red flag.
- **Wildcard + credentials is impossible on purpose.** If someone claims `Allow-Origin: *` works with cookies, they've never tested it — the browser silently drops the response.
- **Forgetting `Vary: Origin`** lets a CDN cache one origin's `Access-Control-Allow-Origin` and serve it to another, breaking your allowlist via cache poisoning.
- **Opaque responses.** A `no-cors` fetch "succeeds" but returns an opaque response you can't read — people mistake the lack of error for CORS being satisfied.

## 🎯 Say this in the interview

> "The key reframe is that CORS doesn't protect my server — the Same-Origin Policy is the boundary, and CORS is how I *relax* it so a browser will let a cross-origin page read my response. The request usually reaches the server either way; auth and authz protect the data, not CORS. Practically: I never reflect the `Origin` header blindly, I match it against an explicit allowlist, and I know that `Allow-Origin: *` plus credentials is flat-out refused by the browser, so for cookie-based APIs I echo the specific trusted origin and set `Allow-Credentials: true` and `Vary: Origin`. And I'm clear that CORS is not a CSRF defense — a simple cross-site POST still fires, so I still need SameSite cookies or CSRF tokens for state-changing requests."

## 🔗 Go deeper

- [MDN — Cross-Origin Resource Sharing (CORS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — the definitive walkthrough of simple vs preflighted and the credentials rules.
- [MDN — Same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy) — the boundary CORS relaxes; read this first.
- [PortSwigger — CORS misconfiguration](https://portswigger.net/web-security/cors) — the attack side: origin reflection, `null` origin, and credentialed exploits.
