<div align="center">

# HTTP/3 & QUIC

<sub>📡 Networking · 🔴 Hard · ⏱ 45m · `#http` `#performance`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — HTTP/3 is HTTP over **QUIC**, a transport built on **UDP** that finally kills TCP head-of-line blocking by making each stream independently ordered. It folds the TLS handshake into the transport handshake (1-RTT, often 0-RTT to resume) and survives network changes via **connection IDs**, so a call keeps flowing when you walk from Wi-Fi to cellular.

---

## 🧠 Mental model

HTTP/2 solved multiplexing but left one flaw: all its streams share **one TCP connection**, and TCP delivers bytes strictly in order. Lose one packet and *every* stream freezes until it's retransmitted — TCP can't know that the missing bytes belong only to stream A. That's **TCP head-of-line blocking**, and you cannot patch it from inside TCP because TCP has no concept of streams.

QUIC's move: **stop using TCP.** It runs over UDP (which is just "datagrams, no ordering guarantees") and rebuilds the good parts of TCP — reliability, congestion control, ordering — *per stream* instead of per connection. Now a lost packet only stalls the one stream that owned it; the others keep flowing.

```
HTTP/2 over TCP                 HTTP/3 over QUIC (UDP)
──────────────────              ──────────────────────
[A][B][C][ x ][A][B]            [A][B][C][ x ][A][B]
             ▲                               ▲
   packet loss stalls           only stream that lost a
   ALL streams (TCP HOL)        packet stalls; B, C proceed
```

## ⚙️ How it actually works

**QUIC is a full transport in user space.** TCP lives in the OS kernel and evolves at kernel-upgrade speed (years). QUIC ships in the browser and server *application*, so it iterates fast — a big reason it moved off TCP was deployability, not just performance.

**Streams are first-class and independently ordered.** Each QUIC stream has its own sequencing. Packet loss is recovered per stream, so there's no cross-stream blocking. HTTP/3 maps each request/response to a QUIC stream; header compression uses **QPACK** (HPACK re-designed to avoid HOL-blocking on the header stream itself).

**TLS is baked in, not layered on.** There is no unencrypted QUIC — TLS 1.3 is part of the handshake. So instead of TCP handshake (1 RTT) *then* TLS handshake (1 RTT), QUIC combines them: **1 RTT** to a new server, and **0-RTT** resumption where the client sends application data in the very first packet using a cached key. That shaves real latency off connection setup, which dominates on high-latency mobile links.

**Connection migration.** A TCP connection is identified by the 4-tuple (src IP, src port, dst IP, dst port) — change your IP (Wi-Fi → cellular) and the connection dies. QUIC identifies connections by an opaque **Connection ID** carried in the packets, independent of IP. So the connection *survives* a network switch: your video call doesn't drop when you leave the house.

**The costs.** UDP is sometimes throttled or blocked by corporate firewalls (falling back to HTTP/2 over TCP). And moving congestion control + loss recovery into user space costs more **CPU** per byte than kernel TCP — measurable at CDN scale. Browsers do **Happy Eyeballs**-style racing: try HTTP/3, fall back to /2 if UDP is blocked, advertised via the `Alt-Svc` header.

## 💻 Code

HTTP/3 is transport-level — no new browser API. You *enable and observe* it:

```
# The server advertises HTTP/3 with Alt-Svc; the browser uses it on the NEXT visit
Alt-Svc: h3=":443"; ma=86400

# Verify negotiation
curl -I --http3 https://cloudflare.com        # "HTTP/3 200"
```

```js
// DevTools: Network panel → right-click column headers → enable "Protocol"
//   h3        = HTTP/3 (QUIC)
//   h2        = HTTP/2 (TCP)
//   http/1.1  = HTTP/1.1

// First-visit reality: the FIRST request to an origin usually goes over h2/h1,
// because the browser only learns h3 is available from the Alt-Svc header in
// that response. Subsequent requests upgrade to h3. Don't expect h3 on a
// cold cache from a synthetic single-request test.
```

## ⚖️ Trade-offs

- **Biggest wins on lossy, high-latency links** — mobile, satellite, congested Wi-Fi — where TCP HOL blocking and slow handshakes hurt most. On a clean fibre connection the delta over HTTP/2 is modest.
- **Connection migration is the underrated feature** for real-time apps (calls, live streams) where a dropped TCP connection means a visible reconnect.
- **When it doesn't help / can't be used:** networks that block or rate-limit UDP (some enterprise/firewall setups) force a TCP fallback; and higher per-packet CPU cost matters if you're the one running the servers at scale.
- **You don't choose it per request.** It's negotiated. Your job is to enable it on the CDN/edge and stop assuming TCP semantics (e.g. that an IP change kills the connection).

## 💣 Gotchas interviewers probe

- **"HTTP/3 uses UDP — isn't UDP unreliable?"** QUIC rebuilds reliability, ordering, and congestion control *on top of* UDP, per stream. UDP is chosen for its lack of built-in ordering, so QUIC can define its own. Saying "UDP so it's unreliable" is a fail.
- **The HOL-blocking chain of custody:** HTTP/1.1 blocks at the app layer → HTTP/2 fixes that but TCP still blocks all streams on loss → HTTP/3/QUIC fixes it by giving each stream independent ordering. Nail this progression.
- **QUIC ≠ HTTP/3.** QUIC is the transport; HTTP/3 is the HTTP mapping onto it. QUIC also carries WebTransport and (eventually) other protocols.
- **TLS isn't optional** in QUIC — there's no plaintext mode. Encryption is structural, including the packet headers.
- **First request often isn't h3** — discovery is via `Alt-Svc`, so a cold connection starts on TCP.

## 🎯 Say this in the interview

> "HTTP/3 is HTTP over QUIC, and QUIC exists to fix the one thing HTTP/2 couldn't: TCP head-of-line blocking. HTTP/2 multiplexes streams over a single TCP connection, but TCP delivers bytes in strict order, so one lost packet stalls every stream. You can't fix that inside TCP because TCP has no notion of streams — so QUIC moves onto UDP and rebuilds reliability and ordering per stream, meaning a lost packet only stalls its own stream. It also folds TLS 1.3 into the transport handshake, so connection setup is one round trip, or zero on resumption, which is a big deal on high-latency mobile. And because QUIC identifies a connection by a connection ID rather than the IP-and-port tuple, the connection survives a network change — Wi-Fi to cellular doesn't drop your call. The trade-offs are higher CPU cost and UDP sometimes being blocked, in which case the browser falls back to HTTP/2."

## 🔗 Go deeper

- [Cloudflare — HTTP/3: past, present, and future](https://blog.cloudflare.com/http3-the-past-present-and-future/) — the clearest narrative on why QUIC left TCP.
- [Cloudflare — The road to QUIC](https://blog.cloudflare.com/the-road-to-quic/) — deep on streams, 0-RTT, and connection migration.
- [RFC 9114 — HTTP/3](https://www.rfc-editor.org/rfc/rfc9114) — the HTTP-over-QUIC mapping, authoritative.
- [RFC 9000 — QUIC transport](https://www.rfc-editor.org/rfc/rfc9000) — the transport spec itself.
