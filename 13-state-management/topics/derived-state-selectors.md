<div align="center">

# Derived state & selectors

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — If a value can be *computed* from other state, don't store it — derive it. A selector is a pure function `state → value`; memoize it so the derivation is cheap and, crucially, so it returns a *stable reference* that stops downstream components from re-rendering.

---

## 🧠 Mental model

State has two kinds of values: **primary** (facts you can't reconstruct — the raw todos, the current filter) and **derived** (anything computable from those facts — the visible todos, the count, the "all done?" flag). The single most common state-management bug is storing derived values, because now you have two sources of truth that must be kept in sync by hand, and eventually won't be.

The rule: **store the minimum, derive the rest.** A `visibleTodos` field is a bug waiting to happen; a `selectVisibleTodos(state)` function can never go stale, because it's recomputed from the source every time it's asked.

A selector is just that function. The only wrinkle is that recomputing on every render — and worse, returning a *new array each time* — is expensive and breaks referential-equality checks. That's what memoization fixes.

## ⚙️ How it actually works

A memoized selector caches its last inputs and last output. If the inputs are referentially equal to last time, it returns the **exact same output reference** without recomputing.

```
selectVisibleTodos = createSelector(
  [selectTodos, selectFilter],   // input selectors
  (todos, filter) => todos.filter(byFilter(filter))  // result fn — only runs when inputs change
)
```

Two payoffs, and interviewers want both:

1. **Skip expensive recomputation.** A 10k-item sort/filter doesn't rerun if todos and filter are unchanged.
2. **Referential stability.** `todos.filter(...)` creates a *new array* every call. A component doing `useSelector(selectVisibleTodos)` would re-render on *every* store update, because `newArray !== oldArray` even when contents match. Memoization returns the previous array reference, so the equality check passes and the component stays put.

The classic trap is **default cache size 1**. Reselect (pre-v5) caches only the *last* call, so calling the same selector with two different component-specific arguments (two list IDs) causes cache thrashing — each call evicts the other, memoization never hits. The fix is a per-instance selector (`useMemo(makeSelectThing, [])`) or Reselect v5's `weakMapMemoize`, which caches by argument identity and effectively removes the size-1 limit.

Input selectors must be cheap and return stable references themselves — if an input selector does `state => state.a.b.map(...)`, it produces a new array each time and the outer memo never hits. Inputs pluck; the result function computes.

## 💻 Code

```js
import { createSelector } from 'reselect';

// ❌ Derived value stored in state — two sources of truth, goes stale
// state = { todos, filter, visibleTodos }  // must resync on EVERY change

// ✅ Derive it. Cannot go stale.
const selectTodos  = (s) => s.todos;
const selectFilter = (s) => s.filter;

const selectVisibleTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    switch (filter) {
      case 'active': return todos.filter((t) => !t.done);
      case 'done':   return todos.filter((t) => t.done);
      default:       return todos;
    }
  } // recomputes ONLY when todos or filter change; else returns same array ref
);
```

```js
// ❌ Parametric selector with cache size 1 — thrashes across components
const selectById = createSelector(
  [(s) => s.items, (_, id) => id],
  (items, id) => items[id]
); // <List id="a"/> and <List id="b"/> evict each other every render

// ✅ Per-component instance, so each has its own cache
function makeSelectById() {
  return createSelector([(s) => s.items, (_, id) => id], (items, id) => items[id]);
}
function Row({ id }) {
  const selectById = useMemo(makeSelectById, []); // one cache per Row
  return useSelector((s) => selectById(s, id));
}
```

## ⚖️ Trade-offs

- **Memoization isn't free.** It costs memory (cached inputs/outputs) and a comparison on every call. For a trivial `state => state.count`, a plain function is faster — memoize only when the computation is real *or* you need a stable reference.
- **When NOT to derive:** if a "derived" value is expensive *and* needed rarely, or must be edited independently (a debounced draft that diverges from source), storing it can be correct. Derivation assumes cheap recompute from a clean source.
- **Selectors couple to state shape.** Co-locate them with the reducer/slice so a refactor of state shape changes one file, not fifty call sites. This is the real argument for selectors over inline `useSelector(s => s.a.b.c)`.
- **Reselect vs. the alternatives:** signals (Solid, Preact, Vue `computed`) make derivation the *default* and track dependencies automatically — no manual input-selector wiring. In that world "selectors" largely disappear.

## 💣 Gotchas interviewers probe

- **"Never store what you can derive."** The headline. Storing `count`, `isAllDone`, or `filteredList` is the classic junior mistake.
- **New reference every render.** `useSelector(s => s.items.filter(...))` re-renders on every dispatch because the filter makes a fresh array. This is the #1 reason people think Redux is slow. Memoize, or select raw and derive in `useMemo`.
- **Cache size 1 thrashing.** Sharing one parametric selector across list items destroys memoization. Know the per-instance fix cold.
- **Unstable input selectors.** If an input selector itself returns a new object, the outer selector recomputes every time — memoization silently never engages. Inputs must return stable references.
- **`useSelector` uses reference equality by default.** Returning an object literal `{ a, b }` re-renders always; use `useSelector(..., shallowEqual)` or select primitives separately.
- **Reselect v5 changed defaults.** `weakMapMemoize` and auto-detection of unstable results — worth naming to show you're current.

## 🎯 Say this in the interview

> "My rule is store primary state only and derive everything else, because a stored derived value is a second source of truth that eventually desyncs. A selector is just a pure `state → value` function, and I memoize it with Reselect for two reasons: to skip expensive recomputation, and — more importantly — to return a stable reference. `todos.filter(...)` makes a new array every call, so an unmemoized selector re-renders the component on every single dispatch even when nothing relevant changed. That referential-stability point is the one people miss. The gotcha I watch for is Reselect's default cache size of one: if I share a parametric selector across list rows they thrash each other's cache, so I create a per-instance selector with `useMemo`. And I co-locate selectors with the slice so state-shape refactors stay in one place."

## 🔗 Go deeper

- [Reselect](https://github.com/reduxjs/reselect) — memoized selectors, `createSelector`, and the v5 `weakMapMemoize` changes.
- [Redux — Deriving data with selectors](https://redux.js.org/usage/deriving-data-selectors) — when and how to memoize, cache-size pitfalls, best practices.
- [Kent C. Dodds — Don't sync state, derive it](https://kentcdodds.com/blog/dont-sync-state-derive-it) — the case for computing over storing.
- [React — `useMemo`](https://react.dev/reference/react/useMemo) — component-local derivation when a store-level selector is overkill.
