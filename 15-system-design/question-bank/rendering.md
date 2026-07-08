<div align="center">

# Rendering

<sub>🏗️ Frontend System Design · **22 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">System Design</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

- 🟡 What is Client-Side Rendering and when should you avoid it for a content-heavy marketing site?
- 🔴 Design a CSR architecture for an internal analytics dashboard with 50k rows of data - what are the tradeoffs vs SSR?
- 🟡 Explain how Server-Side Rendering works end-to-end from request to hydrated DOM.
- 🔴 Your SSR page has a 3s TTFB under load. Walk through how you would diagnose and fix it.
- 🟡 When would you choose Static Site Generation over SSR for a 10,000-page e-commerce catalog?
- 🔴 Design a build pipeline for SSG that scales to 100k pages without exceeding build-time budgets.
- 🟡 Explain Incremental Static Regeneration and how stale-while-revalidate applies to it.
- 🔴 Design an ISR strategy for a news site where articles update every few minutes but traffic spikes unpredictably.
- 🟡 How does streaming SSR with React 18 differ from traditional SSR in terms of TTFB and FCP?
- 🔴 Design a streaming SSR architecture for a page with a slow third-party data dependency in the middle of the layout.
- 🟡 Explain the difference between Server Components and traditional SSR.
- 🔴 Design a component boundary strategy mixing Server and Client Components for a dashboard with interactive charts.
- 🟡 Explain what hydration is and why hydration mismatches occur.
- 🔴 Debug a production hydration mismatch caused by locale-dependent date formatting - how do you fix it?
- 🟡 What is Partial Hydration and how does it reduce JavaScript payload compared to full hydration?
- 🔴 Design a partial hydration strategy for a content page with one interactive comment widget.
- 🟡 Explain Progressive Hydration and how it differs from Partial Hydration.
- 🔴 Design a progressive hydration priority order for an e-commerce product page (header, cart, reviews, recommendations).
- 🟡 Explain Islands Architecture and how frameworks like Astro implement it.
- 🔴 Would you migrate a marketing site from a React SPA to Islands Architecture? Justify the tradeoffs.
- 🟡 Explain Edge Rendering and how it differs from traditional origin-server SSR.
- 🔴 Design an edge rendering strategy for a personalized homepage that varies by geolocation with sub-100ms TTFB.

---

_Part of the [🏗️ Frontend System Design question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
