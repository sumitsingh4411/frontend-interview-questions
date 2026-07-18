<div align="center">

# State architecture (where state lives)

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1h · `#state` `#architecture`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Almost every "state management" problem is really a *placement* problem. State has a natural home: the **narrowest scope shared by everything that reads it**. Put it any wider and you pay in re-renders, coupling and stale data; any narrower and you can't share it. Start local, lift only when a second reader appears, and never store what you can derive.

---

## 🧠 Mental model

"Which state library should I use?" is the wrong first question. The right one is **what *kind* of state is this?** There are really only about six kinds, and each has a home:

| Kind | Source of truth | Lives in |
|---|---|---|
| **Server cache** — data you don't own | the server | React Query / SWR / RTK Query |
| **URL state** — filters, tab, page, selected id | the URL | the router / `searchParams` |
| **Local UI** — open, hover, input draft | the component | `useState` / `useReducer` |
| **Shared client** — theme, auth session, cart | the app | context or a store (Zustand/Redux) |
| **Form state** — values, dirty, errors | the form | a form lib or local reducer |
| **Derived** — filtered list, totals, "isValid" | *nothing* | computed on render |

The staff-level move is refusing to blur these together. The classic disaster is one global Redux store holding **all six** — server responses, form drafts, and modal-open booleans side by side — because then every unrelated thing shares one lifetime, one invalidation story, and one re-render surface.

## ⚙️ How it actually works

Two forces decide where state belongs: **scope** (who reads it) and **lifetime** (how long the truth is valid).

**Colocation is the default.** Keep state as close to where it's used as possible. Local state is trivially testable, disappears when the component unmounts, and re-renders only its own subtree. You lift it up **only when a second consumer appears** — and you lift it to the *lowest common ancestor*, not to the top. Lifting to the root "just in case" is how you get a component that re-renders on every keystroke happening three routes away.

**Server cache is not client state — this is the insight most candidates miss.** Data fetched from an API is a *cache* of something you don't own, so its hard problems are staleness, revalidation, deduplication and request status — not storage. Hand-rolling that in Redux means reimplementing caching, and you'll do it worse. A cache library gives you `isLoading`/`isStale`/`invalidate` for free; a plain store gives you a snapshot that's wrong the moment someone else writes.

**The URL is shared, persistent, linkable state.** Filters, the active tab, pagination and the selected row belong in `?search` params, not `useState` — otherwise refresh loses it, the back button breaks, and you can't paste a link that reproduces the view. If a PM ever says "let me send you this exact view", that state must be in the URL.

**Don't store derived state.** `isValid`, `filteredItems`, `total` are *functions of* other state. Storing them creates two sources of truth that drift. Compute on render; memoize only if the profiler says so.

## 💻 Code

```jsx
// ❌ Everything jammed into one global store — six kinds of state, one home
dispatch(setUser(res.user));        // server cache pretending to be client state
dispatch(setSearchQuery('shoes'));  // belongs in the URL
dispatch(setModalOpen(true));       // belongs in the component
dispatch(setFilteredList(filtered));// derived — now it can drift from the source
```

```jsx
// ✅ Each kind in its natural home
function Products() {
  // URL state: shareable, survives refresh, back button works
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';

  // Server cache: staleness/dedup/status handled for you
  const { data, isLoading } = useQuery({
    queryKey: ['products', q],
    queryFn: () => fetchProducts(q),
  });

  // Local UI state: nobody else needs it, so it stays here
  const [selected, setSelected] = useState(null);

  // Derived: computed, never stored
  const total = data?.reduce((s, p) => s + p.price, 0) ?? 0;

  return /* ... */;
}
```

## ⚖️ Trade-offs

- **Global state is a re-render tax.** Every consumer of a context/store slice re-renders when it changes. Wide state = wide blast radius. Colocation keeps re-renders local and makes components self-contained and testable.
- **When a single global store is *right*:** genuinely app-wide client truth with many writers and readers — auth session, feature flags, a cross-page cart, collaborative/offline state. Don't cargo-cult Redux for an app whose only "global" state is the current user.
- **Context is dependency injection, not a state manager.** It has no selectors — any value change re-renders every consumer. Great for stable, rarely-changing things (theme, current user); bad for high-frequency updates. Reach for a store with selectors when updates are hot.
- **Prop drilling is not automatically a smell.** Two levels of props is clearer than a context you have to hunt for. Introduce shared state to *solve a real sharing problem*, not preemptively.

## 💣 Gotchas interviewers probe

- **"Where does server data go?"** If the answer is "Redux," probe deeper. Server data is a *cache* — it needs invalidation, not a setter. The senior answer names React Query/SWR and the words *staleness* and *dedup*.
- **Lifting too high.** Putting form-input state at the app root so "everything can access it" re-renders the world on every keystroke. Lift to the lowest common ancestor, no higher.
- **Storing derived state.** Keeping `filteredList` in state next to `list` guarantees they drift. Derive it. The only reason to store a computed value is a *measured* perf problem, and even then you memoize, not duplicate.
- **URL state trapped in `useState`.** Filters that vanish on refresh and break the back button. If it should be linkable, it lives in the URL.
- **Context re-render surprise.** Passing `{user, setUser}` as a fresh object literal every render busts every consumer even when `user` didn't change. Memoize the value, or split contexts.
- **One store for isolation-critical state.** Multi-tenant or per-widget state in a singleton store leaks across instances. Some state *wants* to be local precisely so instances don't collide.

## 🎯 Say this in the interview

> "I don't start from 'which library' — I start from 'what kind of state is this?' I sort it into server cache, URL state, local UI, shared client, form, and derived, because each has a natural home. Server data is a cache, so it belongs in something like React Query that handles staleness and dedup, not a hand-rolled store. Anything linkable — filters, tabs, the selected id — goes in the URL so refresh and the back button work. Everything else starts local and I lift it only when a second reader appears, and only to the lowest common ancestor. Derived values I compute, never store, so there's one source of truth. A global store earns its place for genuinely app-wide client state with many writers — auth, flags, cart — but reaching for it by default is how you get an app that re-renders the world on every keystroke."

## 🔗 Go deeper

- [React — Sharing state between components](https://react.dev/learn/sharing-state-between-components) — lifting state up and choosing the owner, from the source.
- [React — Choosing the state structure](https://react.dev/learn/choosing-the-state-structure) — avoiding redundant and derived state.
- [TkDodo — Practical React Query](https://tkdodo.eu/blog/practical-react-query) — why server cache is not client state, in depth.
- [Kent C. Dodds — Application state management](https://kentcdodds.com/blog/application-state-management-with-react) — colocation and the "lift only when needed" discipline.
