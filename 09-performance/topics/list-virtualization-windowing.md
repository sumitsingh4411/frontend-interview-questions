<div align="center">

# List virtualization / windowing

<sub>🚀 Performance · 🔴 Hard · ⏱ 1.5h · `#large-data` `#rendering`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Rendering 10,000 rows means 10,000 DOM nodes the browser has to lay out, paint, and keep in memory. Virtualization renders only the ~20 rows in the viewport (plus a small overscan buffer) and fakes the scrollbar height with a spacer — turning an O(n) DOM into an O(viewport) one.

---

## 🧠 Mental model

The DOM is expensive per node — layout, style, paint, memory, and hit-testing all scale with node count. A 10,000-row table isn't slow because of *your* code; it's slow because the browser is maintaining 10,000 boxes it will never show at once.

Virtualization is a con trick played on the scrollbar. You render one tall empty container (`height = rowCount × rowHeight`) so the scrollbar *looks* full-length, but you only mount the handful of rows that intersect the viewport, absolutely positioned at their true offset.

```
Real DOM (windowed)          What the user perceives
┌─ scroll container ─┐       ┌────────────────────┐
│ ░ spacer (top)     │       │ row 412            │
│ ▓ row 412  ◀ mount │       │ row 413            │  ← scrollbar says
│ ▓ row 413          │  ===  │ row 414            │    "10,000 rows"
│ ▓ row 414          │       │ ...                │    but only ~20
│ ░ spacer (bottom)  │       └────────────────────┘    exist in the DOM
└────────────────────┘
```

As the user scrolls, you recompute *which* slice is visible and swap the mounted rows. The DOM size stays constant no matter how many items back it.

## ⚙️ How it actually works

**The core math** (fixed-height rows): given `scrollTop`, `rowHeight`, and viewport height `H`:

```
startIndex = floor(scrollTop / rowHeight) - overscan
endIndex   = ceil((scrollTop + H) / rowHeight) + overscan
```

You render `items[startIndex..endIndex]`, each translated to `top = index × rowHeight`. **Overscan** (rendering a few extra rows above and below) hides the flash of blank space when scrolling fast, because the browser paints slightly ahead of the viewport.

**Variable heights** are the hard mode. You don't know a row's height until it's rendered, so `top = index × rowHeight` breaks. Two strategies:
- **Estimate + measure + correct**: render with an estimated height, measure the real height via `ResizeObserver`, cache it, and maintain a running offset map. Scroll position must be *anchored* so measuring row 500 doesn't jump the viewport.
- **Precompute** if heights are derivable from data (known text length, image aspect ratio).

**Scroll performance.** The scroll handler fires on the main thread; doing heavy work there causes jank. You throttle to `requestAnimationFrame` (one recompute per frame max) or use an `IntersectionObserver`-based sentinel approach that offloads visibility detection to the browser.

**Accessibility is where naive implementations fail.** A screen reader sees only the mounted rows — so it announces "row 3 of 20" when there are 10,000. You must set `aria-rowcount` / `aria-setsize` on the container and `aria-rowindex` / `aria-posinset` on each row so assistive tech knows the *true* size.

## 💻 Code

```jsx
// Minimal fixed-height windowing — the whole idea in ~25 lines.
function VirtualList({ items, rowHeight = 40, height = 400, overscan = 3 }) {
  const [scrollTop, setScrollTop] = useState(0);

  const total = items.length * rowHeight;
  const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
  const end = Math.min(
    items.length,
    Math.ceil((scrollTop + height) / rowHeight) + overscan
  );
  const visible = items.slice(start, end);

  return (
    <div
      style={{ height, overflow: 'auto' }}
      // rAF-throttle: never recompute more than once per frame
      onScroll={(e) => {
        const top = e.currentTarget.scrollTop;
        requestAnimationFrame(() => setScrollTop(top));
      }}
      aria-rowcount={items.length} // ✅ true size for screen readers
    >
      {/* spacer gives the scrollbar its full, fake height */}
      <div style={{ height: total, position: 'relative' }}>
        {visible.map((item, i) => {
          const index = start + i;
          return (
            <div
              key={item.id}                 // ✅ stable key, NOT the array index
              role="row"
              aria-rowindex={index + 1}
              style={{
                position: 'absolute',
                top: index * rowHeight,      // true offset
                height: rowHeight,
                left: 0,
                right: 0,
              }}
            >
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

In production, reach for `@tanstack/react-virtual` or `react-window` — they solve variable heights, RTL, sticky headers, and scroll anchoring you'll get subtly wrong by hand.

## ⚖️ Trade-offs

- **Virtualization trades correctness-for-free for complexity.** You lose native `Ctrl+F` find-in-page (unmounted rows aren't in the DOM), anchor links to off-screen rows, and simple CSS like `:nth-child` striping across the whole list.
- **When NOT to virtualize:** under ~100 simple rows it's pure overhead — the machinery costs more than it saves, and you've broken find-in-page for nothing. Measure first.
- **Variable-height lists are a genuine tax.** If heights are unknown, expect scroll-anchoring bugs and jump-on-measure. Fixed heights are dramatically simpler; design for them if you can.
- **`content-visibility: auto`** is the CSS-native alternative: the browser skips rendering off-screen subtrees for you, no JS. It keeps nodes in the DOM (so find-in-page works) but you don't control the window — good middle ground for moderate lists.

## 💣 Gotchas interviewers probe

- **Using the array index as `key`** — when the window slides, React reuses DOM nodes for different data, causing input state and focus to leak between rows. Use a stable id.
- **Screen readers announce the wrong count.** The #1 thing candidates forget. Without `aria-rowcount`/`aria-setsize`, virtualization is an accessibility regression.
- **Find-in-page (`Ctrl+F`) silently breaks** because off-screen content isn't in the DOM. A real product cost people don't anticipate.
- **Scroll anchoring on variable heights.** Measuring a row and updating its cached height shifts everything below it — without compensating `scrollTop`, the viewport jumps. This is *the* hard bug.
- **Jank from unthrottled scroll handlers.** Recomputing per scroll event (which can fire faster than paint) instead of per `requestAnimationFrame` drops frames.
- **Nested scroll / sticky headers** interact badly with absolute positioning if you don't account for them in the offset math.
- **`overscan` of zero** shows blank flashes on fast scroll; too high defeats the purpose. ~3–5 rows is the sweet spot.

## 🎯 Say this in the interview

> "The problem isn't my rendering code, it's that the DOM cost is O(n) — 10,000 rows is 10,000 boxes the browser lays out and paints. Windowing makes it O(viewport): I render a tall empty spacer so the scrollbar looks full-length, then mount only the ~20 rows intersecting the viewport plus a few overscan rows, each absolutely positioned at `index × rowHeight`. On scroll I recompute the visible slice, throttled to `requestAnimationFrame`. The parts I'm careful about: stable keys so sliding the window doesn't leak row state, and accessibility — a screen reader only sees mounted rows, so I set `aria-rowcount` and `aria-rowindex` for the true size. Variable heights are the hard case; I estimate, measure with a ResizeObserver, and anchor scroll position so measuring doesn't jump the viewport. In production I'd use TanStack Virtual rather than hand-roll the scroll-anchoring, and for moderate lists I'd consider `content-visibility: auto` since it keeps find-in-page working."

## 🔗 Go deeper

- [Build a virtualized list (flagship)](../../06-react/build-a-virtualized-list.md) — the full implementation walkthrough in this repo.
- [TanStack Virtual — docs](https://tanstack.com/virtual/latest) — the modern, headless virtualization primitive with variable-size support.
- [web.dev — content-visibility](https://web.dev/articles/content-visibility) — the CSS-native way to skip off-screen rendering.
- [MDN — ARIA grid roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/grid_role) — `aria-rowcount`/`aria-rowindex` for virtualized tables.
