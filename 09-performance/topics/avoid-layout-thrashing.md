<div align="center">

# Avoid layout thrashing

<sub>🚀 Performance · 🔴 Hard · ⏱ 45m · `#rendering`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Layout thrashing is forcing the browser to recompute geometry *synchronously* inside a loop by interleaving DOM reads (`offsetWidth`, `getBoundingClientRect`) with writes. The fix is not "do less layout" — it's **batch all reads, then all writes**, so the browser lays out once instead of N times.

---

## 🧠 Mental model

The browser keeps a "dirty" flag on layout. When you **write** to a property that affects geometry (change a class, set `style.height`, append a node), it doesn't recompute immediately — it just marks layout dirty and moves on. It stays lazy right up until you **read** a geometric property. At that moment the browser thinks: *"You want an accurate number, but layout is dirty — I have to compute it right now."* That synchronous recompute is called **forced reflow** (or forced synchronous layout).

One forced reflow is cheap. The disaster is a **loop that reads, then writes, then reads again**:

```
read  → clean layout, get value
write → layout dirty again
read  → FORCED REFLOW (recompute everything)
write → dirty
read  → FORCED REFLOW
...  ×N
```

You've turned an O(1) batch into O(N) full-tree layouts. On a list of 200 rows that's 200 reflows in one frame — the classic jank spike in a Performance trace.

## ⚙️ How it actually works

Layout cost is roughly proportional to the number of nodes whose geometry might have changed — and because CSS is bidirectional (a child's size can affect a parent, a parent's width affects children), the browser often relayouts a whole subtree, sometimes the whole document. So each forced reflow in your loop isn't "measure one element", it's "re-solve the layout of everything dirty since the last write".

The properties that **force layout when read** are the geometry accessors: `offsetTop/Left/Width/Height`, `clientTop/Left/Width/Height`, `scrollTop/Left/Width/Height`, `getBoundingClientRect()`, `getComputedStyle()` on a layout property, `scrollBy/scrollTo`, `focus()`, and `innerText` (it reflows to know what's visible). DevTools flags these in the Performance panel as **"Recalculate Style"** and **"Layout"** events, and marks forced ones with a red triangle and *"Forced reflow is a likely performance bottleneck."*

The cure is **read/write batching** — measure everything first while layout is clean, cache the values, then mutate. `requestAnimationFrame` is the right seam: schedule writes for the start of the next frame, after which the browser lays out **once** before paint. Libraries like FastDOM formalise this (`fastdom.measure()` / `fastdom.mutate()`), but the discipline matters more than the library.

## 💻 Code

```js
// ❌ Layout thrashing: read → write → read → write, N forced reflows.
// Each `.offsetWidth` read must flush the previous element's style write.
function grow(boxes) {
  for (const box of boxes) {
    const w = box.offsetWidth;        // READ  → forces layout (dirty from last write)
    box.style.width = w + 10 + 'px';  // WRITE → dirties layout again
  }
}
```

```js
// ✅ Batch: all reads first (layout stays clean), then all writes.
function grow(boxes) {
  // Phase 1 — READ. One layout pass serves every measurement.
  const widths = boxes.map((box) => box.offsetWidth);

  // Phase 2 — WRITE. No reads in between, so no forced reflow.
  boxes.forEach((box, i) => {
    box.style.width = widths[i] + 10 + 'px';
  });
}
```

```js
// ✅ Even better — defer writes to the next frame so paint happens once.
const measurements = boxes.map((b) => b.getBoundingClientRect());
requestAnimationFrame(() => {
  boxes.forEach((b, i) => (b.style.transform = `translateX(${measurements[i].left}px)`));
});
```

The subtle trap: a shared helper hides the read. `getWidth(el)` deep in a utility calls `offsetWidth`, and now your "pure write loop" is thrashing again. You have to trace what each function *touches*, not what it looks like.

## ⚖️ Trade-offs

- **Batching adds indirection.** You cache values that could go stale if something else mutates between phases. For tight, correct code that's fine; for sprawling component trees the read/write split can fight your framework's own scheduling.
- **Frameworks already batch for you.** React commits all DOM writes together and React 18's `useLayoutEffect` runs after mutations but before paint — thrashing usually creeps in via *imperative* escape hatches (measuring a ref in a loop, animation libraries, `ResizeObserver` callbacks that read *and* write).
- **When NOT to worry:** a handful of reads/writes outside a loop is noise. Optimise thrashing only when a Performance trace actually shows stacked Layout events. Guessing here wastes time — measure first.
- **Prefer compositor-only properties.** Animating `transform`/`opacity` skips layout entirely, so there's nothing to thrash. Reach for that before you reach for batching.

## 💣 Gotchas interviewers probe

- **"Which properties force layout?"** If you can't name `offsetHeight`, `getBoundingClientRect`, `getComputedStyle`, and `scrollTop` on the spot, you haven't hit this in production. `innerText` forcing reflow surprises almost everyone.
- **`getComputedStyle` forces layout only for layout properties.** Reading `color` is cheap; reading `height` or `width` triggers a reflow. Candidates over-generalise "getComputedStyle is slow".
- **`ResizeObserver` and `IntersectionObserver` exist to break the loop.** They deliver measurements asynchronously off the critical path, so you observe size changes without polling `offsetWidth` every frame.
- **Reading in a `requestAnimationFrame` and writing in the *same* callback still thrashes** if you interleave them. The rAF only helps if the whole callback is read-then-write.
- **Style recalculation ≠ layout.** Changing `color` invalidates style/paint but not layout. Knowing the pipeline (Style → Layout → Paint → Composite) tells you which reads are dangerous.
- **`will-change` and containment (`contain: layout`) scope the reflow.** `contain: layout` promises a subtree's layout can't affect the outside, so a forced reflow inside it stays cheap.

## 🎯 Say this in the interview

> "Layout thrashing is when I interleave DOM reads and writes in a loop and accidentally force the browser to recompute layout synchronously on every iteration. The browser is lazy about layout — a write just marks it dirty — but the moment I read something geometric like `offsetWidth` or `getBoundingClientRect`, it has to flush and recompute *now*. So a read-write-read loop over 200 elements becomes 200 full layout passes in one frame, and I see stacked Layout events with red forced-reflow warnings in the Performance panel. The fix isn't doing less work, it's ordering it: batch all the reads first while layout is clean, cache the values, then do all the writes — ideally deferring the writes to a `requestAnimationFrame` so paint happens once. And where I can, I animate `transform` and `opacity` instead, because those skip layout entirely so there's nothing to thrash."

## 🔗 Go deeper

- [web.dev — Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the canonical write-up with the read/write batching pattern.
- [Google — What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) — Paul Irish's exhaustive list of properties that trigger forced synchronous layout.
- [MDN — Reflow](https://developer.mozilla.org/en-US/docs/Glossary/Reflow) — the precise definition and where it sits in the rendering pipeline.
- [FastDOM](https://github.com/wilsonpage/fastdom) — a tiny library that enforces the measure/mutate batching if you want it structural.
