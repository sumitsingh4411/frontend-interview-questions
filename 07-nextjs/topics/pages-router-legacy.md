<div align="center">

# Pages Router (legacy)

<sub>▲ Next.js · 🟢 Easy · ⏱ 45m · `#routing`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The Pages Router renders **one component per file** and decides rendering strategy through **data-fetching functions** (`getStaticProps`, `getServerSideProps`, `getStaticPaths`) that run only on the server; it's stable, still supported, and worth knowing because most production Next.js in the wild still runs on it.

---

## 🧠 Mental model

In the Pages Router, `pages/` maps files to routes and each file default-exports **one page component that runs on both server and client** (classic hydration). The question "when does my data load?" is answered by *which magic async function you export*, not by where you call `fetch`:

| Export | Strategy | Runs |
|---|---|---|
| `getStaticProps` | Static (SSG) | at build time |
| `getStaticProps` + `revalidate` | ISR | build + on a timer |
| `getServerSideProps` | SSR | on every request |
| _(none)_ | Static, no data | build time |

These functions are **stripped from the client bundle** — they never ship to the browser, so you can safely query a database or read secrets inside them. That server/client split is done at the *page* level, unlike the App Router's per-component boundary.

## ⚙️ How it actually works

Next runs the data function on the server, serialises its return value into `props`, and passes it to your page. The result is hydrated in the browser as a normal React app. Two special files shape every page:

- **`_app.tsx`** wraps every page — the place for global CSS, providers, and persistent layout.
- **`_document.tsx`** customises the server-rendered HTML shell (`<html>`, `<body>`, lang, font `<link>`s). It renders **once on the server only** — no event handlers, no `useEffect`.

Client navigation uses `next/link` and `useRouter` from `next/router` (note: *not* `next/navigation`, that's App Router). API routes live in `pages/api/*` and export a `(req, res)` handler — the Node-style request/response model, in contrast to the App Router's Web `Request`/`Response`.

## 💻 Code

```jsx
// pages/blog/[slug].js — SSG with dynamic paths
export async function getStaticPaths() {
  const slugs = await getAllSlugs();
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: 'blocking', // unknown slugs are SSR'd on first hit, then cached
  };
}

export async function getStaticProps({ params }) {
  const post = await getPost(params.slug);
  if (!post) return { notFound: true };      // → 404
  return { props: { post }, revalidate: 60 }; // ISR: re-gen at most every 60s
}

export default function Post({ post }) {
  return <article>{post.title}</article>;      // runs on server AND client
}
```

```jsx
// pages/api/user.js — API route, Node req/res style
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  res.status(200).json({ name: 'Ada' });
}
```

## ⚖️ Trade-offs

- **Simplicity and stability.** The mental model is smaller: one component per page, one data function, classic hydration. Nothing streams, nothing is a "boundary". For CRUD apps and content sites it's completely adequate and battle-tested.
- **The cost is bundle size and rigidity.** The whole page hydrates on the client, so *all* of a page's component JS ships — there's no per-component server/client split, no partial hydration, no streaming a slow section independently.
- **When NOT to migrate:** don't rewrite a working Pages Router app to App Router "because it's newer". Migrate when you specifically want RSC benefits — smaller bundles, streaming, server-side data colocated in components. The two routers coexist, so migrate incrementally.

## 💣 Gotchas interviewers probe

- **`getServerSideProps` runs on *every* request** — it opts the page fully out of caching. Reaching for it when `getStaticProps` + ISR would do is a common performance mistake.
- **`getStaticPaths` `fallback` has three modes** and they behave very differently: `false` (404 for unlisted paths), `true` (serve a loading state, then hydrate), `'blocking'` (SSR on first hit, no loading flash). Interviewers love this one.
- **You cannot call data functions from components** — only page files export them. Nested components get data via props or client fetching.
- **`next/router` vs `next/navigation`.** Importing the wrong `useRouter` for your router is a classic copy-paste bug; the APIs differ (`router.query` vs `useParams`/`useSearchParams`).
- **`_document` is server-only.** Putting interactivity or hooks there silently fails.

## 🎯 Say this in the interview

> "The Pages Router is the original file-system router: one component per file in `pages/`, and you pick the rendering strategy by which data function you export. `getStaticProps` is build-time static, add `revalidate` and it becomes ISR, `getServerSideProps` is per-request SSR, and `getStaticPaths` enumerates dynamic routes for SSG. Those functions run only on the server and are stripped from the client bundle, so they're safe for secrets and DB queries. The trade-off versus the App Router is that the whole page hydrates on the client — there's no per-component server/client boundary and nothing streams. It's still fully supported and it's what most production Next runs on, so I know it, but for new projects with real server data I'd default to the App Router."

## 🔗 Go deeper

- [Next.js — Pages Router](https://nextjs.org/docs/pages) — the full legacy reference.
- [Next.js — `getStaticProps`](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-static-props) — SSG and ISR mechanics.
- [Next.js — `getServerSideProps`](https://nextjs.org/docs/pages/building-your-application/data-fetching/get-server-side-props) — when per-request rendering is right.
