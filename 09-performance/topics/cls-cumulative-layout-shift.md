<div align="center">

# CLS (Cumulative Layout Shift)

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#metrics` `#cls`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CLS scores **unexpected** movement of visible content — the "I went to tap and it jumped" feeling. It's the product of how much of the viewport moved × how far it moved, summed over the worst **5-second session window**. Good is **≤ 0.1**. Almost every fix is the same idea: **reserve the space before the content arrives.**

---

## 🧠 Mental model

CLS is the only Core Web Vital that isn't measured in time — it's a **unitless dimensionless score**, and that trips people up. The formula for each shift:

```
layout shift score = impact fraction × distance fraction
                     └ share of viewport   └ how far, as a
                       affected              share of viewport
```

An image that pushes half the viewport down by a quarter of its height scores `0.5 × 0.25 = 0.125` — already over budget from *one* shift. "Cumulative" is a misnomer post-2021: the browser groups shifts into **session windows** (grow while shifts occur, cap at 5s, close after a 1s gap) and your CLS is the **single worst window**, not the lifetime sum. This is what makes infinite-scroll and long-lived SPAs survivable.

The word doing all the work is **unexpected**. Movement within 500ms of a user interaction is excused — clicking "show more" and having content appear is *expected*. CLS only punishes shifts the user didn't cause.

## ⚙️ How it actually works

The browser fires a `layout-shift` PerformanceObserver entry whenever a visible element changes its start position between two frames *without* a recent user input to explain it. The usual culprits:

- **Images/videos/iframes with no dimensions.** They render at 0 height, then reflow everyone below when bytes arrive. Setting `width`/`height` (or `aspect-ratio`) lets the browser reserve the box up front — this alone fixes most CLS.
- **Web fonts (FOUT).** The fallback font has different metrics; when the web font swaps in, every line re-lays-out. `size-adjust`/`font-display` and the `f-mods` (`ascent-override` etc.) tame this.
- **Injected content above existing content** — banners, cookie bars, ads, "you have a new message" toasts that push the page down.
- **Actions that measure then mutate** — reading `offsetHeight` then inserting a node, causing a synchronous reflow the user sees.

Crucially, `transform` and `opacity` animations **do not cause layout shifts** — they run on the compositor and never move layout boxes. Animating `top`/`height`/`margin` does.

## 💻 Code

Reserve space so nothing reflows — the universal CLS fix:

```html
<!-- ❌ Image with no dimensions: renders at height 0, then shoves the page down -->
<img src="/promo.webp" alt="…" />

<!-- ✅ Browser reserves a 16:9 box before a single byte loads -->
<img src="/promo.webp" alt="…" width="1600" height="900" />   <!-- attrs give the ratio -->
```

```css
/* Modern equivalent for responsive media and ad/embed slots */
.embed { aspect-ratio: 16 / 9; width: 100%; }

/* A dynamically-loaded ad/banner slot: reserve BEFORE it fills */
.ad-slot { min-height: 250px; }   /* even empty, it holds its ground */

/* Fonts: match fallback metrics so the swap doesn't reflow text */
@font-face {
  font-family: "Inter";
  src: url(/inter.woff2) format("woff2");
  font-display: optional;          /* no swap-in reflow if it's slow */
  size-adjust: 107%;               /* line up with the fallback's metrics */
}
```

Animate the compositor-only properties — these are free of layout shift:

```css
/* ❌ animating layout properties → shifts + jank */
.panel { transition: height .2s, top .2s; }
/* ✅ transform/opacity never touch layout */
.panel { transition: transform .2s, opacity .2s; }
```

## ⚖️ Trade-offs

- **Reserving space costs whitespace on slow loads.** A `min-height` ad slot that stays empty leaves a gap — usually the right trade (a stable page beats a dense one that jumps), but it's a real cost to weigh.
- **`font-display: optional` can mean your brand font never shows** on a slow first visit (zero CLS, but a fallback face). `swap` shows the font but risks a shift. This is a genuine design-vs-metric decision, not a free win.
- **Skeleton screens fix perceived CLS only if the skeleton matches the final layout's box sizes.** A skeleton that's a different height than the real content just shifts twice.
- **Over-reserving hurts LCP/UX** — huge placeholder gaps push your real content below the fold.

## 💣 Gotchas interviewers probe

- **"Is CLS cumulative over the whole page life?"** No — it's the **worst 5-second session window**. This is the single most common misconception, and it's *why* long pages aren't automatically doomed.
- **The 500ms input exception.** Shifts within 500ms of a user interaction don't count — so opening an accordion is free, but a banner appearing on its own is not.
- **`transform` doesn't cause CLS.** Candidates often "fix" a shift by animating `margin`; the right answer is to animate `transform`, which never moves the layout box.
- **BFCache and back/forward** used to produce phantom shifts; modern `web-vitals` resets the score on `pageshow`. Know that field CLS is per-page-view.
- **Late-loading fonts are a stealth CLS source** — people blame images and miss the FOUT reflow entirely.
- **`content-visibility: auto`** can cause shifts if the estimated `contain-intrinsic-size` is wrong — reserve the right size or it'll pop.

## 🎯 Say this in the interview

> "CLS scores *unexpected* movement of visible content — the impact fraction times the distance fraction, summed over the worst 5-second session window, with a 0.1 target. The key nuance is 'worst window,' not lifetime cumulative, and that shifts within 500ms of a user action are excused, so it only punishes movement the user didn't cause. Practically, almost every fix is 'reserve the space before the content arrives': width and height or `aspect-ratio` on all media, `min-height` on ad and embed slots, and careful font loading so the FOUT swap doesn't reflow text. And the classic senior tell — if I need to animate something, I use `transform` and `opacity`, which run on the compositor and never move layout boxes, instead of animating `top` or `height`, which do. If I have to insert content dynamically, I put it below the fold or in pre-reserved space, never above what the user is already reading."

## 🔗 Go deeper

- [web.dev — Cumulative Layout Shift (CLS)](https://web.dev/articles/cls) — the score formula and session-window definition.
- [web.dev — Optimize CLS](https://web.dev/articles/optimize-cls) — the concrete fixes, ranked by impact.
- [web.dev — Evolving CLS (session windows)](https://web.dev/articles/evolving-cls) — why "cumulative" became windowed in 2021.
- [MDN — `aspect-ratio`](https://developer.mozilla.org/en-US/docs/Web/CSS/aspect-ratio) — reserving media boxes without magic-number padding hacks.
