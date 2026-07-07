# Build a Kanban Board (Drag & Drop)

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#dnd` `#state` `#a11y`

**Asked at:** _Atlassian (Trello/Jira), Meta, Airbnb_ · **Related:** [Nested Comments](nested-comments.md) · [System design: Trello](../15-system-design/README.md)

---

## 1. The Question

> Build a Trello-style Kanban board: multiple columns of cards; drag cards within and across columns; reorder columns.

## 2. Requirements

**Functional**
- [ ] Columns with ordered cards.
- [ ] Drag a card within a column (reorder) and across columns (move).
- [ ] Visual drop indicator; smooth drag.
- [ ] Add/edit/delete cards and columns.

**Non-functional**
- [ ] Correct ordering after any drop.
- [ ] Accessible drag alternative (keyboard).
- [ ] Reasonable perf with many cards.
- [ ] Optimistic persistence (survives reload if wired to a backend).

## 3. Data Model

```ts
type Board = {
  columns: string[];                     // ordered column ids
  columnCards: Record<string, string[]>; // columnId -> ordered card ids
  cards: Record<string, Card>;           // normalized cards
};
```

Normalized + **explicit order arrays** make reordering a pure array splice — the cleanest model for DnD.

## 4. Implementation Notes & Trade-offs

**DnD approach** → three options:
1. **HTML5 Drag and Drop API** — native, but quirky (ghost images, `dragover` `preventDefault`, poor touch support).
2. **Pointer events** (custom) — full control, works on touch, more code.
3. **A library** (dnd-kit) — production choice; accessible, touch-friendly. In an interview, implement a minimal version with pointer events and *mention* the library.

**Reorder math** → on drop, compute source `{col, index}` and target `{col, index}`, then splice out of source order array and splice into target. Because state is normalized order arrays, this is simple and immutable.

**Drop indicator** → track the hovered column + insertion index; render a placeholder gap. Compute index from pointer Y vs card midpoints.

**Optimistic + persistence** → update local state immediately; if backed by an API, send the move and roll back on failure. Concurrent edits from others need reconciliation (mention it).

**Performance** → avoid re-rendering every card on each `dragover` — throttle position calc with rAF, memoize cards, only re-render the affected columns.

**Accessibility** → drag-and-drop is inaccessible by default. Provide a keyboard alternative: focus a card, press Space to "pick up", arrow keys to move, Space to drop, with `aria-live` announcements ("Card moved to In Progress, position 2"). dnd-kit implements this.

**Edge cases** → empty columns (need a drop zone), dropping onto self, auto-scroll near edges, dragging the last card out of a column.

## 5. What Interviewers Probe

- Native DnD vs pointer events vs library — trade-offs.
- State shape that makes reordering clean (normalized order arrays).
- How do you compute the insertion index?
- Keyboard-accessible dragging.
- Avoiding re-render storms during drag (rAF + memo).
- Optimistic move + rollback.

## 6. Curated Resources

- [dnd-kit docs ⭐](https://docs.dndkit.com/) — accessible, modern DnD (study its a11y model)
- [MDN: HTML Drag and Drop API](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API)
- [MDN: Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events)
- [W3C: making DnD accessible](https://www.w3.org/WAI/ARIA/apg/)

## 7. Related Topics

- [Nested Comments (tree state)](nested-comments.md)
- [State: normalization](../13-state-management/)
- [Interview Patterns: animations & 60fps](../17-interview-patterns/)
