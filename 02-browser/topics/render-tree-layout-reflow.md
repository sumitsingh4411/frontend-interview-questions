<div align="center">

# Render tree, Layout & Reflow

<sub>🌐 Browser · 🔴 Hard · ⏱ 1h · `#rendering` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The **render tree** is DOM combined with computed styles, filtered down to what's actually painted; **layout** (a.k.a. reflow) walks it to compute every box's exact geometry — and because geometry cascades from parent to child, touching one element can force the browser to re-lay-out a whole subtree, which is the thing "layout thrashing" abuses.

---

## 🧠 Mental model

Layout is the browser **solving a constraint system**: given the viewport and each box's computed CSS, where does every box sit and how big is it? The input is the render tree; the output is a box — `x, y, width, height` — for every node.

```
DOM ─┐
     ├─► Render tree ─► Layout (reflow) ─► box geometry
CSSOM┘   (visible boxes)   (solve sizes/positions)
```

The render tree is **not** the DOM. `display:none` nodes are excluded entirely; `visibility:hidden` nodes are kept (they still occupy space); `::before`/`::after` are added; and text runs get wrapped in anonymous boxes. It's the set of things that will actually be drawn.

## ⚙️ How it actually works

**Layout is a recursive walk.** A parent's size constrains its children, and children's intrinsic content sizes flow back *up* to size `auto`/shrink-to-fit parents. That two-way dependency is why **flexbox, grid, and tables can need multiple passes** — the browser has to measure content before it can distribute space.

**Local vs global.** Browsers keep per-node dirty bits and try to relayout only the affected subtree (incremental layout). But some changes are global: resizing the viewport, changing the root `font-size`, or toggling a property that shifts everything below it invalidates a large swath of the tree.

**What triggers reflow:**

- Mutating the DOM in a way that affects geometry (adding nodes, changing text).
- Changing a **geometric** style: `width`, `padding`, `font-size`, `display`, `position`.
- Resizing the window / rotating the device.
- **Reading a layout property while a mutation is pending** — this forces a *synchronous* layout flush.

That last one is the killer: **forced synchronous layout** (a.k.a. layout thrashing). The browser normally batches your writes and lays out once before the next frame. But properties like `offsetTop`, `offsetWidth`, `getBoundingClientRect()`, `scrollTop`, and `getComputedStyle()` of a resolved length must return an *up-to-date* answer — so reading one flushes all pending layout *right now*. Interleave reads and writes in a loop and you pay for a full layout on every iteration.

## 💻 Code

```js
// ❌ Layout thrashing: each read of offsetWidth flushes the write from the
//    previous iteration. N boxes → N forced synchronous layouts.
for (const box of boxes) {
  box.style.width = box.offsetWidth + 10 + 'px'; // write depends on a read = flush
}

// ✅ Batch: read all first (one layout), then write all (one layout before paint).
const widths = boxes.map((b) => b.offsetWidth); // all reads, single flush
boxes.forEach((b, i) => (b.style.width = widths[i] + 10 + 'px')); // all writes

// Properties that FORCE layout when read with pending changes:
//   offsetTop/Left/Width/Height, clientWidth/Height, scrollTop/Left,
//   getBoundingClientRect(), getComputedStyle(el).<length>, focus()
```

## ⚖️ Trade-offs

- **Layout cost scales with the number of *affected* boxes, not the DOM size.** A 50k-node DOM is fine if a change only dirties 3 boxes; a 200-node DOM janks if every change relays out all of them. Use `contain: layout` or `content-visibility: auto` to fence a subtree so its layout can't escape.
- **Flex/grid/tables are more expensive than block flow** because of multi-pass measuring — usually irrelevant, occasionally the reason a giant `<table>` scrolls badly.
- **Don't animate `top`/`left`/`width`/`height`.** Every frame is a reflow. Animate `transform` instead — it skips layout entirely (it's a compositor operation).

## 💣 Gotchas interviewers probe

- **Reading `offsetWidth` (or `getBoundingClientRect`) flushes layout synchronously.** This is *the* layout-thrashing trap. Batch reads before writes; libraries like FastDOM formalise this.
- **`transform` does not trigger layout.** It's why `translate` animations are cheap and `top` animations are not — the same visual motion, wildly different cost.
- **`display:none` costs zero layout, but toggling it back triggers a full layout of that subtree.** Hiding is cheap; showing is not.
- **`visibility:hidden` still lays out and paints;** it just isn't visible. Different cost profile from `display:none`.
- **Percentage and `auto` sizes depend on the parent being resolved first;** intrinsic keywords (`min-content`/`max-content`) can add extra measuring passes.
- **A single `requestAnimationFrame` is the right place to batch DOM writes** — it runs right before layout/paint, so your writes coalesce into one reflow.

## 🎯 Say this in the interview

> "The render tree is the DOM plus computed styles, minus anything that isn't painted — `display:none` is dropped, `visibility:hidden` is kept. Layout, or reflow, walks that tree and solves for every box's size and position; it's recursive because parents constrain children and children's content sizes flow back up, which is why flex and grid can take multiple passes. The performance trap I watch for is forced synchronous layout: the browser batches my style writes and lays out once per frame, but the moment I *read* something like `offsetWidth` or `getBoundingClientRect` with a pending write, it has to flush layout synchronously. So in a loop that interleaves reads and writes I get one full layout per iteration. The fix is to batch all reads, then all writes, ideally inside a `requestAnimationFrame`. And I animate `transform`, never `top`/`left`, because `transform` skips layout completely."

## 🔗 Go deeper

- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — layout, paint and compositing straight from the Chrome team.
- [web.dev — Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the read/write batching pattern with numbers.
- [Gist — What forces layout/reflow (Paul Irish)](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) — the canonical list of layout-forcing properties.
