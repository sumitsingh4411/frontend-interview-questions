<div align="center">

# Accessibility basics

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#a11y`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Accessibility is not a layer you add with ARIA; it's a **tree you either keep or destroy**. Semantic HTML gives you a correct accessibility tree for free — ARIA only *patches* that tree, and the first rule of ARIA is don't use ARIA.

---

## 🧠 Mental model

The browser builds three trees from your markup: the **DOM**, the **render tree** (what sighted users see), and the **accessibility tree** (what screen readers, switch devices and voice control see). They are siblings, not layers. A `<div onclick>` is fully present in the render tree and effectively **absent** from the accessibility tree — it has no role, no name, no state, and no keyboard reachability.

Every node in that tree is really four things:

| Property | Question it answers | Comes from |
|---|---|---|
| **Role** | *What is this?* | The tag (`<button>` → `button`) or `role=` |
| **Name** | *What is it called?* | Label, text content, `aria-label` |
| **State** | *What is it doing?* | `checked`, `disabled`, `aria-expanded` |
| **Value** | *What does it hold?* | Input value, `aria-valuenow` |

The framing that makes everything downstream obvious: **`<button>` is not "a div with styling" — it is a bundle of about eight behaviours** (role, focusability, Enter/Space activation, form submission, disabled semantics, focus ring, high-contrast-mode support, click-on-keypress). When you reach for `<div role="button">`, you have signed up to reimplement all eight, and you will forget Space.

## ⚙️ How it actually works

**Accessible name computation** is a real algorithm (AccName spec) with a precedence order, and interviewers love it because most candidates think `aria-label` is a suggestion:

1. `aria-labelledby` (wins over everything — even hides real text)
2. `aria-label`
3. Native: `<label for>`, `alt`, `<caption>`, `title` on some elements
4. Text content
5. `title` attribute (last resort — it's the tooltip, not a label)

This is why `<button aria-label="Close">Save</button>` announces **"Close"**. The visible text loses. That's a WCAG 2.5.3 failure too: voice users say "click Save" and nothing happens.

**Focus management** is the part that breaks at scale. The rules:

- `tabindex="0"` — in the natural tab order. Correct for custom widgets.
- `tabindex="-1"` — **programmatically focusable, not tabbable**. This is the tool for moving focus to a heading or a dialog.
- `tabindex="2"` — never. Any positive value jumps ahead of the entire document and rearranges tab order globally.

**`display: none` and `visibility: hidden` remove nodes from the accessibility tree.** `opacity: 0`, `clip-path`, and off-screen positioning **do not** — which is exactly why the visually-hidden pattern works, and exactly why a "hidden" off-screen menu is a focus trap of invisible tabbable links.

**Live regions** are how you announce things that happen without focus moving:

- `aria-live="polite"` — queued, announced at the next pause. ~95% of cases.
- `aria-live="assertive"` — interrupts the user mid-sentence. Errors only. It is rude by design.
- The region **must exist in the DOM before you write to it.** Injecting a `<div aria-live>` that already contains the text announces nothing — screen readers watch for *mutations* to an existing region.

## 💻 Code

```html
<!-- ❌ Six missing behaviours. Invisible to the a11y tree. No keyboard. -->
<div class="btn" onclick="save()">Save</div>

<!-- ✅ Free: role, tab order, Enter AND Space, focus ring, disabled, forced-colors -->
<button type="button" onclick="save()">Save</button>
```

Icon buttons — the most common real failure:

```html
<!-- ❌ Announced as "button". Useless. -->
<button><svg>…</svg></button>

<!-- ✅ Name it; hide the decoration from the tree. -->
<button aria-label="Delete invoice #1042">
  <svg aria-hidden="true" focusable="false">…</svg>
</button>
```

The visually-hidden utility — every design system needs exactly this, not `display:none`:

```css
.sr-only {
  position: absolute;
  width: 1px; height: 1px;
  padding: 0; margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);   /* still in the a11y tree, unlike display:none */
  white-space: nowrap;
  border: 0;
}
```

Dialog focus, done right:

```js
// 1. Remember where focus came from — restoring it is the half everyone skips.
const opener = document.activeElement;
dialog.showModal();          // <dialog> gives you focus trap + inert background + Esc
dialog.addEventListener('close', () => opener.focus()); // 2. put it back
```

## ⚖️ Trade-offs

- **ARIA can only make things worse than semantic HTML, never better.** It adds *no behaviour* — `role="button"` gives you the announcement and none of the keyboard handling. It's a promise to the screen reader that your JavaScript keeps. Bad ARIA is worse than none, because it lies with confidence.
- **When you *do* need ARIA:** genuinely custom widgets (comboboxes, tree grids, tabs), live regions, and relationships HTML can't express (`aria-describedby` pointing an input at its error text). Those are real. Everything else is a `<button>` you didn't use.
- **`<dialog>` vs a hand-rolled modal.** `showModal()` gives you a focus trap, inert background, top-layer stacking and Esc-to-close from the platform. The trade-off is styling `::backdrop` and older-browser support — usually worth it, and the ROI against a home-made trap isn't close.
- **Automated tools catch ~30% of issues.** axe and Lighthouse find contrast and missing alt. They cannot tell you your tab order is nonsense or your alt text says "image1.png". A green Lighthouse a11y score of 100 is a floor, not a result.

## 💣 Gotchas interviewers probe

- **`aria-label` on a `<div>` or `<span>` does nothing.** Naming only applies to elements with a role that supports it. On a generic container it is silently ignored — a very common false fix.
- **`aria-hidden="true"` on a focusable element** creates a "ghost": a screen reader user tabs to it and hears *nothing*. Never put it on anything in the tab order.
- **`placeholder` is not a label.** It disappears on input, usually fails contrast, and is announced inconsistently. This is the single most repeated form mistake.
- **`disabled` removes an element from the tab order**, so a disabled submit button can't be focused to discover *why* it's disabled. Prefer `aria-disabled="true"` plus a real reason in an `aria-describedby`.
- **Positive `tabindex` is always a bug.** It reorders the whole page, not just your component.
- **Removing the focus outline is a WCAG 2.4.7 failure.** `:focus-visible` is the answer — style it, don't delete it. `outline: none` with no replacement is an instant red flag.
- **`alt=""` is not the same as no `alt`.** Empty alt means *decorative — skip me*, which is correct and deliberate. A missing `alt` makes screen readers read the filename aloud.
- **Contrast is 4.5:1 for body text, 3:1 for large text and UI components** (WCAG AA). Know the numbers; "make it darker" isn't an answer.
- **Colour alone can't carry meaning** (1.4.1) — a red border on an invalid field needs text or an icon too.

## 🎯 Say this in the interview

> "I think about the accessibility tree as a sibling of the render tree, not an add-on. Semantic HTML populates it correctly for free — a `<button>` isn't a styled div, it's a bundle of role, focusability, Enter and Space handling, disabled semantics and forced-colors support, and if I use a div I'm re-implementing all of it and I'll miss Space. So my order of operations is: native element first, then ARIA only for things HTML genuinely can't express — custom widgets, live regions, relationships like `aria-describedby`. The key thing about ARIA is that it changes what's announced but adds zero behaviour, so bad ARIA is worse than none. Beyond markup, the two things I actively manage are focus — move it into dialogs, restore it on close, never use positive tabindex — and announcements via a live region that already exists in the DOM. And I treat automated tooling as a floor: axe catches maybe a third of it, so I keyboard-test every flow."

## 🔗 Go deeper

- [web.dev — Learn Accessibility](https://web.dev/learn/accessibility) — the best structured course; start here.
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — the reference implementations for every custom widget. Copy these, don't invent.
- [MDN — ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) — roles, states, and the rules of ARIA use.
- [WCAG 2 quick reference](https://www.w3.org/WAI/WCAG21/quickref/) — the actual success criteria behind every number you'll be asked to justify.
- [MDN — HTML dialog element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog) — the platform focus trap you should stop hand-rolling.
