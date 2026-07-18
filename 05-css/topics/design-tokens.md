<div align="center">

# Design tokens

<sub>🎨 CSS · 🟡 Medium · ⏱ 45m · `#design-systems` `#theming`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A design token is a **named, platform-agnostic design decision** (`color.brand.primary = #4f46e5`) stored as data, not a hardcoded value. Tokens turn "the blue we use for buttons" into a single source of truth that compiles to CSS variables, iOS, Android, and Figma — so a rebrand is a data edit, not a find-and-replace.

---

## 🧠 Mental model

A raw value like `#4f46e5` answers *what* but never *why*. Design tokens add the missing layer of intent. The mature model is a **three-tier reference chain**:

```
Primitive (option)   Semantic (decision)      Component (usage)
color.blue.600  ──►  color.action.primary ──► button.bg.default
#4f46e5              { $value: {blue.600} }   { $value: {action.primary} }
```

- **Primitive / global tokens** — the raw palette and scale. Meaningless on their own: `blue.600`, `space.4`, `font.size.100`.
- **Semantic / alias tokens** — decisions that *reference* primitives: `color.action.primary`, `color.text.danger`, `surface.raised`. This is the layer components consume.
- **Component tokens** — the most specific: `button.primary.background`.

The whole point of the indirection: components bind to *semantic* names, so you re-theme (dark mode, a new brand, high-contrast) by **repointing the semantic layer at different primitives** — no component touches a hex code. A token that a component references directly by hex has thrown away every benefit.

## ⚙️ How it actually works

The emerging standard is the **W3C Design Tokens Format** — a JSON structure where each token has a `$value` and a `$type`, and can *reference* another token with `{dot.path}` syntax:

```json
{
  "color": {
    "blue": { "600": { "$value": "#4f46e5", "$type": "color" } },
    "action": { "primary": { "$value": "{color.blue.600}", "$type": "color" } }
  }
}
```

That JSON is the source of truth. A **transform pipeline** (Style Dictionary is the reference tool) resolves the references and *builds* platform outputs: CSS custom properties for web, Swift/Kotlin constants for native, a Figma sync for design. One definition, many targets — that's the payoff and the reason tokens exist as a format rather than "just CSS variables."

On the web, tokens land as **CSS custom properties**, and this is where the runtime magic happens. Because custom properties inherit and are resolved live, theming is just re-declaring the semantic tier under a selector:

```css
:root            { --color-action-primary: #4f46e5; } /* light */
[data-theme=dark]{ --color-action-primary: #818cf8; } /* dark: same name, new value */
```

Every component reading `var(--color-action-primary)` updates instantly with no re-render, no JS, no rebuild. The senior insight: **design tokens are the contract; CSS custom properties are one runtime *implementation* of that contract.** Confusing the two ("tokens are just CSS variables") misses that tokens also target iOS/Android/design and carry `$type` metadata that variables can't.

## 💻 Code

```css
/* Three tiers as custom properties. Components ONLY read the semantic tier. */
:root {
  /* primitive */
  --blue-600: #4f46e5;
  --blue-400: #818cf8;
  --space-4: 1rem;

  /* semantic — the layer components consume */
  --color-action-primary: var(--blue-600);
  --color-text-on-action: #fff;
  --pad-control: var(--space-4);
}

[data-theme="dark"] {
  --color-action-primary: var(--blue-400); /* repoint, don't touch components */
}

/* ❌ hardcoding the value throws away theming */
.btn { background: #4f46e5; }

/* ✅ bind to the semantic token */
.btn {
  background: var(--color-action-primary);
  color: var(--color-text-on-action);
  padding: var(--pad-control);
}
```

```css
/* Fallbacks matter: var() takes a second arg used if the token is unset */
.btn { background: var(--color-action-primary, #4f46e5); }
```

## ⚖️ Trade-offs

- **The tiering is the value and the cost.** Three layers of indirection is genuinely more upfront work; for a tiny site it's over-engineering. It pays off the moment you have >1 theme, >1 platform, or >1 team — which is exactly when hardcoded values become unmaintainable.
- **Semantic naming is the hard part, not the tooling.** `color.text.danger` scales; `color.red` doesn't survive a rebrand where "danger" becomes orange. Name by *role*, never by appearance.
- **When NOT to invest heavily:** a single-surface marketing page with one designer. A flat set of custom properties is plenty; a full Style Dictionary pipeline is bureaucracy.
- **CSS variables can't do everything a token spec can** — no `$type` validation, no static extraction for native, no design-tool sync. If web is your only target, that gap may not matter.
- **Governance overhead:** tokens are an API. Renaming a semantic token is a breaking change across every consumer. Treat additions/removals like versioned API changes.

## 💣 Gotchas interviewers probe

- **"Aren't design tokens just CSS variables?"** No — tokens are a *platform-agnostic data format* with types and references; CSS variables are one compile target. This distinction separates people who've built a real design system from those who've only themed a website.
- **Skipping the semantic tier** and letting components read primitives directly is the most common failure. It works until dark mode, then every component needs editing.
- **Custom properties resolve at *use* time, not definition time**, and they *inherit*. That's why a semantic token can point at a primitive that a subtree overrides — powerful, but it means a token's value depends on where it's read.
- **Fallbacks vs. missing tokens:** `var(--x)` with no value and no fallback yields an *invalid* declaration (property uses its guaranteed-invalid/inherited value), which can look like a silent failure. Always ship a fallback for critical tokens.
- **Naming by value** (`--blue`, `--large`) instead of by intent (`--action`, `--space-loose`) defeats the abstraction the first time the value changes.
- **`$type` isn't decoration** — transforms use it to know that a color token becomes a `UIColor` on iOS but a hex on web. Untyped tokens don't cross platforms cleanly.

## 🎯 Say this in the interview

> "A design token is a named design decision stored as data, not a hardcoded value — it captures *intent*, like `color.action.primary`, instead of `#4f46e5`. I structure them in three tiers: primitives are the raw palette, semantic tokens are the decisions that reference primitives, and components bind only to the semantic layer. That indirection is the whole point — I re-theme for dark mode or a rebrand by repointing semantic tokens at different primitives, and no component ever touches a hex code. The W3C token format is JSON with `$value`, `$type`, and `{reference}` syntax, and a tool like Style Dictionary compiles it to CSS custom properties for web and native constants for iOS and Android. On the web those land as CSS variables, so theming is just redeclaring the semantic tier under `[data-theme=dark]` and everything updates live with no re-render. The nuance I'd flag: tokens aren't *just* CSS variables — variables are one compile target of a multi-platform contract."

## 🔗 Go deeper

- [W3C Design Tokens Format](https://tr.designtokens.org/format/) — the `$value`/`$type`/reference spec that tools are standardizing on.
- [Style Dictionary](https://styledictionary.com/) — the reference build pipeline that resolves tokens to every platform.
- [MDN — Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) — how the web runtime implements tokens, including `var()` fallbacks.
- [Design Tokens — the design-systems primer](https://www.designtokens.org/) — naming tiers and governance in practice.
