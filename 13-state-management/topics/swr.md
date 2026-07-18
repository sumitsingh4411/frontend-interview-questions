<div align="center">

# SWR

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#server-state` `#caching`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — SWR is stale-while-revalidate compressed into one hook: return the cached value **immediately**, revalidate in the background, re-render if it changed. It's React Query with the surface area cut by 80% — a global key→value map plus a broadcast channel — and for most apps that's not a compromise, it's the correct amount of library.

---

## 🧠 Mental model

The name is the algorithm, borrowed from [RFC 5861](https://datatracker.ietf.org/doc/html/rfc5861)'s HTTP `stale-while-revalidate` directive:

```
useSWR(key, fetcher)
   │
   ├─ cache HIT  → return stale data NOW (no spinner)  ──┐
   │                                                     ├─→ re-render if changed
   └─ always     → revalidate in background ────────────┘   (deep-equal? no-op)
```

The mental shift is that **the cache is the source of truth and the component is a subscriber to a key**. `useSWR('/api/user', fetcher)` doesn't mean "fetch this"; it means "*I am interested in whatever lives at this key, keep me current.*" Call it in twelve components and you get one request, twelve subscribers, and one re-render each when the value changes.

That reframing is why SWR has no `queryClient` ceremony. The key *is* the identity. Mutate the key from anywhere — an event handler, a websocket message, another module — and every subscriber updates. It's a pub/sub bus that happens to be filled by `fetch`.

## ⚙️ How it actually works

**Deduplication is time-windowed, not request-windowed.** `dedupingInterval` (default **2000ms**) means identical keys requested within 2 seconds share one response. This is subtly different from React Query's `staleTime`: it isn't "how long do I trust the data", it's "how long do I suppress duplicate requests". SWR has no long-lived freshness concept — it revalidates on mount, focus, and reconnect by default, and the deduping window is what stops that becoming a stampede.

**Revalidation triggers**, all on by default:

| Trigger | Option | Notes |
|---|---|---|
| Mount / key change | `revalidateOnMount` | Skipped if `fallbackData` is present and `revalidateIfStale: false` |
| Window focus | `revalidateOnFocus` | Throttled by `focusThrottleInterval` (5s) |
| Network reconnect | `revalidateOnReconnect` | Uses the `online`/`offline` events |
| Interval | `refreshInterval` | `0` = off. Pauses when hidden unless `refreshWhenHidden` |

**Conditional fetching is expressed by returning a falsy key**, not by a flag. `useSWR(user ? ['posts', user.id] : null, fetcher)` — a `null` key means "don't fetch, don't subscribe, stay in loading". This is how you serialise dependent requests without an `enabled` option, and it composes: any throw inside the key function is treated as "not ready yet".

**Deep comparison before re-render.** SWR runs a structural equality check (`stable-hash`) on the new value and skips the state update if nothing changed. Poll every second against an unchanging endpoint and React does no work. Same payoff as React Query's structural sharing, though SWR compares the whole value rather than preserving per-subtree references.

## 💻 Code

```js
import useSWR, { useSWRConfig } from 'swr';

const fetcher = (url) =>
  fetch(url).then((res) => {
    // ❗ fetch does NOT reject on 4xx/5xx. Without this, SWR caches
    //    your error page as valid data.
    if (!res.ok) throw Object.assign(new Error('Request failed'), { status: res.status });
    return res.json();
  });

function Profile({ id }) {
  const { data, error, isLoading, isValidating } = useSWR(`/api/user/${id}`, fetcher);

  // isLoading    → no data yet. Skeleton.
  // isValidating → a request is in flight, INCLUDING background revalidation.
  //                Never gate the skeleton on this — you'd throw SWR's whole
  //                point away and flash on every tab focus.
  if (isLoading) return <Skeleton />;
  if (error) return <Error status={error.status} />;
  return <User data={data} busy={isValidating} />;
}
```

Dependent + conditional fetching, without a single `if`:

```js
const { data: user } = useSWR('/api/me', fetcher);
// null key → suspended. Becomes a real key the instant `user` lands.
const { data: projects } = useSWR(() => `/api/projects?owner=${user.id}`, fetcher);
```

Mutation — local write, then reconcile:

```js
const { mutate } = useSWRConfig();

await mutate(
  '/api/todos',                                  // key to update
  updateTodoOnServer(todo),                      // promise → its result becomes the data
  {
    optimisticData: (cur) => [...cur, todo],     // paint immediately
    rollbackOnError: true,                       // revert if the promise throws
    populateCache: true,                         // trust the server response
    revalidate: false,                           // ...so don't refetch after
  }
);

// Prefix invalidation isn't built in — you filter the key map yourself:
mutate((key) => Array.isArray(key) && key[0] === 'todos', undefined, { revalidate: true });
```

## ⚖️ Trade-offs

- **The small surface is the feature.** No `QueryClient`, no provider required, ~4kB. If your data layer is "fetch some JSON and keep it fresh", SWR does it with a third of the concepts. Reaching for React Query here is buying a cache-management console you'll never open.
- **But it has no freshness model.** `dedupingInterval` is a stampede guard, not `staleTime`. If you need "this data is good for 5 minutes, don't even think about the network", you'll fake it with a large deduping interval and `revalidateIfStale: false`, and it'll feel like fighting the grain.
- **Mutations are second-class.** There's no `useMutation` lifecycle (`onMutate`/`onSettled`/retry/`isPending` per-call) beyond `useSWRMutation`. For a form-heavy, mutation-heavy admin app, React Query's mutation machinery is genuinely better and the extra size pays for itself.
- **No devtools story.** React Query's devtools let you *see* the cache — for a large team debugging invalidation, that alone justifies the switch.
- **No normalisation, no offline persistence, no infinite-query ergonomics out of the box.** `useSWRInfinite` exists but is clumsier than `useInfiniteQuery`.
- **When not to use it:** GraphQL with overlapping entity data (use Apollo/urql and a normalised cache), or anything where writes dominate reads.

## 💣 Gotchas interviewers probe

- **The array-key trap.** `useSWR(['/api/user', id])` works because SWR **hashes the key structurally**, not by reference — a fresh array each render is fine. Candidates assume it's `===` like a dependency array and go build a `useMemo` they don't need. (Note: SWR 1.x passed array keys as *multiple* fetcher arguments; 2.x passes the array as a single argument. Migrating and forgetting this silently breaks every multi-arg fetcher.)
- **`isValidating` vs `isLoading`.** `isLoading` = no data at all. `isValidating` = in flight, including the background refetch that SWR exists to make invisible. Gating a spinner on `isValidating` is the single most common misuse.
- **`fetch` doesn't throw on HTTP errors.** Your fetcher must check `res.ok`, or a 500 gets cached as `data` and `error` stays `undefined` forever.
- **`mutate(key)` with no data argument revalidates; `mutate(key, data, false)` writes without revalidating.** The third argument (`revalidate`) is the one people get backwards, then wonder why their optimistic write is immediately overwritten by a stale in-flight response.
- **Focus revalidation fires on every tab switch and on iOS whenever the app resumes.** With `dedupingInterval` at its 2s default and a slow endpoint, an idle dashboard can quietly generate thousands of requests a day. Raise `focusThrottleInterval` or scope it off for expensive keys.
- **`fallbackData` is not `initialData` semantics.** It's per-hook and doesn't populate the shared cache; `fallback` on `SWRConfig` seeds by key and is the right tool for SSR/RSC hydration.
- **Keys must be stable and complete.** Any variable the fetcher closes over belongs *in the key*. A key of `'/api/todos'` for a fetcher that reads a `filter` from scope will serve one filter's todos under every filter.

## 🎯 Say this in the interview

> "SWR is the stale-while-revalidate pattern from HTTP caching, as a hook: give me the cached value now, revalidate behind the scenes, re-render only if it actually changed. The model I keep in my head is that the key is the identity and the component is a subscriber — twelve components with the same key means one request and twelve subscribers, so I stop prop-drilling data for performance and just call the hook again. The distinction I'm careful about is `isLoading` versus `isValidating`: `isLoading` means I have nothing to show, `isValidating` means I'm refetching in the background — if I put a spinner on the second one I've thrown away the entire benefit. I'd pick SWR when the data layer is straightforward reads, because it's a fraction of the size and concepts; I'd reach for React Query when I need a real freshness model with `staleTime`, serious mutation lifecycles, or devtools to debug the cache."

## 🔗 Go deeper

- [SWR — Docs](https://swr.vercel.app/) — short enough to read end to end in an hour, and worth doing exactly that.
- [SWR — Global Configuration & Options](https://swr.vercel.app/docs/api) — the full options table; `dedupingInterval`, `revalidateIfStale` and `keepPreviousData` are where the behaviour actually lives.
- [SWR — Mutation](https://swr.vercel.app/docs/mutation) — `optimisticData`, `rollbackOnError`, `populateCache`, and the filter-function form of `mutate`.
- [RFC 5861 — HTTP Cache-Control stale-while-revalidate](https://datatracker.ietf.org/doc/html/rfc5861) — the original spec the pattern is named after. Understanding it at the HTTP layer makes the hook obvious.
- [web.dev — Keeping things fresh with stale-while-revalidate](https://web.dev/articles/stale-while-revalidate) — the same idea applied to the browser cache and service workers.
