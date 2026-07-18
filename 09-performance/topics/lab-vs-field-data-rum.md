<div align="center">

# Lab vs field data (RUM)

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#metrics` `#tooling`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Lab data** is a *controlled synthetic run* (Lighthouse on one machine, one throttled connection) — reproducible, great for debugging, but a single sample. **Field data / RUM** is *real users' real measurements* aggregated at the 75th percentile — it's what Google actually grades and the only source that captures the diversity of devices, networks, and interactions. When they disagree, **the field is right.**

---

## 🧠 Mental model

Two questions, two tools:

| | Lab (synthetic) | Field (RUM) |
|---|---|---|
| Question it answers | "*Why* is it slow?" | "*Is* it slow, for whom?" |
| Sample | One run, one device, one network | Millions of real sessions |
| Reproducible | Yes — same input, same output | No — it's a distribution |
| Captures interactions | No (INP needs real clicks) | Yes |
| Verdict for CWV | ❌ not used for ranking | ✅ this is the grade |
| Tools | Lighthouse, DevTools, WebPageTest | CrUX, `web-vitals` beacons, RUM SaaS |

The trap is treating a Lighthouse score as *the* number. Lighthouse runs on a **simulated mid-tier phone on throttled 4G** — a fixed fiction. Your real users are a *distribution*: flagship phones on fibre and five-year-old Androids on 3G, all at once. **Field data is a histogram; lab data is one dart throw.** You debug with the dart and you're graded on the histogram.

## ⚙️ How it actually works

**Field (RUM)** is collected two ways:

- **CrUX** (Chrome UX Report) — Chrome quietly reports Web Vitals from real, opted-in users to a public dataset, aggregated per-origin (and per-URL for popular pages) over a **trailing 28-day window** at the **75th percentile**. This is the exact data Google Search uses for the page-experience signal. You read it via PageSpeed Insights, the CrUX API, or BigQuery.
- **Your own RUM** — the `web-vitals` library measures each metric on real sessions and beacons them to your backend. This is finer-grained: you can slice by route, device, country, and A/B bucket — things CrUX can't give you.

**Lab** runs a synthetic navigation under fixed conditions and reports metrics for *that one run*. Lighthouse can't measure INP or CLS accurately because those depend on real interaction and full session scroll — hence lab shows **TBT (Total Blocking Time)** as an INP *proxy* and only the load-time slice of CLS.

Why the 75th percentile: it means "**75% of visits were at least this good**" — it deliberately ignores the fastest quarter and weights toward the slower tail, so you can't hide a bad long-tail behind a great median. Optimising the p75 forces you to fix slow devices, not just your MacBook.

## 💻 Code

```js
// Ship your own RUM with the web-vitals library. Runs on real users,
// reports the SAME metrics CrUX uses — but sliceable by your dimensions.
import { onLCP, onINP, onCLS, onTTFB, onFCP } from 'web-vitals';

function send(metric) {
  navigator.sendBeacon('/rum', JSON.stringify({
    name: metric.name,        // 'LCP' | 'INP' | 'CLS' | ...
    value: metric.value,
    rating: metric.rating,    // 'good' | 'needs-improvement' | 'poor'
    id: metric.id,            // dedupe across the session
    route: location.pathname, // YOUR dimension — CrUX can't do this
  }));
}

onLCP(send); onINP(send); onCLS(send); onTTFB(send); onFCP(send);
// sendBeacon survives page unload — critical, since INP/CLS finalise at the end.
```

```bash
# Pull field p75 from the CrUX API for any origin (no code on their site needed).
curl -s "https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=$KEY" \
  -H 'Content-Type: application/json' \
  -d '{"origin":"https://example.com"}'
# → p75 for LCP/INP/CLS from the trailing 28-day real-user window.
```

## ⚖️ Trade-offs

- **Lab is reproducible but unrepresentative; field is representative but noisy.** You need both: field tells you a problem *exists*, lab lets you reproduce and fix it deterministically. Optimising purely in the lab is how you ship a fast Lighthouse score and a slow site.
- **CrUX is free but coarse and lagging** — origin-level, 28-day trailing, no custom dimensions, and only for pages with enough Chrome traffic. Your own RUM is real-time and sliceable but costs engineering and only sees *your* browsers (no Safari-only data quirks aside).
- **Don't chase a Lighthouse 100.** The score is a weighted lab composite that can diverge from field CWV. A 92 with great field p75 beats a 100 with poor field data every time.

## 💣 Gotchas interviewers probe

- **Google ranks on field data, not Lighthouse.** Candidates who say "we hit Lighthouse 95 so we're fine" miss that Search uses CrUX p75. The lab score is a debugging aid, not the grade.
- **75th percentile, 28-day window.** Know both numbers. A fix takes up to ~28 days to fully reflect in CrUX because it's a trailing average — people panic when the number doesn't move overnight.
- **Lighthouse can't measure INP.** It reports TBT as a proxy because there are no real interactions in a synthetic run. Lab CLS also only covers load, not the whole session.
- **Field and lab *should* differ.** If they match exactly, be suspicious. The gap is information: e.g. great lab LCP but poor field LCP points to slow real-world networks/devices or geographic latency you're not simulating.
- **`sendBeacon` over `fetch` for RUM** — beacons are queued and survive unload, so end-of-session metrics (INP, CLS) actually get delivered.
- **CrUX needs traffic.** Low-traffic pages have no origin data; you fall back to your own RUM or synthetic.

## 🎯 Say this in the interview

> "Lab and field answer different questions. Lab data — Lighthouse, WebPageTest — is a single synthetic run on a fixed throttled device: reproducible, perfect for debugging and CI regression gates, but it's one sample of a fiction. Field data, or RUM, is real users' measurements aggregated at the 75th percentile over a trailing 28-day window — that's CrUX, and it's what Google Search actually grades. So my rule is: the field decides whether there's a problem and who it affects; the lab lets me reproduce and fix it deterministically. In practice I read CrUX for the verdict, ship the `web-vitals` library with `sendBeacon` for my own RUM so I can slice by route and device, and use Lighthouse in CI to catch regressions before they reach users. And I expect lab and field to diverge — Lighthouse can't even measure INP, it uses TBT as a proxy, because there are no real interactions in a synthetic run."

## 🔗 Go deeper

- [web.dev — User-centric performance metrics](https://web.dev/articles/user-centric-performance-metrics) — lab vs field framing and why the field wins.
- [web.dev — CrUX (Chrome UX Report)](https://developer.chrome.com/docs/crux) — the field dataset Google grades on.
- [GitHub — web-vitals library](https://github.com/GoogleChrome/web-vitals) — measuring the same metrics on real users.
- [web.dev — Lighthouse performance scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring) — what the lab score actually weights.
