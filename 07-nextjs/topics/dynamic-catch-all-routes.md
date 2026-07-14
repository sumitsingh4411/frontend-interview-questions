<div align="center">

# Dynamic & catch-all routes

<sub>▲ Next.js · 🟡 Medium · ⏱ 30m · `#routing`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Bracket folders turn URL segments into params: `[id]` matches **one** segment, `[...slug]` matches **one or more**, and `[[...slug]]` matches **zero or more**; you enumerate which values to pre-build with `generateStaticParams`, and unlisted ones fall back to on-demand rendering.

---

## 🧠 Mental model

Static folders match literal path segments; **bracketed folders capture them as params**. The number of brackets is a quantifier:

| Folder | Matches | Example URL | `params` |
|---|---|---|---|
| `[id]` | exactly one segment | `/posts/42` | `{ id: '42' }` |
| `[...slug]` | one or more | `/docs/a/b/c` | `{ slug: ['a','b','c'] }` |
| `[[...slug]]` | **zero** or more | `/docs` *and* `/docs/a/b` | `{ slug: undefined \| [...] }` |

The distinction that trips people: a **catch-all** `[...slug]` does *not* match the parent route (`/docs` 404s), but an **optional catch-all** `[[...slug]]` does — the double brackets are what let the base path fall through to the same page. That's the whole reason optional catch-alls exist.

## ⚙️ How it actually works

`params` is passed to `page`, `layout`, `route`, and `generateMetadata`. In Next 15 it's a **Promise** — you `await` it. Values are always strings (or string arrays); there's no type coercion, so `/posts/42` gives you `'42'`, not `42`.

To decide *which* param values are pre-rendered at build, you export **`generateStaticParams`** (the App Router successor to `getStaticPaths`). Whatever it returns is built statically; requests for values it *didn't* return are, by default, **server-rendered on first request and then cached** — the App Router equivalent of `fallback: 'blocking'`. You control that fallthrough with `dynamicParams`:

```ts
export const dynamicParams = false; // params NOT in generateStaticParams → 404
```

## 💻 Code

```tsx
// app/blog/[slug]/page.tsx
export async function generateStaticParams() {
  const posts = await getPosts();
  return posts.map((p) => ({ slug: p.slug })); // these are built at build time
}

export default async function Post({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;          // Next 15: await it
  const post = await getPost(slug);
  if (!post) notFound();                  // → renders the nearest not-found.tsx
  return <article>{post.title}</article>;
}
```

```tsx
// app/docs/[[...slug]]/page.tsx — one page for /docs AND /docs/a/b/c
export default async function Docs({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug = [] } = await params;     // undefined at "/docs"
  const path = slug.join('/') || 'index';
  return <Doc path={path} />;
}
```

```tsx
// Nested dynamic segments compose:
// app/[category]/[product]/page.tsx  →  params = { category, product }
```

## ⚖️ Trade-offs

- **Pre-build the hot paths, lazily render the long tail.** `generateStaticParams` for your top 500 products gives instant static delivery; the millionth product still works via on-demand render + cache. This is the sweet spot most sites want.
- **`dynamicParams = false` trades flexibility for a guarantee** — it turns your static param list into an allowlist, returning 404 for anything else. Good for a fixed set of routes; wrong for user-generated content.
- **Don't over-nest dynamic segments.** `[a]/[b]/[c]` is legal but ambiguous URLs get hard to reason about and to type. A catch-all is often clearer than three nested params.

## 💣 Gotchas interviewers probe

- **Catch-all vs optional catch-all.** `[...slug]` does *not* match the base path; `[[...slug]]` does. Getting a 404 on `/docs` while `/docs/x` works is the tell you needed double brackets.
- **`params` is async in Next 15.** Destructuring it synchronously (`{ params: { slug } }`) is now a bug — you must `await params`. This is a frequent migration break.
- **Params are always strings.** `/items/007` yields `'007'`; comparing to a number silently fails.
- **Route conflicts resolve by specificity** — a static segment (`/shop/new`) beats a dynamic one (`/shop/[id]`). Two dynamic siblings at the same level (`[id]` and `[slug]`) is an error.
- **`notFound()` and `redirect()`** are the idiomatic escape hatches inside dynamic pages — they throw and unwind to the nearest boundary, so code after them never runs.

## 🎯 Say this in the interview

> "Bracket folders capture URL segments as params, and the number of brackets is a quantifier: `[id]` is exactly one segment, `[...slug]` is one or more, and `[[...slug]]` is zero or more. The key distinction is that a plain catch-all doesn't match the parent path but an optional catch-all does — that's why the double-bracket form exists, so `/docs` and `/docs/a/b` hit the same page. I decide what to pre-render with `generateStaticParams`; anything not listed is server-rendered on first request and cached, unless I set `dynamicParams = false` to make the list a strict allowlist. Two things I'm careful about: params are strings, and in Next 15 `params` is a Promise so I have to await it."

## 🔗 Go deeper

- [Next.js — Dynamic Routes](https://nextjs.org/docs/app/building-your-application/routing/dynamic-routes) — all three bracket forms.
- [Next.js — `generateStaticParams`](https://nextjs.org/docs/app/api-reference/functions/generate-static-params) — pre-rendering param values.
- [Next.js — `notFound`](https://nextjs.org/docs/app/api-reference/functions/not-found) — the idiomatic 404 path.
