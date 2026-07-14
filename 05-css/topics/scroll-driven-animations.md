<div align="center">

# Scroll-driven animations

<sub>🎨 CSS · 🔴 Hard · ⏱ 45m · `#animation` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Scroll-driven animations bind a keyframe animation's **progress to scroll position instead of time**, and because the browser drives them on the **compositor thread**, they stay buttery even when the main thread is janking — *provided you only animate compositable properties like `transform` and `opacity`.*

---

## 🧠 Mental model

A normal CSS animation has a *time* timeline: 0% at 0s, 100% at `animation-duration`. Scroll-driven animation swaps that clock for a **scroll timeline** — progress is 0% when a scroller is at the top and 100% at the bottom (or 0%→100% as an element passes through the viewport). You're not writing scroll listeners; you're declaring "this animation's playhead *is* the scrollbar."

Why this matters for performance is the whole point. The old way — a `scroll` event handler that reads `scrollY` and writes `element.style.transform` — runs on the **main thread**, one tick per frame, and if the main thread is busy (React re-render, layout) the animation stutters. A scroll timeline is evaluated by the **compositor**, the same thread that handles scrolling itself, so the animation and the scroll are always in lockstep with zero main-thread involvement.

There are two timelines:

| Timeline | Driver | `@` value |
|---|---|---|
| **Scroll progress** | how far a scroll container is scrolled | `scroll()` |
| **View progress** | how far an element has moved *through* the viewport | `view()` |

## ⚙️ How it actually works

You attach a timeline to an animation with `animation-timeline`:

```css
/* Anonymous scroll timeline: progress = scroll of nearest ancestor scroller */
.progress-bar {
  animation: grow linear;
  animation-timeline: scroll(root block); /* root scroller, block axis */
}
@keyframes grow { to { transform: scaleX(1); } }
```

`view()` is the one people underuse — it ties progress to an element's own passage through the viewport, which is exactly what "reveal on scroll" wants:

```css
.reveal {
  animation: fade-up linear both;
  animation-timeline: view();
  animation-range: entry 0% cover 40%; /* start as it enters, finish 40% in */
}
@keyframes fade-up {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**`animation-range`** is the sharp tool: it maps *which slice* of the scroll defines 0%→100%. Named ranges (`entry`, `exit`, `cover`, `contain`) describe an element's relationship to the viewport, so you can say "animate only while entering."

The catch that ties back to the compositor: **the thread guarantee only holds for compositable properties.** Animate `transform`, `opacity`, or filters and the whole thing lives on the compositor. Animate `width`, `top`, `margin`, or `background-color` and each frame needs layout or paint — which happen on the **main thread** — so the browser silently pulls the animation back onto the main thread and you lose the smoothness that was the reason to use this feature. Scroll-driven animation doesn't *make* slow properties fast; it just exposes, brutally, which properties are cheap.

## 💻 Code

```css
/* ✅ Reading-progress bar — compositor-only, no JS, no scroll listener */
#reading-progress {
  position: fixed; top: 0; left: 0; height: 3px; width: 100%;
  transform-origin: left; transform: scaleX(0);
  animation: fill linear;
  animation-timeline: scroll(root);
}
@keyframes fill { to { transform: scaleX(1); } }
```

```css
/* ❌ Defeats the purpose: width triggers layout every frame → back on main thread */
#reading-progress { animation: fill linear; animation-timeline: scroll(root); }
@keyframes fill { from { width: 0; } to { width: 100%; } } /* use scaleX instead */
```

```css
/* Named timeline: let a child animate off a specific ancestor's scroll */
.gallery { scroll-timeline: --gallery inline; overflow-x: auto; }
.thumb   { animation: pop linear; animation-timeline: --gallery; }
```

Always gate on support and motion preference:

```css
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal { animation: fade-up linear both; animation-timeline: view(); }
  }
}
```

## ⚖️ Trade-offs

- **The feature is a progressive enhancement, not a baseline.** Support is Chromium-first and arriving elsewhere; without `@supports`, non-supporting browsers just show the animation's final state — which is why authoring so the *end* state is the usable one matters.
- **Great for decorative/parallax/reveal, wrong for anything essential.** If the content is unusable until it animates in, you've coupled comprehension to scroll and broken it for reduced-motion users. Keep the final state readable.
- **When NOT to use it:** anything needing real physics/springs, cross-axis logic, or scroll-jacking. That still belongs in JS (e.g. a library), because CSS timelines are a pure position→progress mapping.
- **`prefers-reduced-motion` is non-negotiable** — scroll-linked movement is a classic vestibular trigger.

## 💣 Gotchas interviewers probe

- **"Why is this faster than a `scroll` handler?"** Because it runs on the **compositor thread**, decoupled from main-thread work — the one-sentence answer they want.
- **Animating non-compositable properties silently kills the perf win.** `width`/`height`/`top`/`left`/`box-shadow`/`background` force layout or paint per frame and drag the animation onto the main thread. Stick to `transform` and `opacity`.
- **`scroll()` vs `view()`** — `scroll()` tracks a *scroller's* offset; `view()` tracks a *subject's* trip through the viewport. Using the wrong one is the most common mistake.
- **You still need `animation-range`** — without it, "reveal on scroll" spans the entire scroll length and barely moves.
- **No `scroll` events fire** and there's no easy JS hook for progress — good for perf, awkward if you needed a callback at 50%.
- **The scroller must actually scroll.** `scroll()` resolves to the nearest *scroll container*; if nothing overflows, progress is stuck at 0.

## 🎯 Say this in the interview

> "Scroll-driven animations replace the time clock of a keyframe animation with a scroll timeline — `scroll()` for a container's offset, `view()` for an element's trip through the viewport — and I pick the slice with `animation-range`. The reason I reach for them over a `scroll` event handler is threading: the browser evaluates the timeline on the compositor, the same thread that does scrolling, so it never stutters even if the main thread is busy re-rendering. But that guarantee is conditional — it only holds if I animate compositable properties like `transform` and `opacity`. The moment I animate `width` or `top`, every frame needs layout on the main thread and the browser yanks the animation back there, so I've lost exactly what I came for. I always wrap it in `@supports` and `prefers-reduced-motion`, and I author so the end state is the usable one, so non-supporting browsers still get readable content."

## 🔗 Go deeper

- [MDN — scroll-timeline](https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-timeline) — named timelines and axis selection.
- [MDN — CSS scroll-driven animations guide](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_scroll-driven_animations) — `scroll()`, `view()`, and `animation-range` end to end.
- [web.dev — Animate elements on scroll](https://developer.chrome.com/docs/css-ui/scroll-driven-animations) — worked examples and the compositor story.
- [MDN — animation-range](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-range) — the named ranges (`entry`, `cover`, `exit`) explained.
