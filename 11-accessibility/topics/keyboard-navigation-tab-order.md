<div align="center">

# Keyboard navigation & tab order

<sub>♿ Accessibility · 🟡 Medium · ⏱ 1h · `#keyboard`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Tab order follows **DOM order**, not visual order, and only natively-interactive elements are in it. `tabindex="0"` adds a node to that natural sequence, `tabindex="-1"` makes it focusable by script only, and any **positive** `tabindex` is an anti-pattern that hijacks the order for the whole page.

---

## 🧠 Mental model

A keyboard user drives your page with `Tab` to move between **focusable** elements, `Shift+Tab` to go back, and `Enter`/`Space`/arrows to operate the focused one. The sequence they walk is the *tab order*, and by default it is exactly the **source order of the DOM** — filtered down to elements that are natively focusable: links with `href`, buttons, form fields, `<summary>`, and anything with a valid `tabindex`.

The trap hiding in modern layout: CSS can reorder what you *see* without touching what you *tab through*. Flexbox `order`, `grid` placement, and absolute positioning all move pixels while the DOM — and therefore the tab order — stays put. When those two disagree, sighted keyboard users watch focus leap around the screen unpredictably. That mismatch is a genuine **WCAG 2.4.3 (Focus Order)** failure, not a nitpick.

## ⚙️ How it actually works

`tabindex` has three regimes, and conflating them is the classic mistake:

| Value | In tab order? | Focusable by script? | Use it for |
|---|---|---|---|
| `tabindex="0"` | Yes, at its **DOM position** | Yes | A custom widget you made interactive |
| `tabindex="-1"` | **No** | Yes (`.focus()`) | Programmatic focus targets — headings, dialogs, roving items |
| `tabindex="1"`+ | Yes, **jumps the queue** | Yes | Essentially never |

Positive `tabindex` is poison because it's **global**: any element with `tabindex="1"` is visited before *every* `tabindex="0"` and native element on the page, regardless of where it sits. Add a few and you're maintaining a hand-ordered focus queue across the entire document — it desyncs the instant anyone adds markup.

For composite widgets — a toolbar, a set of tabs, a radio group, a menu — you don't want ten tab stops. You want **one**. That's the **roving tabindex** pattern: exactly one child holds `tabindex="0"` while the rest hold `tabindex="-1"`, and your `keydown` handler moves the `0` (and calls `.focus()`) as the arrow keys press. The widget is a single stop in the page's `Tab` sequence, and arrows navigate *within* it — which is precisely the mental model native `<select>` and radio groups already give users.

## 💻 Code

```html
<!-- ❌ A clickable div: invisible to Tab, deaf to the keyboard. -->
<div class="btn" onclick="buy()">Buy</div>

<!-- ✅ Native button — in the tab order, Enter/Space work, free. -->
<button onclick="buy()">Buy</button>

<!-- If you MUST make a non-interactive element operable, you owe
     focusability AND the keyboard contract, by hand: -->
<div class="btn" role="button" tabindex="0"
     onclick="buy()"
     onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();buy()}">
  Buy
</div>
```

Roving tabindex — one stop, arrows move within:

```js
// A toolbar: only the active item is tabbable; arrows rove focus.
toolbar.addEventListener('keydown', (e) => {
  if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
  const items = [...toolbar.querySelectorAll('[role="button"]')];
  const i = items.indexOf(document.activeElement);
  const next = e.key === 'ArrowRight'
    ? (i + 1) % items.length
    : (i - 1 + items.length) % items.length;
  items[i].tabIndex = -1;      // current item leaves the tab order
  items[next].tabIndex = 0;    // next item becomes the single stop
  items[next].focus();         // and actually move focus there
});
```

## ⚖️ Trade-offs

- **Fixing tab order by reordering the DOM is the right fix; reordering with `tabindex` is a trap.** If the *visual* order is correct but the DOM is wrong, move the DOM. Reaching for positive `tabindex` just moves the debt.
- **`tabindex="-1"` is essential, not a smell.** It's how you focus a heading after a route change or a dialog on open — focusable by script, invisibly skipped by `Tab`. Every focus-management pattern depends on it.
- **When NOT to add tabindex at all:** on elements the user only reads. A stray `tabindex="0"` on every `<div>` "so keyboard users can reach it" bloats the tab order with dead stops and exhausts the user.

## 💣 Gotchas interviewers probe

- **Positive `tabindex` is almost always wrong.** Knowing *why* — it's a page-global override that breaks the instant markup changes — is the senior signal.
- **`disabled` removes an element from the tab order; `aria-disabled` does not.** `aria-disabled="true"` keeps the control focusable so screen-reader users can discover it — you must then block its action yourself.
- **CSS `order`/`grid` don't change tab order.** Visual and focus order diverging is WCAG 2.4.3 and a real, common bug.
- **`tabindex="0"` on a `<div>` gives you focus but not activation.** You still owe `Enter` and `Space` handlers, and `Space` needs `preventDefault` to stop the page scrolling.
- **`Space` scrolls the page** by default; on a custom button you must cancel it. On a native `<button>` it's already handled.
- **You can't tab to `tabindex="-1"`** — it's script-focus only. Expecting `Tab` to reach it is a frequent confusion.

## 🎯 Say this in the interview

> "Tab order is DOM order, filtered to focusable elements, and my default is to keep those two aligned by using native controls — links, buttons, inputs — which are focusable and keyboard-operable for free. `tabindex` has three meanings I keep straight: `0` puts a custom widget into the natural order at its DOM position, `-1` makes something focusable only by script — which is how I move focus to a heading or dialog — and any positive value is an anti-pattern because it's a page-global override that desyncs the moment anyone edits the markup. For composite widgets like tabs or a toolbar I use roving tabindex, so the whole widget is one tab stop and arrows move within it, which matches how native radio groups already behave. And I watch for CSS reordering focus visually without touching the DOM — that's a WCAG focus-order failure."

## 🔗 Go deeper

- [web.dev — Control focus with tabindex](https://web.dev/articles/control-focus-with-tabindex) — the three regimes, with the roving pattern.
- [MDN — tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) — exact semantics and the warning against positive values.
- [WCAG — 2.4.3 Focus Order](https://www.w3.org/WAI/WCAG22/Understanding/focus-order.html) — why visual and DOM order must agree.
- [ARIA APG — Developing a keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/) — roving tabindex vs `aria-activedescendant`.
