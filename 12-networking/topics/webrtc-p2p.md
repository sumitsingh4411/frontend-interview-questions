<div align="center">

# WebRTC (P2P)

<sub>📡 Networking · 🔴 Hard · ⏱ 1h · `#realtime` `#webrtc`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — WebRTC is **browser-to-browser** media and data with sub-100ms latency. The hard part isn't the API — it's that two devices behind NATs can't reach each other directly, so WebRTC spends an entire dance (**signaling → ICE → STUN/TURN → DTLS**) just discovering *how* to connect before a single byte of your data flows.

---

## 🧠 Mental model

Every other transport on the web is client→server. WebRTC is the one that's **peer→peer**: your data (audio, video, or arbitrary bytes over a `DataChannel`) travels *directly* between two browsers, skipping your server on the hot path. That's what buys the latency — no round-trip through a datacenter.

But "directly" is a lie two-thirds of the time, because both peers sit behind NATs and firewalls with no public address. So the mental model is: **WebRTC is 90% connection *establishment* and 10% data.** You must (1) exchange connection descriptions through *some* channel you provide (**signaling** — WebRTC doesn't do this for you), (2) discover a working network path (**ICE**, using **STUN** to find your public address and **TURN** to relay when direct fails), and (3) encrypt (mandatory **DTLS/SRTP** — there is no unencrypted WebRTC).

```
Peer A ──signaling (your server: WS/SSE)── Peer B   ① exchange SDP offer/answer + ICE candidates
Peer A ───────STUN───────▶ STUN server              ② "what's my public IP:port?"
Peer A ═══════ direct media/data ═══════ Peer B      ③ if a path works, server is OUT of the loop
Peer A ═══ TURN relay ═══ [TURN] ═══ Peer B          ③′ if not, relay through TURN (server stays in)
```

## ⚙️ How it actually works

**Signaling is yours to build.** WebRTC standardizes the media path but deliberately *not* how peers first find each other. You ship SDP (Session Description Protocol) blobs — the offer and answer describing codecs, and later ICE candidates — over any channel: WebSocket, SSE, even copy-paste. Get this wrong and nothing connects.

**ICE finds a path.** Each peer gathers *candidates*: its local IP (host), its public IP as seen through NAT (**server-reflexive**, discovered via a **STUN** query), and a relayed address (via **TURN**). Peers trade candidates and run connectivity checks until one pair works, then promote the best.

**STUN vs TURN — the money question.** STUN is cheap: it just tells a peer "here's how the outside world sees you," enabling a direct connection. But **symmetric NATs** (common on corporate/mobile networks) defeat STUN — the NAT assigns a different port per destination, so the address STUN found is useless. Then you need **TURN**, a relay that both peers *can* reach; all media flows through it. TURN costs real bandwidth and money, and **roughly 10–20% of connections require it**. No TURN server = your app mysteriously fails for those users.

**Everything is encrypted.** Media uses SRTP, `DataChannel` uses DTLS over SCTP. There is no opt-out. `DataChannel` can even be configured `unreliable`/`unordered` (like UDP) for games, or reliable/ordered (like TCP) for file transfer.

## 💻 Code

```js
// The Perfect Negotiation shape — offer/answer over YOUR signaling channel.
const pc = new RTCPeerConnection({
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },              // find public address
    { urls: 'turn:turn.example.com', username: 'u', credential: 'p' }, // relay fallback
  ],
});

// 1. Send our ICE candidates to the other peer as they're discovered.
pc.onicecandidate = ({ candidate }) => candidate && signal.send({ candidate });

// 2. A reliable data channel (no server on the hot path).
const chan = pc.createDataChannel('chat');
chan.onmessage = (e) => render(e.data);

// 3. Caller creates the offer; callee answers. Both go over signaling.
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);
signal.send({ sdp: pc.localDescription });

// 4. On the other side, on receiving the offer:
async function onSignal({ sdp, candidate }) {
  if (sdp) {
    await pc.setRemoteDescription(sdp);
    if (sdp.type === 'offer') {
      await pc.setLocalDescription(await pc.createAnswer());
      signal.send({ sdp: pc.localDescription });
    }
  } else if (candidate) {
    await pc.addIceCandidate(candidate); // may arrive before/after the SDP
  }
}
```

## ⚖️ Trade-offs

- **P2P doesn't scale past a few peers.** A mesh of N participants needs N-1 connections *each* — uplink dies around 4–5 people. Real group calls route through an **SFU** (Selective Forwarding Unit): each peer sends once to the server, which forwards to everyone. At that point you've re-introduced a media server and lost pure P2P — by design.
- **You must run/pay for TURN.** Treating STUN as sufficient is the classic mistake; ~15% of your users will silently fail without a relay. TURN bandwidth is the real operating cost of WebRTC.
- **When NOT to use it:** anything one-to-many broadcast (use HLS/DASH), or where you just need server→client updates (use SSE/WebSocket). WebRTC's complexity only pays off for **low-latency, bidirectional, often peer-to-peer** media or data.
- **The API is famously heavy.** For most apps, a wrapper (simple-peer, LiveKit, mediasoup, or a managed SFU) is the right call over raw `RTCPeerConnection`.

## 💣 Gotchas interviewers probe

- **"WebRTC is serverless / peer-to-peer" — no.** You always need a **signaling** server to bootstrap, and usually a **TURN** relay. The server is off the *media* path in the happy case, not gone.
- **STUN ≠ TURN.** STUN *discovers* your public address (direct connection); TURN *relays* traffic when direct is impossible. Confusing them is an instant tell. Symmetric NAT is *why* TURN exists.
- **Glare / negotiation races.** If both peers create an offer at once, naive code deadlocks. The **Perfect Negotiation** pattern (polite/impolite peer roles) resolves it — worth naming.
- **ICE candidates and SDP arrive asynchronously and out of order.** You may get candidates before `setRemoteDescription`. Robust code queues them.
- **Trickle ICE.** Don't wait to gather *all* candidates before sending the offer — send them as they're found ("trickling") or connection setup is needlessly slow.
- **`DataChannel` is not always reliable.** Configured `maxRetransmits: 0` / `ordered: false` it behaves like UDP — great for game state, wrong for a file you assumed arrived intact.

## 🎯 Say this in the interview

> "WebRTC is the browser's only true peer-to-peer transport — media or a `DataChannel` flowing directly between two clients for sub-100ms latency. The API is the easy part; the hard part is connection setup. WebRTC deliberately doesn't do signaling, so I provide a channel — usually WebSocket — to exchange SDP offers and answers plus ICE candidates. Then ICE finds a working path: STUN tells each peer its public address for a direct connection, and TURN relays traffic when direct fails, which happens for maybe 15% of users behind symmetric NATs — so a TURN server isn't optional, it's a cost you plan for. Everything's encrypted with DTLS, no opt-out. And I'd flag that pure P2P only works for a handful of peers; group calls need an SFU, which puts a media server back in the path."

## 🔗 Go deeper

- [WebRTC.org — Getting started overview](https://webrtc.org/getting-started/overview) — the architecture and API entry point.
- [MDN — WebRTC connectivity (ICE/STUN/TURN)](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Connectivity) — how the NAT-traversal dance actually resolves.
- [WebRTC — Perfect negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation) — the pattern that kills glare/race bugs.
- [MDN — Using data channels](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Using_data_channels) — reliable vs unreliable `DataChannel` config.
