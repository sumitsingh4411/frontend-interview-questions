<div align="center">

# Layouts & nested routing

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#routing`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Layouts are **shared shells that wrap segments and persist across navigation**; nested folders compose into a tree of nested layouts, so moving between sibling routes re-renders only the `page`, keeping every enclosing layout mounted with its state and scroll intact.

---

## 🧠 Mental model

The URL is a path through a tree, and each folder can contribute a `layout` that wraps everything beneath it. Rendering a route means **composing every layout from the root down** around the leaf `page`:

```
app/layout        (root — <html>/<body>, always present)
 └─ app/(shop)/layout          → wraps the shop
     └─ app/(shop)/products/layout   → sidebar + filters
         └─ app/(shop)/products/[id]/page   → the actual product
```

Rendered, that's `RootLayout( ShopLayout( ProductsLayout( ProductPage ) ) )`. The crucial behaviour: when you navigate from product `A` to product `B`, **only the innermost `page` re-renders**. Every wrapping layout stays mounted — its React state survives, its scroll position holds, and its `<video>` keeps playing. Layouts are the *stable furniture* of a route; pages are the *changing content*.

## ⚙️ How it actually works

A layout receives a `children` prop (the matched child segment) and renders it wherever it likes. It runs on the server by default, so it can `await` data. But because it **persists**, its data is fetched once and *not re-run on navigation between children* — treat layout data as "shared, session-stable" and page data as "per-route, fresh".

Three organisational tools ride alongside layouts:

- **Route Groups `(name)`** — folders in parentheses organise files or apply a layout to a subset of routes **without adding a URL segment**. `app/(marketing)/about/page.tsx` still serves `/about`.
- **`template.tsx`** — like a layout but the *opposite* persistence: it creates a **new instance on every navigation**, resetting state and re-running effects. Use it when you *want* an enter animation or a fresh error boundary per visit.
- **Private folders `_name`** — opt a folder out of routing entirely (colocated helpers, components).

## 💻 Code

```tsx
// app/dashboard/layout.tsx — persists across /dashboard/* navigation
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[240px_1fr]">
      <Sidebar />          {/* stays mounted, keeps scroll & open/closed state */}
      <main>{children}</main>
    </div>
  );
}
```

```tsx
// app/(marketing)/layout.tsx — route group: applies to /about, /pricing…
// but "(marketing)" NEVER appears in the URL.
export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <div className="prose"><MarketingNav />{children}</div>;
}
```

```tsx
// app/onboarding/template.tsx — RE-MOUNTS on every step change (fresh animation)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="fade-in">{children}</div>;
}
```

## ⚖️ Trade-offs

- **Persistence is the whole point** — it's why App Router navigation feels app-like, preserving sidebars, tabs, and media. But it means a layout is the *wrong* place for anything that must change per route.
- **`template` vs `layout` is a real decision, not a synonym.** Templates re-mount, which costs a fresh render and lost state but buys per-navigation animations and error/suspense reset. Reach for `template` only when you specifically need that reset.
- **Route groups can define multiple root layouts** (e.g. a marketing shell and an app shell in one project), but crossing between two root layouts forces a **full page reload** — a deliberate trade-off to swap the entire `<html>`.

## 💣 Gotchas interviewers probe

- **"Why is my layout data stale after navigation?"** Because layouts don't re-run when you move between their children. This is the single most common layout bug. Move per-route data into the `page`.
- **The root layout is mandatory and owns `<html>`/`<body>`.** Nested layouts must *not* render those tags again.
- **Route groups don't affect the URL** — `(auth)` is invisible in the path. Candidates assume `/(auth)/login` serves a `/auth` prefix; it serves `/login`.
- **`loading.tsx` and `error.tsx` wrap the segment inside its layout** — the layout stays visible while the page suspends or errors, which is exactly the UX you want (shell up, content loading).
- **Passing data from layout to page** isn't done via props — they're separate server renders. Share via a data-fetching function (deduped by request memoization) or context in a client boundary.

## 🎯 Say this in the interview

> "Layouts are shared shells that wrap a segment and everything below it, and they compose from the root down. The defining behaviour is that they persist across navigation — when I move between sibling pages, only the innermost page re-renders while every enclosing layout stays mounted, keeping its state and scroll. That's what makes navigation feel app-like. The corollary is that layouts are the wrong place for per-route data, because they don't re-run between children — that's the classic stale-data bug. When I actually want a reset per navigation — an enter animation or a fresh error boundary — I use `template` instead of `layout`. And I use route groups in parentheses to apply a layout to a subset of routes or organise files without adding a URL segment."

## 🔗 Go deeper

- [Next.js — Pages and Layouts](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) — layout nesting and persistence.
- [Next.js — Route Groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — organising routes without URL segments.
- [Next.js — `template.js`](https://nextjs.org/docs/app/api-reference/file-conventions/template) — when re-mounting beats persistence.
