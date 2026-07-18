<div align="center">

# `useReducer` & state machines

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#hooks` `#state`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `useReducer` moves state transitions out of the component and into a **pure `(state, action) => state` function**, so *how* state changes lives in one testable place. Its real superpower isn't "complex state" — it's modelling your UI as an **explicit state machine** where illegal states are unrepresentable, instead of a soup of booleans that can contradict each other.

---

## 🧠 Mental model

`useState` answers *"what is the value?"*. `useReducer` answers *"what are the legal ways this value can change?"*. You stop scattering `setX` calls across handlers and instead **name your transitions** as actions — `{ type: 'submit' }`, `{ type: 'reject', error }` — and centralise the logic that responds to them.

The mindset shift that makes this senior-grade: most "state bugs" are **impossible-state bugs**. `isLoading`, `isError`, `isSuccess` as three separate booleans has 2³ = 8 combinations, but only ~4 are legal — `loading && error` should never happen, yet nothing stops it. A reducer lets you model status as *one* value from a fixed set (`'idle' | 'loading' | 'success' | 'error'`), so the contradictory states literally cannot be constructed. That's a finite state machine, and `useReducer` is the ergonomic way to write one in React.

## ⚙️ How it actually works

`dispatch` is **guaranteed stable** for the component's lifetime — same reference every render. This is the quietly important bit: you can pass `dispatch` into `useEffect` deps, memoised children, or context, and it never causes a re-render or a stale closure. `useState`'s setter has the same guarantee, but with a reducer you often pass *only* `dispatch` down, keeping children decoupled from the state shape.

The reducer runs during render of the dispatching component (React calls it to compute the next state), so it **must be pure** — no fetches, no mutations, no `Date.now()`. Same `(state, action)` in, same state out. In StrictMode dev, React double-invokes reducers to surface accidental impurity.

Two mechanics people miss:

- **Bailout by identity.** If the reducer returns the *exact same* state reference (`Object.is` equal), React bails out of re-rendering that component. Return `state` unchanged for a no-op action and you get a free skip.
- **Lazy initialisation.** `useReducer(reducer, initialArg, init)` calls `init(initialArg)` only on the first render — use it to avoid recomputing an expensive initial state every render.

## 💻 Code

```jsx
// ❌ Boolean soup: nothing prevents loading && error being true together
const [isLoading, setLoading] = useState(false);
const [isError, setError]   = useState(false);
const [data, setData]       = useState(null);

// ✅ One status value from a fixed set → illegal combinations can't exist
const initial = { status: 'idle', data: null, error: null };

function reducer(state, action) {
  switch (action.type) {
    case 'fetch':   return { status: 'loading', data: null, error: null };
    case 'resolve': return { status: 'success', data: action.data, error: null };
    case 'reject':  return { status: 'error', data: null, error: action.error };
    default:        return state; // same ref → React bails out of the re-render
  }
}

function Widget() {
  const [state, dispatch] = useReducer(reducer, initial);

  useEffect(() => {
    dispatch({ type: 'fetch' });
    load().then(
      (d) => dispatch({ type: 'resolve', data: d }),
      (e) => dispatch({ type: 'reject', error: e }),
    ); // dispatch is stable — safe to omit or include in deps
  }, []);

  if (state.status === 'loading') return <Spinner />;
  if (state.status === 'error')   return <Error e={state.error} />;
  // TypeScript can now narrow: `data` is non-null only in 'success'
}
```

Make transitions guard on the current state and you have a true machine: a `reject` action while `status === 'success'` can be ignored, so a late-arriving error can't clobber good data.

## ⚖️ Trade-offs

- **Reducers shine when transitions are interdependent** (multi-step forms, async status, undo/redo, anything with "you can only do X from state Y"). One function, trivially unit-testable in isolation, no React needed.
- **When NOT to use it:** a single independent value — a toggle, an input string, a counter. `useReducer` there is ceremony; `useState` is clearer. Don't reach for a machine to flip a boolean.
- **Reducers can grow into a mini-framework.** For genuinely complex charts of states with guards, entry/exit actions, and parallel states, a dedicated library (XState) buys you visualisation and formal guarantees a hand-rolled switch won't.
- **State shape is coupling.** Passing `dispatch` down decouples children from *how* state changes; passing the whole `state` object re-couples them to its shape.

## 💣 Gotchas interviewers probe

- **The reducer must be pure.** Side effects (fetch, log, mutate) belong in effects/handlers, not the reducer — StrictMode double-invokes to catch violations.
- **`dispatch` is stable; the reducer function's identity doesn't matter.** You can define it inline or outside; React captures the latest one but never re-subscribes anything.
- **Mutating state instead of returning new state** breaks bailout and time-travel and can skip renders. Always return a new object (or the same ref for a no-op).
- **Actions should describe *what happened*, not *what to set*.** `{ type: 'incremented_by', n }` beats `{ type: 'set_count', value }` — the reducer, not the caller, owns the transition logic. This is the "events, not setters" principle.
- **Returning the same reference bails out** — sometimes intentional (ignore an illegal action), sometimes a surprise when you forgot to clone.
- **`useReducer` + Context** is the built-in "Redux lite" — but every consumer re-renders on any state change unless you split contexts.

## 🎯 Say this in the interview

> "I reach for `useReducer` when state has *transitions*, not just a value. The framing I use is state machines: instead of three booleans like `isLoading`, `isError`, `isSuccess` — which allow contradictory combinations nothing prevents — I model status as one value from a fixed set, so illegal states are literally unrepresentable. The reducer is a pure `(state, action) => state` function, which means all the transition logic lives in one place I can unit-test with zero React. Two mechanics I lean on: `dispatch` is referentially stable for the component's life, so I can pass it into effects and memoised children without stale-closure worries; and if the reducer returns the same state reference, React bails out of the re-render for free. I *wouldn't* use it for a single independent toggle — that's just `useState` with extra steps. And I write actions as events that describe what happened, not as setters, so the reducer owns the logic."

## 🔗 Go deeper

- [react.dev — `useReducer`](https://react.dev/reference/react/useReducer) — the exact contract, purity rules, and lazy init.
- [react.dev — Extracting state logic into a reducer](https://react.dev/learn/extracting-state-logic-into-a-reducer) — the migration from scattered setters to one reducer.
- [react.dev — Choosing the state structure](https://react.dev/learn/choosing-the-state-structure) — avoiding redundant and contradictory state.
- [Stately / XState docs](https://stately.ai/docs/xstate) — when a hand-rolled reducer should graduate to a real statechart.
