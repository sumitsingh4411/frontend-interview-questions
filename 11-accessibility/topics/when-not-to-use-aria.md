<div align="center">

# When NOT to use ARIA

<sub>♿ Accessibility · 🟡 Medium · ⏱ 30m · `#aria`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — ARIA only edits the accessibility tree — it adds **zero** behaviour, keyboard handling, or focus. So the first rule is: if a native element gives you the role, name, and interaction for free, use it. **No ARIA beats bad ARIA**, and bad ARIA is the more common outcome.

---

## 🧠 Mental model

ARIA is a set of attributes that override the **role, state, and name** a browser computes for a node. That's the entire scope of its power. It does not make a `<div>` focusable, it does not wire up Enter/Space, it does not manage focus, and it does not stop a click from doing the wrong thing. It's a re-labelling layer on the accessibility tree, nothing more.

That's why the WAI-ARIA spec opens with a warning most developers skate past: **"If you can use a native HTML element with the semantics and behaviour you require already built in, do so."** A `<button>` ships a role, keyboard activation, focusability, a disabled state, and form participation. `role="button"` on a `<div>` ships *one* of those five things — the role — and silently hands you an IOU for the other four. Most people never pay it.

## ⚙️ How it actually works

The five "rules of ARIA" are really one idea applied five ways: ARIA is a promise you now have to keep in JavaScript and CSS.

1. **Prefer native HTML.** `<nav>`, `<button>`, `<input type="checkbox">` already produce the right tree node *and* the behaviour.
2. **Don't change native semantics.** `<h2 role="tab">` breaks the heading — screen-reader users lose it from the heading list. Wrap or restructure instead of overriding.
3. **Interactive ARIA widgets must be keyboard-operable.** `role="button"` obliges you to add `tabindex="0"`, handle `Enter` *and* `Space`, and call `preventDefault` on Space so the page doesn't scroll. Miss any of that and you've built a control keyboard users can see but not use.
4. **Don't hide focusable elements.** `aria-hidden="true"` or `role="presentation"` on anything in the tab order creates a "ghost": focus lands on a node the screen reader refuses to announce. Users tab into silence.
5. **Every interactive element needs an accessible name.** An icon-only `<button>` with no text and no `aria-label` announces as just "button".

The senior framing: ARIA changes what the assistive tech *hears*, never what the browser *does*. When you write `role="button"` you've told the screen reader "this behaves like a button" — and now you are personally liable for making that true.

## 💻 Code

```html
<!-- ❌ Reinventing the button. Now you owe: tabindex, Enter, Space,
     preventDefault, focus ring, disabled semantics. Most are missing. -->
<div role="button" onclick="save()">Save</div>

<!-- ✅ Every one of those behaviours, for free, forever. -->
<button onclick="save()">Save</button>
```

```html
<!-- ❌ Redundant role — the element already IS a navigation landmark.
     Restating it is noise and a code-smell an interviewer clocks. -->
<nav role="navigation">…</nav>

<!-- ❌ aria-label silently overrides the visible text. Voice-control
     users say "click Submit" and nothing happens — the name is "Send". -->
<button aria-label="Send">Submit</button>

<!-- ✅ Let the content be the name. Hide only the decorative bits. -->
<button><span aria-hidden="true">📨</span> Submit</button>
```

The one time you *do* reach for ARIA: patterns HTML has no element for — `role="tablist"`, `aria-expanded` on a disclosure, `aria-current="page"`, live regions. Even then, semantics first, ARIA to fill the gaps.

## ⚖️ Trade-offs

- **ARIA is unavoidable for composite widgets** — tabs, comboboxes, tree grids, menus. HTML simply has no element for them, so you implement the [APG pattern](https://www.w3.org/WAI/ARIA/apg/) faithfully, keyboard and all. The rule is "don't use ARIA *needlessly*", not "never".
- **When NOT to use it:** to fix a layout, to relabel visible text, to "be safe", or to patch a `<div>` into a button when a `<button>` was one keystroke away. Defensive ARIA corrupts the tree — wrong roles, doubled names, states that lie.
- **Redundant roles aren't harmless.** They add bytes, drift out of sync with the element, and signal a developer who doesn't trust native semantics — which is itself a red flag in review.

## 💣 Gotchas interviewers probe

- **"ARIA makes a div a button."** No. It relabels the node. The `<div>` still isn't focusable and still ignores the keyboard until *you* add all of it. This is the number-one misconception.
- **`aria-label` overrides the accessible name computation** and thereby the visible text — breaking voice control, where the spoken command must match the visible label.
- **`role="presentation"` / `aria-hidden` on interactive elements** produces focusable-but-unannounced ghosts. Never put `aria-hidden` on a container with focusable children.
- **Overriding a native role destroys its other semantics** — `<li role="tab">` may strip the item from its list; `<h2 role="button">` vanishes from the heading map.
- **ARIA states must be kept live in JS.** `aria-expanded="false"` that never flips to `true` is worse than no attribute — it actively lies to the user.

## 🎯 Say this in the interview

> "My first move is always native HTML, because ARIA only edits the accessibility tree — it adds no behaviour. The moment I write `role='button'` on a div, I've promised keyboard support, focusability, and Enter and Space handling that ARIA doesn't provide, and in practice that promise gets half-kept. A real `<button>` gives me all of it for free and stays correct. So I treat ARIA as a gap-filler for things HTML can't express — tablists, comboboxes, `aria-expanded`, live regions — and I follow the APG pattern including the keyboard model when I do. The spec's own first rule sums it up: no ARIA is better than bad ARIA, and I'd rather ship a clean tree from semantic markup than a busy one I have to keep in sync by hand."

## 🔗 Go deeper

- [W3C — Using ARIA: the five rules](https://www.w3.org/TR/using-aria/#rules) — the canonical source, including the first-rule warning.
- [W3C — ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — the patterns where ARIA *is* required, with full keyboard specs.
- [MDN — ARIA basics](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/WAI-ARIA_basics) — when it helps and when it hurts, with examples.
