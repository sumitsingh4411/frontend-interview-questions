# React Deep-Dive: Build a Virtualized List

> **Difficulty:** 🔴 Hard · **Est. time:** `1.5h` · **Tags:** `#performance` `#large-data` `#rendering`

**Asked at:** _Meta, Google, Airbnb, Uber_ · **Related:** [News Feed](../15-system-design/design-news-feed.md) · [Performance](../09-performance/)

---

## 1. The Problem

Rendering 50,000 rows puts 50,000 nodes in the DOM → huge memory, slow scroll, janky everything. **Virtualization (windowing)** renders only the rows in (and near) the viewport, mapped to their real scroll positions.

## 2. The Core Idea

```
Total scrollable height = itemCount * itemHeight   (a tall spacer)
Visible window = [startIndex, endIndex] from scrollTop
Render only those rows, absolutely positioned at index * itemHeight
```

## 3. Fixed-Height Implementation

```jsx
function VirtualList({ items, itemHeight = 40, height = 400, overscan = 5, renderItem }) {
  const [scrollTop, setScrollTop] = React.useState(0);

  const total = items.length * itemHeight;
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visibleCount = Math.ceil(height / itemHeight) + overscan * 2;
  const end = Math.min(items.length, start + visibleCount);

  const rows = [];
  for (let i = start; i < end; i++) {
    rows.push(
      <div key={i} style={{ position: 'absolute', top: i * itemHeight, height: itemHeight, width: '100%' }}>
        {renderItem(items[i], i)}
      </div>
    );
  }

  return (
    <div style={{ height, overflowY: 'auto', position: 'relative' }}
         onScroll={e => setScrollTop(e.currentTarget.scrollTop)}>
      <div style={{ height: total, position: 'relative' }}>{rows}</div>
    </div>
  );
}
```

- **Spacer** (`height: total`) gives a correct scrollbar.
- **Overscan** renders a few extra rows above/below to avoid blank flashes on fast scroll.
- Only `visibleCount + 2*overscan` nodes exist at any time — constant regardless of list size.

## 4. Deep Dives & Trade-offs

**Fixed vs variable height** → fixed height = trivial math. **Variable/unknown heights** (feed posts, chat) need measurement: render, measure with `ResizeObserver`, cache heights, and maintain a cumulative-offset index (often a prefix-sum / interval tree) to map scrollTop → index. This is the hard part; libraries handle it.

**Scroll performance** → `onScroll` fires a lot. Update via rAF or accept React's batching; avoid heavy work in the handler. Absolute positioning avoids reflowing sibling rows.

**Jank & blank rows** → overscan + not doing layout-thrashing reads in the scroll handler. For images, reserve height (`aspect-ratio`) to prevent shift.

**Dynamic content / resize** → recompute on container resize (`ResizeObserver`); re-measure items whose content changes.

**Accessibility** → virtualization hides rows from the DOM, breaking screen-reader navigation and in-page find. Mitigate with proper `aria-setsize`/`aria-posinset`, and consider not virtualizing when a screen reader/`find` is active. Call this trade-off out — interviewers love it.

**When NOT to virtualize** → small lists (<100), or when SEO needs all content in the DOM (virtualized rows aren't crawlable).

**Horizontal / grid** → same idea in 2D (windowed rows *and* columns).

## 5. What Interviewers Probe

- The math: total height, start/end index, positioning.
- Why overscan?
- Fixed vs dynamic row heights — how to handle unknown sizes.
- Accessibility & find-in-page trade-offs.
- Scroll-handler performance (rAF, no layout thrash).
- When virtualization is the wrong choice.

## 6. Curated Resources

- [web.dev: virtualize large lists with react-window ⭐](https://web.dev/articles/virtualize-long-lists-react-window)
- [TanStack Virtual (dynamic sizes) ⭐](https://tanstack.com/virtual/latest/docs/introduction)
- [react-window](https://github.com/bvaughn/react-window) — read the source
- [MDN: ResizeObserver](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver)

## 7. Related Topics

- [Design a News Feed](../15-system-design/design-news-feed.md)
- [Performance: large data](../09-performance/)
- [Machine coding: Data Grid](../16-machine-coding/)
