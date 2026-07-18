<div align="center">

# Keyframe animations

<sub>🎨 CSS · 🟡 Medium · ⏱ 1h · `#animation`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `@keyframes` describe an animation **independent of state** — multi-step, loopable, self-starting — trading a transition's simplicity for full control of a timeline. It runs the moment it's applied; it doesn't wait for anything to change.

---

## 🧠 Mental model

A transition animates *between two states you already have*. A keyframe animation defines *its own states* along a timeline from `0%` to `100%` and plays them without a trigger. Think of `@keyframes` as a stored recipe and the `animation` shorthand as the instruction to run it — with knobs for speed, looping, direction, and what state to hold before and after.

That independence is the reason to choose it: a spinner, a pulsing badge, a staggered list reveal — none of these have a "from state" to react to. They're timelines, not transitions.

## ⚙️ How it actually works

Define the timeline, then attach it:

```css
@keyframes pulse {
  0%   { transform: scale(1);   opacity: 1; }
  50%  { transform: scale(1.1); opacity: .6; }
  100% { transform: scale(1);   opacity: 1; }
}
.badge { animation: pulse 1.2s ease-in-out infinite; }
```

The sub-properties, and the ones people underuse:

- **`animation-fill-mode`** — the deep one. By default the element **reverts to its base style** the instant the animation ends (or before it starts, during delay). `forwards` holds the last keyframe; `backwards` applies the first keyframe during the delay; `both` does both. This is why reveal animations "flash back" — a missing `forwards`.
- **`animation-direction`** — `normal`, `reverse`, `alternate` (ping-pong).
- **`animation-delay`** — and a **negative** delay starts the animation *already in progress*, which is the trick for de-synced, staggered loops.
- **`animation-iteration-count`** — a number or `infinite`.
- **`animation-play-state`** — `running` / `paused`, controllable from JS.

The timing function applies **per segment between keyframes**, not across the whole animation — so `ease` on a 3-keyframe animation eases into *and out of* the midpoint.

## 💻 Code

Staggered reveal with `forwards` (so it doesn't snap back) and negative-delay desync:

```css
@keyframes rise {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.item {
  opacity: 0;                              /* base state before it plays */
  animation: rise .4s ease-out forwards;   /* forwards = hold the end state */
}
.item:nth-child(2) { animation-delay: .08s; }
.item:nth-child(3) { animation-delay: .16s; }
```

Restarting an animation from JS — you must force a reflow, or use WAAPI:

```js
el.classList.remove('rise');
void el.offsetWidth;        // force reflow so the browser "sees" the removal
el.classList.add('rise');   // now it replays
// cleaner: el.animate(keyframes, options) via the Web Animations API
```

## ⚖️ Trade-offs

- **Keyframes buy control and lose reactivity.** They're perfect for self-running motion but awkward to make interruptible or input-driven — for that, transitions or WAAPI are better.
- **The performance rules are identical to transitions:** animate `transform`/`opacity` and it can stay on the compositor; animate `width`, `top`, or `box-shadow` and you pay layout/paint every frame.
- **Always gate decorative keyframes behind `prefers-reduced-motion`** — an infinite spin or pulse is exactly the kind of motion some users need turned off.

## 💣 Gotchas interviewers probe

- **Missing `animation-fill-mode: forwards`** — the element snaps back to its base style the moment the animation ends. The most common "why does it flicker back?" bug.
- **Negative `animation-delay` starts mid-animation** — not "starts late." It's the idiomatic way to offset looping animations so they don't move in lockstep.
- **Restarting requires a forced reflow** (`void el.offsetWidth`) between removing and re-adding the class; re-adding alone does nothing because the browser batches the two mutations.
- **`steps()` timing** jumps discretely — great for sprite sheets and typewriter effects, wrong for smooth motion.
- **Animating non-composited properties** (`width`, `top`, `margin`, `box-shadow`) causes jank; prefer `transform`.
- **The timing function is per-segment**, so a global `ease` re-eases at every keyframe — use `linear` between keyframes if you want a single continuous curve.

## 🎯 Say this in the interview

> "Keyframes define their own timeline from 0 to 100 percent and run without a trigger, which is what makes them right for spinners, pulses, and staggered reveals — things with no 'from state' to react to. The sub-property people miss is `animation-fill-mode`: by default the element reverts to its base style the instant the animation ends, so reveal animations flash back unless I set `forwards`. I also lean on negative `animation-delay` to desync looping animations — a negative delay starts them already in progress rather than late. Performance-wise the rules are the same as transitions: I stick to `transform` and `opacity` so it can run on the compositor. And anything decorative I gate behind `prefers-reduced-motion`, because an infinite animation is exactly what some users need switched off."

## 🔗 Go deeper

- [MDN — Using CSS animations](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_animations/Using_CSS_animations) — keyframes, fill-mode, and events.
- [MDN — `animation-fill-mode`](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-fill-mode) — the before/after state rules.
- [MDN — Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API) — the scriptable alternative with proper playback control.
