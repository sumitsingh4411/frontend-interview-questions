<div align="center">

# Units (rem/em/%/vw/ch)

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `px` is absolute; the useful units are **relative**: `em` scales off the *element's own* font-size (so it compounds), `rem` off the *root* font-size (stable, and it respects the user's browser font setting), `%` resolves against different references per property, and viewport units (`vw/vh`, plus mobile-safe `dvh`) scale with the screen. Use `rem` for type and spacing so your UI honours user zoom.

---

## 🧠 Mental model

There are two families. **Absolute** (`px`) is a fixed device-independent pixel — predictable, but deaf to user preferences. **Relative** units are functions of *something else*, and the whole game is knowing *what*:

| Unit | Relative to |
|---|---|
| `em` | The **element's own** `font-size` (or the parent's, for the `font-size` property itself) |
| `rem` | The **root** (`<html>`) `font-size` |
| `%` | **Depends on the property** — see below |
| `vw` / `vh` | 1% of viewport **width** / **height** |
| `ch` | Advance width of the `0` glyph in the current font |
| `ex` | The font's x-height |

The senior instinct: reach for `rem` by default (it tracks the user's font-size setting and never compounds), use `em` deliberately when you *want* a value to scale with local text (padding inside a button), and use `ch` to size text containers by character count.

## ⚙️ How it actually works

**`em` compounds.** Because `em` is relative to the *current* element's font-size, nesting multiplies: a `1.2em` list inside a `1.2em` list renders at `1.44em` of the grandparent. `rem` sidesteps this by always anchoring to the root — one stable reference, no drift.

**`%` is context-dependent — this is the trap.** For `width`/`left`/`margin`/`padding` it resolves against the **containing block's inline size** (its *width*), even for `padding-top` and `margin-top`. For `height` it resolves against the containing block's *height* — and if the parent has no explicit height, `height: 100%` computes to `auto`. For `font-size`, `%` is relative to the parent's font-size (like `em`); for `line-height`, to the element's own font-size.

**`rem` and accessibility.** Browsers let users set a default font size (or zoom). `rem`/`em` sizes scale with it; `px` font-sizes do **not** respond to the font-size setting. Sizing type in `px` is a real WCAG problem — use `rem`.

**Mobile viewport units.** `100vh` on mobile includes the space *under* the browser's collapsing URL bar, so a `100vh` hero gets clipped. `dvh` (dynamic), `svh` (small), and `lvh` (large) were added to express "the viewport as it is right now," fixing the notorious `100vh` overflow.

## 💻 Code

```css
:root { font-size: 100%; }  /* = user's preference, usually 16px. Never px here. */

/* ✅ rem for type/spacing → respects user zoom, no compounding */
h1   { font-size: 2rem; }        /* 2 × root, stable everywhere */
.btn { padding: 0.75em 1.25em; } /* em: padding scales WITH the button's text */

/* em compounding — usually a bug */
ul ul { font-size: 0.9em; }      /* ❌ nested lists shrink cumulatively */
ul ul { font-size: 0.9rem; }     /* ✅ every level is the same size */
```

```css
/* % references differ by property */
.box   { width: 50%; }        /* 50% of containing block's WIDTH */
.ratio { padding-top: 56.25%; } /* also width! → the old 16:9 hack */
.child { height: 100%; }      /* needs parent to have a real height, else auto */

/* Character-based measure for readable line length */
article { max-width: 65ch; }  /* ~65 characters per line */
```

```css
/* Mobile-safe full-height hero */
.hero { min-height: 100dvh; } /* ✅ accounts for the collapsing URL bar */
/* .hero { min-height: 100vh; }  ❌ overflows under the mobile toolbar */
```

## ⚖️ Trade-offs

- **`rem` for almost everything type- and space-related.** It's predictable and accessible. The one cost: values are all relative to root, so a global font-size change moves everything (usually a feature).
- **`em` when local scaling is the intent** — icon sizing, button padding, spacing that should track the component's own text. Just remember it compounds through nesting.
- **`px` isn't evil** for borders, hairlines, shadows, and cases where a physical pixel is genuinely what you mean. Avoid it for font-size.
- **`vw` for type is dangerous alone** — it doesn't respond to zoom, failing WCAG. Pair it with a `rem` term inside `clamp()`.

## 💣 Gotchas interviewers probe

- **`px` font-size ignores the user's font-size preference.** The accessibility answer is `rem`. Candidates who default to `px` for type miss a real a11y requirement.
- **`em` compounds; `rem` doesn't.** The classic "why do my nested lists keep shrinking?" bug.
- **Percentage padding/margin resolves against *width*, always** — including `padding-top`/`margin-top`. This is the basis of the aspect-ratio padding hack.
- **`height: 100%` needs an ancestor chain with defined heights**, or it collapses to `auto`. `%` height and `%` width don't behave symmetrically.
- **`100vh` overflows on mobile** because of the URL bar. `dvh`/`svh`/`lvh` are the fix.
- **`vw` includes the scrollbar width** in some browsers, causing tiny horizontal overflow — a subtle layout bug.

## 🎯 Say this in the interview

> "I default to `rem` for typography and spacing because it's anchored to the root font-size, so it respects the user's browser font-size setting and their zoom — sizing type in `px` is actually a WCAG failure because it ignores that preference. I use `em` deliberately when I *want* something to scale with the local text, like padding inside a button, but I'm mindful that `em` compounds through nesting, which is the classic shrinking-nested-list bug. Percentages are the tricky one: they resolve against different references per property — width, margin, and even `padding-top` all resolve against the containing block's *width*, which is exactly why the old aspect-ratio hack uses `padding-top: 56.25%`. And on mobile I use `dvh` instead of `vh` for full-height sections, because `100vh` includes the area under the collapsing URL bar and overflows. For readable text columns I cap width in `ch` — around `65ch` — since that maps directly to characters per line."

## 🔗 Go deeper

- [web.dev — Sizing units](https://web.dev/learn/css/sizing) — the relative-units mental model.
- [MDN — CSS values and units](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Values_and_Units) — the full unit reference.
- [MDN — Viewport units](https://developer.mozilla.org/en-US/docs/Web/CSS/length#relative_length_units_based_on_viewport) — `vw/vh` and the dynamic `dvh/svh/lvh` set.
