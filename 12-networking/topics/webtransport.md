<div align="center">

# WebTransport

<sub>📡 Networking · 🔴 Hard · ⏱ 45m · `#realtime` `#modern`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — WebTransport is a modern client-server transport over **HTTP/3 (QUIC)** that gives the browser what WebSocket never could: **multiple independent streams with no head-of-line blocking**, plus **unreliable datagrams** (fire-and-forget, UDP-style). Think "WebSocket, but built for QUIC, and you choose reliability per message."

---

## 🧠 Mental model

WebSocket is a **single, ordered, reliable byte stream** bolted onto TCP. That single-stream design is its fatal flaw for high-rate apps: if one message's packet is lost, **TCP head-of-line blocking** stalls *everything* behind it until the retransmit lands — even unrelated messages.

WebTransport is designed for **HTTP/3, which runs on QUIC (UDP-based)**. QUIC natively supports many independent streams in one connection, and a loss on stream A doesn't block stream B. WebTransport exposes that: you can open **many bidirectional/unidirectional streams** *and* send **datagrams** that aren't retried or ordered at all.

```
WebSocket (TCP):   [====== one ordered reliable stream ======]  ← 1 lost packet stalls all
WebTransport(QUIC):[ stream 1 ][ stream 2 ][ stream 3 ]         ← independent, no HOL block
                   + datagrams: •  •   •      •   •              ← unreliable, unordered, lowest latency
```

The mental upgrade: **reliability and ordering stop being a property of the connection and become a choice per message.**

## ⚙️ How it actually works

WebTransport runs over an **HTTP/3 CONNECT** session, so it multiplexes alongside your normal h3 traffic on the same UDP port — no separate connection, no separate port to open through firewalls the way WebSocket sometimes needs.

It exposes two primitives:

- **Streams** — reliable, ordered *within a stream*, but independent *across* streams. Each is a `ReadableStream`/`WritableStream`, so it plugs straight into the Streams API and backpressure works natively. Use these for anything that must arrive intact (chat, file chunks, RPC).
- **Datagrams** — `connection.datagrams`, an unreliable, unordered pipe. A dropped datagram is simply gone; there's no retransmit and no HOL blocking. Use for data where *the freshest value obsoletes the last* — player positions, cursor coordinates, live telemetry. Retransmitting a 200ms-old position is worse than skipping it.

Because it's QUIC, it also inherits **0-RTT/1-RTT connection setup** and **connection migration** (survives a Wi-Fi→cellular switch without a full re-handshake) — both meaningful for mobile.

## 💻 Code

```js
// Establish a session (server must speak HTTP/3 + WebTransport).
const wt = new WebTransport('https://example.com:4433/rt');
await wt.ready;

// --- Unreliable datagrams: newest-wins state, latency over guarantees ---
const writer = wt.datagrams.writable.getWriter();
writer.write(encodePosition(player)); // may be dropped — that's fine, we send 60/s

const reader = wt.datagrams.readable.getReader();
while (true) {
  const { value, done } = await reader.read();
  if (done) break;
  applyPosition(decode(value)); // gaps are expected and acceptable
}

// --- Reliable stream: must-arrive data, native backpressure ---
const stream = await wt.createBidirectionalStream();
const w = stream.writable.getWriter();
await w.write(new TextEncoder().encode('must not be lost')); // awaits on backpressure

// Server-opened streams arrive as an async iterable.
for await (const incoming of wt.incomingUnidirectionalStreams) {
  readFully(incoming); // each is independent — no HOL blocking between them
}

wt.closed.then(() => reconnect()); // you still own reconnect logic
```

## ⚖️ Trade-offs

- **Server→client only? Use SSE. Simple duplex? WebSocket is still fine and universally supported.** WebTransport earns its complexity specifically when you need **many parallel streams** or **unreliable datagrams** — games, live media, high-frequency telemetry, multiplexed RPC. For a chat app it's overkill.
- **Support and infrastructure are the catch.** It needs **HTTP/3 end-to-end** — your CDN, load balancer, and origin must all speak QUIC/h3, and Safari support has lagged. In 2026 it's viable but not a safe universal default; you'll often ship it with a WebSocket fallback.
- **You still build reconnection, auth, and message framing yourself** — like WebSocket, it's a transport, not a framework. No `Last-Event-ID`-style resume comes free.
- **When NOT to use it:** anything that must work on every browser and every corporate proxy today, or where the added streams/datagram model buys you nothing over a single ordered channel.

## 💣 Gotchas interviewers probe

- **"It replaces WebSocket" — not quite.** It's the *successor for the demanding cases*. WebSocket remains simpler and more universally supported; WebTransport wins where HOL blocking or the need for unreliable delivery actually bites.
- **Datagrams can be dropped AND reordered — silently.** If you treat `connection.datagrams` like a reliable channel you'll lose data with no error. They're for state where the newest message supersedes older ones; never for a command that must execute exactly once.
- **HTTP/3 all the way through is mandatory.** A proxy that only terminates HTTP/1.1 or /2 kills it. This is the #1 deployment blocker and why fallbacks exist.
- **HOL blocking is per-stream, not gone.** Within a single stream, ordering and reliability still mean a loss blocks *that stream*. The win is that other streams keep flowing. Putting everything on one stream throws the benefit away.
- **UDP gets blocked.** Some restrictive networks drop UDP entirely; QUIC (and thus WebTransport) then fails where TCP-based WebSocket would connect — another reason for a fallback path.
- **It's WHATWG/W3C draft, not frozen.** APIs (and datagram size limits) can shift; pin to current docs.

## 🎯 Say this in the interview

> "WebTransport is the browser transport built for HTTP/3 and QUIC, and it fixes the two things WebSocket can't. First, WebSocket is one ordered TCP stream, so a single lost packet head-of-line-blocks every message behind it; WebTransport gives me many independent QUIC streams where a loss on one doesn't stall the others. Second, it adds unreliable datagrams — fire-and-forget, UDP-style — which is exactly right for things like player positions where the newest value obsoletes the last and retransmitting stale data is pointless. So I reach for it in games, live media, or high-frequency telemetry, and I keep WebSocket for ordinary duplex and SSE for server-to-client. The real catch is infrastructure: it needs HTTP/3 end to end through the CDN and load balancer, and support isn't universal yet, so in production I'd ship it behind a WebSocket fallback."

## 🔗 Go deeper

- [web.dev — Using WebTransport](https://web.dev/articles/webtransport) — streams vs datagrams, with runnable examples.
- [MDN — WebTransport API](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport_API) — the full API surface and browser support.
- [MDN — WebTransport (interface)](https://developer.mozilla.org/en-US/docs/Web/API/WebTransport) — session lifecycle, `datagrams`, and stream creation.
