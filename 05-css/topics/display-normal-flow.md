<div align="center">

# Display & normal flow

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#layout`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `display` actually sets **two things**: an element's **outer** role (how it behaves toward siblings: `block` vs `inline`) and its **inner** role (how it lays out its children: `flow`, `flex`, `grid`). "Normal flow" is the default inner mode — blocks stack vertically, inline boxes flow horizontally and wrap like text.

---

## 🧠 Mental model

Before Flexbox and Grid, everything was **normal flow**, and it's still the substrate underneath them. Two behaviours:

- **Block boxes** (`div`, `p`, `section`) stack **vertically**, each taking the full available inline width, one per line.
- **Inline boxes** (`span`, `a`, `em`) flow **horizontally** within a line, wrapping to the next line when they run out of room — exactly like words in a sentence.

The modern framing is that `display` is *two-valued*: `display: block flow` is a classic block; `display: inline flex` is an inline element that lays its children out as flex. The old single keywords are shorthands — `block` = `block flow`, `flex` = `block flex`, `inline-block` = `inline flow-root`.

## ⚙️ How it actually works

**Inline boxes ignore `width`, `height`, and vertical margins/padding-for-layout.** You can't set the height of a `<span>` — it's sized by its line-height and content. Horizontal margins/padding work, but vertical padding *paints* without pushing surrounding lines apart. This is *why* `inline-block` exists: it's an inline-level box (flows in a line) that internally is a block (honours width/height and establishes its own formatting context).

**`flow-root` establishes a Block Formatting Context (BFC).** A BFC is a self-contained layout region: floats inside are contained (the old clearfix, retired), margins don't collapse *through* its boundary, and it won't overlap adjacent floats. `display: flow-root` is the clean, side-effect-free way to make one — cleaner than the historical `overflow: hidden` trick, which also clips.

**Margin collapsing** happens in normal flow: adjacent vertical margins between block siblings merge into the larger of the two, and a parent can collapse with its first/last child unless a border, padding, or BFC sits between them. Flex and grid items never collapse.

## 💻 Code

```css
/* Inline elements ignore width/height — a common surprise */
span { width: 200px; height: 50px; } /* ❌ both ignored */
a.button { display: inline-block; width: 200px; height: 50px; } /* ✅ now honoured */

/* Two-value display makes the model explicit */
.menu { display: inline flex; } /* inline-level box, flex inside */
```

```css
/* Establish a BFC to contain floats / stop margin collapse — no clipping */
.media { display: flow-root; }  /* ✅ modern clearfix, zero side effects */
/* .media { overflow: hidden; } ❌ works but clips overflow + can kill sticky */
```

```css
/* display: contents — removes the box, promotes children to the parent's flow */
.wrapper { display: contents; } /* ⚠️ great for layout, but historically drops
                                   the element from the accessibility tree */
```

```css
/* none vs hidden vs contents — three different removals */
.a { display: none; }        /* no box, no space, removed from a11y tree */
.b { visibility: hidden; }   /* box + space kept, just invisible */
.c { display: contents; }    /* box gone, children stay in flow */
```

## ⚖️ Trade-offs

- **`inline-block` vs `flex` for a row of items:** `inline-block` is simple but suffers the whitespace gap (see gotchas) and gives you no distribution control. Flex is almost always the better modern choice for horizontal layout.
- **`display: contents` is powerful for flattening wrapper markup** into a flex/grid parent — but test with a screen reader; several browsers historically removed such elements from the accessibility tree, dropping semantics of `<ul>`, `<button>`, etc. Safe on generic `<div>` wrappers; risky on semantic elements.
- **`display: none` fully removes** — no layout, no paint, not focusable, gone from a11y. Use it to toggle presence; use `visibility: hidden` to hide but reserve space; use opacity for animatable fades.

## 💣 Gotchas interviewers probe

- **`display` is two values (outer + inner).** Explaining that `inline-block` = "inline outside, block-formatting inside" is a strong senior signal.
- **Inline elements ignore `width`/`height` and vertical margins.** The fix is `inline-block` or a flex/grid item.
- **The inline-block whitespace gap.** Whitespace in the HTML between `inline-block` elements renders as a real space (~4px). Fixes: remove the whitespace, `font-size: 0` on the parent, or just use flex/grid with `gap`.
- **`display: contents` and accessibility.** It can strip the element from the a11y tree — don't use it on `<ul>`, `<table>`, `<button>`, or other semantic elements.
- **`display: none` breaks transitions** (there's no intermediate state) and removes the element from tab order — different from `visibility: hidden`.
- **BFC via `flow-root`, not `overflow: hidden`.** The latter clips content and disables `position: sticky` escaping the container.

## 🎯 Say this in the interview

> "`display` actually controls two independent things: the *outer* display type — how the box behaves toward its siblings, block versus inline — and the *inner* type — how it lays out its own children, flow, flex, or grid. So `inline-block` is really 'inline on the outside, block formatting on the inside,' which is why it flows in a line but still honours width and height, unlike a plain inline element that ignores both. Normal flow is the default: blocks stack vertically and full-width, inline boxes flow horizontally and wrap like text. Two things I lean on: `display: flow-root` to establish a block formatting context — it contains floats and stops margin collapse with no clipping, unlike the old `overflow: hidden` trick — and I'm careful with `display: contents` because, while it's great for flattening wrapper divs into a flex parent, it historically drops semantic elements from the accessibility tree, so I only use it on generic wrappers."

## 🔗 Go deeper

- [web.dev — Layout](https://web.dev/learn/css/layout) — normal flow and the display types.
- [MDN — `display`](https://developer.mozilla.org/en-US/docs/Web/CSS/display) — the two-value syntax and every keyword.
- [MDN — Block formatting context](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_display/Block_formatting_context) — what a BFC is and how to create one.
