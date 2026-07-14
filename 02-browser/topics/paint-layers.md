<div align="center">

# Paint & layers

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#rendering`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Paint** turns layout boxes into an ordered list of draw commands (not pixels yet); **layers** are the slices of the page the browser paints *separately* so the compositor can move them without repainting — and creating too many is a real performance bug, not a free win.

---

## 🧠 Mental model

Paint is **recording, not drawing**. The browser walks the laid-out boxes and emits a *display list* — "fill this rect grey, stroke this border, draw this glyph run" — in the correct stacking order. Actually filling pixels (rasterization) is a later step.

A **layer** is a separate paint surface. By default the whole page paints into one; but the browser promotes certain elements to their own compositing layer so that moving them becomes the compositor's job (cheap) instead of a repaint (expensive). The mental shortcut: **paint answers "what does it look like", layers answer "what can I move independently".**

## ⚙️ How it actually works

**Paint order follows stacking contexts.** The browser paints in the CSS-defined order: backgrounds and borders of the stacking context, then negative z-index children, block boxes, floats, inline content, then positioned/`z-index` children on top. Anything that creates a **stacking context** (`z-index` with positioning, `opacity < 1`, `transform`, `filter`, `will-change`, `isolation`) becomes an atomic unit in that order.

**Layerization.** The browser promotes an element to its own layer when it has: a 3D transform or `will-change: transform`, an animating `transform`/`opacity`, `<video>`/`<canvas>`/`<iframe>`, sometimes `position: fixed`, or — critically — because it **overlaps** already-composited content. That last one is *implicit* promotion: a plain element sitting on top of a promoted one may itself get a layer so the compositor can order them, and this cascades.

**Why layers help.** A promoted layer is painted once. Moving it (via `transform`) or fading it (`opacity`) is then a **recomposite** — the compositor re-positions the existing bitmap — with **no repaint**. That's the entire reason transform/opacity animations are cheap.

**Paint invalidation.** Change a non-geometric visual — `color`, `background`, `box-shadow` — and the browser repaints that element's layer (no layout). DevTools' *paint flashing* highlights exactly which regions repaint each frame.

## 💻 Code

```css
/* ✅ Promote an element that will animate, so its motion skips repaint. */
.card--animating {
  will-change: transform; /* hint: give me my own layer */
}
.card--animating:hover {
  transform: translateY(-4px); /* recomposite only — no layout, no repaint */
}

/* ❌ Layer explosion: will-change on everything reserves GPU memory for
   hundreds of layers you never animate. Each layer ≈ width × height × 4 bytes. */
* { will-change: transform; }
```

```js
// Promote just-in-time, then release, so memory isn't held forever:
el.addEventListener('pointerenter', () => (el.style.willChange = 'transform'));
el.addEventListener('animationend',  () => (el.style.willChange = 'auto'));
```

## ⚖️ Trade-offs

- **A layer is a memory/speed trade.** It buys cheap movement but costs GPU memory (its rasterized bitmap) plus compositing bookkeeping. A handful is a win; hundreds is jank from the *other* direction — VRAM pressure and slow compositing.
- **`will-change` is a loaded gun.** It's the right tool to pre-promote something about to animate, but leaving it on permanently, or applying it broadly, reserves memory the browser can't reclaim. Add it just before, remove it after.
- **Don't reach for layers to fix paint cost.** If painting a big scrolling area is slow, first reduce paint work (simpler shadows/gradients/filters, `content-visibility` for offscreen) before promoting.

## 💣 Gotchas interviewers probe

- **`opacity < 1` and `transform` create a stacking context** *and* usually a layer — which reorders paint and can make a `z-index` "stop working" relative to unpromoted siblings.
- **Overlap causes *implicit* layer promotion.** You promote one element; a plain element that overlaps it gets promoted too, and it cascades. Unexplained layer counts almost always trace back to overlap.
- **`box-shadow`, blurs, gradients, and `filter` are paint-expensive** — they're per-pixel work during rasterization. A large blurred shadow on a scrolling list is a classic paint bottleneck.
- **A big scrolling layer repaints on scroll unless it's promoted** or you skip it with `content-visibility: auto`.
- **`will-change` everywhere is slower, not faster.** Candidates think it's a magic speed-up; it's a memory reservation that can backfire.

## 🎯 Say this in the interview

> "Paint is the browser recording an ordered display list of draw commands — fill this rect, draw these glyphs — in stacking-context order. It's not pixels yet; rasterization does that later. Layers are the part I care about for performance: the browser promotes some elements to their own compositing layer, and once an element is on its own layer, moving it with `transform` or fading it with `opacity` is a recomposite with no repaint — that's why those two properties are cheap to animate. The catch is that layers aren't free: each one costs GPU memory roughly its pixel area times four bytes, and overlap triggers *implicit* promotion that cascades, so you can get a layer explosion. So I use `will-change: transform` to promote deliberately just before an animation and remove it after, rather than sprinkling it everywhere, and I keep an eye on the layer count and paint-flashing in DevTools."

## 🔗 Go deeper

- [web.dev — Rendering performance](https://web.dev/articles/rendering-performance) — where paint sits in the pixel pipeline and how to cut its cost.
- [web.dev — Stick to compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count) — the layer-count trap and `will-change` discipline.
- [MDN — will-change](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — the correct, non-cargo-culted way to use it.
