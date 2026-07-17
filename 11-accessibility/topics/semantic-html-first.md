<div align="center">

# Semantic HTML first

<sub>♿ Accessibility · 🟢 Easy · ⏱ 45m · `#html` `#basics`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The right HTML element already comes with a role, a name, keyboard behaviour, focus, and state — for free and for every assistive technology. Reaching for `<div>` + ARIA + JS to rebuild `<button>` is choosing to reimplement, badly, what the platform ships correctly.

---

## 🧠 Mental model

Accessibility is not a layer you add on top of markup — it is **emitted by** the markup. When the browser parses your HTML it builds a second tree next to the DOM, the **accessibility tree**, and each node in it carries a *role* (what is this?), a *name* (what is it called?), and a *state* (checked? expanded? disabled?). A screen reader, a switch device, and voice control all consume that tree, not your CSS.

Native elements populate that tree correctly by definition. `<button>` is a node with role `button`, an accessible name from its text, it's in the tab order, it fires on **both** click and Enter/Space, and it exposes a disabled state. A styled `<div>` is a node with role `generic` and none of that. So the real question is never "how do I make this div accessible?" — it's **"which element already is the thing I'm building?"**

## ⚙️ How it actually works

Every native interactive element bundles four things that a `<div>` does not:

| | `<button>` | `<div onclick>` |
|---|---|---|
| Role in a11y tree | `button` | `generic` (none) |
| Focusable / tab order | yes, automatically | no (needs `tabindex="0"`) |
| Keyboard activation | Enter **and** Space | nothing (needs a `keydown` handler) |
| State exposure | `disabled`, `aria-pressed`… | you wire it all by hand |

That table *is* the argument. To make a `<div>` behave like a button you must add `role="button"`, `tabindex="0"`, a `keydown` listener that handles Enter and Space (and calls `preventDefault` on Space so the page doesn't scroll), a disabled story, and a focus ring — and you'll still miss Windows High Contrast Mode, forced-colors, and form participation. `<button>` gives you all of it in nine characters.

Semantics also power the features sighted users never see: **landmarks** (`<nav>`, `<main>`, `<header>`, `<aside>`) let a screen-reader user jump between page regions with a single keystroke, and **headings** (`<h1>`–`<h6>`) generate a document outline they navigate like a table of contents. A page built from `<div class="header">` and `<div class="title">` has *no* landmarks and *no* outline — it reads as one undifferentiated wall of text.

## 💻 Code

```html
<!-- ❌ Rebuilding the platform, worse. Not focusable, no keyboard,
     no role, invisible to voice control and switch access. -->
<div class="btn" onclick="save()">Save</div>

<!-- ✅ Free role, name, focus, Enter+Space, disabled, forced-colors. -->
<button type="button" onclick="save()">Save</button>
```

Structure carries the same weight as controls:

```html
<!-- ❌ div soup: zero landmarks, zero outline, unnavigable by AT -->
<div class="nav">…</div>
<div class="content">
  <div class="big-title">Pricing</div>
</div>

<!-- ✅ landmarks + a real heading = jump-navigation for free -->
<nav aria-label="Primary">…</nav>
<main>
  <h1>Pricing</h1>
</main>
```

One caveat that separates "knows the rule" from "knows why": semantics can be *destroyed* by CSS. `display: contents` on a `<ul>` or `<button>` removes its box **and, in several engines, its semantics** — the list stops being a list. `list-style: none` silently strips the list role in Safari + VoiceOver. Semantics are load-bearing; don't casually restyle them away.

## ⚖️ Trade-offs

- **Native elements are less stylable — that's the whole tension.** `<select>`, `<input type="date">`, and `<progress>` are hard to fully theme, which is why teams rebuild them. The honest trade-off is: a custom widget must then re-implement the entire ARIA + keyboard contract, and most ship half of it. Reach for the native element until you *provably* can't.
- **When NOT to lean on semantics alone:** genuinely novel widgets (a combobox, a tree grid, a tab set) have no native element. There you *do* need ARIA — but you start from the closest semantic base and add the minimum, never from a bare `<div>`.
- **`<a>` vs `<button>` is a real decision, not cosmetics.** A link navigates to a URL (and belongs in the accessibility tree as a link, works with middle-click, is crawlable); a button performs an action in place. Using one to fake the other breaks user expectations and keyboard semantics (links don't fire on Space).

## 💣 Gotchas interviewers probe

- **"Why not just use ARIA?"** Because ARIA changes *semantics only* — it adds nothing to behaviour. `role="button"` on a div does not make it focusable or keyboard-operable. Candidates who think ARIA "makes things accessible" fail here.
- **The first rule of ARIA is don't use ARIA.** If a native element with the semantics you need exists, using it instead of ARIA is *required* by the spec, not merely preferred.
- **`<div onclick>` is invisible to more than screen readers.** Voice control ("click Save") and switch access rely on the element being a named, focusable control. A div isn't one.
- **Headings must be a hierarchy, not a font-size picker.** Skipping from `<h1>` to `<h4>` because it "looks right" breaks the outline. Style with CSS; choose the level by structure.
- **`display: contents` and `list-style: none` can strip roles.** Restyling isn't semantically neutral.

## 🎯 Say this in the interview

> "My default is to reach for the element that already *is* the thing. The browser builds an accessibility tree from my markup, and native elements populate it correctly for free — a `<button>` comes with the button role, focus, tab order, Enter-and-Space activation, and a disabled state, whereas a `<div>` is a generic node I'd have to rebuild by hand with tabindex, keydown handlers, and ARIA, and I'd still miss forced-colors and voice control. So I treat semantic HTML as the accessibility layer, not markup I decorate afterward. I use landmarks and a real heading hierarchy so screen-reader users can jump around, and I only reach for ARIA when there's genuinely no native element — a combobox, say — and even then I start from the closest semantic base and add the minimum."

## 🔗 Go deeper

- [web.dev — HTML and accessibility (structure)](https://web.dev/learn/accessibility/structure) — landmarks, headings, and why structure is a feature.
- [MDN — HTML: A good basis for accessibility](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML) — the case for native elements, with concrete before/after.
- [W3C — Using ARIA: rule 1 (don't)](https://www.w3.org/TR/using-aria/#rule1) — the normative "prefer native HTML" rule.
- [Scott O'Hara — display: contents and its issues](https://www.scottohara.me/blog/2018/05/07/hidden-vs-none.html) — how CSS can quietly delete semantics.
