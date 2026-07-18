<div align="center">

# Backend-for-Frontend (BFF)

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#api` `#architecture`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A BFF is a thin server owned by the frontend team that sits between one specific client and your downstream services, existing to shape data for **that** client's screens. It's not an API gateway and not a microservice — it's a translation layer that trades an extra hop for a client that stops over-fetching, stops orchestrating, and stops leaking secrets.

---

## 🧠 Mental model

A generic API is a compromise: it serves web, iOS, Android and partners at once, so it can't be optimal for any of them. The mobile app wants three fields; the web dashboard wants forty and five joins. When one API tries to please everyone, the client picks up the slack — it fans out to six services, stitches responses together, and quietly grows a second application's worth of orchestration logic in the browser.

A BFF flips that. **One backend per experience, owned by the team that owns the experience.** The web team writes and deploys the web BFF; it speaks exactly the shape the web screens need. The mobile team has its own. The rule of thumb from Sam Newman: one BFF per user experience, not one per client platform — if web and desktop render the same screens, they can share a BFF.

The mental shift: the BFF is *part of your frontend*, just running on a server. It's where you put the glue code that has no business shipping to a phone over a flaky network.

## ⚙️ How it actually works

The BFF does four jobs that are genuinely awkward to do in the client:

1. **Aggregation.** One `GET /dashboard` call fans out server-side to `users`, `billing`, and `notifications` in parallel, joins them, and returns one payload. The browser makes one request over one TLS connection instead of six waterfalling round-trips.
2. **Shaping / trimming.** Downstream returns 40 fields; the BFF returns the 6 the screen renders. Less bytes on the wire, and the client's types match the UI instead of the database.
3. **Protocol & auth translation.** Downstream is gRPC or SOAP or needs an internal service token; the BFF exposes clean JSON and holds the secret. The OAuth `client_secret`, the third-party API key — those live in the BFF, never in JS the user can read.
4. **Backend-for-frontend session handling.** The BFF holds the httpOnly session cookie and exchanges it for access tokens server-side — the modern "BFF auth pattern" that keeps tokens out of `localStorage` entirely, killing an entire class of XSS token theft.

The cost you're paying: a new deployable, a new failure domain, and an extra network hop. The BFF must degrade gracefully — if `notifications` times out, return the dashboard *without* notifications, not a 500.

## 💻 Code

```js
// BFF route: aggregate + shape + fail soft. The browser sees ONE clean endpoint.
app.get('/api/dashboard', requireSession, async (req, res) => {
  const token = await tokenStore.get(req.session.id); // secret stays server-side

  // Fan out in parallel. allSettled, not all — one dead service ≠ dead page.
  const [user, billing, notes] = await Promise.allSettled([
    fetch(`${USERS}/me`,      { headers: auth(token) }),
    fetch(`${BILLING}/plan`,  { headers: auth(token) }),
    fetch(`${NOTIFY}/unread`, { headers: auth(token) }),
  ]);

  res.json({
    name:   ok(user)?.name,
    plan:   ok(billing)?.tier,
    // degrade, don't explode: notifications are non-critical
    unread: notes.status === 'fulfilled' ? await notes.value.json() : null,
  });
});
```

```js
// ❌ The same logic in the browser: 3 round-trips, secrets exposed, error handling per call
const [u, b, n] = await Promise.all([  // waterfalls if any needs the previous
  fetch('/users/me',     { headers: { 'X-Internal-Key': KEY } }), // KEY is now public
  fetch('/billing/plan', { headers: { 'X-Internal-Key': KEY } }),
  fetch('/notify/unread',{ headers: { 'X-Internal-Key': KEY } }),
]);
```

## ⚖️ Trade-offs

- **A BFF is not free architecture — it's a service you now operate.** Deploys, monitoring, on-call, latency budget. If your app talks to one well-shaped API, a BFF is pure overhead. Reach for it when you have *many* downstreams or *divergent* clients.
- **Beware the distributed monolith.** If every client's BFF calls the same 8 services and they all break together on a shared schema change, you haven't decoupled anything — you've added hops.
- **Don't let the BFF become a second monolith.** It should shape and aggregate, not own business rules. Discount logic, pricing, permissions — that belongs downstream, or two BFFs will drift and disagree.
- **When NOT to use it:** a single-client CRUD app, a static site, or when GraphQL already gives clients field-level shaping. GraphQL is arguably "a BFF you don't have to hand-write" — same problem, different tool.

## 💣 Gotchas interviewers probe

- **"BFF vs API gateway?"** A gateway is *generic* infra — routing, rate-limiting, auth — shared by all clients. A BFF is *client-specific* code owned by a *frontend* team. A gateway doesn't know or care what a screen looks like; a BFF exists precisely to know.
- **Ownership is the whole point.** The strongest answer stresses that the BFF is owned by the frontend team. If a separate backend team owns it, you've just recreated the coordination bottleneck the BFF was meant to remove.
- **One BFF per experience, not per platform.** Naively spinning up a BFF per client duplicates logic. Web + desktop rendering identical screens should share one.
- **The extra hop needs a latency budget.** BFF → 6 services means your slowest downstream sets your p99. Parallelize, set per-call timeouts, and cache aggressively — a BFF with no timeout on a fan-out is a page that hangs on one slow service.
- **BFF auth is the modern token-storage answer.** "Where do you store the JWT?" → "In an httpOnly cookie against a BFF that holds the real tokens." That signals you know `localStorage` tokens are XSS-exfiltratable.

## 🎯 Say this in the interview

> "A BFF is a thin server owned by the frontend team that sits between one client experience and the downstream services, and its whole job is to shape data for that client's screens — aggregating several service calls into one, trimming payloads to what the UI actually renders, and holding secrets and tokens server-side so they never ship to the browser. The distinction I'd draw is against an API gateway: a gateway is generic shared infrastructure, whereas a BFF is client-specific code that knows what a screen looks like. The rule I follow is one BFF per experience, not per platform, so web and desktop can share one. The cost is real — it's another deployable and an extra hop — so I only reach for it with many divergent downstreams, and I make it degrade gracefully with parallel fan-out and per-call timeouts, because otherwise one slow service hangs the whole page."

## 🔗 Go deeper

- [Sam Newman — Backends For Frontends](https://samnewman.io/patterns/architectural/bff/) — the canonical write-up that named the pattern.
- [Auth0 — The BFF Pattern](https://auth0.com/blog/the-backend-for-frontend-pattern-bff/) — the modern token-handling angle, in depth.
- [microservices.io — API Gateway / BFF](https://microservices.io/patterns/apigateway.html) — how BFF relates to the gateway pattern.
