<div align="center">

# Core Web Vitals overview

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#metrics`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Core Web Vitals are three field-measured, user-centric metrics — **LCP** (loading), **INP** (interactivity), **CLS** (visual stability) — each with a "good" threshold judged at the **75th percentile** of real users. They're the ones Google made load-bearing for ranking, which is why they, and not your lab Lighthouse score, are the number that matters.

---

## 🧠 Mental model

Old performance metrics measured the *machine* ("the load event fired at 3.2s"). Core Web Vitals measure the *human experience* of the three questions every user subconsciously asks:

| Question | Metric | Measures | Good (p75) | Poor |
|---|---|---|---|---|
| "Is it there yet?" | **LCP** | Time to render the biggest visible element | ≤ 2.5s | > 4.0s |
| "Does it respond?" | **INP** | Worst-ish input→paint latency across the visit | ≤ 200ms | > 500ms |
| "Does it stay put?" | **CLS** | Unexpected layout movement (unitless score) | ≤ 0.1 | > 0.25 |

The single most important framing: **CWV is a *field* (RUM) metric, not a lab metric.** Your target is the **75th percentile of real page loads**, segmented by mobile and desktop. That means one slow phone on a train doesn't fail you, but a quarter of your users being unhappy does. A green Lighthouse run proves nothing about your CWV — Lighthouse is a single synthetic run in a datacenter.

## ⚙️ How it actually works

Each vital is gathered by browser APIs and reported to Google via the **Chrome User Experience Report (CrUX)** — anonymized field data from opted-in Chrome users, aggregated over a **rolling 28-day window**. That lag is why a fix you shipped today won't move Search Console for weeks.

- **LCP** comes from the `largest-contentful-paint` PerformanceObserver entry. The browser keeps re-reporting the largest element as the page paints; the *last* one before the user interacts is your LCP.
- **INP** observes `event` timing entries across the *whole page lifecycle* and reports (roughly) the worst interaction, with a high-percentile discount on very active pages. It replaced **FID** in March 2024 — FID only measured input *delay* of the first interaction; INP measures full input→next-paint latency for every interaction. That change failed a lot of pages that looked fine on FID.
- **CLS** sums *layout shift* entries, but only into **session windows** (max 5s, gaps of 1s) and takes the **largest window**, not the lifetime total — so an infinite-scroll page isn't doomed to an ever-growing score.

`web-vitals` (the official JS library) wraps all this correctly, including the percentile and windowing quirks, so you almost never compute these yourself.

## 💻 Code

Measure your *own* field data — this is the number that matters, not Lighthouse:

```js
import { onLCP, onINP, onCLS } from 'web-vitals';

function report({ name, value, rating, id }) {
  // rating is 'good' | 'needs-improvement' | 'poor' — same thresholds Google uses
  navigator.sendBeacon('/rum', JSON.stringify({ name, value, rating, id }));
}

// attribution build tells you WHICH element/interaction was to blame
onLCP(report);   // e.g. { name:'LCP', value: 3120, rating:'needs-improvement' }
onINP(report);   // fires on visibilitychange/pagehide, not on load
onCLS(report);
```

Report to an analytics endpoint, then **look at the p75, split by device**, not the average — averages hide the tail that CWV grades you on.

## ⚖️ Trade-offs

- **CWV optimises for perceived UX, not throughput.** They deliberately ignore things users don't feel (total bytes, number of requests) and reward things they do. Don't over-fit: a page can have great vitals and still be a slow, janky experience on a metric CWV doesn't cover (e.g. slow client-side route transitions, which INP only partially catches).
- **The 75th percentile is a business decision baked into a metric.** It means fixing the *median* user does nothing for your score — you must fix the slow quarter (low-end Android, poor networks). That's often a different, harder set of problems.
- **Don't chase the lab number.** Optimising Lighthouse's simulated LCP can actively mislead you; the datacenter has no throttled CPU or real cache state. Lab is for *debugging*, field is for *grading*.

## 💣 Gotchas interviewers probe

- **"Is FID still a Core Web Vital?"** No — **INP replaced FID in March 2024.** Saying FID confidently dates you. FID is now a legacy/deprecated diagnostic.
- **Lab vs field.** The classic senior signal: CWV pass/fail is *field* (CrUX/RUM) at p75. Lighthouse gives you a *lab* proxy for debugging. Conflating them is the most common mistake.
- **The 28-day rolling window** means fixes appear slowly and regressions linger — set expectations with stakeholders accordingly.
- **CLS is windowed, not cumulative-for-life.** "Cumulative" is a misleading name post-2021; it's the largest 5-second session window.
- **CWV is bucketed by URL group**, and low-traffic pages may lack CrUX data entirely — then you're flying on your own RUM only.
- **INP fires at page unload**, so a `beforeunload`/`unload` that blocks can eat your own beacon; use `visibilitychange` + `sendBeacon`.

## 🎯 Say this in the interview

> "Core Web Vitals are three user-centric metrics — LCP for loading, INP for interactivity, CLS for visual stability — and the thing people miss is that they're graded on *field* data at the 75th percentile, not on a Lighthouse run. So my first move is always to instrument real users with the `web-vitals` library and look at p75 split by device, because that's literally the number Google ranks on. Lighthouse is for debugging a specific regression, not for grading. I'd also flag that INP replaced FID in 2024 — FID only measured the delay before the first interaction, INP measures the full input-to-paint latency across every interaction, and it's a genuinely harder bar. And because CrUX is a 28-day rolling window, I tell stakeholders that a fix won't show up for weeks."

## 🔗 Go deeper

- [web.dev — Web Vitals](https://web.dev/articles/vitals) — the canonical definitions and thresholds.
- [web.dev — Defining the Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds) — *why* the numbers and the p75 were chosen.
- [github.com/GoogleChrome/web-vitals](https://github.com/GoogleChrome/web-vitals) — the official measurement library, including the attribution build.
- [web.dev — INP replaces FID](https://web.dev/blog/inp-cwv-launch) — the 2024 change and its rationale.
