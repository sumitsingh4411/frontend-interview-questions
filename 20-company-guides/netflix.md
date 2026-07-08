# 🟥 Netflix — Frontend Interview Guide

> **Emphasis:** Senior-only bar. Deep frontend system design, performance at scale, and streaming/media expertise. Culture-fit ("keeper test") is real.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Recruiter + hiring manager | Experience, culture | — |
| Coding | JS/React, practical | [03-javascript](../03-javascript/) · [06-react](../06-react/) |
| Frontend system design | Media/streaming "Design X" | [15-system-design](../15-system-design/) |
| Deep dive | Past projects, trade-offs | [08-architecture](../08-architecture/) |
| Culture | Values, collaboration | — |

## What they emphasize

- **Performance** — Core Web Vitals, TTFB, lazy loading, memory; Netflix obsesses over startup time and smoothness.
- **Streaming/media** — adaptive bitrate, buffering, `<video>`/MSE.
- **Senior autonomy** — you own ambiguity end-to-end and justify trade-offs crisply.
- **A/B experimentation** mindset.

## Frequently asked (community-sourced)

**System design**
- Design a Video Player (ABR, captions) → [flagship](../15-system-design/design-video-player.md)
- Design Netflix / a streaming home page → [15-system-design](../15-system-design/)
- Design an Image Carousel / billboard row → [flagship](../15-system-design/design-image-carousel.md)
- Design a News Feed / infinite rows → [flagship](../15-system-design/design-news-feed.md)

**Performance**
- Optimizing LCP/INP, virtualization → [09-performance](../09-performance/)
- Virtualized List → [flagship](../06-react/build-a-virtualized-list.md)

**React / JS**
- Reconciliation, memoization → [06-react](../06-react/)
- Debounce/throttle, async → [flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md)

## Prep plan (2 weeks)

1. Master [performance](../09-performance/) end-to-end (metrics + fixes).
2. Study the [video player](../15-system-design/design-video-player.md) + media streaming cold.
3. Practice senior-level system design with explicit trade-offs.
4. Prepare deep-dive stories on past high-impact work.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** show senior autonomy in ambiguity · obsess over performance and startup time · know media/streaming (ABR, buffering) · justify every trade-off crisply.
**🔴 Avoid:** needing hand-holding · hand-waving on performance · shallow system design · not owning the decision.

## 📝 Sample interviewer prompts

- "Design a video player with **adaptive bitrate** and captions."
- "How would you cut startup time on a media-heavy page?"
- "Walk me through a hard trade-off you owned end-to-end."

---

> _Interviewed at Netflix? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
