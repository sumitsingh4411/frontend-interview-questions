<div align="center">

# Box model & `box-sizing`

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#basics` `#layout`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every element is four nested rectangles (content → padding → border → margin), and `width` sizes the **content box** by default; `box-sizing: border-box` re-points `width` at the **border box** so padding and border eat *into* your number instead of adding to it.

---

## 🧠 Mental model

A box is not one rectangle, it's four:

```
┌─ margin ───────────────────────────────┐  ← transparent, collapses, outside the box
│  ┌─ border ──────────────────────────┐ │
│  │  ┌─ padding ────────────────────┐ │ │  ← painted with the background
│  │  │  ┌─ content ──────────────┐  │ │ │
│  │  │  │   text, images, kids   │  │ │ │
│  │  │  └────────────────────────┘  │ │ │
│  │  └──────────────────────────────┘ │ │
│  └───────────────────────────────────┘ │
└────────────────────────────────────────┘
```

The only real question `box-sizing` answers is: **which of those rectangles does the `width` property refer to?** `content-box` (the CSS default, and a genuine spec mistake we've all agreed to work around) means `width: 300px` describes the innermost box — so a 300px box with 20px padding and a 1px border actually occupies **342px**. `border-box` means `width: 300px` describes the border box — the element is 300px on screen, full stop, and the content shrinks to make room.

## ⚙️ How it actually works

The used width is always computed the same way; only the *starting point* moves.

| | `content-box` | `border-box` |
|---|---|---|
| `width: 300px` sets | content width | border-box width |
| Rendered width | `300 + padding + border` | `300` |
| Content width | `300` | `300 - padding - border` |

Two mechanisms people forget:

**Margins are outside everything.** They never count toward `width`, they collapse vertically between siblings, and they can be negative. `box-sizing` does **not** touch margins — this is the #1 misconception. `border-box` gives you "the box is exactly this wide"; it does *not* give you "the box plus its margin is this wide".

**`border-box` has a floor.** If padding + border exceed the declared width, the content box clamps to `0` — the element cannot shrink below its own padding and border. `width: 20px; padding: 20px` under `border-box` renders 40px wide, not 20px. The property is a *hint about interpretation*, not a hard constraint.

**`box-sizing` is not inherited.** That's why the canonical reset uses `inherit` explicitly, so third-party widgets you drop inside can opt out.

## 💻 Code

```css
/* ❌ The naive two-column layout that breaks the moment you add padding */
.col {
  width: 50%;
  padding: 16px;   /* now each column is 50% + 32px → they wrap */
  border: 1px solid;
}

/* ✅ border-box makes the arithmetic honest */
.col {
  box-sizing: border-box;
  width: 50%;      /* rendered width is exactly 50%, padding included */
  padding: 16px;
  border: 1px solid;
}
```

The reset every codebase should ship — and *why* it's written this way:

```css
/* Set it once on the root, then inherit it everywhere.
   Using `inherit` (not `border-box`) on * lets a subtree opt out
   by setting box-sizing on one container. */
html {
  box-sizing: border-box;
}
*,
*::before,
*::after {
  box-sizing: inherit;
}
```

Measuring at runtime — three different numbers, and interviewers ask which is which:

```js
el.getBoundingClientRect().width; // border-box width, INCLUDING transforms (fractional)
el.offsetWidth;                   // border-box width + scrollbar, EXCLUDING transforms (rounded int)
el.clientWidth;                   // padding-box width, minus scrollbar. No border.
getComputedStyle(el).width;       // used content width under content-box;
                                  // border-box width under border-box. Depends on box-sizing!
```

## ⚖️ Trade-offs

- **`border-box` everywhere is the right default**, but it isn't free of surprises: `width: 100%` on an element with padding now *includes* the padding, so a nested full-width child no longer overflows — which is what you want 95% of the time and quietly wrong when you actually wanted the content to be 100%.
- **Don't reach for `box-sizing` to solve gutters.** `gap` in flex/grid, or `padding` on the parent, express intent far better than percentage widths that have to be reasoned about arithmetically. Modern layout largely retires the problem `border-box` was invented for.
- **`content-box` still has legitimate uses** — most notably when you want a fixed *content* size (an image slot, a canvas, a fixed-size icon) and padding must genuinely add around it.

## 💣 Gotchas interviewers probe

- **"Does `border-box` include the margin?"** No. Margin is always outside the box. If a candidate says yes, that's a fail signal.
- **`outline` is not in the box model.** It doesn't affect layout, doesn't take space, and can overlap neighbours — which is exactly why it's the right choice for focus rings.
- **`box-shadow` also takes zero layout space** (unless it's `inset`, which paints inside). Both `outline` and `box-shadow` paint *over* the box without reflowing anything.
- **Percentage padding resolves against the containing block's *inline* size** — even `padding-top: 50%`. That's the trick behind the old aspect-ratio hack, and it means vertical percentage padding depends on *width*, not height.
- **Margin collapsing.** Adjacent vertical margins merge into the larger of the two; parent and first child collapse together unless the parent has padding, a border, or establishes a BFC (`display: flow-root`). Horizontal margins never collapse. Flex and grid items never collapse.
- **`width: 100%` vs `width: auto` on a block.** `auto` fills the space *after* margins are subtracted; `100%` ignores margins and overflows. `auto` is almost always what you meant.

## 🎯 Say this in the interview

> "Every element is four boxes: content, padding, border, margin. The default `content-box` means `width` sizes only the content, so padding and border are added on top — a 300px box with 20px padding is really 342px on screen. `border-box` re-points `width` at the border box, so the element is exactly the width I asked for and the content shrinks to fit. That makes percentage layouts with padding actually work, which is why nearly every codebase resets to `border-box` globally. The detail I'd flag: `border-box` never includes the margin — margin always sits outside the box and it collapses vertically. And when I measure a box in JS I pick deliberately: `getBoundingClientRect()` gives me the transformed border box as a float, `clientWidth` gives me the padding box minus scrollbar."

## 🔗 Go deeper

- [MDN — The box model](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model) — the canonical walkthrough, with the content-box/border-box comparison.
- [MDN — `box-sizing`](https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing) — the exact property semantics, including the clamping behaviour.
- [MDN — Mastering margin collapsing](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_model/Mastering_margin_collapsing) — the rules people guess at and get wrong.
- [CSS-Tricks — `box-sizing`](https://css-tricks.com/box-sizing/) — the history of the reset and why `inherit` beats `border-box` on `*`.
