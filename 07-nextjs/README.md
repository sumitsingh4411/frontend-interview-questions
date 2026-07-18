<div align="center">

<img src="banner.svg" alt="07 · Next.js" width="100%" />

</div>

The production meta-framework. Interviewers use it to probe rendering strategies, caching, and the server/client boundary.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 35 Next.js questions across 6 categories →](question-bank/README.md)**

## Routing & structure

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [App Router fundamentals](topics/app-router-fundamentals.md) | 🟡 | 1h | `#routing` | [Next.js: App Router ⭐](https://nextjs.org/docs/app) |
| [Pages Router (legacy)](topics/pages-router-legacy.md) | 🟢 | 45m | `#routing` | [Next.js: Pages Router ⭐](https://nextjs.org/docs/pages) |
| [Layouts & nested routing](topics/layouts-nested-routing.md) | 🟡 | 45m | `#routing` | [Next.js: layouts ⭐](https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts) |
| [Dynamic & catch-all routes](topics/dynamic-catch-all-routes.md) | 🟡 | 30m | `#routing` | [Next.js: dynamic routes ⭐](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes) |
| [Parallel & intercepting routes](topics/parallel-intercepting-routes.md) | 🔴 | 1h | `#routing` `#advanced` | [Next.js ⭐](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes) |
| [Loading & error UI](topics/loading-error-ui.md) | 🟡 | 30m | `#routing` `#ux` | [Next.js ⭐](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) |
| [Route handlers (API)](topics/route-handlers-api.md) | 🟡 | 45m | `#api` | [Next.js ⭐](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) |

## Rendering & data

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Server vs Client Components](topics/server-vs-client-components.md) | 🔴 | 1h | `#rsc` `#rendering` | [Next.js: server components ⭐](https://nextjs.org/docs/app/building-your-application/rendering/server-components) |
| [Data fetching patterns](topics/data-fetching-patterns.md) | 🟡 | 1h | `#data` | [Next.js: data fetching ⭐](https://nextjs.org/docs/app/building-your-application/data-fetching) |
| [Caching layers (request/data/full route)](topics/caching-layers-request-data-full-route.md) | 🔴 | 1.5h | `#caching` `#performance` | [Next.js: caching ⭐](https://nextjs.org/docs/app/building-your-application/caching) |
| [Streaming & Suspense](topics/streaming-suspense.md) | 🔴 | 1h | `#rendering` `#performance` | [Next.js: streaming ⭐](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming) |
| [Server Actions & mutations](topics/server-actions-mutations.md) | 🟡 | 1h | `#data` `#mutations` | [Next.js: server actions ⭐](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations) |
| [ISR (Incremental Static Regeneration)](topics/isr-incremental-static-regeneration.md) | 🟡 | 45m | `#rendering` `#caching` | [Next.js: ISR ⭐](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) |
| [Partial Prerendering (PPR)](topics/partial-prerendering-ppr.md) | 🔴 | 45m | `#rendering` `#modern` | [Next.js: PPR ⭐](https://nextjs.org/docs/app/building-your-application/rendering/partial-prerendering) |

## Platform & optimization

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Middleware](topics/middleware.md) | 🟡 | 45m | `#routing` `#auth` | [Next.js: middleware ⭐](https://nextjs.org/docs/app/building-your-application/routing/middleware) |
| [Edge runtime](topics/edge-runtime.md) | 🔴 | 45m | `#edge` `#performance` | [Next.js: edge ⭐](https://nextjs.org/docs/app/api-reference/edge) |
| [Metadata & SEO](topics/metadata-seo.md) | 🟡 | 45m | `#seo` | [Next.js: metadata ⭐](https://nextjs.org/docs/app/building-your-application/optimizing/metadata) |
| [Image optimization](topics/image-optimization.md) | 🟡 | 45m | `#performance` `#images` | [Next.js: Image ⭐](https://nextjs.org/docs/app/building-your-application/optimizing/images) |
| [Font optimization](topics/font-optimization.md) | 🟢 | 30m | `#performance` `#fonts` | [Next.js: fonts ⭐](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) |
| Authentication patterns | 🔴 | 1h | `#auth` | [Next.js: auth ⭐](https://nextjs.org/docs/app/building-your-application/authentication) |
| Deployment & performance | 🟡 | 45m | `#deployment` `#performance` | [Next.js: deploying ⭐](https://nextjs.org/docs/app/building-your-application/deploying) |

## ❓ Rapid-fire Next.js interview questions

Real Next.js questions asked at the SDE-2 / senior level. Answer out loud, then verify above.

1. **App Router vs Pages Router** — what changed and why?
2. **Server Components vs Client Components** — when do you use each?
3. How does **caching** work in Next.js (request, data, full-route, router cache)?
4. **SSR vs SSG vs ISR vs PPR** — trade-offs?
5. What are **Server Actions** and when do you use them?
6. How does **streaming with Suspense** work?
7. What is the **Edge runtime** and how does it differ from Node?
8. How does **middleware** work and what can it do?
9. What do **`'use client'`** and **`'use server'`** directives do?
10. How do you **revalidate** cached data (`revalidatePath`, `revalidateTag`)?
11. How do you handle **authentication** in the App Router?
12. How do you set **metadata / SEO** tags?
13. How do you fetch data in a **Server Component vs Client Component**?
14. How do **Image** and **Font** optimization work?
15. What is `generateStaticParams` and dynamic vs static rendering?

---

**Related:** [06-react](../06-react/) · [09-performance](../09-performance/) · [12-networking](../12-networking/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
