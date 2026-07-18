<div align="center">

# Route handlers (API)

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#api`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `route.ts` files define API endpoints using the **Web `Request`/`Response`** standard (not Node's `req`/`res`): export a function named after the HTTP method (`GET`, `POST`…), return a `Response`, and it's served at that segment's path — the App Router replacement for `pages/api`.

---

## 🧠 Mental model

A segment can serve **either UI or an API, never both** — `page.tsx` renders a page, `route.ts` handles requests. Route handlers embrace Web Platform standards: your handler receives a `Request` and returns a `Response`, the same objects you'd use in a Service Worker or on the Edge. That's a deliberate move away from the Pages Router's Node-specific `(req, res)`:

```ts
// app/api/users/route.ts  →  serves /api/users
export async function GET(request: Request) {
  return Response.json({ users: [] });
}
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ created: body }, { status: 201 });
}
```

One HTTP method = one exported function. Unhandled methods automatically return `405 Method Not Allowed`.

## ⚙️ How it actually works

The handler runs on the server (Node.js runtime by default, or `export const runtime = 'edge'`). Next augments the standard `Request` with `NextRequest`, adding conveniences like `request.nextUrl.searchParams` and `request.cookies`. For responses, `NextResponse` adds helpers (`.json()`, `.redirect()`, cookie setters).

**Caching changed in Next 15.** In Next 14, `GET` handlers were cached by default; in **Next 15 they are dynamic (uncached) by default**. You opt a `GET` back into static caching with `export const dynamic = 'force-static'`. Non-GET methods are never cached. This flip is a favourite interview probe because it silently changes behaviour on upgrade.

Dynamic segments work here too: `app/api/posts/[id]/route.ts` receives `{ params }` (async in Next 15) as the second argument.

## 💻 Code

```ts
// app/api/posts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;                    // Next 15: async params
  const q = req.nextUrl.searchParams.get('fields'); // query string
  const post = await db.post.find(id);
  if (!post) return new NextResponse('Not found', { status: 404 });
  return NextResponse.json(post);
}
```

```ts
// Streaming a response with a ReadableStream (e.g. LLM tokens, SSE)
export async function GET() {
  const stream = new ReadableStream({
    async start(controller) {
      for (const chunk of await source()) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
}
```

```ts
// Setting cookies on the response
export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('session', token, { httpOnly: true, secure: true, sameSite: 'lax' });
  return res;
}
```

## ⚖️ Trade-offs

- **Route handlers are for *external* consumers** — webhooks, third-party integrations, mobile clients, public REST/GraphQL. They give you full control over status, headers, and streaming.
- **For your own app's mutations, prefer Server Actions.** You don't need a hand-rolled `POST` endpoint plus client `fetch` plumbing to submit a form — a Server Action does it with less code, progressive enhancement, and type safety. Route handlers are the answer when the *client isn't your own React app*.
- **Reading data for your own pages? Just fetch in the Server Component.** Creating an internal `GET /api/x` and fetching it from your own server component is a needless round-trip — call the data source directly. Route handlers earn their place at the app's *edges*, not between your own server components and their data.

## 💣 Gotchas interviewers probe

- **Next 15 flipped `GET` caching to off by default.** Code that "worked" (cached) in 14 becomes dynamic in 15. Know `dynamic = 'force-static'` to opt back in.
- **`route.ts` and `page.tsx` can't coexist in the same segment.** A folder is either a page or an endpoint.
- **Web standard, not Node.** There's no `res.json()` — you *return* a `Response`. Candidates from the Pages Router reach for `res.status(200).send()` and it doesn't exist.
- **CORS isn't automatic.** You set `Access-Control-*` headers yourself (or in middleware) and handle `OPTIONS` preflight explicitly.
- **The "internal API" anti-pattern.** Building `/api/products` just so your own server component can fetch it doubles the latency. Fetch the DB directly in the component; expose an endpoint only for outside callers.
- **`params` is async in Next 15** here too — the second-argument `{ params }` is a Promise.

## 🎯 Say this in the interview

> "Route handlers are the App Router's API layer — a `route.ts` file exporting functions named after HTTP methods, built on the Web `Request`/`Response` standard rather than Node's `req`/`res`. A segment is either a page or a route handler, not both. I reach for them when the caller *isn't* my own React app — webhooks, mobile clients, public APIs — because for my own app's mutations, Server Actions are less code and give progressive enhancement, and for reading data into my own pages I just fetch directly in the Server Component. Two currency details I'd flag: in Next 15, `GET` handlers are dynamic by default — the opposite of Next 14 — so I use `dynamic = 'force-static'` to cache one, and `params` is now async."

## 🔗 Go deeper

- [Next.js — Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers) — methods, caching, dynamic segments.
- [MDN — Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) — the standard interface handlers are built on.
- [Next.js — NextRequest / NextResponse](https://nextjs.org/docs/app/api-reference/functions/next-request) — the Next-specific conveniences.
