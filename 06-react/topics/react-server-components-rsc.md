<div align="center">

# React Server Components (RSC)

<sub>⚛️ React · 🔴 Hard · ⏱ 1.5h · `#rsc` `#rendering`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Components that render **only on the server**, ship **zero JavaScript** to the client, and can touch server resources directly (DB, filesystem, secrets). They render to a **serialized UI description** (the "flight" payload), not HTML — and they **never hydrate**. `'use client'` marks the boundary where interactive components take over. **RSC is not SSR.**

---

## 🧠 Mental model

The instinct is "server components are SSR." They're not, and conflating them is the classic miss.

- **SSR** takes your *client* components, runs them once on the server to produce **HTML**, sends it, then **hydrates** — the same components boot up again on the client with all their JS.
- **RSC** are components that exist *only* on the server. They produce a **serialized tree** (elements + references to client components), never run on the client, have **no state, no effects, no event handlers, and ship no JS**.

So the tree is a sandwich: server components form the static, data-fetching shell; `'use client'` components are the interactive leaves. A server component can be `async` and `await` its data inline — no `useEffect`, no loading state, no API route.

## ⚙️ How it actually works

`'use client'` is a **directive at the top of a module** that marks a boundary in the import graph. Everything not behind a `'use client'` door is a server component (in an RSC framework). At that boundary the bundler splits: server code stays on the server; the client module and its dependencies are code-split into a chunk.

Server components render in a server environment to the **RSC payload** — a streaming, JSON-like description where host elements are inlined and client components appear as **references** (a module id + serialized props). The client runtime receives this stream, downloads only the referenced client chunks, and reconciles the payload into the React tree — merging server output and client interactivity into one tree.

The hard rule at the boundary: **props crossing server → client must be serializable.** Strings, numbers, plain objects, arrays, promises, and Server Actions pass; **functions, class instances, and Dates (as behaviour) do not**. And you don't `import` a server component into a client component — instead you **pass it as `children`/props** (the "donut" pattern), so the server renders it and hands the client an already-rendered slot.

## 💻 Code

```jsx
// Server Component (default in an RSC framework) — async, direct data access.
import { db } from '@/lib/db';           // never bundled to the client
export default async function Page() {
  const posts = await db.post.findMany(); // no fetch, no useEffect, no API route
  return (
    <main>
      {posts.map((p) => <Article key={p.id} post={p} />)}
      <LikeButton postId={posts[0].id} /> {/* a client component */}
    </main>
  );
}
```

```jsx
// Client Component — opts INTO the bundle to be interactive.
'use client';
import { useState } from 'react';
export function LikeButton({ postId }) {
  const [liked, setLiked] = useState(false);      // state ⇒ must be client
  return <button onClick={() => setLiked((v) => !v)}>{liked ? '♥' : '♡'}</button>;
}
```

```jsx
// ❌ Importing a server component into a client one doesn't work.
// ✅ The donut: pass server-rendered UI through as children.
'use client';
export function Panel({ children }) { /* interactive shell */ return <div>{children}</div>; }
// <Panel><ServerHeavyContent /></Panel>  ← server renders the filling
```

## ⚖️ Trade-offs

- **The win is bundle size and data locality.** Markdown renderers, date libraries, ORMs, and syntax highlighters run on the server and ship **0 KB**. Data access needs no API layer, and secrets never leave the server.
- **It requires a framework and bundler integration.** RSC isn't something you flip on in a plain Vite SPA — it needs the App Router / a compatible bundler that understands the directives and flight protocol.
- **Client components are still SSR'd.** `'use client'` doesn't mean "renders only on the client" — it means "also ships to the client and hydrates." It's an *addition* of a runtime, not a relocation.
- **The serialization boundary constrains your API.** You'll refactor to keep props serializable and to push interactivity down to small leaves. That discipline is the cost of the zero-JS default.

## 💣 Gotchas interviewers probe

- **"RSC is just SSR."** The distinguishing answer: SSR produces HTML and hydrates; RSC produce a serialized tree and never hydrate, never ship JS. Know this cold.
- **Server components can't use `useState`, `useEffect`, event handlers, or browser APIs.** The moment you need any of those, it must be a client component.
- **`'use client'` marks a boundary, not a file.** Everything imported *into* a client module becomes client code too — so put the directive as low in the tree as possible to keep the server portion large.
- **You can't `import` a server component into a client component.** Pass it as `children`/props — the donut pattern — so the server still renders it.
- **Props must serialize.** Passing a function (other than a Server Action), a class instance, or expecting a live `Date` across the boundary fails.
- **React Context doesn't reach server components.** They run before/outside the client tree; provide data via props or server-side sources instead.

## 🎯 Say this in the interview

> "Server Components render only on the server, ship no JavaScript, and can hit the database or filesystem directly — a server component can be async and await its data inline. The distinction I lead with is that this is *not* SSR: SSR runs your client components on the server to produce HTML and then hydrates them, whereas server components produce a serialized tree, never hydrate, and never send their code to the client. `'use client'` marks the boundary where interactive leaves take over — and those client components are still SSR'd, so the directive means 'also ship to the client,' not 'client-only.' The practical constraints I keep in mind: props crossing into a client component have to be serializable, and you compose server content into client components as children rather than importing them. The payoff is big bundle savings — heavy server-only libraries ship zero bytes — and data access without an API layer."

## 🔗 Go deeper

- [react.dev — Server Components](https://react.dev/reference/rsc/server-components) — the mental model, async components, and boundaries.
- [react.dev — `'use client'`](https://react.dev/reference/rsc/use-client) — how the directive splits the module graph.
- [react.dev — `'use server'`](https://react.dev/reference/rsc/use-server) — the mutation counterpart, Server Actions.
- [Next.js — Server & Client Components](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns) — the donut/composition patterns in a real framework.
