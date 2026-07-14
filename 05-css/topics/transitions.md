<div align="center">

# Transitions

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#animation`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A transition interpolates a property between its **old and new computed values** whenever that value changes. It's the cheapest, most declarative way to animate — but it needs *two states and a trigger*, and it only works on properties the browser knows how to interpolate.

---

## 🧠 Mental model

A transition is a standing rule: "when *this* property's value changes, don't snap — glide over N milliseconds." It is **reactive**. Something has to change the value — a `:hover`, a toggled class, a JS style write — and there must be a *from* and a *to*. No change, no animation. That's the fundamental difference from `@keyframes`, which define their own timeline and run on their own.

So the question a transition answers is never "what should the motion look like moment to moment" — it's "how should this element get from state A to state B."

## ⚙️ How it actually works

`transition: <property> <duration> <timing-function> <delay>`. Only **interpolatable** values animate — lengths, colours, numbers, transforms. Historically `display` and `height: auto` could not animate at all; that's now solvable with `transition-behavior: allow-discrete`, `@starting-style`, and `interpolate-size`.

The timing function shapes the curve: `ease` (default), `linear`, `cubic-bezier(...)`, or `steps(n)` for sprite-style jumps. The browser handles **interruption** gracefully — reverse a transition mid-flight and it eases back from wherever it currently is, not from the endpoint.

Two modern features close old gaps:

- **`@starting-style`** defines the "before" state for an element that's *appearing* (e.g. from `display: none`), because otherwise there's no prior value to transition from.
- **`transition-behavior: allow-discrete`** lets discrete properties like `display` flip at the right moment so the element stays visible for the duration of an exit animation.

## 💻 Code

Hover feedback on the composited golden-path properties:

```css
.btn {
  transform: translateY(0);
  opacity: 1;
  transition: transform .15s ease, opacity .15s ease; /* list props, not `all` */
}
.btn:hover { transform: translateY(-2px); }
.btn:active { transform: translateY(0); opacity: .85; }
```

Fading in an element from `display: none` — the thing people say is "impossible":

```css
.popover {
  opacity: 0;
  transition: opacity .2s, display .2s allow-discrete; /* discrete display */
}
.popover.open { display: block; opacity: 1; }

@starting-style {              /* the "before" state for the appearing element */
  .popover.open { opacity: 0; }
}
```

## ⚖️ Trade-offs

- **Transitions are for state changes; keyframes are for timelines.** If you need midpoints, looping, or self-starting motion, a transition is the wrong tool — reach for `@keyframes`.
- **`transform` and `opacity` transitions can run on the compositor** and stay smooth under main-thread load; transitioning `width`, `top`, or `box-shadow` triggers layout/paint every frame and janks.
- **Interruption handling is a genuine strength** — transitions ease in and out of partial states for free, which is fiddly to reproduce with keyframes or JS.

## 💣 Gotchas interviewers probe

- **You can't transition to/from `auto`** (`height: auto`, `width: auto`). The classic. Options: the `max-height` hack (janky, guesses a ceiling), `grid-template-rows: 0fr → 1fr`, or the modern `interpolate-size: allow-keywords` with `calc-size()`.
- **Animating something that appears needs `@starting-style`** — without a prior value the browser has nothing to interpolate from, so it just snaps in.
- **`transition: all` is a footgun.** It animates properties you didn't intend (including ones that trigger layout), costs performance, and makes intent unclear. List the properties.
- **`transitionend` fires per property**, and it *won't* fire if the value didn't actually change or the element is hidden — a common source of hung promises.
- **Shorthand order matters for the two time values:** the *first* time is duration, the *second* is delay. `transition: opacity 0s 2s` means "no duration, 2s delay," which is almost never intended.

## 🎯 Say this in the interview

> "A transition is a reactive rule — when a property's value changes, interpolate instead of snapping. So it always needs two states and a trigger, which is what distinguishes it from keyframes that run on their own timeline. I keep transitions to `transform` and `opacity` where I can, because those can run on the compositor and stay smooth, whereas transitioning `width` or `top` forces layout every frame. Two things I flag: you can't transition to `height: auto` the traditional way — I'll use a `grid-template-rows` `0fr` to `1fr` trick or the newer `interpolate-size`; and to animate something appearing from `display: none` I combine `transition-behavior: allow-discrete` with `@starting-style` so there's a 'before' state to move from. And I never use `transition: all` — it animates things I didn't mean to."

## 🔗 Go deeper

- [MDN — Using CSS transitions](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_transitions/Using_CSS_transitions) — the property, events, and interruption behaviour.
- [MDN — `@starting-style`](https://developer.mozilla.org/en-US/docs/Web/CSS/@starting-style) — animating elements that appear.
- [web.dev — Animate to `height: auto`](https://web.dev/articles/css-calc-size) — `interpolate-size` and `calc-size()`.
