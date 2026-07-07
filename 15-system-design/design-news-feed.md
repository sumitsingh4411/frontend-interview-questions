# Design a News Feed / Infinite Scroll

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#feed` `#infinite-scroll` `#virtualization` `#caching`

**Asked at:** _Meta, Google, LinkedIn, Twitter/X_ · **Related:** [Autocomplete](design-autocomplete.md) · [Virtualized List](../06-react/build-a-virtualized-list.md) · [Interview Patterns](../17-interview-patterns/)

---

## 1. The Question

> Design the frontend for an infinitely scrolling social feed (Facebook / Twitter / LinkedIn). Users scroll through posts with text, images, and video; they can like, comment, and share.

## 2. Requirements

**Functional**
- [ ] Load and render an endless list of posts as the user scrolls.
- [ ] Each post: author, text, media, engagement counts, actions (like/comment/share).
- [ ] Optimistic like/unlike; comment inline.
- [ ] New posts can arrive at the top ("show new posts").

**Non-functional**
- [ ] Smooth 60fps scroll on mid-range mobile.
- [ ] Fast initial load (LCP < 2.5s); don't block on the whole feed.
- [ ] Memory stays bounded no matter how far the user scrolls.
- [ ] Accessible (keyboard, screen reader, focus order preserved on updates).

**Out of scope (state assumptions):** ranking algorithm (server-owned), auth, the composer.

## 3. High-Level Design

```
┌──────────────┐   GET /feed?cursor=…   ┌──────────┐
│  Feed Store  │ ─────────────────────▶ │   API    │
│ (pages+cache)│ ◀───────────────────── │  (BFF)   │
└──────┬───────┘   {items, nextCursor}  └──────────┘
       │ items
       ▼
┌──────────────────────┐   IntersectionObserver (sentinel)
│  Virtualized List    │ ── near bottom ──▶ fetch next page
│  (windowed render)   │
└──────────────────────┘
```

- **Data layer:** a paginated cache keyed by **cursor** (not offset — offsets break when items are inserted). Use React Query / SWR or a hand-rolled store.
- **Fetch trigger:** an `IntersectionObserver` on a sentinel near the list bottom (better than scroll listeners — no layout thrash, runs off the main thread).
- **Rendering:** **windowing / virtualization** so only ~visible rows are in the DOM.

## 4. Deep Dives & Trade-offs

**Pagination: cursor vs offset** → **cursor**. Offsets duplicate/skip items when new posts are inserted between fetches. Cursor (e.g. last item id/timestamp) is stable.

**Infinite scroll vs "Load more" vs pagination** → infinite scroll for engagement, but keep a **manual trigger fallback** for accessibility and to avoid the "can't reach the footer" problem. Announce new content via an ARIA live region.

**Virtualization** → essential. Without it, 10k DOM nodes destroy scroll performance and memory. Trade-off: **variable-height posts** (media loads late) make item measurement hard — use a measured/dynamic virtualizer that remembers heights, and reserve space for media (`aspect-ratio`) to prevent **CLS**. See [flagship](../06-react/build-a-virtualized-list.md).

**Media loading** → lazy-load images/video (`loading="lazy"` / IntersectionObserver), use responsive `srcset`, and always reserve space to avoid layout shift.

**Optimistic likes** → update UI immediately, reconcile on response, roll back on error. Debounce rapid toggles; send the final state.

**New posts at top** → don't jump the scroll. Show a "new posts" pill; prepend only when the user opts in, and **preserve scroll position** by anchoring to a stable element.

**Scroll restoration** → when navigating into a post and back, restore position + cached pages so the user doesn't lose their place.

## 5. What Interviewers Probe

- How do you keep memory bounded at post #5,000? (virtualization + evicting far-offscreen pages)
- How do you prevent layout shift from images/video?
- Cursor vs offset pagination — why?
- How does infinite scroll stay accessible?
- Duplicate/kept-alive requests when scrolling fast? (dedupe in-flight, AbortController)
- How do you restore scroll on back-navigation?
- Real-time new posts without disrupting reading position?

## 6. Curated Resources

- [web.dev: virtualize large lists ⭐](https://web.dev/articles/virtualize-long-lists-react-window) — the canonical windowing explainer
- [TanStack Virtual](https://tanstack.com/virtual/latest) — production virtualization, dynamic sizes
- [MDN: Intersection Observer ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — the fetch trigger
- [web.dev: optimize CLS](https://web.dev/articles/optimize-cls) — reserving media space
- [GreatFrontEnd: News Feed](https://www.greatfrontend.com/questions/system-design) — full walkthrough

## 7. Related Topics

- [Design a Virtualized List](../06-react/build-a-virtualized-list.md)
- [Design Autocomplete](design-autocomplete.md)
- [Performance: Core Web Vitals](../09-performance/)
- [Interview Patterns: large data handling](../17-interview-patterns/)
