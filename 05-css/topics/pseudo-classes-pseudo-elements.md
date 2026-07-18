<div align="center">

# Pseudo-classes & pseudo-elements

<sub>🎨 CSS · 🟢 Easy · ⏱ 45m · `#selectors`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A **pseudo-class** (`:hover`, `:nth-child`, `:focus-visible`) selects a *real* element that is in some **state** or **position**; a **pseudo-element** (`::before`, `::marker`, `::selection`) targets or *creates* a **sub-part** of an element that isn't a node in the DOM. One colon vs two is the tell.

---

## 🧠 Mental model

The two are constantly conflated because they look similar, but they answer different questions:

- **Pseudo-class → "which state or position is this element in?"** The `<button>` exists in the DOM; `:hover` just picks it out *while* the pointer is over it. Also positional: `:first-child`, `:nth-of-type(2n)`, `:not()`, `:target`.
- **Pseudo-element → "which slice of this element do I want, or what content do I want to invent?"** `::first-line` styles a fragment that isn't a node; `::before` conjures a box that doesn't exist in the HTML at all.

The single-colon (`:`) vs double-colon (`::`) syntax encodes exactly this distinction. `::before` is the modern spelling; browsers still accept `:before` for legacy reasons, but write two colons.

## ⚙️ How it actually works

**Generated content boxes** — `::before` and `::after` require the `content` property or they don't render at all. They're **inline by default** and become the *first / last child* of the element (inside it, not around it). They can't be applied to **replaced elements** like `<img>`, `<input>`, `<br>` because those have no place to insert children — a frequent surprise.

**Structural pseudo-classes** count siblings, and the `:nth-child` vs `:nth-of-type` distinction trips everyone:

- `:nth-child(2)` = "the 2nd child, *and* it must be this element type." If the 2nd child is a different tag, nothing matches.
- `:nth-of-type(2)` = "the 2nd element of this type," ignoring other tags between them.

`:nth-child(an+b)` is a formula: `2n` (even), `2n+1` / `odd`, `3n+1` (every third starting at 1). `:nth-child(-n+3)` selects the first three.

**State pseudo-classes worth knowing:** `:focus-visible` (focus ring only for keyboard, not mouse — the modern default for focus styling), `:focus-within` (element containing a focused descendant), `:target` (element whose id matches the URL fragment), `:placeholder-shown`, `:checked`, `:disabled`, `:required`/`:invalid`.

## 💻 Code

```css
/* Generated content: content is mandatory; these are inline children */
.tag::before { content: "#"; color: gray; }
blockquote::before { content: open-quote; }
.field[required] label::after { content: " *"; color: red; }

/* Style the list marker directly — no more hacks */
li::marker { color: teal; font-weight: bold; }

/* ::selection and ::placeholder target UI slices */
::selection { background: gold; }
input::placeholder { color: #999; font-style: italic; }
```

```css
/* nth-child vs nth-of-type — the classic confusion */
article :nth-child(2)   { }  /* 2nd child, ONLY if it's the right type */
article p:nth-of-type(2){ }  /* the 2nd <p>, skipping other tags */

/* Zebra striping + "first three" */
tr:nth-child(odd)     { background: #f6f6f6; }
.card:nth-child(-n+3) { border: 2px solid; }  /* first 3 only */
```

```css
/* ✅ Keyboard-only focus ring — mouse users don't get an outline */
button:focus-visible { outline: 2px solid blue; }

/* Style a wrapper when anything inside it is focused */
.search:focus-within { box-shadow: 0 0 0 2px blue; }
```

## ⚖️ Trade-offs

- **`::before`/`::after` are for decoration, not content.** Screen readers' support for generated `content` is inconsistent, and it's not selectable or searchable. Never put meaningful text there — use real DOM for anything a user needs to read or copy.
- **`:focus-visible` over `:focus`.** Styling `:focus` gives mouse-clickers an outline they find ugly and then people remove it entirely, breaking keyboard a11y. `:focus-visible` gives the ring only when it's earned.
- **Structural pseudo-classes couple CSS to DOM order.** `:nth-child` styling breaks when items are reordered or filtered. Fine for zebra stripes; risky for meaningful styling.

## 💣 Gotchas interviewers probe

- **One colon vs two.** Pseudo-*class* = `:`, pseudo-*element* = `::`. Knowing *why* (state/position vs sub-part) is the senior signal, not just the syntax.
- **`content` is mandatory for `::before`/`::after`.** Omit it and nothing renders — even `content: ""` is needed for a pure decorative box.
- **`:nth-child` also checks type.** `p:nth-child(2)` means "a `<p>` that is *also* the 2nd child," not "the 2nd `<p>`." That's `:nth-of-type`.
- **Pseudo-elements don't work on replaced elements.** No `::before` on `<img>` or `<input>` — they have no child insertion point.
- **`::before`/`::after` are inline by default** and live *inside* the element — set `display` if you need block behaviour.
- **`:not()` and `:is()` take selector lists now**, and `:not(.a, .b)` is far cleaner than chaining. Watch specificity: `:not()` contributes its argument's specificity.

## 🎯 Say this in the interview

> "A pseudo-class selects a real element in a particular *state* or *position* — `:hover`, `:focus-visible`, `:nth-child` — while a pseudo-element targets or creates a *sub-part* that isn't a DOM node, like `::before`, `::first-line`, or `::selection`. The single-vs-double colon encodes exactly that difference. Two things I'm deliberate about: I use `:focus-visible` rather than `:focus` so keyboard users get a ring but mouse-clickers don't, which stops people from deleting focus outlines entirely and breaking accessibility. And I never put meaningful text in `::before`/`::after` — screen-reader support for generated content is shaky and it's not selectable, so it's strictly decoration. The classic gotcha is `:nth-child(2)` versus `:nth-of-type(2)`: `nth-child` also requires the element to *be* that type at that position, whereas `nth-of-type` counts only elements of that type."

## 🔗 Go deeper

- [MDN — Pseudo-classes](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-classes) — the full state/position list.
- [MDN — Pseudo-elements](https://developer.mozilla.org/en-US/docs/Web/CSS/Pseudo-elements) — `::before`, `::marker`, `::selection`, and friends.
- [MDN — `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) — why it's the modern focus-ring default.
