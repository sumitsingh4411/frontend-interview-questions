<div align="center">

# `requestAnimationFrame`

<sub>🌐 Browser · 🟡 Medium · ⏱ 30m · `#rendering` `#async`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `requestAnimationFrame` schedules a callback to run **once, right before the browser's next paint**, synced to the display's refresh rate. It's the only correct clock for visual work — it batches with layout, pauses in background tabs, and adapts from 60Hz to 144Hz for free.

---

## 🧠 Mental model

`setInterval(fn, 16)` says "run roughly every 16ms and hope it lines up with the screen." rAF says "run when the browser is *about to draw*, and hand me the exact timestamp of that frame." The difference is that rAF is a step *inside the rendering pipeline*, not a timer racing alongside it:

```
task → drain microtasks → [ rAF callbacks → ResizeObserver → IntersectionObserver
                            → style → layout → paint ] → next turn
```

Your callback runs at the top of that render block, so any DOM changes you make land in the *same* frame's layout and paint. No tearing, no wasted intermediate frames.

## ⚙️ How it actually works

- **One timestamp, shared by every callback in the frame.** The argument is a `DOMHighResTimeStamp` (same origin/units as `performance.now()`). Every rAF callback in that frame gets the *same* value — the frame's start time. Drive animation off the delta between timestamps, **never** `Date.now()`.
- **It tracks the real refresh rate.** 16.67ms at 60Hz, 6.94ms at 144Hz, longer on a throttled panel. Hardcoding "60fps" is a bug on modern displays. Compute movement as `velocity * deltaTime`.
- **Background tabs freeze it.** A hidden tab's rAF simply stops firing — no callbacks pile up. `setInterval` keeps running and floods you with backlog when the tab returns. This alone makes rAF the responsible choice.
- **It's not a guaranteed 60 calls/sec.** If a frame's work overruns the budget, frames are *dropped* — rAF fires less often rather than queuing. Your delta-time math absorbs this automatically; a fixed per-frame step does not.

## 💻 Code

```js
// ✅ Frame-rate-independent animation, driven by the frame timestamp.
let start;
function step(now) {              // `now` === performance.now() for this frame
  start ??= now;
  const elapsed = now - start;    // ms since animation began
  el.style.transform = `translateX(${Math.min(elapsed / 5, 300)}px)`;
  if (elapsed < 1500) requestAnimationFrame(step);
}
requestAnimationFrame(step);
```

The layout-thrash trap inside a loop:

```js
// ❌ Read-write-read-write forces synchronous layout every iteration.
items.forEach((el) => {
  const w = el.offsetWidth;      // READ → forces layout (flushes pending writes)
  el.style.width = w + 10 + 'px'; // WRITE → invalidates layout again
});

// ✅ Batch reads, then batch writes (read/write phase separation).
const widths = items.map((el) => el.offsetWidth); // all reads
items.forEach((el, i) => (el.style.width = widths[i] + 10 + 'px')); // all writes
```

**Double rAF** — the idiom for "after the browser has actually painted the current state" (e.g. to trigger an enter transition on a freshly-inserted element):

```js
el.classList.add('mounted');                 // start state committed this frame
requestAnimationFrame(() =>
  requestAnimationFrame(() => el.classList.add('open')) // next frame → transition runs
);
```

## ⚖️ Trade-offs

- **Prefer CSS transitions / the Web Animations API for `transform` and `opacity`.** Those animate on the **compositor thread** and keep going even when the main thread is janking. rAF runs on the *main* thread, so a busy JS task drops your animation frames. Use rAF for things CSS can't express — canvas, physics, scroll-driven layout, custom easing.
- **rAF is for visual work only.** Non-visual periodic work (polling, analytics) doesn't belong here — it wastes a frame and needlessly wakes the pipeline. Use `setTimeout`, `scheduler.postTask`, or `requestIdleCallback`.
- **When NOT to use it:** you need work to continue in a background tab (a music timer, a countdown that must stay accurate). rAF is paused there by design — use a Worker or a timestamp-corrected timer.

## 💣 Gotchas interviewers probe

- **Reading layout inside rAF still forces synchronous layout.** rAF doesn't magically batch your reads — touching `offsetWidth`/`getBoundingClientRect()` after a write flushes layout immediately. Separate read and write phases.
- **The timestamp is the *frame* time, not "now."** All callbacks in a frame share it, and it can be slightly in the past. That's the point — it makes animations across elements perfectly synchronized.
- **rAF ≠ "60 times a second."** On a 120Hz display it's 120; under load it's fewer. Never assume the interval.
- **A single rAF fires before the *next* paint, not after the current one.** For "run after the pixels are on screen," you need the double-rAF trick (or `requestPostAnimationFrame` where available).
- **`cancelAnimationFrame(id)`** needs the id returned by the request — forgetting to cancel on unmount leaks a running loop in SPAs.

## 🎯 Say this in the interview

> "`requestAnimationFrame` runs a callback once, right before the next paint, synced to the display refresh rate — it's a step inside the rendering pipeline, not a timer beside it. So DOM changes I make in the callback land in that same frame's layout and paint, with no tearing. Three properties matter to me: it gives me the frame's timestamp so I drive animation off delta-time and it works on any refresh rate, not just 60Hz; it pauses in background tabs instead of piling up backlog like `setInterval`; and it drops frames under load rather than queuing them. The nuance I'd add is that for plain `transform`/`opacity` I'd actually prefer CSS or the Web Animations API, because those run on the compositor thread and survive a busy main thread — I reserve rAF for work the compositor can't do, like canvas or custom scroll-linked layout."

## 🔗 Go deeper

- [MDN — `requestAnimationFrame`](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) — signature, timestamp semantics, throttling behaviour.
- [web.dev — Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — read/write batching in practice.
- [MDN — Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) — the compositor-friendly alternative for transform/opacity.
