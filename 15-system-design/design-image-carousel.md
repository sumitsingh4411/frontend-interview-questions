# Design an Image Carousel at Scale

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#media` `#a11y` `#performance`

**Asked at:** _Airbnb, Amazon, Netflix, Pinterest_ · **Related:** [News Feed](design-news-feed.md) · [Carousel (machine coding)](../16-machine-coding/README.md)

---

## 1. The Question

> Design a performant, accessible image carousel/slider (product gallery, hero banner) that can show hundreds of images without loading them all.

## 2. Requirements

**Functional**
- [ ] Next/prev navigation, dot indicators, optional autoplay.
- [ ] Swipe on touch; arrow keys on keyboard.
- [ ] Optional infinite/looping.
- [ ] Lazy-load images; preload neighbors.

**Non-functional**
- [ ] No layout shift (CLS ~ 0).
- [ ] Smooth 60fps transitions.
- [ ] Accessible (roles, labels, keyboard, pause autoplay).
- [ ] Bounded memory with many slides.

## 3. High-Level Design

```
[track: translateX] ─ only render current ± N slides
   ▲ prev   ▼ next   ● ● ● dots
Lazy: load current + preload neighbors (IntersectionObserver / eager on adjacent)
```

- Render a **window** of slides (current ± 1–2), not all of them.
- Animate with **CSS transform** (`translateX`) — GPU-composited, no reflow.
- Reserve slide dimensions with `aspect-ratio` to prevent CLS.

## 4. Deep Dives & Trade-offs

**Transform vs `left`/scroll** → animate `transform: translateX()` (composited on the GPU, no layout/paint). Animating `left` triggers reflow every frame — janky.

**Lazy loading + preloading neighbors** → load the current image eagerly; preload the immediate next/prev so navigation feels instant; defer the rest. Use `loading="lazy"` and/or IntersectionObserver. Use `srcset`/`sizes` for responsive images.

**Preventing CLS** → always reserve space (`aspect-ratio` or width/height attrs) so images don't reflow content when they load.

**Windowing for "hundreds"** → keep only a few slides in the DOM. For a "filmstrip" of thumbnails, virtualize.

**Accessibility** → `role="group"`/`aria-roledescription="carousel"`, labelled slides ("3 of 12"), keyboard arrows, visible focus, and **pause autoplay on focus/hover** + respect `prefers-reduced-motion`. Autoplay must be pausable (WCAG).

**Touch** → handle swipe with pointer events; add momentum/threshold; don't hijack vertical page scroll.

**Infinite loop** → clone edge slides or use modular indexing; be careful to keep indicators and screen-reader counts correct.

## 5. What Interviewers Probe

- Why `transform` over `left`/`margin` for the animation?
- How do you avoid loading all images? (windowing + lazy + preload neighbors)
- How do you prevent layout shift?
- Full keyboard + screen-reader support; autoplay accessibility.
- Handling swipe without breaking page scroll.
- `prefers-reduced-motion`.

## 6. Curated Resources

- [web.dev: animations guide (compositor) ⭐](https://web.dev/articles/animations-guide) — why transform is cheap
- [ARIA APG: carousel ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/carousel/) — accessibility pattern
- [web.dev: optimize CLS](https://web.dev/articles/optimize-cls) — reserving space
- [MDN: responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images) — srcset/sizes

## 7. Related Topics

- [Design a News Feed (media lazy-load)](design-news-feed.md)
- [Performance: images](../09-performance/)
- [Accessibility: reduced motion](../11-accessibility/)
