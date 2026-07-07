# 🟦 Google — Frontend Interview Guide

> **Emphasis:** Web fundamentals, accessibility, performance, and raw DOM/JS — often **framework-agnostic**. Google cares that you understand the platform, not just a library.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | JS/DOM coding | [03-javascript](../03-javascript/) |
| Coding 1 | DSA + a DOM/UI twist | [16-machine-coding](../16-machine-coding/) |
| Coding 2 | Machine coding (vanilla-friendly) | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | "Design X" | [15-system-design](../15-system-design/) |
| Behavioral / Googleyness | Collaboration | — |

## What they emphasize

- **Platform fluency** — DOM APIs, event delegation, the event loop, browser rendering.
- **Accessibility** — semantic HTML and keyboard support are frequently scored.
- **Performance** — Core Web Vitals, minimizing reflows, efficient rendering.
- **Clean, framework-agnostic code** — be comfortable in vanilla JS, not just React.

## Frequently asked (community-sourced)

**Machine coding**
- Build an Autocomplete → [flagship](../16-machine-coding/autocomplete-component.md)
- Build a Carousel → [system design flagship](../15-system-design/design-image-carousel.md)
- Build an accessible Modal / Tabs → [16-machine-coding](../16-machine-coding/)
- Build Infinite Scroll → [flagship](../15-system-design/design-news-feed.md)

**System design**
- Design a News Feed → [flagship](../15-system-design/design-news-feed.md)
- Design Google Docs → [flagship](../15-system-design/design-google-docs.md)
- Design an autocomplete/search → [flagship](../15-system-design/design-autocomplete.md)

**JavaScript / fundamentals**
- Event loop, microtasks/macrotasks → [02-browser](../02-browser/)
- Event delegation, `this`, closures → [03-javascript](../03-javascript/)
- Debounce/throttle → [flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md)

## Prep plan (2 weeks)

1. Lock [fundamentals](../01-fundamentals/) + [browser internals](../02-browser/).
2. Grind [JS utilities](../16-machine-coding/#-js-utilities-implement-these) in **vanilla JS**.
3. Do 3 accessible components with keyboard support.
4. 3 mock system designs, focusing on perf + a11y trade-offs.

---

> _Interviewed at Google? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
