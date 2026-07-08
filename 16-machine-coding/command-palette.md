# Build a Command Palette (⌘K)

> **Difficulty:** 🔴 Hard · **Est. time:** `1h` · **Tags:** `#search` `#a11y` `#keyboard` `#async`

**Asked at:** _Linear-style products, Vercel, Notion, Slack_ · **Related:** [Autocomplete](autocomplete-component.md) · [Modal](modal-dialog.md)

---

## 1. The Question

> Build a command palette (like ⌘K in VS Code / Linear / Slack): a keyboard-triggered overlay to search and run commands, navigate, or jump to items — with fuzzy search and grouped results.

## 2. Requirements

**Functional**
- [ ] Open with ⌘K / Ctrl+K; close on Esc.
- [ ] Fuzzy-search commands as you type.
- [ ] Grouped results (e.g. "Actions", "Navigation", "Recent").
- [ ] Keyboard: ↑/↓ to move, Enter to run, wraps around groups.
- [ ] Async command sources (search files/users) with loading state.
- [ ] Nested pages (e.g. pick a command → choose an argument).

**Non-functional**
- [ ] Instant, no jank while typing.
- [ ] Fully accessible (combobox/listbox pattern).
- [ ] Extensible command registry.

## 3. Architecture

```
⌘K ─▶ open overlay (portal + focus trap, see Modal flagship)
input ─debounce─▶ query
   │
   ├─ sync commands ── fuzzy match ─┐
   └─ async sources ── fetch ───────┤─▶ merge + group + rank ─▶ list
                                     │
   ↑/↓ activeIndex   Enter ─▶ run selected command
```

- **Command registry:** a list of `{ id, title, group, keywords, perform, icon }` — extensible.
- **Overlay:** reuses the [Modal](modal-dialog.md) mechanics (portal, focus trap, Esc, return focus).
- **Search:** fuzzy match + rank across sync commands and async result sources.

## 4. Implementation Notes & Trade-offs

**Global shortcut** → a `keydown` listener on `document` for `(e.metaKey || e.ctrlKey) && e.key === 'k'`; `preventDefault` (browsers use ⌘K too). Clean up on unmount. Guard against firing inside inputs where appropriate.

**Fuzzy search** → subsequence match (characters appear in order) with a score favoring contiguous matches, start-of-word, and shorter targets. For large sets use a library (Fuse.js) or precomputed index; state the trade-off vs a simple `includes`.

**Merging sync + async** → sync commands render instantly; async sources (files, users) stream in with their own loading state. Use `AbortController` to cancel stale async queries (same race-condition handling as [autocomplete](autocomplete-component.md)).

**Keyboard model** → a single `activeIndex` across the flattened, grouped list. ↑/↓ move and wrap; group headers are skipped (not selectable). Scroll the active item into view. Enter runs `perform()`.

**Nested pages** → a small stack: selecting a command can push a new "page" (e.g. "Assign to → pick user") with its own input/results; Backspace at empty input pops the page.

**Accessibility** → combobox pattern: input `role="combobox"` + `aria-expanded` + `aria-controls`; results `role="listbox"`; items `role="option"` with `aria-selected`; `aria-activedescendant` points to the active item; announce result counts via `aria-live`. Focus trap while open (reuse Modal).

**Performance** → debounce input; cap rendered results; virtualize only if the list is huge; memoize the fuzzy-ranked list on `(query, commands)`.

**Edge cases** → no results state, recent/empty-query default list, very long titles (truncate), rapid open/close, running a command that itself opens another page.

## 5. What Interviewers Probe

- Global shortcut handling + `preventDefault` + cleanup.
- Fuzzy matching + ranking (and when to use a library).
- Merging instant sync commands with async sources (+ cancellation).
- Single `activeIndex` across grouped lists, with wrap + scroll-into-view.
- Reusing modal focus-trap mechanics.
- Combobox accessibility.
- Nested command pages (a stack).

## 6. Curated Resources

- [ARIA APG: combobox ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — accessibility contract
- [cmdk (Paco Coursey) ⭐](https://github.com/pacocoursey/cmdk) — reference implementation to study
- [Fuse.js](https://www.fusejs.io/) — fuzzy search
- [Modal flagship](modal-dialog.md) — the overlay/focus-trap mechanics
- [Autocomplete flagship](autocomplete-component.md) — async + race handling

## 7. Related Topics

- [Modal / Dialog](modal-dialog.md) · [Autocomplete](autocomplete-component.md)
- [Design a Search system](../15-system-design/design-autocomplete.md)
- [Accessibility: keyboard & focus](../11-accessibility/)
