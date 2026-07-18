<div align="center">

# Middleware

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#routing` `#auth`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Middleware is **one function that runs before the cache**, on every matched request, with no database and no Node APIs — which makes it the right place for redirects, rewrites and header stamping, and the *wrong* place for your actual authorization logic.

---

## 🧠 Mental model

Middleware is not a server layer. It's a **request interceptor sitting in front of the CDN cache**, and that position defines everything about it.

```
request → [ middleware ] → route cache → render → response
             ↑ runs on EVERY matched request, cached or not
             ↑ no DB drivers, no fs, ~few ms budget
```

Because it runs before the cache lookup, it's the only code that sees a request that would otherwise be served as a static file. That's the superpower: you can redirect an unauthenticated user *without* de-optimising the page into dynamic rendering. It's also the trap: everything you do here costs latency on **every single request**, including the ones you were proud of making static.

The right framing: **middleware decides where a request goes; it does not decide what a request is allowed to do.** Routing, not authorization.

## ⚙️ How it actually works

One `middleware.ts` at the project root (next to `app/`). Not per-route — one file, one function, and a `matcher` that narrows what it touches.

It runs in the **Edge runtime** by default: Web `Request`/`Response`, `fetch`, `crypto.subtle` — no `pg`, no `fs`, no `jsonwebtoken` reaching for Node crypto. This is why "just verify the session in middleware" collapses: you cannot hit your database from there, so you either verify a stateless JWT (fine) or you make a network round-trip on every request (bad).

The return value drives one of four behaviours:

| Return | Effect |
|---|---|
| `NextResponse.next()` | Continue to the route. Attach headers/cookies here. |
| `NextResponse.redirect(url)` | 307/308 to the client. URL changes. |
| `NextResponse.rewrite(url)` | Serve a *different* route. URL stays. A/B tests, i18n, proxying. |
| `new Response(...)` | Short-circuit entirely. Return 401/403 without rendering. |

The `matcher` is compiled to a regex **at build time**, so it must be statically analysable — no runtime variables, no computed arrays. Getting this wrong is the classic self-inflicted wound: an unmatched middleware fires on `/_next/static/*`, every image, and every favicon request.

## 💻 Code

```ts
// middleware.ts — root of the project, NOT inside app/
import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Web Crypto — works on Edge. `jsonwebtoken` does NOT.

const secret = new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('session')?.value;

  // ✅ Optimistic check only: is there a structurally valid session?
  // The real authorization still happens in the page/Server Action.
  if (!token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('from', req.nextUrl.pathname); // preserve intent
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const res = NextResponse.next();
    // Pass verified claims down — headers are the only channel to the route.
    res.headers.set('x-user-id', String(payload.sub));
    return res;
  } catch {
    // Expired/tampered → clear the cookie so we don't redirect-loop.
    const res = NextResponse.redirect(new URL('/login', req.url));
    res.cookies.delete('session');
    return res;
  }
}

export const config = {
  // ✅ Statically analysable. Excludes static assets — otherwise you pay on every .js chunk.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg)$).*)'],
};
```

```ts
// ❌ The mistake: treating the middleware check as the security boundary.
// app/admin/page.tsx
export default async function AdminPage() {
  return <Secrets />; // "middleware already checked" — no, it didn't.
}

// ✅ Re-verify at the data access layer. Middleware is a UX shortcut, not a gate.
export default async function AdminPage() {
  const user = await requireUser();          // reads + verifies the session properly
  if (user.role !== 'admin') notFound();     // 404, not 403 — don't leak existence
  return <Secrets />;
}
```

## ⚖️ Trade-offs

- **It's the only pre-cache hook you get.** Redirect a logged-out user away from a statically generated page without making that page dynamic — nothing else in the framework can do that.
- **It taxes every request.** A 30ms middleware on a page with a 5ms cache hit made your site 7× slower. Budget it in single-digit milliseconds and never `await` your own API from it.
- **No Node runtime, realistically.** Node middleware exists in recent versions but is opt-in and loses the "runs everywhere, instantly" property that made middleware attractive. If you need a database, you need a route handler or a Server Component.
- **Don't use it for authorization.** Cookie presence ≠ permission. The CVE-2025-29927 bypass — a spoofable internal header that let attackers skip middleware entirely — is the definitive argument: any security model whose only gate is middleware is one header away from being no gate at all.
- **One file, global blast radius.** Every team's redirect logic accretes into the same function. At scale it becomes a router-shaped monolith with no ownership.

## 💣 Gotchas interviewers probe

- **"Can you check the user's role in middleware?"** Only if the role is *in the token*. You have no DB. Saying "I'd query the users table" is an instant tell that you don't know where this code runs.
- **The matcher must be a literal.** Building it from a variable silently fails — it's compiled at build time, not evaluated per request.
- **Redirect loops.** Middleware matches `/login`, `/login` has no session, redirect to `/login`… Always exclude your auth routes from the matcher or guard the pathname explicitly.
- **Middleware runs on prefetches too.** `<Link>` prefetching fires real requests through it, so side effects (rate limit counters, analytics, "last seen" writes) get triggered for pages the user never visits.
- **`NextResponse.next()` cookies vs request cookies.** Setting a cookie on the *response* doesn't make it visible to `cookies()` in the route on the same request. Mutating the request and the response are two different jobs; people wire one and expect both.
- **Rewrite ≠ redirect.** Rewrite keeps the URL and re-runs matching internally — which means a rewrite to a matched path can re-enter middleware. Redirect costs a round-trip but is honest about the URL.
- **Middleware is not guaranteed to be geographically close to your data.** Edge means close to the *user*. If the request then hits a database in us-east-1 anyway, you've added a hop, not removed one.

## 🎯 Say this in the interview

> "Middleware is a single root-level function that runs before the cache on every matched request, in the Edge runtime — so no database, no Node built-ins, and a few milliseconds of budget. That position makes it perfect for redirects, rewrites and header stamping, because I can bounce a logged-out user off a *static* page without forcing that page to render dynamically. But I'm deliberate about scope: I treat it as an optimistic UX check — is there a session cookie, does the JWT verify — and I re-authorize properly in the Server Component or Server Action that actually touches data. Middleware isn't a security boundary; CVE-2025-29927 proved that when a spoofed header let people skip it entirely. And I always write a tight matcher, otherwise it fires on every static chunk and taxes the whole site."

## 🔗 Go deeper

- [Next.js — Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware) — the matcher rules, response helpers, and runtime constraints.
- [Next.js — Authentication](https://nextjs.org/docs/app/building-your-application/authentication) — explicitly frames middleware as optimistic and the data layer as the real gate.
- [MDN — Request](https://developer.mozilla.org/en-US/docs/Web/API/Request) — `NextRequest` is this plus cookies and `nextUrl`; knowing the base API is most of the job.
- [jose](https://github.com/panva/jose) — Web Crypto JWTs, the reason Edge token verification is viable at all.
