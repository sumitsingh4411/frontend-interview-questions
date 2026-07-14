<div align="center">

# Centering (all the ways)

<sub>🎨 CSS · 🟢 Easy · ⏱ 20m · `#layout`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — "Centring a div" isn't one problem; it's a matrix of *inline vs block*, *horizontal vs vertical*, and *known vs unknown size* — and the reason the old tricks felt cursed is that `margin: auto` centres horizontally in flow but resolves to **zero** vertically. Flexbox and Grid make the whole matrix collapse to one line.

---

## 🧠 Mental model

Before you pick a technique, ask three questions: **which axis?**, **is the thing inline or block?**, and **do I know its size?** Almost every "centring is hard" story is really one of these being answered wrong. `text-align: center` centres *inline* content (text, inline-blocks) inside a block. `margin: auto` centres a *block* horizontally by soaking up leftover inline space equally. Neither centres vertically in normal flow — because block layout distributes free space only on the inline axis, so `auto` on the top/bottom margins computes to `0`.

The modern answer is to stop fighting normal flow: create a **flex or grid formatting context**, where free space *is* distributed on both axes, and `auto` margins and alignment properties finally work in two dimensions.

## ⚙️ How it actually works

The reason `place-items: center` "just works" is that flex and grid define explicit alignment along two named axes. In flexbox: `justify-content` aligns along the **main axis**, `align-items` along the **cross axis**. `place-items` is the shorthand for `align-items` + `justify-items`. The container measures the item, computes leftover space, and splits it — on *both* axes — which is exactly the capability normal block flow lacks vertically.

The absolute-position technique works differently and is worth knowing for the unknown-size case:

```css
position: absolute;
top: 50%;                       /* move the box's TOP to the centre line */
left: 50%;
transform: translate(-50%, -50%); /* pull it back by half its OWN size */
```

The trick is that `top: 50%` is relative to the **containing block**, but `translate(-50%, -50%)` is relative to the **element's own box** — the one place percentages flip their reference. That's what makes it work without knowing the element's dimensions.

And the forgotten one — auto margins *do* centre vertically inside a flex or absolutely-positioned context, because those contexts give the vertical axis free space to distribute:

```css
.parent { display: flex; }
.child  { margin: auto; }        /* centred both axes — auto now has space to eat */
```

## 💻 Code

```css
/* The default answer for 95% of cases — one declaration, any size */
.parent {
  display: grid;
  place-items: center;   /* align-items + justify-items, both axes */
}
```

```css
/* Flexbox equivalent — reach for it when you also need direction/wrap */
.parent {
  display: flex;
  justify-content: center;   /* main axis (row → horizontal) */
  align-items: center;       /* cross axis (row → vertical)   */
}

/* Centre a block horizontally the classic way (no fl/grid needed) */
.card { max-width: 60ch; margin-inline: auto; }

/* Centre inline content (text, buttons) */
.banner { text-align: center; }

/* Overlay / unknown-size centring without touching the parent's display */
.badge {
  position: absolute;
  inset: 0;
  margin: auto;              /* auto on all sides + inset:0 → centred */
  width: max-content; height: max-content;
}
```

## ⚖️ Trade-offs

- **`place-items: center` is the right default**, but it centres *every* direct child. If the parent holds one thing (a modal, an empty state), perfect; if it holds a list, you wanted `place-content` or per-item control.
- **Absolute + `translate(-50%,-50%)`** is the escape hatch for centring *over* other content (tooltips, spinners) without disturbing layout — but it removes the element from flow, so it can't push siblings and may sit on a half-pixel (blurry on non-retina; add `will-change`/round if it bites).
- **`margin-inline: auto`** needs a *constrained* width to have leftover space to distribute — on an `auto`-width block it does nothing, which trips people up.
- **Don't set a height and `line-height` equal** to fake vertical centring anymore; it only works for a single line of text and breaks the moment content wraps.

## 💣 Gotchas interviewers probe

- **Why doesn't `margin: auto` centre vertically in normal flow?** Because block layout only distributes free space on the inline axis; vertical `auto` margins compute to `0`. Naming this is a strong senior signal.
- **`justify-content` vs `align-items` flip meaning when `flex-direction` changes.** In `column`, `justify-content` becomes vertical. Alignment is tied to *main/cross*, not *horizontal/vertical*.
- **`transform: translate(%)` is element-relative**, whereas `top/left: %` is containing-block-relative. That mismatch is *why* the `-50%` overlay trick works for unknown sizes.
- **`align-content` vs `align-items`.** `align-items` positions items within their line; `align-content` distributes multiple *lines*. On a single-line flex container `align-content` does nothing — a classic red herring.
- **Text centring ≠ box centring.** `text-align: center` won't move a block child; `margin: auto` won't move inline text. Matching the tool to inline-vs-block is the whole game.

## 🎯 Say this in the interview

> "I don't think of centring as one trick — I think about which axis, whether the thing is inline or block, and whether I know its size. For nearly everything now I use `display: grid; place-items: center`, which centres on both axes for any size in one line. Flexbox with `justify-content`/`align-items` when I also need direction or wrapping — remembering those map to main and cross axis, so they swap when I go to `flex-direction: column`. For centring something *over* other content, like a spinner, I use absolute positioning with `top/left: 50%` and `transform: translate(-50%, -50%)`, which works without knowing the size because the translate percentage is relative to the element's own box while top/left is relative to the container. The old pain was that plain `margin: auto` only centres horizontally in flow, because block layout only hands out free space on the inline axis."

## 🔗 Go deeper

- [Josh Comeau — How to center a div](https://www.joshwcomeau.com/css/center-a-div/) — the definitive decision tree across every case.
- [MDN — Box alignment](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_box_alignment) — how `justify-*`/`align-*` are defined against main/cross axes.
- [MDN — `place-items`](https://developer.mozilla.org/en-US/docs/Web/CSS/place-items) — the one-line both-axes shorthand.
