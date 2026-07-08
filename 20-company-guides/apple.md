# ⬜ Apple — Frontend Interview Guide

> **Emphasis:** Deep fundamentals, performance, and meticulous attention to detail. Often **framework-agnostic** — strong vanilla JS/CSS expected. Team-specific loops vary widely.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Recruiter + team screen | Experience, fit | — |
| Coding 1–2 | JS/DOM, sometimes DSA | [03-javascript](../03-javascript/) · [02-browser](../02-browser/) |
| UI / build round | Component in vanilla or framework | [16-machine-coding](../16-machine-coding/) |
| System design / deep dive | Depends on team | [15-system-design](../15-system-design/) |
| Behavioral | Craft, collaboration | — |

## What they emphasize

- **Fundamentals** — DOM, events, CSS, the platform; often **without** a framework.
- **Attention to detail** — pixel accuracy, smoothness, edge cases.
- **Performance** — animation smoothness, rendering, memory.
- **Note:** Apple loops are **highly team-dependent** — clarify expectations with your recruiter.

## Frequently asked (community-sourced)

**Machine coding (often vanilla JS)**
- Build a Carousel → [flagship](../15-system-design/design-image-carousel.md)
- Build an accessible Modal → [flagship](../16-machine-coding/modal-dialog.md)
- Build a custom Video Player → [flagship](../15-system-design/design-video-player.md)
- Build Tabs / Accordion → [16-machine-coding](../16-machine-coding/)

**Fundamentals**
- DOM, event delegation, `this`, closures → [03-javascript](../03-javascript/)
- CSS animations / GPU → [05-css](../05-css/)
- Rendering pipeline → [02-browser](../02-browser/)

## Prep plan (2 weeks)

1. Practice components in **vanilla JS/CSS** (no framework crutch).
2. Review [browser internals](../02-browser/) + [CSS animation perf](../05-css/).
3. Build to a high polish/detail bar.
4. Clarify the team's loop with your recruiter early.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** be fluent in vanilla JS/CSS · sweat the details (pixels, edge cases) · keep animations smooth at 60fps · clarify the team's expectations early.
**🔴 Avoid:** depending on a framework for everything · sloppy visual details · janky/expensive animations.

## 📝 Sample interviewer prompts

- "Build a carousel in **vanilla JS** (no framework)."
- "Animate this transition smoothly at 60fps — how?"
- "Explain the browser rendering pipeline."

---

> _Interviewed at Apple? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
