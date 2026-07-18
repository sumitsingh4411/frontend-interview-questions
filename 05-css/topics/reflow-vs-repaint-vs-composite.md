<div align="center">

# Reflow vs repaint vs composite

<sub>🎨 CSS · 🔴 Hard · ⏱ 1h · `#performance`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The pixel pipeline is **style → layout → paint → composite**, and whichever stage you dirty, *every stage after it runs too*; the whole game of CSS performance is entering that pipeline as late as possible, which is why `transform` and `opacity` are the only two properties you should animate at 60fps.

---

## 🧠 Mental model

Rendering is a pipeline with no shortcuts backwards. Touch a property and the browser re-runs that stage **and all downstream stages** for the affected boxes:

```
  ┌────────┐   ┌────────┐   ┌───────┐   ┌────────────┐
  │ Style  │ → │ Layout │ → │ Paint │ → │ Composite  │
  └────────┘   └────────┘   └───────┘   └────────────┘
   recalc       geometry     rasterise   GPU assembles
   which        where & how   colours    layers into a
   rules apply  big is it     into bitmaps  frame

  width, top     ▲ enters here → layout + paint + composite  (reflow — expensive)
  color, bg      ─────────────▲ enters here → paint + composite  (repaint — medium)
  transform      ───────────────────────────▲ enters here → composite only  (cheap)
```

The names people use in interviews map onto entry points, not on separate systems:

| Term | Entry point | Cost |
|---|---|---|
| **Reflow / layout** | Layout | Recomputes geometry, potentially for the whole subtree or document |
| **Repaint** | Paint | Re-rasterises pixels; geometry untouched |
| **Composite** | Composite | Reuses existing bitmaps; the GPU just moves/blends them |

The key realisation: **compositing is cheap because the pixels already exist.** A `transform: translateX(200px)` doesn't ask "what colour is this element now?" — it takes a texture that's already on the GPU and draws it at a different offset. `left: 200px` asks "where does *everything* go now?", then re-paints, then composites.

## ⚙️ How it actually works

**Layout is not local.** Changing one element's `width` can dirty its ancestors (a shrink-to-fit parent), its siblings (in normal flow they move), and its descendants (percentage children re-resolve). Browsers mark boxes dirty and re-layout the smallest subtree they can prove is sufficient, but a change to a `<body>`-level font-size is genuinely a whole-document reflow. This is why "reflow" is the stage worth fearing.

**Layout thrashing** is the real-world killer, and it is a *synchronisation* bug, not a volume bug. Style/layout is normally batched: you can set 100 styles and the browser coalesces them into one layout before the next frame. But reading a geometry property forces the browser to flush pending writes *right now* so it can give you a correct number:

```js
el.style.width = '100px';   // write — queued, invalidates layout
el.offsetHeight;            // read  — FORCES synchronous layout, immediately
```

Interleave those in a loop and you convert one layout into N. The read is the trigger, not the write. Forced-synchronous-layout triggers include `offsetTop/Left/Width/Height`, `client*`, `scroll*`, `getBoundingClientRect()`, `getComputedStyle()` (for layout-dependent values), and `scrollTo` with a smooth behaviour.

**Compositing requires a layer.** `transform` and `opacity` are only cheap when the element has been promoted to its own compositor layer — otherwise the browser must repaint the layer that contains it. Promotion happens for 3D transforms, `will-change: transform`, video/canvas, `position: fixed` in some cases, and animations the compositor has taken over. Promotion is not free: every layer costs GPU memory (`width × height × 4 bytes`, ×2 if double-buffered) and layer explosion tanks performance harder than the repaints you were avoiding.

**Which thread runs it matters more than which stage.** Style/layout/paint run on the main thread — the same thread as your JavaScript. Compositing runs on the compositor thread. A `transform` animation declared in CSS keeps running smoothly *even while the main thread is blocked by a long task*. The same animation driven by `requestAnimationFrame` writing `style.transform` stutters, because the frame it needs never gets scheduled. That's the deepest reason to prefer declarative animation.

## 💻 Code

```css
/* ❌ Animates layout. Every frame: layout → paint → composite, on the main thread. */
.card {
  transition: left 300ms, width 300ms, margin-top 300ms;
}

/* ❌ Animates paint. No layout, but re-rasterises every frame. */
.card {
  transition: box-shadow 300ms, background-color 300ms;
}

/* ✅ Composite-only. Runs off the main thread, survives jank. */
.card {
  transition: transform 300ms ease-out, opacity 300ms;
}
.card:hover { transform: translateY(-4px) scale(1.02); }
```

The classic box-shadow-on-hover fix — animate a pre-painted pseudo-element's opacity instead of the shadow itself:

```css
.card { position: relative; }
.card::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: 0 12px 24px rgb(0 0 0 / 0.25);
  opacity: 0;                       /* painted once, up front */
  transition: opacity 300ms;
  pointer-events: none;
}
.card:hover::after { opacity: 1; }  /* composite-only */
```

Fixing layout thrashing — batch reads, then batch writes:

```js
// ❌ Read/write interleaved → N forced synchronous layouts.
items.forEach((el) => {
  el.style.height = el.offsetHeight * 2 + 'px'; // read then write, every iteration
});

// ✅ One layout for all the reads, then all the writes.
const heights = items.map((el) => el.offsetHeight);   // read phase
items.forEach((el, i) => (el.style.height = heights[i] * 2 + 'px')); // write phase
```

## ⚖️ Trade-offs

- **`will-change` is a loaded gun, not a speed switch.** It tells the browser to promote *now* and keep the layer alive. Slapping `will-change: transform` on a long list allocates a texture per row and can exhaust GPU memory. Add it just before the interaction (on `mouseenter`, or in a class you toggle) and remove it after; if the element is permanently animating, leave it on.
- **Compositing hides work rather than removing it.** A promoted layer still had to be painted once, and text inside a composited layer can lose subpixel antialiasing (`translateZ(0)` on a text block is a classic way to make type look slightly worse). Promotion is a trade, not a win.
- **Reflow is not always worth avoiding.** A one-off layout during a click handler is fine — 3ms once is invisible. The rule is about *per-frame* work in animations and scroll handlers. Optimising a cold-path reflow is wasted effort and reviewers notice.
- **Don't animate `height`, but do question the requirement.** `transform: scaleY()` avoids layout but distorts children and text. Sometimes the honest answer is a grid `1fr`/`0fr` transition or accepting a short layout animation on a small subtree.

## 💣 Gotchas interviewers probe

- **"Which is more expensive, reflow or repaint?"** Reflow — but the real answer is "reflow *includes* a repaint and a composite." They aren't alternatives; they're prefixes of the same pipeline. Say that and you're immediately above the median candidate.
- **`transform` is not automatically GPU-accelerated.** Without a layer it's a repaint. The compositor only takes over an animation it can run itself — and it silently declines if the element has non-composited descendants or you animate transform *and* a layout property together.
- **Animating `opacity` from `1` can still cost paint** if the element isn't its own layer — and `opacity: 0` still occupies layout space and stays focusable. `visibility: hidden` removes it from the a11y tree but not from layout; only `display: none` removes it from layout, and `display` is not animatable (though `transition-behavior: allow-discrete` now lets you sequence it).
- **`requestAnimationFrame` callbacks run *before* layout, not after.** Reading geometry inside rAF after a write in the same callback still forces a synchronous layout. rAF is not a thrashing cure by itself.
- **Reading `scrollTop` in a `scroll` handler is free-ish; writing a style then reading it is not.** Scroll handlers are the #1 real-world thrashing site, closely followed by ResizeObserver callbacks that measure and then mutate.
- **`content-visibility: auto` and `contain: layout` are the scalpel for reflow scope.** Containment lets you *promise* the browser that a subtree's layout can't affect the outside, so it can skip it entirely. Mentioning containment when asked about reflow is a strong senior signal.
- **`box-shadow`, `border-radius`, `filter` and large gradients are paint-expensive**, and paint cost scales with *area*, not element count. A full-viewport blurred backdrop is worse than 500 small repaints.

## 🎯 Say this in the interview

> "The rendering pipeline is style, layout, paint, composite, and the property you change decides where you enter it — everything downstream then re-runs. `width` or `top` enters at layout, so you pay layout plus paint plus composite; `background-color` enters at paint; `transform` and `opacity` can be handled entirely by the compositor, which is why those are the only two I'll animate at 60fps. The subtlety I'd emphasise is threading: style, layout and paint all run on the main thread alongside my JavaScript, so a CSS transform animation keeps running smoothly even when a long task blocks the main thread, whereas the same animation driven from rAF stutters. And the bug I actually see in real code isn't a slow property, it's layout thrashing — reading `offsetHeight` after a style write forces a synchronous layout, so I batch all reads first, then all writes."

## 🔗 Go deeper

- [web.dev — Rendering performance](https://web.dev/articles/rendering-performance) — the canonical pipeline explanation, stage by stage.
- [web.dev — Stick to compositor-only properties](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count) — why `transform`/`opacity` win, and the cost of layer count.
- [web.dev — Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the read/write batching rule with the trigger list.
- [MDN — `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — the property, and the explicit warning not to apply it broadly.
- [CSS Triggers](https://csstriggers.com/) — a lookup table of which properties trigger layout, paint or composite per engine.
