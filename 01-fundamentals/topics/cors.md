<div align="center">

# CORS

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#networking` `#security`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CORS is a **browser**-enforced relaxation of the same-origin policy: the *server* uses response headers to opt specific origins into **reading** a cross-origin response. It protects the user's browser, not your API — a `curl` request ignores it entirely.

---

## 🧠 Mental model

By default the same-origin policy lets your page *send* a cross-origin request but blocks JavaScript from *reading* the response. CORS is the mechanism by which the server says "origin `https://app.example` is allowed to read me."

The insight that reframes everything: **CORS is not a firewall.** In most cases the request still reaches the server and still executes — CORS just decides whether the browser hands the *response* back to your JS or throws it away. It's about protecting a user's ambient credentials (their cookies, their session) from being read by a malicious page, not about protecting your endpoint from being called.

## ⚙️ How it actually works

Requests fall into two buckets:

**Simple requests** go straight out. A request is "simple" only if it's `GET`/`HEAD`/`POST`, uses a safelisted `Content-Type` (`text/plain`, `application/x-www-form-urlencoded`, `multipart/form-data`), and adds no custom headers. The server just needs to return `Access-Control-Allow-Origin`.

**Preflighted requests** — anything else, e.g. `PUT`/`DELETE`, `Content-Type: application/json`, or a custom `Authorization`/`X-*` header — trigger an automatic `OPTIONS` "preflight" *before* the real request:

```
OPTIONS /data                         → browser asks permission
Access-Control-Request-Method: PUT
Access-Control-Request-Headers: content-type

200 OK                                ← server grants it
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Methods: PUT
Access-Control-Allow-Headers: content-type
Access-Control-Max-Age: 600           ← cache the preflight for 10 min
```

**Credentials** change the rules sharply: to send cookies you set `credentials: 'include'`, and then the server **cannot** use `Access-Control-Allow-Origin: *` — it must echo the exact origin *and* add `Access-Control-Allow-Credentials: true`. Wildcards with credentials are forbidden.

**Reading response headers:** JS only sees a safelisted subset unless the server adds `Access-Control-Expose-Headers`.

## 💻 Code

```js
// Client — nothing special except opting into cookies:
fetch('https://api.example.com/data', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' }, // ← makes this preflighted
  credentials: 'include',                          // ← cookies ride along
  body: JSON.stringify(payload),
});
```

```js
// Server — the credentialed trap: '*' is illegal here.
res.setHeader('Access-Control-Allow-Origin', 'https://app.example'); // NOT '*'
res.setHeader('Access-Control-Allow-Credentials', 'true');
res.setHeader('Vary', 'Origin'); // you're echoing a per-request value — vary the cache on it
```

## ⚖️ Trade-offs

- **CORS is not API security.** It stops a *browser on another origin* from reading responses with the user's credentials. It does nothing against `curl`, Postman, or a server-side attacker. Don't treat "we set CORS headers" as authentication.
- **Preflights cost a round trip.** On a chatty API over high latency this is real. Mitigate with `Access-Control-Max-Age`, or keep requests "simple" where possible.
- **Reflecting `Origin` blindly (`Allow-Origin: <whatever they sent>`) with credentials is a vulnerability** — you've effectively allowed every origin. Whitelist explicitly.
- **When NOT to reach for CORS at all:** if it's your own frontend and backend, a **same-origin reverse proxy** sidesteps CORS entirely and is often cleaner.

## 💣 Gotchas interviewers probe

- **The console "CORS error" is usually the server's fault, not the client's** — a missing header, or the `OPTIONS` preflight returning a 4xx/redirect. You cannot fix it from the frontend.
- **`Access-Control-Allow-Origin: *` and `credentials: 'include'` are mutually exclusive.** The request just fails.
- **CORS ≠ CSRF protection.** A CSRF attack often uses a *simple* request that CORS never blocks (the request still fires; only the *response* is hidden). Different problem, different fix (SameSite, tokens).
- **`no-cors` mode gives you an *opaque* response** — status `0`, unreadable body. It looks like it "worked" but you can't use the data.
- **Redirects during a preflight fail** — the `OPTIONS` must return the final `2xx` directly.
- **Adding CORS headers doesn't make the browser send cookies** — that needs `credentials: 'include'` on the client side too. Both ends must agree.

## 🎯 Say this in the interview

> "CORS is a browser-enforced relaxation of the same-origin policy. The same-origin policy lets me *send* a cross-origin request but hides the *response* from my JavaScript; CORS is the server using response headers to opt specific origins into reading that response. The nuance I'd stress is that CORS protects the user, not the server — the request usually still hits the backend, so it's not authorization and it's not a CSRF defense. Mechanically, non-simple requests like a JSON `PUT` trigger a preflight `OPTIONS` that the server has to answer with the allowed origin, methods, and headers, and I'd cache that with `Access-Control-Max-Age`. The classic footgun is combining credentialed requests with a wildcard origin — that's illegal, so you have to echo the exact origin and add `Allow-Credentials`. And when I see a CORS error in the console, I look at the server, not my fetch call."

## 🔗 Go deeper

- [MDN — Cross-Origin Resource Sharing](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) — the definitive reference, header by header.
- [MDN — Preflight request](https://developer.mozilla.org/en-US/docs/Glossary/Preflight_request) — exactly what triggers `OPTIONS`.
- [web.dev — Cross-origin resource sharing](https://web.dev/articles/cross-origin-resource-sharing) — the practical framing.
- [OWASP — CORS misconfiguration](https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny) — how permissive CORS becomes a bug.
