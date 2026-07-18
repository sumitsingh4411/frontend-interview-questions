<div align="center">

# Microtasks vs macrotasks

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#async`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The event loop runs **one macrotask**, then **drains the entire microtask queue to completion** before it's allowed to render or pick up the next macrotask. Promises are microtasks; `setTimeout` is a macrotask. That "drain to completion" rule is the whole exam.

---

## 🧠 Mental model

There aren't two equal queues — there's a hierarchy. One turn of the loop looks like:

```
┌─ take ONE macrotask (a timer, an event, a message)   ┐
│  run it to completion                                 │
│  ── then DRAIN every microtask ──                     │  ← runs microtasks queued
│     (including microtasks queued BY microtasks)       │     by other microtasks too
│  ── rendering opportunity (style, layout, paint) ──   │
└─ loop                                                  ┘
```

The mental shortcut: **a microtask is "finish this before anyone — including the renderer — looks at the DOM again."** A macrotask is "get in line for a future turn." Promise callbacks are microtasks precisely because you want the whole promise chain to settle as one atomic-looking unit, before a paint can show a half-updated state.

## ⚙️ How it actually works

**What goes where:**

| Microtasks | Macrotasks (tasks) |
|---|---|
| `.then` / `.catch` / `.finally` | `setTimeout` / `setInterval` |
| `await` continuations (desugar to `.then`) | DOM events, `postMessage`, `MessageChannel` |
| `queueMicrotask()` | `setImmediate` (Node), I/O callbacks |
| `MutationObserver` | `requestAnimationFrame`\* (a separate render step) |

The load-bearing rule: **after each macrotask the microtask queue is emptied fully**, and any microtask scheduled *during* the drain is also run in the same drain. Rendering happens *after* that drain, never between two microtasks. This is why a promise chain never lets the user see an intermediate frame — but also why an unbounded microtask loop **freezes the tab**: the loop can never reach its rendering step.

`setTimeout(fn, 0)` is not really zero — after ~5 nested timers browsers clamp the delay to **~4ms**. For a genuine "next macrotask, no clamp" you use `MessageChannel`.

## 💻 Code

```js
console.log('1 sync');
setTimeout(() => console.log('5 timeout (macrotask)'), 0);
Promise.resolve()
  .then(() => console.log('3 promise'))
  .then(() => console.log('4 chained promise'));
queueMicrotask(() => console.log('microtask'));
console.log('2 sync end');

// Order: 1 sync → 2 sync end → 3 promise → microtask → 4 chained → 5 timeout
// ALL microtasks (incl. chained ones) drain before the timeout ever runs.
```

The starvation trap — this hangs the page forever:

```js
// ❌ Each microtask queues another, so the queue never empties,
//    the render step is never reached, and the tab locks up.
function spin() { Promise.resolve().then(spin); }
spin();

// ✅ Yield to a MACROtask to let rendering and input in between chunks.
function chunk() { doWork(); setTimeout(chunk, 0); } // or scheduler.yield()
```

## ⚖️ Trade-offs

- **Reach for a microtask when you need to coalesce state before paint** — batching DOM reads, settling a promise chain, `MutationObserver` reacting to a burst of mutations in one go. The atomicity is the feature.
- **Reach for a macrotask when you need to *yield*** — let the browser paint, process input, or run other pending tasks. Long synchronous work chunked with microtasks doesn't help; only a macrotask (or `scheduler.yield()`) actually gives the frame back.
- **When NOT to use `queueMicrotask`:** anything user-perceptible or long-running. Microtasks run *before* the next paint, so they extend the current task and delay rendering — the opposite of responsiveness.

## 💣 Gotchas interviewers probe

- **"Does `await` create a macrotask?"** No. `await x` is sugar for `x.then(continuation)`, so the code after `await` resumes as a **microtask**. Getting this wrong is the classic tell.
- **Microtask starvation blocks rendering.** Because the queue drains fully before paint, an ever-growing microtask queue means the browser *never* paints. Most candidates assume "promises are async so they can't block" — they absolutely can.
- **Node's `process.nextTick` beats promises.** In Node, the nextTick queue drains *before* the promise microtask queue. There's no `nextTick` in browsers.
- **`setTimeout(0)` is clamped to ~4ms** after nesting; it is not a real "run immediately." Use `MessageChannel`/`postMessage` for an unclamped macrotask.
- **A rejected promise with no handler in the current drain** surfaces as `unhandledrejection` — because the engine waits until the microtask checkpoint to decide nobody caught it.

## 🎯 Say this in the interview

> "The event loop isn't two equal queues. It runs one macrotask — a timer, an event, a message — and then drains the *entire* microtask queue before it's even allowed to render or take the next macrotask. Promise `.then` callbacks and `await` continuations are microtasks; `setTimeout` is a macrotask. The consequence I care about most is atomicity versus starvation: a promise chain settles fully before any paint, which is great for keeping the DOM consistent, but an unbounded microtask loop will freeze the tab because the render step never runs. So when I actually want to *yield* — let the browser paint or take input — I use a macrotask like `setTimeout` or, better, `scheduler.yield()`, not another microtask."

## 🔗 Go deeper

- [MDN — Using microtasks & `queueMicrotask`](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) — the canonical explanation of the drain rule.
- [Jake Archibald — Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) — the definitive deep dive, with animations.
- [HTML spec — Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — the actual processing model, if you want ground truth.
