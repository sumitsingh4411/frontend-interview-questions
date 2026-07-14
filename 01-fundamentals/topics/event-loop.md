<div align="center">

# Event Loop

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#async` `#internals`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — JavaScript runs on one thread. The event loop is the rule that decides *what runs next*: it drains the call stack, then runs **all microtasks** (Promises, `queueMicrotask`), then renders, then takes **one macrotask** (timer, I/O, event) — and repeats. Understanding that order explains almost every async surprise.

---

## 🧠 Mental model

There is **one call stack**, and it must be empty before anything queued can run. Around it sit queues, and the loop's priority is strict:

```
┌─ run current task to completion (stack empties) ─┐
│                                                  │
│  1. drain the ENTIRE microtask queue             │  ← Promises, await, MutationObserver
│  2. run pending requestAnimationFrame callbacks  │
│  3. layout + paint (if needed)                   │
│  4. take ONE macrotask from the queue            │  ← setTimeout, events, fetch resolution
└──────────────── loop ────────────────────────────┘
```

The one line that unlocks everything: **microtasks run to exhaustion between every macrotask.** A Promise `.then` always beats a `setTimeout(…, 0)`, no matter the order they were scheduled.

## ⚙️ How it actually works

"Async" doesn't mean "another thread" — it means "come back to this later, when the stack is clear." The browser (not JS) owns timers, network, and the DOM. When a timer fires or a fetch resolves, the host pushes a callback into a queue; the event loop delivers it only when the stack is empty.

**Two queues, different priorities:**

- **Macrotasks** (a.k.a. tasks): `setTimeout`, `setInterval`, `setImmediate`, I/O, UI events, `MessageChannel`. **One** is processed per loop turn.
- **Microtasks**: Promise callbacks, `await` continuations, `queueMicrotask`, `MutationObserver`. **All** of them — including any queued *while draining* — run before the next macrotask or paint.

This is why an infinite microtask loop **freezes rendering** (paint never gets a turn) but an infinite `setTimeout` chain does not (each iteration is a separate macrotask, so paint slips in between).

`requestAnimationFrame` is a special queue run *right before paint* — the correct place for visual updates. `requestIdleCallback` runs in leftover time after paint.

## 💻 Code

The classic ordering question — know why:

```js
console.log('A');                         // 1 — sync
setTimeout(() => console.log('B'), 0);    // 4 — macrotask
Promise.resolve().then(() => console.log('C')); // 3 — microtask
console.log('D');                         // 2 — sync
// Output: A, D, C, B
// Sync runs first, stack empties, ALL microtasks (C) drain, THEN one macrotask (B).
```

```js
// await is just Promise syntax — everything after it is a microtask continuation.
async function f() {
  console.log(1);
  await null;          // suspends; rest is queued as a microtask
  console.log(3);
}
console.log(0);
f();                   // logs 1
console.log(2);
// Output: 0, 1, 2, 3
```

```js
// ❌ Blocks the whole thread — no clicks, no paint, for 3 seconds.
const end = Date.now() + 3000;
while (Date.now() < end) {}

// ✅ Yield to the loop so the UI can breathe between chunks of work.
async function chunkedWork(items) {
  for (const item of items) {
    process(item);
    await new Promise(r => setTimeout(r)); // let a macrotask (paint/input) through
  }
}
```

## ⚖️ Trade-offs

- **Microtasks are cheap and immediate but can starve the loop.** Chaining Promises that schedule more microtasks blocks paint and input just as effectively as a `while(true)`.
- **`setTimeout(fn, 0)` is not 0ms** — it's "after this turn," clamped to ~4ms after 5 nested timers, and it yields to rendering, which microtasks don't. Use it when you *want* to unblock paint.
- **Long tasks (>50ms) hurt INP.** The fix is chunking work across macrotasks (`scheduler.yield()` / `setTimeout`) or offloading to a **Web Worker** — the only real escape from the single thread.
- **When NOT to micro-optimise ordering:** if correctness depends on subtle microtask-vs-macrotask timing, the code is fragile — restructure it.

## 💣 Gotchas interviewers probe

- **"Does `setTimeout(fn, 0)` run immediately?"** No — it waits for the stack to clear *and* all microtasks to drain, and it's clamped to a minimum delay.
- **Promise `.then` always precedes `setTimeout`**, regardless of declaration order. The #1 tested fact.
- **A microtask that queues a microtask that queues a microtask… runs forever before the next paint.** This freezes the tab.
- **`await` splits a function** — code after `await` is a microtask, so it runs *after* the current synchronous code finishes, even if the awaited value is already resolved.
- **Node had a distinct model** (`process.nextTick` > microtasks, plus phases like `setImmediate`); modern Node aligns more closely with browsers, but `nextTick` still jumps the queue.
- **The event loop is single-threaded; Web Workers are the only true parallelism** — and they can't touch the DOM.

## 🎯 Say this in the interview

> "JavaScript is single-threaded with one call stack, and the event loop decides what runs when. Each turn it runs the current task to completion, then drains the *entire* microtask queue — Promises, awaits, `queueMicrotask` — then does a render if needed, then takes exactly one macrotask like a `setTimeout` or an event. So a Promise callback always beats a zero-delay timer. The practical consequences I care about: a runaway microtask chain freezes paint because rendering never gets a turn, and any task over about 50ms hurts INP, so I chunk heavy work across macrotasks or push it to a Web Worker, which is the only real parallelism on the platform. `requestAnimationFrame` is the right queue for visual updates because it fires just before paint."

## 🔗 Go deeper

- [javascript.info — Event loop](https://javascript.info/event-loop) — microtasks vs macrotasks, clearly.
- [MDN — The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#the_event_loop) — the spec's model in plain terms.
- [Jake Archibald — In the loop (talk)](https://www.youtube.com/watch?v=cCOL7MC4Pl0) — the definitive visual explanation.
- [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks) — yielding, `scheduler.yield`, and INP.
