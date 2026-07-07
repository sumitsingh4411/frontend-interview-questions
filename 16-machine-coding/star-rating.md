# Build a Star Rating Widget

> **Difficulty:** 🟢 Easy · **Est. time:** `30m` · **Tags:** `#input` `#a11y`

**Asked at:** _Amazon, Airbnb, Booking-style products_ · **Related:** [Autocomplete](autocomplete-component.md)

---

## 1. The Question

> Build a star rating input: N stars, hover preview, click to set, keyboard accessible, supports read-only and (bonus) half-stars.

## 2. Requirements

**Functional**
- [ ] `max` stars (default 5); controlled `value` + `onChange`.
- [ ] Hover previews the rating; leaving restores the actual value.
- [ ] Click sets the value.
- [ ] Read-only mode (display only).
- [ ] Bonus: half-star precision.

**Non-functional**
- [ ] Fully keyboard accessible (it's a form control).
- [ ] Announced correctly to screen readers.
- [ ] Reusable, styleable.

## 3. Component API

```ts
type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  max?: number;        // default 5
  readOnly?: boolean;
  allowHalf?: boolean;
};
```

## 4. Implementation Notes & Trade-offs

**Hover vs value** → keep two pieces of state: the committed `value` and a transient `hoverValue`. Render `hoverValue ?? value`. Clear `hoverValue` on mouse leave.

**Accessibility — the key part** → don't build it from `<div>`s with click handlers. Two solid approaches:
1. **Radio group** — a `<fieldset role="radiogroup">` with one radio per star; native keyboard + screen-reader support for free. Visually hide the inputs, style the stars.
2. **`role="slider"`** — `aria-valuemin/max/now`, arrow keys change the value. Good for half-steps.

Prefer the **radio group** for whole-star ratings — least custom code, best support.

**Keyboard** → ←/→ (or ↑/↓) change rating; Home/End jump to min/max; the radio-group approach gives this natively.

**Half stars** → overlay a clipped/`width`-limited filled layer over an empty layer; compute half vs full from pointer X within the star. Keyboard steps by 0.5 when `allowHalf`.

**Read-only** → render as `img` with an `aria-label` like "Rated 4 out of 5" and no interactivity.

**Edge cases** → clicking the current value (toggle to clear? product decision); rapid hover; RTL layouts; touch (tap = click).

## 5. What Interviewers Probe

- How is this accessible? (radio group / slider — not clickable divs)
- Keyboard interaction model.
- Hover-preview vs committed value state.
- Half-star implementation.
- Read-only presentation for screen readers.
- Making it reusable/controlled.

## 6. Curated Resources

- [ARIA APG: radio group ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/radio/) — the accessible foundation
- [MDN: styling radio inputs](https://developer.mozilla.org/en-US/docs/Learn/Forms/Advanced_form_styling)
- [ARIA APG: slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) — for half-step ratings

## 7. Related Topics

- [Autocomplete component](autocomplete-component.md)
- [Accessibility: forms](../11-accessibility/)
