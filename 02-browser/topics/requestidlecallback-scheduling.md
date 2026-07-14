<div align="center">

# `requestIdleCallback` & scheduling

<sub>🌐 Browser · 🟡 Medium · ⏱ 30m · `#async` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `requestIdleCallback` runs low-priority work in the **leftover time at the tail of a frame**, and hands your callback a deadline (`timeRemaining()`) so you can do a chunk and bail before you steal time the browser needs for input or rendering.

---

## 🧠 Mental model

A frame has a budget. The browser spends it on input, `rAF`, style, layout, and paint. If it finishes early, there's slack before the next vsync — and `requestIdleCallback` fills exactly that slack:

```
|── frame budget (~16.7ms) ──────────────────────────────|
| input | rAF | style | layout | paint |  ← idle slack →  |
                                        └ requestIdleCallback runs here
```

The framing that matters: rIC is **cooperative, deadline-driven scheduling**. It doesn't say "run later" — it says "run when there's spare time, and here's *how much* spare time you have; respect it." You're expected to peek at `deadline.timeRemaining()` and stop before you overrun.

## ⚙️ How it actually works

- **The `IdleDeadline` object** gives you `timeRemaining()` (ms of estimated idle time left, **capped at ~50ms** even if more is available) and `didTimeout` (whether this fired because it hit its timeout, not because the browser was idle).
- **The `{ timeout }` option is your safety valve.** Pure idle callbacks can be starved forever on a busy page. Passing `timeout: 2000` forces the callback to run within 2s no matter what — and then `didTimeout` is `true`, so you know you're on borrowed time and should do the minimum.
- **50ms cap exists for responsiveness.** Even during long idle stretches the browser hands you at most ~50ms, because a user interaction could arrive at any moment and a task over 50ms is perceptible lag.
- **You chunk work yourself.** The pattern is a `while` loop: keep pulling items off a queue while `timeRemaining() > 0` and there's work left, then re-request for the next idle period.

## 💻 Code

```js
const queue = buildLowPriorityWork(); // e.g. hydrate offscreen widgets, index search

function processQueue(deadline) {
  // Keep working while we have budget AND (if we timed out) at least drain something.
  while ((deadline.timeRemaining() > 0 || deadline.didTimeout) && queue.length) {
    doOneUnit(queue.shift());
  }
  if (queue.length) requestIdleCallback(processQueue, { timeout: 2000 });
}

// timeout guarantees the work isn't postponed indefinitely on a busy page.
requestIdleCallback(processQueue, { timeout: 2000 });
```

Cross-browser reality — Safari has historically not shipped rIC, so guard it:

```js
// ❌ Assumes it exists → throws in Safari.
requestIdleCallback(work);

// ✅ Feature-detect, prefer the modern scheduler, fall back to a timer.
const scheduleIdle =
  window.requestIdleCallback ??
  ((cb) => setTimeout(() => cb({ timeRemaining: () => 15, didTimeout: false }), 1));
scheduleIdle(work);
```

## ⚖️ Trade-offs

- **Great for genuinely deferrable, non-visual work:** sending analytics/beacons, prefetching the next route, warming a cache, building a client-side search index, lazy-hydrating offscreen components. Work the user won't miss if it slips a few hundred ms.
- **Bad for anything with a deadline the user feels.** rIC has no priority levels and can be starved; if the work is "user-visible but not urgent," `scheduler.postTask({ priority: 'background' })` expresses that far better and is actually cancellable.
- **Don't mutate layout-affecting DOM inside it.** Idle time is *after* this frame's layout/paint; heavy DOM writes there just guarantee a layout/paint next frame and can blow past your deadline. Keep idle work computational or off-DOM.
- **When NOT to use it:** anything that must run promptly, or that must run in a background tab (throttled heavily when hidden). And never rely on it firing at all without a `timeout`.

## 💣 Gotchas interviewers probe

- **`timeRemaining()` caps at ~50ms** regardless of how idle the machine is — you can't hoard a long idle stretch into one callback. Chunk and re-request.
- **No timeout = possible starvation.** On a busy page a pure idle callback may never run. Always pass `{ timeout }` for anything that actually needs to complete.
- **`didTimeout: true` means you're over budget.** When it's set, `timeRemaining()` will be ~0 — do the smallest safe amount and reschedule, don't push your luck.
- **Safari support.** For years `requestIdleCallback` was unimplemented in WebKit; production code needs a fallback. This is exactly why `scheduler.postTask` is the recommended modern replacement.
- **Idle ≠ background-tab work.** Hidden tabs throttle timers and idle callbacks aggressively; use a Worker for work that must keep going.

## 🎯 Say this in the interview

> "`requestIdleCallback` schedules low-priority work in the idle slack at the end of a frame, and it hands my callback a deadline object so I can check `timeRemaining()` and stop before I steal time the browser needs for input or rendering. I use it for deferrable, non-visual work — analytics, prefetching, warming caches, building a search index. Two things I'm always deliberate about: I pass a `timeout` so the work can't be starved forever on a busy page, and I keep each callback under the ~50ms the browser will ever give me by chunking a work queue and re-requesting. The honest caveat is Safari didn't ship it for a long time, and it has no priority levels — so on a greenfield project I'd actually prefer `scheduler.postTask` with a `background` priority, which is cancellable and standardized, and keep rIC as the fallback."

## 🔗 Go deeper

- [MDN — `requestIdleCallback`](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) — the deadline object, timeout option, and caveats.
- [web.dev — Using `requestIdleCallback`](https://developer.chrome.com/blog/using-requestidlecallback) — the original walkthrough with the chunking pattern.
- [MDN — `IdleDeadline`](https://developer.mozilla.org/en-US/docs/Web/API/IdleDeadline) — `timeRemaining()` and `didTimeout` semantics.
