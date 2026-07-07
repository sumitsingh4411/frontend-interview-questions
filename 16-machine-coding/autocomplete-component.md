# Build an Autocomplete Component

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#input` `#async` `#a11y` `#debounce`

**Asked at:** _Google, Meta, Amazon, Airbnb_ · **Related:** [System design: Autocomplete](../15-system-design/design-autocomplete.md) · [debounce/throttle](../03-javascript/promise-polyfills-and-throttle-debounce.md)

---

## 1. The Question

> Build a reusable autocomplete/typeahead input that fetches suggestions as the user types, is keyboard-accessible, and handles loading/error/empty states.

## 2. Requirements

**Functional**
- [ ] Fetch suggestions from an async source (props: `fetchSuggestions(query)`).
- [ ] Debounce input; cancel stale requests.
- [ ] Keyboard: ↑/↓ to move, Enter to select, Esc to close.
- [ ] Mouse + touch selection; click-outside closes.
- [ ] States: idle, loading, results, no-results, error.

**Non-functional**
- [ ] ARIA `combobox` pattern.
- [ ] No request per keystroke; no race conditions.
- [ ] Reusable API; controlled `value`/`onChange`.

## 3. Component API

```ts
type AutocompleteProps<T> = {
  value: string;
  onChange: (value: string) => void;
  onSelect: (item: T) => void;
  fetchSuggestions: (query: string, signal: AbortSignal) => Promise<T[]>;
  getLabel: (item: T) => string;
  debounceMs?: number;   // default 250
  minChars?: number;     // default 1
};
```

## 4. Implementation Notes & Trade-offs

**Debounce** → a `useDebouncedValue(value, 250)` hook (or a debounced effect). Query only after the user pauses.

**Race conditions** → each fetch gets an `AbortController`; abort the previous one before firing a new one. Also guard by comparing the resolved query to the current input before setting state.

**Highlighted index** → track `activeIndex`; wire `aria-activedescendant` to the option id. Reset on new results. Scroll the active option into view.

**Accessibility (combobox)** → input has `role="combobox"`, `aria-expanded`, `aria-controls={listboxId}`, `aria-autocomplete="list"`. Listbox has `role="listbox"`; options `role="option"` with `aria-selected`. Announce result counts via `aria-live="polite"`.

**Match highlighting** → split each label on the query and wrap matches in `<mark>` — never `innerHTML` (XSS).

**Edge cases** → empty input clears results; trailing whitespace; rapid backspace (cache hits); no-results message; error retry; click-outside via a `pointerdown` listener; don't lose focus on option click (use `onMouseDown` `preventDefault`).

**Cleanup** → abort in-flight requests and clear timers on unmount.

## 5. What Interviewers Probe

- Debounce vs throttle here?
- How do you kill stale responses? (AbortController + query guard)
- Full keyboard model + focus handling.
- ARIA combobox correctness.
- Why not `dangerouslySetInnerHTML` for highlighting?
- How do you make it reusable (headless vs styled)?

## 6. Curated Resources

- [ARIA APG: combobox ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — the exact a11y contract
- [MDN: AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [System-design version](../15-system-design/design-autocomplete.md) — the scaled discussion
- [GreatFrontEnd: Autocomplete](https://www.greatfrontend.com/questions/user-interface)

## 7. Related Topics

- [Nested Comments](nested-comments.md) · [Star Rating](star-rating.md)
- [debounce/throttle flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md)
- [Accessibility](../11-accessibility/)
