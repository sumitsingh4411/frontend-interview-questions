<div align="center">

# GraphQL

<sub>📡 Networking · 🟡 Medium · ⏱ 1.5h · `#graphql` `#api`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — GraphQL is a **query language over a single endpoint** where the *client* specifies exactly the fields it wants, in one round trip, against a strongly-typed schema. It cures REST's over-fetching and request waterfalls — and hands you a new bill: caching is hard, and a naive resolver graph is an **N+1 query** and a DoS vector.

---

## 🧠 Mental model

REST exposes many endpoints, each returning a **fixed shape** decided by the server. GraphQL flips the control: **one endpoint** (`POST /graphql`), and the *client* sends a query describing precisely the shape it wants back. The response mirrors the query 1:1.

```graphql
# One request replaces GET /user + GET /user/orders + GET /orders/:id/items
query {
  user(id: 7) {
    name                    # ← ask for exactly these fields
    orders(last: 3) {       # ← traverse relationships in ONE round trip
      total
      items { sku, qty }    # ← no over-fetch, no waterfall
    }
  }
}
```

The mental unlock: GraphQL is a **graph traversal**, not a set of endpoints. Your data has relationships (a user *has* orders, an order *has* items); GraphQL lets the client walk that graph in a single query, taking only the fields it names. The **schema** is the typed contract that makes this safe and introspectable.

## ⚙️ How it actually works

**Schema + resolvers.** You define types and fields in the Schema Definition Language; each field has a **resolver** — a function that returns its value. A query is executed by walking the tree and calling resolvers. This composability is the power *and* the trap: the executor calls resolvers per-field, per-item.

**Three operation types:** `query` (read, like GET), `mutation` (write, runs serially), `subscription` (a live stream over WebSocket for real-time updates).

**Everything is a `200 POST`.** GraphQL usually rides one `POST /graphql`, and even *errors* come back `200 OK` with an `errors` array in the body. Partial success is a first-class concept: you can get some data and some errors in the same response. This is why HTTP-level caching (CDN, browser) doesn't work out of the box — every request is the same opaque POST.

**The N+1 problem — the defining gotcha.** Query 100 users and each user's `company`. The naive executor calls the `company` resolver **100 times** — one DB hit per user. The fix is **DataLoader**: it *batches* the 100 individual `load(companyId)` calls made within one tick into a single `SELECT ... WHERE id IN (...)`, and caches within the request. Without DataLoader, GraphQL trades REST's over-fetching for a resolver-level query storm.

**Caching moves to the client.** No URL-based HTTP caching, so clients (Apollo, urql, Relay) maintain a **normalised cache** keyed by type + `id`. Fetch a `User:7` in one query and it updates everywhere it appears. This is genuinely more powerful than HTTP caching for a rich app — but it's *your* infrastructure now, not the CDN's.

**Security surface.** Because clients compose queries, a malicious one can request a deeply nested, expensive graph (`user → friends → friends → friends …`). You need **query depth limiting, complexity analysis, and persisted queries** (allow-listing known queries) — REST never had this problem because the server fixed every shape.

## 💻 Code

```graphql
# Schema: the typed contract, introspectable by tooling
type User { id: ID!, name: String!, orders: [Order!]! }
type Order { id: ID!, total: Int!, items: [Item!]! }
type Query { user(id: ID!): User }
```

```js
// ❌ N+1: this resolver runs once PER user in the list → 100 DB round trips
const resolvers = {
  User: {
    company: (user) => db.company.findById(user.companyId), // fires per user
  },
};

// ✅ DataLoader batches all companyId lookups in one tick into ONE query
const companyLoader = new DataLoader(async (ids) => {
  const rows = await db.company.findMany({ where: { id: { in: ids } } });
  return ids.map((id) => rows.find((r) => r.id === id)); // must return in input order
});
const resolvers = {
  User: { company: (user) => companyLoader.load(user.companyId) }, // batched + cached
};
```

```js
// Client: fetch exactly what the view needs — no over/under-fetch
const { data } = useQuery(gql`
  query { user(id: 7) { name orders(last: 3) { total } } }
`);
```

## ⚖️ Trade-offs

- **GraphQL wins when clients are diverse and data is graph-shaped** — many screens/platforms each needing different field subsets of interconnected data. It kills over-fetching and request waterfalls, and the typed schema + introspection give superb tooling and codegen.
- **When NOT to use it:** simple CRUD, file up/downloads, or a public API where HTTP caching and ubiquity matter — REST is simpler and cache-friendly. Adopting GraphQL for a two-endpoint app is over-engineering.
- **You inherit a server.** Schema design, resolver performance (DataLoader everywhere), query-cost limits, and client caching are real, ongoing work. GraphQL moves complexity from the client to the *system*.
- **Caching is a genuine downgrade** vs REST at the HTTP layer — you rebuild it in the client (normalised cache) and optionally at the edge with persisted queries.
- **Monitoring/rate-limiting is harder** — every call is the same POST, so per-endpoint metrics and simple rate limits don't apply; you rate-limit by query complexity instead.

## 💣 Gotchas interviewers probe

- **N+1 and DataLoader.** If you can describe GraphQL but can't explain the N+1 resolver explosion and batching, you've only read the marketing. This is *the* senior question.
- **Errors return `200`.** A failed GraphQL request is usually HTTP 200 with an `errors` array — so client error handling must inspect the body, not the status. And partial data + errors coexist.
- **Over-fetching solved, but query cost is now unbounded** — depth limiting and complexity analysis aren't optional in production.
- **"GraphQL is faster than REST" is not automatically true.** It saves round trips, but a poorly-batched resolver graph can hit the DB *more* than a well-designed REST endpoint.
- **No native HTTP caching.** People assume the browser caches it; it doesn't — it's an opaque POST.
- **Mutations run serially, queries in parallel** — a spec detail that matters when a mutation has dependent effects.

## 🎯 Say this in the interview

> "GraphQL inverts REST's control: instead of many fixed-shape endpoints, there's one endpoint and the client sends a query describing exactly the fields it wants, walking the data graph in a single round trip. That directly fixes REST's over-fetching and waterfall problems, and the typed schema gives you introspection and great codegen. But it's not free. The classic trap is N+1: the executor calls resolvers per field per item, so fetching each user's company fires one query per user — you fix it with DataLoader, which batches those loads within a tick into a single `IN` query and caches per request. Two more things I always flag: caching is a real downgrade because every call is an opaque POST that returns 200 even on errors, so HTTP caching doesn't apply and you rebuild it as a normalised client cache; and because clients compose queries, you need depth and complexity limits or a nested query becomes a DoS. I reach for GraphQL when clients are diverse and data is graph-shaped, and stick with REST for simple CRUD."

## 🔗 Go deeper

- [graphql.org — Learn](https://graphql.org/learn/) — the official, well-written intro to schema, queries, and execution.
- [Apollo — Understanding the N+1 problem & DataLoader](https://www.apollographql.com/docs/technotes/TN0203-nplusone-and-dataloader/) — the definitive treatment of the core gotcha.
- [GraphQL spec](https://spec.graphql.org/) — authoritative on execution order, errors, and type system.
- [Principled GraphQL](https://principledgraphql.com/) — opinionated best practices from the Apollo team on schema and operations.
