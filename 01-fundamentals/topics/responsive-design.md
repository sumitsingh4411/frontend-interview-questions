<div align="center">

# Responsive design

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 1h · `#css` `#responsive`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Responsive design is building **one layout that adapts to any viewport** using fluid units, flexible layouts (flexbox/grid), and breakpoints. The modern shift: stop asking "how wide is the *screen*?" (media queries) and start asking "how wide is *this component's container*?" (container queries).

---

## 🧠 Mental model

The web is responsive *by default* — a plain HTML document reflows to any width. Responsive design is really about **not breaking that** as you add layout, plus adding intentional adaptation at the points where the default reflow looks bad.

Three tools, in order of preference:

1. **Intrinsically responsive CSS** — `flex-wrap`, `grid` with `minmax()`/`auto-fit`, `clamp()`. Adapts *continuously* with no breakpoints. This is the goal.
2. **Container queries** — a component styles itself by its *container's* size, so the same card works in a sidebar or a full-width hero.
3. **Media queries** — viewport-level breakpoints. Still needed for page-level layout and things like `prefers-reduced-motion`.

**Mobile-first** is the discipline: write the base styles for small screens, then add complexity upward with `min-width` queries. It produces simpler CSS and matches how most traffic actually arrives.

## ⚙️ How it actually works

Everything rests on the **viewport meta tag**. Without it, mobile browsers render at a fake 980px "layout viewport" and shrink it — your media queries never fire correctly:

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

Then the layout primitives do the work:

- **`fr`, `%`, `minmax()`, `auto-fit/auto-fill`** — grid columns that create/collapse tracks automatically as space changes, *without* a media query.
- **`clamp(min, preferred, max)`** — fluid type/spacing that scales with the viewport but is bounded. Replaces stacks of breakpoints for typography.
- **Container queries (`@container`)** — the component declares `container-type: inline-size`; children query the container's width, not the screen's. This is the biggest shift in years: truly reusable, context-aware components.
- **Breakpoints** should be chosen where *your content* breaks, not to match specific devices — chasing "iPhone width" is a losing game.

Also responsive: **images** (`srcset`/`sizes` serve the right resolution) and **behaviour** (`prefers-reduced-motion`, `prefers-color-scheme`, `hover: none` for touch).

## 💻 Code

```css
/* ✅ Zero-media-query responsive grid: wraps to fit, cards never below 250px. */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

/* ✅ Fluid type without breakpoints: 1rem floor, 3.5rem ceiling. */
h1 { font-size: clamp(1.5rem, 1rem + 4vw, 3.5rem); }
```

```css
/* ✅ Container query: this card restyles by ITS container, not the viewport. */
.card-wrap { container-type: inline-size; }
@container (min-width: 400px) {
  .card { display: grid; grid-template-columns: 120px 1fr; }
}
```

```html
<!-- ✅ Responsive images: browser picks the file; you describe the slot. -->
<img src="s.jpg"
     srcset="s.jpg 400w, m.jpg 800w, l.jpg 1600w"
     sizes="(min-width: 700px) 50vw, 100vw"
     alt="…" />
```

## ⚖️ Trade-offs

- **Media queries vs container queries:** media queries know the *page*; container queries know the *component*. A card in a media-query world has to know which page region it's in — that coupling is exactly what container queries remove. Use media queries for page shell, container queries for reusable components.
- **`vw` units alone are a trap** — text that scales purely with the viewport becomes unreadably small or huge; always bound it with `clamp()`.
- **More breakpoints = more test surface.** Prefer intrinsic layouts that adapt continuously so there are fewer discrete states to QA.
- **When NOT to go fully fluid:** dense data tables and dashboards sometimes genuinely need horizontal scroll on mobile rather than a broken reflow — a scroll container is a legitimate responsive answer.

## 💣 Gotchas interviewers probe

- **Missing/wrong viewport meta tag** — the #1 "why doesn't my responsive site work on mobile" bug. `width=device-width` is mandatory.
- **`px` vs `rem` for media queries and type** — `rem` respects the user's browser font-size setting (an accessibility win); hard `px` ignores it.
- **`100vh` on mobile is broken** by the dynamic address bar — use `100dvh` (dynamic viewport height) or `svh`/`lvh`.
- **Container queries need `container-type`**, and `inline-size` (not `size`) is usually correct to avoid layout loops.
- **Responsive ≠ adaptive** — responsive is one fluid layout; adaptive serves distinct fixed layouts per breakpoint. Interviewers test the distinction.
- **`srcset` `w` descriptors need `sizes`** to work — omitting `sizes` makes the browser assume `100vw`.

## 🎯 Say this in the interview

> "My default is intrinsically responsive CSS that adapts with no breakpoints at all — a grid with `repeat(auto-fit, minmax(...))` and fluid type with `clamp()`. I only reach for breakpoints where the content actually breaks, and I choose them by content, not by chasing device widths. The big recent shift I lean on is container queries: instead of a component asking how wide the screen is, it asks how wide its container is, which makes it genuinely reusable across a sidebar or a hero without knowing the page layout. I go mobile-first with `min-width` queries because the CSS ends up simpler. And the two things that bite people: you need the `width=device-width` viewport meta tag or none of it works on mobile, and `100vh` is broken by the mobile address bar so I use `100dvh`."

## 🔗 Go deeper

- [web.dev — Responsive web design basics](https://web.dev/articles/responsive-web-design-basics) — the modern foundation.
- [MDN — Container queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) — the component-level approach.
- [MDN — Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) — `srcset`/`sizes` done right.
- [web.dev — Learn Responsive Design](https://web.dev/learn/design) — a full, current course.
