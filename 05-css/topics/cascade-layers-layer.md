<div align="center">

# Cascade layers (`@layer`)

<sub>🎨 CSS · 🟡 Medium · ⏱ 30m · `#cascade` `#modern`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `@layer` lets you declare **ordered buckets of styles** whose priority is fixed by layer order, *above* specificity. A rule in a later layer beats any rule in an earlier layer no matter how specific — so you can stop fighting specificity wars and stop reaching for `!important`.

---

## 🧠 Mental model

Normally, when two rules match, the browser compares **specificity**, then source order. Cascade layers insert a *new, higher-priority step* into that comparison: **which layer are you in?** Layer order is decided by you, once, and it wins before specificity is even consulted.

Think of it as a stack of transparencies you order deliberately: `reset` at the bottom, then `base`, `components`, and `utilities` on top. A single-class utility in the top layer beats a deeply-nested `#id .a .b .c` selector in a lower layer — because the layer comparison happens *first*. Specificity only breaks ties **within** a layer.

The one surprise: **unlayered styles are the highest-priority normal layer of all.** Anything you write outside `@layer` beats everything inside layers. So layers are opt-in, and legacy CSS keeps working.

## ⚙️ How it actually works

The full cascade sort order (for normal, non-`!important` declarations), highest wins:

```
1. Origin & importance   (author normal > user > UA)
2. Layer order           ← @layer lives here. Unlayered = top.
3. Specificity           ← only compared WITHIN the same layer
4. Source order          ← last one wins
```

**Declare the order first, populate later.** The order is set by the *first* time each layer name appears:

```css
@layer reset, base, components, utilities;  /* order fixed here */
```

Later layers win. Layers can be nested (`components.card`), and you can pull third-party CSS into a layer at import time with `@import url(bootstrap.css) layer(vendor)` — instantly making all of Bootstrap lose to your own unlayered styles.

**`!important` inverts the layer order.** An `!important` declaration in an *early* layer beats an `!important` declaration in a *later* one. This is deliberate: it lets a low-level `reset` layer set genuinely non-negotiable rules that even utilities can't override.

## 💻 Code

```css
/* 1. Establish priority up front — earliest = lowest priority */
@layer reset, base, components, utilities;

@layer reset {
  * { margin: 0; box-sizing: border-box; }
}

@layer components {
  /* High specificity, but it's in a LOWER layer... */
  #app .card .title { color: navy; }
}

@layer utilities {
  /* ...so this single class WINS. No !important needed. */
  .text-red { color: red; }
}
```

```css
/* Wrap a whole vendor library so YOUR styles beat it effortlessly */
@import url("bootstrap.css") layer(vendor);

/* Unlayered → beats every layer above, including vendor */
.btn { border-radius: 999px; }
```

```css
/* revert-layer: roll a property back to the value from lower layers */
@layer overrides {
  .card { color: revert-layer; }  /* discard THIS layer's value */
}
```

## ⚖️ Trade-offs

- **Layers end specificity arms races**, but they add a *new* mental model everyone on the team must learn. A junior debugging "why is my `#id` rule losing to a class?" will be baffled until they know layers exist.
- **Unlayered-wins is a footgun in migration.** If half your CSS is layered and half isn't, the unlayered half silently dominates. Migrate wholesale, or explicitly park legacy CSS in a low layer.
- **Don't use layers to paper over bad selectors.** They're for *architecture* (reset → base → components → utilities), not for winning individual battles. If you're adding a layer to beat one rule, you have a different problem.
- **Great for design systems and third-party CSS** where you can't control specificity — layer their CSS below yours and you never touch `!important` again.

## 💣 Gotchas interviewers probe

- **Unlayered styles beat *all* layered styles.** The most-missed rule. Layers sit *below* normal unlayered CSS, not above it.
- **Layer order > specificity.** A `.class` in a later layer beats an `#id` in an earlier layer. If a candidate says "the ID always wins," they don't know layers.
- **`!important` reverses the order.** Important declarations in earlier layers win over important ones in later layers — the opposite of normal declarations.
- **Order is set by first mention.** Re-opening a layer later adds to it but doesn't change its priority. Declare the full order on line one.
- **Nested layers** (`@layer a { @layer b {} }`) sort as `a.b`, scoped within `a`'s slot.
- **`revert-layer`** rolls back to the value from lower layers only — distinct from `revert`, which rolls back to a previous *origin*.

## 🎯 Say this in the interview

> "Cascade layers add a priority step *above* specificity: I declare an ordered set of layers — say `reset, base, components, utilities` — and a rule in a later layer beats any rule in an earlier layer regardless of how specific it is. Specificity only breaks ties *within* a layer. The payoff is I stop writing `!important` and stop escalating selectors just to win. The two things I'm careful about: first, *unlayered* styles beat everything in layers, so layers are opt-in and I migrate deliberately rather than half-way. Second, `!important` inverts the layer order — important rules in the *earliest* layer win — which is actually useful for locking down non-negotiable resets. The killer use case is wrapping a third-party library with `@import ... layer(vendor)` so all my own CSS automatically overrides it without a specificity fight."

## 🔗 Go deeper

- [MDN — `@layer`](https://developer.mozilla.org/en-US/docs/Web/CSS/@layer) — syntax, nesting, and the priority rules.
- [web.dev — Cascade layers](https://web.dev/articles/cascade-layers) — the architecture case with clear diagrams.
- [MDN — The cascade](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascade/Cascade) — where layers sit in the full sort order.
