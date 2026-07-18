<div align="center">

# ISR (Incremental Static Regeneration)

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#rendering` `#caching`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — ISR lets a **statically generated** page refresh itself in the background *after* deploy, without a rebuild. You serve the cached HTML instantly (stale-while-revalidate), and the *next* visitor after the window expires triggers a silent regeneration. In the App Router it's not a separate feature — it's the **Full Route Cache** with a `revalidate` timer plus on-demand `revalidateTag`/`revalidatePath`.

---

## 🧠 Mental model

Static generation gives you CDN-speed HTML but freezes data at build time. Pure SSR gives you fresh data but pays a render on every request. ISR is the middle path: **build once, serve stale, regenerate lazily.** Think of each route as a cached document with an expiry stamp. Before expiry, every request is a cache hit. After expiry, the *first* request still gets the stale copy immediately, and Next kicks off a background re-render — so nobody waits, and the cache swaps under them for the next visitor.

The framing that lands in an interview: **ISR is `stale-while-revalidate` for whole pages.** You are trading a bounded window of staleness for near-zero latency and near-zero server cost. The only real question is *how stale is acceptable* and *can I invalidate on demand when the answer is "not at all"*.

## ⚙️ How it actually works

In the App Router you don't call a special API — you set a revalidation window and Next stores the rendered output (HTML + RSC payload) in the **Full Route Cache**.

- **Segment-level:** `export const revalidate = 60` on a page/layout sets a 60-second window for that route.
- **Fetch-level:** `fetch(url, { next: { revalidate: 60 } })` scopes the window to one data source; the route's effective window is the *smallest* of its fetches.
- **On-demand:** `revalidateTag('products')` or `revalidatePath('/blog/[slug]')` purges precisely, the moment your data changes — no timer required.

`generateStaticParams` decides *which* dynamic paths are pre-rendered at build. Paths you didn't list are handled by `dynamicParams` (default `true`): the first request renders on demand, caches the result, and every subsequent visitor gets the static file. Set `dynamicParams = false` to 404 anything not pre-listed.

Crucially, regeneration is **atomic and non-blocking**: a failed background render keeps serving the last good page rather than showing an error. The stale response carries no penalty to the user who triggered it.

## 💻 Code

```tsx
// app/blog/[slug]/page.tsx
// Pre-render the top posts at build; render the long tail on first hit.
export const revalidate = 3600;        // regenerate at most once per hour
export const dynamicParams = true;      // allow slugs not in generateStaticParams

export async function generateStaticParams() {
  const posts = await getTopPosts();    // only the hot paths at build time
  return posts.map((p) => ({ slug: p.slug }));
}

export default async function Post({ params }: { params: { slug: string } }) {
  const post = await getPost(params.slug); // cached in the Data Cache too
  return <article>{post.body}</article>;
}
```

```ts
// The correctness upgrade: on-demand invalidation from your mutation.
'use server';
import { revalidateTag, revalidatePath } from 'next/cache';

export async function publishPost(slug: string) {
  await db.publish(slug);
  revalidatePath(`/blog/${slug}`);   // this page is fresh NOW, not in an hour
  revalidateTag('post-list');         // and any list that tagged its fetch
}
```

## ⚖️ Trade-offs

- **ISR buys CDN latency with bounded staleness.** For content that changes on a human timescale — blogs, docs, product pages, marketing — it's close to free and close to ideal. The cost is that *someone* always sees the stale version for up to one window.
- **Time-based revalidation is a guess; tag-based is a fact.** Prefer `revalidateTag` fired from the write path. Reach for a timer only when you have no mutation hook (third-party CMS with no webhook, say).
- **When NOT to use it:** anything per-user or truly real-time — dashboards, carts, prices that must never lag, inventory at checkout. A shared page cache serving user A's data to user B is an incident. Those routes want dynamic rendering or client fetching.
- **The stampede edge:** with a short window and cold cache, the first request after expiry does real work. Next serializes it (one regeneration, not N), but plan for that render cost on high-traffic routes.

## 💣 Gotchas interviewers probe

- **"Who pays the regeneration cost?"** Not the user who triggers it — they get the stale page instantly. The *background* render is what refreshes the cache for the next visitor. Candidates who say "the user waits for the rebuild" are describing SSR, not ISR.
- **The route's window is the minimum of all its `revalidate` values.** A single `fetch` with `revalidate: 10` inside a page exported with `revalidate: 3600` pulls the whole route to 10s. This surprises people constantly.
- **A dynamic API opts you out entirely.** Touch `cookies()`, `headers()`, or read `searchParams` and the route becomes fully dynamic — the Full Route Cache no longer applies, so "my ISR isn't caching" is usually an accidental dynamic API.
- **`revalidate = 0` is not ISR** — it's `force-dynamic`. Off-by-one thinking here is common.
- **On serverless, the cache is per-instance unless you configure shared storage.** Vercel handles this; a self-hosted deployment across multiple containers needs a shared cache handler or each instance regenerates independently.

## 🎯 Say this in the interview

> "ISR is stale-while-revalidate for entire pages. I statically generate the route, serve the cached HTML at CDN speed, and after a revalidation window the next request still gets the stale copy instantly while Next regenerates in the background — so no user ever waits on a rebuild. In the App Router it's just the Full Route Cache with a `revalidate` timer. I set the window with `export const revalidate` or per-fetch, and `generateStaticParams` picks which paths build ahead of time; the rest render on first hit and cache. But my default for correctness is on-demand: I fire `revalidateTag` or `revalidatePath` from the mutation, so the page is fresh the instant data changes instead of on a timer. The thing I watch for is accidentally going dynamic — one `cookies()` call opts the whole route out of the cache."

## 🔗 Go deeper

- [Next.js — Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) — the canonical guide with time-based and on-demand paths.
- [Next.js — `revalidatePath`](https://nextjs.org/docs/app/api-reference/functions/revalidatePath) — surgical, route-level invalidation.
- [Next.js — `generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — controlling which dynamic paths pre-render.
- [web.dev — stale-while-revalidate](https://web.dev/articles/stale-while-revalidate) — the caching pattern ISR generalises to whole pages.
