<div align="center">

# Caching layers (request/data/full route)

<sub>▲ Next.js · 🔴 Hard · ⏱ 1.5h · `#caching` `#performance`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Next.js has **four caches** that stack: **Request Memoization** (dedupe within one render), the **Data Cache** (persistent fetch results across requests), the **Full Route Cache** (pre-rendered HTML/RSC on the server), and the **Router Cache** (RSC payloads in the browser). Knowing *which layer* is serving stale data is the entire debugging skill.

---

## 🧠 Mental model

Think of a request passing through four caches, from most transient to most persistent, then back out to a fourth on the client:

| Layer | Where | Lifetime | Dedupes / caches |
|---|---|---|---|
| **Request Memoization** | server (React) | **one render pass** | identical `fetch`es in a single request |
| **Data Cache** | server (Next) | **across requests & deploys** | `fetch` result values |
| **Full Route Cache** | server (Next) | until revalidated / redeploy | rendered HTML + RSC payload |
| **Router Cache** | **client** (memory) | session (with `staleTimes`) | RSC payloads of visited routes |

The mental model: **memoization** stops you fetching the same thing twice *while rendering*; the **Data Cache** stops you refetching across *different* requests; the **Full Route Cache** stops you *re-rendering* a static route at all; the **Router Cache** stops you hitting the network on *client navigation*. When something's stale, the diagnostic question is always "which of these four is holding it?"

## ⚙️ How it actually works

**Request Memoization** lives in React, not Next. During one render, calling the same `fetch(url, opts)` returns the first call's promise — so a helper used in a layout and a page fires once. It clears when the render ends.

**Data Cache** persists `fetch` results on the server across requests. **This is where Next 15 flipped the default:** `fetch` is now **uncached** unless you opt in with `cache: 'force-cache'`, `next: { revalidate: n }`, or `next: { tags: [...] }`. In Next 14 it cached by default. Time-based revalidation refreshes on a timer; **on-demand** revalidation via `revalidateTag()` / `revalidatePath()` purges precisely.

**Full Route Cache** stores the rendered output of *static* routes at build time. A route stays in it until its data revalidates or you redeploy. Touching a **dynamic API** (`cookies()`, `headers()`, uncached `fetch`, `searchParams`) opts the route out — it becomes dynamic and renders per request.

**Router Cache** is client-side. It holds RSC payloads for prefetched and visited routes so back/forward and re-navigation are instant. In Next 15 the default `staleTimes` for dynamic pages is **0** — they aren't reused across navigations unless you configure it.

## 💻 Code

```ts
// Opt a fetch INTO the Data Cache (Next 15 default is off)
await fetch(url, { cache: 'force-cache' });                 // cache indefinitely
await fetch(url, { next: { revalidate: 3600 } });           // time-based: hourly
await fetch(url, { next: { tags: ['products'] } });         // taggable for on-demand
await fetch(url, { cache: 'no-store' });                    // never cache (dynamic)
```

```ts
// On-demand invalidation — the surgical tool, e.g. inside a Server Action
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';
export async function publish() {
  await db.publish();
  revalidateTag('products');       // purge every fetch tagged 'products'
  revalidatePath('/dashboard');    // purge a specific route's Full Route Cache
}
```

```ts
// Force a whole segment's rendering/caching behaviour
export const dynamic = 'force-dynamic';   // no Full Route Cache, render every request
export const revalidate = 60;             // segment-level ISR window
export const fetchCache = 'force-cache';  // override per-fetch defaults for the segment
```

## ⚖️ Trade-offs

- **Caching is on-by-default power with off-by-default footguns.** The Data + Full Route caches can turn a dynamic-looking app fully static and blazing fast — or serve stale data for hours if you forget you opted in. Next 15's shift to uncached-by-default trades some out-of-the-box speed for far fewer "why is this stale?" surprises.
- **Tag-based revalidation beats time-based** when correctness matters. `revalidate: 3600` risks an hour of stale data; `revalidateTag('products')` fired from the mutation keeps caches correct *and* fast. Prefer on-demand, fall back to time.
- **When NOT to cache:** anything per-user or security-sensitive (dashboards keyed to a session) should be `no-store` or rely on dynamic rendering. A shared cache serving one user's data to another is a real incident, not a hypothetical.

## 💣 Gotchas interviewers probe

- **Naming all four layers and which serves stale data.** This *is* the interview. Most candidates know "Next caches things"; seniors can point at the exact layer.
- **Next 15 uncached-by-default `fetch`.** The biggest recent gotcha — code relying on 14's default caching silently changes on upgrade.
- **Request Memoization ≠ Data Cache.** Memoization is one render, `fetch`-only, always on; the Data Cache is cross-request and opt-in. Conflating them is a common miss.
- **A single dynamic API poisons static rendering for the whole route.** One `cookies()` call and the Full Route Cache no longer applies — the route renders per request.
- **`revalidatePath`/`revalidateTag` also clear the client Router Cache** for affected routes — but only after a server round-trip; stale client cache is why a mutation sometimes "doesn't show up" until refresh.
- **`router.refresh()`** is the client escape hatch to drop the Router Cache and refetch the current route's server data.

## 🎯 Say this in the interview

> "Next has four caches that stack. Request Memoization dedupes identical fetches within a single render — it's React, always on. The Data Cache persists fetch results across requests, and in Next 15 it's opt-in: fetch is uncached unless I pass `force-cache`, a `revalidate`, or a tag. The Full Route Cache stores rendered HTML and the RSC payload for static routes, and any dynamic API — cookies, headers, searchParams — opts the whole route out. The Router Cache is client-side, holding RSC payloads so navigation is instant. When something's stale, my first move is to identify which layer is holding it. For invalidation I prefer tag-based `revalidateTag` fired from the mutation over time-based revalidation, because it keeps things both fresh and fast."

## 🔗 Go deeper

- [Next.js — Caching](https://nextjs.org/docs/app/building-your-application/caching) — the definitive four-layer reference with diagrams.
- [Next.js — `revalidateTag`](https://nextjs.org/docs/app/api-reference/functions/revalidateTag) — on-demand invalidation.
- [Next.js — `staleTimes`](https://nextjs.org/docs/app/api-reference/next-config-js/staleTimes) — tuning the client Router Cache.
