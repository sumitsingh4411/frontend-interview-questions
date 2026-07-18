<div align="center">

# GPU-accelerated animation & `will-change`

<sub>🎨 CSS · 🔴 Hard · ⏱ 45m · `#animation` `#performance`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Only `transform` and `opacity` can be animated entirely on the **compositor thread**, skipping layout and paint, which is why they hit 60fps even while the main thread is busy. `will-change` pre-promotes an element to its own GPU layer so the first frame isn't janky — but it's a scalpel, not a spray: every layer costs memory.

---

## 🧠 Mental model

The browser runs animations on two different threads. The **main thread** does JavaScript, style, layout, and paint — and it's the thread that gets blocked by your React re-render or a long task. The **compositor thread** does one narrow job: take already-painted layers (textures on the GPU) and stamp them onto the screen at new positions, opacities, and transforms.

An animation that only needs the compositor keeps running smoothly *even when the main thread is jammed*, because it never asks the main thread for anything per frame. An animation that touches layout or paint must go back to the main thread every frame — so if that thread is busy, your animation stutters. The entire game of "GPU-accelerated animation" is: **stay on the compositor.** That means `transform` and `opacity`, full stop.

```
transform / opacity  →  compositor thread   →  smooth even under JS load
top / width / color  →  main thread (layout/paint each frame)  →  janks under load
```

## ⚙️ How it actually works

To composite an element independently, the browser promotes it to its **own layer** — a separate GPU texture. It paints that layer *once*, then the compositor moves/fades the texture around without repainting. That's why `transform: translateX()` for 300ms is nearly free after the initial paint: it's texture math on the GPU.

Layers aren't free. Each one consumes GPU memory sized to its pixels (roughly width × height × 4 bytes, more with high-DPI), and the browser has to manage, upload, and re-composite them. Promote too many and you trade CPU jank for **memory pressure and upload cost** — on low-end mobile this can be *slower* than not promoting at all.

**`will-change`** is you telling the browser "this property is about to animate, prepare a layer now." Without it, the browser promotes lazily when the animation starts — which can drop the first frame while it paints the fresh layer. With it, the layer exists ahead of time.

The rules that make `will-change` correct rather than harmful:

- **Set it just before**, and **remove it just after**, the animation — it's a temporary hint, not a permanent decoration. Left on, the browser keeps a layer alive forever.
- **Don't put it on everything.** `will-change: transform` on hundreds of elements is a memory disaster and defeats the optimiser.
- It also creates a **stacking context and a containing block** for fixed descendants — the same side effects as an actual transform.

The old `transform: translateZ(0)` / `translate3d(0,0,0)` "hack" forced layer promotion before `will-change` existed. `will-change` is the intentional, spec'd replacement — but the hack still lurks in codebases.

## 💻 Code

```css
/* ✅ Compositor-only animation: smooth under main-thread load. */
@keyframes slide-in {
  from { transform: translateX(-100%); opacity: 0; }
  to   { transform: translateX(0);     opacity: 1; }
}
.panel { animation: slide-in .3s ease-out; }

/* ❌ Animating layout properties: main-thread layout + paint EVERY frame. */
@keyframes bad-slide {
  from { left: -300px; }   /* forces layout each frame */
  to   { left: 0; }
}
```

```css
/* will-change done right: scope it, and let JS add/remove it around the interaction. */
.card:hover { will-change: transform; }  /* hint on hover intent, drops when not hovered */
```

```js
// Best practice: promote just-in-time, then release the layer.
el.style.willChange = 'transform';
el.addEventListener('transitionend', () => {
  el.style.willChange = 'auto';   // free the GPU layer once done
}, { once: true });
```

## ⚖️ Trade-offs

- **Compositor-only vs. correctness.** Some designs genuinely need to reflow (an accordion changing height). You can't fake real layout change with `transform: scaleY()` without distorting content — use the FLIP technique (measure, then animate a compensating transform) instead of animating `height` directly.
- **`will-change` is a hint you can overspend.** Applied broadly it *increases* memory and can regress performance on the exact low-end devices you're trying to help. Fewer, shorter-lived hints beat blanket ones.
- **GPU acceleration isn't universally faster.** Layer upload and huge textures cost real time on mobile GPUs. A tiny element animating `left` may beat a full-screen promoted layer. Measure; don't cargo-cult `translateZ(0)`.

## 💣 Gotchas interviewers probe

- **"Which properties are cheap to animate?"** `transform` and `opacity` — and *why*: they're the only two that run purely on the compositor, skipping layout and paint. Anything geometric (`width`, `top`, `margin`) forces layout; colors/shadows force paint.
- **Leaving `will-change` on permanently.** It's not a "make it fast" flag — a permanent layer wastes memory and can slow the page. It must be added and removed around the animation.
- **`will-change` has layout side effects.** Like `transform`, it creates a stacking context and a containing block for fixed descendants — so it can break `position: fixed` children even with no animation running.
- **Animating `box-shadow` is a paint hog.** Animate the `opacity` of a pseudo-element carrying the shadow instead — composite, not paint.
- **The compositor still stalls for input on some properties.** Scroll-linked and certain filter animations can fall back to the main thread; not every "visual" property is compositor-safe. `filter` is only sometimes accelerated.
- **`translateZ(0)` is legacy.** It works, but `will-change: transform` is the intentional API and doesn't carry the "always on" liability if used correctly.

## 🎯 Say this in the interview

> "GPU-accelerated really means compositor-thread animation. The browser paints an element into its own GPU layer once, then the compositor moves and fades that texture without going back to the main thread — so it stays at 60fps even while JavaScript is busy. The catch is that only `transform` and `opacity` qualify; anything that changes geometry forces layout and anything that changes color forces paint, both on the main thread, every frame. `will-change` lets me pre-promote a layer so the first frame isn't dropped — but I treat it as temporary: add it on interaction intent, remove it on `transitionend`, because every layer is GPU memory and blanketing the page with it backfires on low-end devices. I'd also mention `will-change: transform` creates a stacking context and a containing block, so it has the same fixed-positioning gotcha as a real transform, and that for genuine layout changes I use FLIP rather than animating `height`."

## 🔗 Go deeper

- [web.dev — Animations guide](https://web.dev/articles/animations-guide) — the compositor model and the cheap-property shortlist.
- [web.dev — Stick to compositor-only properties & manage layer count](https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count) — the layer-cost trade-off in depth.
- [MDN — `will-change`](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change) — the "use sparingly, remove after" guidance and side effects.
- [Paul Lewis — FLIP](https://aerotwt.com/blog/flip-your-animations/) — animating layout changes cheaply by turning them into transforms.
