<div align="center">

# Design tokens

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 45m · `#design-systems` `#theming`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Design tokens are **named design decisions stored as data** (`color.action.primary = #2563eb`), decoupled from any platform, so one change to the data re-themes every component on every platform — the key move is a three-tier structure (primitive → semantic → component) that lets you rebrand or add dark mode by swapping one layer.

---

## 🧠 Mental model

A hard-coded `#2563eb` in a stylesheet is a decision with no name and no single home — it's copied into fifty files, and "change the brand blue" becomes an archaeology project. A token gives that decision a **name and one source of truth**. But the real power isn't naming a color; it's the **indirection layers** between the raw value and its use:

```
Primitive (raw)      Semantic (intent)          Component (specific)
blue.600 = #2563eb → color.action.primary  →   button.bg.primary
                     color.link                 badge.bg.info
```

Components reference **semantic** tokens (`color.action.primary`), never raw values. Dark mode = re-point the semantic layer at different primitives. A rebrand = change the primitives. A one-off tweak = override at the component layer. Each kind of change has exactly one place to happen. **A flat list of tokens is just a variables file; the tiering is what makes tokens a system.**

## ⚙️ How it actually works

- **Tokens are data, not CSS.** They live as JSON (increasingly the W3C DTCG format with `$value`/`$type`), platform-agnostic on purpose. A build tool — **Style Dictionary** is the standard — transforms that one source into CSS custom properties, JS/TS objects, iOS `.swift`, Android XML, Tailwind config. One definition, every platform, guaranteed in sync.
- **Aliasing** is the mechanism behind the tiers: a semantic token's value *references* a primitive (`"{color.blue.600}"`). Change the primitive and every alias updates. This is why theming is cheap.
- **On the web, CSS custom properties are the runtime carrier.** Semantic tokens compile to `:root { --color-action-primary: … }`, and a theme is a selector that overrides them: `[data-theme="dark"] { --color-action-primary: … }`. Because custom properties cascade and are live, the theme switches with **no rebuild and no JS re-render** — the browser recomputes styles. That runtime nature is the token system's superpower on the web.
- **Types beyond color:** spacing scales, typography (size/line-height/weight), radii, shadows, motion durations, z-index. Tokenising the *scale* (`space.1…space.8`) is what enforces visual rhythm — designers pick from the scale instead of inventing `13px`.

## 💻 Code

```jsonc
// tokens.json — one source of truth (W3C DTCG-ish shape). Note the alias.
{
  "color": {
    "blue":   { "600": { "$value": "#2563eb", "$type": "color" } },
    "action": { "primary": { "$value": "{color.blue.600}" } }  // semantic → primitive
  },
  "space": { "4": { "$value": "16px", "$type": "dimension" } }
}
```

```css
/* Compiled output. Theming = override the SEMANTIC layer only. */
:root {
  --color-blue-600: #2563eb;
  --color-action-primary: var(--color-blue-600); /* alias preserved */
  --space-4: 16px;
}
[data-theme="dark"] {
  --color-blue-600: #3b82f6;          /* re-point one primitive… */
  /* …and every semantic + component token that aliases it updates,
     live, no rebuild, no re-render. */
}

/* Components consume SEMANTIC tokens — never raw hex, never primitives. */
.button-primary { background: var(--color-action-primary); }
```

## ⚖️ Trade-offs

- **When the tiering is overkill:** a single small product with one theme and no cross-platform target doesn't need primitive/semantic/component layers — a flat set of CSS variables is enough, and three-tier indirection just adds naming overhead. Add tiers when you actually need theming or multiple platforms.
- **Semantic naming is genuinely hard and has to be governed.** `color.action.primary` scales; `color.button-blue` doesn't (it lies the day the button goes green). Bad names ossify — renaming a token is a breaking change across every consumer, so the naming decision is expensive to get wrong.
- **Indirection has a debugging cost.** Tracing `button.bg` → `color.action.primary` → `blue.600` → `#2563eb` is more hops than reading a hex value. The trade is real; it buys you single-point-of-change, which at scale is worth far more than the lookup cost.
- **Tokens are decisions, not just values.** Over-tokenising (a unique token per one-off) recreates the hard-coding problem with extra steps. Tokenise what *repeats*.

## 💣 Gotchas interviewers probe

- **"Tokens are just CSS variables"** — a partial truth that misses the point. Tokens are *platform-agnostic data*; CSS variables are one compiled *output*. The same tokens also produce iOS/Android/Tailwind constants. Conflating them shows you've only seen the web side.
- **Semantic vs primitive tokens** is the core distinction. Components must consume semantic tokens; a component referencing `blue.600` directly breaks theming and defeats the whole system. Interviewers listen for whether you name this.
- **Custom properties theme at runtime; Sass variables don't.** `$primary` in Sass is compiled away — you can't switch themes without rebuilding. This is why modern token systems land on CSS custom properties for the web.
- **Naming is the failure mode.** Systems die from tokens named after their appearance (`gray-1`, `blue-button`) instead of their role (`surface.raised`, `action.primary`). The name must survive a rebrand.
- **`currentColor` and inheritance** interact with custom properties in ways people forget — a custom property inherits down the tree, which is usually a feature (scoped theming on a subtree) but occasionally a surprise.

## 🎯 Say this in the interview

> "Design tokens are named design decisions stored as platform-agnostic data, so one change re-themes everything. The part that makes them a system rather than a variables file is the tiering: primitive tokens hold raw values, semantic tokens express intent like `color.action.primary` and alias the primitives, and components only ever consume the semantic layer. That gives every kind of change one place to happen — dark mode re-points semantics at different primitives, a rebrand changes primitives, a one-off overrides at the component layer. On the web I compile them to CSS custom properties, so switching themes is just overriding those variables under a selector — it happens at runtime with no rebuild and no re-render, which is the web's superpower here and the reason I avoid Sass variables for theming. The thing I'd stress is naming: tokens named after their role survive a rebrand, tokens named after their appearance don't, and renaming one is a breaking change."

## 🔗 Go deeper

- [W3C Design Tokens Format](https://tr.designtokens.org/format/) — the emerging standard shape (`$value`/`$type`) tools are converging on.
- [Style Dictionary](https://styledictionary.com/) — the reference build tool: one source → CSS, JS, iOS, Android.
- [MDN — Using CSS custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties) — the runtime carrier tokens compile to, including the cascade and inheritance behaviour.
- [Nathan Curtis — Tokens in Design Systems](https://medium.com/eightshapes-llc/tokens-in-design-systems-25dd82d58421) — the definitive write-up on tiering and naming.
