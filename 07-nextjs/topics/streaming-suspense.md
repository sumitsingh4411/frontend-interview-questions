<div align="center">

# Streaming & Suspense

<sub>▲ Next.js · 🔴 Hard · ⏱ 1h · `#rendering` `#performance`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Streaming sends one HTTP response in **chunks**: the static shell flushes immediately, and each `<Suspense>` boundary streams its slice in *when its own data resolves* — so your slowest query stops holding the entire page hostage. `loading.tsx` is just an automatic Suspense boundary around the route.

---

## 🧠 Mental model

Classic SSR is **all-or-nothing**: the server `await`s every data dependency, renders one complete HTML document, then sends it. Your Time-To-First-Byte is gated by your *slowest* query — one 800ms call and the whole page blocks for 800ms.

Streaming inverts this: **render what you can now, mark what you can't with a boundary, send it later on the same connection.**

```
  t=0ms   ┌─ shell (layout, nav, headings) ──────┐  flushed immediately
          │  <Suspense fallback={<Skeleton/>}> ─┐ │  ← placeholder streamed now
  t=40ms  │  ▓ user sees shell + skeletons ▓    │ │
  t=350ms │  reviews resolve → swapped in ──────┘ │  ← out-of-order chunk
  t=800ms │  recommendations resolve → swapped in │  ← another chunk
          └───────────────────────────────────────┘
```

The unlock: **a Suspense boundary is a promise you're allowed to render around.** The fallback ships instantly; the resolved content arrives as a follow-up chunk on the *same* response.

## ⚙️ How it actually works

A Server Component renders to the **RSC stream**. When rendering hits a `<Suspense>` whose child is awaiting data, React emits the *fallback* inline and leaves a placeholder marker. When the promise resolves, the server flushes an **out-of-order chunk** — a hidden `<template>` plus a tiny inline script that relocates the real DOM into the placeholder. This rides **HTTP chunked transfer encoding** (`Transfer-Encoding: chunked`), one long-lived response, no polling.

On the client, **selective hydration** kicks in: React hydrates each boundary as its HTML arrives, and it *prioritises* the boundary the user just interacted with — a click on a not-yet-hydrated button jumps that subtree to the front of the queue.

The critical constraint: **once the first byte is flushed, you cannot change the HTTP status or headers.** So `redirect()`, `notFound()`, and cookie-setting have to happen *before* streaming begins, or they degrade to a client-side navigation.

## 💻 Code

```tsx
// loading.tsx — the whole segment's page is auto-wrapped in <Suspense>.
// Zero ceremony: this fallback shows until page.tsx's data resolves.
export default function Loading() {
  return <PageSkeleton />;
}
```

```tsx
// ❌ One await at the top blocks the ENTIRE page on the slowest call.
export default async function Page() {
  const reviews = await getReviews();          // 350ms
  const recs = await getRecommendations();     // 800ms — page waits 1150ms total
  return <><Reviews data={reviews} /><Recs data={recs} /></>;
}
```

```tsx
// ✅ Independent boundaries stream in parallel. Shell is instant;
//    each section pops in on its own timeline.
import { Suspense } from 'react';
export default function Page() {
  return (
    <>
      <ProductHeader />                         {/* static, flushed at t=0 */}
      <Suspense fallback={<ReviewsSkeleton />}>
        <Reviews />                             {/* awaits internally, 350ms */}
      </Suspense>
      <Suspense fallback={<RecsSkeleton />}>
        <Recs />                                {/* awaits internally, 800ms */}
      </Suspense>
    </>
  );
}
```

Note the fetches now start **in parallel** — because each async component kicks off its own request, rather than one component awaiting them in sequence.

## ⚖️ Trade-offs

- **Streaming trades a single complete document for a fast shell.** TTFB and perceived load win big, but the response is no longer one atomic blob — anything that must set a status or redirect has to decide *before* the shell flushes.
- **Boundary granularity is the whole skill.** One boundary around everything = you've bought nothing (the page still waits for the slowest child). A boundary per tiny widget = skeleton confetti and layout thrash. Draw boundaries around *independent, meaningfully-slow* regions.
- **When NOT to stream:** a fully static route has nothing to stream — it's already cached HTML. And if a fallback and its resolved content differ in height, you get CLS; reserve the space or skip the boundary.

## 💣 Gotchas interviewers probe

- **`redirect()` / `notFound()` after the first flush.** Once streaming starts you can't send a 3xx; it becomes a client redirect. Do auth/redirect checks *above* your Suspense boundaries, ideally before any slow await.
- **Sequential awaits create waterfalls that streaming can't fix.** `await a; await b` in one component still runs serially. Streaming parallelises *across* boundaries, not *within* one function — use `Promise.all` or separate async components.
- **`loading.tsx` wraps the segment AND its children** — it shows during navigation into the whole subtree, which can surprise you when a deep child is the slow one.
- **Metadata can block the stream.** A slow `generateMetadata` delays the shell because `<head>` is resolved first; keep it cheap (and it shares fetches with the page via Request Memoization).
- **Skeletons that don't match final layout cause CLS** — the streamed content shifts everything below it. Size fallbacks to their real content.
- **Nested Suspense reveals top-down** — an outer boundary won't reveal until it's ready, even if an inner one resolved first.

## 🎯 Say this in the interview

> "Regular SSR blocks on your slowest query before sending anything — one 800ms call and TTFB is 800ms. Streaming fixes that: Next flushes the static shell immediately, and each Suspense boundary streams its content in when *its* data resolves, over a single chunked HTTP response. `loading.tsx` is just an automatic Suspense boundary around the route. On the client, selective hydration hydrates boundaries as they land and prioritises whatever the user touches. The judgment call is boundary granularity — one boundary around everything buys nothing because the page still waits for the slowest child, and a boundary per widget is skeleton soup. The trap I watch for: once the first byte flushes I can't redirect or change status, so auth checks and redirects go above the boundaries, before any slow await."

## 🔗 Go deeper

- [Next.js — Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) — `loading.tsx`, manual boundaries, and the mechanism.
- [React — `<Suspense>`](https://react.dev/reference/react/Suspense) — the boundary's exact semantics and reveal order.
- [web.dev — Time to First Byte](https://web.dev/articles/ttfb) — why the shell-first model wins on perceived performance.
