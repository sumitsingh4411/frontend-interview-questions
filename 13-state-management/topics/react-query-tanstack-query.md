<div align="center">

# React Query / TanStack Query

<sub>🗃️ State management · 🔴 Hard · ⏱ 1.5h · `#server-state` `#caching`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — React Query is **not a data-fetching library** — it never fetches anything, you do. It's an async **cache** keyed by a serialisable key, wrapped in a state machine that knows the difference between "I have no data" and "I have data that might be old", and that distinction is the entire product.

---

## 🧠 Mental model

Server state isn't state — it's a **cached snapshot of something you don't own**. It goes stale without telling you, it's shared by every tab and every user, and it's asynchronous by nature. Trying to store it in Redux is trying to own something that belongs to a database in another datacentre.

React Query models it honestly with two axes that most people collapse into one:

| | Meaning | Controlled by |
|---|---|---|
| **Fresh vs stale** | Do I trust this data enough to *not* refetch? | `staleTime` |
| **Cached vs collected** | Is the data still in memory at all? | `gcTime` |

A query can be **stale but cached** — that's the sweet spot, and it's the whole stale-while-revalidate play: render the stale data *instantly*, refetch in the background, swap it in. The user sees zero spinners after the first visit.

The unit of caching is the **query key**. `['todos', { status: 'done' }]` is hashed deterministically (object key order doesn't matter), and that hash *is* the cache entry. Say it out loud: **the query key is a dependency array**. Anything your `queryFn` closes over must be in it, or you'll serve one filter's data under another filter's key.

## ⚙️ How it actually works

There's a `QueryCache` holding `Query` objects. A `Query` owns the data, the status, and a list of **observers** — one per `useQuery` call mounted anywhere in the tree. This indirection explains almost every behaviour people find magical:

- **Deduplication.** Ten components calling `useQuery({ queryKey: ['user', 1] })` create ten observers on *one* Query. One in-flight request. This is why prop-drilling data "for performance" is an anti-pattern here — just call the hook again.
- **`gcTime` starts when the last observer unmounts**, not on a timer from fetch. Default 5 minutes. A query with zero observers is *inactive* and eligible for garbage collection; it will never refetch on focus.
- **`staleTime` defaults to `0`.** Every mount, every window focus, every reconnect triggers a refetch. This is the single most consequential default in the library, and for most data it is wrong — a user list does not change between two tab switches four seconds apart. Setting `staleTime: 30_000` globally removes a startling amount of network traffic.

**Structural sharing** is the trick nobody notices until they hit it. After every fetch, React Query deep-compares the new response to the cached one and **reuses the old object references for unchanged subtrees**. If your API returns 500 identical todos and one changed title, only that todo's object identity changes — so `React.memo` and `useMemo` downstream actually hold. Poll a stable endpoint every 5s and you get zero re-renders. This requires JSON-compatible data; it silently bails on class instances.

**`select` is the escape hatch for render scope.** It runs after structural sharing and lets an observer subscribe to a *slice*, so the component only re-renders when that slice changes.

## 💻 Code

```ts
// ❌ userId isn't in the key. Switch users → you serve user 1's data as user 2's,
//    forever, because the cache never learns they're different.
useQuery({ queryKey: ['user'], queryFn: () => fetchUser(userId) });

// ✅ The key IS the dependency array.
useQuery({ queryKey: ['user', userId], queryFn: () => fetchUser(userId) });
```

Pass the key straight into the function so it can't drift — this is why `queryFn` receives context:

```ts
const userQuery = (id: string) => ({
  queryKey: ['user', id] as const,
  queryFn: ({ queryKey: [, userId], signal }) => fetchUser(userId, { signal }),
  //                                   ^^^^^^ wire AbortSignal → RQ cancels
  //                                          superseded requests for free
  staleTime: 60_000, // trust it for a minute; kills the focus-refetch storm
});
```

The v5 status model — read it precisely:

```ts
const { data, status, fetchStatus, isPlaceholderData } = useQuery(userQuery(id));

// status      → 'pending' | 'error' | 'success'   — do I HAVE data?
// fetchStatus → 'fetching' | 'paused' | 'idle'    — is a request IN FLIGHT?
//
// They're orthogonal, and that's the point:
//   pending + fetching → first load. Show the skeleton.
//   success + fetching → background revalidation. Show DATA, not a spinner.
//   pending + paused   → offline, request queued.
```

Rendering a spinner on `isFetching` instead of `isPending` throws away stale-while-revalidate entirely — you reintroduce the flash you installed the library to remove.

Keeping the previous page visible while the next one loads:

```ts
import { keepPreviousData } from '@tanstack/react-query';

useQuery({
  queryKey: ['todos', page],
  queryFn: () => fetchTodos(page),
  placeholderData: keepPreviousData, // no layout collapse between pages
});
```

## ⚖️ Trade-offs

- **It replaces your global store for server data — not for client state.** Modal open? Wizard step? Selected rows? That's client state; put it in `useState`/Zustand. Teams that stuff UI state into query cache end up fighting invalidation for things that were never stale.
- **`staleTime: 0` is a defensible default for a library and a bad default for an app.** The library can't know your data's volatility, so it picks "always suspect". You *do* know. Set it per-query: a currency rate is 5 seconds, an org's permission list is 5 minutes, a country list is `Infinity`.
- **Don't use it when there's no cache to speak of.** A one-shot mutation-only screen, or a websocket firehose where every message is authoritative, gains nothing — you're paying bundle size and indirection for a cache you never read twice.
- **Query keys become an API surface.** Ad-hoc string arrays scattered across 200 components make invalidation guesswork. Centralise them in a query-key factory (or use `@lukemorales/query-key-factory`) so `invalidateQueries` can be reasoned about.
- **Suspense mode moves the loading state to the boundary**, which is cleaner — but a `useSuspenseQuery` in a component that also renders siblings will waterfall unless you hoist or prefetch.

## 💣 Gotchas interviewers probe

- **"What's the difference between `staleTime` and `gcTime`?"** The canonical filter question. `staleTime` = how long data is *trusted*; `gcTime` = how long unobserved data is *retained*. Setting `gcTime < staleTime` is nonsense — you throw data away while still claiming it's fresh.
- **`refetchOnWindowFocus` gets blamed for "it fetches constantly".** The real cause is `staleTime: 0`. Focus refetch only fires for **stale** queries. Turning off focus refetching to fix it is treating the symptom and losing a genuinely great feature.
- **`isLoading` vs `isFetching`.** `isLoading` (v5: `isPending && isFetching`) means *no data yet*. `isFetching` is true on every background revalidation too. Wire your skeleton to the first, a subtle top-bar to the second.
- **`initialData` vs `placeholderData`.** `initialData` is **written into the cache** and is subject to `staleTime` — pass fake data and you've poisoned the cache. `placeholderData` is observer-level only, never persisted, and flagged by `isPlaceholderData`. If it came from the server (e.g. an SSR payload or a list you already fetched), use `initialData` — and pass `initialDataUpdatedAt` so staleness is computed from when *the server* produced it, not when you mounted.
- **Mutations aren't cached and don't invalidate anything by themselves.** `useMutation` has no key and no cache entry. The refetch happens because *you* call `queryClient.invalidateQueries` in `onSuccess`. Candidates routinely assume it's automatic.
- **Returning the promise from `onSuccess`.** `invalidateQueries()` is fire-and-forget; `return queryClient.invalidateQueries(...)` keeps the mutation `isPending` until the refetch settles, so the button stays disabled until the screen is actually correct. Almost always what you want.
- **`invalidateQueries({ queryKey: ['todos'] })` is prefix-matching**, so it nukes `['todos', 1]`, `['todos', { done: true }]`, everything below. Powerful and easy to over-fire. It marks stale + refetches *active* queries only; inactive ones refetch on next mount.
- **A `queryFn` must throw on error.** `fetch` doesn't reject on a 404/500 — it resolves with `ok: false`. Forget to check `res.ok` and React Query happily caches your error page as `success` data.

## 🎯 Say this in the interview

> "I treat server state as fundamentally different from client state: it's a cached copy of data I don't own, so the question is never 'what is it' but 'how much do I trust it'. React Query models that with two independent clocks — `staleTime`, how long data is trusted before it's worth revalidating, and `gcTime`, how long it stays in memory after the last component unmounts. The default `staleTime` of zero is why people say it refetches constantly; I set it per query based on how volatile the data actually is. The key insight for rendering is that `status` and `fetchStatus` are orthogonal — `success` plus `fetching` means I already have data and I'm revalidating in the background, so I render the data, not a spinner. That's stale-while-revalidate, and it's the reason the app feels instant after the first load. I also treat the query key as a dependency array: anything the fetch function closes over goes in the key, or the cache lies to me."

## 🔗 Go deeper

- [TanStack Query — Docs](https://tanstack.com/query/latest) — the guides on caching and query invalidation are unusually well written; read them in order.
- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) — the single highest-value page. Every "why does it do that" is answered here.
- [TkDodo — Practical React Query](https://tkdodo.eu/blog/practical-react-query) — the maintainer's blog series. "React Query as a State Manager" and "Effective React Query Keys" are essential.
- [TkDodo — Inside React Query](https://tkdodo.eu/blog/inside-react-query) — the Query/Observer architecture, which is what makes the behaviour predictable rather than magic.
