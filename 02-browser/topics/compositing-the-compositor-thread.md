<div align="center">

# Compositing & the compositor thread

<sub>🌐 Browser · 🔴 Hard · ⏱ 1h · `#rendering` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Compositing is the final step where the browser stitches already-painted **layers** into a frame on a **separate compositor thread** — which is exactly why `transform`/`opacity` animations and scrolling stay smooth at 60fps even while the main thread is busy running your JavaScript.

---

## 🧠 Mental model

Two threads, one handoff. The **main thread** paints each layer *once* into a display list. The **compositor thread's** entire job is to take those layers and produce a frame every vsync — positioning, transforming, and blending them — with **no JavaScript, no layout, no paint** involved.

```
Main thread:        style → layout → paint → COMMIT layer tree ─┐
                                                                 ▼
Compositor thread:  tile → raster (workers) → GPU textures → draw quads → frame
                    (repeats every vsync, independently of the main thread)
```

Because that per-frame assembly lives off the main thread, it keeps running at display refresh rate even when the main thread is stuck in a 200ms task. That's the whole payoff.

## ⚙️ How it actually works

**Commit.** After paint, the layer tree and its display lists are *committed* from the main thread to the compositor thread. From here the compositor can operate on its own copy.

**Tiling + raster.** The compositor splits each layer into **tiles**, dispatches them to raster workers to fill with pixels, and uploads the results to the GPU as textures. (See the rasterization deep dive for that step.)

**Per-frame draw.** Each vsync, the compositor applies each layer's transform and opacity, composites the tiles in order, and issues draw quads to the GPU — no main-thread involvement.

**Threaded scrolling.** Scrolling is compositor-driven: it just slides layers, so it stays smooth even during main-thread jank. The exception is decisive: a **non-passive** `wheel`/`touchstart` listener means the compositor *can't* scroll until the main thread confirms you didn't call `preventDefault()` — so it has to wait on the main thread, and your smooth scroll becomes hostage to it.

**Off-main-thread animation.** CSS or Web Animations API animations of `transform`, `opacity`, and `filter` are handed to the compositor and run entirely off the main thread. Animate `width`, `left`, or `background-color` and you're back on the main thread doing layout/paint every frame.

## 💻 Code

```css
/* ✅ Compositor-only: runs off the main thread, survives main-thread jank. */
@keyframes slide { to { transform: translateX(200px); } }
.toast { animation: slide 300ms ease-out; }

/* ❌ Main-thread animation: layout (left) or paint (background) every frame. */
@keyframes bad { to { left: 200px; background: red; } }
```

```js
// ❌ Non-passive listener forces the compositor to wait on the main thread
//    before every scroll → threaded scrolling downgraded → jank.
window.addEventListener('touchstart', onTouch);

// ✅ Promise you won't preventDefault → compositor scrolls without asking.
window.addEventListener('touchstart', onTouch, { passive: true });
```

## ⚖️ Trade-offs

- **Compositor animations are jank-proof but restricted.** Only `transform`, `opacity`, and `filter` qualify — anything requiring new geometry or pixels can't be composited away and must go through the main thread. Design your motion around those three.
- **Compositing costs GPU memory.** Every layer's tiles live in VRAM. Off-main-thread smoothness is paid for in memory; a layer explosion turns the win into a loss.
- **The compositor can't run your JS.** `requestAnimationFrame` and JS-driven animation are *main-thread*. If you need physics or per-frame logic, the compositor won't save you — a busy main thread will still starve it.

## 💣 Gotchas interviewers probe

- **A non-passive `touchstart`/`wheel` listener defeats threaded scrolling.** This is the number-one cause of janky scroll on otherwise fine pages. Mark scroll-blocking listeners `{ passive: true }`.
- **Animating `top`/`left` runs on the main thread** even though it visually "just moves". Only `transform` is composited. Same motion, opposite cost.
- **`requestAnimationFrame` is main-thread**, so a JS animation janks under load while a *CSS* `transform` animation on the same page stays perfectly smooth — because one is on the compositor and one isn't.
- **`position: fixed` and `sticky` are handled by the compositor** so they don't repaint on every scroll frame.
- **Committing a new frame can briefly show stale/blank tiles** (checkerboarding) if raster hasn't caught up — visible when scrolling fast through heavy content.

## 🎯 Say this in the interview

> "Compositing is the last stage of the pixel pipeline: the main thread paints each layer once and commits the layer tree to a separate compositor thread, and that compositor thread assembles a frame every vsync by transforming and blending the layers on the GPU — no JavaScript, no layout, no paint. That separation is why `transform` and `opacity` animations and scrolling stay at 60fps even when the main thread is blocked. The corollaries I lean on: I animate only `transform`, `opacity`, and `filter` so the work stays on the compositor; I mark scroll listeners `passive` so a non-passive `touchstart` doesn't force the compositor to wait on the main thread; and I remember that `requestAnimationFrame` is main-thread, so JS-driven animation *doesn't* get this protection — a busy main thread will still starve it."

## 🔗 Go deeper

- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — the compositor thread, layers, and threaded scrolling explained by Chrome.
- [web.dev — Why are some animations slow?](https://web.dev/articles/animations-overview) — which properties composite and which force main-thread work.
- [MDN — Passive listeners (addEventListener)](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#improving_scrolling_performance_with_passive_listeners) — how `passive` keeps scrolling on the compositor.
