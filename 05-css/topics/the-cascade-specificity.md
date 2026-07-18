<div align="center">

# The cascade & specificity

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#cascade`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The cascade is a **sorting algorithm** that picks one declaration per property, and specificity is only the *fourth* tiebreaker — origin & importance, then cascade layers, then specificity, then source order. Most "specificity bugs" are actually people reaching for specificity when they should have reached for a layer or a different origin.

---

## 🧠 Mental model

CSS doesn't "apply rules". For every element × property pair, the engine collects **every declaration that matches**, sorts them, and the winner is the last one standing. Specificity is one column in that sort — not the whole thing.

The sort keys, in order:

| # | Key | Beats everything below it |
|---|---|---|
| 1 | **Origin & importance** | `!important` user-agent > `!important` user > `!important` author > **author** > user > user-agent |
| 2 | **Cascade layer** (`@layer`) | later layer wins; unlayered author styles beat all layers |
| 3 | **Inline style** (`style=""`) | ~ acts like an unbeatable specificity tier |
| 4 | **Specificity** `(ID, CLASS, TYPE)` | the famous one |
| 5 | **Source order** | last declaration in the stylesheet wins |

Note what's *missing*: the order you write selectors in a file only matters if **everything above it ties**. And notice `!important` inverts the origin order — that's why a user's `!important` accessibility override beats your `!important`, and it's the whole reason the mechanism exists.

## ⚙️ How it actually works

**Specificity is a 3-tuple, not a number.** Compare left to right, like version numbers:

```
(A, B, C)
 │  │  └── type selectors & pseudo-elements:  div, ::before
 │  └───── classes, attributes, pseudo-classes:  .btn, [href], :hover
 └──────── IDs:  #main
```

```
#nav .item              → (1, 1, 0)
.a.b.c.d.e.f.g.h.i.j.k  → (0, 11, 0)   ← still loses to (1,0,0). No carrying.
```

There is **no base-10 carry**. Eleven classes never add up to an ID. Anyone who says "IDs are worth 100" has internalised a lie that works until it doesn't.

Things that count as **zero**: the universal selector `*`, combinators (`>`, `+`, `~`, ` `), and `:where()`. Things that count as **one class**: `:hover`, `[type="text"]`, `:not()`'s *parentheses* (zero) but its *argument* contributes. `:is()` and `:has()` take the specificity of their **most specific argument**.

```css
:is(#app, .card) p  { }  /* (1,0,1) — the #app arm sets the price for everyone */
:where(#app, .card) p { }  /* (0,0,1) — :where() zeroes its argument entirely */
:not(.a, #b) { }  /* (1,0,0) — most specific argument wins */
```

**Inline styles** sit above all author specificity (they can only be beaten by `!important`). **`!important`** doesn't raise specificity — it moves the declaration into a *different origin bucket*, which is why it's a blunt instrument: once two `!important` author declarations collide, you're back to comparing specificity, and now you've started an arms race.

## 💻 Code

The bug everyone ships, and the actual fix:

```css
/* Component library */
.card .title { color: navy; }        /* (0,2,0) */

/* Your page — this silently loses */
.title--danger { color: red; }        /* (0,1,0) ❌ */

/* ❌ The escalation: now nothing can ever override it */
.title--danger { color: red !important; }

/* ❌ The other escalation: unreadable, brittle */
.page .card .title.title--danger { color: red; }

/* ✅ Flatten instead. Same specificity, later in source order → wins. */
.card .title { color: navy; }
.card .title.is-danger { color: red; }   /* (0,3,0) but intent is explicit */

/* ✅✅ Better: stop competing. Put the library in a lower layer. */
@layer library, app;
@layer library { .card .title { color: navy; } }   /* (0,2,0) */
@layer app     { .title--danger { color: red; } }  /* (0,1,0) — STILL WINS.
                                                     Layer order beats specificity. */
```

Deliberately weakening a selector so consumers can override it — the single most useful modern trick:

```css
/* A reset that matches deeply but costs nothing to override */
:where(.prose) :where(h1, h2, h3) {
  margin-block: 0;      /* specificity (0,0,0) — literally any selector beats it */
}
```

## ⚖️ Trade-offs

- **`!important` is not always evil.** In a utility layer (`.hidden { display: none !important }`) or a user stylesheet, it's the correct tool: it says "this is a promise, not a suggestion". In component CSS it's a smell, because you've converted a sorting problem into an unwinnable arms race.
- **Low, flat specificity is a feature, not a purity contest.** BEM, utility CSS, and CSS Modules all converge on the same insight: if every selector is `(0,1,0)`, the cascade degenerates into *source order*, which humans can actually reason about.
- **But flat specificity moves the complexity, it doesn't delete it.** Now bundle order and import order decide your styles — and that's controlled by your bundler, not your CSS. `@layer` exists precisely to make that ordering explicit and declarative instead of an emergent property of your build.
- **Don't use IDs as styling hooks.** Not because they're "bad practice" — because `(1,0,0)` is a nuclear number you can only outbid with another ID or `!important`.

## 💣 Gotchas interviewers probe

- **"Is `#id` worth 100 classes?"** No — specificity doesn't carry. It's a lexicographic tuple comparison. A candidate who says "100/10/1" is reciting a mnemonic, not a model.
- **`!important` in the *user* origin beats `!important` in the *author* origin.** The importance flag *reverses* the origin precedence. This is what makes user accessibility stylesheets work at all.
- **Unlayered styles beat every `@layer`.** Counterintuitive but deliberate: adopting layers must never break the plain CSS you already had.
- **`:where()` has zero specificity, `:is()` does not.** `:is(a, b)` inherits the specificity of its most specific argument — so `:is(#x, p)` costs you an ID even when it matched the `p`.
- **`:not(.foo)` costs one class**, because the *argument* counts. `:not()` itself is free.
- **Specificity is per-declaration, not per-rule.** A rule can win on `color` and lose on `background` in the same block.
- **`transition`/`animation` and `!important`:** an animation's declarations beat everything *except* `!important` — the cascade puts animation origin above normal author declarations. That's why an `!important` value can freeze an animation dead.
- **`all: unset` / `all: revert`** are the escape hatches when you inherit a nightmare and don't want to out-specify it.

## 🎯 Say this in the interview

> "I think of the cascade as a sort, not a lookup. For each property, the browser gathers every matching declaration and sorts by origin and importance first, then cascade layer, then inline style, then specificity, and only finally source order. Specificity itself is a three-part tuple — IDs, then classes/attributes/pseudo-classes, then types — compared left to right with no carrying, so eleven classes still lose to one ID. Most specificity 'bugs' are really architecture bugs: someone needed a lower-priority stylesheet and reached for `!important` instead. So my go-to tools are `@layer` to make ordering explicit, and `:where()` to write selectors with deliberately zero specificity so consumers can override them without an arms race. I keep `!important` for utilities and true invariants, where 'this is not negotiable' is the actual intent."

## 🔗 Go deeper

- [web.dev — Specificity](https://web.dev/learn/css/specificity) — the clearest visual explanation of the tuple.
- [web.dev — The cascade](https://web.dev/learn/css/the-cascade) — the full sort order, including origins and importance.
- [MDN — Specificity](https://developer.mozilla.org/en-US/docs/Web/CSS/Specificity) — the exact rules, including `:is`, `:not`, `:where`.
- [CSS Cascading and Inheritance Level 5 (spec)](https://www.w3.org/TR/css-cascade-5/) — the normative source, and surprisingly readable on cascade order.
