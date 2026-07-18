<div align="center">

# HTTP fundamentals

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#networking` `#http`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — HTTP is a **stateless, text-based request/response protocol**: a method + URL + headers (+ body) goes up, a status code + headers + body comes back. Everything else — auth, caching, content negotiation, CORS — is just conventions layered on top of headers.

---

## 🧠 Mental model

An HTTP exchange is four boxes, twice:

```
REQUEST                          RESPONSE
┌───────────────────────┐        ┌───────────────────────┐
│ GET /users/1 HTTP/2   │        │ HTTP/2 200 OK         │
│ Host: api.example.com │        │ Content-Type: json    │
│ Accept: json          │        │ Cache-Control: ...    │
│ (body, if POST/PUT)   │        │ {"id":1,...}          │
└───────────────────────┘        └───────────────────────┘
   method + path + headers          status + headers + body
```

The property that shapes everything is **statelessness**: the server remembers nothing between requests. Every request must carry its own context (cookies, tokens). "Sessions" are an illusion built on top of that by sending an identifier every time.

## ⚙️ How it actually works

**Methods** carry *semantics* the whole ecosystem relies on:

| Method | Safe? | Idempotent? | Meaning |
|---|---|---|---|
| GET | ✅ | ✅ | Read; never mutate |
| POST | ❌ | ❌ | Create / non-idempotent action |
| PUT | ❌ | ✅ | Replace at a known URL |
| PATCH | ❌ | ❌ | Partial update |
| DELETE | ❌ | ✅ | Remove |

**Safe** = no side effects (caches/prefetchers assume this). **Idempotent** = repeating it has the same effect as doing it once (so clients can safely retry). Making `GET /delete?id=1` mutate data breaks both assumptions — a real bug, not pedantry.

**Status codes** are grouped by first digit: `2xx` success, `3xx` redirect, `4xx` *your* fault (400 bad request, 401 unauthenticated, 403 forbidden, 404 not found, 429 rate-limited), `5xx` *server's* fault. The `401` vs `403` distinction (are you *unknown* vs *known-but-not-allowed*) is a frequent interview probe.

**Versions matter for performance:** HTTP/1.1 = one request at a time per connection (browsers open ~6). HTTP/2 = **multiplexing** many streams over one connection, plus header compression. HTTP/3 runs over QUIC/UDP to kill TCP head-of-line blocking. These are why "bundle everything" advice from the HTTP/1 era is now often wrong.

## 💻 Code

```http
POST /api/orders HTTP/2
Host: shop.example.com
Content-Type: application/json
Authorization: Bearer eyJhbGc...
Idempotency-Key: 8f3a-...      # let the client safely retry a POST

{ "sku": "A1", "qty": 2 }
```

```http
HTTP/2 201 Created
Location: /api/orders/1042      # where the new resource lives
Content-Type: application/json
Cache-Control: no-store

{ "id": 1042, "status": "pending" }
```

```js
// The status code drives control flow — fetch does NOT throw on 4xx/5xx.
const res = await fetch('/api/orders/1042');
if (res.status === 404) return showNotFound();
if (!res.ok) throw new Error(`HTTP ${res.status}`); // res.ok === (200–299)
const order = await res.json();
```

## ⚖️ Trade-offs

- **Statelessness scales but pushes state to the client/tokens.** It's why HTTP scales horizontally (any server can handle any request) — at the cost of sending auth/context on every call.
- **HTTP/2 vs HTTP/1 changes bundling strategy:** under H2, many small cacheable files beat one giant bundle (a change busts less cache), because multiplexing removes the per-request penalty.
- **Choosing status codes honestly matters:** returning `200 {error:...}` for failures breaks monitoring, retries, and caching that all key off status. Use the real codes.
- **When idempotency isn't free:** a naive retried POST double-charges. `Idempotency-Key` headers or PUT semantics fix it.

## 💣 Gotchas interviewers probe

- **`fetch` doesn't reject on 4xx/5xx** — only on network failure. You must check `res.ok`/`res.status` yourself. Endless bugs come from this.
- **401 vs 403** — 401 = *not authenticated* (who are you?); 403 = authenticated but *not authorized* (I know you, no).
- **Safe & idempotent** — GET must not mutate; PUT/DELETE must be safely retryable. Interviewers ask *why* (caches, prefetch, retries rely on it).
- **POST is not idempotent** — retries can duplicate. This is a real production failure mode, not trivia.
- **Headers are case-insensitive; HTTP is stateless.** "How do sessions work if HTTP is stateless?" — via a cookie/token resent each request.
- **304 Not Modified** returns *no body* — the browser reuses its cached copy. Part of conditional requests (`ETag`/`If-None-Match`).

## 🎯 Say this in the interview

> "HTTP is a stateless request/response protocol — the server keeps nothing between requests, so every request carries its own context via cookies or tokens, and that statelessness is exactly what lets it scale horizontally. A request is a method, a URL, headers, and an optional body; the response is a status code, headers, and a body. The semantics I lean on are safe versus idempotent: GET must never mutate, and PUT and DELETE must be retryable, because caches, prefetchers, and retry logic all depend on those guarantees — which is also why POST needs an idempotency key to avoid double-charging on a retry. On status codes I'm precise: 401 is unauthenticated, 403 is authenticated-but-forbidden. And a practical gotcha I always flag is that `fetch` only rejects on network errors, not on 4xx or 5xx, so I check `res.ok` explicitly."

## 🔗 Go deeper

- [MDN — HTTP overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) — the clean baseline.
- [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) — safe/idempotent semantics per method.
- [MDN — HTTP status codes](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status) — the full reference.
- [Cloudflare — HTTP/1 vs HTTP/2 vs HTTP/3](https://www.cloudflare.com/learning/performance/http3-vs-http2/) — why the version changes your architecture.
