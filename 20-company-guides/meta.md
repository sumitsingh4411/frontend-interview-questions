# 🔵 Meta — Frontend Interview Guide

> **Emphasis:** Machine coding **in React**, product sense, and frontend system design. Fast, iterative, "build a working thing and improve it" energy.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | Coding (JS/React) | [03-javascript](../03-javascript/) · [06-react](../06-react/) |
| Coding 1 | DSA | — |
| Coding 2 | UI / machine coding | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | "Design X" | [15-system-design](../15-system-design/) |
| Behavioral | Values / impact | — |

## What they emphasize

- **React proficiency** — hooks, state, re-render control, composition.
- **Ship fast, then iterate** — get something working, handle edge cases, discuss improvements.
- **Product thinking** — clarify the user problem, not just the technical spec.
- **System design** — data fetching, caching, real-time, pagination trade-offs.

## Frequently asked (community-sourced)

**Machine coding (React)**
- Build a Nested Comments thread → [flagship](../16-machine-coding/nested-comments.md)
- Build an Autocomplete → [flagship](../16-machine-coding/autocomplete-component.md)
- Build a Like button / optimistic UI → [interaction pattern](../17-interview-patterns/)
- Build a Kanban board → [flagship](../16-machine-coding/kanban-drag-and-drop.md)
- Build a Star Rating → [flagship](../16-machine-coding/star-rating.md)

**System design**
- Design a News Feed → [flagship](../15-system-design/design-news-feed.md)
- Design Messenger / Chat → [flagship](../15-system-design/design-chat-whatsapp-web.md)
- Design Stories → [15-system-design](../15-system-design/)

**React deep-dives**
- Reconciliation & keys, `memo`, context perf → [06-react](../06-react/)
- Virtualized list → [flagship](../06-react/build-a-virtualized-list.md)

## Prep plan (2 weeks)

1. Get fluent in [React](../06-react/) — build components fast from a blank file.
2. Do all 4 machine-coding [flagships](../16-machine-coding/#-flagship-solutions-fully-worked).
3. Practice [system design](../15-system-design/) with a stopwatch — clarify → design → deep dive in 35 min.
4. Prepare 3 impact stories for behavioral.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** get a working version fast, then iterate · clarify the *product* problem · control re-renders · discuss data fetching, caching, pagination · talk while you code.
**🔴 Avoid:** over-planning before writing code · premature abstraction · ignoring loading/error/empty states · coding in silence.

## 📝 Sample interviewer prompts

- "Build a comment thread with replies, then add optimistic posting."
- "How would you scale this list to 10,000 items?"
- "Design the news feed — start by clarifying requirements."

---

> _Interviewed at Meta? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
