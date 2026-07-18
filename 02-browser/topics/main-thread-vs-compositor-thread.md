<div align="center">

# Main thread vs compositor thread

<sub>🌐 Browser · 🔴 Hard · ⏱ 45m · `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The **main thread** runs your JavaScript, style, layout, paint *and* input dispatch, all serialised into one queue; the **compositor thread** only assembles and scrolls already-painted frames — so responsiveness dies the instant one main-thread task runs longer than a frame, and the compositor can do nothing to save you.

---

## 🧠 Mental model

For your application, the main thread is effectively **single-threaded**: everything that needs JavaScript, layout, or paint waits in line behind whatever it's currently doing. The compositor is a fast, *dumb* second thread — it can scroll the page and animate `transform`/`opacity` on its own, but it **cannot run your code, lay out the DOM, or fire your click handler.**

| Main thread | Compositor thread |
|---|---|
| JS execution, the event loop | Threaded scrolling |
| Style, layout, paint, commit | `transform`/`opacity` animations |
| **Input dispatch** (click, keydown) | Producing frames from the committed layer tree |
| `requestAnimationFrame`, timers | (no JavaScript, no layout, no paint) |

The golden rule falls straight out of the table: **keep every main-thread task short**, because a click that arrives mid-task waits until that task finishes.

## ⚙️ How it actually works

**A long task is a task over 50ms.** Not 50ms of total CPU — 50ms *contiguous*, with no chance to yield. Ten 5ms tasks are fine; one 50ms task is a stall.

**Input delay is the price.** A user taps while a 200ms task runs. The `click` handler is a main-thread task too, so it queues *behind* the running one and doesn't execute for ~200ms. That delay is the first component of **INP** (Interaction to Next Paint), the metric that punishes exactly this.

**The compositor keeps scrolling — and that's a trap.** During a long task the compositor can still scroll (if listeners are passive) and keep a `transform` animation alive. So the page *looks* responsive while taps, form input, and DOM updates are frozen. **Scrolling smoothly is not the same as being responsive.**

**Yielding is the fix.** Break long work into chunks and hand control back to the event loop between them, so queued input can run. `await`ing a real macrotask, `scheduler.yield()`, or `postTask` all create a yield point. A microtask does *not* — it runs before the browser can service input.

## 💻 Code

```js
// ❌ One long task: input is blocked for the whole loop.
function process(items) {
  for (const item of items) heavyWork(item); // 300ms straight → 300ms input delay
}

// ✅ Chunk it and yield, so queued clicks/keystrokes run between chunks.
async function process(items) {
  for (let i = 0; i < items.length; i++) {
    heavyWork(items[i]);
    if (i % 50 === 0) await scheduler.yield(); // yield to input, then resume
    // fallback: await new Promise(r => setTimeout(r)); // a real macrotask
  }
}
```

```js
// A microtask does NOT yield to the browser — this still blocks input.
for (const item of items) { await Promise.resolve(); heavyWork(item); } // ❌
```

## ⚖️ Trade-offs

- **Off-main-thread ≠ free.** Moving work to a **Web Worker** unblocks the main thread but costs `postMessage` serialisation (or transfer). Worth it for parsing, diffing, crypto; overkill for a 2ms function.
- **The compositor only rescues three properties.** `transform`, `opacity`, `filter`. Anything needing new geometry or pixels is back on the main thread — you can't offload layout.
- **Yielding adds latency and scheduling overhead.** Yield too often and total throughput drops; yield too rarely and you get long tasks. Chunk sizes around a few ms are the sweet spot.

## 💣 Gotchas interviewers probe

- **Smooth scroll during jank fools everyone.** The compositor scrolls while the main thread is blocked, so the page feels fine until you tap and nothing happens. Scroll is not a responsiveness signal.
- **`requestAnimationFrame` is main-thread.** A JS-driven animation janks under load while a *CSS* `transform` animation on the same page stays perfectly smooth.
- **A non-passive `wheel`/`touchstart` listener drags scrolling onto the main thread** — the compositor must wait to learn if you'll `preventDefault()`. Mark scroll listeners `{ passive: true }`.
- **Long tasks are about contiguity, not total work.** TBT (Total Blocking Time) sums only the part of each task *over* 50ms — that's the number to drive down.
- **Hydration is the canonical long task.** Framework startup runs one big synchronous pass; that's why time-to-interactive lags first paint on SSR apps.

## 🎯 Say this in the interview

> "The main thread is serial for my app: JS, style, layout, paint, and input dispatch all share one queue, so a single task longer than a frame blocks everything behind it — including the click handler the user is waiting on. That input delay is the first part of INP. The compositor thread is separate but limited: it can scroll and animate `transform`/`opacity` without the main thread, which is great, but it can't run my code or update the DOM. The trap is that the page keeps scrolling smoothly during a long task, so it *looks* fine while it's actually frozen to input. So I keep tasks short — I chunk heavy work and yield with `scheduler.yield()` or a real macrotask between chunks, push pure computation into a worker, and remember a microtask doesn't yield, so an await-loop over resolved promises still blocks input."

## 🔗 Go deeper

- [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks) — the yielding patterns and why `scheduler.yield()` beats `setTimeout`.
- [web.dev — Interaction to Next Paint (INP)](https://web.dev/articles/inp) — how input delay, processing, and presentation add up to the metric.
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — the main/compositor split and threaded scrolling.
