<div align="center">

# HTTP/1.1 vs HTTP/2

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#http` `#performance`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — HTTP/1.1 sends one request at a time per connection, so browsers open ~6 sockets and you hand-optimise around **head-of-line blocking** (bundling, spriting, domain sharding). HTTP/2 **multiplexes** many streams over **one** connection with binary framing and header compression — which retires most of those hacks, but does *not* fix HOL blocking at the TCP layer (that's HTTP/3's job).

---

## 🧠 Mental model

The defining limit of HTTP/1.1 is **one request in flight per connection**. Responses must come back in order, so a slow response *blocks everything queued behind it* — application-layer head-of-line blocking. Browsers work around it by opening roughly **6 parallel connections per origin**, and front-end folklore (concatenate your JS, sprite your icons, shard across `cdn1`/`cdn2` domains) was entirely about dodging that limit.

HTTP/2 changes the unit of transmission. Instead of one text request per connection, it's a **single binary connection carrying many independent streams**, interleaved frame by frame:

```
HTTP/1.1 (per connection)        HTTP/2 (one connection)
─────────────────────────        ─────────────────────────
[req A]──────►                    [A1][B1][C1][A2][B2][C2]  ← frames interleaved
       ◄──────[res A]            one TCP socket, many streams
[req B]──────►  (waits for A)     no per-origin 6-connection cap
```

Same HTTP semantics — methods, status codes, headers are identical. HTTP/2 only changes *how bytes move on the wire*.

## ⚙️ How it actually works

**Binary framing.** HTTP/1.1 is a text protocol you can type into telnet. HTTP/2 splits everything into binary **frames** (HEADERS, DATA, etc.) tagged with a **stream ID**. Frames from different streams are interleaved on one connection and reassembled by ID — that's multiplexing.

**Header compression (HPACK).** HTTP/1.1 resends full headers on every request — cookies, user-agent, accept — as plaintext, often more bytes than the payload. HPACK maintains a **dynamic table** of previously-sent headers so repeats become a tiny index reference. On a cookie-heavy site this is a real win.

**Stream prioritisation & flow control.** Streams carry priority hints so the browser can say "the CSS matters more than the below-the-fold image", and per-stream flow control prevents one big download from starving others.

**Server push** let the server send resources you hadn't asked for yet. In practice it was hard to use well (you push things already in cache) and **has been removed from Chrome** — the modern replacement is `103 Early Hints` + `<link rel=preload>`.

**The catch — TCP head-of-line blocking.** HTTP/2 removed HOL blocking at the *HTTP* layer, but all streams still ride **one TCP connection**. TCP guarantees in-order delivery, so a single lost packet stalls *every* stream until it's retransmitted — because TCP can't tell that stream B's bytes are fine while stream A's are missing. On a lossy network, one HTTP/2 connection can underperform six HTTP/1.1 ones. **This is the problem QUIC/HTTP/3 exists to solve.**

## 💻 Code

You rarely touch HTTP/2 in JS — it's a transport the browser and server negotiate via ALPN during the TLS handshake. What changes is your **build strategy**:

```js
// ❌ HTTP/1.1-era optimisations — often HARMFUL on HTTP/2:
//   - one giant bundle.js  → kills granular caching; one byte change re-downloads all
//   - domain sharding (cdn1, cdn2) → defeats multiplexing, adds DNS+TLS+congestion cost
//   - image sprites        → unnecessary; parallel requests are now cheap

// ✅ HTTP/2-era: ship smaller, cacheable chunks and let multiplexing parallelise
// vite.config.js — split vendor from app so a code change doesn't bust vendor cache
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],   // rarely changes → long-lived cache
          // app code hashes separately → tiny diffs re-download tiny chunks
        },
      },
    },
  },
};
```

```bash
# Confirm the protocol actually negotiated (h2 = HTTP/2)
curl -I --http2 https://example.com   # look for "HTTP/2 200"
# In DevTools → Network → add the "Protocol" column: h2, h3, or http/1.1
```

## ⚖️ Trade-offs

- **HTTP/2 is basically free to adopt** — same semantics, negotiated automatically, requires HTTPS in practice. Turn it on at the CDN/server and you're done.
- **Don't keep HTTP/1.1 hacks.** Domain sharding actively *hurts* HTTP/2 (each shard is a separate connection with its own TLS + congestion window and can't multiplex). Aggressive bundling hurts caching granularity. Undoing these is the real migration work.
- **When HTTP/2 loses:** high packet-loss networks (mobile, congested Wi-Fi), where TCP HOL blocking bites. There, one connection is a liability — the fix isn't more connections, it's HTTP/3.
- **Server push is dead** — don't propose it. Use `Early Hints` / `preload`.

## 💣 Gotchas interviewers probe

- **"Does HTTP/2 fix head-of-line blocking?"** *Partially.* It fixes it at the application layer but **TCP HOL blocking remains** — one lost packet stalls all streams. The candidate who names the TCP layer distinction stands out.
- **Multiplexing needs one connection to pay off** — so domain sharding, the old speed trick, becomes an anti-pattern.
- **HTTP/2 doesn't require TLS by the spec, but every browser only speaks `h2` over TLS** — so in practice HTTP/2 means HTTPS.
- **HPACK compresses headers, not bodies.** Gzip/Brotli still handles payloads. Different layers.
- **More requests isn't automatically fine.** Multiplexing makes *parallelism* cheap, but each request still has server cost and there's a limit (`SETTINGS_MAX_CONCURRENT_STREAMS`, often ~100).

## 🎯 Say this in the interview

> "HTTP/1.1's core limit is one outstanding request per connection with in-order responses, so a slow response blocks the queue — head-of-line blocking. Browsers dodged it by opening about six connections per origin, and all the old front-end tricks — bundling, sprites, domain sharding — existed to work around it. HTTP/2 keeps the exact same semantics but changes the wire: binary framing lets it multiplex many independent streams over a single connection, plus HPACK header compression and stream prioritisation. So most of those hacks become unnecessary or actively harmful — sharding defeats multiplexing. The nuance I'd flag: HTTP/2 removes HOL blocking at the HTTP layer but *not* at TCP — every stream shares one TCP connection, so a single lost packet stalls all of them. That residual TCP head-of-line blocking is precisely what HTTP/3 over QUIC was built to fix."

## 🔗 Go deeper

- [web.dev — Introduction to HTTP/2](https://web.dev/articles/performance-http2) — multiplexing, HPACK, and how it changes bundling advice.
- [MDN — Evolution of HTTP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Evolution_of_HTTP) — the /1.0 → /1.1 → /2 → /3 story in one page.
- [RFC 9113 — HTTP/2](https://www.rfc-editor.org/rfc/rfc9113) — the framing and stream spec, authoritative.
- [Cloudflare — HTTP/2 for web developers](https://blog.cloudflare.com/http-2-for-web-developers/) — practical guidance on what to stop doing.
