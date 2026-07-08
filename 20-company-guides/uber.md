# ⬛ Uber — Frontend Interview Guide

> **Emphasis:** Real-time, data-heavy UIs and maps. Practical component building plus system design around live location and streaming data.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | JS/DSA | [03-javascript](../03-javascript/) |
| Coding | UI component / machine coding | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | Real-time "Design X" | [15-system-design](../15-system-design/) |
| Behavioral | Ownership, collaboration | — |

## What they emphasize

- **Real-time data** — live location, ETAs, streaming updates (WebSocket/SSE).
- **Maps & geospatial UI** — rendering markers, routes, viewport performance.
- **State management** for complex, frequently-updating UIs.
- **Reliability** — handling flaky networks, retries, offline.

## Frequently asked (community-sourced)

**System design**
- Design Uber (rider/driver live map) → [15-system-design](../15-system-design/)
- Design a live ride-tracking map → [real-time pattern](../17-interview-patterns/)
- Design a Notification System → [flagship](../15-system-design/design-notification-system.md)
- Design a Chat (rider↔driver) → [flagship](../15-system-design/design-chat-whatsapp-web.md)

**Machine coding**
- Build a Data Grid (trips table) → [flagship](../16-machine-coding/data-grid.md)
- Build an Autocomplete (location search) → [flagship](../16-machine-coding/autocomplete-component.md)
- Build an infinite scroll list → [flagship](../15-system-design/design-news-feed.md)

**JS / patterns**
- Debounce/throttle, polling, backoff → [flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md) · [17-patterns](../17-interview-patterns/)

## Prep plan (2 weeks)

1. Master [real-time patterns](../17-interview-patterns/) (WS/SSE/polling, reconnect).
2. Study map-rendering perf + [virtualization](../06-react/build-a-virtualized-list.md).
3. Build data-heavy components (grid, live list).
4. Practice a live-tracking system design.

---

> _Interviewed at Uber? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
