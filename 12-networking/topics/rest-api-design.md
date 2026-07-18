<div align="center">

# REST API design

<sub>📡 Networking · 🟡 Medium · ⏱ 1h · `#rest` `#api`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — REST models your domain as **resources** (nouns) addressed by URLs, manipulated with HTTP **methods** (verbs), leaning on HTTP's built-in semantics for caching, status, and idempotency. Good REST is boring and predictable; the design skill is picking resource boundaries, using status codes honestly, and knowing when REST's chattiness means you've outgrown it.

---

## 🧠 Mental model

REST's core move: **don't invent verbs, invent nouns.** The HTTP methods are already your verbs. So instead of `POST /createOrder` and `POST /getOrder`, you have one resource — `/orders` — and let the *method* say what to do:

```
GET    /orders          → list orders          (safe, cacheable)
POST   /orders          → create an order       (returns 201 + Location)
GET    /orders/42       → fetch one order        (safe, cacheable)
PUT    /orders/42       → replace order 42        (idempotent)
PATCH  /orders/42       → partial update
DELETE /orders/42       → delete order 42         (idempotent)
GET    /orders/42/items → the order's line items  (nested resource)
```

The payoff is **uniformity**: any client can guess how a resource behaves, and the entire HTTP ecosystem (caches, CDNs, proxies) already understands these semantics. A `GET` is cacheable *because* REST promises it's safe. You're not designing an API so much as *mapping your domain onto HTTP's existing rules.*

## ⚙️ How it actually works

**Resources are nouns; URLs identify them; methods act on them.** URLs should be **plural collections** (`/users`, not `/user`) with IDs for members (`/users/7`). Verbs in a URL (`/getUser`, `/users/7/delete`) are the classic anti-pattern — the method already carries the verb, and putting it in the path breaks caching (`GET /deleteUser` is cacheable and prefetchable).

**Statelessness.** Each request carries everything the server needs — typically an `Authorization` token — because the server holds no session between calls. This is what lets you put any server behind a load balancer; there's no sticky session to preserve.

**Use HTTP status codes honestly.** `201` for creates (with a `Location` header), `204` for a body-less delete, `400`/`422` for bad input, `401` vs `403`, `409` for conflicts, `429` for rate limits. Returning `200 { "error": ... }` for everything throws away HTTP's most useful feature and forces clients to parse bodies to detect failure.

**Cross-cutting concerns as query params & headers**, not new endpoints:
- **Filtering/sorting/pagination:** `GET /orders?status=paid&sort=-created&limit=20&cursor=…`
- **Versioning:** `/v2/orders` (simple, cache-friendly) or an `Accept` header (`application/vnd.api+json;version=2`). URL versioning wins on debuggability.
- **Idempotency:** since `POST` isn't idempotent, accept an `Idempotency-Key` header so a retried create doesn't double-charge.

**REST's real weakness: chattiness.** Rendering a dashboard often means `GET /user`, then `GET /user/orders`, then `GET /orders/{id}/items` for each — the **N+1 / waterfall** problem. And each endpoint returns a *fixed shape*, so mobile over-fetches fields it doesn't need. These two — under-fetching (many round trips) and over-fetching (too much per response) — are exactly what GraphQL and BFFs (backend-for-frontend) exist to address.

## 💻 Code

```http
### Create — return 201 with where the new thing lives
POST /api/v1/orders
Content-Type: application/json
Idempotency-Key: 3f9a...   # retry-safe: same key ⇒ server returns the SAME order
{ "items": [{ "sku": "A1", "qty": 2 }] }

HTTP/1.1 201 Created
Location: /api/v1/orders/42
{ "id": 42, "status": "pending", "total": 1998 }
```

```http
### List — filter, sort, paginate via query params (NOT new endpoints)
GET /api/v1/orders?status=paid&sort=-created_at&limit=20&cursor=eyJpZCI6NDJ9

HTTP/1.1 200 OK
Cache-Control: private, max-age=30
{ "data": [ ... ], "next_cursor": "eyJpZCI6NjJ9" }
```

```js
// ❌ RPC-in-a-URL: verbs in the path, everything a POST, 200-with-error bodies
POST /api/getUserOrders   { userId: 7 }        // not cacheable, not discoverable

// ✅ Resource-oriented: nouns + methods + honest status codes
GET  /api/v1/users/7/orders                     // cacheable, obvious, self-describing
```

## ⚖️ Trade-offs

- **REST shines for resource-shaped CRUD domains** and public APIs where HTTP caching, proxies, and broad tooling matter. It's the sensible default.
- **Not everything is a resource.** Genuine *actions* — "publish", "cancel", "send email" — map awkwardly to CRUD. Pragmatic REST models them as sub-resources (`POST /orders/42/cancellation`) or accepts a controller-style endpoint. Don't contort a workflow into fake nouns.
- **Chatty by design.** When one screen needs data from many resources, REST's round trips add latency. Consider a **BFF** that composes server-side, or GraphQL where clients specify exactly what they need.
- **Fixed response shapes** cause over-fetching on constrained clients. Sparse fieldsets (`?fields=id,name`) help but re-implement part of GraphQL badly.
- **HATEOAS** (hypermedia links in responses) is REST's "purest" form and almost nobody does it — pragmatic REST with good docs (OpenAPI) is the industry reality. Know it exists; don't die on that hill.

## 💣 Gotchas interviewers probe

- **Verbs in URLs.** `/createUser`, `/users/7/delete` — the giveaway that someone's doing RPC and calling it REST. The method *is* the verb.
- **`PUT` vs `PATCH`.** `PUT` replaces the whole resource and is idempotent; `PATCH` is partial and not guaranteed idempotent. Sending a partial body to `PUT` can wipe unspecified fields.
- **`POST` isn't idempotent** — so retries can duplicate. Idempotency keys are the senior answer for creates/payments.
- **Returning `200` for errors** defeats caching, monitoring, and client error-handling. Use the right status.
- **Pagination via `offset` on live data** skips/duplicates rows as data shifts — cursor pagination is more correct at scale.
- **Statelessness vs auth:** JWTs are stateless but can't be revoked easily; opaque session tokens are revocable but need a store. That trade-off is a favourite follow-up.

## 🎯 Say this in the interview

> "REST maps a domain onto HTTP: resources are nouns addressed by URLs, and HTTP methods are the verbs, so instead of `POST /createOrder` I have `/orders` with GET, POST, PUT, PATCH, DELETE carrying the intent. The payoff is uniformity — the whole caching and proxy ecosystem already understands these semantics, and a `GET` is cacheable precisely because REST promises it's safe. I keep it stateless with a token per request, use status codes honestly rather than 200-with-an-error-body, and push filtering, sorting, pagination, and versioning into query params and headers instead of inventing endpoints. Because `POST` isn't idempotent, I accept an idempotency key so retried creates don't double-charge. The honest weakness is chattiness: one screen often needs many resources, causing request waterfalls, and fixed shapes over-fetch on mobile — that's the point where I'd reach for a BFF or GraphQL."

## 🔗 Go deeper

- [MDN — REST glossary](https://developer.mozilla.org/en-US/docs/Glossary/REST) — the concise definition and constraints.
- [MDN — HTTP request methods](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods) — safe/idempotent semantics your design relies on.
- [Microsoft — REST API design guidelines](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design) — the most practical, opinionated real-world reference.
- [Stripe API reference](https://docs.stripe.com/api) — a gold-standard REST API: idempotency keys, pagination, versioning done right.
