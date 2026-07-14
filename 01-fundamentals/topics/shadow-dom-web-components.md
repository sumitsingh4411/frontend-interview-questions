<div align="center">

# Shadow DOM & Web Components

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#dom` `#components`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Web Components are three browser-native primitives (**Custom Elements**, **Shadow DOM**, **`<template>`**) that let you ship a reusable element with **real, browser-enforced encapsulation** — styles cannot leak in or out. Shadow DOM is the *only* true style isolation on the web; everything else (CSS Modules, BEM, CSS-in-JS) is a naming convention enforced by a build tool.

---

## 🧠 Mental model

Every scoping solution you've used is **cooperative**: CSS Modules hashes a class name, BEM asks you to follow a convention, CSS-in-JS generates a unique selector. A stray `* { margin: 0 }` or `div > p` from a third-party stylesheet defeats all of them.

Shadow DOM is **enforced by the browser**. A shadow root creates a genuine boundary:

- Outside CSS selectors **cannot** reach in (`.card p` will not match a `<p>` inside a shadow root).
- Inside CSS **cannot** leak out.
- `document.querySelector` **cannot** see inside it.

That's the whole value proposition, and it's also the whole cost — because you generally *want* your design system's styles to apply.

## ⚙️ How it actually works

**The three primitives:**

```js
// 1. Custom Element — teach the browser a new tag
class UserCard extends HTMLElement {
  connectedCallback() { /* mounted */ }
  disconnectedCallback() { /* unmounted — clean up listeners here */ }
  static get observedAttributes() { return ['name']; }
  attributeChangedCallback(attr, oldV, newV) { /* react to attribute change */ }
}
customElements.define('user-card', UserCard); // ⚠️ the dash is MANDATORY
```

The hyphen is required by spec — it's how the parser distinguishes your element from a future native one, and it's why you can never define `<usercard>`.

```js
// 2. Shadow DOM — the encapsulated subtree
const root = this.attachShadow({ mode: 'open' }); // 'open' → el.shadowRoot works
                                                  // 'closed' → el.shadowRoot === null
// 3. <template> — inert, parsed-but-not-rendered markup you clone
root.appendChild(tpl.content.cloneNode(true));
```

**Light DOM vs Shadow DOM** — the distinction everything hinges on:

```html
<user-card>
  <span>Sumit</span>   <!-- LIGHT DOM: the consumer's markup -->
</user-card>
```

Inside the shadow root, `<slot>` declares where light-DOM children get *projected*:

```html
<!-- shadow root -->
<style>:host { display:block } ::slotted(span) { font-weight: 600 }</style>
<div class="card"><slot></slot></div>
```

**Crucially: slotted content is styled by the *outer* document, not the shadow root.** It never actually moves into the shadow tree — it's only rendered there. `::slotted()` gives you limited reach over it (top-level only, no descendants).

## 💻 Code

The styling escape hatches — this is the practical heart of the topic:

```css
/* Inside the shadow root */
:host { display: block; }                  /* the custom element itself */
:host([disabled]) { opacity: .5; }         /* conditional on its attribute */
:host-context(.dark) { background: #111; } /* reacts to an ANCESTOR's class */
::slotted(img) { border-radius: 8px; }     /* light-DOM children, top level only */
```

```css
/* Outside — the ONLY two ways in */
user-card { --card-bg: navy; }             /* 1. CSS custom properties DO pierce */
user-card::part(header) { color: red; }    /* 2. parts the author explicitly exposed */
```

```html
<!-- the author must opt in for ::part to work -->
<div part="header">…</div>
```

So a well-designed web component's public styling API is: **custom properties + exported parts.** Everything else is sealed.

## ⚖️ Trade-offs

- **Encapsulation is the feature *and* the problem.** Your global design tokens, resets and utility classes don't apply inside. Teams routinely fight the boundary they asked for.
- **Framework interop is awkward.** For years React passed everything as *attributes* (strings), so passing an object or a listener to a custom element didn't work — you needed a ref and imperative property assignment. React 19 finally fixed this with proper property/event support.
- **SSR is genuinely hard.** Shadow DOM was client-only for most of its life; Declarative Shadow DOM (`<template shadowrootmode="open">`) fixes it but is comparatively recent.
- **Forms need explicit wiring.** A custom input is invisible to a `<form>` until you use `formAssociated` + `ElementInternals`.

**When they're the right call:** a design system consumed by *multiple frameworks*, embeddable third-party widgets (a checkout button on a stranger's hostile CSS), or anything that must survive a page you don't control. **When they're not:** a single React app — you'd be fighting your framework for isolation you don't need.

## 💣 Gotchas interviewers probe

- **Shadow DOM ≠ Virtual DOM.** Totally unrelated. This confusion is *the* classic trap on this topic.
- **`mode: 'closed'` is not a security boundary.** It only hides `.shadowRoot`; the element instance can still be reached and patched. It provides inconvenience, not protection.
- **`document.querySelector()` cannot see into a shadow root** — you must go through `el.shadowRoot.querySelector()`. This routinely breaks test selectors and analytics.
- **Events retarget when they cross the boundary.** An event bubbling out of a shadow root has its `target` rewritten to the *host* element, so the outside world never sees your internals. Use `event.composedPath()` to see the real origin, and `composed: true` on a `CustomEvent` if you want it to escape at all.
- **CSS inheritance still crosses the boundary.** Inherited properties (`color`, `font-family`) *do* pass through — encapsulation blocks *selectors*, not inheritance.
- **The dash in the tag name is mandatory.** `customElements.define('card', …)` throws.

## 🎯 Say this in the interview

> "Web Components are three native primitives: custom elements to define the tag with lifecycle callbacks, `<template>` for inert cloneable markup, and Shadow DOM for encapsulation. The thing I'd emphasise is that Shadow DOM is the *only* real style isolation the platform has — CSS Modules and CSS-in-JS are cooperative naming schemes a build step enforces, whereas a shadow boundary is enforced by the browser: outside selectors can't match inside, and `document.querySelector` can't even see in. The two ways through are custom properties, which do pierce, and `::part()`, which the author explicitly exposes — so a component's styling API is basically tokens plus parts. Two details people miss: events *retarget* to the host when they cross the boundary, so you need `composedPath()` to find the true origin, and `mode: 'closed'` is not a security feature. I'd reach for them for a cross-framework design system or an embeddable widget on a page I don't control — not inside a single React app, where I'd just be fighting my framework."

## 🔗 Go deeper

- [MDN — Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) — the full three-primitive picture.
- [MDN — Using shadow DOM](https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM) — boundaries, slots and styling.
- [web.dev — Declarative Shadow DOM](https://web.dev/articles/declarative-shadow-dom) — the SSR story.
- [open-wc](https://open-wc.org/) — the practical, production conventions.
