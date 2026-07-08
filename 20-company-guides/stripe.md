# 🟦 Stripe — Frontend Interview Guide

> **Emphasis:** Correctness, API taste, and realistic product work. Stripe is known for **practical, integration-style** interviews using real docs — not whiteboard trivia.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | Practical coding | [03-javascript](../03-javascript/) |
| Integration / API round | Build against a real API (with docs) | [12-networking](../12-networking/) |
| Bug squash | Fix bugs in a real codebase | [03-javascript](../03-javascript/) · [14-testing](../14-testing/) |
| Frontend / UI | Build a component | [16-machine-coding](../16-machine-coding/) |
| System design + values | "Design X", collaboration | [15-system-design](../15-system-design/) |

## What they emphasize

- **Correctness & edge cases** — money/payments demand precision; handle errors, retries, idempotency.
- **Reading docs & APIs fast** — the integration round gives you real API docs.
- **Forms & validation UX** — payment forms, complex validation.
- **Debugging real code** — the bug-squash round tests navigating unfamiliar codebases.

## Frequently asked (community-sourced)

**Practical / machine coding**
- Build a Checkout / payment form (validation) → [16-machine-coding](../16-machine-coding/) · [10-security](../10-security/)
- Build a multi-step form wizard → [17-patterns](../17-interview-patterns/)
- Build a Data Grid (invoices/transactions) → [flagship](../16-machine-coding/data-grid.md)
- Integrate against a paginated API → [networking](../12-networking/)

**System design**
- Design a Dashboard / analytics → [15-system-design](../15-system-design/)
- Design a Notification System → [flagship](../15-system-design/design-notification-system.md)

**Fundamentals**
- Error handling, retries, idempotency → [17-patterns](../17-interview-patterns/) · [12-networking](../12-networking/)
- Async/promises → [flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md)

## Prep plan (2 weeks)

1. Practice **building against real API docs** under time pressure.
2. Drill forms + validation + error states.
3. Do a couple "bug squash" style exercises in unfamiliar code.
4. Review idempotency/retries and payment UX.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** read the provided API docs fast · obsess over correctness and edge cases · great form/validation UX · handle errors, retries, idempotency.
**🔴 Avoid:** ignoring error/edge states · sloppy money/precision handling · not actually reading the docs given · skipping validation.

## 📝 Sample interviewer prompts

- "Integrate this paginated API and render the results."
- "Build a payment form with validation and clear error states."
- "Here's a small app with a bug — find and fix it."

---

> _Interviewed at Stripe? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
