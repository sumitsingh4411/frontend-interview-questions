<div align="center">

# Process/thread model (renderer, GPU, network)

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#internals`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Zoom past processes into *threads*: the renderer's **main thread** runs your JS, parsing, style, layout, and paint on **one queue**; the **compositor thread** and **raster/GPU** threads turn the result into pixels off the main thread — which is exactly why scroll and transform animations stay smooth while JS is busy, and why layout does not.

---

## 🧠 Mental model

The previous topic was processes; this is what runs *inside* them. The unit that matters for performance is the **thread**, and the one that matters most is the renderer's **main thread** — a single thread with a single event loop that does an enormous amount:

> parse HTML → run JS → recalc style → layout → paint → hand off to compositor

Because it's **one thread with one queue**, all of that is serialized. A long-running `for` loop in your JS blocks style, layout, paint, *and* event handling. Everything you feel as "jank" is the main thread being busy when a frame was due.

The escape hatch is that **not everything lives on the main thread.** The compositor thread, raster threads, and the GPU process can keep moving pixels even while the main thread is blocked — but only for a narrow set of operations. Knowing which is the whole game.

## ⚙️ How it actually works

**Renderer process — the threads inside:**

| Thread | Job | Blocked by long JS? |
|---|---|---|
| **Main** | JS, DOM, CSSOM, style, layout, paint (record) | — (it *is* the bottleneck) |
| **Compositor** | Turns layers into a frame, handles scroll/`transform`/`opacity` | ❌ No — runs independently |
| **Raster / tile workers** | Fill layer tiles with pixels (bitmaps) | ❌ No |
| **Web Worker / Worklet** | Your off-main-thread JS (separate event loop) | ❌ No |

**The critical consequence:** if an animation only changes `transform` or `opacity`, the compositor thread can produce every frame *without the main thread at all*. That's why `transform: translateX()` animates at 60fps during a heavy JS task, but `left`/`top` (which need layout on the main thread) stutter to a halt.

**GPU process.** Rasterization and the final compositing draw are increasingly done on the GPU, in a **separate GPU process** shared by all renderers (isolating buggy/malicious driver interactions, and giving one place to talk to the actual graphics driver). The compositor thread sends draw quads to the GPU process; the GPU process issues GL/Vulkan/Metal calls.

**Network process (or thread).** DNS, TLS, connection pooling, HTTP caching, and the fetch itself run **outside the renderer**, in a shared network service. So a `fetch()` is: renderer → IPC → network process → socket → back. Centralizing it means one connection pool, one cache, and one enforcement point for CORS/cookies across the whole browser. Your JS never touches a socket.

**How a task becomes a frame:** the main thread runs a task from its queue, and at frame boundaries the event loop does the "update the rendering" steps (style → layout → paint), then the compositor thread takes over to composite and the GPU draws. If the task overran the ~16.6ms frame budget, the frame is *late* — dropped or delayed.

## 💻 Code

```js
// ✅ Compositor-only animation: no main-thread work per frame, survives jank.
el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(300px)' }],
           { duration: 500, easing: 'ease-out' });

// ❌ Main-thread animation: each frame needs layout + paint on the busy main thread.
el.animate([{ left: '0px' }, { left: '300px' }], { duration: 500 }); // janks under load

// Offload heavy compute so the main thread stays free for rendering:
const worker = new Worker('crunch.js'); // its own thread, its own event loop
worker.postMessage(bigData);            // structured-clone copy across the boundary
worker.onmessage = (e) => paint(e.data);
```

```js
// Prove the split: block the MAIN thread and watch a CSS transform keep moving,
// while a JS-driven left/top animation freezes.
document.querySelector('.spinner').style.animation = 'spin 1s linear infinite';
const t = Date.now(); while (Date.now() - t < 3000) {} // main thread frozen 3s
```

## ⚖️ Trade-offs

- **Web Workers cost a structured-clone copy** (or a `Transferable`/`SharedArrayBuffer` handoff). For small, chatty messages the serialization overhead can exceed the compute you saved. Workers win for *big, coarse* units of work.
- **Compositor animations are limited to `transform`, `opacity`, and filters.** Anything touching geometry (`width`, `top`, `margin`) drags the work back onto the main thread. Don't promote everything to a layer — layers cost GPU memory.
- **The network service being separate** adds an IPC hop to every request but buys a unified cache/connection pool and a single security chokepoint. You almost never optimize this yourself.

## 💣 Gotchas interviewers probe

- **"JS is single-threaded" is only half true.** The *main thread's JS* is single-threaded; the browser runs many threads, and you can add more with Workers. The accurate statement is "one JS execution context per thread."
- **`transform`/`opacity` vs `left`/`top` is the flagship jank question.** The former is compositor-only; the latter forces main-thread layout every frame. Know *why*, not just which.
- **Workers have no DOM.** No `document`, no `window`. They exist for compute, not for rendering — a common misconception.
- **`requestAnimationFrame` runs on the main thread**, so it also janks under a long task. It's synced to the frame, not immune to blocking.
- **A blocked main thread still lets the user scroll** (compositor-driven), but the *new* content is blank until the main thread catches up — the "checkerboard" you sometimes see.

## 🎯 Say this in the interview

> "Inside a renderer the thread that matters is the main thread — it runs JS, style, layout, and paint on one serialized queue, so any long task blocks all of it and that's what jank is. The key is that pixels can still move without it: the compositor thread and the GPU handle scrolling and `transform`/`opacity` animations independently, which is why a CSS transform stays at 60fps even while JS is frozen, but animating `left`/`top` stutters because those need main-thread layout every frame. Heavy compute I push to a Web Worker, which is a real separate thread with its own event loop but no DOM. And networking lives in its own process — my `fetch` is really an IPC call to a shared network service that owns the connection pool and cache; JS never touches a socket. So performance work is mostly about keeping expensive things off the main thread."

## 🔗 Go deeper

- [Inside look at modern web browser (part 2)](https://developer.chrome.com/blog/inside-browser-part2) — the process/thread breakdown, straight from the source.
- [Inside look at modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — how main and compositor threads split rendering work.
- [MDN — Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — the practical off-main-thread model and its limits.
