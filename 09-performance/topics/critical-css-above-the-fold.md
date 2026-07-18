<div align="center">

# Critical CSS & above-the-fold

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#rendering`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSS is **render-blocking**: the browser won't paint a single pixel until it has downloaded and parsed every stylesheet in the `<head>`. Critical CSS inlines the *small* subset needed to render the above-the-fold view directly in the HTML, then loads the rest asynchronously — trading a round trip for a much faster First Contentful Paint.

---

## 🧠 Mental model

The browser needs the CSSOM before it can build the render tree, and it treats an external `<link rel="stylesheet">` as a hard gate: **HTML parsed, CSS not yet arrived = blank screen**. If your stylesheet is 80KB and lives one round trip away, every user stares at white until it lands — even though only ~5KB of it styles what they can currently see.

Critical CSS flips the dependency: extract the rules that style the **initial viewport**, inline them in a `<style>` in the `<head>` so they arrive *with the HTML* (zero extra requests), and defer the full stylesheet so it doesn't block the first paint. The first meaningful frame now depends only on the HTML response, not on a second network trip.

Think of it as **paying the render-blocking cost once, for a tiny file, in the same packet as the HTML** — instead of for the whole design system, a round trip later.

## ⚙️ How it actually works

**Why CSS blocks rendering at all:** an incomplete CSSOM would cause a flash of unstyled content and re-layouts, so the spec makes the browser wait. (JS blocks too, because scripts can read computed styles — which is why a `<script>` will even wait on a *preceding* stylesheet.) Critical CSS attacks the CSS half of that gate.

**The pipeline:**

1. **Extract** — render the page at a target viewport (e.g. 1300×900 desktop, 360×640 mobile) in a headless browser and collect exactly the rules that apply to elements in the viewport. Tools: Critters/`beasties`, `critical`, Penthouse. Frameworks like Next.js and Astro can inline critical CSS automatically.
2. **Inline** — drop that subset into `<style>` in the `<head>`. It ships in the HTML, so FCP no longer waits on a CSS round trip.
3. **Defer the rest** — load the full stylesheet non-blockingly, then swap it to `media="all"` on load. The `preload`+`onload` pattern below is the canonical trick.

**"The fold" is fuzzy** — extract too little and below-the-fold content flashes unstyled as the user scrolls (a real FOUC risk); extract too much and you bloat the HTML and lose the win. Practical sweet spot: keep inlined CSS under ~14KB (historically tied to the initial TCP congestion window, still a decent rule of thumb) and cover a generous first viewport.

## 💻 Code

```html
<head>
  <!-- 1. Critical CSS inlined: styles the first viewport, ships WITH the HTML -->
  <style>
    /* extracted above-the-fold rules — header, hero, layout shell */
    body{margin:0;font:16px/1.5 system-ui}
    .header{height:64px;background:#0b0b0b;color:#fff}
    .hero{min-height:70vh;display:grid;place-items:center}
  </style>

  <!-- 2. Full stylesheet loaded async: preload as a style, flip to a real stylesheet on load -->
  <link rel="preload" href="/app.css" as="style"
        onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="/app.css"></noscript>
</head>
```

```html
<!-- ❌ The default: full 80KB stylesheet blocks the first paint on a round trip -->
<link rel="stylesheet" href="/app.css">
<!-- everything downstream renders blank until app.css arrives -->
```

```js
// Modern alternative: content-visibility lets the browser SKIP rendering
// off-screen sections entirely — cheaper than manual critical extraction for long pages.
// (CSS)  .below-fold-section { content-visibility: auto; contain-intrinsic-size: 0 800px; }
```

## ⚖️ Trade-offs

- **Critical CSS is a build-and-maintenance cost.** Extraction must re-run on every design change or it drifts and you inline stale rules. It shines for content sites with a stable, cacheable shell; it's often not worth it for an app behind a login where the shell is already JS-driven.
- **Inlining bloats the HTML and it isn't cached across pages** — every navigation re-downloads the same critical block. Fine for a landing page hit once; wasteful across a deep, same-user session where a shared external cached stylesheet would win.
- **When NOT to bother:** if your total CSS is already tiny (<~15KB) and HTTP/2, just ship it in one blocking `<link>` — the round trip is cheap and you skip all the complexity.
- **`content-visibility: auto`** and container queries reduce the *need* for manual critical extraction on long pages by letting the browser defer off-screen layout/paint — a more modern lever worth reaching for first.

## 💣 Gotchas interviewers probe

- **"Is CSS render-blocking or parser-blocking?"** Render-blocking — the parser keeps building the DOM, but paint is gated on the CSSOM. (A `<script>` is *parser*-blocking, and also waits on preceding CSS.)
- **The `onload` swap trick is easy to get subtly wrong** — forget `this.onload=null` and some browsers re-fire it; forget `<noscript>` and no-JS users get an unstyled page.
- **Over-inlining kills the win.** Inline the whole 80KB and you've just moved the blocking bytes into the HTML *and* lost cross-page caching. The extract must be *small*.
- **FOUC below the fold** is the honest downside — as content scrolls in before `app.css` loads, unextracted elements briefly render unstyled. Extract a generous viewport to soften it.
- **`media="print"` hack** (`onload="this.media='all'"`) is a common alternative to `preload`+`onload`; know both, and know they solve the same "don't block, then activate" problem.
- **Fonts still block text paint separately** — critical CSS speeds layout, but `font-display` governs whether text shows immediately. Different lever, same goal.

## 🎯 Say this in the interview

> "The core fact is that CSS is render-blocking: the browser won't paint until it has the full CSSOM, so an external stylesheet a round trip away means a blank screen until it lands. Critical CSS extracts just the rules that style the initial viewport, inlines them in a `<style>` in the head so they ship inside the HTML with zero extra requests, and defers the rest with a preload-and-onload swap so the full sheet doesn't block first paint. That turns FCP into a function of the HTML response alone. The trade-off I'd name is that it's a build-time cost that drifts if you don't re-extract, and inlining isn't cached across pages — so it's a big win for content and landing pages with a stable shell, but often not worth it for a small stylesheet or a JS-shell app. On long pages I'd reach for `content-visibility: auto` first, since it lets the browser skip off-screen rendering without any extraction step."

## 🔗 Go deeper

- [web.dev — Extract critical CSS](https://web.dev/articles/extract-critical-css) — the extraction pipeline and the tools that automate it.
- [web.dev — Defer non-critical CSS](https://web.dev/articles/defer-non-critical-css) — the preload/onload and print-media deferral patterns.
- [MDN — Render-blocking CSS](https://developer.mozilla.org/en-US/docs/Web/Performance/CSS_JavaScript_animation_performance) — why the browser gates paint on the CSSOM.
- [web.dev — `content-visibility`](https://web.dev/articles/content-visibility) — the modern way to skip off-screen rendering work.
