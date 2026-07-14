<div align="center">

# Virtualization / windowing

<sub>⚛️ React · 🔴 Hard · ⏱ 1.5h · `#performance` `#large-data`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Render only the rows in (and just around) the viewport, fake the full scroll height with a spacer, and recycle DOM as the user scrolls — turning 100,000 rows into ~20 live nodes, because the DOM is the bottleneck, not the array.

---

## 🧠 Mental model

The expensive resource is **DOM nodes**, not data. A JS array of 100k objects is nothing; 100k `<li>`s is layout, paint, memory, and event-handler bookkeeping the browser has to carry on every reflow. Windowing **decouples "how much data exists" from "how many nodes exist"** — the list *behaves* as if all rows are present (scrollbar length, scroll position) while only the visible slice is mounted.

The illusion has two parts: a tall **spacer** that gives the scroll container its true height so the scrollbar is honest, and an **offset** that positions the small mounted slice at the right place inside that height as you scroll.

## ⚙️ How it actually works

For a **fixed row height** it's arithmetic:

```
totalHeight = itemCount * rowHeight            // the spacer height
startIndex  = floor(scrollTop / rowHeight)     // first visible row
visible     = ceil(viewportHeight / rowHeight) // how many fit
endIndex    = startIndex + visible + overscan  // render a few extra above/below
offsetY     = startIndex * rowHeight           // translate the slice into place
```

You listen to the container's `scroll` event, recompute `startIndex`, and render `items.slice(start, end)` inside an absolutely-positioned (or `transform: translateY`) inner element. **Overscan** (a handful of extra rows each side) hides the blank-edge flicker during fast scrolls.

**Variable/unknown heights** are the genuinely hard case: you can't compute offsets without knowing sizes. Real libraries render rows, **measure them** (`ResizeObserver`), cache the measurements, and use an **estimated size** for not-yet-measured rows — then patch the running offset as measurements arrive. That correction can cause tiny scroll jumps, which is why measured virtualization is fiddly.

## 💻 Code

A minimal fixed-height windowing hook, from scratch:

```jsx
function VirtualList({ items, rowHeight = 40, height = 400, overscan = 5 }) {
  const [scrollTop, setScrollTop] = useState(0);

  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const visible = Math.ceil(height / rowHeight) + overscan * 2;
  const end = Math.min(items.length, start + visible);
  const slice = items.slice(start, end);

  return (
    <div
      style={{ height, overflow: 'auto' }}
      onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* spacer gives the scrollbar the true full height */}
      <div style={{ height: items.length * rowHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${start * rowHeight}px)` }}>
          {slice.map((item, i) => (
            <div key={item.id} style={{ height: rowHeight }}>
              {item.label /* keys are STABLE data ids, never the slice index */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

In production, reach for **TanStack Virtual** or **react-window** rather than hand-rolling — they handle measurement, horizontal lists, and grids.

## ⚖️ Trade-offs

- **You break native browser features.** Ctrl/Cmd-F find-in-page only searches mounted rows; `#anchor` links to off-screen rows fail; text selection across the recycle boundary tears. These are real UX regressions, not theoretical.
- **Accessibility needs work.** Screen readers see a partial list. Set `aria-setsize`/`aria-posinset` (or `role="feed"`) so assistive tech knows the true count and position.
- **When NOT to virtualize:** small lists (roughly < 50–100 rows) — the machinery costs more than it saves; content that must be SEO-indexed (crawlers don't scroll); lists where every row is a heavy interactive form and users tab through all of them.
- **`content-visibility: auto` is the zero-JS competitor.** It lets the browser skip rendering off-screen elements while keeping them in the DOM (so find-in-page still works). Cheaper to adopt; less control; needs `contain-intrinsic-size` to avoid scrollbar jump.

## 💣 Gotchas interviewers probe

- **Keys must be stable data IDs, not the slice index.** Index keys make React reuse the wrong row's state/DOM as the window shifts — the classic virtualization bug.
- **Focus loss on recycle.** Scrolling a focused input off-screen unmounts it and drops focus. Interactive rows need care or shouldn't be virtualized.
- **Scroll anchoring jumps** when measured heights differ from estimates; you must patch offsets without yanking `scrollTop`.
- **Find-in-page / Cmd-F is broken** — the single most-cited downside. Know it.
- **Doing heavy work in the `scroll` handler** janks; keep it to arithmetic, and drive rendering from actual `scrollTop`, not a debounce that lags behind the finger.
- **`content-visibility: auto`** as an answer shows you know the platform now solves part of this for free.

## 🎯 Say this in the interview

> "Virtualization exists because the bottleneck is DOM nodes, not data — the browser is fine with a 100k-element array but chokes on 100k elements. So I render only the visible slice plus a small overscan, use a spacer div with the full `count * rowHeight` height to keep the scrollbar honest, and translate the mounted slice into position on scroll. Fixed heights are just arithmetic; variable heights are the hard part because you have to render, measure with a `ResizeObserver`, cache sizes, and estimate the rest — which can cause scroll jumps. The costs I call out are that it breaks Cmd-F, anchor links, and accessibility unless I add `aria-setsize`/`aria-posinset`, and that keys must be stable data IDs or React reuses the wrong row. In production I use TanStack Virtual, and for simpler cases `content-visibility: auto` gets a lot of the win with zero JS."

## 🔗 Go deeper

- [TanStack Virtual](https://tanstack.com/virtual/latest) — headless virtualization for lists, grids, and variable sizes; the modern default.
- [react-window](https://react-window.vercel.app/) — the classic, minimal windowing library; great for understanding the primitives.
- [web.dev — `content-visibility`](https://web.dev/articles/content-visibility) — the CSS-native way to skip off-screen rendering.
- [MDN — `aria-setsize`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-setsize) — telling assistive tech the true list size when the DOM lies.
