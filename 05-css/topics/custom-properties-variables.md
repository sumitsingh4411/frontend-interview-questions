<div align="center">

# Custom properties (variables)

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#variables` `#theming`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSS custom properties are **live, inherited values resolved by the cascade at runtime** — not Sass variables that vanish at build time. `--x` is a real value that lives on an element, inherits down the tree, and can be read or rewritten from JS while the page runs.

---

## 🧠 Mental model

The single most important thing to understand: a custom property is **not text substitution**. A Sass `$color` is find-and-replace that happens once, at compile time, and is gone from the shipped CSS. A CSS custom property is a *value that lives on an element in the DOM*, participates in the cascade and inheritance, and is resolved lazily every time it's used.

That difference is the whole reason they exist. Because they inherit, setting one on `:root` makes it global; because they're resolved at runtime, flipping one value re-themes the entire page with no rebuild; because a component *reads* `var(--gap)` rather than hard-coding it, the same component adapts to whatever context it's dropped into.

## ⚙️ How it actually works

Declare with `--name: value`, consume with `var(--name, fallback)`. The value is substituted at **computed-value time**, which is later than you think and is the source of most surprises.

**Invalid At Computed Value Time (IACVT)** is the deep gotcha. If `var()` resolves to something invalid *for the property it's used in*, the property doesn't fall back to its previous value — it becomes `unset` (i.e. inherited or initial):

```css
--size: 10foo;           /* nonsense */
padding: var(--size);    /* NOT ignored — padding becomes 0 (initial), not "the old padding" */
```

The `var()` fallback (`var(--x, red)`) is used **only when `--x` is not set at all** — never when it's set to an invalid value. Those are two different escape hatches.

Custom properties are **untyped tokens** by default — the browser treats the value as an opaque string until it's substituted. `@property` registers a type, an initial value, and inheritance behaviour, which unlocks two things you can't otherwise get: **animating** a custom property, and **type checking** (an invalid value is rejected instead of poisoning the property).

```css
@property --angle {
  syntax: '<angle>';
  initial-value: 0deg;
  inherits: false;
}
```

## 💻 Code

Theming from one flipped value, plus runtime access from JS:

```css
:root {
  --bg: white;
  --fg: #111;
  --space: 8px;
}
[data-theme='dark'] {
  --bg: #111;
  --fg: #eee;                    /* one flip re-themes everything downstream */
}
.card {
  background: var(--bg);
  color: var(--fg);
  padding: calc(var(--space) * 2); /* arithmetic needs calc — you can't do var*2 */
}
```

```js
const root = document.documentElement;
getComputedStyle(root).getPropertyValue('--space'); // " 8px" (note leading space!)
root.style.setProperty('--space', '12px');          // live, no rebuild
```

Animating a registered property — impossible without `@property`:

```css
@property --p { syntax: '<percentage>'; initial-value: 0%; inherits: false; }
.bar { background: linear-gradient(90deg, teal var(--p), #eee 0); transition: --p .3s; }
.bar:hover { --p: 100%; } /* smooth fill; unregistered vars would jump discretely */
```

## ⚖️ Trade-offs

- **They cost a resolution step, not a rebuild.** Runtime theming, contextual components, and JS-driven values are things Sass variables physically cannot do — that's the win. The price is a small resolution cost and no type safety unless you reach for `@property`.
- **They can't be used in media-query conditions.** `@media (min-width: var(--x))` doesn't work — custom properties are properties *on elements*, and the media query is evaluated before any element context exists. Container queries and `calc()` in values cover most of what people reach for here.
- **Inheritance is a default, not always a gift.** A widget you didn't write will inherit your `--color`. Use `@property { inherits: false }` or scope the declaration when you want isolation.

## 💣 Gotchas interviewers probe

- **IACVT falls back to inherited/initial, not "the last good value."** This trips up almost everyone. An invalid `var()` doesn't preserve the previous declaration — it resets the property.
- **`var(--x, fallback)` fallback triggers only on "unset," never on "invalid."** Know the distinction cold.
- **Custom properties are case-sensitive.** `--Foo` and `--foo` are different, unlike the rest of CSS.
- **`getPropertyValue` returns the raw string with whitespace preserved** — `" 8px"`, not `"8px"`. Trim before parsing.
- **You can't build property names or partial values by concatenation** the way people expect — the token is substituted whole.
- **Unregistered custom properties animate discretely** (snap at 50%), which looks broken. `@property` is the fix.

## 🎯 Say this in the interview

> "The key mental shift is that custom properties aren't Sass variables — they're live values that live on elements, inherit through the cascade, and resolve at runtime. That's why one declaration on `:root` themes the whole page and why I can flip a theme from JS with no rebuild. The detail I'm careful about is 'invalid at computed value time': if a `var()` resolves to something invalid for that property, it doesn't keep the old value, it resets to inherited or initial — and the `var()` fallback only fires when the variable is completely unset, not when it's invalid. If I need to *animate* a variable or *type-check* it, I register it with `@property`, because plain custom properties are untyped and only animate discretely."

## 🔗 Go deeper

- [MDN — Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — the canonical reference, including IACVT.
- [MDN — `@property`](https://developer.mozilla.org/en-US/docs/Web/CSS/@property) — registration, typing, and why it enables animation.
- [web.dev — `@property`](https://web.dev/articles/at-property) — animatable custom properties with real examples.
