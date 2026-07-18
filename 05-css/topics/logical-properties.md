<div align="center">

# Logical properties

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#i18n` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Logical properties describe layout in terms of the **writing mode's flow** — *inline* (the direction text runs) and *block* (the direction lines stack), with *start*/*end* instead of left/right/top/bottom — so one stylesheet mirrors correctly for RTL and vertical scripts with zero overrides.

---

## 🧠 Mental model

Stop thinking in compass directions and start thinking in **reading directions**. Text has two axes: the **inline axis** (the direction a line of text advances) and the **block axis** (the direction successive lines stack). In English (LTR, horizontal), inline runs left→right and block runs top→bottom. In Arabic (RTL), the inline axis flips to right→left. In Japanese vertical writing, the inline axis becomes *vertical*.

`margin-inline-start` means "space before the text, in reading order." The browser resolves that to `margin-left` in LTR and `margin-right` in RTL — automatically, from one declaration. You stop writing `[dir='rtl'] { ... }` override blocks because you never encoded a physical direction in the first place.

## ⚙️ How it actually works

Every physical property has a flow-relative twin, driven by `writing-mode` and `direction`:

| Physical | Logical | Notes |
|---|---|---|
| `width` / `height` | `inline-size` / `block-size` | `width`/`height` do **not** flip |
| `margin-left` / `-right` | `margin-inline-start` / `-end` | flips with direction |
| `margin-top` / `-bottom` | `margin-block-start` / `-end` | flips with writing-mode |
| `top` / `left` (inset) | `inset-block-start` / `inset-inline-start` | for positioned boxes |
| `border-top-left-radius` | `border-start-start-radius` | order is **block-inline** |
| `text-align: left` | `text-align: start` | reading-order aware |

Shorthands take **start then end**: `margin-inline: 1rem 2rem` sets start `1rem`, end `2rem`. `padding-block: 8px` sets both block edges. This is the payoff — a card with `padding-inline`, `margin-block`, and `inset-inline-end` is correct in every locale you'll ever ship to.

## 💻 Code

```css
/* ❌ Physical: correct in English, wrong (and needs a whole override sheet) in Arabic */
.badge { margin-left: 8px; padding: 4px 12px; border-top-left-radius: 4px; }
[dir='rtl'] .badge { margin-left: 0; margin-right: 8px; /* ...and on and on */ }

/* ✅ Logical: one declaration, correct in every writing mode */
.badge {
  margin-inline-start: 8px;      /* leading edge, whatever "leading" means here */
  padding-block: 4px;
  padding-inline: 12px;
  border-start-start-radius: 4px; /* block-start + inline-start corner */
}
```

```css
/* An overlay pinned to the trailing edge — mirrors for RTL for free */
.toast { position: fixed; inset-block-end: 1rem; inset-inline-end: 1rem; }
```

## ⚖️ Trade-offs

- **Logical is the correct default for anything direction-sensitive** — margins, padding, insets, text alignment, border radii. If your product will ever be localised, physical properties are technical debt the moment you type them.
- **Not everything has flipped yet, and some things shouldn't.** `box-shadow` offsets, `transform` translations, and `background-position` are still physical — they describe *visual* geometry, not flow. Mixing is fine as long as it's deliberate.
- **The cost is unfamiliarity.** `inline-size` reads oddly at first, and a team half-using logical and half-physical is worse than either — pick logical and commit.

## 💣 Gotchas interviewers probe

- **`width`/`height` are physical and do not flip.** Use `inline-size`/`block-size` if you want dimensions that follow the writing mode (e.g. a sidebar in vertical text).
- **The corner-radius naming order is block-then-inline:** `border-start-start-radius` is the block-start, inline-start corner — not "start start of some single axis."
- **`text-align: start` / `end`** are the logical values people forget exist — far better than `left`/`right` for body copy.
- **`float: inline-start`** exists too; even floats went logical.
- **Logical properties respond to `writing-mode`, not just `direction`.** A `writing-mode: vertical-rl` container remaps the *block* axis to horizontal — `block-size` now controls horizontal extent. That's the whole point, and it surprises people.
- **`margin-inline: auto`** is the modern, direction-safe way to center a block — clearer than `margin: 0 auto`.

## 🎯 Say this in the interview

> "Logical properties describe layout in terms of the writing mode instead of the screen. There are two axes — inline, the direction text flows, and block, the direction lines stack — plus start and end instead of left/right/top/bottom. So `margin-inline-start` is `margin-left` in English and `margin-right` in Arabic, resolved by the browser from one declaration. The practical win is that I delete entire `[dir=rtl]` override stylesheets — internationalisation becomes correct by construction rather than a bolt-on. The thing I keep straight is that `width` and `height` are still physical; if I want a dimension to follow the writing mode I use `inline-size` and `block-size`. And a few things like `box-shadow` and `transform` are intentionally still physical because they describe visual geometry, not reading flow."

## 🔗 Go deeper

- [MDN — CSS logical properties and values](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) — the full mapping and the axis model.
- [MDN — Writing modes](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_writing_modes) — why inline/block are relative to `writing-mode`.
- [web.dev — Logical properties](https://web.dev/learn/css/logical-properties) — a practical walkthrough with RTL examples.
