<div align="center">

# Edge runtime

<sub>▲ Next.js · 🔴 Hard · ⏱ 45m · `#edge` `#performance`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The Edge runtime is **not Node.js**: it's a stripped-down V8-isolate environment (the Web-standard "WinterCG" API surface) that boots in ~milliseconds and runs in ~300 locations near the user. You trade every Node built-in and most of npm for near-zero cold starts and geographic proximity. It is a latency tool, not a horsepower tool.

---

## 🧠 Mental model

Next.js gives you **two** server runtimes, and the choice is per-route (or global for middleware):

| | Node.js runtime | Edge runtime |
|---|---|---|
| Underneath | A full Node process | A V8 **isolate** (like a Cloudflare Worker) |
| Cold start | 100s of ms – seconds | ~0–5 ms (isolates, not containers) |
| APIs | All of Node + npm | Web standards only (`fetch`, `Request`, `Web Crypto`, `TextEncoder`) |
| `fs`, `net`, native addons | ✅ | ❌ throws at build/run time |
| Location | A few regions | The CDN edge, near the user |
| Bundle limit | Generous | Small (1–4 MB on Vercel, plan-dependent) |

The right framing: **Node is a computer; the Edge is a function that runs everywhere at once.** You don't pick Edge because it's "faster code" — the CPU is often *weaker* and time-limited. You pick it because the request never has to travel to `us-east-1` and back, and because it's already warm.

## ⚙️ How it actually works

An isolate is a sandboxed V8 context, not an OS process. The platform keeps one V8 instance hot and spins up a fresh **isolate** per request in microseconds — that's why there's effectively no cold start, and why you can't have long-lived global state, background timers, or a warmed-up connection pool the way you can in Node.

The API surface is **WinterCG** (the Web-interoperable runtime standard): `fetch`, `Request`/`Response`, `URL`, `Headers`, `ReadableStream`, `crypto.subtle`, `atob`. Anything importing `node:fs`, `node:crypto`'s Node API, or a native `.node` addon fails. Crucially this is transitive — a "pure JS" library that deep-imports `Buffer` internals or `process.version` can break your build even if *your* code is clean.

You opt in per route:

```ts
export const runtime = 'edge'; // in a route.ts, page.tsx, or layout
```

Middleware is the one place that is **Edge by default** — it runs before the cache on every matched request, so it must be tiny and cannot touch the database directly in most setups.

Two consequences people miss:

- **CPU time is metered, not wall-clock.** Edge functions cap *compute* (e.g. ~50 ms CPU on some tiers). You can `await fetch` a slow upstream for seconds — waiting isn't CPU — but a heavy JSON parse or crypto loop will get killed.
- **No connection pooling.** Every isolate is short-lived, so a raw TCP Postgres connection is a disaster (connection storms). You need an HTTP-based data layer — a driver over HTTP (Neon, PlanetScale's `fetch` driver, Supabase REST) or a pooler like PgBouncer fronted by HTTP.

## 💻 Code

```ts
// app/api/geo/route.ts — a perfect Edge use case: pure I/O + geo-awareness
export const runtime = 'edge';

export async function GET(req: Request) {
  // Geo headers are injected by the edge network — free, no lookup
  const country = req.headers.get('x-vercel-ip-country') ?? 'US';

  // ✅ Web fetch to an HTTP data source — no TCP pool, no Node driver
  const res = await fetch(`https://api.example.com/prices?country=${country}`, {
    next: { revalidate: 60 }, // cached at the edge for 60s
  });

  return Response.json(await res.json());
}
```

```ts
// ❌ This will NOT build on the Edge runtime
export const runtime = 'edge';
import fs from 'node:fs';           // no filesystem in an isolate
import { Client } from 'pg';        // raw TCP driver — connection storm
export async function GET() {
  const tpl = fs.readFileSync('./email.html'); // throws
  // ...
}
```

## ⚖️ Trade-offs

- **When NOT to use it:** CPU-heavy work (image/PDF generation, big crypto, ML inference), anything needing a Node library with native bindings, or a route that talks to a traditional pooled Postgres. Node runtime is the correct, boring default for most app routes.
- **Edge shines for:** middleware (auth checks, A/B redirects, geo-routing, bot filtering), streaming AI responses (isolates stream `ReadableStream` beautifully and stay cheap while waiting), personalization at the CDN, and light read-through API routes.
- **The proximity trap:** the edge function is near the user, but if it then calls your database in a single region, you've added a slow hop *from* the edge to the DB. Edge is a net win only when the data is also global (edge KV, replicated reads) or the upstream is itself a global API.
- **Bundle ceiling is real.** Pull in a fat SDK and you'll blow the size limit. Edge rewards small, dependency-light handlers.

## 💣 Gotchas interviewers probe

- **"Edge is faster" is a junior answer.** The isolate CPU is usually *slower* than a Node server. The win is cold-start elimination + geographic proximity, not raw throughput. Say that.
- **Middleware runs on every matched request, before the cache.** A `matcher` that's too broad (or missing) means your auth logic runs on every static asset. Always scope the `config.matcher`.
- **No `Node Buffer`, no `process.cwd()`, no dynamic `require`.** Libraries that feature-detect Node can silently take the wrong branch.
- **Environment variables** are inlined at build for Edge — you can't rely on runtime-only secrets the same way; check your platform's model.
- **Database connections:** the classic failure is a raw Postgres client in an Edge route under load → thousands of isolates → connection exhaustion. HTTP drivers exist precisely because of this.
- **`export const runtime = 'edge'` is per-segment.** A page and its API route can differ; a layout's runtime doesn't force its children.

## 🎯 Say this in the interview

> "The Edge runtime is a V8 isolate, not Node — so it boots in microseconds with no cold start and runs physically close to the user, but you only get Web-standard APIs: `fetch`, Web Crypto, streams, no `fs`, no native addons, small bundle budget. I reach for it when the work is I/O-bound and latency-sensitive — middleware doing auth or geo-redirects, or streaming an LLM response — because waiting on `fetch` doesn't burn the metered CPU. I *avoid* it for CPU-heavy work or anything needing a pooled TCP database, because isolates are short-lived and cause connection storms; there I use an HTTP-based driver or just stay on the Node runtime. The mistake I watch for is assuming Edge is 'faster code' — the CPU is often weaker; the win is proximity and zero cold start, and only when the data is also global."

## 🔗 Go deeper

- [Next.js — Edge runtime](https://nextjs.org/docs/app/api-reference/edge) — the exact supported/unsupported API list.
- [Next.js — Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) — the one Edge-by-default surface, with `matcher`.
- [WinterCG — Minimum Common Web Platform API](https://common-min-api.proposal.wintercg.org/) — the standard the Edge runtime implements.
- [Vercel — Edge Functions limits](https://vercel.com/docs/functions/runtimes/edge) — real size and CPU-time numbers.
