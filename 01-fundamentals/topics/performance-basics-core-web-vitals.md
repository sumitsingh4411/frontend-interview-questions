<div align="center">

# Performance basics (Core Web Vitals)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#performance`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Core Web Vitals are Google's three user-centric metrics — **LCP** (loading), **INP** (responsiveness), **CLS** (stability) — each measured at the **75th percentile of real users**, not on your fast laptop. They matter because they're a search ranking signal *and* a proxy for whether the page actually feels fast.

---

## 🧠 Mental model

Performance is not one number; it's three questions a user asks in sequence:

1. **Is it there yet?** → **LCP** (Largest Contentful Paint): when the biggest above-the-fold element — usually the hero image or headline — finishes painting. Good ≤ **2.5s**.
2. **Can I interact with it?** → **INP** (Interaction to Next Paint): the worst-case latency from a tap/click/keypress to the next frame that reflects it, across the whole visit. Good ≤ **200ms**.
3. **Does it stay put?** → **CLS** (Cumulative Layout Shift): how much visible content jumps around unexpectedly. Good ≤ **0.1**.

The senior framing: **CWV is measured on real users' devices (field data), not in your lab.** Lighthouse gives you a lab estimate to debug with; the score Google actually ranks on comes from the Chrome UX Report (CrUX) — median Android phones, flaky 4G, at the 75th percentile. That's why "it's fast on my machine" is not an argument.

## ⚙️ How it actually works

**LCP** is reported by the browser as it paints progressively larger elements; the last one before the user interacts wins. It's dominated by four sub-parts: TTFB, resource load delay, resource load time, and render delay. The usual culprit is a hero image that isn't discovered early (buried in CSS `background-image` or lazy-loaded above the fold) — the fix is a `<link rel="preload">` or `fetchpriority="high"`.

**INP** replaced FID in March 2024, and the distinction is the whole point: FID only measured the *input delay* of the *first* interaction; INP measures **input delay + processing time + presentation delay** for (almost) *every* interaction and reports the worst. This exposes long tasks that block the main thread mid-session — a heavy React re-render, an unmemoized context update, a synchronous `JSON.parse` in a click handler.

**CLS** sums *layout shift scores* (impact fraction × distance fraction) for shifts the user didn't cause. Images without dimensions, web fonts swapping (FOUT), and content injected above existing content are the classic sources.

You capture all three in the field with `PerformanceObserver` and ship them to analytics.

## 💻 Code

```js
// Measure the real vitals with the official library — same algorithm Google uses.
import { onLCP, onINP, onCLS } from 'web-vitals';

function report({ name, value, rating }) {
  // rating is 'good' | 'needs-improvement' | 'poor'
  navigator.sendBeacon('/rum', JSON.stringify({ name, value, rating }));
}
onLCP(report);
onINP(report);
onCLS(report);
```

```html
<!-- ❌ CLS bomb: no dimensions, so the image reserves 0px then shoves text down -->
<img src="/hero.jpg" alt="">

<!-- ✅ Reserve space up-front; the browser computes the box before the bytes arrive -->
<img src="/hero.jpg" alt="" width="1200" height="600" fetchpriority="high">
<!-- width/height give the browser an aspect ratio → zero shift, and fetchpriority
     makes the LCP image win the bandwidth race against scripts. -->
```

```css
/* ✅ Kill font-swap CLS: reserve metrics so the fallback matches the web font */
@font-face {
  font-family: "Inter";
  src: url(/inter.woff2) format("woff2");
  font-display: swap;            /* show text immediately… */
  size-adjust: 100.6%;          /* …but match fallback metrics so the swap doesn't reflow */
}
```

## ⚖️ Trade-offs

- **Lab vs field is a genuine tension, not a bug.** Lighthouse is reproducible and debuggable but simulates one device; CrUX is the truth but lags 28 days and needs traffic. Use lab to *find* regressions, field to *confirm* them. Optimising only the Lighthouse score is a classic trap — you can hit 100 in the lab and still fail CWV in the field.
- **Don't chase the score for the score's sake.** The metrics are proxies. A page can pass all three and still feel slow (e.g. slow API-driven interactions that don't register as INP because they show a spinner). Measure what your users actually do.
- **INP is the hardest to fix** because it's a *distribution* problem across a whole session — one janky interaction anywhere tanks it. It rewards architectural discipline (yielding, memoization, web workers), not a one-line fix.

## 💣 Gotchas interviewers probe

- **"FID vs INP"** — if a candidate still cites FID as current, that's a stale-knowledge signal. INP superseded it in 2024 and is strictly harder to pass because it covers *all* interactions, not just the first, and includes render time.
- **The 75th percentile.** CWV thresholds are pass/fail at p75, not the average. Averages hide your tail; a fat p95 from low-end phones is exactly what CWV is designed to surface.
- **CLS only counts *unexpected* shifts.** A shift within 500ms of a user interaction is excused. So a spinner-to-content swap the user triggered doesn't hurt CLS — but injecting an ad banner on load does.
- **LCP element can change.** As larger elements paint, the LCP target moves; a late-loading hero image can *become* the LCP and blow your budget even though text painted fast.
- **`content-visibility: auto` and lazy-loading above the fold** both *hurt* LCP — never lazy-load the hero.

## 🎯 Say this in the interview

> "Core Web Vitals are three field metrics at the 75th percentile: LCP for loading — when the biggest element paints, target under 2.5 seconds; INP for responsiveness — worst-case interaction latency, under 200 milliseconds; and CLS for visual stability, under 0.1. The key nuance is that Google ranks on *field* data from real Chrome users, not your Lighthouse lab score — so I treat Lighthouse as a debugging tool and RUM as the source of truth. In 2024 INP replaced FID, which matters because INP covers every interaction and includes render time, so it exposes main-thread jank that FID missed. My go-to fixes: preload and set `fetchpriority` on the LCP image, always set width/height to kill layout shift, and break up long tasks — yield to the main thread or move work to a worker — to protect INP."

## 🔗 Go deeper

- [web.dev — Web Vitals](https://web.dev/articles/vitals) — the canonical definitions, thresholds, and the lab-vs-field distinction.
- [web.dev — Optimize INP](https://web.dev/articles/optimize-inp) — the practical playbook for the hardest metric.
- [web.dev — Optimize LCP](https://web.dev/articles/optimize-lcp) — breaking LCP into its four sub-parts.
- [GitHub — google/web-vitals](https://github.com/GoogleChrome/web-vitals) — the exact measurement library Google uses, for your RUM.
