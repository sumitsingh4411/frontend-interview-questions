<div align="center">

# Critical Rendering Path

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#rendering` `#performance`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The Critical Rendering Path is the sequence the browser runs to turn HTML + CSS + JS into pixels: **DOM + CSSOM → render tree → layout → paint → composite**. Optimising it means minimising the number, size, and order of the resources that *block the first paint*.

---

## 🧠 Mental model

The browser can't paint until it knows **what** to show (DOM) and **how** it looks (CSSOM). So the entire game is: *what stands between the first HTML byte and the first pixel?*

```
HTML ─→ DOM ─┐
             ├─→ Render tree ─→ Layout ─→ Paint ─→ Composite
CSS  ─→ CSSOM┘        ↑
JS (can mutate both, and BLOCK the parser)
```

Two resources are **render-blocking by default**: CSS (always) and synchronous JS (because it can rewrite the DOM/CSSOM). Everything you do to speed up first paint is really about *shrinking or deferring* those two.

## ⚙️ How it actually works

1. **HTML → DOM**, streamed incrementally as bytes arrive.
2. **CSS → CSSOM.** CSS is render-blocking: the browser won't paint with the wrong styles and then flash. It must build the *complete* CSSOM first — CSS is not incremental like the DOM.
3. **A synchronous `<script>` blocks the parser** where it sits. Worse: if a `<link rel=stylesheet>` precedes it, the script *also* waits for the CSSOM, because it might call `getComputedStyle()`. So CSS can transitively block JS which blocks the DOM.
4. **Render tree** = DOM ∩ visible nodes, combined with computed styles. `display:none` is excluded; `visibility:hidden` is included (it occupies space).
5. **Layout (reflow)** computes geometry — position and size of every box.
6. **Paint** rasterises pixels into layers.
7. **Composite** hands layers to the GPU. `transform`/`opacity` changes can skip layout and paint entirely — that's *why* they're the cheap animation properties.

The key metric is the count of **critical resources** and **critical bytes** before first render, and the **critical path length** (round trips needed to fetch them).

## 💻 Code

```html
<head>
  <!-- ❌ One big blocking stylesheet: paint waits for ALL of it. -->
  <link rel="stylesheet" href="/all.css" />
</head>
```

```html
<head>
  <!-- ✅ Inline the ~critical CSS for above-the-fold; load the rest non-blocking. -->
  <style>/* critical, above-the-fold rules only */</style>
  <link rel="preload" href="/rest.css" as="style"
        onload="this.rel='stylesheet'" />

  <!-- ✅ media attr makes print/large-screen CSS non-render-blocking -->
  <link rel="stylesheet" href="/print.css" media="print" />
</head>

<!-- ✅ defer keeps scripts off the critical path: runs after parse, in order -->
<script src="/app.js" defer></script>
```

```js
// ❌ Layout thrashing: read, write, read, write forces a reflow each loop.
els.forEach(el => { el.style.height = el.offsetHeight + 10 + 'px'; });

// ✅ Batch reads, then writes. One reflow, not N.
const heights = els.map(el => el.offsetHeight);
els.forEach((el, i) => { el.style.height = heights[i] + 10 + 'px'; });
```

## ⚖️ Trade-offs

- **Inlining critical CSS** speeds first paint but *bloats HTML* and isn't cached separately — only worth it for the above-the-fold minimum, not the whole sheet.
- **`defer` vs `async`:** `defer` preserves order and waits for parse (safe default); `async` runs ASAP but out of order (only for independent scripts like analytics).
- **Fewer requests vs caching:** bundling everything shortens the critical path but busts the cache on any change. HTTP/2 makes many small cached files viable again.
- **When NOT to obsess:** below-the-fold content, and anything after LCP, isn't on the critical path — optimising it buys nothing for perceived load.

## 💣 Gotchas interviewers probe

- **"Is CSS parser-blocking?"** No — it's *render*-blocking. But it becomes parser-blocking transitively via a following `<script>`. Knowing this distinction is the senior signal.
- **`display:none` vs `visibility:hidden`** — the former leaves the node out of the render tree entirely; the latter keeps it in layout. They cost differently.
- **Layout thrashing** — interleaving DOM reads (`offsetHeight`, `getBoundingClientRect`) and writes forces synchronous reflows. Batch them (or use `requestAnimationFrame`).
- **The preload scanner** fetches subresources ahead of the main parser — but only ones present in the *raw HTML*. JS-injected resources miss it entirely.
- **Fonts block text paint**, not layout — hence FOIT/FOUT and `font-display: swap`.
- **Compositor-only properties** (`transform`, `opacity`) animate off the main thread; animating `top`/`width`/`box-shadow` triggers layout/paint every frame.

## 🎯 Say this in the interview

> "The critical rendering path is DOM plus CSSOM into a render tree, then layout, paint, composite. To optimise first paint I focus on the render-blocking resources: CSS is always render-blocking and synchronous JS blocks the parser, so I inline just the critical above-the-fold CSS, load the rest non-blocking, and `defer` scripts. I keep the number of critical requests and bytes small so the path is short in round trips. On the runtime side I avoid layout thrashing by batching DOM reads before writes, and I animate only `transform` and `opacity` so changes stay on the compositor and skip layout and paint. The subtle bit I always mention is that CSS can block the parser transitively — a script after a stylesheet waits for the CSSOM because it might read computed styles."

## 🔗 Go deeper

- [web.dev — Critical rendering path](https://web.dev/articles/critical-rendering-path) — the definitive walkthrough.
- [MDN — Render-blocking resources](https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path) — precise on blocking behaviour.
- [web.dev — Avoid large layout shifts / thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the reflow cost model.
- [Google — Inside look at a modern web browser (part 3)](https://developer.chrome.com/blog/inside-browser-part3) — layout/paint/composite in the real engine.
