<div align="center">

# Jotai (atomic)

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#jotai` `#atoms`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Jotai is bottom-up state: you build tiny **atoms** and compose them into a dependency graph, so a component that reads one atom re-renders only when *that* atom (or its dependencies) changes — the granular, tearing-free counter to Context's all-or-nothing re-renders.

---

## 🧠 Mental model

Redux and Zustand are *top-down*: one big store you carve slices out of with selectors. Jotai is *bottom-up*: you define many small **atoms** — a piece of state as small as a boolean — and derive new atoms from them. State is a **graph**, not a tree. Each atom is a node; a derived atom is an edge that recomputes when its inputs change. A component that subscribes to atom `X` re-renders exactly when `X`'s value changes, and never for unrelated atoms.

The key insight interviewers want: **atoms hold no value themselves — they are *definitions*.** The actual value lives in a `Provider`'s store (or a default global store), keyed by atom identity. So the same atom definition can hold different values in different Providers — which is how Jotai does per-subtree scoping and isolated tests without new atom types. Think of an atom as "a WeakMap key describing how to compute a value," not "a variable."

## ⚙️ How it actually works

`atom(initialValue)` creates a **primitive** (writable) atom. `atom(readFn)` creates a **derived** atom whose `readFn(get)` reads other atoms; Jotai tracks which atoms you `get` and rebuilds the dependency graph on every read, so dependencies can be dynamic. Derived atoms are **memoised** per store and only recompute when a tracked dependency changes.

- **`useAtom(a)`** returns `[value, setValue]` — like `useState` but shared. `useAtomValue`/`useSetAtom` split read from write so a write-only component doesn't subscribe to re-renders.
- **Write atoms:** `atom(get, (get, set, arg) => ...)` gives you an action-like write function that can set *multiple* atoms — Jotai's version of a reducer/thunk.
- **Async atoms:** a `readFn` that returns a Promise makes the atom suspend; the component reading it integrates with `<Suspense>` automatically. This is Jotai's data-fetching story.
- **Tearing:** Jotai reads through React 18's concurrent-safe path so a slow render never shows a mix of old and new atom values.

Atoms are compared by *reference*, so **define them at module scope**, not inside render (that creates a brand-new atom every render → lost state).

## 💻 Code

```ts
import { atom } from 'jotai';

// Primitive atoms — the leaves of the graph.
export const priceAtom = atom(100);
export const qtyAtom = atom(2);

// Derived (read-only) atom — recomputes only when price or qty changes.
export const totalAtom = atom((get) => get(priceAtom) * get(qtyAtom));

// Write atom — an "action" that updates multiple atoms.
export const resetAtom = atom(null, (_get, set) => {
  set(priceAtom, 0);
  set(qtyAtom, 0);
});

// Async atom — suspends; drop the reader in <Suspense>.
export const userAtom = atom(async (get) => {
  const id = get(qtyAtom); // dependency tracked dynamically
  return fetch(`/api/thing/${id}`).then((r) => r.json());
});
```

```tsx
import { useAtom, useAtomValue, useSetAtom } from 'jotai';

function Total() {
  const total = useAtomValue(totalAtom); // read-only → subscribes, no setter
  return <b>{total}</b>;
}

function ResetBtn() {
  const reset = useSetAtom(resetAtom);   // write-only → does NOT re-render on change
  return <button onClick={reset}>Reset</button>;
}
```

## ⚖️ Trade-offs

- **Use it when** state is naturally fine-grained and independent — lots of small pieces read by different components — and you want to avoid both prop drilling and selector-memoisation ceremony. Excellent for form fields, per-widget state, derived computations.
- **Don't use it for** server cache with real caching needs (React Query is better), and be cautious when state is deeply interdependent — a large atom graph can become hard to trace ("where does this atom get written?").
- **vs Zustand:** Jotai composes upward from atoms; Zustand selects downward from one store. Jotai avoids the "returned a new object from a selector" re-render class entirely, but scatters state across many atom definitions.
- **vs Recoil:** Jotai is the spiritually-similar, smaller, more actively-maintained successor — no string keys, no `RecoilRoot` requirement (a default store exists), better TypeScript inference.
- **DevTools/traceability** are weaker than Redux's — no single serialisable action log by default.

## 💣 Gotchas interviewers probe

- **Defining an atom inside a component** creates a new atom on every render, so its value resets and subscribers thrash. Atoms belong at module scope (or memoised with `useMemo` / `atomFamily` when they must be dynamic).
- **`atomFamily` memory leaks:** `atomFamily(id => atom(...))` caches an atom per parameter *forever* unless you call `.remove(param)`. Unbounded params (user IDs, timestamps) leak.
- **Provider scoping surprises:** without a `Provider`, atoms use one global default store. Add a `Provider` and that subtree gets an isolated store — great for tests, surprising if you didn't expect the value to reset.
- **`useAtom` when you only write** still subscribes the component to value changes. Use `useSetAtom` for write-only to avoid needless re-renders.
- **Async atoms suspend:** reading one without a `<Suspense>` boundary throws a promise up the tree. Know that `loadable()` gives you a non-suspending `{ state, data }` form when you want to render loading inline.
- **Infinite loops:** a write atom that sets an atom its own read depends on can loop. The graph is only as safe as your dependencies.

## 🎯 Say this in the interview

> "Jotai is bottom-up, atomic state — instead of one store you select from, you define many tiny atoms and derive new atoms from them, so state is a dependency graph. A component reading one atom re-renders only when that atom or its dependencies change, which gives you Context-beating granularity without writing memoised selectors. The important subtlety is that atoms are just definitions — the actual value lives in a store keyed by atom identity, which is how the same atom holds different values in different Providers, so scoping and test isolation come for free. Two things I watch: never define atoms inside render, because you'd mint a new atom each time and lose state; and `atomFamily` caches per-parameter forever, so unbounded keys leak unless I remove them. For read-only or write-only components I use `useAtomValue` / `useSetAtom` so I only subscribe to what I actually need."

## 🔗 Go deeper

- [Jotai — Docs](https://jotai.org/) — start with `core/atom` and the `useAtom` basics.
- [Jotai — Derived atoms](https://jotai.org/docs/guides/composing-atoms) — how read/write atoms compose into a graph.
- [Jotai — atomFamily](https://jotai.org/docs/utilities/family) — the parameterised-atom utility and its memory caveat.
- [Jotai — Async](https://jotai.org/docs/guides/async) — suspending atoms and the `loadable` escape hatch.
