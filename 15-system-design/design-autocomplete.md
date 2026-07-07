# Design Autocomplete / Typeahead

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#search` `#debounce` `#caching` `#a11y`

**Asked at:** _Google, Meta, Amazon, Airbnb_ · **Related:** [Autocomplete component (machine coding)](../16-machine-coding/autocomplete-component.md) · [News Feed](design-news-feed.md)

---

## 1. The Question

> Design a search autocomplete (like Google's search box) that suggests results as the user types.

## 2. Requirements

**Functional**
- [ ] Show suggestions as the user types.
- [ ] Keyboard navigable (↑/↓/Enter/Esc); mouse + touch.
- [ ] Highlight the matched substring.
- [ ] Handle empty, loading, error, and no-results states.

**Non-functional**
- [ ] Feels instant — no jank, minimal network chatter.
- [ ] Doesn't fire a request per keystroke.
- [ ] Fully accessible (`combobox` pattern, screen-reader announcements).
- [ ] Resilient to out-of-order responses.

## 3. High-Level Design

```
input ──debounce(250ms)──▶ cache hit? ──yes──▶ render
                              │ no
                              ▼
                     fetch(query, AbortController)
                              │
                       dedupe / cancel stale
                              ▼
                    cache[query] = results ─▶ render
```

- **Debounce** input (~200–300ms) so we query on a pause, not every key.
- **Cache** results per normalized query (`Map`) — instant on backspace/retype.
- **AbortController** to cancel superseded requests and ignore stale responses.
- **Combobox ARIA pattern** for accessibility.

## 4. Deep Dives & Trade-offs

**Debounce vs throttle** → **debounce**. We want to wait for the user to pause, not sample at intervals. See [debounce/throttle flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md).

**Race conditions** → responses can arrive out of order (query "re" resolves after "reac"). Fix by (a) `AbortController` cancelling the previous request, and/or (b) tagging responses with their query and discarding any that don't match the current input.

**Caching** → memoize by query string; optionally cache prefixes so "reac" can filter "rea" results client-side for zero-latency narrowing. Trade-off: staleness — add a TTL for volatile data.

**Where to filter** → server-side for large/ranked datasets; client-side (e.g. a trie) only for small, static lists. State this trade-off explicitly.

**Accessibility** → implement the [ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/): `role="combobox"`, `aria-expanded`, `aria-activedescendant` for the highlighted option, and an `aria-live` region for result counts.

**Perf** → cap rendered suggestions (e.g. 10), virtualize only if huge. Highlight matches without `dangerouslySetInnerHTML` (XSS risk) — split the string and render safely.

## 5. What Interviewers Probe

- How do you avoid a request per keystroke? (debounce)
- How do you handle out-of-order responses? (abort / tag-and-discard)
- Client-side vs server-side filtering — when each?
- Full keyboard + screen-reader support?
- How do you highlight matches safely (no XSS)?
- Caching strategy and invalidation?

## 6. Curated Resources

- [ARIA APG: combobox ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) — the accessibility spec
- [MDN: AbortController ⭐](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — cancel stale requests
- [debounce/throttle deep-dive](../03-javascript/promise-polyfills-and-throttle-debounce.md)
- [GreatFrontEnd: Autocomplete](https://www.greatfrontend.com/questions/system-design)

## 7. Related Topics

- [Machine coding: Autocomplete component](../16-machine-coding/autocomplete-component.md)
- [Interview Patterns: search & typeahead](../17-interview-patterns/)
- [Networking: request cancellation](../12-networking/)
