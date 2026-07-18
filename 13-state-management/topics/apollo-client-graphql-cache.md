<div align="center">

# Apollo Client (GraphQL cache)

<sub>🗃️ State management · 🔴 Hard · ⏱ 1h · `#graphql` `#caching`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Apollo isn't a data-fetcher, it's a **normalized client-side graph**: every object with a `__typename` and `id` is stored once by a flat cache key, and every query is a *view* into that graph — so writing one mutation result can update every screen showing that object, with zero refetch.

---

## 🧠 Mental model

React Query caches by **query** — the response to `['todos']` is one blob. Apollo caches by **entity**. It walks the response, and any object carrying a `__typename` and an `id` (or a key you configure) is hoisted into a flat map under a key like `Todo:42`. Queries then store *references* (`{ __ref: 'Todo:42' }`), not copies.

The consequence is the whole point: if `Todo:42` appears in a list query, a detail query, and a sidebar count, they all point at the *same* cache object. Update it once — via a mutation response or a manual write — and **all three re-render**, consistently, without you telling them to. The cache is a **denormalized-in, normalized-out** graph database that happens to live in the browser.

The senior framing: Apollo's cache is the app's client-side source of truth. GraphQL's typed, self-describing responses are what *make* automatic normalization possible — REST can't do this because responses have no identity contract.

## ⚙️ How it actually works

**Normalization.** `InMemoryCache` computes a cache ID per object: `${__typename}:${id}` by default, overridable per type via `keyFields` (e.g. a `Book` keyed by `isbn`). Objects without an `id` get **embedded** in their parent (no independent identity) — a frequent surprise.

**Reading.** A query result is *reconstructed* by resolving refs against the normalized store. Two different queries selecting overlapping fields share storage; the cache can even answer a query entirely from cache if all fields are present (`fetchPolicy: 'cache-first'`, the default).

**Fetch policies** are the real control surface:
- `cache-first` (default) — cache if complete, else network. Fewest requests.
- `cache-and-network` — return cache *immediately*, fire network anyway, update on arrival. The stale-while-revalidate feel.
- `network-only` / `no-cache` — skip/ignore the cache. `no-cache` doesn't even write back.

**Mutations update the cache three ways:**
1. **Automatic** — if the mutation returns the mutated entity *with its id and changed fields*, Apollo merges it by cache key. Free consistency. This is why you always request the fields you changed.
2. **`update(cache, { data })`** — a manual writer for *structural* changes the server can't infer: adding to or removing from a list, which no entity-merge can do.
3. **Refetch** — `refetchQueries` or `awaitRefetchQueries`. The blunt instrument; a network round-trip.

**Pagination** needs a `merge` function in `typePolicies` (via `field policies`) to tell Apollo how to combine page N with page N+1 — otherwise the newer result *replaces* the older, and you lose the list.

## 💻 Code

```ts
const cache = new InMemoryCache({
  typePolicies: {
    Book: { keyFields: ['isbn'] },        // custom identity, not `id`
    Query: {
      fields: {
        feed: {                            // merge paginated results
          keyArgs: ['category'],           // separate cache entry per category
          merge(existing = [], incoming) { return [...existing, ...incoming]; },
        },
      },
    },
  },
});
```

```ts
// Adding an item: automatic merge CAN'T append to a list — do it manually.
const [addTodo] = useMutation(ADD_TODO, {
  update(cache, { data: { addTodo } }) {
    cache.modify({
      fields: {
        todos(existing = [], { toReference }) {
          return [...existing, toReference(cache.writeFragment({
            data: addTodo,
            fragment: gql`fragment New on Todo { id text }`,
          }))];
        },
      },
    });
  },
});
```

## ⚖️ Trade-offs

- **When NOT to use it:** a REST backend, or a small app. Apollo's power *is* normalization, which needs a graph + stable ids. On REST you get most of the value from React Query at a fraction of the bundle and concept load.
- **The cache is powerful but leaky-by-config.** Forget a `merge` policy and pagination silently breaks; forget to request the id and updates silently don't propagate. The magic has sharp, quiet edges.
- **Bundle + learning cost.** `typePolicies`, field policies, `cache.modify`, fragments, `keyArgs` — it's a real API surface. Teams underestimate it and cargo-cult `refetchQueries` everywhere, throwing away the whole benefit.
- **Great for highly relational, shared-entity UIs** (dashboards, social graphs, anything where the same object shows up in many places). That's where automatic cross-query consistency pays for itself.

## 💣 Gotchas interviewers probe

- **No `id`, no normalization.** Objects without an identifiable key are embedded in their parent and can't be updated independently or shared across queries. The single most common "why won't my UI update" bug.
- **Automatic merge only handles field updates, never list membership.** Adding/removing items *requires* an `update` function or a refetch. Candidates who think mutations "just work" get caught here.
- **`fetchPolicy` vs `nextFetchPolicy`.** `cache-and-network` on every render can hammer the network; `nextFetchPolicy: 'cache-first'` lets the first load revalidate and subsequent reads stay cheap.
- **`refetchQueries` is a smell at scale.** It's a network round-trip that discards the normalized cache's whole advantage. Prefer letting the mutation return the entity, or `cache.modify`.
- **Cache-only fields / local state.** Apollo can store client-only state (`@client`, reactive vars) in the same cache — often overkill, sometimes the reason a team drops Redux entirely.

## 🎯 Say this in the interview

> "The thing to understand about Apollo is that it normalizes — it's a client-side graph, not a query cache. Every object with a `__typename` and id is stored once under a key like `Todo:42`, and queries hold references into that store, so updating one entity re-renders every view that shows it, automatically. That's why I always request the fields I mutate: if the mutation returns the entity with its id, Apollo merges it for free. The catch is that automatic merge only updates fields — it can't add or remove list items, so for those I write an `update` function with `cache.modify`, not a refetch, because `refetchQueries` throws away the whole point. And I never forget: no id means no normalization — the object gets embedded in its parent and updates won't propagate. I'd reach for Apollo when the backend is GraphQL and entities are shared across many screens; on REST I'd use React Query instead."

## 🔗 Go deeper

- [Apollo — Caching overview](https://www.apollographql.com/docs/react/caching/overview) — normalization, cache IDs, the mental model from the source.
- [Apollo — Configuring the cache](https://www.apollographql.com/docs/react/caching/cache-configuration) — `typePolicies`, `keyFields`, `keyArgs`.
- [Apollo — Updating the cache after a mutation](https://www.apollographql.com/docs/react/data/mutations#updating-the-cache-directly) — automatic vs `update` vs refetch.
- [Apollo — Pagination & field policies](https://www.apollographql.com/docs/react/pagination/core-api) — the `merge` function that makes lists work.
