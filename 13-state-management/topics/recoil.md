<div align="center">

# Recoil

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#recoil` `#atoms`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Recoil was Meta's atomic state library — **atoms** (units of state) and **selectors** (pure derived state) forming a data-flow graph with Suspense-native async — but it's effectively unmaintained now, so the honest interview answer is "know the model, but reach for Jotai."

---

## 🧠 Mental model

Recoil pioneered the **atomic** model in React's mainstream: rather than one store, you compose many **atoms** (a piece of state, addressed by a unique string `key`) and **selectors** (pure functions of atoms and other selectors). Together they form a directed **data-flow graph**. A component subscribes to exactly the atoms/selectors it reads via `useRecoilState` / `useRecoilValue`, so re-renders are surgical — only the components downstream of a changed node update. This is the same fine-grained-subscription pitch as Jotai (which Recoil directly inspired), solving Context's blunt "re-render every consumer" behaviour.

The distinctive Recoil idea is the **selector as first-class derived state**: a selector can be synchronous *or* asynchronous, can be read-only or writable, and Recoil memoises and caches it by its dependencies. Async selectors integrate with `<Suspense>` and error boundaries natively — data fetching modelled as derived state.

## ⚙️ How it actually works

Everything lives under a `<RecoilRoot>` that owns the atom store. `atom({ key, default })` defines writable state; the `key` **must be globally unique** (it's used for persistence and DevTools). `selector({ key, get, set? })` defines derived state; inside `get({ get })` you read other nodes and Recoil records the dependency edges, recomputing only when a dependency changes.

- **Async selectors:** return a Promise from `get` and reads of that selector *suspend*; combine with `<Suspense>` for loading and an error boundary for failure. `useRecoilValueLoadable` gives the non-suspending `{ state, contents }` form.
- **`atomFamily` / `selectorFamily`:** parameterised atoms/selectors — one definition, a family of instances keyed by a serialisable parameter (e.g. `todoAtomFamily(id)`).
- **Hooks:** `useRecoilState` (read+write), `useRecoilValue` (read), `useSetRecoilState` (write-only, no subscription), `useResetRecoilState`.

The graph rebuilds as dependencies change, and Recoil batches updates so a single interaction touching several atoms re-renders subscribers once.

## 💻 Code

```ts
import { atom, selector, atomFamily } from 'recoil';

export const priceAtom = atom({ key: 'price', default: 100 });
export const qtyAtom = atom({ key: 'qty', default: 2 });

// Derived (sync) selector — recomputes only when price/qty change.
export const totalSelector = selector({
  key: 'total',
  get: ({ get }) => get(priceAtom) * get(qtyAtom),
});

// Async selector — suspends; render behind <Suspense>.
export const userSelector = selector({
  key: 'user',
  get: async ({ get }) => {
    const id = get(qtyAtom);
    return (await fetch(`/api/thing/${id}`)).json();
  },
});

// Parameterised family — one instance per id.
export const todoFamily = atomFamily<{ done: boolean }, string>({
  key: 'todo',
  default: { done: false },
});
```

```tsx
import { useRecoilValue, useSetRecoilState } from 'recoil';

function Total() {
  const total = useRecoilValue(totalSelector); // read-only subscription
  return <b>{total}</b>;
}
function Reset() {
  const setQty = useSetRecoilState(qtyAtom);   // write-only → no re-render
  return <button onClick={() => setQty(0)}>Reset</button>;
}
```

## ⚖️ Trade-offs

- **Use it when** — realistically, *don't start new projects on it.* Recoil's last meaningful releases predate React 18's stabilisation, it never left an experimental feel, and Meta wound the team down. It carries real risk on modern React (concurrent features, strict mode).
- **The honest recommendation:** if you like the atomic model, use **Jotai** — same mental model, actively maintained, no string keys, smaller, better TypeScript. Recoil's historical value is that it *invented the pattern* the ecosystem then refined.
- **vs Jotai:** Recoil requires a globally-unique string `key` per atom (a persistence/DevTools convenience that's also a source of "duplicate key" bugs); Jotai keys by reference identity, so no strings. Recoil bundles more (families, effects) out of the box.
- **Bundle & lock-in:** heavier than Jotai/Zustand, and migrating away later is non-trivial once selectors permeate the app.

## 💣 Gotchas interviewers probe

- **"Is Recoil still recommended?"** The senior answer is *no* — mention its maintenance status and pivot to Jotai. Recommending Recoil for a greenfield app in 2025+ is a dated signal.
- **Duplicate atom keys.** Keys must be globally unique; hot-reload or accidental re-definition throws "Duplicate atom key." A frequent dev-time pain.
- **Async selectors suspend.** Reading one without a `<Suspense>` boundary throws a promise; wrap it, or use `useRecoilValueLoadable` to handle loading/error inline.
- **`selectorFamily` / `atomFamily` caching:** instances are cached by parameter; unbounded parameters grow memory. Parameters must be serialisable and value-stable (an object literal as a param breaks caching).
- **Everything must be under `<RecoilRoot>`** — reading an atom outside throws. And nested roots create isolated stores, which can surprise.
- **`useRecoilState` when you only write** subscribes needlessly; use `useSetRecoilState`.

## 🎯 Say this in the interview

> "Recoil introduced the atomic model to mainstream React: atoms are units of state addressed by a unique key, and selectors are pure derived state — together they form a data-flow graph, and components subscribe to just the nodes they read, so re-renders are surgical. Its standout feature was treating async data fetching as a derived selector that suspends, integrating cleanly with Suspense. That said, the honest answer today is that Recoil is effectively unmaintained and never fully settled on React 18, so I wouldn't start a new project on it — I'd use Jotai, which is the same model, actively maintained, keyed by reference instead of fragile string keys, and much lighter. So I know Recoil because it's where these ideas came from, but in practice I reach for its successor."

## 🔗 Go deeper

- [Recoil — Docs](https://recoiljs.org/) — the original atom/selector concepts, still the clearest statement of the model.
- [Recoil — Asynchronous data queries](https://recoiljs.org/docs/guides/asynchronous-data-queries) — selectors as suspending data fetches.
- [Jotai — Docs](https://jotai.org/) — the maintained successor you should actually reach for.
- [React — Suspense](https://react.dev/reference/react/Suspense) — the mechanism Recoil's async selectors plug into.
