<div align="center">

# Flux / unidirectional data flow

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#concepts`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Flux's real invention isn't the dispatcher, it's the constraint: **state changes only ever happen in one direction**, so every mutation has exactly one entry point and the answer to "why did this change?" is always a named action in a log — not a bidirectional binding you have to trace by hand.

---

## 🧠 Mental model

Flux was Facebook's answer to a specific bug class, not an abstract architecture. Two-way data binding (Angular 1's `$scope`, Knockout's observables) lets a view write directly to a model, which notifies another view, which writes back to another model. The update graph is a **cycle**, and debugging means asking "who wrote this?" with no answer.

Flux replaces the cycle with a **ring**:

```
   ┌──────────┐    ┌────────────┐    ┌───────┐    ┌──────┐
   │  Action  │ →  │ Dispatcher │ →  │ Store │ →  │ View │
   └──────────┘    └────────────┘    └───────┘    └──────┘
        ↑                                             │
        └──────────── user interaction ───────────────┘
```

The view **cannot write to the store**. It can only *ask*, by emitting an action — a plain, serialisable description of what happened. The store decides what that means. That inversion is the whole idea: **the view loses write access, and gains debuggability.**

The mental shift the interviewer wants: an action is **not a setter, it's an event**. `SET_USER_NAME` is a Flux action written by someone still thinking in two-way binding. `PROFILE_FORM_SUBMITTED` is a Flux action. The store owns the interpretation.

## ⚙️ How it actually works

Original Flux had a **singleton dispatcher** — one global pub-sub with a `waitFor(tokens)` primitive so store A could declare "process this action after store B". Every action went to every store; stores filtered by type.

Redux is Flux with three simplifications that turned out to matter more than the original:

| | Flux (2014) | Redux |
|---|---|---|
| Stores | Many, each with its own logic and emit | **One**, a single tree |
| Dispatcher | Explicit singleton with `waitFor` | Gone — `combineReducers` gives ordering for free |
| Mutation | Stores mutate themselves privately | **Pure reducers**: `(state, action) => newState` |
| Reading | `store.getEmployee()` — ad-hoc getters | Selectors over one tree |

Killing the dispatcher was possible because reducers are *pure and composed*. `waitFor` existed to sequence side effects between stores; if reducers can't have side effects, ordering is just function composition. That's why Redux's three principles read the way they do: **single source of truth**, **state is read-only**, **changes are made by pure functions**.

The payoff is not ideology, it's tooling. Because every change is `(previousState, action) => nextState` with no I/O:

- **Time-travel debugging** works — replay the action log, get the identical state. Deterministically.
- **A bug report is a JSON file.** Ship the action log, replay it locally, watch it break.
- **Testing needs no mocks.** A reducer test is `expect(reducer(before, action)).toEqual(after)`.
- **Optimistic updates and undo** are diffs over a known sequence, not guesswork.

Where do side effects go, then? *Outside* the ring — thunks, sagas, listener middleware — which observe actions and dispatch more actions. The ring stays pure; the mess is quarantined at one boundary.

## 💻 Code

```js
// ❌ Bidirectional: the view writes to the model. Two writers, no log, no trace.
input.oninput = (e) => { model.user.name = e.target.value; };  // who else writes here?
model.on('change:name', () => { input.value = model.user.name; }); // ...and back again
```

```js
// ✅ Unidirectional: the view can only *describe* what happened.
const nameChanged = (value) => ({ type: 'profile/nameChanged', payload: value });

// The store owns interpretation. Pure: same inputs → same output, forever.
function reducer(state = { name: '', dirty: false }, action) {
  switch (action.type) {
    case 'profile/nameChanged':
      return { ...state, name: action.payload, dirty: true }; // new object, never mutate
    default:
      return state;
  }
}

// View dispatches, then re-renders from the store. It never writes.
input.oninput = (e) => store.dispatch(nameChanged(e.target.value));
```

Name actions as **events, not commands** — this is the single biggest quality signal in a Flux codebase:

```js
// ❌ Setters in disguise. Every new feature needs a new action; the reducer is a dumb assigner.
dispatch({ type: 'SET_LOADING', payload: true });
dispatch({ type: 'SET_USER', payload: user });
dispatch({ type: 'SET_LOADING', payload: false });

// ✅ One event, three consequences, and any store can react to it independently.
dispatch({ type: 'users/fetchSucceeded', payload: user });
```

## ⚖️ Trade-offs

- **You are paying for an audit trail.** Indirection, boilerplate, and a jump-to-definition trail from click → action → reducer → selector → render. Worth it when *many* places mutate the same data; pure overhead for a component's local toggle.
- **Purity is the constraint doing the work.** Any `Date.now()`, `Math.random()`, or `fetch` inside a reducer silently destroys replayability. The discipline *is* the feature — a reducer with a side effect is worse than no Flux at all, because you now believe a log that lies.
- **When NOT to use it:** ephemeral local state, and — the big one — **server cache**. Modelling `fetchUsersPending/Fulfilled/Rejected` as actions is technically valid Flux and almost always the wrong tool: you've hand-rolled a cache with no dedup, staleness or GC. Unidirectional flow is orthogonal to caching, and query libraries already give you both.
- **Unidirectional flow survives Flux.** Signals, Zustand, `useReducer`, Elm, SwiftUI — the ring won; the dispatcher didn't. Judge a library by whether views can write directly, not by whether it ships an `applyMiddleware`.

## 💣 Gotchas interviewers probe

- **"Isn't Redux just Flux?"** No — and the differences are the interesting part: one store not many, no dispatcher, and reducers that are *pure* rather than stores that mutate privately. Say *why* the dispatcher could be deleted (`waitFor` is unnecessary once reducers can't do I/O).
- **Actions are events, not setters.** A store full of `SET_*` actions has Flux's boilerplate with none of its benefit. Past-tense, domain-named actions let *N* reducers respond to *one* event — the real leverage.
- **`state.items.push(x)` in a reducer.** Mutation means the old state is gone, so time travel breaks, `Object.is` sees no change, and connected components don't re-render. It usually "works" in dev and fails under memoization.
- **Unidirectional ≠ single store.** Zustand and Jotai are unidirectional with many stores/atoms. The direction is the principle; centralisation is an implementation choice.
- **The dispatcher was pub-sub, not a queue.** It broadcast synchronously to every registered store — nothing was filtered for you.
- **"Time travel needs Redux."** It needs *purity and serialisable actions*. Any pure reducer gets it — including `useReducer`, if you log the actions.

## 🎯 Say this in the interview

> "Flux is a constraint, not a library: data flows one way — action → dispatcher → store → view — and the view can never write to the store, it can only emit an action describing what happened. That kills the bidirectional-binding problem where you can't tell who mutated a value. Redux then simplified it: one store instead of many, no dispatcher, and crucially *pure reducers* — `(state, action) => newState`. The dispatcher's `waitFor` only existed to sequence side effects between stores, and once reducers can't do I/O, ordering is just composition. Purity is what buys time-travel debugging and mock-free reducer tests. The detail I'd stress is naming: actions should be past-tense events like `profile/nameChanged`, not `SET_NAME`. Setter-shaped actions give you all of Flux's boilerplate and none of its leverage."

## 🔗 Go deeper

- [Redux — Three Principles](https://redux.js.org/understanding/thinking-in-redux/three-principles) — single source of truth, read-only state, pure changes. Short and load-bearing.
- [Redux — Prior Art](https://redux.js.org/understanding/history-and-design/prior-art) — Dan Abramov on exactly what Redux took from Flux and what it dropped.
- [Redux Style Guide — Model actions as events](https://redux.js.org/style-guide/#model-actions-as-events-not-setters) — the events-vs-setters rule, from the maintainers.
- [Flux — In Depth Overview](https://facebookarchive.github.io/flux/docs/in-depth-overview/) — the original architecture, dispatcher and `waitFor` included.
