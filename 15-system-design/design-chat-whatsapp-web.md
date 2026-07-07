# Design a Chat App (WhatsApp Web)

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#realtime` `#websocket` `#offline` `#optimistic-ui`

**Asked at:** _Meta, Slack, Discord, Uber_ · **Related:** [News Feed](design-news-feed.md) · [Google Docs](design-google-docs.md) · [Interview Patterns](../17-interview-patterns/)

---

## 1. The Question

> Design the frontend for a real-time chat app (WhatsApp Web / Messenger): conversation list, message thread, send/receive in real time, delivery/read receipts, typing indicators, and offline support.

## 2. Requirements

**Functional**
- [ ] List conversations; open a thread with message history.
- [ ] Send/receive messages in real time.
- [ ] Delivery + read receipts; typing indicators; online presence.
- [ ] Infinite scroll upward for history; jump-to-latest.
- [ ] Works offline: queue messages, sync on reconnect.

**Non-functional**
- [ ] Low latency; messages feel instant (optimistic send).
- [ ] Ordered, exactly-once display (no dupes, no gaps).
- [ ] Bounded memory for long threads.
- [ ] Accessible + resilient to flaky networks.

## 3. High-Level Design

```
┌─────────────┐  WebSocket (bidirectional)  ┌──────────┐
│  Chat Core  │ ◀─────────────────────────▶ │  Gateway │
│  - socket   │      messages, receipts,     └──────────┘
│  - outbox   │      typing, presence
│  - stores   │
└──────┬──────┘
       │ selectors
       ▼
[Conversation list]  [Message thread (virtualized)]  [Composer]
```

- **Transport:** **WebSocket** for bidirectional, low-latency messaging. Fall back to SSE/long-polling if WS is blocked.
- **Local stores:** normalized `messages` + `conversations`; an **outbox** for pending sends.
- **Persistence:** IndexedDB for offline history + queued messages.

## 4. Deep Dives & Trade-offs

**Transport choice** → **WebSocket** (server can push; low overhead). SSE is server→client only (no send channel); long-polling is a fallback. Discuss reconnection with exponential backoff + jitter and resubscribe-on-reconnect.

**Optimistic send + reconciliation** → render the message immediately with a temp client id and "sending" state. On server ack, replace temp id with the real id and mark "sent". On failure, show retry. This is why you key messages by a **client-generated id**, not the server id.

**Ordering & dedupe** → messages can arrive out of order or twice (reconnect replays). Order by server timestamp/sequence; dedupe by id. Detect **gaps** (missing sequence) and backfill via history fetch.

**Offline** → queue sends in the outbox (IndexedDB); on `navigator.onLine`/reconnect, flush in order. Show per-message state (queued → sent → delivered → read).

**Receipts & typing** → separate lightweight events. Typing indicators are throttled and ephemeral (don't persist). Read receipts update on viewport visibility (IntersectionObserver).

**Long threads** → virtualize the message list; load history in pages scrolling up while **preserving scroll position** (anchor to the first visible message). Evict far-offscreen messages from the DOM.

**Consistency** → treat the server as source of truth; local optimistic state is provisional until acked.

## 5. What Interviewers Probe

- WebSocket vs SSE vs polling — when each?
- How do you guarantee ordering and no duplicates across reconnects?
- Optimistic UI: temp ids, ack reconciliation, failure/retry.
- Offline queue + sync strategy.
- Reconnection/backoff and resubscribe.
- Virtualizing a thread while paginating history upward.
- Read receipts via visibility.

## 6. Curated Resources

- [MDN: WebSocket API ⭐](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) — the transport
- [Ably: WebSockets vs SSE vs long-polling](https://ably.com/blog/websockets-vs-sse) — transport trade-offs
- [web.dev: offline cookbook ⭐](https://web.dev/articles/offline-cookbook) — offline/sync strategies
- [MDN: IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — offline persistence

## 7. Related Topics

- [Design Google Docs (real-time)](design-google-docs.md)
- [Interview Patterns: real-time & offline](../17-interview-patterns/)
- [Networking: WebSocket/SSE](../12-networking/)
- [State: optimistic updates](../13-state-management/)
