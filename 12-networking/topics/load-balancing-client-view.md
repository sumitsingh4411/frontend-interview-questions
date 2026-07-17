<div align="center">

# Load balancing (client view)

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#scale`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A load balancer is the single public address that fans requests out across many backend servers. As a frontend engineer you rarely configure one, but you must design *as if any request can hit any server*: **assume no server-side memory of you** (or explicitly ask for stickiness), and know why sticky sessions quietly break WebSockets and deploys.

---

## 🧠 Mental model

You talk to *one* hostname; behind it sit N interchangeable servers. The load balancer (LB) is the traffic cop deciding which one gets your request, and it removes dead ones from rotation via health checks.

```
                       ┌── health check ──▶ ✔ server A
Client ──▶ api.app.com ─┼──────────────────▶ ✔ server B   ← LB picks one per request
           (one VIP)    └──────────────────▶ ✘ server C   ← failed check → out of rotation
```

The frontend consequence is a single mental rule: **any two of your requests may land on different servers.** Request 1 hits server A, request 2 (a millisecond later) hits server B. If your app *assumes* the same server remembers something from request to request, you have a bug that only appears under load or after a deploy.

## ⚙️ How it actually works

**Distribution algorithms** you should be able to name: **round-robin** (simple rotation), **least-connections** (send to the least-busy — better for uneven request durations, e.g. long-lived streams), and **IP/consistent hash** (same client → same server, the basis of stickiness). L7 LBs can also route by path/header (`/api` → one pool, `/static` → another).

**Health checks** are what make it self-healing: the LB pings each backend; a server failing checks is pulled from rotation, so a crash degrades capacity instead of erroring users. This is also how **zero-downtime deploys** work — drain connections from an instance, take it out, update, add it back.

**Sticky sessions (session affinity)** pin a client to one backend, usually via a cookie the LB sets or by hashing the client IP. You need this when the server holds **per-connection state** — most importantly a **WebSocket/SSE connection**, which lives on *one* specific server and can't be transparently moved. But stickiness fights the LB's whole purpose: it unbalances load, and when that server is drained for a deploy, its pinned clients get disconnected.

**TLS termination** usually happens *at* the LB, which then forwards plaintext (or re-encrypts) to backends — which is why the LB is also where you set the true `X-Forwarded-For` / `X-Forwarded-Proto` your app reads for the client's real IP and scheme.

## 💻 Code

```js
// The client-side reality of "any request can hit any server":
// design STATELESS. Never assume server memory between requests.

// ❌ Assumes the upload and the "commit" hit the same server's local temp dir.
await fetch('/upload/chunk', { method: 'POST', body: chunk }); // → server A's disk
await fetch('/upload/commit'); // → maybe server B: chunk isn't there. Fails under LB.

// ✅ Stateless: every request carries what it needs; state lives in shared storage.
const id = await startUpload();                       // returns an id backed by S3/Redis
await fetch(`/upload/${id}/chunk`, { method: 'POST', body: chunk }); // any server
await fetch(`/upload/${id}/commit`);                  // any server — state is shared
```

```js
// Real-time: a WebSocket lives on ONE server, so the LB must be sticky for it
// AND the client must be able to reconnect (it may land on a different server).
function connect() {
  const ws = new WebSocket('wss://api.app.com/live');
  ws.onclose = () => setTimeout(connect, backoff()); // deploy drains → reconnect elsewhere
  return ws;
}
```

## ⚖️ Trade-offs

- **Statelessness is the price of horizontal scale, and it's worth paying.** Push per-session state into shared stores (Redis, the DB, the token itself) so any server can serve any request. This is what lets the LB add/remove servers freely.
- **Sticky sessions are a smell for HTTP, a necessity for WebSocket.** For request/response APIs, needing stickiness usually means you leaked state onto a server that belongs in shared storage. For long-lived connections it's unavoidable — the socket physically lives on one box.
- **When NOT to rely on the LB:** for real-time apps, don't assume the connection survives a deploy. Servers get drained; **the client must own reconnection with backoff** and resume from a cursor. The LB won't migrate your socket for you.
- **Client-side load balancing** (the client picks among endpoints, or DNS returns multiple A records) trades LB simplicity for control — relevant for multi-region failover and reducing a single choke point.

## 💣 Gotchas interviewers probe

- **"The same server remembers me."** It doesn't, unless you made it sticky. In-memory sessions, local file uploads, and per-instance caches all silently break behind an LB. This is the #1 thing they're probing.
- **WebSockets + LB.** A socket is bound to one backend. Without session affinity the *upgrade* request and later traffic can diverge; with affinity, a deploy that drains that server kills the socket. The correct answer is **sticky routing plus client reconnect-with-backoff**, not one or the other.
- **Real client IP.** Behind an LB, your app sees the LB's IP unless it reads `X-Forwarded-For`. Rate-limiting or geolocating on the wrong IP throttles *everyone* as one client — a classic outage.
- **Health check tuning.** Too aggressive → healthy servers flap out of rotation on a blip; too lax → users get routed to a dead box. It's a real reliability dial.
- **Deploys drain connections.** Long-lived connections (SSE/WebSocket/streaming downloads) get cut when an instance is rotated out. Design for graceful disconnect + resume, not permanence.
- **Thundering reconnect after a deploy.** When a server drains, *all* its clients reconnect at once and stampede the survivors — jittered backoff on the client is mandatory.

## 🎯 Say this in the interview

> "From the frontend I never touch the load balancer config, but I design as if every request can hit a different backend — because it can. The LB is one public address fanning requests across interchangeable servers, using round-robin or least-connections, and pulling unhealthy servers via health checks. The rule that falls out of that is statelessness: I never assume a server remembers me between requests, so session state, chunked uploads, and caches live in shared storage like Redis or the token itself, not a server's local memory. The one place this gets subtle is real-time: a WebSocket physically lives on one server, so the LB needs sticky sessions for it — but stickiness means a deploy that drains that server disconnects those clients, so the client must own reconnection with jittered backoff and resume from a cursor. I'd also flag reading `X-Forwarded-For` for the real client IP, since behind the LB everything otherwise looks like it comes from one address."

## 🔗 Go deeper

- [Cloudflare — What is load balancing?](https://www.cloudflare.com/learning/performance/what-is-load-balancing/) — algorithms, health checks, and the core model.
- [Cloudflare — What is session affinity / sticky sessions?](https://www.cloudflare.com/learning/performance/what-is-session-affinity/) — when stickiness is needed and its costs.
- [MDN — `X-Forwarded-For`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Forwarded-For) — recovering the real client IP behind proxies/LBs.
