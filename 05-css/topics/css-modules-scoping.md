<div align="center">

# CSS Modules & scoping

<sub>🎨 CSS · 🟢 Easy · ⏱ 30m · `#architecture`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A CSS Module is a plain `.css` file where every class name is **rewritten to a unique string at build time** and handed back to your JS as an object. Scoping is achieved by *renaming*, not by any runtime or shadow boundary — so you keep 100% real CSS with zero global collisions and zero runtime cost.

---

## 🧠 Mental model

The global namespace is CSS's original sin: one `.title` rule can silently restyle a component three folders away. Most "CSS architecture" (BEM, ITCSS) is discipline layered on top to *avoid* collisions by convention. CSS Modules solve it mechanically instead.

Think of a CSS Module as a **local-by-default** compilation of an ordinary stylesheet. You write `.title { ... }`. The bundler transforms that class to something like `.Button_title__x7Fq2` and gives your component an import map:

```
styles.title  →  "Button_title__x7Fq2"
```

You never type the hashed name; you reference `styles.title`. Collisions become impossible because no two files can produce the same hash. Crucially, **it is still just CSS** — the cascade, specificity, media queries, and `:hover` all work exactly as normal. The only magic is the rename.

## ⚙️ How it actually works

At build time (via `css-loader`, Vite, or PostCSS), any file matching `*.module.css` is processed so that class and id selectors are **locally scoped**: each is replaced with a unique token derived from the filename + class + a hash. The loader exports a JS object mapping original → generated names. That's the entire mechanism — no runtime library ships to the browser.

Two keywords define the scope boundary:

- **`:local(...)`** (the default for every class) — rename this, keep it component-private.
- **`:global(...)`** — an explicit escape hatch: *do not* rename, leave it global. You use it for third-party class hooks or truly app-wide classes.

**Composition** is the feature people miss. `composes` lets one local class pull in the declarations of another — including from a shared file — without a runtime or `@apply`:

```css
.button { composes: base from './shared.css'; color: white; }
```

The loader resolves this by making the element carry *both* class names (`class="shared_base__a1 Button_button__b2"`), so it's ordinary CSS multi-class application, not a copy of declarations. That means the cascade still decides winners — composition is not inheritance and doesn't raise specificity.

The senior point: **CSS Modules are a build-time renaming scheme, so they cost nothing at runtime and produce a normal, cacheable `.css` file** — the opposite trade to runtime CSS-in-JS. What you give up is *dynamic* styling from props; you get variants by toggling class keys, not by interpolating values.

## 💻 Code

```css
/* Button.module.css — write plain CSS, class names are LOCAL by default */
.button { padding: 8px 12px; border-radius: 6px; }
.primary { composes: button; background: var(--color-primary); color: #fff; }

/* explicit escape hatch: don't rename these */
:global(.no-js) .button { transition: none; }
```

```jsx
// Button.jsx — reference classes through the imported object
import styles from './Button.module.css';

export function Button({ variant = 'button', ...props }) {
  // ❌ styles['does-not-exist'] silently yields undefined → class="undefined"
  // ✅ guard, or rely on the mapping you know exists
  return <button className={styles[variant]} {...props} />;
}
```

```jsx
// Conditional / multiple classes — join truthy keys (or use `clsx`)
const cls = [styles.card, isActive && styles.active].filter(Boolean).join(' ');
```

## ⚖️ Trade-offs

- **Reach for CSS Modules** when you want real CSS, zero runtime, and guaranteed scoping — the pragmatic default for component apps that don't need heavy runtime theming.
- **They don't do dynamic values well.** You can't compute `padding: ${x}px` from a prop. The idiomatic answer is CSS custom properties: set `style={{ '--pad': x }}` in JS and read `var(--pad)` in the module — best of both worlds.
- **`composes` only works with local class references**, and only in CSS Modules — it's not a CSS feature, so you can't compose from an arbitrary selector or a `:global`.
- **When NOT to use them:** if you need styles that are a *function* of runtime state, or a fully themeable library API, reach for custom properties + a token layer or vanilla-extract. If you're all-in on Tailwind, Modules add a parallel system.
- **Naming ergonomics:** `styles.fooBar` (camelCase) vs `.foo-bar` in CSS forces `localsConvention` config or bracket access — a small but real papercut.

## 💣 Gotchas interviewers probe

- **"How is scoping enforced — Shadow DOM?"** No. It's **build-time renaming**. There's no runtime and no encapsulation boundary; global styles can still target the element if they match. This is the #1 misconception.
- **A typo'd key is silent.** `styles.buton` is `undefined`, which stringifies to `class="undefined"` — no error, just unstyled. TypeScript typed-CSS-modules plugins catch this.
- **`composes` ≠ specificity boost.** It adds another class to the element; the cascade still resolves conflicts by source order/specificity. People assume the composed class "wins."
- **`:global` leaks on purpose.** Anything inside it keeps its raw name and *can* collide — that's the trade for interop. Scope it tightly.
- **Ordering across modules isn't guaranteed** the way you'd hope — if two modules both style a shared composed base, final order depends on how the bundler concatenates. Don't rely on cross-module source order for tiebreaks.
- **Hashes change between builds** unless configured stable — fine for cache-busting, but don't hardcode a generated name anywhere.

## 🎯 Say this in the interview

> "CSS Modules solve the global-namespace problem by renaming. At build time every class in a `.module.css` file gets rewritten to a unique hashed name and exported as a JS object, so I write plain CSS and reference `styles.title` instead of a string — collisions become mechanically impossible with zero runtime. It's important that it's *not* Shadow DOM: there's no encapsulation boundary, just renaming, so it stays ordinary cascade-driven CSS. The feature I lean on is `composes`, which shares declarations by applying multiple class names rather than copying rules, so specificity stays flat. The limitation is dynamic styling — I can't interpolate a prop into a value — so when I need that I set a CSS custom property inline in JS and read it with `var()` inside the module. That combination gives me scoping, zero runtime, and dynamic values without reaching for a runtime CSS-in-JS library."

## 🔗 Go deeper

- [CSS Modules — spec/readme](https://github.com/css-modules/css-modules) — the canonical definition of `:local`, `:global`, and `composes`.
- [MDN — CSS Modules](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_modules) — browser-context overview and tooling.
- [Vite — CSS Modules](https://vite.dev/guide/features.html#css-modules) — how a modern bundler wires them up, including `localsConvention`.
- [css-loader `modules` options](https://github.com/webpack-contrib/css-loader#modules) — the knobs for naming, scope, and stable hashes.
