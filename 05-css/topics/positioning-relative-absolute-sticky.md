<div align="center">

# Positioning (relative/absolute/sticky)

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#layout`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `position` changes two things: **what the offset properties (`top/left/…`) are measured from** (the *containing block*) and **whether the element stays in normal flow**. `relative` offsets from its own spot (keeps its space); `absolute`/`fixed` leave flow and position against an ancestor/the viewport; `sticky` is relative until it hits a scroll threshold, then pins.

---

## 🧠 Mental model

Every positioned element resolves its offsets against a **containing block**. The whole topic is really "*which* box is my containing block, and am I still taking up space?"

| `position` | Containing block | In flow? |
|---|---|---|
| `static` (default) | — (offsets ignored) | Yes |
| `relative` | Its own normal position | **Yes** (space reserved) |
| `absolute` | Nearest **positioned** ancestor's padding box | No (removed) |
| `fixed` | The **viewport** (usually) | No (removed) |
| `sticky` | Nearest **scroll container** | Yes, then pins |

`relative` is mostly used *not* to move things but to become the **positioning context** for an `absolute` child — that's its real job.

## ⚙️ How it actually works

**`absolute` walks up for the nearest ancestor with `position != static`.** If none exists, it anchors to the *initial containing block* (viewport-sized). It positions against that ancestor's **padding box**, and it's fully removed from flow — its parent collapses as if it weren't there.

**Why `transform` on an ancestor breaks `position: fixed`.** `fixed` is normally relative to the viewport, so it stays put while the page scrolls. But if *any* ancestor has a `transform`, `filter`, `perspective`, `backdrop-filter`, `will-change` for those, or `contain: paint/layout`, that ancestor becomes the containing block for `fixed` descendants — because those properties establish a new *containing block for fixed elements* (they create a coordinate system / clipping context). Your "fixed" modal now scrolls with, and is clipped by, that ancestor. This is one of the most confusing CSS bugs in existence, and knowing the mechanism is a strong senior signal. (The same properties also affect `absolute`.)

**`sticky` is a hybrid.** The element behaves as `relative` until its containing block scrolls to the threshold you set (`top: 0`), then it "sticks" at that offset — but only *within its parent's box*. Once the parent scrolls out, the sticky element leaves with it. Requirements people forget: it needs a **threshold** (`top`/`bottom`/`left`/`right`), the **scroll container must not be `overflow: hidden`/`auto` in a way that clips it** (a `overflow: hidden` ancestor silently disables sticky), and the **parent must be taller than the element** to have room to travel.

## 💻 Code

```css
/* relative's real job: create a positioning context for an absolute child */
.card { position: relative; }
.card .badge {
  position: absolute;
  top: 8px; right: 8px;   /* measured from .card's padding box */
}
```

```css
/* ❌ This "fixed" header will NOT stay fixed */
.ancestor { transform: translateZ(0); } /* or filter, will-change, etc. */
.header   { position: fixed; top: 0; }  /* now bound to .ancestor, scrolls with it! */

/* ✅ Remove the transform from the ancestor, or move the fixed element out of it */
```

```css
/* Sticky section header — the requirements that make it actually work */
.section-header {
  position: sticky;
  top: 0;                 /* REQUIRED threshold */
  /* parent must be taller than this element, and no clipping overflow ancestor */
}
```

```css
/* Full-cover overlay: absolute with all four insets (or inset: 0) */
.overlay { position: absolute; inset: 0; } /* top/right/bottom/left all 0 */
```

## ⚖️ Trade-offs

- **`absolute` removes from flow**, so siblings ignore it and the parent may collapse. Great for overlays/badges; dangerous when you expected the parent to grow around it.
- **`fixed` is fragile** precisely because a single `transform`/`filter`/`will-change` anywhere up the tree changes its containing block. In transform-heavy UIs (animations, virtualised lists), prefer portalling the fixed element to `<body>`.
- **`sticky` is cheap and JS-free** for pinned headers, but it silently fails inside clipping-overflow ancestors and when the parent isn't tall enough — hard to debug because there's no error, it just doesn't stick.
- **Prefer flow/flex/grid for layout**, positioning for *overlays and pins*. Building whole layouts with `absolute` is brittle and non-responsive.

## 💣 Gotchas interviewers probe

- **`transform`/`filter`/`will-change` on an ancestor re-parents `fixed` (and `absolute`).** *The* marquee gotcha. Explaining *why* — those properties establish a containing block for positioned descendants — is the staff-level answer.
- **`absolute` positions against the nearest *positioned* ancestor**, not the direct parent. Forgetting to set `position: relative` on the intended parent sends it to the viewport.
- **`sticky` needs a threshold and an unclipped, tall-enough parent.** No `top`/`bottom` value = never sticks; `overflow: hidden` ancestor = silently disabled.
- **`z-index` only applies to positioned elements** (and flex/grid items). On a `static` element it does nothing.
- **`absolute` shrink-wraps** to content unless you set a width or opposing insets (`left` *and* `right`).
- **`inset: 0` is shorthand** for all four offsets — cleaner than four properties for full-cover overlays.

## 🎯 Say this in the interview

> "`position` controls two things: what the offsets are measured against — the containing block — and whether the element stays in flow. `relative` keeps its space and offsets from its own position; its real purpose is usually to become the positioning context for an `absolute` child. `absolute` leaves flow and anchors to the nearest *positioned* ancestor's padding box, falling back to the viewport if there isn't one. The gotcha I'd highlight is `fixed`: it's normally viewport-relative, but if any ancestor has a `transform`, `filter`, `will-change`, or `contain`, that ancestor becomes the containing block for fixed descendants — so your fixed modal suddenly scrolls with and gets clipped by that ancestor. That's because those properties establish a new containing block for positioned elements. In transform-heavy UIs I portal fixed elements to the body to avoid it. And `sticky` is relative-until-threshold: it needs a `top` or `bottom` value, a parent taller than itself, and no clipping-overflow ancestor, or it silently just won't stick."

## 🔗 Go deeper

- [MDN — `position`](https://developer.mozilla.org/en-US/docs/Web/CSS/position) — every value and its containing-block rules.
- [MDN — Containing block](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Containing_block) — the property list that re-parents `fixed`/`absolute`.
- [web.dev — Positioning](https://web.dev/learn/css/layout#positioning) — the flow/out-of-flow model with examples.
