<div align="center">

# REST & JSON APIs

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#api`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — REST is an **architectural style**, not a protocol: model your domain as **resources** (nouns) at URLs, act on them with HTTP **methods** (verbs), and lean on HTTP's own machinery — status codes, caching, statelessness. JSON is just the usual payload format. "REST" ≠ "any JSON over HTTP."

---

## 🧠 Mental model

The core discipline is **nouns in the URL, verbs in the method**:

```
GET    /articles          → list
POST   /articles          → create
GET    /articles/42       → read one
PUT    /articles/42       → replace
PATCH  /articles/42       → partial update
DELETE /articles/42       → remove
GET    /articles/42/comments → sub-resource
```

If you find yourself writing `/getArticles` or `/deleteArticle?id=42`, you've smuggled the verb into the URL — that's RPC wearing a REST costume. The whole point of REST is that the HTTP method *is* the verb, which is what makes it uniform, cacheable, and predictable.

## ⚙️ How it actually works

REST's real value is that it **reuses HTTP's semantics** instead of reinventing them:

- **Statelessness** — each request is self-contained (auth token, everything). The server holds no session, so any node can serve any request → horizontal scaling.
- **Uniform interface** — the same small verb set works across every resource, so clients are predictable and tooling is generic.
- **Cacheable** — GETs are safe/idempotent, so browsers, CDNs, and proxies can cache them using `ETag`/`Cache-Control`. This is a huge, free win RPC-style APIs forfeit.
- **Correct status codes** — `201 Created` + `Location` for a new resource; `204 No Content` for a delete; `404`, `409 Conflict`, `422 Unprocessable`. The status *is* part of the contract.

**JSON** is the payload convention: use consistent casing, ISO-8601 dates, and return objects (not bare arrays) at the top level so you can add pagination/metadata later without a breaking change.

REST's weakness — **over/under-fetching** (one endpoint returns too much, or you need three round trips to assemble a screen) — is exactly the gap **GraphQL** and **BFF** patterns exist to fill. Knowing *when REST stops being the right tool* is the senior signal.

## 💻 Code

```http
POST /api/v1/articles HTTP/2
Content-Type: application/json

{ "title": "Hello", "body": "..." }
```

```http
HTTP/2 201 Created
Location: /api/v1/articles/42          # the created resource's URL
{ "id": 42, "title": "Hello", "createdAt": "2026-07-14T10:00:00Z" }
```

```json
// ✅ Envelope the top level so pagination/metadata can be added non-breakingly.
{
  "data": [ { "id": 1 }, { "id": 2 } ],
  "page": { "next": "/api/v1/articles?cursor=abc", "total": 128 }
}
```

```js
// Consuming it: check status, then parse. Cursor pagination beats offset at scale.
async function listArticles(cursor) {
  const res = await fetch(`/api/v1/articles?cursor=${cursor ?? ''}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

## ⚖️ Trade-offs

- **REST vs GraphQL:** REST gives you free HTTP caching and simplicity; GraphQL kills over/under-fetching and gives one flexible endpoint, at the cost of caching complexity and its own footguns (N+1, query cost). Choose REST for resource-shaped, cacheable data; GraphQL for deeply nested, client-driven views.
- **Offset vs cursor pagination:** offset (`?page=3`) is simple but breaks and skips rows as data shifts; cursor pagination is stable and scales — the interview-preferred answer for large datasets.
- **Versioning:** URL (`/v1/`) is explicit and cache-friendly; header versioning is cleaner but harder to debug. Pick one and commit — an unversioned public API is a trap.
- **When NOT to be dogmatic:** a single "do this workflow" action (e.g. `POST /orders/42/refund`) is legitimately RPC-shaped. Forcing it into pure resource semantics is worse than a pragmatic action endpoint.

## 💣 Gotchas interviewers probe

- **"Is JSON-over-HTTP automatically REST?"** No — REST requires resource modelling, correct verbs/status codes, and statelessness. Most "REST APIs" are really RPC.
- **PUT vs PATCH** — PUT *replaces* the whole resource (and is idempotent); PATCH *partially* updates (and generally isn't). Sending a partial body with PUT can wipe fields.
- **Idempotency** — GET/PUT/DELETE must be safely retryable; POST isn't. Retried POSTs duplicate → use an idempotency key.
- **Returning `200` with an error body** breaks clients, caches, and monitoring that key off status codes. Use real codes.
- **Over/under-fetching** — naming this and pointing to GraphQL/BFF as the fix shows you know REST's limits.
- **HATEOAS** (hypermedia links in responses) is "true REST" per the thesis, but rarely fully implemented — know it exists, don't die on that hill.

## 🎯 Say this in the interview

> "REST is an architectural style, not a wire format — the discipline is nouns in the URL and verbs in the HTTP method, so I model resources like `/articles/42` and act on them with GET, POST, PUT, PATCH, DELETE rather than inventing `/getArticle` endpoints. The payoff is that I inherit HTTP's machinery for free: statelessness gives horizontal scaling, GETs are cacheable by browsers and CDNs via ETag and Cache-Control, and status codes are part of the contract — 201 with a Location for creates, 204 for deletes. JSON is just the payload; I envelope the top level so I can add pagination later without breaking clients, and I prefer cursor pagination over offset at scale. The honest limitation I'd raise is over- and under-fetching — when a screen needs data from many resources, that's where GraphQL or a backend-for-frontend earns its place."

## 🔗 Go deeper

- [MDN — REST glossary](https://developer.mozilla.org/en-US/docs/Glossary/REST) — the definition, precisely.
- [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods) — PUT vs PATCH, idempotency.
- [Microsoft — REST API design best practices](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) — pragmatic, production-grade guidance.
- [How to GraphQL — GraphQL vs REST](https://www.howtographql.com/basics/1-graphql-is-the-better-rest/) — where REST's limits start.
