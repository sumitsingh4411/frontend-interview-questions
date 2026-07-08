# 🟥 Pinterest — Frontend Interview Guide

> **Emphasis:** Image-heavy feeds, the masonry grid, and image/scroll performance. Visual product → rendering and lazy-loading expertise matter.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | JS/DSA | [03-javascript](../03-javascript/) |
| Coding | UI component | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | Feed/grid "Design X" | [15-system-design](../15-system-design/) |
| Behavioral | Collaboration | — |

## What they emphasize

- **Masonry / grid layout** — variable-height items, virtualization.
- **Image performance** — lazy loading, responsive images, CLS, formats.
- **Infinite scroll** feeds at scale.
- **Rendering performance** on image-dense pages.

## Frequently asked (community-sourced)

**System design**
- Design Pinterest (masonry feed) → [15-system-design](../15-system-design/)
- Design an Image Gallery / Carousel → [flagship](../15-system-design/design-image-carousel.md)
- Design a News Feed (infinite) → [flagship](../15-system-design/design-news-feed.md)

**Machine coding**
- Build a masonry grid with virtualization → [flagship](../06-react/build-a-virtualized-list.md)
- Build an image lightbox → [carousel flagship](../15-system-design/design-image-carousel.md)
- Build lazy-loaded image list → [performance](../09-performance/)

**Fundamentals**
- Image optimization, CLS, `IntersectionObserver` → [09-performance](../09-performance/)

## Prep plan (2 weeks)

1. Master variable-height [virtualization](../06-react/build-a-virtualized-list.md) (the masonry core).
2. Study [image performance](../09-performance/) (lazy load, srcset, CLS).
3. Build a masonry/gallery component.
4. Practice a visual-feed system design.

## 🟢 Green flags · 🔴 Red flags

**🟢 Do:** implement masonry with variable-height virtualization · optimize images (lazy, `srcset`, formats) · prevent CLS · keep infinite feeds smooth.
**🔴 Avoid:** loading all images upfront · layout shift from unsized media · unbounded DOM on long feeds.

## 📝 Sample interviewer prompts

- "Build a **masonry grid** with virtualization."
- "How do you prevent layout shift (CLS) on an image feed?"
- "Design the Pinterest home feed."

---

> _Interviewed at Pinterest? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
