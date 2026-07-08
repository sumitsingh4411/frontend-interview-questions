# Build an Accessible Modal / Dialog

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#overlay` `#a11y` `#focus`

**Asked at:** _Google, Meta, Airbnb, Atlassian_ · **Related:** [Command Palette](command-palette.md) · [Autocomplete](autocomplete-component.md)

---

## 1. The Question

> Build a reusable modal dialog: opens over the page, traps focus, closes on Esc / backdrop click, and is fully accessible.

## 2. Requirements

**Functional**
- [ ] Open/close (controlled `isOpen` + `onClose`).
- [ ] Renders above everything (portal); dims the background.
- [ ] Close on Esc and backdrop click; close button.
- [ ] Focus moves in on open, returns to the trigger on close.
- [ ] Focus is **trapped** inside while open.

**Non-functional**
- [ ] Correct ARIA dialog semantics.
- [ ] Background is inert (not scrollable, not focusable, hidden from AT).
- [ ] Reusable; composes arbitrary content.

## 3. Component API

```ts
type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;          // for aria-labelledby
  children: React.ReactNode;
  initialFocusRef?: React.RefObject<HTMLElement>;
};
```

## 4. Implementation Notes & Trade-offs

**Portal** → render into `document.body` via `createPortal` so the modal escapes parent `overflow`/`transform`/`z-index` stacking contexts. This is the #1 reason naive modals get clipped.

**ARIA semantics** → `role="dialog"` (or `alertdialog`), `aria-modal="true"`, `aria-labelledby` → the title, `aria-describedby` → the body. This tells screen readers it's a modal context.

**Focus management (the graded part)**
- On open: move focus to the first focusable element (or `initialFocusRef`, or the dialog itself).
- **Trap focus:** intercept Tab / Shift+Tab so focus cycles within the dialog; query focusable elements and wrap around at the ends.
- On close: **return focus** to the element that opened it (save `document.activeElement` on open).

**Make the background inert** → ideally set `inert` on the rest of the page (or `aria-hidden="true"` on siblings) so AT and Tab can't reach background content. Lock body scroll (`overflow: hidden`) and account for scrollbar width to avoid layout shift.

**Closing** → Esc key (keydown listener), backdrop click (but not clicks that start inside and drag out — check `target === currentTarget` on the backdrop). Clean up listeners on unmount.

**Animation** → animate opacity/transform; keep the node mounted during exit transition, then unmount. Respect `prefers-reduced-motion`.

**Edge cases** → nested/stacked modals (focus-trap stack), no focusable children (focus the dialog), content taller than viewport (scroll inside the dialog), opening while another is open.

**Pro move:** mention the platform primitive `<dialog>` + `showModal()` handles focus trap, backdrop, and inert natively — and when you'd still hand-roll (older browser support, custom behavior).

## 5. What Interviewers Probe

- Why a portal?
- The full focus lifecycle: move in → trap → return.
- How you trap Tab/Shift+Tab.
- Making the background inert + scroll lock (+ scrollbar shift).
- Backdrop-click vs drag-out; Esc handling.
- ARIA: `role="dialog"`, `aria-modal`, labelling.
- The native `<dialog>` element trade-off.

## 6. Curated Resources

- [ARIA APG: dialog (modal) ⭐](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the exact spec + keyboard model
- [MDN: `<dialog>` element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — native primitive
- [react.dev: createPortal](https://react.dev/reference/react-dom/createPortal)
- [MDN: inert](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/inert)

## 7. Related Topics

- [Command Palette](command-palette.md) · [Autocomplete](autocomplete-component.md)
- [Accessibility: focus management](../11-accessibility/)
