<div align="center">

# Concurrent rendering

<sub>⚛️ React · 🔴 Hard · ⏱ 1h · `#concurrent`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — React 18 made rendering **interruptible**: it can render a tree in memory, pause to let the browser handle input, then resume — or throw the work away and restart. It is **not multi-threaded**; it's cooperative scheduling on the single main thread. And it's **not a mode** — nothing behaves concurrently until you use a feature (transitions, Suspense, `useDeferredValue`) that schedules low-priority work.

---

## 🧠 Mental model

In React ≤17, once a render started it ran to completion — synchronous, uninterruptible, blocking. A big update could hold the main thread for tens of milliseconds and drop input frames.

Concurrent React changes the *shape* of rendering, not its speed. Think of the renderer as able to prepare **multiple versions of the UI at once** without blocking the thread: it does a chunk of work, asks "should I yield to the browser?", hands control back so a click or keystroke gets handled, then picks up where it left off. A high-priority update can **interrupt and discard** an in-progress low-priority render.

The headline that catches people out: **concurrent rendering makes nothing faster on its own.** Total work is the same or slightly more. What changes is *when* that work runs relative to user input — the app stays responsive under load. It's a latency-distribution win, not a throughput win.

## ⚙️ How it actually works

The unit of work is a **fiber** — one node in the tree. The render phase is now a loop: process a fiber, check `shouldYield()` (driven by a frame budget), and if time's up, bail back to the browser and continue on the next scheduler tick. This is **time-slicing**.

Updates are assigned **lanes** (priorities): discrete input (click, keypress) is urgent; `startTransition` work is a transition lane; default updates sit between. When an urgent update arrives during a transition render, React throws away the half-built work-in-progress tree and restarts with the urgent change included.

Because a render can run **multiple times or be discarded before committing**, the render phase must be **pure and idempotent** — no side effects, no mutation of external state. This is exactly why `StrictMode` double-invokes components, reducers, and state updaters in development: to surface impurity that concurrency would otherwise turn into a Heisenbug. The **commit** phase, by contrast, is still synchronous and atomic — the DOM is never left half-updated.

Two other React 18 changes ride along: **automatic batching** (updates in promises, timeouts, and native handlers now batch too, not just React event handlers) and **tearing risk** for external mutable stores — solved by `useSyncExternalStore`.

## 💻 Code

```jsx
// createRoot enables the concurrent renderer — but nothing is concurrent yet.
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(<App />);
// ❌ ReactDOM.render(...) is the legacy blocking path (removed in 18+).
```

```jsx
// Concurrency is opt-in per update. This update is interruptible:
const [isPending, startTransition] = useTransition();
startTransition(() => setFilter(next)); // low priority, yields to typing/clicks

// Purity is the contract concurrency depends on:
function Row({ n }) {
  // ❌ side effect in render — may run twice or be discarded, corrupting state
  cache.push(n);
  // ✅ derive, don't mutate; effects belong in useEffect / event handlers
  return <li>{n}</li>;
}
```

## ⚖️ Trade-offs

- **You don't turn it on — you opt into features.** `createRoot` unlocks the concurrent renderer, but the app behaves identically until you use transitions, `useDeferredValue`, or Suspense. There's no global "concurrent mode" switch to feel.
- **It buys responsiveness, not raw speed.** If your bottleneck is a genuinely expensive render, concurrency keeps input alive but the work still takes as long — you still need memoization, virtualization, or a worker.
- **It raises the purity bar.** Code that quietly mutated during render "worked" in React 17. Under concurrency that's a real bug, which is why `StrictMode`'s double-invoke is non-negotiable in new code.

## 💣 Gotchas interviewers probe

- **"Concurrent mode" is the wrong phrase.** React deliberately renamed it to concurrent *features*. There is no mode; there are opt-in APIs.
- **Render must be pure because it can run multiple times or be thrown away.** Side effects, subscriptions, or mutation in render break under interruption — the senior signal here.
- **`StrictMode` double-invokes render, reducers, and updaters in dev.** It's not a bug; it's surfacing impurity before concurrency does. Effects still fire once per commit.
- **Automatic batching changed behaviour.** Multiple `setState`s in a `setTimeout`/`fetch().then` now batch into one render — occasionally a surprise if you relied on intermediate renders. `flushSync` opts out.
- **External stores can tear.** Reading mutable external state with `useState`+`useEffect` can show inconsistent values across a sliced render — use `useSyncExternalStore`.
- **Nothing gets faster automatically.** Candidates who claim "React 18 speeds up rendering" miss the point — it redistributes *when* work happens.

## 🎯 Say this in the interview

> "Concurrent rendering means React 18 can interrupt itself. Before, a render ran to completion and blocked the main thread; now React renders in memory a fiber at a time, yields to the browser between units of work, and can pause, resume, or throw away a render if a higher-priority update comes in. It's cooperative scheduling on one thread, not multithreading. The crucial thing is it doesn't make rendering faster — the work is the same, it's just scheduled so urgent input never waits behind a big low-priority render. It's also not a mode you switch on: `createRoot` enables the renderer, but nothing behaves concurrently until I use transitions, `useDeferredValue`, or Suspense. And because a render can run multiple times or be discarded, it hardens the requirement that render is pure — which is exactly what `StrictMode`'s double-invoke is there to catch."

## 🔗 Go deeper

- [react.dev — React 18 announcement](https://react.dev/blog/2022/03/29/react-v18) — concurrent features, automatic batching, and the "not a mode" framing.
- [react.dev — Keeping components pure](https://react.dev/learn/keeping-components-pure) — why interruptible rendering demands purity.
- [react.dev — `StrictMode`](https://react.dev/reference/react/StrictMode) — the double-invoke that surfaces concurrency bugs early.
