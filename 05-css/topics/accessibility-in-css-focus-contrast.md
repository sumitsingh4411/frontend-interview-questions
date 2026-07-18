<div align="center">

# Accessibility in CSS (focus, contrast)

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#a11y`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSS can *break* accessibility as easily as it enables it. The two highest-leverage rules: **never remove a focus indicator without replacing it** (use `:focus-visible`, not `:focus`), and **hit WCAG contrast ratios** (4.5:1 for body text). Most a11y CSS failures are a designer removing a browser default the user needed.

---

## 🧠 Mental model

Browsers ship a set of **accessibility affordances by default** — visible focus rings, real contrast on system controls, respect for the user's motion and color preferences. CSS's danger is that it lets you *override* all of them, usually in the name of aesthetics. So the accessible-CSS mindset is less "add ARIA" and more "**don't destroy what the platform already gave the user, and honor what the user asked for.**"

Two audiences drive most of it:

- **Keyboard & switch users** need to always *see where they are* → focus indicators.
- **Low-vision & color-blind users** need to *distinguish and read* → contrast and not-color-alone.

And two user *preferences* the OS exposes to CSS — `prefers-reduced-motion` and `prefers-contrast`/`forced-colors` — are non-negotiable signals, not suggestions.

## ⚙️ How it actually works

**Focus: `:focus` vs `:focus-visible`.** The classic mistake is `*:focus { outline: none }` to kill the "ugly" ring — which strips the *only* cue a keyboard user has. The fix is the browser's own heuristic. `:focus` matches whenever an element is focused, including mouse clicks. `:focus-visible` matches only when the browser judges a **visible indicator is warranted** — i.e. keyboard/programmatic focus, not a mouse click on a button. So you can satisfy both camps:

```css
:focus:not(:focus-visible) { outline: none; } /* hide ring for mouse users */
:focus-visible { outline: 2px solid; outline-offset: 2px; } /* keep it for keyboard */
```

Use **`outline`**, not `border` or `box-shadow`, for the ring: outline is outside the box model, so it doesn't cause reflow, and critically it **survives Windows High Contrast Mode / `forced-colors`** where `box-shadow` is stripped. `outline-offset` gives it breathing room without changing layout.

**Contrast** is a computed ratio between the relative luminance of foreground and background, from `1:1` to `21:1`. WCAG 2 thresholds: **4.5:1** for normal text (AA), **3:1** for large text (≥24px, or ≥18.66px bold) and for UI component/graphic boundaries. The catch is that a single foreground color has *different* contrast against every background it lands on — so contrast is a property of *pairs*, which is exactly why design tokens should encode `text-on-surface` pairs rather than standalone colors.

**Never rely on color alone** (WCAG 1.4.1): a red "error" border is invisible to many color-blind users. Pair color with an icon, text, underline, or shape.

The senior framing: **accessible CSS is mostly a subtraction problem** — you're preventing your styles from stripping defaults, and adding back the user-preference media queries the OS hands you.

## 💻 Code

```css
/* ❌ The single most common a11y regression on the web */
button:focus { outline: none; }

/* ✅ Preserve keyboard focus, quiet it for mouse users, and use outline
   so it survives forced-colors mode */
button:focus-visible {
  outline: 3px solid Highlight; /* system keyword adapts to user themes */
  outline-offset: 2px;
}
button:focus:not(:focus-visible) { outline: none; }
```

```css
/* Honor user preferences — these are requirements, not enhancements */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```css
/* Don't rely on color alone: color + non-color cue */
.input--error {
  border-color: #d92d20;          /* color */
  outline: 2px solid #d92d20;
}
.input--error::after { content: "⚠ Required"; } /* redundant textual cue */
```

```css
/* Accessible "visually hidden" — hidden visually, still read by screen readers.
   NOT display:none (which removes it from the a11y tree entirely). */
.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip: rect(0 0 0 0); clip-path: inset(50%); white-space: nowrap; border: 0;
}
```

## ⚖️ Trade-offs

- **`:focus-visible` is the right default**, but remember it's a *heuristic* the browser owns — you can't force it on/off per input device. If you need a ring on click too (e.g. a menu), style `:focus` deliberately.
- **Dark mode is a contrast trap:** pure `#fff` text on pure `#000` can be *too* high-contrast and cause halation for some readers; and lowering opacity on text to "soften" it silently drops you below 4.5:1. Check ratios per theme.
- **`!important` in the reduced-motion reset is justified** — it must beat component-level transitions — but it's a blunt instrument; a gentler approach sets motion via a custom property you can zero out.
- **When NOT to hide the focus ring at all:** honestly, most of the time. `:focus-visible` already hides it for mouse users, so the reflex to `outline: none` is usually solving a problem the browser already solved.
- **Contrast tools lie about gradients, images, and text over photos** — automated checkers test solid pairs; overlaid text needs a scrim or manual review.

## 💣 Gotchas interviewers probe

- **`outline: none` with no replacement is an instant fail signal.** The senior answer is `:focus-visible` + `outline` (not border/shadow), because outline is layout-neutral and forced-colors-safe.
- **`:focus-visible` vs `:focus`:** knowing that `:focus-visible` excludes mouse clicks — and *why* that lets you keep keyboard rings without annoying mouse users — is the exact detail interviewers listen for.
- **`box-shadow` focus rings vanish in Windows High Contrast Mode** (`forced-colors: active`), leaving keyboard users stranded. `outline` doesn't. Most candidates don't know this.
- **`display: none` and `visibility: hidden` remove content from the accessibility tree** — screen readers can't reach it. For visually-hidden-but-announced content use the `.sr-only` clip pattern, not `display:none`.
- **Contrast is a pair, not a color.** `#767676` on white passes 4.5:1; the same gray on light-gray fails. This is why standalone color tokens are an anti-pattern.
- **`prefers-reduced-motion` covers more than fun animations** — parallax, autoplaying carousels, and smooth-scroll can trigger vestibular disorders. It's a medical requirement for some users, not a nicety.
- **Zoom / `rem` units:** fixing font sizes in `px` and disabling zoom (`user-scalable=no`) breaks WCAG 1.4.4 (200% resize). Use relative units.

## 🎯 Say this in the interview

> "My mental model is that CSS mostly *breaks* accessibility by overriding good browser defaults, so accessible CSS is largely a subtraction discipline. The two things I never get wrong: focus and contrast. For focus, I never write bare `outline: none` — I use `:focus-visible` so the ring shows for keyboard and programmatic focus but not mouse clicks, and I style it with `outline` plus `outline-offset` rather than `box-shadow`, because outline is outside the box model so it doesn't reflow and, critically, it survives Windows High Contrast / `forced-colors` mode where box-shadow gets stripped. For contrast, I hit 4.5:1 for body text and 3:1 for large text and UI boundaries, and I treat contrast as a property of a *pair* of colors — which is why my tokens encode text-on-surface pairs. Beyond that I honor the OS signals: `prefers-reduced-motion` to cut animation for vestibular safety, and I keep visually-hidden content in the accessibility tree with a clip technique instead of `display:none`."

## 🔗 Go deeper

- [web.dev — Learn Accessibility](https://web.dev/learn/accessibility) — the structured course covering focus, contrast, and beyond.
- [MDN — `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — the heuristic and how it differs from `:focus`.
- [WCAG — Contrast (Minimum) 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) — the exact ratio thresholds and how they're computed.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — honoring the user's motion setting.
- [Smashing — Styling better focus indicators](https://www.smashingmagazine.com/2021/03/complete-guide-css-focus/) — practical patterns for focus rings that survive forced-colors.
