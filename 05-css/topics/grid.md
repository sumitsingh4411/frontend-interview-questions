<div align="center">

# Grid

<sub>🎨 CSS · 🟡 Medium · ⏱ 1h · `#layout` `#grid`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Grid is **two-dimensional**: you define rows *and* columns as **tracks** on the container, then place items into the cells. The `fr` unit splits leftover space, `minmax()` sets flexible bounds, and `repeat(auto-fit, minmax(...))` builds responsive layouts with **zero media queries**.

---

## 🧠 Mental model

Where Flexbox distributes items along *one* axis, Grid carves the container into a **matrix of tracks** and you drop items into it. You think top-down: "the container is 3 columns and 2 rows," not "each item takes what it needs."

Two grids coexist. The **explicit grid** is what you declare with `grid-template-columns/rows`. The **implicit grid** is what the browser auto-creates when items overflow your declared tracks — sized by `grid-auto-rows`/`grid-auto-columns`. Knowing which one an item landed in explains most "why is this row the wrong height?" surprises.

## ⚙️ How it actually works

**The `fr` unit is *leftover* space, not a percentage.** The browser first lays out fixed and content-based tracks, then divides whatever remains among the `fr` tracks by ratio. `1fr 1fr` splits the *remaining* space equally *after* a `200px` sidebar and any gaps — which is why `fr` never overflows the way `%` does.

**The hidden `fr` overflow trap.** `1fr` is actually `minmax(auto, 1fr)`, and that `auto` minimum equals the track's **min-content size**. So a grid column containing a long word or `<pre>` won't shrink below it and *overflows* — the exact parallel to Flexbox's `min-width: auto`. The fix is `minmax(0, 1fr)`, which lets the track shrink to nothing so content wraps or truncates.

**Responsive without media queries:** `repeat(auto-fit, minmax(200px, 1fr))` creates as many ≥200px columns as fit, then stretches them to fill. `auto-fill` vs `auto-fit` differ only when items are few: `auto-fill` keeps *empty* phantom tracks (items stay their min size); `auto-fit` *collapses* empty tracks (existing items stretch to fill the row).

**Placement:** name lines or use `grid-template-areas` for readable layouts; `grid-column: 1 / -1` spans a full row (`-1` = last line). `place-items: center` centres every item in both axes in one declaration — the cleanest centering in CSS.

## 💻 Code

```css
/* Classic app shell: fixed sidebar + fluid main, two rows */
.layout {
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr); /* minmax(0,…) prevents overflow */
  grid-template-rows: auto 1fr auto;           /* header, body, footer */
  min-height: 100dvh;
  gap: 16px;
}
```

```css
/* Responsive card grid — no media queries at all */
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}
/* auto-fit  → empty tracks collapse, cards stretch to fill the row
   auto-fill → empty tracks preserved, cards keep their min width      */
```

```css
/* ❌ Long content overflows the column */
.grid { grid-template-columns: 1fr 1fr; }        /* 1fr == minmax(auto,1fr) */

/* ✅ Let tracks shrink below content min-size */
.grid { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
```

```css
/* Readable named areas */
.page {
  display: grid;
  grid-template-areas:
    "nav  header"
    "nav  main";
  grid-template-columns: 200px 1fr;
}
.sidebar { grid-area: nav; }
```

## ⚖️ Trade-offs

- **Grid for 2D, Flex for 1D.** If you're aligning things in both rows *and* columns simultaneously, grid. A single row/column that just distributes space — flex. Using nested flexboxes to fake column alignment across rows is the tell you wanted grid.
- **`grid-template-areas` is self-documenting** but rigid: reordering means rewriting the ASCII map. Line-based placement is more flexible for dynamic content.
- **`auto-fit` collapses empty tracks** (good for "fill the row"), `auto-fill` preserves them (good for stable column widths). Choosing wrong gives either over-stretched lone cards or unexpected gaps.
- **Subgrid** (`grid-template-columns: subgrid`) lets a child align to its parent's tracks — invaluable for card internals lining up across a gallery. Check your browser support target.

## 💣 Gotchas interviewers probe

- **`fr` = `minmax(auto, 1fr)` → overflow.** The grid analogue of flex's `min-width: auto`. `minmax(0, 1fr)` is the fix. Naming this unprompted is a strong signal.
- **`auto-fit` vs `auto-fill`.** They're identical when the row is full; they differ only with few items. Explaining the collapse-vs-preserve behaviour is the senior detail.
- **Implicit vs explicit grid.** Items beyond your declared tracks land in auto-created tracks sized by `grid-auto-rows`, not your `grid-template-rows`. Source of "why is this row a different height?"
- **`fr` distributes *leftover* space** after fixed tracks and gaps — it's not `%`, so it doesn't overflow with gaps like percentages do.
- **`gap` replaces gutter hacks** and, unlike margins, applies only *between* tracks, never at the edges.
- **`grid-column: 1 / -1`** to span full width; `-1` counts from the end line. `span 2` spans two tracks from the auto position.

## 🎯 Say this in the interview

> "Grid is two-dimensional — I define column and row *tracks* on the container and place items into the resulting cells, versus flex which distributes along a single axis. The `fr` unit is the key primitive: it divides *leftover* space after fixed and content tracks, so unlike percentages it doesn't overflow when you add gaps. The gotcha I always mention is that `1fr` is really `minmax(auto, 1fr)`, and that `auto` floor is the track's min-content size — so a long word or a `<pre>` overflows the column, exactly like flex's `min-width: auto` problem. The fix is `minmax(0, 1fr)`. For responsive layouts I use `repeat(auto-fit, minmax(220px, 1fr))` to get media-query-free wrapping, and I'm precise about `auto-fit` versus `auto-fill`: they're identical when the row fills, but with few items `auto-fit` collapses the empty tracks so cards stretch, while `auto-fill` keeps phantom tracks so cards hold their width. And for centering, `place-items: center` is the single cleanest way to do it."

## 🔗 Go deeper

- [CSS-Tricks — A Complete Guide to Grid](https://css-tricks.com/snippets/css/complete-guide-grid/) — the definitive property reference.
- [MDN — Grid layout](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_grid_layout) — concepts, tracks, and placement.
- [MDN — `minmax()`](https://developer.mozilla.org/en-US/docs/Web/CSS/minmax) — the function behind flexible-yet-bounded tracks.
