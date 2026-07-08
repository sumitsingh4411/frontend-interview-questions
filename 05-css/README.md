<div align="center">

<img src="banner.svg" alt="05 · CSS" width="100%" />

</div>

Layout, the cascade, and making it fast. "Center a div" is a meme; "explain the stacking context" is the real interview.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

## Fundamentals & the cascade

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Box model & `box-sizing` | 🟢 | 30m | `#basics` `#layout` | [MDN: box model ⭐](https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model) |
| The cascade & specificity | 🟡 | 45m | `#cascade` | [web.dev: specificity ⭐](https://web.dev/learn/css/specificity) |
| Inheritance & `initial/inherit/unset` | 🟢 | 20m | `#cascade` | [web.dev: inheritance ⭐](https://web.dev/learn/css/inheritance) |
| Cascade layers (`@layer`) | 🟡 | 30m | `#cascade` `#modern` | [MDN: @layer ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) |
| Selectors & combinators | 🟢 | 45m | `#selectors` | [MDN: selectors ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) |
| Pseudo-classes & pseudo-elements | 🟢 | 45m | `#selectors` | [MDN ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) |
| `:has()`, `:is()`, `:where()` | 🟡 | 30m | `#selectors` `#modern` | [MDN: :has ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) |
| Units (rem/em/%/vw/ch) | 🟢 | 30m | `#basics` | [web.dev: sizing ⭐](https://web.dev/learn/css/sizing) |

## Layout

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Display & normal flow | 🟢 | 30m | `#layout` | [web.dev: layout ⭐](https://web.dev/learn/css/layout) |
| Flexbox | 🟢 | 1h | `#layout` `#flexbox` | [CSS-Tricks: flexbox ⭐](https://css-tricks.com/snippets/css/a-guide-to-flexbox/) |
| Grid | 🟡 | 1h | `#layout` `#grid` | [CSS-Tricks: grid ⭐](https://css-tricks.com/snippets/css/complete-guide-grid/) |
| Positioning (relative/absolute/sticky) | 🟡 | 45m | `#layout` | [MDN: position ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/position) |
| Stacking context & z-index | 🔴 | 1h | `#layout` `#stacking` | [Josh Comeau: stacking contexts ⭐](https://www.joshwcomeau.com/css/stacking-contexts/) |
| Overflow & scroll containers | 🟢 | 30m | `#layout` | [MDN: overflow ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) |
| Multi-column & aspect-ratio | 🟡 | 30m | `#layout` `#modern` | [MDN: aspect-ratio ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) |
| Centering (all the ways) | 🟢 | 20m | `#layout` | [Josh Comeau ⭐](https://www.joshwcomeau.com/css/center-a-div/) |

## Responsive & modern

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Media queries | 🟢 | 45m | `#responsive` | [web.dev: media queries ⭐](https://web.dev/learn/design/media-queries) |
| Container queries | 🔴 | 1h | `#responsive` `#modern` | [MDN: container queries ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_containment/Container_queries) |
| Fluid type & `clamp()` | 🟡 | 30m | `#responsive` | [web.dev: fluid type ⭐](https://web.dev/learn/design/typography) |
| Custom properties (variables) | 🟡 | 45m | `#variables` `#theming` | [MDN: custom properties ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) |
| Logical properties | 🟡 | 30m | `#i18n` `#modern` | [MDN: logical properties ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_logical_properties_and_values) |
| Dark mode & `color-scheme` | 🟡 | 45m | `#theming` | [web.dev: color scheme ⭐](https://web.dev/articles/color-scheme) |
| `prefers-*` (color-scheme, reduced-motion) | 🟡 | 30m | `#a11y` `#modern` | [web.dev ⭐](https://web.dev/articles/prefers-reduced-motion) |

## Animation & performance

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Transitions | 🟢 | 30m | `#animation` | [MDN: transitions ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) |
| Keyframe animations | 🟡 | 1h | `#animation` | [MDN: animations ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) |
| Transforms (2D/3D) | 🟡 | 45m | `#animation` | [MDN: transform ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) |
| GPU-accelerated animation & `will-change` | 🔴 | 45m | `#animation` `#performance` | [web.dev: animations guide ⭐](https://web.dev/articles/animations-guide) |
| Reflow vs repaint vs composite | 🔴 | 1h | `#performance` | [web.dev: rendering perf ⭐](https://web.dev/articles/rendering-performance) |
| `content-visibility` & containment | 🔴 | 45m | `#performance` `#modern` | [web.dev: content-visibility ⭐](https://web.dev/articles/content-visibility) |
| Scroll-driven animations | 🔴 | 45m | `#animation` `#modern` | [MDN ⭐](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) |

## Architecture

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| CSS architecture (BEM, ITCSS) | 🟡 | 45m | `#architecture` | [BEM ⭐](https://getbem.com/) |
| CSS-in-JS vs utility CSS (Tailwind) | 🟡 | 45m | `#architecture` | [patterns.dev: CSS-in-JS ⭐](https://www.patterns.dev/vanilla/css-in-js) |
| CSS Modules & scoping | 🟢 | 30m | `#architecture` | [CSS Modules ⭐](https://github.com/css-modules/css-modules) |
| Design tokens | 🟡 | 45m | `#design-systems` `#theming` | [W3C: design tokens ⭐](https://tr.designtokens.org/format/) |
| Accessibility in CSS (focus, contrast) | 🟡 | 45m | `#a11y` | [web.dev: a11y ⭐](https://web.dev/learn/accessibility) |

## ❓ Rapid-fire CSS interview questions

Real CSS interview questions. Answer out loud, then verify against the resources above.

1. Explain the **box model** and `box-sizing`.
2. How does **specificity** work? Calculate it for a given selector.
3. **Flexbox vs Grid** — when do you use each?
4. What is a **stacking context** and how does **z-index** really work?
5. **`position`**: relative vs absolute vs fixed vs sticky?
6. **Pseudo-classes vs pseudo-elements**?
7. **`em` vs `rem` vs `%` vs `vw/vh`** — when to use which?
8. What is the **cascade** and how is inheritance resolved?
9. **Container queries vs media queries**?
10. What is **`will-change`** and how does GPU compositing help animations?
11. **Reflow vs repaint vs composite** — which properties are cheap to animate?
12. How many ways can you **center a div**?
13. What are **CSS custom properties** (variables)?
14. What is **BEM** and why use a CSS methodology?
15. **`inline` vs `block` vs `inline-block`**?
16. Difference between **`visibility: hidden`, `display: none`, and `opacity: 0`**?
17. How does **`object-fit`** work?
18. What are **logical properties** and why do they matter for i18n?
19. How does **`aspect-ratio`** prevent layout shift (CLS)?
20. **Transitions vs animations** — when to use each?
21. How do you implement **dark mode**?
22. What triggers a new **stacking context**?
23. What is **`content-visibility`** and how does it boost performance?
24. What is the difference between a **CSS reset and normalize**?
25. How does the **`:has()`** selector work?

---

**Related:** [02-browser](../02-browser/) · [09-performance](../09-performance/) · [11-accessibility](../11-accessibility/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
