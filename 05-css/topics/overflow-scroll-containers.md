<div align="center">

# Overflow & scroll containers

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#layout`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `overflow` decides what happens when content exceeds its box: `visible` (spills, default), `hidden` (clips), `scroll` (always shows bars), `auto` (bars only when needed). Any value other than `visible` turns the element into a **scroll container** *and* establishes a **BFC** — which has ripple effects on floats, margins, and `position: sticky`.

---

## 🧠 Mental model

An overflow value is really answering: "when the kids don't fit, do I **grow**, **clip**, or **scroll**?" The default is none of those — `visible` lets content *escape the box entirely* and overlap whatever's below. The moment you set `hidden`, `scroll`, `auto`, or `clip`, the element becomes a **scroll container**: a clipping boundary that content is measured against and, optionally, scrolled within.

That transformation is the part people underestimate. Creating a scroll container also creates a **block formatting context**, which changes how floats, margin-collapse, and sticky descendants behave — sometimes fixing a layout, sometimes silently breaking one.

## ⚙️ How it actually works

**`overflow` is shorthand for `overflow-x` and `overflow-y`.** The catch: if you set one axis to a non-`visible` value and leave the other `visible`, the browser **computes the `visible` one to `auto`**. You cannot have `overflow-x: hidden; overflow-y: visible` — a common frustration when you want horizontal clipping but vertical spill. The spec forbids it because a clip on one axis needs a defined region on both.

**`hidden` vs `clip`.** `hidden` clips *and* makes the element a scroll container (programmatically scrollable via `scrollLeft`/`scrollIntoView`, and it establishes a BFC). `clip` also clips but is *not* scrollable and doesn't create a scroll container — lighter-weight when you only want to cut off content.

**Scroll containers and `sticky`.** A `position: sticky` element sticks relative to its **nearest scrolling ancestor**. If a parent has `overflow: hidden` (even accidentally), it becomes that scroll container — and since it usually doesn't actually scroll, the sticky element appears to do nothing. This is the #1 "why won't sticky work?" cause.

**Scroll chaining and `overscroll-behavior`.** When you scroll to the end of an inner scroll container, the scroll "chains" to the parent (the page scrolls). `overscroll-behavior: contain` stops the chain at that container; `none` also disables the bounce/pull-to-refresh. Essential for modals, drawers, and chat panes.

**`scrollbar-gutter: stable`** reserves space for the scrollbar even when absent, so content doesn't shift when a scrollbar appears — a subtle but real layout-stability win.

## 💻 Code

```css
/* ✅ Scrollable panel that doesn't drag the page with it */
.chat {
  max-height: 400px;
  overflow-y: auto;
  overscroll-behavior: contain;   /* scroll stops here, page stays put */
  scrollbar-gutter: stable;       /* no layout shift when bar appears */
}
```

```css
/* ❌ You cannot mix hidden + visible across axes */
.x { overflow-x: hidden; overflow-y: visible; }
/* browser silently computes overflow-y to AUTO → an unexpected scrollbar */

/* ✅ If you only want to clip, use clip (no scroll container, no BFC surprises) */
.badge-wrap { overflow: clip; }
```

```css
/* ⚠️ This accidental scroll container disables sticky inside it */
.wrapper { overflow: hidden; }        /* becomes the scroll ancestor */
.wrapper .toolbar { position: sticky; top: 0; } /* now never sticks */
/* Fix: remove overflow:hidden, or use overflow: clip if you only needed clipping
   (clip does NOT create a scroll container, so sticky keeps working)   */
```

```css
/* overflow also establishes a BFC — the old way to contain floats */
.media { overflow: auto; } /* contains floated children (prefer display: flow-root) */
```

## ⚖️ Trade-offs

- **`auto` over `scroll`** in nearly all cases — persistent scrollbars waste space and look broken on content that fits. Use `scroll` only when a *reserved* scroll area is intentional (or use `scrollbar-gutter: stable`).
- **`overflow: hidden` has side effects** beyond clipping: it makes a scroll container and a BFC, which can disable descendant `sticky` and change margin behaviour. If you *only* want to clip, prefer `overflow: clip`.
- **`overscroll-behavior: contain` is mandatory for overlays.** Without it, scrolling inside a modal leaks to the page underneath — a classic UX bug on mobile.
- **Don't clip content that needs to escape** (tooltips, dropdowns, focus rings). `overflow: hidden` on a card clips them; either portal them out or use `overflow: clip` with `overflow-clip-margin` where appropriate.

## 💣 Gotchas interviewers probe

- **One axis non-`visible` forces the other to `auto`.** You can't have `overflow-x: hidden; overflow-y: visible`. The most-missed overflow rule.
- **`overflow: hidden` disables descendant `position: sticky`** by becoming a non-scrolling scroll container. The top cause of broken sticky headers.
- **`hidden` vs `clip`.** `clip` doesn't create a scroll container or BFC, and isn't programmatically scrollable — reach for it when you only need to cut off content.
- **Overflow establishes a BFC** — contains floats and stops margin-collapse through it (a legit but side-effect-heavy technique).
- **Scroll chaining** leaks to the page; `overscroll-behavior: contain` is the fix for modals/drawers.
- **A scrollbar's appearance shifts layout** unless you reserve it with `scrollbar-gutter: stable`.

## 🎯 Say this in the interview

> "`overflow` decides whether an overflowing box spills, clips, or scrolls, but the important part is the side effects: any value other than `visible` turns the element into a scroll container *and* establishes a block formatting context. Two consequences I always keep in mind. First, you can't mix axes — if you set `overflow-x: hidden` and leave `overflow-y: visible`, the browser silently computes the visible axis to `auto`, so you get an unexpected scrollbar. Second, `overflow: hidden` on a wrapper becomes the nearest scroll container for `position: sticky` descendants, and since it usually doesn't actually scroll, the sticky element just stops working — that's the number-one broken-sticky cause. When I only need to clip without those side effects, I use `overflow: clip`, which doesn't create a scroll container or a BFC. And for any modal or drawer I set `overscroll-behavior: contain` so scrolling doesn't chain to the page behind it."

## 🔗 Go deeper

- [MDN — `overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) — the values and the one-axis-forces-auto rule.
- [MDN — `overscroll-behavior`](https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior) — stopping scroll chaining in overlays.
- [MDN — Scroll containers](https://developer.mozilla.org/en-US/docs/Glossary/Scroll_container) — what becomes one and why it matters for sticky.
