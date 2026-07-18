<div align="center">

# HTTP methods, status codes, headers

<sub>📡 Networking · 🟢 Easy · ⏱ 45m · `#http` `#basics`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An HTTP request is a **method** (the verb — what you want done), a **status code** (the server's one-line verdict), and **headers** (the metadata that decides caching, auth, content type and CORS). The senior skill is knowing the *contracts* these carry — idempotency, safety, and which status the client is allowed to retry.

---

## 🧠 Mental model

HTTP is a **stateless request/response protocol** where every message is self-describing. The server keeps no memory of you between requests, so everything the server needs — who you are, what format you accept, whether your cached copy is still fresh — rides along in **headers**. Think of a request as an envelope: the **method** is the instruction on the front, the **headers** are the routing/handling notes, and the **body** is the cargo.

The three numbers that matter most are baked into the method's *contract*, not its behaviour:

| Property | Meaning | Methods |
|---|---|---|
| **Safe** | Read-only; no server state changes | `GET`, `HEAD`, `OPTIONS` |
| **Idempotent** | N identical calls == 1 call's effect | `GET`, `HEAD`, `PUT`, `DELETE`, `OPTIONS` |
| **Cacheable** | Response may be stored & replayed | `GET`, `HEAD` (and `POST` with explicit headers) |

`POST` is the odd one out: not safe, **not idempotent**, which is exactly why a double-submitted checkout can charge twice — and why idempotency keys exist.

## ⚙️ How it actually works

**Methods carry a contract, not a guarantee.** Nothing *stops* your `GET` handler from mutating a database — but the whole ecosystem (browsers, proxies, CDNs, `fetch` retries, prefetchers) *assumes* it won't. A CDN will happily replay a cached `GET`; a browser will prefetch links; a retry library will re-fire an idempotent `PUT` after a timeout. Break the contract and you get phantom writes.

**Status codes are grouped by first digit**, and the interviewer is listening for the ones people confuse:

- **2xx** — success. `200 OK`, `201 Created` (return a `Location`), `204 No Content` (deletes/PUTs with no body).
- **3xx** — redirection. `301` permanent (cached hard, hard to undo), `302`/`307` temporary. `304 Not Modified` is a *cache validation* win, not an error.
- **4xx** — *you* messed up. `400` malformed, `401` **unauthenticated** (you haven't proven who you are), `403` **unauthorised** (we know who you are, you can't), `404`, `409` conflict, `422` semantically invalid, `429` rate-limited.
- **5xx** — *the server* messed up. `500`, `502` bad upstream, `503` unavailable, `504` upstream timeout.

The **401 vs 403** distinction is a classic tell: 401 means "log in", 403 means "logging in won't help".

**Headers do the real work.** `Content-Type` declares the body's format (and `charset`); `Accept` says what the client wants back — that's **content negotiation**. `Authorization` carries the credential. `Cache-Control` governs caching. `ETag` + `If-None-Match` drive conditional requests. And a set of them (`Origin`, `Access-Control-*`) is browser-only machinery for CORS.

## 💻 Code

```js
// Content negotiation + explicit contract awareness
const res = await fetch('/api/orders', {
  method: 'POST',                       // NOT idempotent — guard against double-submit
  headers: {
    'Content-Type': 'application/json', // what I'm SENDING
    'Accept': 'application/json',        // what I want BACK
    'Idempotency-Key': crypto.randomUUID(), // make POST safe to retry
  },
  body: JSON.stringify({ sku: 'A1', qty: 2 }),
});

// ✅ Branch on the STATUS CLASS, not just res.ok
if (res.status === 201) {
  const location = res.headers.get('Location'); // where the new resource lives
} else if (res.status === 409) {
  // conflict — someone else changed it; refetch and merge, don't blindly retry
} else if (res.status === 429) {
  const retryAfter = Number(res.headers.get('Retry-After')) || 1; // seconds
  // back off, THEN retry
} else if (res.status >= 500) {
  // server fault — safe to retry with backoff for idempotent methods
}
```

```js
// ❌ fetch does NOT throw on 404/500 — this hides real failures
const data = await fetch(url).then(r => r.json()); // parses an error page as JSON

// ✅ check res.ok yourself
const r = await fetch(url);
if (!r.ok) throw new Error(`HTTP ${r.status}`);
```

## ⚖️ Trade-offs

- **Prefer the specific status over a generic one.** `422` tells the client "your JSON parsed but the *values* are wrong" — far more actionable than a blanket `400`. But don't invent statuses; stick to registered ones or clients/proxies mishandle them.
- **`PUT` vs `POST` vs `PATCH`.** `PUT` replaces the whole resource (idempotent). `PATCH` applies a partial change (not guaranteed idempotent). `POST` creates/appends. Choosing `PUT` for "create with a client-known ID" buys you free retry-safety.
- **Don't smuggle actions into `GET`.** `GET /deleteUser?id=5` is cacheable, prefetchable, and logged in URLs — a security and correctness disaster.

## 💣 Gotchas interviewers probe

- **`fetch` only rejects on *network* failure**, not on 4xx/5xx. You must check `res.ok`. Most candidates get this wrong.
- **401 ≠ 403.** Unauthenticated vs unauthorised. Mixing them leaks information or confuses clients.
- **`POST` is not idempotent** — the single most consequential contract. This is *why* payments need idempotency keys and why retry-on-timeout is dangerous for it.
- **Header names are case-insensitive; values sometimes aren't.** And in HTTP/2+ headers are lowercased on the wire.
- **`304 Not Modified` still costs a round trip.** It saves *bandwidth*, not latency. `Cache-Control: max-age` avoids the request entirely.
- **`204 No Content` has no body** — calling `res.json()` on it throws. Check status first.

## 🎯 Say this in the interview

> "An HTTP exchange is a method, a status code, and headers, and the thing I actually reason about is the *contract* each carries. Methods have three properties — safe, idempotent, cacheable — and the whole infrastructure trusts them: a CDN replays `GET`s, a retry library re-fires a `PUT`. `POST` is neither safe nor idempotent, which is exactly why double-submitted checkouts double-charge and why we add idempotency keys. On status codes, the distinctions I watch for are 401 versus 403 — unauthenticated versus forbidden — and that `fetch` doesn't throw on 4xx or 5xx, so I always check `res.ok`. Headers are where the real behaviour lives: `Content-Type` and `Accept` drive content negotiation, `Cache-Control` and `ETag` drive caching, and the `Origin`/`Access-Control` family is browser-enforced CORS."

## 🔗 Go deeper

- [MDN — HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP) — the canonical reference for methods, statuses, and every header.
- [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) — safe/idempotent/cacheable table per method.
- [MDN — HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status) — every code with when to use it.
- [RFC 9110 — HTTP Semantics](https://www.rfc-editor.org/rfc/rfc9110) — the authoritative spec if you want the exact wording on idempotency.
