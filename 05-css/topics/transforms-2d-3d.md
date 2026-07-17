<div align="center">

# Transforms (2D/3D)

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#animation`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `transform` repaints an element's *visual* position without touching layout — the box still occupies its original space in flow — which is precisely why transforms are cheap to animate: the browser can skip layout and paint and hand the work to the compositor.

---

## 🧠 Mental model

A transform is a lens over the element, not a move of the element. The layout engine has already decided where the box lives; `transform` warps how those pixels are *drawn* afterwards. Neighbours don't shift, scroll size doesn't change, and the space the element reserved in flow stays exactly where it was. This "visual-only" nature is the source of both the power (buttery animation) and the surprises (a translated element still hit-tests and reserves its old footprint... except for a few things it *does* affect).

Think of the pipeline stages: layout figures out *boxes*, paint figures out *pixels*, composite figures out *where to stamp the painted layers*. `transform` lives at the composite stage — so changing it doesn't invalidate the earlier, expensive stages.

## ⚙️ How it actually works

Every transform function is a matrix; a `transform` list is those matrices multiplied together, applied **right to left** — so `transform: translateX(100px) rotate(45deg)` rotates *then* translates in the element's original frame, which is not the same as the reverse.

- **`transform-origin`** sets the fixed point of the multiplication (default `50% 50%`). Rotate around the top-left with `transform-origin: 0 0`.
- **2D** functions: `translate`, `scale`, `rotate`, `skew`, plus the shorthand `matrix()`.
- **3D** adds a Z axis: `translateZ`, `rotateX/Y`, `perspective()`, and `matrix3d()`.

For 3D you need a **perspective** or everything stays flat. Two ways, and they differ:

- `perspective: 800px` on the **parent** — one shared vanishing point for all children (a scene).
- `perspective(800px)` as a **function** in a child's own `transform` — that child's private vanishing point.

`transform-style: preserve-3d` on a parent lets children share one 3D space instead of being flattened into the parent's plane; `backface-visibility: hidden` hides an element's reverse side (the classic card-flip).

**The three things a transform *does* change**, which trip people up:

1. It creates a **stacking context**, so `z-index` now composes against transformed siblings.
2. A non-`none` transform makes the element the **containing block for `position: fixed` (and `absolute`) descendants** — a fixed child becomes fixed *to the transformed ancestor*, not the viewport. This breaks "fixed" modals nested under a transformed parent, and it's a favourite interview trap.
3. It (usually) promotes the element to its own **compositor layer** during animation.

## 💻 Code

```css
/* Order matters: matrices multiply right-to-left.
   Rotate happens first (in the original frame), then translate. */
.a { transform: translateX(100px) rotate(45deg); } /* ≠ */
.b { transform: rotate(45deg) translateX(100px); } /* different final position */

/* Cheap centering that survives unknown box size — pure composite, no layout. */
.center {
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
}
```

```css
/* 3D card flip: shared scene on the parent, preserve-3d on the mover. */
.scene   { perspective: 800px; }
.card    { transform-style: preserve-3d; transition: transform .5s; }
.card.is-flipped { transform: rotateY(180deg); }
.card__face { backface-visibility: hidden; }
.card__back { transform: rotateY(180deg); }
```

```css
/* ❌ Gotcha: this "fixed" header is now fixed to .panel, not the viewport,
   because a transformed ancestor becomes its containing block. */
.panel  { transform: translateZ(0); }
.header { position: fixed; top: 0; }   /* scrolls WITH .panel, not the page */
```

## ⚖️ Trade-offs

- **Animate `transform`, not `top`/`left`/`width`.** `top` changes geometry → forces layout + paint every frame; `transform: translate()` is composite-only. Same visual result, an order of magnitude cheaper. This is the single highest-leverage transform fact.
- **Transforms don't reflow — which is a feature and a bug.** They won't push siblings around (great for animation), but the element still hit-tests and reserves its original box, so a `scale(2)` element can visually overlap neighbours while they act like it never grew.
- **3D is deceptively expensive.** Each promoted layer is a GPU texture; `preserve-3d` scenes with many faces and large `perspective` can blow the memory budget. Don't 3D-ify what could be a 2D transform.

## 💣 Gotchas interviewers probe

- **"Why does my `position: fixed` element scroll away inside this component?"** Because an ancestor has a `transform` (or `filter`, or `will-change: transform`, or `perspective`), which makes it the containing block for fixed descendants. Textbook senior debugging.
- **Order of functions is not commutative.** `translate` then `rotate` ≠ `rotate` then `translate`. Right-to-left application.
- **Transforms create a stacking context.** An element you never gave a `z-index` suddenly layers differently once transformed — because it now has its own context.
- **`transform` percentages resolve against the element's own border box** (e.g. `translate(-50%,-50%)` is 50% of *its* size), unlike most percentages that resolve against the containing block.
- **Subpixel snapping / blurry text.** A promoted layer with a fractional `translate` can render text on a half-pixel and look fuzzy; `translateZ(0)` layer-promotion hacks can *cause* this.
- **`will-change: transform` also creates a containing block and stacking context** — so it has the same fixed-positioning side effect even before any animation runs.

## 🎯 Say this in the interview

> "The core mental model is that `transform` is visual-only — the box keeps its place in layout, and the browser just warps how it's drawn at the composite stage. That's why animating `transform` is far cheaper than animating `top` or `width`: those force layout and paint every frame, while a transform skips straight to compositing. Functions multiply right-to-left, so order matters, and `transform-origin` sets the pivot. For 3D I put `perspective` on the parent for a shared scene versus the `perspective()` function for a per-element one, and use `preserve-3d` plus `backface-visibility` for things like card flips. The gotcha I always flag: any non-`none` transform makes the element the containing block for `position: fixed` descendants, so a 'fixed' header inside a transformed panel will scroll with the panel — and `will-change: transform` triggers the same behaviour."

## 🔗 Go deeper

- [MDN — `transform`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) — every function, plus the containing-block and stacking-context side effects.
- [MDN — `transform-function`](https://developer.mozilla.org/en-US/docs/Web/CSS/transform-function) — the matrices behind `translate`, `scale`, `rotate`, `matrix3d`.
- [MDN — Using CSS transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transforms/Using_CSS_transforms) — 2D and 3D, `perspective`, `preserve-3d`, `backface-visibility`.
- [web.dev — Stick to compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count) — why transform/opacity are the cheap pair.
