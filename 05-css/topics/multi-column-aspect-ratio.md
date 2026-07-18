<div align="center">

# Multi-column & aspect-ratio

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#layout` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Multi-column is the one CSS layout mode that flows content *vertically then across* (newspaper-style fragmentation), and `aspect-ratio` finally lets a box compute one dimension from the other — but only when that dimension is left `auto`.

---

## 🧠 Mental model

These are two unrelated tools that both quietly replaced ugly hacks. **Multi-column** is a *fragmentation* layout: you give the browser a column width or a column count, and it slices one continuous flow into balanced columns, filling top-to-bottom, then jumping to the next column — like a newspaper, not like flexbox. **`aspect-ratio`** is a *sizing* rule: it says "if you know my width, my height is width ÷ ratio" (or vice-versa), retiring the infamous `padding-top: 56.25%` hack.

The shared thread worth saying out loud: both properties express *intent* to the layout engine and then let the engine do the arithmetic, instead of you hard-coding pixels that break the moment the container changes.

## ⚙️ How it actually works

**Multi-column** resolves `column-width` and `column-count` *together* as a pair of constraints. `columns: 16rem 3` means "columns at least 16rem wide, but never more than 3 of them". The browser computes `min(column-count, floor(available / column-width))` and distributes leftover space into the gaps. This is why `column-width` is really a *minimum* — it's a target, not a fixed size.

Content flows through columns as **fragments**. A single element (a paragraph, a card) can be split across a column break, which is where `break-inside: avoid` earns its keep. `column-fill: balance` (the default) equalises column heights; `column-fill: auto` fills the first column completely before starting the next, which you want when the multicol block has a fixed height.

**`aspect-ratio`** only acts when at least one axis is *automatic*. The rule of resolution:

| width | height | result |
|---|---|---|
| definite | `auto` | height = width ÷ ratio |
| `auto` | definite | width = height × ratio |
| definite | definite | **ratio ignored** — explicit sizes win |

The critical caveat: `aspect-ratio` sets a *preferred* size, but content can still push the box taller. A card with `aspect-ratio: 1` whose text overflows will grow past square unless you add `min-height: 0` (and usually `overflow`). The ratio is honoured against the box's *automatic minimum size*, not as a hard clamp.

## 💻 Code

```css
/* Responsive columns with no media queries — the count adapts to width */
.notes {
  columns: 18rem;      /* as many ~18rem columns as fit */
  column-gap: 2rem;
  column-rule: 1px solid #ddd;   /* a divider that takes zero layout space */
}
.notes .card {
  break-inside: avoid;          /* ✅ don't split a card across columns */
  margin-block-end: 1rem;
}
```

```css
/* aspect-ratio: modern responsive media, no padding hack */
.video {
  aspect-ratio: 16 / 9;
  width: 100%;        /* height is derived → 9/16 of the width */
}

/* ❌ overflow silently defeats the ratio */
.tile { aspect-ratio: 1; }        /* long content makes it a rectangle */

/* ✅ let content scroll instead of stretching the box */
.tile {
  aspect-ratio: 1;
  min-height: 0;
  overflow: auto;
}
```

## ⚖️ Trade-offs

- **Multi-column is for *reading flow*, not UI layout.** You can't target "the third column" or place items into specific columns — the browser owns fragmentation. For a grid of components, use Grid; for prose, gallery thumbnails, or tag clouds, multicol is unbeatable and adapts with a single line.
- **Don't put interactive/focusable widgets in tall multicol.** Tab order follows source order, which zig-zags visually across columns and confuses keyboard users.
- **`aspect-ratio` on replaced elements** (`<img>`) overrides the intrinsic ratio and, combined with `height: auto`, is the cleanest fix for CLS — reserve the space before the image loads.
- **Prefer `aspect-ratio` over the padding hack** everywhere it's supported; the hack breaks with flexbox/grid children and can't express "height drives width".

## 💣 Gotchas interviewers probe

- **`column-width` is a minimum, not a fixed width.** Columns stretch to fill leftover space; the value only floors how many fit.
- **`break-inside: avoid` is the multicol equivalent of "don't orphan this".** Without it, cards and code blocks tear across the gap. (It also governs print pagination — same mechanism.)
- **`aspect-ratio` is ignored when both width and height are set.** Candidates expect it to *force* a shape; it only fills in a missing dimension.
- **Content overflow beats the ratio.** The box grows past its ratio unless `min-height: 0` / `overflow` let content out. This is the single most common "why isn't my square square?" bug.
- **Percentage `column-gap`** resolves against the multicol element's width, like other inline-axis percentages.

## 🎯 Say this in the interview

> "Multi-column is a fragmentation layout — I give it `columns: 18rem` and the browser flows content top-to-bottom then across, balancing heights, with `break-inside: avoid` to stop cards tearing across the gap. It's for prose and galleries, not component grids, because you can't address individual columns and tab order zig-zags. `aspect-ratio` I reach for whenever a box should derive one dimension from the other — `16/9` on a video wrapper, or on an `<img>` with `height: auto` to reserve space and kill layout shift. The gotcha I always flag: `aspect-ratio` only works when the other axis is `auto`, and content overflow can still stretch the box past its ratio unless I add `min-height: 0` and let it scroll. It's a preferred size, not a hard clamp."

## 🔗 Go deeper

- [MDN — `aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) — resolution rules and the auto-axis requirement.
- [MDN — Multiple-column layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_multicol_layout) — the full property set, including `column-fill` and `column-span`.
- [MDN — `break-inside`](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside) — fragmentation control across columns and print.
- [web.dev — `aspect-ratio`](https://web.dev/articles/aspect-ratio) — practical patterns and the CLS angle.
