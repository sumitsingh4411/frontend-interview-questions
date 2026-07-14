<div align="center">

# Fiber architecture

<sub>⚛️ React · 🔴 Hard · ⏱ 1.5h · `#internals`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Fiber is React's reimplementation of the reconciler as an **interruptible, resumable** process. A "fiber" is both a **unit of work** and a **node** in a linked-list tree that mirrors your components. Splitting rendering into these units is what lets React 18 pause, prioritise, and abandon work mid-flight — the foundation everything "concurrent" is built on.

---

## 🧠 Mental model

The old (pre-16) reconciler was recursive: once it started walking your tree it ran to completion, synchronously, blocking the main thread. If that took 50ms, the page froze for 50ms — dropped frames, janky typing.

Fiber's core idea: **turn recursion into a loop over a linked list.** Instead of the call stack driving the traversal, React keeps its own pointers (`child`, `sibling`, `return`) and processes one fiber at a time. Between units it can check "have I run out of time this frame? is there something more urgent?" and, if so, yield to the browser and resume later.

> The Virtual DOM told you *what* changed. Fiber controls *when* and *in what order* React does the work of finding out — it's a scheduler, not a diff format.

Rendering happens in **two phases**, and the distinction is the whole exam:

- **Render/reconcile phase** — build the work-in-progress tree, run components, diff. **Interruptible, can be thrown away, must be pure** (React may run it multiple times).
- **Commit phase** — apply mutations to the DOM, run layout effects, refs. **Synchronous, atomic, never interrupted.**

## ⚙️ How it actually works

**A fiber node** holds: the element `type`, its `key`, `stateNode` (the DOM node or class instance), the `pendingProps`/`memoizedProps`, the `memoizedState` (the hooks linked list!), `flags` (side-effects to commit), `lanes` (priority), and the three tree pointers `child` / `sibling` / `return`.

**Double buffering.** React keeps two trees: `current` (what's on screen) and `workInProgress` (what it's building). Each fiber has an `alternate` pointer to its counterpart. React mutates the WIP tree freely; if the render is interrupted or discarded, `current` is untouched and the user sees no half-finished UI. On commit, React swaps: `workInProgress` *becomes* `current` in one pointer flip. That's why an aborted concurrent render is safe — it was never on screen.

**The work loop.** `performUnitOfWork` runs `beginWork` on a fiber (render it, diff children, create child fibers), then descends to `child`, then across `sibling`, then back up via `return` running `completeWork` (build the DOM subtree, bubble up effect flags). In concurrent mode the loop is `while (fiber && !shouldYield())` — `shouldYield()` checks the frame deadline via the scheduler.

**Lanes = priority.** React 18 replaced the old `expirationTime` with a **bitmask of "lanes."** A click is a high-priority (sync) lane; a `startTransition` update is a low-priority (transition) lane. React can render an urgent lane, interrupting an in-progress transition render, commit the urgent update, then restart the transition. This is literally how `useTransition` keeps typing responsive.

**Effect list & flags.** During `completeWork`, fibers bubble their side-effect `flags` (Placement, Update, Deletion) up to the parent, so commit can walk only the fibers that actually changed instead of the whole tree.

## 💻 Code

You never touch fibers directly, but the observable behaviour is testable:

```jsx
// Concurrent rendering means the render phase can run MORE THAN ONCE
// before committing. So the render body must be pure — no side effects here.
function Row({ item }) {
  // ❌ Mutating during render: may run twice, or be discarded. Corrupts state.
  cache.push(item.id);          // side effect in render phase — forbidden
  return <li>{item.name}</li>;
}

// ✅ Side effects belong in the commit phase (effects), which runs exactly once.
function Row({ item }) {
  useEffect(() => { cache.push(item.id); }, [item.id]);
  return <li>{item.name}</li>;
}
```

```jsx
// Fiber's interruptibility is what makes this non-blocking. The heavy render
// triggered by setQuery runs in a low-priority lane React can pause for keystrokes.
const [isPending, startTransition] = useTransition();
function onType(e) {
  setInput(e.target.value);                 // urgent lane — commits immediately
  startTransition(() => setQuery(e.target.value)); // transition lane — interruptible
}
```

## ⚖️ Trade-offs

- **Interruptibility isn't free.** Render can run multiple times, so React demands purity and doubles down on it in StrictMode. The mental cost of "render might run twice" is the tax you pay for a schedulable UI.
- **Fiber didn't make rendering *faster* per se** — a single uninterrupted render is comparable to before. It makes rendering *yieldable*, trading raw throughput for responsiveness. That's the right trade for interactive apps and the wrong framing for a benchmark.
- **You rarely need to know this** — until you're debugging a StrictMode double-invoke, a torn external store, or why a transition feels laggy. Then it's the only model that explains what you see.

## 💣 Gotchas interviewers probe

- **"Is the render phase synchronous?"** In legacy mode, yes. In concurrent mode (React 18 `createRoot` + a transition), the render phase is *interruptible*; the commit phase is always synchronous and atomic. Conflating the two is the most common miss.
- **Why render must be pure:** because Fiber may call it multiple times or discard the result. Side effects in render tear under concurrency — hence effects and StrictMode's double-invoke.
- **Double buffering** is *why* an interrupted render never shows a half-built UI — `current` stays live until the atomic commit swap.
- **Fiber ≠ Virtual DOM.** The VDOM is the element description; Fiber is the reconciler + scheduler operating over it. People use the terms interchangeably and shouldn't.
- **"Time slicing" needs concurrent features to activate.** Just upgrading React doesn't make renders interruptible — you need `startTransition`/`useDeferredValue`/Suspense to put work in a non-urgent lane.
- **The hooks state lives on the fiber** (`memoizedState` linked list). That's the concrete reason hook order must be stable — see Rules of Hooks.

## 🎯 Say this in the interview

> "Fiber is the reconciler rewritten so rendering can be interrupted and resumed. The old one recursed through the tree synchronously and blocked the main thread; Fiber turns that into a loop over a linked list of work units, checking a frame deadline between units so it can yield to the browser. Work splits into two phases: the render phase, which builds a work-in-progress tree, is interruptible and must be pure because React might run it more than once or throw it away — and the commit phase, which mutates the DOM, is synchronous and atomic. It uses double buffering, a current tree and a work-in-progress tree with an alternate pointer, so an aborted render never shows a half-finished UI; commit is just a pointer swap. Priorities are lanes — that's how a keystroke can preempt a transition render. Everything concurrent — transitions, `useDeferredValue`, Suspense — sits on top of this."

## 🔗 Go deeper

- [Lin Clark — A Cartoon Intro to Fiber](https://www.youtube.com/watch?v=ZCuYPiUIONs) — the canonical visual explanation from the team.
- [React Fiber Architecture — Andrew Clark](https://github.com/acdlite/react-fiber-architecture) — the original design doc, still the clearest written source.
- [react.dev — Keeping components pure](https://react.dev/learn/keeping-components-pure) — why interruptibility demands purity.
- [react.dev — `startTransition`](https://react.dev/reference/react/startTransition) — lanes and interruptible rendering in practice.
