# 🟥 DoorDash — Frontend Interview Guide

> **Emphasis:** Real-time logistics, maps, and conversion-critical flows (search → cart → checkout → live order tracking).

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | JS/DSA | [03-javascript](../03-javascript/) |
| Coding | UI component / machine coding | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | Ordering / real-time "Design X" | [15-system-design](../15-system-design/) |
| Behavioral | Ownership | — |

## What they emphasize

- **Conversion flows** — search, filters, cart, checkout; correctness + UX.
- **Real-time order tracking** — live location, status updates.
- **Maps & geospatial UI.**
- **Performance on mobile web.**

## Frequently asked (community-sourced)

**System design**
- Design a Food Delivery app (browse → track) → [15-system-design](../15-system-design/)
- Design live order tracking (map) → [real-time pattern](../17-interview-patterns/)
- Design a Notification System → [flagship](../15-system-design/design-notification-system.md)

**Machine coding**
- Build a Cart & Checkout → [state](../13-state-management/) · [16-machine-coding](../16-machine-coding/)
- Build a restaurant list with filters → [pattern](../17-interview-patterns/)
- Build an Autocomplete (address search) → [flagship](../16-machine-coding/autocomplete-component.md)
- Build an infinite scroll list → [flagship](../15-system-design/design-news-feed.md)

**Patterns**
- Real-time updates, optimistic UI → [17-patterns](../17-interview-patterns/)

## Prep plan (2 weeks)

1. Build a full **browse → cart → checkout** flow.
2. Study [real-time tracking patterns](../17-interview-patterns/).
3. Practice mobile-web [performance](../09-performance/).
4. Do an ordering/logistics system design.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** nail conversion flows (cart/checkout) with correct edge cases · handle real-time order tracking · optimistic UI · mobile-web performance.
**🔴 Avoid:** broken edge cases in checkout · ignoring real-time/optimistic updates · slow, heavy mobile pages.

## 📝 Sample interviewer prompts

- "Build a **cart** with add/remove and live totals."
- "Design live order tracking on a map."
- "Build an address autocomplete."

---

> _Interviewed at DoorDash? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
