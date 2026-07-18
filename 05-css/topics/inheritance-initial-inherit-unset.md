<div align="center">

# Inheritance & `initial/inherit/unset`

<sub>🎨 CSS · 🟢 Easy · ⏱ 20m · `#cascade`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A handful of properties (mostly text: `color`, `font-*`, `line-height`, `visibility`) inherit their **computed value** to descendants; the rest don't. The four global keywords let you steer that per property: `inherit` forces it, `initial` resets to the *spec* default, `unset` = "inherit if inheritable, else initial", and `revert` rolls back to the browser's stylesheet.

---

## 🧠 Mental model

Inheritance is a **fallback mechanism**, not the cascade. When an element has no author rule for a property, an inherited property looks up the tree and takes the parent's *computed* value; a non-inherited property falls to its initial value instead.

The dividing line is roughly "does it describe **text**, or does it describe **a box**?" Text-ish things inherit — `color`, `font-family`, `font-size`, `line-height`, `letter-spacing`, `text-align`, `visibility`, `cursor`, `list-style`. Box-ish things don't — `width`, `margin`, `padding`, `border`, `background`, `display`, `position`. That's a design choice: you want a paragraph's colour to flow to its `<em>`, but you emphatically don't want a `<div>`'s width to flow to its children.

## ⚙️ How it actually works

Inheritance passes the **computed value**, not the value you typed. This matters most for `line-height`: a *unitless* `line-height: 1.5` inherits the **factor** (each child multiplies its own font-size by 1.5), while `line-height: 24px` or `150%` inherits the **resolved length** — so a smaller child gets a cramped 24px line. Unitless is almost always what you want.

The four global keywords work on *any* property:

| Keyword | Resolves to |
|---|---|
| `inherit` | Parent's computed value (forces inheritance even on non-inherited props) |
| `initial` | The property's **spec** initial value — *not* the UA stylesheet's |
| `unset` | `inherit` if the property is inheritable, else `initial` |
| `revert` | The value the property would have had from the **previous cascade origin** (usually the browser's UA stylesheet) |

The trap is `initial` vs `revert`. `display: initial` is **`inline`**, because the spec's initial value for `display` is `inline` — it is *not* "whatever this element normally is". So `div { display: initial }` makes your div inline and breaks the layout. `display: revert` gives you `block` back, because it honours the UA stylesheet's `div { display: block }`. Likewise `color: initial` is black, not the inherited colour.

## 💻 Code

```css
/* Inheritable: color flows down; the <em> is red without being targeted */
.card { color: crimson; }

/* Non-inheritable: forcing inheritance with a keyword */
.card a { color: inherit; }        /* link takes the card's text colour */

/* ❌ initial does NOT mean "the element's natural value" */
.reset-wrong { display: initial; } /* becomes inline, not block! */

/* ✅ revert rolls back to the browser stylesheet */
.reset-right { display: revert; }  /* block for a div, inline for a span */
```

Nuke everything on a component with `all` — the sledgehammer for third-party widget resets:

```css
.widget-boundary {
  all: unset;   /* every property → inherit or initial */
  /* or: all: revert;  keep UA defaults but drop author styles */
  display: block; /* re-declare what you actually need */
}
```

```css
/* line-height: inherit the FACTOR, not a frozen pixel length */
body { line-height: 1.5; }   /* ✅ every child scales its own leading */
/* body { line-height: 24px; }  ❌ small text gets a 24px line */
```

## ⚖️ Trade-offs

- **`unset` is the honest default** when you mean "act as if I never set this". It respects each property's nature, so you don't have to remember which properties inherit.
- **`revert` is what you usually want for a reset**, not `initial` — because `initial` returns spec defaults that almost never match how the browser actually renders elements (`display`, `font-size` on headings, etc.).
- **`all: unset` on a component boundary** is powerful for isolating embedded widgets, but it also strips inheritable text styles, so you'll re-declare font and colour. Don't reach for it casually.

## 💣 Gotchas interviewers probe

- **`display: initial` is `inline`, not `block`.** The single most common inheritance-keyword trap. `initial` = the *spec* default, which ignores the UA stylesheet entirely.
- **Unitless vs unit `line-height`.** Unitless inherits the multiplier; a length or percentage inherits a computed length that won't adapt to child font-sizes.
- **Inheritance passes the *computed* value.** A child's `font-size: 2em` resolves against the parent's *already-computed* font-size — em-based sizes compound down the tree.
- **`revert` ≠ `initial`.** `revert` is origin-aware (rolls back to UA/user styles); `initial` jumps straight to the property's spec value, skipping the browser stylesheet.
- **Not everything inherits by design.** People assume `background` or `border` inherit; they don't. Only ~a couple dozen text/UI properties do.
- **`inherit` on a non-inheritable property is legal and useful** — e.g. `border-color: inherit` to match text colour.

## 🎯 Say this in the interview

> "Inheritance is the fallback the cascade uses when there's no matching rule: inheritable properties — basically the text ones like `color`, `font-*`, `line-height`, `visibility` — take the parent's computed value, and everything box-related doesn't inherit. The four global keywords let me override that per property. The one I'd flag is `initial` versus `revert`: `initial` resets to the property's *spec* default, so `display: initial` is `inline`, not `block` — people expect it to restore the element's natural display, and it doesn't. `revert` is the origin-aware one that rolls back to the browser stylesheet, so it's usually what you want for resets. And `unset` is my default 'pretend I never set this' — it inherits if the property is inheritable, otherwise it uses initial. One real gotcha: use *unitless* `line-height` so children inherit the ratio, not a frozen pixel value."

## 🔗 Go deeper

- [web.dev — Inheritance](https://web.dev/learn/css/inheritance) — which properties inherit and how the keywords behave.
- [MDN — Inheritance](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Inheritance) — the canonical list and computed-value details.
- [MDN — `revert` vs `initial` vs `unset`](https://developer.mozilla.org/en-US/docs/Web/CSS/revert) — the origin-aware reset most people miss.
