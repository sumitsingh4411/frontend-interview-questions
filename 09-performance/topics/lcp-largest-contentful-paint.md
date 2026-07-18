<div align="center">

# LCP (Largest Contentful Paint)

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#metrics` `#lcp`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — LCP is the moment the **largest element in the viewport** finishes rendering — usually the hero image or the headline. Good is **≤ 2.5s at p75**. It's almost never "the image is heavy"; it's a chain of four sub-parts, and the fix is to find which one dominates *before* touching anything.

---

## 🧠 Mental model

LCP answers "when does the page *look* loaded?" The browser watches paints and keeps nominating the largest contentful element — a big `<img>`, a `<video>` poster, a background image, or a block of text — updating LCP each time something bigger paints, until the user first interacts.

The staff-level move is to stop thinking of LCP as a single number and break it into **four sub-parts** (this is exactly how the `web-vitals` attribution build reports it):

```
[ TTFB ] → [ Resource load delay ] → [ Resource load time ] → [ Element render delay ]
   ^ server         ^ time until the         ^ downloading         ^ time from bytes-in
   responds          LCP resource even         the LCP image         to actually painting
                     STARTS downloading                              (blocked by CSS/JS?)
```

You cannot fix LCP until you know which bar is longest. A slow TTFB and a late-discovered image need completely different fixes.

## ⚙️ How it actually works

The LCP resource is discovered late for a predictable reason: **the browser can't start downloading your hero image until it has parsed the CSS and built enough of the render tree to know the image is needed and visible.** If the image URL only appears after a CSS background rule, or is injected by JS, or lives behind a lazy-loading library, its *load delay* balloons — that's usually the biggest, most-overlooked bar.

Key mechanics:

- **The LCP element is chosen by rendered size**, capped to the viewport. Off-screen and clipped areas don't count, and opacity:0 elements are ignored.
- **Text LCP is gated by fonts.** A headline can't paint its final form until the web font loads (or `font-display` decides to swap), so a bad font strategy shows up as *render delay*, not load time.
- **`fetchpriority="high"`** on the hero image tells the browser to fetch it ahead of the default-low image priority — genuinely one of the highest-leverage one-liners.
- **Preload discovers it early**, but only helps if load *delay* is your bottleneck; if TTFB dominates, preloading the image does nothing.

## 💻 Code

The correct hero-image setup — every attribute here targets a different LCP sub-part:

```html
<!-- ✅ Discovered by the preload scanner immediately, fetched at high priority,
     never lazy-loaded, sized so it can't shift layout -->
<img
  src="/hero-800.webp"
  srcset="/hero-800.webp 800w, /hero-1600.webp 1600w"
  sizes="100vw"
  width="1600" height="900"      <!-- reserves space → also protects CLS -->
  fetchpriority="high"           <!-- beat the default-low image priority -->
  decoding="async"
  alt="…"
/>

<!-- ❌ The classic LCP killer: the hero is lazy-loaded, so the browser
     deliberately delays it → huge resource-load-delay -->
<img src="/hero.webp" loading="lazy" />   <!-- never do this above the fold -->
```

For a CSS *background* hero (invisible to the preload scanner), preload it explicitly:

```html
<link rel="preload" as="image" href="/hero-1600.webp"
      imagesrcset="/hero-800.webp 800w, /hero-1600.webp 1600w" imagesizes="100vw" />
```

Measure which sub-part to attack first:

```js
import { onLCP } from 'web-vitals/attribution';
onLCP(({ value, attribution }) => {
  console.log(value, attribution.element,        // the culprit element
    attribution.timeToFirstByte,                 // server bar
    attribution.resourceLoadDelay,               // discovery bar (usually the villain)
    attribution.resourceLoadDuration,            // download bar
    attribution.elementRenderDelay);             // blocked-by-render bar
});
```

## ⚖️ Trade-offs

- **`loading="lazy"` is a footgun above the fold.** It's a great default for below-fold images and an LCP disaster for the hero. Never lazy-load what's in the initial viewport.
- **Preloading everything defeats the purpose.** Preload is a priority *reordering*; preload three things and you've reordered nothing. Preload the single LCP resource, no more.
- **Inlining a hero as a data-URI removes the request but bloats the HTML**, delaying TTFB/parse for everything else. Rarely worth it above ~1–2KB.
- **Chasing LCP can hurt CLS**: swapping in a huge high-res hero late can shift content. Reserve space with `width/height` so the two metrics don't fight.

## 💣 Gotchas interviewers probe

- **"How would you fix a 4s LCP?"** Wrong answer: "compress the image." Right answer: "*measure the four sub-parts first* — if it's load *delay*, the image is discovered too late; if it's TTFB, no image change helps." Diagnosing before fixing is the senior signal.
- **The LCP element can change** as the page loads; the reported value is the last candidate before interaction. A late-injected banner can *become* your LCP element and wreck the score.
- **Client-side rendered heroes are late by construction** — the image URL doesn't exist in the initial HTML, so the preload scanner never sees it. SSR/streaming the hero markup is often the real fix.
- **`fetchpriority="high"` on the hero + `low` on below-fold images** frees up the bandwidth and connection budget — priority is relative.
- **Fonts block *text* LCP.** `font-display: swap` or `optional`, plus preloading the font, moves text LCP earlier.
- **A CDN/edge cache fixes TTFB, not discovery.** Know which lever each infra change actually pulls.

## 🎯 Say this in the interview

> "LCP is when the largest element in the viewport paints — usually the hero — and good is 2.5 seconds at the 75th percentile of real users. The mistake I see is people jumping straight to compressing the image. I break LCP into its four sub-parts: TTFB, resource load delay, load time, and render delay, using the web-vitals attribution build. Nine times out of ten the villain is *load delay* — the browser discovers the hero too late because it's lazy-loaded, injected by JS, or hidden behind a CSS background the preload scanner can't see. So the fixes are: make it a real `<img>` in the HTML, give it `fetchpriority='high'`, never `loading='lazy'` above the fold, and set width and height so I don't trade LCP for a layout shift. If instead TTFB dominates, no image work helps and I go look at the server or CDN."

## 🔗 Go deeper

- [web.dev — Largest Contentful Paint (LCP)](https://web.dev/articles/lcp) — the definition, thresholds, and element-selection rules.
- [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp) — the four-part breakdown and the fix for each part.
- [web.dev — `fetchpriority`](https://web.dev/articles/fetch-priority) — how priority hints reorder resource loading.
- [MDN — `loading` attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#loading) — why lazy above the fold hurts.
