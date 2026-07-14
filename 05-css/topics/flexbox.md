<div align="center">

# Flexbox

<sub>🎨 CSS · 🟢 Easy · ⏱ 1h · `#layout` `#flexbox`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Flexbox lays items out along **one axis** and distributes the **free space** left over. `flex: grow shrink basis` tells each item how to absorb or give up that space. The single detail that separates seniors from juniors: a flex item's default `min-width` is **`auto`** (its content size), which is why long text and images **overflow** — `min-width: 0` is the fix.

---

## 🧠 Mental model

Flexbox is a **one-dimensional negotiation over free space**. Pick a main axis (`flex-direction: row` or `column`); the cross axis is perpendicular. The algorithm:

1. Lay every item out at its **`flex-basis`** (its ideal size along the main axis).
2. Add up the bases. Compare to the container's size.
3. **Leftover space?** Hand it out by `flex-grow` ratios.
4. **Not enough space?** Take it back by `flex-shrink` ratios (weighted by basis).

`justify-content` distributes along the **main** axis; `align-items` aligns along the **cross** axis. That's the whole model — everything else is refinement.

## ⚙️ How it actually works

**The `flex` shorthand is three properties**, and the common keywords expand to:

| Shorthand | grow / shrink / basis | Meaning |
|---|---|---|
| `flex: 1` | `1 1 0%` | Grow to fill, ignore content size, equal columns |
| `flex: auto` | `1 1 auto` | Grow to fill, *starting from* content size |
| `flex: none` | `0 0 auto` | Fixed at content size, never flex |
| `flex: 0 1 auto` | (the default) | Don't grow, do shrink |

`flex: 1` uses **basis `0`**, so items ignore their content and split space equally — that's why `flex: 1` on siblings makes *equal* columns, while `flex: auto` makes columns *proportional to their content*.

**Why items overflow — the `min-width: auto` trap.** By spec, a flex item's `min-width` (in a row) defaults to **`auto`**, which computes to its **min-content size** — the longest unbreakable word, or an image's intrinsic width. Shrinking stops there. So a flex child holding a long URL or a `<pre>` block refuses to get narrower than its content and blows out of the container. The fix is to override that floor: `min-width: 0` (or `overflow: hidden`), which lets the item shrink and its content wrap or clip. In a `column`, the equivalent is `min-height: 0`. This is *the* flex interview question.

**`align-items: stretch` is the default** — items grow to fill the cross axis (equal-height cards for free). `align-self` overrides per item. `gap` spaces items without margin hacks and doesn't add space at the ends.

## 💻 Code

```css
.container {
  display: flex;
  gap: 16px;              /* clean spacing, no edge margins */
  align-items: stretch;  /* default: equal-height children */
}

/* Equal columns vs content-proportional columns */
.equal > *  { flex: 1; }     /* basis 0 → all equal regardless of content */
.natural > * { flex: auto; } /* basis auto → wider content gets more space */
```

```css
/* ❌ Long text / images blow out the layout */
.item { flex: 1; }
/* the text child won't shrink below its longest word → horizontal overflow */

/* ✅ Let the flex item shrink past its content size */
.item { flex: 1; min-width: 0; }   /* now truncation/wrapping works */
.item p { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

```css
/* The classic push-apart pattern: margin-auto eats free space */
.navbar { display: flex; }
.navbar .logo { margin-right: auto; } /* pushes everything after it to the right */

/* Perfect centering in two lines */
.center { display: flex; justify-content: center; align-items: center; }
```

## ⚖️ Trade-offs

- **Flex is for one dimension; Grid is for two.** A toolbar, a row of cards, a stack — flex. A page layout with aligned rows *and* columns — grid. Nesting flex to fake a 2D grid is a smell.
- **`flex: 1` (basis 0) vs `flex: auto` (basis auto)** is a real decision: equal columns vs content-weighted columns. Picking the wrong one causes "why is this column wider?" confusion.
- **`gap` over margins.** `gap` expresses spacing intent, avoids the first/last-child margin dance, and doesn't leak to the container edges.
- **Don't over-nest.** Deeply nested flex containers get hard to reason about; flatten with grid or `display: contents` where it helps.

## 💣 Gotchas interviewers probe

- **`min-width: auto` overflow.** *The* question. Flex items won't shrink below their content's min size; `min-width: 0` (row) / `min-height: 0` (column) releases the floor. Explaining *why* — the auto min-size rule — is the senior signal.
- **`flex-basis` beats `width`.** When both are set, `flex-basis` wins on the main axis. `basis: 0` vs `auto` changes distribution entirely.
- **`flex-shrink` is weighted by basis**, not just the ratio: a larger item gives up proportionally more space. Not a plain 1:1.
- **`align-items` vs `align-content`.** `align-items` aligns items on the cross axis; `align-content` distributes *wrapped lines* and only does anything when there are multiple lines (`flex-wrap: wrap`).
- **`margin: auto` absorbs free space** on any side — the cleanest push-apart and even for centering (including *vertical*, which margin auto can't do in normal flow).
- **Percentage `flex-basis` needs a definite container size** on the main axis, or it falls back to content.

## 🎯 Say this in the interview

> "Flexbox is one-dimensional: items lay out along a main axis and the algorithm distributes leftover space. Each item starts at its `flex-basis`, then `flex-grow` hands out extra space and `flex-shrink` claws it back when there isn't enough. The distinction I always make is `flex: 1`, which is `1 1 0` — basis zero, so items split space equally regardless of content — versus `flex: auto`, which is basis `auto`, so items keep their content size and only share the *extra*. The gotcha I'd lead with is overflow: a flex item's default `min-width` is `auto`, which resolves to its min-content size — the longest word or an image's intrinsic width — so it refuses to shrink below that and blows out the container. The fix is `min-width: 0` on the item, or `min-height: 0` in a column. That one rule explains ninety percent of 'why is my flex layout overflowing' bugs. For spacing I use `gap`, and `margin: auto` for push-apart since it absorbs free space on whichever side you put it."

## 🔗 Go deeper

- [CSS-Tricks — A Complete Guide to Flexbox](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) — the canonical property-by-property reference.
- [MDN — Basic concepts of flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Basic_concepts_of_flexbox) — axes, basis, and the sizing algorithm.
- [MDN — Controlling ratios of flex items](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_flexible_box_layout/Controlling_ratios_of_flex_items_along_the_main_axis) — grow/shrink/basis and the min-size floor.
