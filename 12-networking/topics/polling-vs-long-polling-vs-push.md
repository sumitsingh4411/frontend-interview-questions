<div align="center">

# Polling vs long-polling vs push

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#realtime` `#patterns`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Three ways to learn about server-side changes: **short-poll** (ask on a timer — simple, laggy, wasteful), **long-poll** (ask and let the server *hold* the request until it has news — near-real-time over plain HTTP), and **push** (the server keeps a connection and speaks first — WebSocket/SSE). The real decision is *latency budget vs infrastructure cost*, not "which is newest".

---

## 🧠 Mental model

The question every real-time feature answers is: **how does the client find out something changed?** There are only three shapes.

```
SHORT-POLL   C→S "anything?"  S→C "no"   (wait 5s)  C→S "anything?" S→C "yes, here"
             └ latency ≈ poll interval; N requests whether or not there's news

LONG-POLL    C→S "anything?" … S holds … (event!) … S→C "yes, here"  C→S "anything?" …
             └ latency ≈ 0; one request PER message; reconnect after each

PUSH         C→S open stream ─────────────▶  S→C msg  S→C msg  S→C msg …
             └ latency ≈ 0; one connection, server writes whenever it likes
```

Short-poll trades latency and bandwidth for dead-simple statelessness. Long-poll buys you push-like latency **using nothing but HTTP request/response** — the trick is the server not answering until it has something. Push is a genuinely persistent pipe. Everything else is a detail.

## ⚙️ How it actually works

**Short-polling** is a `setInterval` around `fetch`. Latency averages *half your interval*; a 10s poll means ~5s average staleness. Worse, you pay full request overhead (TLS resumption, headers, auth, a DB hit) every tick **even when nothing changed** — for 100k idle users that's a firehose of pointless load.

**Long-polling** flips the wait to the server. The client sends a request; the server **blocks it** (holds the socket open, no response yet) until an event arrives or a timeout (~30s) fires, then responds. The client immediately re-requests. So there's always exactly one request "parked" per client, and the moment the server has news it replies instantly — latency approaches zero. The cost: a held request ties up a connection/worker, and there's a **microscopic gap** between "server responds" and "client re-requests" where an event can be missed unless the server buffers by cursor/ID.

**Push** (WebSocket or SSE) removes the re-request entirely: one long-lived connection, server writes frames whenever it wants. Lowest latency and overhead per message — but you now own connection lifecycle, reconnect/backoff, heartbeats, and sticky-session routing through your load balancer.

## 💻 Code

```js
// SHORT-POLL — fine for "eventually" data (build status, low-stakes counters)
setInterval(async () => {
  const r = await fetch('/api/status');
  render(await r.json());
}, 5000); // ← latency you're accepting: up to 5s

// LONG-POLL — near-real-time with only fetch(). Note the cursor + immediate re-arm.
async function subscribe(cursor = 0) {
  while (true) {
    try {
      const r = await fetch(`/api/updates?since=${cursor}`); // server HOLDS this
      if (r.status === 204) continue;          // server timed out → re-poll, no gap
      const batch = await r.json();
      for (const ev of batch.events) apply(ev);
      cursor = batch.cursor;                    // advance so we never miss/replay
    } catch {
      await new Promise((res) => setTimeout(res, 1000)); // backoff on network error
    }
  }
}
```

```js
// server (long-poll) — do NOT answer until there's news or a timeout
app.get('/api/updates', async (req, res) => {
  const since = Number(req.query.since);
  const events = await waitForEventsSince(since, { timeoutMs: 30000 });
  if (!events.length) return res.status(204).end();   // let client re-arm
  res.json({ events, cursor: events.at(-1).id });
});
```

## ⚖️ Trade-offs

- **Short-poll wins when the data is "eventually" data.** Build/CI status, a dashboard that refreshes on a coffee-break cadence, anything where 30s late is fine. Its unbeatable virtue is that it's stateless, cache-friendly, and survives any proxy on earth.
- **Long-poll is the pragmatic middle** and the correct fallback when WebSocket is blocked (corporate proxies, ancient infra). It's how Socket.IO degrades. But at high message *frequency* it collapses into a reconnect storm — one round-trip per message is brutal at 50 msg/s.
- **Push wins on sustained, frequent, low-latency traffic** — chat, live cursors, tickers. The cost is operational: sticky sessions, connection limits, scaling the fan-out layer. **When NOT to use push:** rare updates to many idle clients, where holding millions of sockets open is pure waste — long-poll or even web-push notifications fit better.

## 💣 Gotchas interviewers probe

- **"Long-polling is real-time" — with an asterisk.** Latency is near-zero *per delivered message*, but throughput is capped by round-trips. It's real-time for *infrequent* events, not a high-rate stream.
- **The re-request gap.** Between the server responding and the client sending the next request, new events can occur. Without a **cursor/`since` token** the server has no idea where to resume and you drop or duplicate messages. This is the detail that separates a toy from a correct implementation.
- **Short-poll's "thundering herd".** Fixed intervals mean every client that loaded at the same time polls in lockstep, hammering the server on the same tick. Jitter the interval.
- **Held long-poll requests count against server limits.** Each parked request consumes a socket/worker and can trip request-timeout middleware, proxy read timeouts, and per-origin connection caps. Set the server hold *below* every proxy's timeout.
- **Battery and radio.** On mobile, frequent short-polls keep the cellular radio awake — real battery drain. A held long-poll or push is far kinder.
- **`setInterval` doesn't wait for the response.** If a poll takes longer than the interval, requests stack up. Use a `setTimeout` loop that re-arms *after* completion (or the `while` pattern above).

## 🎯 Say this in the interview

> "I pick based on latency budget versus operational cost. Short-polling is a timer around fetch — dead simple and proxy-proof, but latency is half the interval and you pay for every request even when nothing changed, so it's for 'eventually' data. Long-polling gets me near-real-time over plain HTTP: the client asks, the server holds the request open until it has news or times out, then the client immediately re-asks. The subtlety is a cursor or `since` token so the tiny gap between responding and re-requesting doesn't drop events. Push — WebSocket or SSE — is one persistent connection with the lowest per-message cost, which I want for chat or tickers, but I'm now on the hook for reconnect logic and sticky routing. My default: SSE or long-poll for server-to-client notifications, WebSocket only when the client is also a chatty low-latency sender."

## 🔗 Go deeper

- [Ably — Long polling explained](https://ably.com/topic/long-polling) — the mechanism, gap problem, and where it fits.
- [MDN — WebSockets vs SSE vs long polling](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — the comparison and when each applies.
- [web.dev — WebSockets and real-time patterns](https://web.dev/articles/websockets) — push transports and their trade-offs.
