<div align="center">

# Fluid type & `clamp()`

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#responsive`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `clamp(MIN, PREFERRED, MAX)` lets type scale *smoothly* with the viewport between two bounds instead of jumping at breakpoints — but the middle term must mix a `rem` with a `vw` unit, otherwise you silently break the user's ability to zoom, which is an accessibility failure, not a style choice.

---

## 🧠 Mental model

Breakpoint-based type is a step function: `18px` up to 768px, then *snap* to `24px`. Between those sizes nothing adapts, and at the jump the whole page reflows. Fluid type replaces the staircase with a ramp — the font size is a linear function of viewport width, pinned so it never drops below a readable minimum or grows past a comfortable maximum.

`clamp(a, b, c)` is exactly `max(a, min(b, c))`: it prefers `b`, but clamps it into the range `[a, c]`. Make `b` depend on `vw` and you get a value that grows with the screen, held between hard floors and ceilings. The art is entirely in choosing `b`.

```
size
 c ┤            ┌────────  ← MAX, capped
   │          ╱
   │        ╱  ← PREFERRED (rem + vw), linear
 a ┤──────┘
   └──────┴────────── viewport width
        the fluid band
```

## ⚙️ How it actually works

The preferred term is a line: `size = intercept + slope × viewport`. You want it to hit your min size at a min viewport and your max size at a max viewport. Solve for slope and intercept:

- `slope = (maxSize − minSize) / (maxViewport − minViewport)`
- Express slope as `vw`: `slopeVw = slope × 100`
- `intercept = minSize − slope × minViewport` (in `rem`, so it survives zoom)

Result: `font-size: clamp(minRem, interceptRem + slopeVw·vw, maxRem)`.

**Why the `rem` term is non-negotiable** is the whole senior point. A value of pure `vw` ignores the user's font-size preference and, critically, ignores browser zoom in a way that can *fail WCAG 1.4.4 (Resize Text)* — if the text can't reach 200% because it's locked to viewport width, that's a conformance failure. Including a `rem` in the intercept means the line shifts up when the user zooms or raises their base font size, so the text still responds to *them*. `clamp()` with a bare `vw` middle term is a common, quietly broken pattern.

## 💻 Code

```css
:root {
  /* Fluid from 18px @ 320px viewport up to 24px @ 1200px viewport.
     slope = (24-18)/(1200-320) = 0.00682px/px = 0.682vw
     intercept = 18 - 0.00682*320 = 15.82px = 0.989rem  (÷16) */
  --step-0: clamp(1.125rem, 0.989rem + 0.682vw, 1.5rem);
}

body {
  font-size: var(--step-0);
  line-height: 1.5;          /* unitless: scales WITH the fluid font size */
  max-width: 65ch;           /* cap the measure so long lines stay readable */
}
```

```css
/* ❌ Pure vw: no floor, no ceiling, and it defeats browser zoom.
   At 2000px this is huge; at 320px it's tiny; zoom does almost nothing. */
h1 { font-size: 6vw; }

/* ✅ Bounded and zoom-safe: the rem term moves the whole ramp when the user zooms. */
h1 { font-size: clamp(2rem, 1.5rem + 3vw, 3.5rem); }
```

## ⚖️ Trade-offs

- **Fluid type reduces breakpoints but hides its math.** `clamp(1.125rem, 0.989rem + 0.682vw, 1.5rem)` is opaque next to `18px`. Generate it (a token, a Sass function, or a tool like Utopia) and comment the intent, or maintenance suffers.
- **Don't make everything fluid.** Body copy wants a *stable* size — readers build a reading rhythm, and constantly-shifting text is subtly disorienting. Fluid type shines on display headings and hero text; keep paragraph text closer to fixed.
- **`vw` is viewport, not container.** Inside a narrow column on a wide screen, `vw` still reads the whole viewport, so text can overflow its column. For component-level fluidity use container query units (`cqi`) instead.

## 💣 Gotchas interviewers probe

- **"Why not just `font-size: 5vw`?"** Because it breaks zoom and text resizing — an accessibility failure (WCAG 1.4.4). The `rem` term in the intercept is what keeps it zoom-responsive. This is the answer they're listening for.
- **Unitless `line-height`.** Set `line-height: 1.5`, not `1.5rem` or `24px`. A unitless value is a *multiplier* re-evaluated per element, so it tracks the fluid font size; a fixed value doesn't and produces cramped or loose leading as the type scales.
- **`clamp()` argument order is min, preferred, max** — and it's literally `max(min-arg, min(preferred, max-arg))`. If min > max, the max wins (min is applied last).
- **`ch` for measure, not `px`.** `max-width: 65ch` caps line length at ~65 characters regardless of font size — the readability metric that actually matters.
- **`rem` vs `em` in the intercept.** `rem` anchors to the root so nested elements don't compound; `em` compounds against the parent's font size and can runaway.

## 🎯 Say this in the interview

> "Fluid type swaps breakpoint jumps for a smooth ramp using `clamp(min, preferred, max)`, which is just `max(min, min(preferred, max))`. The preferred term is a line I solve for — slope is the size delta over the viewport delta, expressed in `vw`, plus an intercept. The detail that separates a senior answer is *why the intercept has to be in `rem`*: a pure `vw` value ignores browser zoom and user font settings and can fail WCAG's resize-text requirement, because the text can't reach 200%. Keeping a `rem` term shifts the whole ramp when the user zooms, so it stays accessible. I also keep `line-height` unitless so leading tracks the fluid size, and cap the measure with `ch`. And I'd reach for `cqi` instead of `vw` when I want a component to be fluid relative to its container rather than the screen."

## 🔗 Go deeper

- [web.dev — Typography (Learn Design)](https://web.dev/learn/design/typography) — fluid type in the context of readable, responsive design.
- [MDN — `clamp()`](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp) — exact semantics and the `max(min())` equivalence.
- [Utopia — Fluid type scale calculator](https://utopia.fyi/type/calculator/) — generates the clamp math from a min/max size and viewport pair.
- [WCAG — 1.4.4 Resize Text](https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html) — why zoom-safe type is a requirement, not a nicety.
