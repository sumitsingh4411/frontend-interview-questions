<div align="center">

# Rendering strategies (CSR/SSR/SSG/ISR)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#rendering` `#seo`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The only real question is **where and when the HTML gets built**: in the browser at runtime (CSR), on the server per request (SSR), at build time (SSG), or at build time but refreshed lazily (ISR). Each choice trades **TTFB, freshness, and infra cost** against each other — there is no free option.

---

## 🧠 Mental model

Rendering strategy is a **two-axis decision**: *when* is the HTML produced, and *who* produces it.

| Strategy | HTML built | Freshness | First paint | Cost per request |
|---|---|---|---|---|
| **CSR** | In the browser | Live | Slow (blank → JS → data) | Cheap CDN static |
| **SSR** | Server, per request | Live | Fast HTML, then hydrate | CPU per request |
| **SSG** | At build time | Stale until rebuild | Fastest | ~0 (static file) |
| **ISR** | Build time + lazy re-gen | Eventually fresh | Fastest | Amortised |

The mistake is treating this as one app-wide switch. Modern frameworks let you pick **per route** — a marketing page is SSG, a dashboard is CSR, a product page is ISR. The senior move is matching the strategy to the *content's* freshness and SEO needs, not picking a religion.

## ⚙️ How it actually works

**CSR** ships a near-empty `<div id="root">` plus a JS bundle. The browser must download JS, execute it, fetch data, *then* paint. Nothing is visible until that chain completes, and crawlers/social scrapers that don't run JS see nothing meaningful.

**SSR** runs your components on the server per request, streams real HTML (fast FCP, good SEO), then ships the same JS to **hydrate** — attach event listeners and rebuild component state so the page becomes interactive. Hydration is the hidden tax: the user sees content but *can't click it* until JS runs. This is the "uncanny valley" of SSR.

**SSG** does the SSR work once at build time and writes static `.html` files served from a CDN. Unbeatable TTFB, but content is frozen until the next build — and a build over 100k pages can take hours.

**ISR** (Next.js's term; others call it on-demand/stale-while-revalidate) serves the stale static page instantly, then regenerates it in the background after a `revalidate` window, so the *next* visitor gets fresh HTML. It's SSG's speed with a freshness escape hatch.

The frontier is **partial hydration / RSC / islands** — send HTML for everything, but only ship JS for the interactive bits, killing the "hydrate the whole page" cost.

## 💻 Code

```jsx
// Next.js App Router — strategy is expressed per route, via data fetching.

// SSG: fetched once at build.
async function Page() {
  const data = await fetch('https://api/x', { cache: 'force-cache' });
  // ...
}

// ISR: static, but re-generated at most every 60s.
async function Page() {
  const data = await fetch('https://api/x', { next: { revalidate: 60 } });
}

// SSR: fresh HTML every request.
async function Page() {
  const data = await fetch('https://api/x', { cache: 'no-store' });
}
```

```jsx
// CSR: 'use client' + fetch in the browser. No SEO HTML, but zero server cost.
'use client';
function Dashboard() {
  const { data } = useSWR('/api/me', fetcher); // renders after JS + fetch
}
```

## ⚖️ Trade-offs

- **CSR** — great for auth-gated app shells (SEO irrelevant, infra cheap). Terrible for content you want indexed or fast first paint on slow devices.
- **SSR** — best when content is per-user and must be fresh *and* indexed. Costs server CPU on every hit and adds hydration latency; a slow API now blocks your HTML.
- **SSG** — the default for anything that can be pre-built (docs, blogs, marketing). Breaks down when you have millions of pages or per-user content.
- **ISR** — SSG for content that changes but not per-request. The gotcha: the *first* visitor after expiry still gets stale HTML.
- **When NOT to bother:** an internal tool behind a login has no SEO stakes — CSR is often the right, cheapest answer, and SSR is over-engineering.

## 💣 Gotchas interviewers probe

- **"SSR is faster" is wrong without qualification.** SSR improves *FCP/LCP*; it can *worsen TTFB* (the server now does work before the first byte). Streaming SSR is what recovers both.
- **Hydration mismatch** — if server HTML and client render differ (e.g. `Date.now()`, `localStorage`), React throws away the server DOM and re-renders, erasing the SSR benefit and often flashing content.
- **SSG ≠ no JavaScript.** A statically generated React page still ships and hydrates a bundle unless you use islands/RSC.
- **Google renders JS, but on a deferred queue.** CSR *can* be indexed, but rendering is delayed and unreliable for other crawlers (Bing, social cards). "Google runs JS so CSR is fine for SEO" is the trap.
- **TTI vs FCP:** SSR shows content fast but interactivity waits on hydration — measure **INP/TBT**, not just paint.

## 🎯 Say this in the interview

> "I don't pick one strategy for the whole app — I pick per route based on freshness and SEO. Static, rarely-changing content like marketing or docs is SSG or ISR so it's served straight from a CDN with the best possible TTFB. Content that's personalised and must be indexed is SSR, accepting the server cost and hydration latency. Pure app surfaces behind a login are CSR because SEO is irrelevant and it's the cheapest to run. The key trade-off I keep in mind is that SSR helps first paint but can hurt TTFB and adds a hydration gap where the page looks ready but isn't interactive — so I lean on streaming and, ideally, partial hydration or RSC to only ship JS for the interactive parts."

## 🔗 Go deeper

- [web.dev — Rendering on the web](https://web.dev/articles/rendering-on-the-web) — the canonical taxonomy this topic is built on.
- [Next.js — Rendering docs](https://nextjs.org/docs/app/building-your-application/rendering) — how per-route strategy is actually expressed.
- [patterns.dev — Rendering patterns](https://www.patterns.dev/react) — CSR/SSR/SSG/islands with diagrams.
- [React — Server Components](https://react.dev/reference/rsc/server-components) — where partial hydration is heading.
