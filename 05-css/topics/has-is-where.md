<div align="center">

# `:has()`, `:is()`, `:where()`

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#selectors` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `:is()` and `:where()` are **grouping** selectors that flatten repetitive lists; they differ only in specificity — `:is()` takes the *highest* specificity of its arguments, `:where()` is *always zero*. `:has()` is the long-awaited **relational / parent selector**: it styles an element based on what it *contains* or is *followed by*.

---

## 🧠 Mental model

All three take a **selector list** as an argument, but they play different roles:

- **`:where()`** — "match any of these, and cost nothing." Zero specificity makes it perfect for low-priority defaults and resets that anyone can override with a single class.
- **`:is()`** — "match any of these, at the specificity of the heaviest one." A DRY shorthand that still *wins* like a normal selector.
- **`:has()`** — "match the element **if** this condition about its descendants/siblings holds." This is the one that changed CSS: you can finally select *upward* and *sideways*.

## ⚙️ How it actually works

**Grouping (`:is`/`:where`)** collapse combinatorial lists. `:is(h1, h2, h3) a` replaces `h1 a, h2 a, h3 a`. The *only* semantic difference between them is specificity:

| Selector | Specificity |
|---|---|
| `:where(#id, .cls)` | **0-0-0** (always) |
| `:is(#id, .cls)` | **1-0-0** (the highest arg: the `#id`) |
| `:not(...)`, `:has(...)` | specificity of the **most specific** argument |

Both use **forgiving-ish parsing**: an unknown/invalid selector inside `:is()`/`:where()` is ignored instead of invalidating the whole rule. (`:has()` and `:not()` are *not* forgiving — one bad selector there drops the rule.)

**`:has()`** evaluates a condition relative to the subject. `figure:has(figcaption)` = "a figure that contains a figcaption." `figure:has(> img)` = "…that has a *direct-child* img." Combined with sibling combinators it selects sideways: `h2:has(+ p)` styles an `h2` that is *followed by* a `p` — the previous-sibling relationship CSS never had. Its specificity comes from its argument, so `:has(.x)` adds `0-1-0`.

## 💻 Code

```css
/* :is() — DRY grouping that still carries weight */
:is(h1, h2, h3) a { color: inherit; }
article :is(ul, ol) :is(ul, ol) { margin-block: 0; }  /* nested lists */

/* :where() — zero-specificity defaults, trivially overridable */
:where(a) { color: royalblue; }        /* 0 specificity */
.callout a { color: crimson; }         /* a single class beats it */
```

```css
/* :has() — the parent/relational selector */
.card:has(img)          { grid-template-rows: auto 1fr; } /* only cards with an image */
label:has(+ input:required)::after { content: " *"; }     /* label BEFORE a required input */
form:has(:invalid) button[type="submit"] { opacity: .5; } /* disable submit while invalid */

/* "Quantity queries": style the container based on child count */
ul:has(> li:nth-child(6)) { columns: 2; }  /* 6+ items → two columns */
```

```css
/* ❌ Forgiving-parsing trap: one typo silently kills the rule in :has/:not */
.x:not(.a, .foo:invalidpseudo) { }   /* whole rule dropped */
/* ✅ In :is/:where the bad token is ignored, rest still matches */
:is(.a, .foo:invalidpseudo) { }      /* matches .a */
```

## ⚖️ Trade-offs

- **`:where()` for anything you want easily overridden** — resets, design-system defaults, base styles. Its zero specificity means consumers never fight it. Conversely, that's a footgun if you *needed* it to win.
- **`:has()` is a superpower, but it can be expensive.** The engine may re-evaluate ancestors on DOM/state changes. Modern browsers optimise common cases well; still, avoid extremely broad `:has()` on hot, frequently-mutating trees.
- **`:has()` enables logic you'd previously do in JS** — toggling parent layout on child presence, form validation styling — cutting scripts entirely. That's the real win: state stays in the DOM.
- **Specificity discipline:** reach for `:is()` when you *want* weight, `:where()` when you don't. Mixing them up creates override surprises.

## 💣 Gotchas interviewers probe

- **`:is()` vs `:where()` = specificity, nothing else.** `:where()` is always 0; `:is()` inherits its heaviest argument. The single most probed detail here.
- **`:is()`/`:where()` are forgiving; `:not()`/`:has()` are not.** A bad selector inside `:is()` is ignored; inside `:has()` it invalidates the whole rule.
- **`:has()` selects the *subject*, not the argument.** `figure:has(img)` styles the `figure`, not the `img`. People invert this constantly.
- **`:has()` gives you previous-sibling and parent selection** — `h2:has(+ p)`, `.card:has(.badge)` — things impossible before. This is *the* headline feature.
- **`:not(:has(...))`** and nesting let you express "elements lacking a certain child" — powerful for empty-state styling.
- **Specificity of `:has()`** = its most specific argument, so it can quietly outweigh what you expect.

## 🎯 Say this in the interview

> "`:is()` and `:where()` both flatten selector lists — `:is(h1,h2,h3) a` instead of writing three rules — and the *only* difference between them is specificity: `:where()` is always zero, which makes it ideal for defaults and resets that a single class can override, while `:is()` takes the specificity of its heaviest argument, so it still wins like a normal selector. `:has()` is the big one — it's the relational or parent selector. It styles an element based on what it contains or what follows it, so I can do `form:has(:invalid) button { opacity: .5 }` or `h2:has(+ p)` to reach the previous-sibling relationship CSS never had. The subtlety to call out: `:has()` styles the *subject*, not the argument, and unlike `:is()`/`:where()` it's *not* forgiving — one invalid selector inside it drops the whole rule. Performance-wise it's well-optimised now, but I'd still avoid very broad `:has()` on trees that mutate constantly."

## 🔗 Go deeper

- [MDN — `:has()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:has) — the relational selector, with sibling/child examples.
- [MDN — `:is()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:is) — grouping and its specificity behaviour.
- [MDN — `:where()`](https://developer.mozilla.org/en-US/docs/Web/CSS/:where) — the zero-specificity twin and why it matters for resets.
