<div align="center">

# Data fetching patterns

<sub>▲ Next.js · 🟡 Medium · ⏱ 1h · `#data`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — In the App Router you fetch **in the Server Component with `async/await`** — no `useEffect`, no client waterfall — and the two decisions that matter are *where* (server by default, client only when you must) and *how to parallelise* so independent requests don't wait on each other.

---

## 🧠 Mental model

Data fetching moved *into the component tree, on the server*. A Server Component is an `async` function; you `await` your data right where you render it. No loading flags, no client round-trip, no exposing your API key.

The framing that separates seniors: **the danger is the waterfall.** Because you can `await` inline, it's easy to accidentally serialise independent requests — each one waiting for the previous — turning three 100ms fetches into 300ms. The job is to *await sequentially only when there's a true dependency*, and parallelise everything else.

```
❌ Waterfall (serial)          ✅ Parallel
   await user()  ─┐              const [u, p] = await Promise.all([
   await posts() ─┤ 300ms          user(), posts()   // both start at once
   await tags()  ─┘                , tags(),
                                  ]);                  // ~100ms
```

## ⚙️ How it actually works

You fetch three ways, in order of preference:

1. **Server Component `await`** — the default. Runs on the server, data goes straight into the render, secrets stay safe.
2. **Server Action** — for mutations and on-demand reads triggered by the client.
3. **Client fetch** (`useEffect`, SWR, React Query) — only for data that's *user-specific and interaction-driven*, like live search or infinite scroll after hydration.

Next extends the native `fetch` with caching controls (`cache`, `next.revalidate`, `next.tags`). Multiple identical `fetch` calls in one render pass are **deduped automatically by React request memoization** — so you can call your `getUser()` helper in the layout *and* the page without a double request. For non-`fetch` data sources (a DB client, an SDK), wrap the function in React's `cache()` to get the same per-request dedupe.

To parallelise while still streaming, **don't `await` at the top** — pass the promise down or wrap the slow part in `<Suspense>` so the rest of the page renders immediately.

## 💻 Code

```tsx
// ❌ Sequential waterfall — tags() waits for posts() waits for user()
export default async function Page() {
  const user = await getUser();
  const posts = await getPosts();   // could have started already
  const tags = await getTags();     // could have started already
  return <Feed user={user} posts={posts} tags={tags} />;
}
```

```tsx
// ✅ Parallel — independent requests fire together
export default async function Page() {
  const [user, posts, tags] = await Promise.all([getUser(), getPosts(), getTags()]);
  return <Feed user={user} posts={posts} tags={tags} />;
}
```

```tsx
// ✅ Stream the slow part: start the fetch, don't await it here, let Suspense wait
import { Suspense } from 'react';
export default function Page() {
  const slow = getSlowReport();     // NOT awaited — kicks off immediately
  return (
    <>
      <FastHeader />                {/* renders now */}
      <Suspense fallback={<Skeleton />}>
        <Report data={slow} />      {/* awaits the promise inside, streams in */}
      </Suspense>
    </>
  );
}
```

```ts
// Dedupe a non-fetch source (DB/ORM) per request
import { cache } from 'react';
export const getUser = cache(async (id: string) => db.user.find(id));
```

## ⚖️ Trade-offs

- **Server fetching is the default and it's the right one** — colocated, secure, cacheable, no client waterfall. Reach for client fetching only when data depends on post-hydration interaction.
- **`Promise.all` vs streaming is a real choice.** `Promise.all` blocks the whole render until *all* resolve (good when the page is useless without all of it). Streaming with `<Suspense>` shows the fast parts immediately and fills slow parts in (better perceived performance, but more moving parts and layout shift risk).
- **When NOT to fetch on the server:** rapidly-changing, per-interaction client state (typeahead, optimistic lists) belongs in a client component with SWR/React Query, which give you client caching, revalidation, and mutation ergonomics the server model doesn't.

## 💣 Gotchas interviewers probe

- **Accidental waterfalls.** The most probed issue. Sequential `await`s of independent data is the classic performance bug — `Promise.all` or streaming fixes it.
- **`fetch` is no longer cached by default in Next 15.** In Next 14 it was; now you opt in with `cache: 'force-cache'` or `next.revalidate`. Assuming caching is a real trap.
- **Request memoization only covers `fetch`.** For an ORM/DB call, you need React's `cache()` to dedupe — otherwise the same query runs once per component that calls it.
- **You can't fetch server data with `useEffect` and keep secrets safe** — that runs in the browser. Server data belongs in Server Components.
- **`await` at the top of a page blocks streaming** — the whole route waits. If you want the shell to paint first, move the `await` behind a `<Suspense>` boundary.
- **`searchParams` makes a page dynamic.** Reading it opts the route out of static rendering — expected, but surprises people chasing a static build.

## 🎯 Say this in the interview

> "In the App Router I fetch in the Server Component with `async/await` — data goes straight into the render, no `useEffect`, no client waterfall, and secrets stay on the server. The thing I actively watch for is the accidental waterfall: because awaiting inline is so easy, independent requests get serialised. So I use `Promise.all` for independent data, or I don't await at the top at all and wrap the slow part in `<Suspense>` so the fast parts stream first. React dedupes identical `fetch` calls per request automatically, and for a DB or SDK call I wrap it in React's `cache()` to get the same dedupe. Client fetching with something like React Query I reserve for genuinely interaction-driven data. One currency note: in Next 15 `fetch` isn't cached by default anymore, so I opt in explicitly."

## 🔗 Go deeper

- [Next.js — Data Fetching](https://nextjs.org/docs/app/building-your-application/data-fetching) — patterns and the extended `fetch`.
- [Next.js — Sequential vs Parallel fetching](https://nextjs.org/docs/app/building-your-application/data-fetching/patterns) — avoiding waterfalls.
- [React — `cache`](https://react.dev/reference/react/cache) — per-request dedupe for non-fetch sources.
