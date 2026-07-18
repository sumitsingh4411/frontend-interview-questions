<div align="center">

# Metadata & SEO

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#seo`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — In the App Router you never touch `<head>` directly: you `export const metadata` (static) or `export async function generateMetadata()` (dynamic), and Next dedupes, merges down the layout tree, and streams the tags. The senior insight is that `generateMetadata`'s `fetch` calls are **deduped with the page's own fetches**, so pulling the title from your CMS costs zero extra requests.

---

## 🧠 Mental model

Old world (`next/head`, Pages Router): you imperatively rendered `<title>` and `<meta>` tags inside components, and hoped nothing else clobbered them.

New world (App Router): metadata is **data you return**, not markup you render. Next owns `<head>`. You export a `Metadata` object; Next resolves it, merges parent layouts with the leaf page (**shallow merge, child wins per key**), and injects the final tags server-side — so crawlers and social scrapers see them in the initial HTML without running JS.

```
layout.tsx  export const metadata = { title: { template: '%s · Acme', default: 'Acme' } }
   └─ page.tsx  export const metadata = { title: 'Pricing' }
        → <title>Pricing · Acme</title>
```

The framing: **metadata is a computed value that flows down the tree, not a side effect you fire in a component.** That's why it's SSR-correct by construction — there's no "did the tag render before the crawler snapshot?" race.

## ⚙️ How it actually works

**Two exports, mutually exclusive per file:**

- `export const metadata: Metadata = {...}` — static, known at build.
- `export async function generateMetadata({ params, searchParams }, parent)` — async, for titles/OG images that depend on data.

`generateMetadata` receives the same `params` as the page and can `await parent` to read resolved parent metadata. Its `fetch` calls join Next's **request memoization** — if the page also fetches `getPost(id)`, both hit the network once. So there's no performance penalty for deriving the `<title>` from the same record the page renders.

**The `title.template` mechanism** lets a layout define `%s · Acme` once; every child that sets a string title gets wrapped. A child can escape with `title: { absolute: 'No suffix' }`.

**File-based metadata** is the other half people forget: `app/opengraph-image.tsx`, `app/icon.png`, `app/sitemap.ts`, `app/robots.ts`, `app/manifest.ts`. These are conventions Next turns into real routes. `opengraph-image.tsx` can render a **dynamic OG image** at the edge with `ImageResponse` (JSX → PNG), which is how you get per-post social cards without a screenshot service.

**Streaming caveat:** with streamed/suspenseful pages, Next holds the metadata and flushes it in the initial `<head>` chunk before the streamed body — so SEO tags are never stuck behind a Suspense boundary.

## 💻 Code

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

// Dynamic metadata — fetch is DEDUPED with the page body's fetch
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug); // same call the page makes → one request

  return {
    title: post.title,                       // → "post.title · Acme" via template
    description: post.excerpt,
    alternates: { canonical: `/blog/${slug}` }, // canonical URL — dedupe signal
    openGraph: {
      title: post.title,
      images: [{ url: post.ogImage, width: 1200, height: 630 }],
      type: 'article',
    },
    twitter: { card: 'summary_large_image' },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug); // deduped with the call above
  return <article>{post.body}</article>;
}
```

```ts
// app/sitemap.ts — typed, dynamic sitemap generated at request/build time
import type { MetadataRoute } from 'next';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();
  return posts.map((p) => ({
    url: `https://acme.com/blog/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));
}
```

## ⚖️ Trade-offs

- **When NOT to reach for `generateMetadata`:** if the title is static, use the plain `metadata` export — it's resolved at build with zero runtime cost. `generateMetadata` only earns its keep when the value depends on data.
- **JSON-LD is not part of the Metadata API.** Structured data (`Article`, `Product`, `BreadcrumbList`) is rendered as a `<script type="application/ld+json">` in the component body. Don't expect `metadata` to emit it.
- **Client Components can't export metadata.** Metadata lives on the server. A `'use client'` page must lift its title to a parent server layout/page or a server wrapper.
- **Dynamic OG images (`ImageResponse`) run on the edge and cost compute + bundle.** Great for scale (no headless browser), but the JSX subset is limited (flexbox only, no grid, inline styles).

## 💣 Gotchas interviewers probe

- **"How do you set the title in App Router?"** If they say `next/head` or `document.title`, that's Pages-era. The answer is the `metadata`/`generateMetadata` export.
- **Metadata and page share fetches.** Candidates worry `generateMetadata` doubles requests — it doesn't, thanks to request memoization within a render.
- **`metadataBase`** must be set (usually in the root layout) or relative OG/canonical URLs won't resolve to absolute — scrapers need absolute URLs and you'll get warnings.
- **Merging is shallow per top-level key.** A child setting `openGraph` replaces the parent's `openGraph` entirely; it doesn't deep-merge the fields.
- **`viewport` and `themeColor` moved out** of `metadata` into a separate `viewport` export in newer versions — putting them in `metadata` warns.
- **Streaming doesn't break SEO** — the `<head>` is flushed first. But client-only rendered metadata (via a third-party JS lib) *can* be missed by non-JS crawlers.

## 🎯 Say this in the interview

> "In the App Router I don't render head tags — I export metadata. Static values go in `export const metadata`; anything data-driven goes in `generateMetadata`, which gets the route params and whose fetches are deduped with the page's own fetches, so pulling the title and OG image from the CMS is free. Layouts set a `title.template` like `%s · Acme` and define shared OG defaults; leaf pages override per key with a shallow merge. I set `metadataBase` so canonical and OG URLs resolve to absolute, add `alternates.canonical` to kill duplicate-content issues, and use file conventions — `sitemap.ts`, `robots.ts`, and `opengraph-image.tsx` with `ImageResponse` for per-page social cards. JSON-LD I render as a script in the body, since structured data isn't part of the Metadata API. And because Next flushes the head before streaming the body, none of this is stuck behind a Suspense boundary for crawlers."

## 🔗 Go deeper

- [Next.js — Metadata & OG images](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) — the canonical guide to both exports and file conventions.
- [Next.js — `generateMetadata` API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata) — every field, plus `title.template`/`absolute`.
- [Google — Structured data & JSON-LD](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data) — how to add rich results.
- [Next.js — `ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response) — dynamic OG image generation and its JSX constraints.
