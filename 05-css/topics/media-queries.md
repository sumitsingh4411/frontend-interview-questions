<div align="center">

# Media queries

<sub>🎨 CSS · 🟢 Easy · ⏱ 45m · `#responsive`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A media query is a boolean gate on a block of CSS, evaluated against the *viewport* and *device capabilities*; the senior moves are going mobile-first with `min-width`, sizing breakpoints in `em` so they respect user zoom, and querying *capabilities* (`hover`, `pointer`, `prefers-*`) rather than guessing at device widths.

---

## 🧠 Mental model

`@media` doesn't "target devices" — it asks the browser questions about the *current environment* and conditionally applies rules when the answer is true. The environment can be the viewport (`width`, `orientation`, `resolution`) or the user/hardware (`prefers-reduced-motion`, `hover`, `pointer`). Rules inside a matching query obey the normal cascade; they aren't more specific, they're just *conditional*. So a later matching query overrides an earlier one only by ordinary source-order/specificity rules — media queries add **no** specificity.

The mindset shift that separates junior from senior: **breakpoints belong to your content, not to the iPhone 15.** You add a breakpoint at the width where *your* layout starts to look wrong, then name it by intent, not by device.

## ⚙️ How it actually works

A query is `<media-type> and (<feature>)`. The type is almost always `screen` (or the implicit `all`); `print` is the other one you'll use. Features are ANDed with `and`, ORed with commas, negated with `not`.

**Range features** now take real comparisons — `@media (width >= 600px)` — which reads better and dodges the classic off-by-one where `max-width: 600px` and `min-width: 600px` *both* match at exactly 600px (the old advice was `599.98px`). The range syntax closes that gap cleanly with `>=` / `<`.

**Mobile-first means `min-width`:** you write the small-screen base styles unconditionally, then layer enhancements as the viewport grows. This is better than `max-width` because the base case works even if a query fails to load, and each query adds rather than overrides — less specificity churn.

**Units matter more than people think.** In a media query, `em` is resolved against the browser's **default** font size (typically 16px), *not* the root element's font-size. So `@media (min-width: 40em)` scales with the user's browser font-size setting and page zoom, giving users who bump their default font a proportionally earlier breakpoint. `px` breakpoints ignore that preference. This is a genuine accessibility win for `em` breakpoints.

**Capability queries** are the modern heart of this API:

- `(hover: hover)` / `(hover: none)` — does the primary input hover? Don't hide content behind hover on touch.
- `(pointer: fine)` / `(pointer: coarse)` — precise (mouse) vs imprecise (finger) → size tap targets.
- `(prefers-reduced-motion: reduce)`, `(prefers-color-scheme: dark)`, `(prefers-contrast: more)` — user OS preferences.

## 💻 Code

```css
/* Mobile-first: base styles are the small screen, then enhance up */
.grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }

@media (width >= 40em) {              /* ~640px, but scales with user font-size */
  .grid { grid-template-columns: repeat(2, 1fr); }
}
@media (width >= 64em) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

```css
/* Query capability, not device — a hover menu that degrades on touch */
@media (hover: hover) and (pointer: fine) {
  .menu:hover .submenu { display: block; }   /* only for real pointers */
}

/* Respect motion preference — the accessible default */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

/* Print: a different medium entirely */
@media print {
  nav, .ads { display: none; }
  a::after { content: " (" attr(href) ")"; }
}
```

## ⚖️ Trade-offs

- **Media queries are viewport-scoped, not component-scoped.** A card that must adapt to *its own slot* — a sidebar vs a full-width row on the same viewport — can't be expressed with `@media`. That's precisely the gap **container queries** fill; reach for them when a component's layout depends on its container, not the page.
- **Every breakpoint is a maintenance cost.** Fewer, content-driven breakpoints beat a wall of device widths. Fluid techniques (`clamp()`, `minmax()`, `auto-fit`) often remove the need for a breakpoint entirely.
- **`max-width` (desktop-first) inverts the cascade** — you override downward, fighting specificity as screens shrink. Fine for retrofits, worse as a default.

## 💣 Gotchas interviewers probe

- **Media queries carry zero specificity.** People think a rule "inside a media query wins" — it only wins by source order/specificity like any other rule. Two matching queries: the *later* one wins.
- **`em` breakpoints track user font-size and zoom; `px` don't.** In a media query `em` is relative to the browser default (16px), not `:root`. This is an underused a11y lever.
- **Without `<meta name="viewport" content="width=device-width, initial-scale=1">`, mobile browsers report a fake ~980px viewport** and your `min-width` queries silently misfire. The meta tag is a prerequisite, not optional.
- **`min-width`/`max-width` both match at the exact boundary.** Use the range syntax (`>=`, `<`) or the `.02px` fudge to avoid the double-match seam.
- **`prefers-reduced-motion` has no `reduce`-by-default fallback** — you must author the `reduce` block; the base styles are assumed motion-on.

## 🎯 Say this in the interview

> "A media query is just a conditional gate on CSS, evaluated against the viewport or device capabilities — it adds no specificity, so overrides still resolve by normal cascade rules. I go mobile-first with `min-width` so the base case is the small screen and each query *adds* rather than fights specificity downward. I size breakpoints in `em` rather than `px` because in a media query `em` tracks the browser's default font-size and zoom, so users who bump their font get an earlier, proportional breakpoint — a quiet accessibility win. And I lean on capability queries — `hover: hover`, `pointer: coarse`, `prefers-reduced-motion` — instead of guessing device widths, because that's what actually differs. The two things I never forget: the viewport meta tag, or mobile lies about its width, and that a card adapting to its own container needs container queries, not `@media`."

## 🔗 Go deeper

- [web.dev — Media queries](https://web.dev/learn/design/media-queries) — capability queries and responsive strategy from first principles.
- [MDN — Using media queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_media_queries/Using_media_queries) — full feature and syntax reference, including range syntax.
- [MDN — `prefers-reduced-motion`](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion) — the accessibility preference every animation should honour.
