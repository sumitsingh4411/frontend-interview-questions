<div align="center">

# Immutability & structural sharing

<sub>🗃️ State management · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Immutable updates copy only the path from the root to the change and *reuse* every untouched branch by reference. That "structural sharing" is what makes `prev !== next` an O(1) truth: React and memoized selectors can detect change with a single `===`, no deep comparison needed.

---

## 🧠 Mental model

Immutability in JS isn't about frozen objects — it's a discipline: **never mutate; produce a new value.** The reason isn't purity for its own sake, it's *change detection by reference*. React's whole update model asks one cheap question — "is `next` the same object as `prev`?" If you mutate in place, the answer is "yes" even though the data changed, and the UI silently goes stale. If you always create new objects along the changed path, `===` becomes a perfect, O(1) change signal.

Structural sharing is the optimization that makes this affordable. You don't deep-clone the tree. You clone only the nodes *on the path to the change* and point the new tree at the old, unchanged subtrees:

```
old ─┐        new ─┐            b is unchanged →
     ├─ a          ├─ a' (new)  new tree REUSES old.a.b
     │  ├─ b       │  ├─ b  ◄───┘  (same reference)
     │  └─ c'(old) │  └─ c' (new)
     └─ d ◄────────┴─ d  (unchanged → shared)
```

Update one leaf in a 10k-node tree and you allocate ~log(n) new nodes, not 10k. Everything else is shared.

## ⚙️ How it actually works

A correct immutable update spreads at every level along the path:

```js
// Change state.user.address.city — spread the whole path, reuse the rest
const next = {
  ...state,                          // new root
  user: {
    ...state.user,                   // new user
    address: { ...state.user.address, city: 'Berlin' }, // new address
  },
};
// next.posts === state.posts   → true  (untouched branch, shared)
// next.user  === state.user    → false (on the path, replaced)
```

The consequence is what powers everything downstream:

- **`React.memo` / `useMemo` / `useSelector`** compare by reference. Shared branches compare equal, so components reading unchanged slices skip re-rendering. Mutation would either falsely skip (stale UI) or force deep comparison (slow).
- **Time-travel, undo/redo, and Redux DevTools** work because every state is a distinct, retained snapshot sharing structure with its neighbors — cheap to keep hundreds of them.
- **Concurrent React** relies on the current tree not being mutated out from under a paused render. Immutability makes tearing impossible.

**Immer** makes this ergonomic without giving up any of it. You mutate a `draft` — a Proxy that records writes — and Immer produces the next immutable state *with* structural sharing, freezing it in dev. `draft.user.address.city = 'Berlin'` compiles to the nested spread above, only touching accessed paths.

`Object.freeze` is orthogonal: it *enforces* no-mutation at runtime (shallowly) but does nothing for structural sharing — it's a guardrail, not the mechanism.

## 💻 Code

```js
// ❌ Mutation — reference stays the same, React sees no change → stale UI
function addTodo(state, todo) {
  state.todos.push(todo);   // same array ref
  return state;             // same object ref → useSelector won't update
}

// ✅ Immutable — new refs on the path, everything else shared
function addTodo(state, todo) {
  return { ...state, todos: [...state.todos, todo] };
}
```

```js
// Immer — write "mutations", get an immutable result with structural sharing
import { produce } from 'immer';

const next = produce(state, (draft) => {
  draft.user.address.city = 'Berlin';   // only user.address is recreated
  draft.todos.push({ id, text });       // todos array recreated; user.* shared
});
// next.settings === state.settings → true (untouched → shared reference)
```

```js
// The subtle trap: a "new" object that still shares a mutated child
const next = { ...state };        // new root...
next.todos.push(newTodo);         // ...but todos is the SAME array — mutated!
// Shallow copy ≠ deep immutability. You mutated shared state.
```

## ⚖️ Trade-offs

- **Manual spreads get unreadable fast** for deep nesting — nested `...` pyramids are error-prone. Immer trades a tiny Proxy overhead for correctness and readability; for most apps that's the right call. Redux Toolkit bakes Immer in for exactly this reason.
- **Immer has a cost:** Proxy trapping is slower than a hand-written spread for hot, shallow updates, and it can't wrap class instances, Maps/Sets (without `enableMapSet`), or non-plain objects. Very hot paths sometimes hand-roll spreads deliberately.
- **When NOT to obsess:** transient, component-local values (a text input, a hover flag) don't need immutable ceremony. Immutability earns its keep for *shared* state that feeds change detection.
- **Persistent data structures** (Immutable.js, `Map`/`List`) offer O(log n) updates for genuinely huge collections, but they impose a foreign API and lossy JS interop — usually not worth it now that Immer exists.

## 💣 Gotchas interviewers probe

- **Shallow copy is not deep immutability.** `{ ...state }` then `state.todos.push()` mutates the shared array. Every level on the path must be copied. This is the single most common mistake.
- **"Why does React need immutability?"** Because it detects change by reference (`Object.is`), not by value. Mutating keeps the reference, so `setState(sameRef)` bails out and the UI never updates.
- **Structural sharing ≠ deep clone.** Candidates who think immutability means copying the whole tree miss the entire performance story. Only the path is copied.
- **`Object.freeze` doesn't give you sharing** and is shallow — a frozen object can still hold a mutable nested object. It enforces, it doesn't optimize.
- **Immer freezes in dev, not prod** (by default), and returns the *original* object unchanged if you didn't touch it — so `produce(state, () => {})` gives back the same reference, which is correct and intentional.
- **Sorting/reversing arrays mutates.** `arr.sort()` mutates in place; use `[...arr].sort()`. `.toSorted()`/`.toReversed()` are the immutable modern equivalents.

## 🎯 Say this in the interview

> "Immutability in React isn't about purity, it's about change detection. React asks a single `===` question — is next the same object as prev — so if I mutate in place the reference is unchanged and the UI goes stale, and if I always create new objects the reference becomes a perfect O(1) change signal. The part people miss is structural sharing: I don't deep-clone the tree, I copy only the nodes on the path to the change and reuse every untouched branch by reference. Update one leaf in a huge tree and I allocate about log-n nodes, and every memoized component reading an unchanged slice skips re-rendering because that slice is referentially equal. The classic bug is shallow copying the root but then pushing into a shared child array. I use Immer — via Redux Toolkit — so I write draft mutations but get a correctly shared, frozen result."

## 🔗 Go deeper

- [Immer](https://immerjs.github.io/immer/) — draft-based immutable updates with automatic structural sharing.
- [Redux — Immutable update patterns](https://redux.js.org/usage/structuring-reducers/immutable-update-patterns) — correct nested spreads and the common mistakes.
- [React — Updating objects in state](https://react.dev/learn/updating-objects-in-state) — why React needs new references, with the mutation traps.
- [Immer — How Immer works](https://immerjs.github.io/immer/produce) — the Proxy/draft mechanism and structural sharing internals.
