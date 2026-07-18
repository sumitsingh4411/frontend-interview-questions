<div align="center">

# FCP & FID (legacy)

<sub>🚀 Performance · 🟢 Easy · ⏱ 30m · `#metrics`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **FCP** (First Contentful Paint) times the first bit of DOM content painted — text, image, or SVG — and is a live, useful **loading** metric (good ≤ 1.8 s). **FID** (First Input Delay) measured only the *delay* before the first interaction's handler could run — and was **retired as a Core Web Vital in March 2024, replaced by INP** because it measured the wrong half of responsiveness.

---

## 🧠 Mental model

These are the two "first" metrics, and knowing why one survived and one didn't is the whole point.

```
 TTFB ──▶ FCP ─────────▶ LCP        FID: [ input delay ] ✗ handler run ✗ paint
 (bytes)  (first pixel)  (main)      INP: [ input delay + handler + paint ]  ✓
```

**FCP** answers "did *something* appear?" — the moment the blank screen ends. It's still a supporting Web Vital and a great early signal, because it isolates the render-blocking part of your critical path (CSS, blocking JS, fonts, TTFB).

**FID** answered "when the user first touched the page, how long before the browser could *start* handling it?" It measured only the **input delay** — the gap while the main thread was busy — and stopped its clock *before* your handler ran and *before* anything repainted. So it systematically flattered slow apps: a page could score a great FID and still take 400 ms of handler work to respond visibly. INP fixed that by measuring the full interaction latency for *every* interaction.

## ⚙️ How it actually works

**FCP** fires on the first paint that contains any text or image (not blank paints, not background colour). It's exposed via the `paint` entry type:

- Blocked by: render-blocking `<link rel="stylesheet">`, synchronous `<script>` in `<head>`, slow TTFB, and `font-display` choices that hide text.
- Fixed by: inlining critical CSS, deferring non-critical JS, cutting TTFB, `font-display: swap`.

**FID** was measured by the Event Timing API as `processingStart − startTime` of the first discrete input — purely the queueing delay. Its fatal flaws:

- **Only the first interaction** counted — the one *least* likely to be janky, since the page is often idle right after load.
- **Only input delay** — it excluded your handler's processing time and the presentation delay, which are where real jank lives.
- **75th-percentile FID was near-zero for most sites**, so it failed to discriminate good from bad. A metric everyone passes is useless for prioritisation.

INP is its successor: all interactions, full latency, near-worst-case reporting.

## 💻 Code

```js
// FCP — still worth tracking; it isolates render-blocking resources.
import { onFCP } from 'web-vitals';
onFCP(({ value }) => beacon('fcp', value)); // good ≤ 1800ms

// Raw paint timing:
const fcp = performance.getEntriesByName('first-contentful-paint')[0];
console.log(fcp?.startTime);
```

```js
// FID is legacy — web-vitals dropped onFID in v4. Use onINP instead.
// ❌ import { onFID } from 'web-vitals';   // removed
import { onINP } from 'web-vitals';         // ✅ the replacement
onINP(({ value }) => beacon('inp', value)); // good ≤ 200ms
```

```html
<!-- The classic FCP killer, and its fix -->
<!-- ❌ render-blocking: nothing paints until this whole file loads -->
<link rel="stylesheet" href="/styles/everything.css" />

<!-- ✅ inline the critical CSS, load the rest without blocking paint -->
<style>/* above-the-fold rules only */</style>
<link rel="stylesheet" href="/styles/rest.css" media="print" onload="this.media='all'" />
```

## ⚖️ Trade-offs

- **FCP is necessary but not sufficient.** A fast FCP that paints a header while the hero image is still blank looks fast but *isn't* — that's why LCP exists. Optimise FCP to kill the blank screen, then optimise LCP for the *meaningful* content.
- **Don't game FCP with a splash skeleton if it delays real content.** Painting a spinner improves FCP on paper while the useful page arrives no sooner. Perceived progress is good; metric-gaming is not.
- **FID's lesson is the real takeaway:** a responsiveness metric that only measures input delay is measuring the easy part. If someone still optimises "for FID" in 2024+, they're optimising a metric Google no longer grades.

## 💣 Gotchas interviewers probe

- **FID is deprecated; INP replaced it (March 2024).** Stating FID as a *current* Core Web Vital is a dated-knowledge signal. FCP is *not* deprecated — it's still a supporting metric.
- **FCP ≠ LCP.** FCP is the *first* content; LCP is the *largest* (main) content. A page with a text header (FCP) and a slow hero image (LCP) shows the gap clearly.
- **FID measured delay, not duration.** It stopped before the handler ran — the exact reason it under-reported real sluggishness. INP measures input delay *plus* processing *plus* presentation.
- **FID needed a real interaction to record** — pages nobody clicked reported no FID at all, leaving blind spots. INP has the same "needs interaction" property but samples many.
- **`first-paint` vs `first-contentful-paint`** are different entries — `first-paint` can fire on a background colour with no content. FCP requires actual content.

## 🎯 Say this in the interview

> "FCP and FID are the two legacy 'first' metrics. FCP — first contentful paint — is still useful: it's when the first text or image hits the screen, so it isolates render-blocking resources like CSS and blocking scripts, and I aim for under 1.8 seconds by inlining critical CSS and deferring JS. FID is the interesting story: it measured *first input delay*, but only the delay before the handler could start — not the handler's own work or the repaint. That meant it measured the easy part and most sites trivially passed it, so it didn't discriminate. Google replaced it with INP in March 2024, which measures the full latency of every interaction, not just the queueing delay of the first one. So if I'm asked about FID today, I'd flag that it's deprecated and pivot to INP."

## 🔗 Go deeper

- [web.dev — First Contentful Paint (FCP)](https://web.dev/articles/fcp) — definition, thresholds, and what blocks it.
- [web.dev — First Input Delay (FID)](https://web.dev/articles/fid) — the legacy metric and why it was retired.
- [web.dev — INP replaces FID](https://web.dev/blog/inp-cwv-launch) — the official announcement and rationale.
- [MDN — PerformancePaintTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformancePaintTiming) — reading `first-contentful-paint` directly.
