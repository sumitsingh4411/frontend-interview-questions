<div align="center">

# Render-blocking resources

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#rendering` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Nothing paints until the browser has **both** a DOM and a CSSOM, so every stylesheet in `<head>` blocks the first pixel by construction; scripts are worse, because a synchronous `<script>` blocks the *parser* and, since it might call `getComputedStyle`, also waits for every stylesheet above it.

---

## 🧠 Mental model

"Render-blocking" and "parser-blocking" are two different blocks, and conflating them is the classic tell:

```
CSS   ──▶ blocks RENDER   (parser keeps going, nothing paints)
JS    ──▶ blocks PARSER   (DOM construction literally stops)
JS after CSS ──▶ blocks parser AND waits on the CSSOM  ← the sneaky one
```

The browser refuses to paint without CSSOM for a good reason: painting a DOM with no styles would be a flash of unstyled content, then a violent reflow. So CSS is render-blocking **on purpose** — it's a correctness feature we experience as a performance cost. Your job isn't to remove the block, it's to make the blocking set as small and as early-discovered as possible.

Scripts block the parser because a script can `document.write()` or mutate the tree the parser is mid-way through building. The browser has no way to know it won't, so it stops.

## ⚙️ How it actually works

**The CSS side.** Every `<link rel="stylesheet">` without a `media` attribute joins the render-blocking set. A stylesheet with `media="print"` or `media="(min-width: 1200px)"` is still **downloaded** (at low priority) but does *not* block rendering when the query doesn't match — this is the mechanism behind the "load CSS async" hack:

```html
<link rel="stylesheet" href="non-critical.css" media="print" onload="this.media='all'">
```

It works because the media query is evaluated for blocking purposes, then flipped once the bytes have landed. Ugly, effective, and worth knowing the *why* of.

**The JS side.** `<script>` is parser-blocking. `defer` keeps the fetch parallel and runs the script after the DOM is complete, in document order, before `DOMContentLoaded`. `async` runs it the instant it lands — out of order, possibly mid-parse. `type="module"` is `defer` by default.

**The interaction people miss:** a parser-blocking script that appears *after* a stylesheet cannot execute until that stylesheet has loaded, because the script might query computed styles and the engine must give it a consistent answer. So one slow stylesheet in `<head>` stalls the parser via a script that has nothing to do with it. This is the single biggest reason "just move CSS to the top" is not universally good advice.

**The preload scanner** is the saving grace: a lightweight secondary parser races ahead of the blocked main parser, spotting `src`/`href` and kicking off fetches early. It's also why injecting resources from JS is slower than putting them in markup — the scanner can't see strings inside your bundle.

## 💻 Code

```html
<!-- ❌ Every one of these blocks the first paint, and app.js
     can't even start executing until vendor.css has arrived. -->
<head>
  <link rel="stylesheet" href="vendor.css">   <!-- 180KB, render-blocking -->
  <link rel="stylesheet" href="app.css">
  <script src="analytics.js"></script>        <!-- blocks parser + waits on both CSS files -->
</head>
```

```html
<!-- ✅ Critical CSS inline (zero round-trips), the rest deferred.
     Nothing in <head> stalls the parser. -->
<head>
  <style>/* only the above-the-fold rules */</style>

  <link rel="preload" as="style" href="app.css"
        onload="this.rel='stylesheet'">        <!-- fetch high-pri, apply late -->

  <script src="analytics.js" async></script>   <!-- independent, fire-and-forget -->
  <script src="app.js" defer></script>         <!-- needs the DOM, runs in order -->
</head>
```

Blocking is measurable, not a vibe — check it before you optimise:

```js
// Which resources actually delayed the first paint?
performance.getEntriesByType('resource')
  .filter(r => r.renderBlockingStatus === 'blocking')
  .map(r => [r.name, Math.round(r.duration)]);
```

## ⚖️ Trade-offs

- **Inlining critical CSS trades cache for round-trips.** It kills the blocking request on first load, but those bytes are re-sent on every navigation and can never be cached separately. It's a clear win for landing pages and a bad deal for a deep app where users navigate ten times per session.
- **`async` is rarely what you want.** It means "run at an unpredictable moment, possibly before the DOM exists, possibly out of order with its siblings." Correct for genuinely standalone things like analytics beacons; a race condition generator for anything that touches your app.
- **Don't chase render-blocking when your problem is elsewhere.** If LCP is an image discovered late by the preload scanner, deferring a 4KB stylesheet buys you nothing. Fix the discovery, not the block.
- **When NOT to unblock:** if a stylesheet governs above-the-fold layout, making it async just buys you a flash of unstyled content and a CLS penalty. You traded a metric for a worse user experience.

## 💣 Gotchas interviewers probe

- **"Does `async` unblock rendering?"** It unblocks the *parser*, not rendering — and an `async` script that lands early can still execute mid-parse and force a style recalc. The categories are orthogonal.
- **`media="print"` stylesheets are still downloaded.** They just don't block. Candidates often claim the browser skips them entirely.
- **A script after a stylesheet waits for that stylesheet.** The best question in this area, and most people have never heard of it.
- **`defer` scripts run in document order; `async` scripts do not.** Two `async` modules with an implicit dependency is a heisenbug that only shows up on slow networks.
- **`@import` inside CSS is a serial round-trip.** The browser can't discover it until the parent sheet has parsed, so the preload scanner is blind to it. Never ship it.
- **Fonts don't block render, they block *text*.** That's `font-display`, a separate mechanism — but it's where "invisible content" actually comes from, not from the CSS block.
- **`document.write` in a third-party tag** re-enters the parser and can invalidate the preload scanner's work entirely.

## 🎯 Say this in the interview

> "There are two separate blocks and I keep them apart. CSS is render-blocking: the browser won't paint without a CSSOM, deliberately, because painting unstyled DOM would flash and reflow. JavaScript is parser-blocking: a sync script stops DOM construction because it might `document.write`. The interaction is where it gets interesting — a parser-blocking script placed after a stylesheet can't execute until that stylesheet loads, because it might read computed styles, so one slow CSS file stalls the parser through an unrelated script. Practically: inline critical CSS, load the rest with a preload-and-swap, `defer` anything that needs the DOM, and reserve `async` for genuinely independent things like analytics. Then I verify with `renderBlockingStatus` on the resource timing entries rather than guessing."

## 🔗 Go deeper

- [web.dev — Render-blocking CSS](https://web.dev/articles/critical-rendering-path-render-blocking-css) — the canonical explanation of why CSS blocks the first paint.
- [web.dev — Adding interactivity with JavaScript](https://web.dev/articles/critical-rendering-path-adding-interactivity-with-javascript) — parser-blocking, and the script-waits-on-CSS interaction.
- [MDN — `<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script) — the exact `async` vs `defer` vs module semantics.
- [web.dev — Preload scanner](https://web.dev/articles/preload-scanner) — why markup beats JS-injected resources.
- [HTML spec — Blocking attributes](https://html.spec.whatwg.org/multipage/urls-and-fetching.html#blocking-attributes) — ground truth on the render-blocking set.
