# 🟧 Amazon — Frontend Interview Guide

> **Emphasis:** Leadership Principles woven through **every** round + practical machine coding and DSA. Behavioral signal is scored as heavily as code.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Online assessment | DSA + debugging | — |
| Coding 1–2 | DSA + a UI/JS component | [16-machine-coding](../16-machine-coding/) · [03-javascript](../03-javascript/) |
| Frontend/UI round | Build a component | [16-machine-coding](../16-machine-coding/) |
| System design (SDE-2+) | "Design X" | [15-system-design](../15-system-design/) |
| Bar Raiser | Leadership Principles | — |

## What they emphasize

- **Leadership Principles** — prepare STAR stories for Ownership, Customer Obsession, Dive Deep, Deliver Results. Every interviewer probes these.
- **Practical, working code** — correctness and edge cases over cleverness.
- **Fundamentals** — solid JS/DOM; React is common but not always required.
- **Scalability & customer impact** in design discussions.

## Frequently asked (community-sourced)

**Machine coding / UI**
- Build an accessible Modal → [flagship](../16-machine-coding/modal-dialog.md)
- Build a Data Grid / product table → [flagship](../16-machine-coding/data-grid.md)
- Build a Star Rating → [flagship](../16-machine-coding/star-rating.md)
- Build a Carousel → [system design flagship](../15-system-design/design-image-carousel.md)

**System design**
- Design Amazon / e-commerce product listing → [15-system-design](../15-system-design/)
- Design a Cart & Checkout → [state pattern](../13-state-management/)
- Design a Notification System → [flagship](../15-system-design/design-notification-system.md)

**JavaScript**
- `debounce`/`throttle`, polyfills → [flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md)
- Event delegation, `this` → [03-javascript](../03-javascript/)

## Prep plan (2 weeks)

1. Write **6–8 STAR stories** mapped to Leadership Principles.
2. Drill DSA + [JS utilities](../16-machine-coding/#-js-utilities-implement-these).
3. Build 4 components clean, with edge cases + a11y.
4. 2 mock system designs framed around customer impact.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** tie technical decisions to **customer impact** · have crisp STAR stories for each Leadership Principle · handle edge cases · keep code readable and correct.
**🔴 Avoid:** vague/rehearsed behavioral answers · ignoring Leadership Principles · over-clever code · no metrics/outcomes in your stories.

## 📝 Sample interviewer prompts

- "Tell me about a time you took **ownership** of a hard problem end-to-end."
- "Build a product listing with sorting and filtering."
- "How do you guarantee correctness in a checkout form?"

---

> _Interviewed at Amazon? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
