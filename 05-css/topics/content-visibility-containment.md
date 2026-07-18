<div align="center">

# `content-visibility` & containment

<sub>🎨 CSS · 🔴 Hard · ⏱ 45m · `#performance` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `content-visibility: auto` lets the browser **skip layout and paint for subtrees that aren't near the viewport**, and containment (`contain`) is the promise that makes that safe by telling the engine "nothing inside this box can affect anything outside it."

---

## 🧠 Mental model

The rendering pipeline has stages — **style → layout → paint → composite** — and each runs over a *subtree*. The browser's problem is that, by default, any element can influence any other: a change deep in the DOM might resize an ancestor, so the engine can't safely ignore parts of the page.

**Containment is you signing a contract**: "this element's internals are isolated." Once the browser trusts that, it can treat the box as a black box and skip work on it. `content-visibility` is the killer application of that contract — it says "and while you're at it, don't even bother rendering the inside until it scrolls close to the viewport."

Think of a 10,000-row feed. Without containment the browser lays out and paints all 10,000 rows on load. With `content-visibility: auto`, it renders only the ~screenful you can see plus a margin, and defers the rest. Layout cost stops scaling with document size and starts scaling with viewport size.

## ⚙️ How it actually works

`contain` comes in flavours, each granting the browser a specific optimisation:

| Value | The promise | What it unlocks |
|---|---|---|
| `layout` | my internal layout doesn't affect outside boxes | skip re-laying-out siblings/ancestors |
| `paint` | my descendants don't paint outside my box | clip, and skip painting when off-screen |
| `size` | my size doesn't depend on my children | compute my size without laying out children |
| `style` | counters/quotes don't escape | scope `counter`/`content` effects |

`content-visibility: auto` is the ergonomic bundle: it applies `contain: layout style paint` **and** adds "skip rendering entirely while off-screen." When an element is far from the viewport, its subtree is not laid out and not painted — it's *rendering-skipped*, which is why it's dramatically cheaper than being merely hidden.

The catch that trips everyone: if the browser isn't rendering a subtree, **it doesn't know how tall it is**, so it reports it as 0px high. Scrollbars jump, and scroll position is unstable as content pops in. The fix is `contain-intrinsic-size` — you supply a *placeholder* size the browser uses as a stand-in until it renders for real:

```css
.feed-row {
  content-visibility: auto;
  contain-intrinsic-size: auto 120px; /* "assume ~120px tall until measured" */
}
```

The `auto` keyword makes it even smarter: once a row *has* been rendered, the browser **remembers** its last real size and uses that as the intrinsic size next time it's skipped — so scroll height stays stable after the first pass.

## 💻 Code

```css
/* ❌ contain: strict on everything — over-promising breaks layout.
   strict = size + layout + paint. If the box actually needs to grow
   to fit its content, size containment collapses it. */
.card { contain: strict; }

/* ✅ Long article/comment list: defer off-screen sections cheaply */
.comment {
  content-visibility: auto;
  contain-intrinsic-size: auto 80px; /* remembered size, 80px fallback */
}
```

```css
/* ✅ Isolate a widget that mutates a lot (a live chart, a ticker)
   so its reflows never invalidate layout for the rest of the page. */
.live-widget {
  contain: layout paint;
}
```

Measuring the payoff is straightforward: in DevTools Performance, the "Layout" and "Paint" bars shrink on load because skipped subtrees never enter those stages.

## ⚖️ Trade-offs

- **Not for above-the-fold content.** Anything in the initial viewport must render anyway, and adding `content-visibility: auto` there just adds bookkeeping. Apply it to the *long tail* below the fold.
- **You must estimate intrinsic size.** Get `contain-intrinsic-size` badly wrong and the scrollbar lies, `Ctrl+End` overshoots, and scroll anchoring fights you. It's a real maintenance surface.
- **`contain: size` is a foot-gun on auto-sized elements.** Promising the browser your size is independent of children, when it isn't, collapses the box to zero. Use `layout`/`paint` far more often than `size`.
- **When NOT to use it:** short pages, or content that's frequently scrolled-to via in-page anchors — the reveal cost can show up as a visible hitch on jump.

## 💣 Gotchas interviewers probe

- **"Does `content-visibility: auto` hurt accessibility or find-in-page?"** No — this is the senior detail. Off-screen skipped content **is** in the accessibility tree and **is** searchable by `Ctrl+F`; browsers force it to render when found or focused. That's the whole reason it beats `display: none` for long content.
- **Skipped ≠ hidden.** `display: none` removes from the a11y tree and destroys layout state; `content-visibility: auto` keeps semantics and just defers *work*.
- **Layout containment establishes a new containing block and a stacking context** — `position: fixed` children now anchor to the contained box, and `z-index` is scoped. This surprises people.
- **`contain: paint` clips overflow**, so tooltips/dropdowns that escape the box get cut off — a common regression when someone adds containment for perf.
- **Intrinsic size + real content mismatch** causes cumulative layout shift (CLS) as items settle. `contain-intrinsic-size: auto <n>` mitigates by caching measured sizes.

## 🎯 Say this in the interview

> "Containment is a contract with the rendering engine: `contain: layout` tells it my internal layout can't affect anything outside, so it can skip re-laying-out the rest of the page when I change. `content-visibility: auto` is the big win built on that — it bundles layout, paint, and style containment and *skips rendering entirely* for subtrees far from the viewport, so on a huge feed the browser only pays for what's roughly on screen. The gotcha is that a non-rendered element reports zero height, so I always pair it with `contain-intrinsic-size` — using the `auto` keyword so the browser caches each item's real size after first render and the scrollbar stays stable. And crucially, unlike `display: none`, the content is still in the accessibility tree and still findable with Ctrl+F, so it's safe for real content, not just decoration."

## 🔗 Go deeper

- [web.dev — content-visibility](https://web.dev/articles/content-visibility) — the definitive guide, with the feed benchmark and `contain-intrinsic-size`.
- [MDN — CSS containment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment) — the four containment types and exactly what each promises.
- [MDN — content-visibility](https://developer.mozilla.org/en-US/docs/Web/CSS/content-visibility) — property semantics and the `auto` skipping behaviour.
- [CSSWG — css-contain spec](https://www.w3.org/TR/css-contain-2/) — the normative source for containment and rendering-skip.
