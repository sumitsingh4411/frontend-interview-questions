<div align="center">

# Context as state (and its limits)

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#react` `#performance`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Context is **dependency injection, not state management**: it solves *how a value reaches a component*, never *how a value changes efficiently*. It has no selector, so every consumer re-renders whenever the provider's `value` identity changes — and that single missing feature is why "just use Context" collapses at scale.

---

## 🧠 Mental model

Context is a **wormhole through the tree**, not a store. `useState` still holds the state; Context only skips the prop-drilling in between. Ask two separate questions and the confusion evaporates:

| Question | Answered by |
|---|---|
| Where does the value **live**? | `useState` / `useReducer` / a store |
| How does the value **travel** to a deep component? | Context (or props) |
| Which components **re-render** when it changes? | Context: **all consumers.** No exceptions. |

Redux, Zustand and Jotai all use Context (or a module store) for the travelling part too. What they add is the third row: a **subscription with a selector**, so a component re-renders only when the slice it read actually changed. Context has no such thing — and you cannot add one from the outside.

## ⚙️ How it actually works

When a `Provider`'s `value` changes by `Object.is`, React walks the subtree and marks **every** fibre that consumed that context as needing work. Three consequences most candidates miss:

**1. `React.memo` does not stop it.** Memo compares *props*. A context update is delivered out-of-band, straight to the consumer fibre, so a memoized component that calls `useContext` re-renders anyway. Memo only stops the update from *propagating further down* through props.

**2. Granularity is the whole value.** If your value is `{ user, theme, cart }`, a cart change re-renders every component that only wanted `theme`. React has no per-field bailout: it can't know that `useContext(AppCtx).theme` didn't change, because the hook returns the object and the selection happens *after* the render begins.

**3. The inline-object trap.** `value={{ user, setUser }}` allocates a fresh object every provider render, so `Object.is` is false every single time — even when `user` is identical. Now consumers re-render on *any* parent re-render, not just on state changes.

The three real fixes, in the order I'd reach for them:

- **Split the context** by change frequency. Rarely-changing values (dispatch, theme) get their own provider; fast-changing ones (mouse position, form draft) get another. Consumers subscribe only to what they need.
- **Split state from dispatch.** `dispatch` from `useReducer` is referentially stable forever. Put it in its own context and every "writer" component stops re-rendering entirely.
- **`useMemo` the value** so identity tracks the data, not the render.

## 💻 Code

```jsx
// ❌ New object every render → every consumer re-renders on every parent render.
function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [theme, setTheme] = useState('dark');
  return (
    <AppCtx.Provider value={{ user, setUser, theme, setTheme }}>
      {children}
    </AppCtx.Provider>
  );
}
```

```jsx
// ✅ Split by change frequency + stable dispatch. Writers never re-render.
const StateCtx = createContext(null);
const DispatchCtx = createContext(null); // dispatch is stable → this NEVER re-renders

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initial);
  return (
    <DispatchCtx.Provider value={dispatch}>
      {/* state object identity changes only when the reducer produces new state */}
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </DispatchCtx.Provider>
  );
}
```

The `children` escape hatch — worth knowing, because it's the one bailout that *does* work:

```jsx
// `children` is created in the PARENT's render, so its element identity is unchanged.
// Provider re-rendering does not re-render children that don't consume the context.
<AppCtx.Provider value={value}>{children}</AppCtx.Provider>
```

## ⚖️ Trade-offs

- **Context is free and built in** — no dependency, no store wiring, works in RSC-adjacent trees, and it's the right answer for low-frequency, tree-scoped values: theme, locale, auth session, a design-system config.
- **When NOT to use it:** anything that changes more than a few times a minute, anything where consumers want *different fields*, and anything fetched. Server state in Context is a cache with no invalidation and a re-render storm attached.
- **The scale cliff is real but late.** With 5 consumers, the extra re-renders are free. With 500, plus a value that ticks on every keystroke, you're re-rendering the app per character. Don't pre-optimise — but do recognise the shape before you ship it.
- **Context also scopes.** Multiple providers = multiple independent values (per-form, per-modal). A module-level Zustand store is a singleton by default — Context wins when you genuinely need instances.

## 💣 Gotchas interviewers probe

- **"Can I use `React.memo` to stop context re-renders?"** No. Memo checks props; context bypasses props. This one separates people who've read about Context from people who've profiled it.
- **`useContextSelector` does not exist in React.** It's a long-standing RFC and a userland package (`use-context-selector`). Claiming React has it is a tell.
- **`useMemo` on the value is necessary, not sufficient.** It fixes *spurious* identity changes. It does nothing about the fact that one field changing re-renders consumers of every other field.
- **Nesting is shadowing, not merging.** An inner Provider for the same context completely replaces the outer value for its subtree.
- **Missing Provider ≠ error.** `useContext` silently returns the `createContext(defaultValue)` argument — usually `undefined`, which surfaces 40 frames away as a null crash. Always ship a `useAppCtx()` hook that throws a named error.
- **Re-render ≠ repaint.** Consumers re-render, but if the output is identical React commits nothing to the DOM. The cost is reconciliation, not layout — which is why "Context is slow" is only true once render functions get expensive.

## 🎯 Say this in the interview

> "I treat Context as dependency injection, not state management — it solves prop drilling, and that's all it solves. The state still lives in `useState` or `useReducer`; Context just moves it. The limit is that it has no selector: when the provider's value changes identity, every consumer re-renders, and `React.memo` won't save you because context bypasses props entirely. So the first bug is always an inline `value={{ ... }}` object that changes identity every render — I'd `useMemo` it. But the deeper fix is splitting: one context for state, one for `dispatch`, which is referentially stable so writers never re-render, and separate contexts by how often things change. Once I need components to subscribe to *different fields* of the same object, I've outgrown Context and I'd reach for Zustand or Jotai, which give me subscriptions with selectors."

## 🔗 Go deeper

- [react.dev — Scaling up with Reducer and Context](https://react.dev/learn/scaling-up-with-reducer-and-context) — the canonical state+dispatch split, straight from the docs.
- [react.dev — `useContext`](https://react.dev/reference/react/useContext) — the exact update semantics, including the memo caveat.
- [react.dev — Passing data deeply with context](https://react.dev/learn/passing-data-deeply-with-context) — when Context is genuinely the right tool, and its alternatives.
- [Kent C. Dodds — How to use React Context effectively](https://kentcdodds.com/blog/how-to-use-react-context-effectively) — the provider + custom-hook-that-throws pattern.
