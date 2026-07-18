<div align="center">

# WebSocket

<sub>📡 Networking · 🔴 Hard · ⏱ 1h · `#realtime` `#websocket`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — WebSocket is a **persistent, full-duplex** connection over a single TCP socket: after an HTTP handshake that *upgrades* the protocol, either side can push messages any time with almost no per-message overhead. It's the right tool for genuinely bidirectional, low-latency real-time — chat, multiplayer, collaborative editing — but you own reconnection, heartbeats, auth, and scaling yourself.

---

## 🧠 Mental model

HTTP is **half-duplex request/response**: the client asks, the server answers, the exchange ends. To simulate "the server tells me things", you poll — ask repeatedly — which is wasteful and laggy. WebSocket removes the pretence: it's a **long-lived pipe both ends can write to at any moment.**

```
HTTP polling                    WebSocket
────────────                    ─────────
C → "anything new?"  (req)      C ══════════════ S   ← one open pipe
S ← "no"             (res)      C → msg          →   ← either side
C → "anything new?"  (req)      C ←          msg     ← pushes freely,
S ← "no"  (repeat forever)      C → msg  ←   msg     ← any time
```

Crucially, WebSocket **starts as HTTP.** The client sends a normal `GET` with `Upgrade: websocket`; the server replies `101 Switching Protocols`; from then on the same TCP connection speaks the WebSocket framing protocol, not HTTP. That's why it works over ports 80/443 and through most proxies — it looks like HTTP until the handshake completes.

## ⚙️ How it actually works

**The upgrade handshake.** The client sends `Sec-WebSocket-Key` (a random nonce); the server hashes it with a fixed GUID and returns `Sec-WebSocket-Accept`, proving it understood the protocol (not a proof of security — just of protocol support). After `101`, the connection is a bidirectional binary channel using `ws://` (or `wss://` over TLS — always use `wss://`).

**Framing.** Messages are sent as **frames** with a small header (as little as 2 bytes) — dramatically cheaper than HTTP's per-request headers/cookies. Frames carry text or binary; there are also **control frames**: `ping`/`pong` (heartbeats) and `close`.

**The problems HTTP solved that you now re-solve yourself:**

- **Reconnection.** TCP connections drop — Wi-Fi blips, laptop sleep, proxy timeouts, mobile handoffs. WebSocket has *no* built-in reconnect. You must detect the drop and reconnect **with exponential backoff + jitter** (or you thundering-herd your server on an outage).
- **Heartbeats / dead connection detection.** A connection can be **silently dead** — no `close` frame arrives — while your code still thinks it's open (a "half-open" connection). You send `ping` frames on an interval and treat a missing `pong` as dead. Without this you send into a void.
- **Message ordering & delivery.** WebSocket guarantees *in-order* delivery (it's TCP) but **not delivery across reconnects** — messages sent while you were disconnected are gone. Real apps add sequence numbers / acks / a resume cursor to refetch what was missed.
- **Backpressure.** If you push faster than the client drains, `ws.bufferedAmount` grows and memory balloons. You must check it and throttle.

**Auth is awkward.** The browser `WebSocket` constructor can't set custom headers, so you can't send `Authorization: Bearer`. Common patterns: a short-lived token in the URL query (logged everywhere — use a one-time ticket), a cookie (subject to CORS/SameSite rules), or authenticate in the *first message* after connect.

**Scaling is stateful.** Each connection pins a client to one server for its lifetime — the opposite of stateless HTTP. To broadcast across servers you need a **pub/sub backbone** (Redis, Kafka) so a message from a client on server A reaches subscribers on server B. Load balancers need sticky sessions or connection-aware routing.

## 💻 Code

```js
// Production-grade client: reconnect with backoff, heartbeat, and cleanup
function connect() {
  const ws = new WebSocket('wss://api.example.com/ws');
  let heartbeat;

  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'auth', token })); // can't set headers → auth in-band
    // Heartbeat: prove the connection is alive; a missing pong means it's dead
    heartbeat = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'ping' }));
    }, 30_000);
  };

  ws.onmessage = (e) => handle(JSON.parse(e.data));

  ws.onclose = () => {
    clearInterval(heartbeat);
    // ❌ `setTimeout(connect, 1000)` → every client retries in lockstep = thundering herd
    // ✅ exponential backoff + jitter spreads the reconnect storm
    const delay = Math.min(1000 * 2 ** attempt, 30_000) * (0.5 + Math.random());
    setTimeout(connect, delay);
    attempt++;
  };

  ws.onerror = () => ws.close(); // let onclose own the reconnect logic (one path)
}
```

```js
// Backpressure: don't blindly push — a slow client's buffer will blow up memory
if (ws.bufferedAmount < 1_000_000) ws.send(payload); // else drop/throttle/coalesce
```

## ⚖️ Trade-offs

- **Use WebSocket when you need true bidirectional, low-latency messaging** — chat, presence, multiplayer games, collaborative editing (cursors flying both ways), live trading. That's its home turf.
- **When NOT to use it — the most important judgement call:** if the data only flows **server → client** (notifications, live scores, a progress feed), **SSE** is simpler — it's plain HTTP, auto-reconnects, and needs no special infra. If updates are infrequent, **polling** is fine and trivially cacheable/scalable. Reaching for WebSocket by default is a classic over-engineering tell.
- **Operational weight.** Stateful connections mean sticky routing, a pub/sub layer to broadcast across servers, connection-count limits per box, and you owning reconnection/heartbeat/auth. That's real infrastructure, not a `fetch` call.
- **Proxies/firewalls** occasionally kill idle or long-lived connections — heartbeats and reconnection aren't optional in the wild.

## 💣 Gotchas interviewers probe

- **"WebSocket vs SSE vs polling — when each?"** The senior answer: WebSocket for bidirectional; **SSE for server→client-only** (simpler, auto-reconnect, HTTP); polling for infrequent/simple. Defaulting to WebSocket for one-way data is the trap.
- **Silent half-open connections.** The connection dies with no `close` event and your code keeps "sending". Heartbeats (`ping`/`pong`) are the only reliable detector.
- **No delivery guarantee across reconnects.** WebSocket is in-order (TCP) but messages sent while disconnected are lost — you need acks/sequence numbers/resume to be correct.
- **Reconnect storms.** Naive fixed-interval reconnect means every client retries simultaneously after an outage and DoSes your own server. Backoff **with jitter** is mandatory.
- **Auth can't use headers** from the browser constructor — a real design constraint people forget until it bites.
- **It's stateful and doesn't scale like HTTP.** No CDN, sticky sessions, pub/sub to fan out. "Just add WebSocket" hides a lot of infra.
- **`wss://` always** — `ws://` is plaintext and blocked on HTTPS pages (mixed content).

## 🎯 Say this in the interview

> "WebSocket gives you a persistent, full-duplex connection over one TCP socket. It starts as an HTTP `GET` with an `Upgrade` header, the server replies `101 Switching Protocols`, and from then on both sides push framed messages any time with tiny per-message overhead. That makes it right for genuinely bidirectional real-time — chat, multiplayer, collaborative editing. But the reason it's a hard topic is everything HTTP gave you for free that you now own: there's no built-in reconnection, so I reconnect with exponential backoff and jitter to avoid a thundering herd; connections go silently half-open, so I run ping/pong heartbeats to detect death; and there's no delivery guarantee across reconnects, so for correctness I add sequence numbers or a resume cursor. It's also stateful — each connection pins to one server, so scaling needs sticky routing and a pub/sub layer to broadcast. The judgement call I'd stress: if data only flows server-to-client I'd use SSE instead, and if it's infrequent, polling — WebSocket by default is over-engineering."

## 🔗 Go deeper

- [MDN — The WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — the client API, events, and lifecycle.
- [MDN — Writing WebSocket servers](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API/Writing_WebSocket_servers) — the handshake and framing, spelled out.
- [Ably — WebSockets vs SSE vs long-polling](https://ably.com/blog/websockets-vs-sse) — the decision framework interviewers want.
- [RFC 6455 — The WebSocket Protocol](https://www.rfc-editor.org/rfc/rfc6455) — the handshake, framing, and close semantics, authoritative.
