<div align="center">

# TTFB

<sub>🚀 Performance · 🟡 Medium · ⏱ 30m · `#metrics`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — TTFB (Time to First Byte) is the time from the *start of navigation* to the arrival of the **first byte** of the response body. It's the sum of redirects + DNS + TCP + TLS + request + server think time, and it's the **floor under every other metric** — LCP can never be faster than your TTFB. Aim for **≤ 800 ms** at the 75th percentile.

---

## 🧠 Mental model

TTFB is everything that happens **before your app can render a single pixel**:

```
navigationStart
   │ redirects   │ DNS │ TCP │ TLS │ request →  server processing  → │ first byte
   ├─────────────┴─────┴─────┴─────┴──────────────────────────────────┤
   └────────────────────────  TTFB  ─────────────────────────────────┘
                                                    then: content download → FCP → LCP
```

Think of it as **network round-trips + backend work**. It is not a rendering metric — it's a delivery metric. But because it's a prefix of the whole waterfall, a bad TTFB pushes *everything* right. Shaving 400 ms off TTFB shaves 400 ms off FCP and LCP for free. That leverage is why it's the first thing to check when "the site feels slow" but the JS looks fine.

## ⚙️ How it actually works

`PerformanceNavigationTiming` breaks TTFB into measurable phases — the diagnosis is in the sub-timings, not the total:

| Phase | Measured as | Usual culprit when slow |
|---|---|---|
| Redirects | `redirectEnd − redirectStart` | `http→https`, `www→apex`, trailing-slash chains |
| DNS | `domainLookupEnd − domainLookupStart` | uncached DNS, no `dns-prefetch` |
| Connection | `connectEnd − connectStart` | TCP + TLS handshakes, no HTTP/2 reuse |
| **Server** | `responseStart − requestStart` | slow DB queries, no cache, cold serverless |

The two biggest wins in practice:

**Kill redirects.** Each redirect is a *full extra round-trip* — new DNS/TCP/TLS if it's cross-origin. An `http → https → www` chain can add 300–600 ms before the real request even starts. Redirects are pure waste on the critical path.

**Cache at the edge.** A CDN that serves a cached HTML response turns "server think time" from *your database round-trip* into *a memory read in a nearby PoP*. For dynamic pages, a shared cache with `stale-while-revalidate` serves instantly while refreshing in the background. This is the single highest-leverage TTFB fix for most sites — you're moving bytes physically closer to the user and skipping origin compute.

For SSR/serverless specifically, **cold starts** dominate: a scaled-to-zero function must boot a runtime before it runs your code. Keep functions warm, or stream the response so the first byte leaves *before* the whole page is built.

## 💻 Code

```js
// Measure real TTFB and its breakdown in the field (RUM).
const nav = performance.getEntriesByType('navigation')[0];

const ttfb = nav.responseStart;                    // from navigationStart
const dns  = nav.domainLookupEnd - nav.domainLookupStart;
const tcp  = nav.connectEnd      - nav.connectStart;
const wait = nav.responseStart   - nav.requestStart; // server think time

// Or via the web-vitals library, which normalises across browsers:
import { onTTFB } from 'web-vitals';
onTTFB(({ value }) => beacon('ttfb', value));
```

```http
Server-Timing: db;dur=210, render;dur=85, cache;desc="MISS"
```

`Server-Timing` is the pro move: your backend annotates *where* the server time went, and it shows up in DevTools and `PerformanceNavigationTiming.serverTiming` — so RUM can attribute slow TTFB to the DB vs the template render without guessing.

```html
<!-- Cut connection time for a known cross-origin API you'll hit immediately -->
<link rel="preconnect" href="https://api.example.com" crossorigin />
```

## ⚖️ Trade-offs

- **TTFB vs. streaming SSR.** You can lower TTFB by streaming the shell first (`renderToPipeableStream`) — the first byte leaves before data is ready. But an early first byte with a slow stream can *hurt* LCP if the meaningful content arrives late. TTFB going down is only good if it doesn't just push the delay downstream.
- **Aggressive edge caching vs. freshness.** Caching HTML at the CDN nukes TTFB but risks serving stale content. `stale-while-revalidate` is the usual compromise; personalised pages often can't cache the full document at all (use edge-side includes or client hydration instead).
- **Don't over-index on TTFB in the lab.** Lab TTFB reflects your fast connection and warm server. Field TTFB reflects real geography and cold starts — that's the number Google grades.

## 💣 Gotchas interviewers probe

- **TTFB is measured from `navigationStart`, not from `requestStart`.** It *includes* redirects, DNS, TCP, and TLS — not just server time. Candidates who equate TTFB with "backend response time" miss redirects and connection setup entirely.
- **A redirect is a hidden round-trip.** `example.com → www.example.com` can silently add hundreds of ms. Always check `redirectStart`/`redirectEnd`.
- **Service worker responses have a TTFB too** — served from Cache Storage, it can be near-zero, which is why offline-first apps post great TTFB.
- **HTTP/2 and HTTP/3 reduce connection cost** via multiplexing and (QUIC's) 0-RTT — a slow TTFB on many small assets is often a protocol/connection-reuse problem, not a server problem.
- **CDN "MISS" vs "HIT"** is the first thing to read. A cache MISS on every request means you're paying origin latency every time — check your `Cache-Control` and `Vary` headers.

## 🎯 Say this in the interview

> "TTFB is the time from navigation start to the first byte of the response body, and crucially it includes redirects, DNS, TCP, TLS, and the request round-trip — not just server processing. I treat it as the floor under LCP: nothing renders until the first byte lands, so a 1.5 s TTFB caps everything downstream. To diagnose I read `PerformanceNavigationTiming` sub-phases — if `responseStart − requestStart` is large it's backend or a cold start, if connection time is large it's TLS or lack of HTTP/2 reuse, and I always check for redirect chains, which are full extra round-trips. The two highest-leverage fixes are eliminating redirects and caching at the edge with stale-while-revalidate so I'm serving from a nearby PoP instead of hitting the origin database. I also add `Server-Timing` headers so RUM can tell me exactly where the server time went."

## 🔗 Go deeper

- [web.dev — Time to First Byte (TTFB)](https://web.dev/articles/ttfb) — definition, thresholds, and the diagnostic breakdown.
- [MDN — PerformanceNavigationTiming](https://developer.mozilla.org/en-US/docs/Web/API/PerformanceNavigationTiming) — every sub-timing you need for RUM.
- [MDN — Server-Timing](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Server-Timing) — attributing server-side latency from the client.
- [web.dev — Optimize TTFB](https://web.dev/articles/optimize-ttfb) — CDNs, caching, redirects, and streaming.
