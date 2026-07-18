<div align="center">

# Infinite scroll vs pagination

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#large-data` `#ux`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — This is a UX-and-data-modelling decision, not a performance one: infinite scroll wins for lean-back discovery feeds, pagination wins for task-oriented finding. The real trap is the data layer — **offset pagination breaks under a live-updating list; cursor pagination is the only correct choice** for feeds.

---

## 🧠 Mental model

The surface question is "how does the user get more items?" The real question is "what is the user *doing*?"

- **Infinite scroll** suits **exploration** — feeds, image grids, anything where there's no destination and the goal is to keep the user browsing. There's no page number because there's no "where am I."
- **Pagination** suits **retrieval** — search results, tables, dashboards — where users need bookmarkable positions, "jump to page 40," a sense of the corpus size, and a reachable footer.

```
Infinite scroll          Pagination
────────────────         ───────────────
discovery / feeds        finding / tables
no end-state             bounded, countable
no footer reachable      footer, "1..40 of 900"
hard to return to X      deep-linkable position
```

The engineering follows the UX: infinite scroll almost always means **cursor-based** fetching and (if the DOM grows unbounded) **virtualization**; pagination means **offset/limit** with a total count.

## ⚙️ How it actually works

**Offset pagination** — `LIMIT 20 OFFSET 40`. Simple, gives you page numbers and totals. Two fatal flaws at scale:
1. **It's O(offset)** — the database still scans and discards the first 40 rows. `OFFSET 100000` is genuinely slow.
2. **It's incorrect on live data.** If a new item is inserted at the top between loading page 1 and page 2, every row shifts down by one — the user sees the last item of page 1 *again* at the top of page 2 (a duplicate), and something gets skipped. For a feed, this is unacceptable.

**Cursor (keyset) pagination** — "give me 20 items *after* this opaque cursor," where the cursor encodes the sort key of the last item (`WHERE (created_at, id) < (:ts, :id) ORDER BY created_at DESC, id DESC LIMIT 20`). It's O(1) regardless of depth (index seek, no scanning-and-discarding), and it's **stable under insertion** because it anchors on a value, not a position. The cost: no random access — you can't jump to "page 40," only walk forward.

**Infinite scroll trigger.** Use an `IntersectionObserver` on a sentinel element near the bottom, not a scroll listener — it fires off the main thread and doesn't jank. Fetch the next cursor page *before* the user hits the very end (root margin) so content is ready.

**The DOM-growth problem.** Infinite scroll that keeps appending eventually holds thousands of nodes → memory bloat and slow scrolling. Combine it with **virtualization** (unmount off-screen items) for long-lived feeds. Also preserve **scroll restoration**: navigating into an item and back must return to the same offset, or the whole feed reloads from the top — a notorious UX failure.

## 💻 Code

```js
// ❌ Offset pagination on a live feed — duplicates & skips on insert.
async function loadPage(page) {
  return fetch(`/api/feed?limit=20&offset=${page * 20}`);
  // A new post at the top shifts everything → page 2 repeats an item.
}

// ✅ Cursor pagination — stable under insertion, O(1) at any depth.
async function loadMore(cursor) {
  const res = await fetch(`/api/feed?limit=20${cursor ? `&after=${cursor}` : ''}`);
  const { items, nextCursor } = await res.json();
  return { items, nextCursor }; // opaque cursor = last item's (createdAt,id)
}
```

```jsx
// Trigger the next fetch with IntersectionObserver, not a scroll handler.
function Feed() {
  const [pages, setPages] = useState([]);
  const [cursor, setCursor] = useState(null);
  const sentinel = useRef(null);

  useEffect(() => {
    const io = new IntersectionObserver(
      async ([entry]) => {
        if (!entry.isIntersecting) return;
        const { items, nextCursor } = await loadMore(cursor);
        setPages((p) => [...p, ...items]);
        setCursor(nextCursor);
      },
      { rootMargin: '400px' } // fetch BEFORE the user reaches the bottom
    );
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cursor]);

  return (
    <>
      {pages.map((it) => <Row key={it.id} item={it} />)}
      <div ref={sentinel} aria-hidden />
    </>
  );
}
```

## ⚖️ Trade-offs

- **Infinite scroll kills the footer.** Anything living below the feed — links, legal, "load more" of a *different* section — becomes permanently unreachable. For a site that needs a footer, this alone rules it out.
- **Pagination gives control and orientation** — total count, deep links, "back to page 3" — at the cost of an interaction per page and a jarring full-list swap.
- **Hybrid — "Load more" button** — is underrated: cursor-fetched like infinite scroll, but user-initiated, so the footer stays reachable, screen-reader users aren't ambushed, and you don't fetch unboundedly. Often the correct default.
- **When NOT to use infinite scroll:** search results (users compare and revisit), any table users sort/scan, or anything that must be linkable. Discovery feeds only.
- **SEO:** classic infinite scroll can hide content from crawlers; paginated URLs (or a paginated fallback) are crawlable. Matters for public content.

## 💣 Gotchas interviewers probe

- **Offset pagination on live data duplicates and skips rows.** The single highest-signal answer here. Cursor pagination is the fix, and knowing *why* (positional vs value anchoring) separates seniors from juniors.
- **`OFFSET n` is O(n) in the database** — it scans and throws away n rows. Deep pages are slow even with an index.
- **Scroll restoration.** Tapping an item and hitting back must return to the exact scroll offset. Naive infinite scroll resets to the top and refetches — a top user complaint.
- **Unbounded DOM growth.** Appending forever leaks memory and janks scrolling; pair infinite scroll with virtualization for long sessions.
- **Accessibility & the "no end" problem.** Keyboard and screen-reader users can never reach content after the feed. A "Load more" button is far more accessible than auto-loading.
- **Double-fetching** from a fast-scrolling sentinel — guard with an in-flight flag or the observer fires twice before state updates.
- **No total count with cursors** — you lose "900 results." If the product needs a count, you need a separate (possibly approximate) count query.

## 🎯 Say this in the interview

> "I treat it as a UX decision driven by intent: infinite scroll for lean-back discovery feeds, pagination for task-oriented finding where people need deep links, totals, and a reachable footer. Then the data layer follows. The key insight is that offset pagination is both O(offset) in the database and *incorrect* on a live list — inserting an item at the top shifts every position, so the user sees duplicates and skips across page boundaries. So for any feed I use cursor pagination: the cursor encodes the last item's sort key, which makes it an O(1) index seek and stable under insertion, at the cost of losing random access and totals. For the trigger I use an IntersectionObserver on a sentinel with a root margin so I fetch before the user hits bottom, I virtualize once the DOM gets large, and I make sure scroll position is restored on back-navigation. Honestly my default is often a 'Load more' button — cursor-fetched but user-initiated, so the footer and accessibility survive."

## 🔗 Go deeper

- [Design a news feed (flagship)](../../15-system-design/design-news-feed.md) — the end-to-end feed architecture in this repo, cursors included.
- [Slack Engineering — Evolving API pagination](https://slack.engineering/evolving-api-pagination-at-slack/) — why they moved to cursors, with the exact failure modes.
- [MDN — IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — the correct, jank-free way to trigger loads.
- [NN/g — Infinite scrolling UX](https://www.nngroup.com/articles/infinite-scrolling-tips/) — when infinite scroll helps and when it hurts.
