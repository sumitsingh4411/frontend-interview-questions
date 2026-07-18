<div align="center">

# XState (state machines)

<sub>🗃️ State management · 🔴 Hard · ⏱ 1h · `#state-machine`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A state machine makes **impossible states impossible** by declaring the finite set of states up front and defining transitions as `(state, event) → state`; XState is the library that gives you that model plus hierarchy, guards, side-effects and a visualizer, so your UI stops being a soup of independent booleans.

---

## 🧠 Mental model

Most UI bugs are **impossible states that the type system allowed**: `isLoading && isError`, `isOpen && isSubmitting && data === null`. Booleans multiply — five of them is 32 combinations, and maybe 6 are legal. You spend your life writing `if` statements to forbid the other 26.

A finite state machine flips this: instead of "what flags are true?", you ask "**what state am I in, and what events does it accept?**" There is exactly one active state (`idle`, `loading`, `success`, `error`), and an event only causes a transition if the current state defines one for it. An event that isn't handled is simply **ignored** — that single rule deletes whole categories of race condition.

The senior framing: **a state machine is a specification you can execute.** The chart *is* the logic. You're not modelling less than reality — you're forcing reality to be finite.

## ⚙️ How it actually works

XState models a **statechart** (Harel's extension of FSMs): states can be nested, parallel, and carry data.

- **Finite state** (`idle`, `loading`) — the discrete mode. Only one leaf active at a time (per region).
- **Context** — the "extended state": the actual data (form values, retry count, fetched payload). Quantitative stuff that would be silly to enumerate as states.
- **Events** — the only way to change anything. `send({ type: 'SUBMIT' })`.
- **Transitions** — `on: { SUBMIT: 'loading' }`. Can carry **guards** (`cond`) that veto a transition, and **actions** (side-effects / context updates) that fire during it.
- **Actors / `invoke`** — a state can spawn a promise, observable, or another machine; its `onDone`/`onError` become transitions. This is how async lives inside the chart instead of leaking into components.

The runtime is an **interpreter** (`createActor`) that holds current state + context and processes events synchronously. Because transitions are pure `(state, event) → state`, the whole thing is serializable, testable without a DOM, and drawable — the [Stately visualizer](https://stately.ai) renders your machine as a live diagram.

Hierarchy is the scaling trick: a parent `open` state can contain `editing`/`saving` substates, and a single `CLOSE` on the parent tears all of them down without you enumerating every combination.

## 💻 Code

```ts
import { setup, assign } from 'xstate';

const fetchMachine = setup({
  actors: { load: fromPromise(({ input }) => api.get(input.id)) },
}).createMachine({
  id: 'fetch',
  initial: 'idle',
  context: { data: null, error: null, retries: 0 },
  states: {
    idle:   { on: { FETCH: 'loading' } },
    loading: {
      invoke: {
        src: 'load',
        input: ({ event }) => ({ id: event.id }),
        onDone:  { target: 'success', actions: assign({ data: ({ event }) => event.output }) },
        // guard: only allow a retry-transition while we're under the cap
        onError: [
          { target: 'loading', guard: ({ context }) => context.retries < 3,
            actions: assign({ retries: ({ context }) => context.retries + 1 }) },
          { target: 'failure', actions: assign({ error: ({ event }) => event.error }) },
        ],
      },
    },
    success: { on: { FETCH: 'loading' } },   // refetch allowed
    failure: { on: { RETRY: 'loading' } },
  },
});
```

```tsx
// A double-click can't fire two requests: while in `loading`, there is no
// `FETCH` transition, so the second event is simply dropped. No `if (isLoading) return`.
const [state, send] = useActor(fetchMachine);
<button onClick={() => send({ type: 'FETCH', id })} disabled={state.matches('loading')}>
```

## ⚖️ Trade-offs

- **When NOT to use it:** a toggle, a single boolean, or a page's local state. A machine for `isMenuOpen` is ceremony. The payoff scales with the number of states and the cost of illegal ones — checkout flows, multi-step wizards, media players, connection lifecycles, drag-and-drop.
- **Verbosity is real.** Even trivial machines are wordier than `useState`. You trade keystrokes for a guarantee that the state space is closed and inspectable.
- **The team has to learn statecharts.** Guards, `invoke`, hierarchy, actors — it's a genuine mental model, not a helper. On a team that won't invest, a half-understood machine is worse than plain reducers.
- **It's framework-agnostic** — the machine is plain JS, so the same logic runs in React, Vue, Svelte or a Node service. That portability is undersold.

## 💣 Gotchas interviewers probe

- **Finite state vs context.** The classic mistake is enumerating *data* as states (`hasOneItem`, `hasTwoItems`). Countable/quantitative things go in **context**; only qualitative *modes* are states. Get this wrong and you've reinvented the boolean explosion inside the chart.
- **Unhandled events are ignored, not errors.** This is a feature (it kills races) but surprises people expecting a throw. If nothing happens on `send`, you're probably in a state with no matching transition.
- **Guards are pure predicates.** They must not have side-effects and must be synchronous — they're evaluated to *choose* a transition, sometimes multiple times.
- **"Why not just a `switch` reducer?"** You can — a machine *is* a constrained reducer. The value-add is guards, hierarchy, parallel regions, declarative `invoke`, and visualization. If you'd never use those, a reducer is honestly fine; say so.
- **Statecharts ≠ Redux.** XState manages *logic/lifecycle*; it's orthogonal to a global store. You can run many small machines locally rather than one god-store.

## 🎯 Say this in the interview

> "I reach for a state machine when a component has enough modes that booleans start contradicting each other — `isLoading && isError` should be unrepresentable. XState lets me declare the finite states and the events each one accepts, so an event that isn't valid in the current state is just ignored, which quietly kills double-submits and race conditions without guard clauses. The key discipline is separating finite state from context: qualitative modes are states, quantitative data lives in context — enumerating data as states just recreates the mess. I lean on `invoke` to keep async inside the chart, guards to veto transitions like a retry cap, and hierarchy so a parent `CLOSE` tears down all substates. I wouldn't use it for a toggle — the payoff is proportional to how many illegal states you'd otherwise have to defend against."

## 🔗 Go deeper

- [XState docs — core concepts](https://stately.ai/docs) — states, context, events, actors, from the source.
- [Stately visualizer](https://stately.ai/viz) — paste a machine, see it run; the "the chart is the logic" pitch made tangible.
- [Statecharts.dev](https://statecharts.dev/) — David Khourshid & co on *why* statecharts, vendor-neutral.
- [David Harel — Statecharts: a visual formalism (1987)](https://www.sciencedirect.com/science/article/pii/0167642387900359) — the original paper; hierarchy and parallelism come from here.
