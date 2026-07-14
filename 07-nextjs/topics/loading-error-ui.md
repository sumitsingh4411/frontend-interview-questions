<div align="center">

# Loading & error UI

<sub>▲ Next.js · 🟡 Medium · ⏱ 30m · `#routing` `#ux`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `loading.tsx` and `error.tsx` are **file-based Suspense and error boundaries** for a route segment: Next automatically wraps your `page` so a slow segment streams a fallback and a thrown error is caught *without taking down the surrounding layout*.

---

## 🧠 Mental model

These two files are sugar over React primitives you already know:

| File | Compiles to | Catches |
|---|---|---|
| `loading.tsx` | `<Suspense fallback={<Loading/>}>` around the page | pending async renders |
| `error.tsx` | a React Error Boundary around the page | thrown errors during render |
| `not-found.tsx` | the boundary for `notFound()` | the "no such resource" case |
| `global-error.tsx` | boundary for the **root layout** itself | errors even the root can't survive |

The mental model that matters: **the boundary wraps the `page`, but sits *inside* the `layout`**. So when the page suspends or throws, the layout — nav, sidebar, shell — **stays on screen and interactive**, and only the page area swaps to the fallback or error UI. That's the difference between a graceful degrade and a white screen.

## ⚙️ How it actually works

`loading.tsx` works because the App Router **streams**. Next sends the layout and the loading fallback immediately, then streams the real page content in when its async work resolves, swapping the fallback out. You get a fast first paint and a perceptible "shell then content" experience for free — no manual `useState(isLoading)`.

`error.tsx` **must be a Client Component** (`'use client'`) — error boundaries rely on client-side lifecycle. It receives two props: `error` (with a `.digest` hash for correlating with server logs) and `reset` (a function to re-attempt rendering the segment). Crucially, an `error.tsx` catches errors from its *children*, not from its *own* layout — to catch a layout's error you put the boundary one level up.

## 💻 Code

```tsx
// app/dashboard/loading.tsx — shown instantly while the page's async work runs
export default function Loading() {
  return <Skeleton rows={5} />;   // layout stays visible; only this area is a skeleton
}
```

```tsx
// app/dashboard/error.tsx — MUST be a client component
'use client';
export default function Error({
  error, reset,
}: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div role="alert">
      <p>Something broke.</p>
      <button onClick={reset}>Try again</button>  {/* re-renders the segment */}
    </div>
  );
}
```

```tsx
// app/not-found.tsx — rendered when notFound() is thrown, or for unmatched routes
export default function NotFound() {
  return <h1>404 — no such page</h1>;
}
```

```tsx
// For finer control, drop Suspense boundaries INSIDE the page for per-widget streaming:
import { Suspense } from 'react';
<Suspense fallback={<ChartSkeleton />}><SlowChart /></Suspense>
```

## ⚖️ Trade-offs

- **File-based boundaries are zero-boilerplate and route-aware** — you get streaming loading states and resilient error handling without wiring Suspense/ErrorBoundary by hand. The trade-off is coarseness: `loading.tsx` shows one fallback for the *whole* segment.
- **For granular UX, use inline `<Suspense>` instead.** Wrapping individual slow components lets the fast parts of a page render immediately while only the slow widget shows a skeleton — far better perceived performance than blanking the entire route.
- **When NOT to add `error.tsx` everywhere:** a boundary that just shows "something broke" at every level adds noise. Place them where a *meaningful* recovery or message exists; let others bubble to a higher boundary.

## 💣 Gotchas interviewers probe

- **`error.tsx` must be `'use client'`.** Forgetting this is the most common mistake — error boundaries can't be Server Components.
- **`error.tsx` does not catch errors in its sibling `layout.tsx`.** The boundary wraps the *page*, not the layout at the same level. To catch layout errors, the boundary must live in the *parent* segment.
- **`global-error.tsx` must render its own `<html>` and `<body>`** — it replaces the root layout, which has failed, so it can't rely on it. And it only runs in production.
- **`notFound()` vs `error`.** `notFound()` renders `not-found.tsx` (expected, 404 semantics); an uncaught throw renders `error.tsx` (unexpected). Using a thrown Error for "not found" gives the wrong status code and UX.
- **`reset()` re-renders the segment, not the whole app** — if the error came from stale props or state above the boundary, reset alone won't fix it.
- **Loading states are tied to Suspense, which needs an async boundary.** A synchronous page with no awaited data won't trigger `loading.tsx`.

## 🎯 Say this in the interview

> "`loading.tsx` and `error.tsx` are file-based Suspense and error boundaries that Next wraps around a route's page. The important structural detail is that the boundary sits inside the layout but around the page — so when the page suspends or throws, the surrounding shell stays visible and interactive, and only the content area swaps to a skeleton or an error UI. `loading.tsx` works because the router streams: it sends the shell and fallback first, then streams the real content in. `error.tsx` has to be a client component, it gets `error` and `reset` props, and it catches errors from its children — not from its own sibling layout, which is a common misunderstanding. For finer control I drop inline `<Suspense>` boundaries around individual slow widgets so the fast parts of the page don't wait on the slow ones."

## 🔗 Go deeper

- [Next.js — Loading UI and Streaming](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) — `loading.tsx` and streaming mechanics.
- [Next.js — Error Handling](https://nextjs.org/docs/app/building-your-application/routing/error-handling) — `error.tsx`, `global-error`, `reset`.
- [React — Suspense](https://react.dev/reference/react/Suspense) — the primitive `loading.tsx` compiles to.
