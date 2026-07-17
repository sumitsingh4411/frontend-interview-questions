<div align="center">

# Partial Prerendering (PPR)

<sub>▲ Next.js · 🔴 Hard · ⏱ 45m · `#rendering` `#modern`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — PPR ends the all-or-nothing choice between static and dynamic. Next pre-renders a **static shell** at build time, leaves **holes** wherever you wrap dynamic content in `<Suspense>`, and **streams** the dynamic parts into those holes on request — all in a **single HTTP response**. One page is simultaneously CDN-static and per-request-dynamic.

---

## 🧠 Mental model

Before PPR, a route was binary: one `cookies()` call and the *entire* page became dynamic, losing its static cache. That's a terrible trade — a product page is 90% static (layout, nav, description, images) and 10% dynamic (your cart count, a personalised price). Historically you paid full dynamic rendering for that 10%.

PPR reframes the unit of "static vs dynamic" from **the route** to **the component**. The mental model: **the `<Suspense>` boundary is the seam between what can be baked and what must be live.** Everything outside a boundary is prerendered into a static shell and served instantly from the edge/CDN. Everything inside a boundary is a *hole* — its fallback ships in the shell, and the real content streams in from the server. The user sees a fully-formed page immediately, with dynamic bits filling in.

Say this out loud and it clicks: **PPR is "static shell + streamed dynamic holes, in one request."**

## ⚙️ How it actually works

At build time Next renders the route and hits the `<Suspense>` boundaries. React's **`postpone`** mechanism pauses rendering at each dynamic boundary rather than erroring, capturing the tree *up to* the hole as a static prelude — the shell — and recording where it stopped.

At request time the flow is one response, not two round-trips:

1. The static shell (including every Suspense *fallback*) flushes immediately from the cache — great TTFB, no server render needed.
2. The server resumes the postponed work, renders the dynamic components, and **streams** their output into the holes over the same connection as it completes.

What makes a component "dynamic" is unchanged: reading `cookies()`, `headers()`, `searchParams`, or an uncached `fetch`. The difference is *containment* — those APIs now only make their own Suspense subtree dynamic instead of poisoning the whole route. A dynamic API used *outside* any boundary still opts the shell out, which is exactly the error PPR surfaces to you.

As of Next 15 it's **experimental** — `experimental.ppr` in config, opt-in per route with `export const experimental_ppr = true`, and only on the canary line. That's an interview-relevant caveat, not a footnote.

## 💻 Code

```ts
// next.config.ts — opt in incrementally
import type { NextConfig } from 'next';
const config: NextConfig = {
  experimental: { ppr: 'incremental' }, // 'incremental' = per-route opt-in
};
export default config;
```

```tsx
// app/product/[id]/page.tsx
export const experimental_ppr = true;

export default function Page() {
  return (
    <main>
      {/* STATIC SHELL — prerendered at build, served from CDN */}
      <ProductHeader />
      <ProductDescription />

      {/* DYNAMIC HOLE — fallback ships in the shell, real content streams */}
      <Suspense fallback={<PriceSkeleton />}>
        <LivePrice /> {/* reads cookies() → dynamic, but only THIS subtree */}
      </Suspense>

      <Suspense fallback={<CartSkeleton />}>
        <CartWidget /> {/* per-user, streamed in */}
      </Suspense>
    </main>
  );
}
```

```tsx
// ❌ Dynamic API OUTSIDE a boundary poisons the shell — PPR can't prerender.
export default async function Page() {
  const user = cookies().get('uid'); // no Suspense above this → whole route dynamic
  return <div>{user?.value}</div>;
}
```

## ⚖️ Trade-offs

- **PPR gives you the best of both without a routing split.** No more choosing static *or* dynamic per page, and no separate client fetch + spinner waterfall for the dynamic bits — it's one streamed response, so the fast static content isn't held hostage by the slow dynamic query.
- **It only pays off when your page genuinely mixes the two.** A fully dynamic dashboard has no static shell worth prerendering; a fully static marketing page never needed PPR. The sweet spot is the common "mostly static, a little personal" page.
- **When NOT to adopt it yet:** anything you can't run on the canary/experimental channel. It's not stable, the config surface is still moving, and betting production architecture on an experimental flag is a real risk to weigh.
- **Your Suspense boundaries become architecture, not decoration.** Where you draw them literally defines your static/dynamic seam — sloppy boundaries mean either a tiny shell or an accidental dynamic route.

## 💣 Gotchas interviewers probe

- **"How many HTTP requests?"** One. The whole point is that dynamic holes stream over the *same* response as the static shell — not a client-side refetch. Candidates who describe a second request are describing client components + SWR, not PPR.
- **A dynamic API outside a Suspense boundary opts the entire route out.** The boundary is what contains the dynamism; without it, `cookies()` still makes everything dynamic. This is the single most common PPR mistake.
- **The fallback is part of the static shell.** It's prerendered and shipped instantly, so a good skeleton is what makes PPR feel fast — a bad or missing fallback shows layout shift as the hole fills.
- **PPR isn't a caching layer** — it composes *with* the four caches. The shell can be ISR-revalidated; the dynamic holes obey the Data Cache rules. People conflate "prerendered shell" with "cached forever."
- **Experimental status is the answer they want.** Naming that PPR is canary-only and per-route opt-in signals you actually track the release channel rather than repeating a conference demo.

## 🎯 Say this in the interview

> "PPR fixes the all-or-nothing problem where one `cookies()` call turned a whole route dynamic and threw away its static cache. Instead, Next prerenders a static shell at build time and leaves holes wherever I wrap dynamic content in `<Suspense>`. On request, the shell — including the Suspense fallbacks — flushes instantly from the CDN, and the server resumes the postponed work and streams the dynamic components into those holes over the *same* HTTP response. So the unit of static-versus-dynamic moves from the route to the component, and my Suspense boundaries literally define the seam. The catch I'd flag: a dynamic API *outside* a boundary still poisons the shell, and PPR is still experimental and canary-only as of Next 15, so I wouldn't bet a production architecture on it without accepting that risk."

## 🔗 Go deeper

- [Next.js — Partial Prerendering](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering) — the official model, config, and per-route opt-in.
- [Next.js — Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) — how Suspense boundaries drive streaming.
- [React — `<Suspense>`](https://react.dev/reference/react/Suspense) — the primitive PPR builds its holes from.
- [Next.js Conf — Partial Prerendering deep dive](https://vercel.com/blog/partial-prerendering-with-next-js-creating-a-new-default-rendering-model) — the design rationale from the team.
