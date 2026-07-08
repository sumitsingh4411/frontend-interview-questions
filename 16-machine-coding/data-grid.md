# Build a Data Grid (Sortable, Filterable, Virtualized)

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#large-data` `#virtualization` `#a11y` `#state`

**Asked at:** _Amazon, Atlassian, Stripe, enterprise/dashboard roles_ · **Related:** [Virtualized List](../06-react/build-a-virtualized-list.md) · [Kanban](kanban-drag-and-drop.md)

---

## 1. The Question

> Build a data grid/table that displays thousands of rows with column sorting, filtering, and (bonus) resizable columns and row selection — performant and accessible.

## 2. Requirements

**Functional**
- [ ] Render columns from a config; rows from data.
- [ ] Sort by column (asc/desc/none), multi-column bonus.
- [ ] Filter (per-column and/or global search).
- [ ] Handle thousands of rows smoothly (virtualization).
- [ ] Bonus: resizable/reorderable columns, row selection, sticky header.

**Non-functional**
- [ ] 60fps scroll with 10k+ rows.
- [ ] Accessible table semantics + keyboard.
- [ ] Reusable, config-driven API.

## 3. Component API

```ts
type Column<T> = {
  key: keyof T;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  width?: number;
  render?: (row: T) => React.ReactNode;
};

type DataGridProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  virtualized?: boolean;   // default true when rows > 100
};
```

## 4. Implementation Notes & Trade-offs

**Derived pipeline** → keep raw `rows` immutable; compute `filtered → sorted → windowed` via memoized selectors (`useMemo`). Sorting/filtering the raw data on every render is the common perf mistake — memoize on `(rows, sortState, filterState)`.

**Sorting** → store `{ columnKey, direction }`. Provide a default comparator (string/number/date) and allow per-column custom comparators. Cycle none→asc→desc. For big data, sort once per change, not per render.

**Filtering** → per-column predicates combined with global search. Debounce the global search input. For huge datasets, filtering server-side is better — state the trade-off.

**Virtualization** → windowing is required for thousands of rows; render only visible rows (see [virtualized list flagship](../06-react/build-a-virtualized-list.md)). Keep the header **sticky** and outside the scroll window. Fixed row height simplifies the math; variable heights need measurement.

**Column resize/reorder** → pointer events on the header border for resize (update column width state, throttle with rAF); drag for reorder (reorder the column array).

**Accessibility** → use real `<table>`/`role="grid"` semantics: `role="columnheader"` with `aria-sort`, `role="row"`/`role="gridcell"`. Note the tension: virtualization removes rows from the DOM, so set `aria-rowcount`/`aria-rowindex` so assistive tech knows the true size. Keyboard: arrow keys move the focused cell; Enter/Space activate.

**Row selection** → a `Set<rowKey>`; header checkbox = select-all (tri-state). Keep selection stable across sort/filter (key by id, not index).

**Edge cases** → empty state, all-filtered-out, extremely wide tables (horizontal scroll), long cell content (truncate + title), stable sort for equal keys.

## 5. What Interviewers Probe

- The derived pipeline (filter→sort→window) and memoization.
- Why virtualization is required; sticky header interplay.
- Accessible grid semantics with virtualization (`aria-rowcount`).
- Stable row identity across sort/filter (key by id).
- Debounced filtering; client vs server sorting/filtering.
- Column resize without re-render storms (rAF).

## 6. Curated Resources

- [Virtualized List flagship ⭐](../06-react/build-a-virtualized-list.md) — the windowing core
- [TanStack Table ⭐](https://tanstack.com/table/latest) — headless grid; study its architecture
- [ARIA APG: grid](https://www.w3.org/WAI/ARIA/apg/patterns/grid/) — accessible grid keyboard model
- [MDN: table accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML#table_of_contents)

## 7. Related Topics

- [Virtualized List](../06-react/build-a-virtualized-list.md)
- [Design an Analytics Dashboard](../15-system-design/README.md)
- [Performance: large data](../09-performance/)
