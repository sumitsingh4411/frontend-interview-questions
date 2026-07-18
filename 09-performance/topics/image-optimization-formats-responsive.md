<div align="center">

# Image optimization (formats, responsive)

<sub>🚀 Performance · 🟡 Medium · ⏱ 1h · `#images`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Images are usually the **heaviest bytes on the page and the most common LCP element**, so this is the highest-leverage loading work. Win on four axes: right **format** (AVIF/WebP over JPEG/PNG), right **dimensions** (`srcset`/`sizes` so phones don't download desktop images), **explicit size** (kill CLS), and **priority** (preload/`fetchpriority` the LCP image, lazy-load the rest).

---

## 🧠 Mental model

Never ship a bigger image than the device will display. That one rule generates most of the technique:

```
Wrong: one 2400px, 800KB JPEG served to every device
        → phone downloads 800KB to paint it at 375px  (≈ 6× waste)

Right:  AVIF, multiple widths, browser picks the smallest that fits
        srcset 480w/960w/1440w + sizes → phone grabs the 480w at ~30KB
```

Two independent questions the browser must answer *before layout*: **which file** (format + resolution — solved by `srcset`/`sizes` and `<picture>`) and **how much space to reserve** (solved by `width`/`height`/`aspect-ratio`). Get the first wrong and you waste bytes; get the second wrong and you get CLS. They're separate problems and each has its own tool.

## ⚙️ How it actually works

**Format.** Modern codecs crush old ones at equal quality: **AVIF** is typically ~50% smaller than JPEG, **WebP** ~30% smaller, both with alpha and animation. The pattern is progressive enhancement via `<picture>` — offer AVIF, fall back to WebP, fall back to JPEG; the browser takes the first `<source>` it supports. Use **SVG** for logos/icons (vector, tiny, infinitely scalable) and reserve PNG for images that genuinely need lossless.

**Responsive resolution.** `srcset` lists candidate files at different widths; `sizes` tells the browser *how wide the image will render* at each breakpoint — so it can pick the smallest candidate that still looks sharp, **accounting for DPR** (a 2× phone wants 2× the CSS pixels). Without `sizes`, the browser assumes 100vw and over-downloads. This is *resolution switching* (same image, different sizes). `<picture>` with `media` is *art direction* (genuinely different crops per breakpoint — a tight portrait on mobile, a wide banner on desktop).

**LCP prioritisation.** Browsers discover `<img>` late (after HTML parse) and load images at *low* priority by default. If your hero is the LCP element, that's a problem: **preload it** and/or set `fetchpriority="high"` so it jumps the queue. Everything below the fold gets `loading="lazy"` — but **never the LCP image** (deferring your largest paint is the classic own-goal).

**Layout stability.** Always set `width` and `height` attributes (or CSS `aspect-ratio`). The browser computes the aspect ratio from them and reserves the box *before* the image loads, so nothing shifts. This is the single biggest CLS fix on image-heavy pages.

## 💻 Code

```html
<!-- ✅ Format fallback + responsive widths + reserved space, all at once. -->
<picture>
  <source
    type="image/avif"
    srcset="hero-480.avif 480w, hero-960.avif 960w, hero-1440.avif 1440w"
    sizes="(max-width: 600px) 100vw, 50vw" />
  <source
    type="image/webp"
    srcset="hero-480.webp 480w, hero-960.webp 960w, hero-1440.webp 1440w"
    sizes="(max-width: 600px) 100vw, 50vw" />
  <img
    src="hero-960.jpg"                 
    width="1440" height="810"          
    alt="Descriptive text"             
    fetchpriority="high"               
    decoding="async" />
</picture>
```

```html
<!-- ✅ Preload the LCP hero so it isn't discovered late & loaded at low priority. -->
<link rel="preload" as="image" href="hero-960.avif" type="image/avif"
      imagesrcset="hero-480.avif 480w, hero-960.avif 960w" imagesizes="50vw" />

<!-- ✅ Below-the-fold images: lazy, and STILL sized to avoid CLS. -->
<img src="thumb.avif" loading="lazy" width="400" height="300" alt="…" />
```

## ⚖️ Trade-offs

- **AVIF is smallest but not free.** It encodes *much* slower than JPEG/WebP (a build-time cost) and can be slower to *decode* on low-end devices — occasionally hurting the paint it was meant to speed up. Measure on real hardware; WebP is often the pragmatic default with AVIF as the top `<source>`.
- **`<picture>` art direction vs `srcset` resolution switching** solve different problems. Don't reach for `<picture>` when all you need is different sizes of the *same* image — plain `srcset`/`sizes` on `<img>` is simpler and sufficient.
- **Quality vs bytes is perceptual, not linear.** Dropping JPEG quality 90 → 75 often halves the file with no visible difference; below ~60 artefacts show. Tune per-image, and prefer an automated image CDN over hand-exported assets.
- **Don't over-engineer tiny images.** A 3 KB icon doesn't need three formats and five widths. Spend the effort on the hero and the gallery.

## 💣 Gotchas interviewers probe

- **The image is usually the LCP element** — so image optimisation *is* LCP optimisation. Candidates who treat images as a side concern miss where the metric actually lives.
- **Never lazy-load the LCP image.** `loading="lazy"` on the hero delays your largest paint. It's the most common regression in this whole area.
- **Missing `width`/`height` → CLS.** Even with lazy loading, always reserve space. Aspect-ratio boxes are non-negotiable.
- **`sizes` is what makes `srcset` work.** Without it the browser assumes `100vw` and downloads the largest candidate — people add `srcset` and wonder why mobile still over-fetches.
- **Images are discovered late and loaded at low priority** by default. `fetchpriority="high"` + preload for the LCP; the browser won't prioritise it for you.
- **`decoding="async"`** keeps image decode off the main thread so it doesn't block other rendering — cheap win on image-dense pages.
- **CDN/`Accept` negotiation** — a good image CDN serves AVIF/WebP based on the `Accept` header automatically, so you don't hand-maintain `<picture>` fallbacks. Know that this exists.

## 🎯 Say this in the interview

> "Images are usually the heaviest bytes and the most common LCP element, so this is the highest-leverage loading work. I optimise on four axes. Format: AVIF or WebP over JPEG/PNG via `<picture>` with fallbacks — AVIF is roughly half the size of JPEG. Dimensions: `srcset` with `sizes` so a phone downloads a 480-wide image, not the desktop 1440 — and `sizes` is the part people forget, without it the browser assumes 100vw and over-fetches. Stability: always set `width` and `height` or an aspect-ratio so the box is reserved before load, which kills CLS. And priority: the LCP hero gets preloaded with `fetchpriority=\"high\"` because images are discovered late and loaded at low priority by default, while everything below the fold gets `loading=\"lazy\"` — but never the LCP image itself, that's the classic own-goal. In production I'd lean on an image CDN doing `Accept`-based format negotiation rather than hand-maintaining all of this."

## 🔗 Go deeper

- [web.dev — Learn Images](https://web.dev/learn/images) — the full course: formats, responsive images, performance.
- [MDN — Responsive images](https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Responsive_images) — `srcset`, `sizes`, and `<picture>` explained precisely.
- [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp) — preloading and prioritising the LCP image.
- [MDN — fetchpriority](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#fetchpriority) — steering the browser's resource priority.
