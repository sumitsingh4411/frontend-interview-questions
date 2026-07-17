<div align="center">

# Client vs server state (the key distinction)

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#concepts`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Server state is a cache of data you don't own** — asynchronous, shared with other clients, and stale the instant it arrives. **Client state is data you do own** — synchronous and private. Conflate them and you'll hand-roll a worse caching library inside Redux.

---

## 🧠 Mental model

The one question that sorts every piece of state in your app: **where does the source of truth live?**

- **Client state** — the truth lives in *this* browser tab. The open modal, the active tab, a form draft, the current theme. No server can contradict it. It is synchronous: you set it, it's set.
- **Server state** — the truth lives on a machine you reach over the network. The order list, the user's profile, a product's price. Your app only ever holds a *copy*, and that copy is stale the moment you receive it, because another client (or a cron job, or the user on their phone) can mutate the real thing.

That single difference cascades. Server state is inherently asynchronous (loading / error / success), **shared**, potentially out-of-date, and needs revalidation, request deduplication, retries, and cache eviction. Client state has *none* of those problems. Bucketing them together as "global state" is the original sin of frontend architecture.

## ⚙️ How it actually works

The properties diverge on almost every axis:

| | Client state | Server state |
|---|---|---|
| Source of truth | The browser | A remote server |
| Sync model | Synchronous | Asynchronous (has loading/error) |
| Ownership | Yours, exclusively | Shared; you hold a cache |
| Freshness | Always current | Can go stale under you |
| Needs | set / read | fetch, cache, dedupe, revalidate, retry, GC |

Here's the tell. When a team says *"we need Redux for our global state,"* inspect what's actually in the store. Most of it is fetched data — API responses parked in a slice, kept fresh by hand with thunks, and imperatively invalidated after mutations. **That is a hand-rolled, buggier reimplementation of a caching library.** TanStack Query, RTK Query, and SWR do that job declaratively: a keyed cache with staleness policies, background refetch, dedup, and lifecycle.

The diagnostic question: *does this state have a `useEffect` that fetches it and a `loading` flag beside it?* If yes, it's server state, and it does not belong in the same abstraction as `isSidebarOpen`.

## 💻 Code

```jsx
// ❌ Server state smuggled into a client-state store.
// You now own caching, staleness, dedup, and invalidation — by hand, forever.
function useUsers() {
  const dispatch = useDispatch();
  const users = useSelector((s) => s.users.list);
  useEffect(() => {
    dispatch(setLoading(true));
    fetch('/api/users').then((r) => r.json())
      .then((u) => dispatch(setUsers(u)))    // no dedup: two components = two fetches
      .finally(() => dispatch(setLoading(false)));
  }, [dispatch]);                            // no staleness, no refetch-on-focus, no retry
  return users;
}

// ✅ Server state as what it is: a cache. The library owns the hard parts.
function useUsers() {
  return useQuery({
    queryKey: ['users'],       // identity → automatic dedup + sharing across components
    queryFn: () => fetch('/api/users').then((r) => r.json()),
    staleTime: 30_000,         // freshness policy is a config value, not code you write
  });
}
```

Client state stays tiny and local:

```jsx
const [isOpen, setIsOpen] = useState(false); // owned, synchronous, private — no cache needed
```

## ⚖️ Trade-offs

- **A query cache is not a general state manager.** It's superb for read-through server data, but don't force genuinely client-only state (wizard step, drag position) into query keys — that's the mirror-image mistake.
- **Two tools, on purpose.** The mature stack is usually a *server-cache* library **plus** a small *client-state* store (Zustand/Jotai/Context). Reaching for one hammer for both is the smell.
- **When NOT to split:** a tiny app with three fetches and no cross-client mutation can get away with `useState` + `fetch`. The distinction earns its keep once data is shared, mutated, and revalidated.

## 💣 Gotchas interviewers probe

- **"Isn't fetched data just global state?"** No — and this is *the* question. Global vs local is about *scope*; client vs server is about *ownership and freshness*. A value can be global client state (theme) or local server state (one widget's data). The axes are independent.
- **Staleness is not a bug you fix once.** The moment you cache server data you've made a *deliberate trade*: show possibly-stale data instantly vs block on the network. `staleTime`/revalidation is where you tune it.
- **Optimistic updates blur the line.** You write to the client cache before the server confirms — now you're holding *unconfirmed* server state and must reconcile or roll back on error.
- **"Just put it in Context"** turns server state into a manual cache with no invalidation and a re-render storm. Context is transport, not a cache.
- **Most "we need Redux" arguments evaporate** once server state moves to a query library. What's left is often small enough for `useState` + one lightweight store.

## 🎯 Say this in the interview

> "I split state by ownership first, not by scope. Client state — modals, form drafts, selected tabs — lives in the browser, it's synchronous, and I own it outright. Server state — anything fetched — is fundamentally a *cache* of data that lives on a server, so it's asynchronous, shared, and stale the instant it arrives. The mistake I see everywhere is treating fetched data as 'global state' and parking it in Redux, which means you end up hand-rolling caching, deduplication, and invalidation badly. I'd reach for a query library like TanStack Query for server state, because staleness and refetching become configuration instead of code, and keep a small client store only for the genuinely client-owned bits. Two tools, because they're two different problems."

## 🔗 Go deeper

- [TanStack Query — Overview](https://tanstack.com/query/latest/docs/framework/react/overview) — the canonical articulation of why server state is its own category.
- [TanStack Query — Important Defaults](https://tanstack.com/query/latest/docs/framework/react/guides/important-defaults) — staleness, dedup, and refetch, made explicit.
- [Kent C. Dodds — Application State Management](https://kentcdodds.com/blog/application-state-management-with-react) — colocation and the case against one global bucket.
- [SWR — Getting Started](https://swr.vercel.app/) — the same stale-while-revalidate model, framed differently.
