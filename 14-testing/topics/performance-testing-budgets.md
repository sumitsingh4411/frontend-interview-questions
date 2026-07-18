<div align="center">

# Performance testing / budgets

<sub>🧪 Testing · 🔴 Hard · ⏱ 45m · `#performance`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A performance budget is a **number you agree to fail CI over**. Without a threshold that breaks the build, "we care about performance" is a vibe. The hard part isn't measuring — it's picking metrics that correlate with users (Core Web Vitals, bytes over the wire) and holding the line against the thousand tiny regressions that each look harmless.

---

## 🧠 Mental model

Performance rots by **a hundred paper cuts**, not one catastrophe. Nobody ships a PR that adds two seconds to load; they add 8KB here, a render-blocking font there, one more third-party script. Each is individually defensible, and the aggregate is a 4-second LCP six months later. A budget is the mechanism that makes the *marginal* cost visible at the moment it's incurred — at the PR — instead of in a quarterly "why is the site slow" fire drill.

Three families of budget, and you want all three:

| Budget type | Example | Catches |
|---|---|---|
| **Quantity / resource** | JS ≤ 170KB gzipped, ≤ 50 requests | Bloat before it ships — measurable on every build |
| **Milestone / metric** | LCP ≤ 2.5s, TBT ≤ 200ms, CLS ≤ 0.1 | User-perceived experience under a modelled network |
| **Rule / score** | Lighthouse perf ≥ 90 | Broad regressions, best-practice drift |

The senior insight: **resource budgets are the ones you enforce hardest**, because bytes are deterministic and diffable, whereas lab metrics are noisy. Bytes shipped is a *leading* indicator; LCP is a *lagging* one. Gate the build on bytes; monitor the metrics.

## ⚙️ How it actually works

**Lab vs field — you need both, for different jobs.** *Lab* testing (Lighthouse CI, WebPageTest) runs synthetically under a fixed device/network profile — reproducible, so it belongs in CI to catch regressions. *Field* data (RUM / CrUX, `web-vitals` beaconed from real users) is the ground truth of what users actually experience, at the p75 the Core Web Vitals thresholds are defined against. Lab tells you *why*; field tells you *whether it matters*. Optimising a lab number that no real user hits is wasted effort.

**Why lab metrics are noisy.** LCP and TBT depend on CPU contention, GC, and network jitter on the CI runner. A single run can swing ±20%. The fix: run 3–5 times and take the **median**, and compare against a threshold, not the previous commit. This is why teams gate hard on byte size (deterministic) and treat metric budgets as alerts with margin.

**Where the numbers come from.** [The 170KB heuristic](https://web.dev/articles/performance-budgets-101) works backwards from a target: to hit interactive in ~5s on a median 4G phone, you have roughly a ~170KB compressed JS budget after accounting for parse/compile cost — because JS is *byte-for-byte the most expensive resource* (a byte of JS costs far more than a byte of image: it must be downloaded, parsed, compiled, and executed on the main thread).

**Enforcement points.** `bundlesize`/`size-limit` on the built assets (fails the PR on byte regression); `lighthouse-ci` with a `budget.json` asserting resource counts and Web Vitals; and a `web-vitals` snippet in production streaming to your analytics for the field half.

## 💻 Code

```js
// budget.json — Lighthouse CI reads this and fails the run on breach.
[{
  "resourceSizes": [
    { "resourceType": "script",     "budget": 170 },  // KB, the load-bearing one
    { "resourceType": "total",      "budget": 400 },
    { "resourceType": "font",       "budget": 100 }
  ],
  "resourceCounts": [
    { "resourceType": "third-party", "budget": 10 }    // creep-killer
  ],
  "timings": [
    { "metric": "largest-contentful-paint", "budget": 2500 },
    { "metric": "total-blocking-time",       "budget": 200 }
  ]
}]
```

```js
// size-limit config — deterministic byte gate in CI, per-entrypoint.
// .size-limit.js
module.exports = [
  { path: 'dist/main.*.js',   limit: '170 KB', gzip: true },
  { path: 'dist/vendor.*.js', limit: '120 KB', gzip: true },
];
```

```js
// The field half: real users, real devices, p75 truth.
import { onLCP, onCLS, onINP } from 'web-vitals';
const send = (m) =>
  navigator.sendBeacon('/rum', JSON.stringify({ name: m.name, value: m.value }));
onLCP(send);  // Largest Contentful Paint
onINP(send);  // Interaction to Next Paint — the responsiveness metric
onCLS(send);  // Cumulative Layout Shift
```

```bash
# Median-of-5 in CI, so a single noisy run doesn't fail the build.
lhci autorun --collect.numberOfRuns=5 --assert.budgetsFile=budget.json
```

## ⚖️ Trade-offs

- **Hard-gate bytes, soft-alert metrics.** Failing a PR on a +5KB regression is fair and actionable. Failing it on a 150ms LCP wobble that's within run-to-run noise trains everyone to hit "re-run" and ignore the gate. Give metric budgets margin, or make them warnings.
- **Budgets can incentivise the wrong thing.** A hard JS cap can push someone to lazy-load code that then costs a network round-trip on interaction — you moved the cost, you didn't remove it. The budget is a signal to *investigate*, not a law of physics.
- **Don't budget a metric you can't act on.** A single site-wide Lighthouse score tells you it regressed but not where. Prefer granular resource budgets per entry point that point at the culprit.
- **Lab-only is a trap.** Your CI runner is a beefy datacenter machine; your users are on a mid-tier Android on 4G. Without field RUM you're optimising a simulation.
- **When NOT to invest:** an internal admin tool for 20 employees on office wifi doesn't need a byte budget — the engineering cost outweighs the user benefit. Budgets earn their keep on high-traffic, mobile, or conversion-critical surfaces.

## 💣 Gotchas interviewers probe

- **Field vs lab confusion.** Core Web Vitals thresholds (LCP 2.5s, INP 200ms, CLS 0.1) are defined at the **p75 of real users**, not a lab median. Quoting a Lighthouse number as if it were the CWV pass/fail is a common mistake.
- **INP replaced FID (March 2024).** First Input Delay is retired; Interaction to Next Paint measures responsiveness across the whole session, not just the first tap. Say INP.
- **Compressed vs uncompressed bytes.** Budgets must specify gzip/brotli — the number users pay is the transferred size. A "170KB" budget on raw bytes is meaningless.
- **JS bytes ≠ image bytes.** Interviewers want you to know parse/compile/execute makes JS the most expensive byte. That's *why* the JS budget is tighter than the image budget despite images often being larger.
- **CLS and lazy content.** Skeleton loaders and ads inserted after paint wreck CLS if they don't reserve space. A budget catches the symptom; the fix is `aspect-ratio`/explicit dimensions.
- **Measuring the wrong percentile.** Averages hide the tail. Performance is a p75/p95 story — one slow cohort (old phones, slow regions) is exactly who a budget should protect.

## 🎯 Say this in the interview

> "A performance budget is only real if it fails the build. I run three layers. The one I gate hardest on is resource size — JS gzipped under something like 170KB per the web.dev heuristic — enforced with size-limit on the built bundle, because bytes are deterministic and diffable, and JS is the most expensive byte since it has to be parsed and executed on the main thread. Second, milestone budgets — LCP, INP, CLS — checked in Lighthouse CI, but with margin, because lab metrics are noisy, so I take a median of five runs and treat them as alerts rather than a strict gate. Third, and non-negotiable, real-user monitoring with the web-vitals library beaconing to analytics, because Core Web Vitals thresholds are defined at the p75 of actual users, not a lab machine. The budget's real job isn't any single number — it's making the marginal cost of each PR visible so performance dies by a hundred cuts *loudly* instead of silently."

## 🔗 Go deeper

- [web.dev — Performance budgets 101](https://web.dev/articles/performance-budgets-101) — where the 170KB figure and the three budget types come from.
- [web.dev — Core Web Vitals](https://web.dev/articles/vitals) — LCP/INP/CLS definitions and the p75 field thresholds.
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci) — wiring `budget.json` into a pipeline that fails on breach.
- [size-limit](https://github.com/ai/size-limit) — the deterministic byte gate, with per-entrypoint limits.
- [web-vitals library](https://github.com/GoogleChrome/web-vitals) — the field-data half, streaming real-user metrics.
