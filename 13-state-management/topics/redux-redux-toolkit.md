<div align="center">

# Redux & Redux Toolkit

<sub>🗃️ State management · 🟡 Medium · ⏱ 1.5h · `#redux`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Redux is a single immutable store mutated only by pure reducers reacting to plain-object actions; Redux Toolkit (RTK) is the official answer to "Redux is too much boilerplate" — `createSlice` writes your action creators and reducers for you, and Immer lets you write "mutating" code that stays immutable.

---

## 🧠 Mental model

Redux is one global object, changed by one rule: **`(state, action) => newState`**, always pure, always returning a fresh reference. Nothing mutates in place; the UI subscribes and re-renders when the slice it reads changes identity. That predictability — every change is a serialisable action flowing through one pipeline — is the entire value proposition. It buys you time-travel debugging, replayable bug reports, and a single audit trail. You pay for it with indirection.

The trap that ruined Redux's reputation: people reached for it as the *default* store for everything, including server data. Half of most "Redux state" was really a cache of API responses — and Redux gives you zero help with fetching, deduping, or expiry. **That is not client state, and it does not belong in Redux.** RTK Query or React Query owns that. Redux is for genuinely-shared *client* state: auth session, theme, a multi-step form, cross-cutting UI.

## ⚙️ How it actually works

The classic flow: `dispatch(action)` → the root reducer runs every slice reducer → each returns its next state → the store swaps in a new root object → subscribers run. `useSelector` re-runs your selector against the new state and re-renders **only if the returned value changed by `===`**. That reference-equality check is the performance model and the footgun in one.

RTK collapses the ceremony:

- **`createSlice`** generates action *types* (`"counter/increment"`), action *creators*, and the reducer from one object. Actions stop being hand-written constants.
- **Immer** wraps every reducer. You write `state.value += 1` and Immer records the mutation on a draft proxy, then produces a correctly frozen immutable next state. You get mutable *syntax* with immutable *semantics* — the best of both, as long as you remember you're inside Immer (see gotchas).
- **`configureStore`** wires Redux DevTools, `redux-thunk`, and dev-only middleware that *throws* if you accidentally mutate state outside a reducer or put non-serialisable values in the store.
- **`createAsyncThunk`** standardises async: it dispatches `pending`/`fulfilled`/`rejected` actions you handle in `extraReducers`.

`useSelector` returns the selected value; `useDispatch` returns the stable dispatch function. Reads and writes are deliberately separated.

## 💻 Code

```ts
import { createSlice, configureStore, type PayloadAction } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: { items: [] as { id: string; qty: number }[] },
  reducers: {
    // ✅ Looks like mutation — Immer makes it immutable under the hood.
    added(state, action: PayloadAction<string>) {
      const line = state.items.find((i) => i.id === action.payload);
      if (line) line.qty += 1;
      else state.items.push({ id: action.payload, qty: 1 });
    },
  },
});

export const { added } = cartSlice.actions;
export const store = configureStore({ reducer: { cart: cartSlice.reducer } });
```

```tsx
import { useSelector, useDispatch } from 'react-redux';

function Cart() {
  // ❌ Returns a NEW array every render → re-renders every dispatch, anywhere.
  const items = useSelector((s) => s.cart.items.filter((i) => i.qty > 0));

  // ✅ Select the raw slice; memoise the derivation with a stable selector.
  const items2 = useSelector((s) => s.cart.items);

  const dispatch = useDispatch();
  return <button onClick={() => dispatch(added('sku-1'))}>Add</button>;
}
```

## ⚖️ Trade-offs

- **Use it when** state is genuinely global, long-lived, and mutated from many places, *and* you value the audit trail / time-travel debugging. A large collaborative editor, a complex wizard, cross-team shared UI state.
- **Don't use it for** server cache (use RTK Query / React Query), for local component state (`useState`), or as a reflex on a small app — Zustand or Jotai give you 80% of the benefit with a fraction of the wiring.
- **RTK vs hand-rolled Redux:** there is no reason to hand-roll anymore. The Redux team's official guidance is RTK-first; raw `createStore` is deprecated. If an interviewer sees you writing action-type constants by hand, that dates you.
- **Boilerplate is lower than its reputation, but indirection is real:** one interaction can touch a component, an action, a thunk, a reducer, and a selector across five files.

## 💣 Gotchas interviewers probe

- **Returning new references from selectors.** `useSelector(s => s.a.filter(...))` or `{...}`/`[...]` in a selector creates a fresh object every call, so the `===` check always fails and the component re-renders on *every* dispatch in the app. Fix with `createSelector` (Reselect, bundled in RTK) or `useSelector(fn, shallowEqual)`.
- **Immer only tracks the draft it hands you.** `return` a new value *or* mutate the draft — **never both** in one reducer. And async work inside a reducer is illegal; the draft is revoked after the reducer returns.
- **Mutating state outside a reducer.** RTK's `immutableStateInvariantMiddleware` catches it in dev and throws — a signal you understand *why* Redux demands purity.
- **Non-serialisable values in the store** (Promises, class instances, `Date`) break time-travel and persistence; the serialisability middleware warns you.
- **`connect` vs hooks:** the HOC `connect` still works but hooks (`useSelector`/`useDispatch`) are the modern API. Know both exist.
- **"Why not just Context?"** Context re-renders *every* consumer on any value change and has no selector granularity or DevTools. Redux exists partly to solve exactly that.

## 🎯 Say this in the interview

> "Redux is a single immutable store where the only way to change state is dispatching a plain action into a pure reducer, which returns a new state reference. That discipline gives you time-travel debugging and a full audit trail, which is the real reason to pay its indirection cost. In practice I reach for Redux Toolkit, never raw Redux — `createSlice` generates the actions and reducers, and Immer lets me write `state.x += 1` while staying immutable. The mistake I watch for is stuffing server data into Redux; API responses are a cache, not client state, so those go to RTK Query or React Query. And the classic performance bug is a selector that returns a new array or object every call — the `===` subscription check always fails and you re-render on every dispatch, so I memoise derivations with `createSelector`."

## 🔗 Go deeper

- [Redux Toolkit — Getting started](https://redux-toolkit.js.org/introduction/getting-started) — the official, RTK-first path; treat raw Redux as legacy.
- [Redux — Style guide](https://redux.js.org/style-guide/) — the maintainers' opinionated rules, including "don't put everything in Redux".
- [Reselect](https://github.com/reduxjs/reselect) — memoised selectors, the fix for the new-reference re-render bug.
- [Immer — Introduction](https://immerjs.github.io/immer/) — how the draft proxy turns mutations into immutable updates.
