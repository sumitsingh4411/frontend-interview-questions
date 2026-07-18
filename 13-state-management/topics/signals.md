<div align="center">

# Signals

<sub>🗃️ State management · 🔴 Hard · ⏱ 1h · `#signals` `#reactivity`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A signal is a value that **remembers who read it**. Reading one inside a reactive context auto-subscribes; writing it re-runs *only* those exact subscribers — no component re-render, no diff. It trades React's "re-run everything and reconcile" model for a dependency graph that updates the precise DOM nodes that changed.

---

## 🧠 Mental model

React's model is **pull-based and coarse**: state changes → the component function re-runs → the Virtual DOM diffs → the DOM patches. The unit of update is the component. Signals invert this into a **push-based, fine-grained** graph. The unit of update is a single subscription.

```
React:   setState ──▶ re-render component ──▶ diff subtree ──▶ patch DOM
Signal:  signal.value = x ──▶ notify exact subscribers ──▶ patch that one text node
```

Three primitives, and they compose into a graph:

- **signal** — a writable leaf value.
- **computed** — a derived value that *reads* other signals and caches its result until one of them changes (lazy + memoised).
- **effect** — a leaf that *does something* (updates the DOM, logs) whenever its dependencies change.

The magic is **automatic dependency tracking**: you never declare a dependency array. The runtime records which signals were read during a computed/effect and wires the edges for you.

## ⚙️ How it actually works

There's a module-level `currentObserver`. When a computed or effect runs, it sets itself as `currentObserver`, then executes your function. Every `signal.value` **getter** checks "is someone observing right now?" and, if so, adds a two-way link: the signal remembers the observer, the observer remembers the signal. When you assign `signal.value = x`, the **setter** walks its subscriber list and flags them dirty.

This is why dependencies are always exact and always current: an `if` branch that didn't read a signal this run simply won't be subscribed to it. Re-running re-collects the dependency set from scratch, so stale subscriptions are dropped automatically.

Two properties fall out of the graph structure:

- **Glitch-free / topological updates.** A good signals lib updates computeds in dependency order, so a node never runs twice or reads a half-updated value in one propagation. Naive event-emitter reactivity (the "observable soup" of early Knockout) *does* glitch.
- **Laziness.** A `computed` doesn't recompute on write — it just marks itself dirty. It only recalculates when something *reads* it. Unread derived state costs nothing.

The payoff versus React: signals **decouple state from the component tree**. A signal read directly in JSX can bind to a single text node, so updating it skips rendering the component entirely. That's O(changes), not O(component size).

## 💻 Code

```js
import { signal, computed, effect } from "@preact/signals-core";

const count = signal(0);
const double = computed(() => count.value * 2); // lazy, memoised

// This effect subscribes to `double` (and transitively `count`) automatically.
effect(() => console.log("double is", double.value)); // logs "double is 0"

count.value = 5; // recomputes double → effect logs "double is 10"
count.value = 5; // same value → no notification, effect does NOT run
```

The framework win — passing the *signal*, not its value, so the parent never re-renders:

```jsx
// ✅ Preact: `count` is read inside JSX, so only this text node updates.
function Counter({ count }) {
  return <button onClick={() => count.value++}>{count}</button>;
  //   ^ pass the signal object; Preact binds `.value` to the text node
}
```

```jsx
// ❌ The trap when bridging into React: reading .value in the BODY
// makes the whole component re-render — you've thrown away the benefit.
function Counter() {
  const c = useSignal(0);
  const now = c.value; // subscribes the COMPONENT, not a text node
  return <span>{now}</span>;
}
```

## ⚖️ Trade-offs

- **When NOT to use them:** if you're all-in on idiomatic React, bolting signals on fights the grain — hooks, Suspense, concurrent rendering and most of the ecosystem assume the render model. Signals shine in Preact, Solid, Vue (`ref`/`reactivity`), Svelte 5 (`$state` runes), and Angular, where they're first-class.
- **Fine-grained isn't free.** You trade one big diff for many tiny subscriptions; each has bookkeeping cost. For a list that fully replaces every frame, coarse re-render + keyed diff can win.
- **Mutable `.value` is a sharp edge.** Signals are shared mutable references. Reading `.value` outside a reactive context gives a snapshot with no subscription — a silent "why didn't it update?" bug.
- **Debuggability.** The dependency graph is implicit. "What subscribes to this?" has no `grep` answer the way an explicit `useEffect` dep array does.

## 💣 Gotchas interviewers probe

- **"Why are signals faster than `useState`?"** Not because they're a faster store — because they **skip the component render/diff entirely** and patch the exact binding. The mechanism is the answer, not "less overhead."
- **Reading `.value` vs passing the signal.** In React interop, reading `.value` in the render body re-renders the component; passing the signal into JSX binds a leaf. Candidates who miss this have "used" signals without understanding them.
- **Equality check.** Writing the same value (`===`) is a no-op — dependents don't fire. Great for primitives, a footgun for objects you mutate in place (same reference → no notification).
- **Untracked reads.** Every serious lib has `peek()`/`untracked()` to read without subscribing — needed to break cycles or read a value in an effect without depending on it.
- **Signals are not a store.** They give you reactivity, not normalization, devtools, or time-travel. "Signals replace Redux" is a category error — you still design your state shape.

## 🎯 Say this in the interview

> "A signal is a reactive value that automatically tracks who reads it. When a computed or effect runs, the runtime records every signal accessed and wires up subscriptions — no dependency array. Writing a signal notifies exactly those subscribers, and updates propagate in topological order so there are no glitches. The big difference from React is granularity: React re-runs the component and diffs the tree, whereas a signal read directly in the view binds to a single DOM node, so an update skips rendering entirely — it's O(changes) instead of O(component). Computeds are lazy and memoised, so derived state nobody reads costs nothing. The catch is that `.value` is mutable shared state, and in React interop reading it in the render body re-renders the whole component — you have to pass the signal into JSX to get the fine-grained benefit. I reach for signals in Solid, Preact, Vue or Svelte, not to fight idiomatic React."

## 🔗 Go deeper

- [Preact — Signals guide](https://preactjs.com/guide/v10/signals/) — the clearest intro, plus the React interop rules.
- [SolidJS — Reactivity](https://www.solidjs.com/guides/reactivity) — signals as the foundation of an entire framework.
- [Ryan Carniato — A Hands-on Introduction to Fine-Grained Reactivity](https://dev.to/ryansolid/a-hands-on-introduction-to-fine-grained-reactivity-3ndf) — builds the tracking mechanism from scratch.
- [Angular — Signals](https://angular.dev/guide/signals) — the same primitives adopted into a mainstream framework.
