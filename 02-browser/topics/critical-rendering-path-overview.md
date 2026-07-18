<div align="center">

# Critical rendering path (overview)

<sub>🌐 Browser · 🔴 Hard · ⏱ 1.5h · `#rendering`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The critical rendering path is the fixed sequence the browser runs to turn bytes into pixels — **DOM → CSSOM → render tree → layout → paint → composite** — and every performance win is either *shortening* that path, *unblocking* it, or *skipping* stages you didn't need to re-run.

---

## 🧠 Mental model

The browser is a pipeline that converts HTML/CSS/JS into pixels, and the pipeline **always runs in the same order**. Learn the order once and every rendering-perf question becomes "which stage am I stuck in, and can I avoid it?"

```
 HTML ─► DOM ─┐
              ├─► Render tree ─► Layout ─► Paint ─► Composite ─► pixels
  CSS ─► CSSOM┘        (geometry)   (position)  (draw ops)  (GPU)
```

Two things make this the highest-leverage topic in browser rendering:

1. **The path gates first paint.** Nothing appears until the DOM *and* CSSOM are built and combined. CSS is therefore **render-blocking** by default — the browser refuses to paint unstyled content (avoiding a flash of unstyled content, FOUC).
2. **The path re-runs constantly.** Every interaction and animation flows through some suffix of it. The art is re-running as *little* of the tail (layout/paint) as possible — ideally only composite.

## ⚙️ How it actually works

**Stage by stage:**

1. **DOM construction** — HTML is tokenized and parsed into the DOM tree, incrementally, as bytes stream in.
2. **CSSOM construction** — all CSS (external, inline, embedded) is parsed into the CSSOM. Unlike HTML, CSS is **not** used incrementally: a later rule can override an earlier one, so the browser needs the *whole* stylesheet before it can compute final styles. CSS **blocks rendering**.
3. **Render tree** — DOM + CSSOM are combined into a tree of *what will actually be painted*. `display:none` nodes are excluded; `visibility:hidden` are included (they occupy space); pseudo-elements are added.
4. **Layout (reflow)** — computes the geometry: exact size and position of every box, resolving `%`, `em`, flex/grid. Output: a box for each render-tree node.
5. **Paint** — records the draw operations (fill this rect, draw this text) into layers — a display list, not yet pixels.
6. **Composite** — layers are rasterized (to bitmaps) and assembled by the compositor/GPU into the final frame.

**Where JS wedges in — the blocking rule everyone gets asked:**

- A `<script>` (non-`async`/`defer`) **blocks the parser**: the browser stops building the DOM, fetches and runs the script, then resumes. Scripts are parser-blocking because they might `document.write`.
- Worse: a script that reads styles (`getComputedStyle`, `offsetWidth`) **must wait for the CSSOM**. So **CSS blocks JS**, and parser-blocking JS blocks the DOM — a stylesheet in the `<head>` can delay script execution and thus first paint.

**Optimizing the path — the three levers:**
- **Shorten it:** fewer bytes/requests of critical CSS/JS (minify, inline critical CSS, code-split).
- **Unblock it:** `defer`/`async` scripts, `media` queries on non-critical CSS, `preload` critical fonts.
- **Skip stages:** animate only `transform`/`opacity` so you hit *composite* without *layout* or *paint*; use `content-visibility` to skip layout/paint for offscreen content.

## 💻 Code

```html
<head>
  <!-- Render-blocking: browser waits for this before first paint -->
  <link rel="stylesheet" href="app.css" />

  <!-- ✅ Non-critical CSS made non-blocking via media, then flipped on load -->
  <link rel="stylesheet" href="print.css" media="print" />
  <link rel="preload" href="fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
</head>
<body>
  <h1>Content</h1>

  <!-- ❌ Parser-blocking: DOM construction halts here until fetched + executed -->
  <script src="analytics.js"></script>

  <!-- ✅ defer: fetched in parallel, runs AFTER DOM is parsed, in order -->
  <script src="app.js" defer></script>
  <!-- ✅ async: fetched in parallel, runs ASAP, order NOT guaranteed -->
  <script src="widget.js" async></script>
</body>
```

```js
// Skip the layout/paint tail: animate compositor-only properties.
el.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }], 200); // ✅ composite only
// vs el.style.width = ... in a loop → layout + paint + composite every frame ❌
```

## ⚖️ Trade-offs

- **Inlining critical CSS** cuts a round trip and speeds first paint, but the inlined CSS isn't cached across pages and bloats the HTML. Worth it for the above-the-fold, not for the whole stylesheet.
- **`async` is fastest but order-unsafe** — great for independent analytics, dangerous for scripts with dependencies. `defer` preserves order and DOM-ready timing; it's the safer default for app code.
- **Don't over-index on first paint alone.** A fast blank-then-flash can score well on paint metrics yet feel worse than a slightly later, stable render. Optimize for the *user-perceived* milestones (LCP, INP), not just the first pixel.

## 💣 Gotchas interviewers probe

- **CSS is render-blocking; HTML parsing is not fully blocked by it, but *rendering* is.** The DOM can keep building, but nothing paints until the CSSOM is ready. Precision here is the senior signal.
- **CSS blocks JavaScript.** A synchronous script after a stylesheet waits for that stylesheet, because the script might query computed styles. Ordering `<link>` before `<script>` can stall execution.
- **`defer` ≠ `async`.** `defer`: parallel fetch, run after parse, *in order*. `async`: parallel fetch, run on arrival, *any order*. Confusing them is the classic miss.
- **`display:none` is out of the render tree; `visibility:hidden` and `opacity:0` are not** — they still take up layout and paint. Different costs, different use cases.
- **The path re-runs on mutation.** Changing a geometric style invalidates layout downward; the whole point of "layout thrashing" is forcing that re-run repeatedly in one frame.

## 🎯 Say this in the interview

> "The critical rendering path is the fixed sequence from bytes to pixels: build the DOM from HTML, build the CSSOM from CSS, combine them into the render tree, run layout to get geometry, paint to get draw operations, then composite to pixels. The key facts I anchor on: CSS is render-blocking because a later rule can override an earlier one, so the browser needs the whole stylesheet before it computes styles and paints — and because scripts can read styles, CSS also blocks synchronous JS, and synchronous JS blocks DOM construction. So optimizing is three moves: shorten the path with less critical CSS/JS, unblock it with defer/async and preload, and skip stages by animating only transform and opacity so I hit composite without layout or paint. And I measure against LCP and INP, not just the first pixel."

## 🔗 Go deeper

- [web.dev — Critical rendering path](https://web.dev/articles/critical-rendering-path) — the canonical, stage-by-stage guide.
- [web.dev — Render-blocking CSS](https://web.dev/articles/critical-rendering-path-render-blocking-css) — exactly how and why CSS gates paint.
- [MDN — Populating the page: how browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) — the whole pipeline in one place.
