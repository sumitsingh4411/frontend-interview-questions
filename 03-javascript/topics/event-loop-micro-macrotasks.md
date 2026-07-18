<div align="center">

# Event loop, micro/macrotasks

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#async` `#internals`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — JS runs one **macrotask** to completion, then **drains the entire microtask queue** before it's allowed to render or pick the next macrotask. Promises, `await` continuations and `queueMicrotask` are microtasks; `setTimeout`, I/O and events are macrotasks. "Micro beats macro, always" is the whole exam.

---

## 🧠 Mental model

JavaScript has one call stack and one thread. It cannot do two things at once, so "async" really means: *register a callback, unwind the stack, and let the event loop hand it back later.* The only interesting question is **in what order** those callbacks come back.

There are two queues, and they are not equal:

```
┌─ one loop turn ────────────────────────────────────┐
│ 1. pop ONE macrotask, run it to completion         │
│ 2. drain the WHOLE microtask queue                 │
│    (microtasks queued during this step run too)    │
│ 3. requestAnimationFrame → style → layout → paint  │
└─ repeat ───────────────────────────────────────────┘
```

The asymmetry is the point: **one macrotask per turn, but microtasks are drained exhaustively** — including any microtasks those microtasks schedule. That's why a promise chain always finishes before the next `setTimeout` fires.

## ⚙️ How it actually works

**Macrotask sources:** `setTimeout`/`setInterval`, DOM events, `MessageChannel`, network I/O callbacks, `setImmediate` (Node).
**Microtask sources:** `Promise.then/catch/finally`, the continuation after every `await`, `queueMicrotask`, `MutationObserver`.

Three consequences that separate a strong answer:

- **`setTimeout(fn, 0)` is not "run now."** It's "run after the current task *and* every microtask *and* possibly a paint." Browsers also clamp nested timers to a **~4ms floor** after 5 levels of nesting. If you want "after this stack unwinds but before anything else," that's `queueMicrotask`, not `setTimeout(0)`.
- **Rendering happens between macrotasks, never mid-task.** A synchronous 200ms loop freezes the frame; so does an *infinite microtask* — because the loop won't paint until the microtask queue is empty. A self-scheduling `setTimeout` does *not* freeze the page, because each turn yields a paint opportunity.
- **`await` is a microtask boundary.** Everything after an `await` is scheduled as a microtask when the awaited value settles — even `await 5`, which still costs one tick.

## 💻 Code

```js
console.log('1 — sync');
setTimeout(() => console.log('2 — timeout (macro)'), 0);
Promise.resolve().then(() => console.log('3 — promise (micro)'));
queueMicrotask(() => console.log('4 — queueMicrotask (micro)'));
console.log('5 — sync');
// Order: 1, 5, 3, 4, 2
// Both sync logs first, then the whole microtask queue, THEN the timer.
```

```js
// await desugars to a microtask-scheduled continuation
async function f() {
  console.log('a');
  await null;          // pause here; schedule the rest as a microtask
  console.log('c');    // runs after all currently-queued microtasks
}
f();
console.log('b');
// Order: a, b, c  — 'c' is a continuation, not synchronous
```

```js
// Microtask starvation — this freezes the tab, no paint ever happens
function loop() { Promise.resolve().then(loop); }
loop(); // the microtask queue never empties → step 3 never runs
```

## ⚖️ Trade-offs

- **`queueMicrotask` for "after this stack, before paint"; `setTimeout` for "yield to the browser."** If you batch DOM reads/writes in a microtask you get them *this* frame; in a timeout you slip to a later frame.
- **Don't do heavy work in a chain of microtasks** expecting the UI to update between them — it won't. Break long work across *macrotasks* (or `requestIdleCallback`) so paints and input can interleave.
- **Node's loop is not the browser's.** `process.nextTick` outranks the promise microtask queue, and macrotasks are split into phases (timers → poll → check). Answering a Node question with browser semantics is a tell.

## 💣 Gotchas interviewers probe

- **"Which logs first, a resolved promise or `setTimeout(0)`?"** The promise — every time. Microtasks fully drain before the next macrotask. If a candidate hesitates here, they don't have the model.
- **`setTimeout(fn, 0)` still isn't 0ms.** Minimum ~4ms after nesting, and it runs behind all microtasks. It's the classic "why is my `setTimeout(0)` slow" bug.
- **A microtask scheduled *inside* a microtask runs in the same drain**, before the next macrotask. That's how an infinite microtask starves rendering.
- **`await` on a non-promise still yields.** `await 5` schedules a microtask; code after it does not run synchronously. Surprises people writing "sync-looking" code.
- **`requestAnimationFrame` is not a microtask.** It runs in the render step, *after* microtasks, before paint — roughly once per frame (~16.7ms), throttled and paused in background tabs.
- **Node's `process.nextTick` beats promises**, which is itself a footgun — recursive `nextTick` starves the I/O phase.

## 🎯 Say this in the interview

> "There's one thread and one stack, and the event loop feeds it from two queues. The rule I anchor on: run one macrotask to completion, then drain the *entire* microtask queue — including microtasks queued during the drain — and only then consider rendering and the next macrotask. Promises, `await` continuations and `queueMicrotask` are microtasks; `setTimeout` and events are macrotasks, so a resolved promise always fires before a zero-delay timer. Practically, `setTimeout(0)` isn't zero — it's clamped to about 4ms and it sits behind every microtask. And rendering only happens between macrotasks, so a runaway microtask loop freezes the page while a self-rescheduling `setTimeout` doesn't. Node reorders this with `process.nextTick` and phase-based macrotasks, which I'd call out if we're talking server-side."

## 🔗 Go deeper

- [Jake Archibald — In The Loop (JSConf)](https://www.youtube.com/watch?v=cCOL7MC4Pl0) — the definitive visual walkthrough of tasks, microtasks and rendering.
- [Jake Archibald — Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) — the written companion, with the exact ordering rules.
- [MDN — Using microtasks in JavaScript](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) — `queueMicrotask`, when microtasks run, why they exist.
- [HTML spec — Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — the normative processing model, if you want the source of truth.
