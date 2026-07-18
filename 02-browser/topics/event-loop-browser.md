<div align="center">

# Event loop (browser)

<sub>🌐 Browser · 🟡 Medium · ⏱ 1h · `#async` `#internals`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The browser's event loop is not "a queue of callbacks" — it's a **scheduler over many task sources plus a rendering step that only runs when the display is ready for it**, and everything you feel as jank is a task overstaying its welcome between two vsyncs.

---

## 🧠 Mental model

Most people picture one queue. The spec describes something closer to a loop with a fixed itinerary, where rendering is a *first-class step*, not a callback:

```
┌─▶ pick ONE task  (from a task SOURCE the browser chooses — not strict FIFO)
│   run it to completion
│   drain microtasks
│   ── is it time to render? ────────── no ──┐  (no vsync due / tab hidden
│   ├ run rAF callbacks                      │   / nothing changed → skip)
│   ├ deliver ResizeObserver, IntersectionObserver
│   ├ style → layout → paint → commit        │
│   └ drain microtasks after each            │
└───────────────────────────────────────────◀┘
```

The load-bearing insight: **"one task per turn" is true, but "one turn per frame" is not.** At 60Hz the browser has ~16.6ms between vsyncs and will happily run *many* tasks in that window, or *zero* rendering steps for many turns if the tab is backgrounded. The rendering step is opportunistic — the browser skips it whenever painting would be wasted.

Second insight: **the event loop is single-threaded, the browser is not.** Fetch, decode, rasterisation, compositing all happen elsewhere; the loop is just where *your* JS and the DOM live.

## ⚙️ How it actually works

**Task sources, not one queue.** The spec defines separate sources — timers, user interaction, DOM manipulation, networking, history traversal — and requires only that tasks *within* a source stay in order. Between sources the browser picks freely, and Chrome absolutely does: an input task will jump ahead of a pile of pending timers. This is why "setTimeout is FIFO" is only accidentally true.

**Rendering is throttled to the display, then throttled again.** The `update the rendering` step runs at most once per vsync. Then the browser skips it if the tab is hidden, the frame is occluded, or nothing was invalidated. Consequences that matter: `requestAnimationFrame` stops firing in a background tab, and `setInterval(f, 16)` keeps firing — which is exactly why timer-driven animation drifts and burns battery while rAF doesn't.

**Timers are a lower bound, not a promise.** `setTimeout(f, 0)` clamps to ~4ms after five levels of nesting, and a hidden tab clamps timers to ≥1s. A timer says "not before"; the loop delivers it when it gets around to it.

**Input is special.** Discrete input (click, keydown) gets its own high-priority source. Continuous input (`pointermove`, `wheel`, `scroll`) is *coalesced* — the browser merges pending moves and delivers one task aligned with the frame, which is why you get one `pointermove` per frame rather than one per hardware sample. `getCoalescedEvents()` gives you the raw samples back when you actually need them (drawing apps).

**Every agent has its own loop.** A worker has its own event loop and never blocks yours. Same-origin iframes share one loop with the opener — so a busy iframe janks the parent, and a cross-origin one (site-isolated into its own process) generally does not.

## 💻 Code

The measurement that actually tells you whether the loop is healthy:

```js
// A long task is anything that owned the loop for >50ms — during which
// no rendering step and no input handling could possibly happen.
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.warn('blocked the loop', entry.duration, entry.attribution);
  }
}).observe({ type: 'longtask', buffered: true });
```

Yielding correctly — the difference between "async" and "actually gives the frame back":

```js
// ❌ Async, but never yields. The loop is held for the whole run;
//    no paint, no input, no rendering step. `await` on an already-resolved
//    promise is a MICROtask — it does not end the current task.
async function process(items) {
  for (const item of items) await transform(item); // still one long task
}

// ✅ Yield to a real task so the loop can render and take input.
async function process(items) {
  for (const [i, item] of items.entries()) {
    await transform(item);
    if (i % 50 === 0) await scheduler.yield();  // or: new Promise(r => setTimeout(r))
  }
}
```

Reading layout inside rAF, not outside — because rAF runs *before* style/layout:

```js
requestAnimationFrame(() => {
  el.style.transform = 'translateX(100px)'; // write
  // ❌ el.offsetTop here forces a synchronous layout — you just paid
  //    for the layout you were about to get for free 200µs later.
});
```

## ⚖️ Trade-offs

- **Chunking with `setTimeout` yields, but at ~4ms a hop and with no priority signal** — a thousand chunks costs seconds of pure clamp. `scheduler.postTask()` and `scheduler.yield()` express priority and re-enter ahead of unrelated work; prefer them where available.
- **Workers remove work from the loop but add a serialisation tax.** Structured cloning a large object can cost more than the computation you moved. Worth it for sustained CPU work, a loss for a 2ms function called on every keystroke.
- **When NOT to yield:** yielding mid-way through a DOM mutation sequence lets the browser paint your half-finished state. Either finish the mutation batch or don't start it — an intermediate frame is worse than a slightly longer task.
- **`requestIdleCallback` is a promise of leftovers, not a schedule.** Under sustained load it may never run. Never put anything user-visible in it.

## 💣 Gotchas interviewers probe

- **"`await` yields to the event loop."** No. It yields to the *microtask queue*. The current task keeps the loop until it returns. This is the most common misconception in the whole topic, and it's why "I made it async" doesn't fix jank.
- **rAF runs *before* layout, not after paint.** It's your last chance to write styles cheaply. People schedule measurements there and force a synchronous reflow.
- **A rendering step is not guaranteed per turn.** Background tabs, occluded frames, and unchanged pixels all skip it. Code that assumes "rAF always fires next frame" breaks when the tab is hidden — use the Page Visibility API.
- **`setInterval` doesn't wait for your callback.** If the callback takes longer than the interval, callbacks pile up and the loop never breathes. `setTimeout` chaining is self-correcting; `setInterval` is not.
- **Same-origin iframes share your event loop.** A third-party widget in a same-origin frame can jank your main thread; site isolation only saves you cross-origin.
- **`pointermove` is coalesced to one-per-frame.** Candidates who claim they get every hardware sample have never built a drawing tool.
- **Long tasks block input, not just paint.** That's INP, and it's why "we hit 60fps" and "the app feels slow" coexist happily.

## 🎯 Say this in the interview

> "I think of the event loop as a scheduler over many task sources, with rendering as a real step in the loop rather than a callback. It takes one task, runs it to completion, drains microtasks, and then *may* render — may, because the rendering step is throttled to vsync and skipped entirely if the tab's hidden or nothing was invalidated. The thing I'd emphasise is that `await` does not yield the loop; it queues a microtask, and the current task keeps the thread. So making a function async doesn't fix jank — only ending the task does, via `scheduler.yield()` or a timer. And the browser doesn't treat sources equally: input gets priority over timers, and continuous input like `pointermove` is coalesced to one delivery per frame. When I'm diagnosing this I don't guess — I watch the `longtask` observer, because anything over 50ms means no paint and no input handling for 50ms."

## 🔗 Go deeper

- [Jake Archibald — In The Loop (JSConf)](https://www.youtube.com/watch?v=cCOL7MC4Pl0) — the talk that makes the rendering step click. Watch it once, properly.
- [HTML spec — Event loops](https://html.spec.whatwg.org/multipage/webappapis.html#event-loops) — task sources and the exact `update the rendering` steps.
- [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks) — yielding strategies, and why `await` alone isn't one.
- [MDN — Long Tasks API](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceLongTaskTiming) — measuring loop starvation instead of guessing at it.
