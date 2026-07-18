<div align="center">

# App Router fundamentals

<sub>▲ Next.js · 🟡 Medium · ⏱ 1h · `#routing`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The App Router is a **file-system router built on React Server Components**: folders are URL segments, special files (`page`, `layout`, `loading`, `error`) are the contract, and *everything renders on the server by default* until you opt a subtree into the client with `'use client'`.

---

## 🧠 Mental model

Forget "pages that render in the browser". In the App Router, a route is a **tree of nested layouts that resolve on the server into a stream of React**. The folder path is the URL; the files inside declare *what each segment contributes*.

```
app/
├─ layout.tsx          → root layout (wraps everything, must render <html>/<body>)
├─ page.tsx            → "/"
├─ loading.tsx         → Suspense fallback for this segment
├─ error.tsx           → error boundary (must be 'use client')
└─ dashboard/
   ├─ layout.tsx       → wraps every dashboard route, PRESERVED across navigation
   └─ page.tsx         → "/dashboard"
```

Only `page.tsx` (and `route.ts`) make a segment publicly routable. A folder with just a `layout.tsx` is structure, not a URL. The killer property: **layouts persist across navigations** — moving between `/dashboard/a` and `/dashboard/b` re-renders the page but keeps the dashboard layout's state, scroll, and DOM mounted.

## ⚙️ How it actually works

Every component is a **Server Component unless marked otherwise**. The server renders the tree, serialises the result into the **RSC payload** (a compact description of the React tree, *not* HTML), streams it to the client, and React reconciles it into the DOM. Navigations fetch a new RSC payload and patch the tree — no full document reload, no re-downloading unchanged layouts.

`<Link>` drives client-side navigation and **prefetches** routes in the viewport (in production) so the payload is often already in memory when you click. This is why App Router navigation feels instant while still being server-rendered.

Route segments are configured with **exported constants**, not a config file:

```ts
export const dynamic = 'force-dynamic';   // opt the whole segment out of static
export const revalidate = 3600;           // ISR: re-generate at most hourly
export const runtime = 'edge';            // or 'nodejs' (default)
```

A subtle Next 15 change: dynamic APIs like `cookies()`, `headers()`, `params`, and `searchParams` are now **async** — you `await` them, and touching them is what flips a route from static to dynamic.

## 💻 Code

```tsx
// app/layout.tsx — the ONE layout that must exist. Renders <html>/<body>.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

```tsx
// app/blog/[slug]/page.tsx — a Server Component that fetches directly. No useEffect.
export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;             // Next 15: params is a Promise
  const post = await getPost(slug);          // runs on the server, secrets safe
  return <article>{post.title}</article>;
}
```

```tsx
// A leaf that needs interactivity opts INTO the client. Push it to the leaf.
'use client';
import { useState } from 'react';
export function LikeButton() {
  const [liked, setLiked] = useState(false);
  return <button onClick={() => setLiked((v) => !v)}>{liked ? '♥' : '♡'}</button>;
}
```

## ⚖️ Trade-offs

- **Server-first is a huge win for bundle size and data access** — you fetch in the component with `async/await`, secrets never ship, and most of your tree sends *zero* JS. The cost is a genuinely new mental model: the network boundary now lives *inside your component tree*.
- **When NOT to reach for the App Router:** a small, fully-static marketing site or a heavily client-interactive SPA with no server data gains little and pays the RSC learning tax. It shines when you have real server data and want per-route streaming.
- **Layouts persisting is a feature and a trap** — a layout won't re-run on navigation, so data fetched in a layout is effectively cached for the session unless you force it.

## 💣 Gotchas interviewers probe

- **`layout.tsx` does not re-render on navigation between its children.** Candidates put per-page data in a layout and wonder why it's stale. Layouts are for *shared shell*, pages are for *per-route data*.
- **The root layout must render `<html>` and `<body>`** — there's no `_document`. Forgetting this is a common first-day error.
- **`'use client'` marks a boundary, not a file.** Everything imported *below* that boundary becomes client code too. Placement matters (covered in Server vs Client Components).
- **`page.tsx` vs `route.ts` are mutually exclusive** in the same segment — one renders UI, the other is an API endpoint.
- **App Router and Pages Router can coexist** in one project (`app/` and `pages/`), but a given path can only be served by one.

## 🎯 Say this in the interview

> "The App Router is a file-system router built on React Server Components. Folders are URL segments and special files — `page`, `layout`, `loading`, `error` — are the contract. The big shift is that everything is a Server Component by default, so I fetch data directly in the component with `async/await`, secrets stay on the server, and most of the tree ships no JavaScript. I only add `'use client'` at the leaves that need interactivity. Navigation is client-side and prefetched, but it's fetching an RSC payload, not re-downloading the page — and layouts persist across navigation, which keeps shared shell mounted. The main gotcha I watch for is putting per-route data in a layout, because layouts don't re-run when you move between their children."

## 🔗 Go deeper

- [Next.js — App Router](https://nextjs.org/docs/app) — the canonical reference and routing conventions.
- [Next.js — Project structure](https://nextjs.org/docs/app/getting-started/project-structure) — the full list of special files and folder conventions.
- [React — Server Components](https://react.dev/reference/rsc/server-components) — the primitive the whole router is built on.
