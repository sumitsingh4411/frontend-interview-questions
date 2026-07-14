<div align="center">

# CSS parsing & the CSSOM

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#parsing` `#css`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSS bytes are tokenized and parsed into the **CSSOM**, a tree of rule objects the browser needs *in full* before it can compute any element's final style — which is exactly why CSS is render-blocking — and selectors are matched **right-to-left**, not the way you read them.

---

## 🧠 Mental model

The DOM answers "what is on the page". The CSSOM answers "what does it look like". They're built by two independent parsers and combined later into the render tree.

The one thing that makes CSS special: **HTML streams and renders incrementally, CSS does not.** The cascade means a rule at the *bottom* of a stylesheet can override one at the top, so the browser cannot compute an element's final style until it has seen *every* rule that could apply. That "need the whole thing" property is the root cause of CSS being render-blocking — not a browser choice, a consequence of how the cascade is defined.

## ⚙️ How it actually works

**Bytes → CSSOM.** The bytes are decoded to characters, tokenized (`.btn`, `{`, `color`, `:`, `red`), and parsed into a tree of objects: a `CSSStyleSheet` containing `CSSRule`s, each with a selector list and a declaration block. Parsing is **fault-tolerant** — an unknown property or an invalid value is dropped silently and the rest of the rule survives (error recovery), which is why one typo'd declaration doesn't nuke the whole rule.

**Style computation & right-to-left matching.** For every element the browser finds the matching rules and resolves the **computed style** (cascade → specificity → source order → inheritance). Matching runs from the **rightmost "key" selector leftward**: for `.nav ul li a` it first finds every `<a>`, then checks *does its ancestor chain satisfy `li`, then `ul`, then `.nav`?* Starting at the element and walking up bails out fast; starting from the rule would mean testing every rule against every element. Browsers accelerate this with per-element ancestor **Bloom filters** to reject non-matches instantly.

**Invalidation.** Change a class or an inline style and the browser marks the affected subtree dirty and runs **style recalculation** — recomputing computed styles — which may then invalidate layout. `getComputedStyle()` forces that recalc to happen *synchronously*.

**The CSSOM is a live API.** It's scriptable: `document.styleSheets`, `sheet.insertRule()`, `el.style`, `getComputedStyle()`. CSS-in-JS libraries that inject rules at runtime are mutating the CSSOM, which triggers recalc.

## 💻 Code

```js
// Selectors match right-to-left. This one:
//   .sidebar ul li a
// is evaluated as: find all <a>, then walk UP checking li → ul → .sidebar.
// So the *rightmost* (key) selector should be the most selective part.

// The CSSOM is a real object model you can read and mutate:
const sheet = document.styleSheets[0];
sheet.insertRule('.btn { color: hotpink }', sheet.cssRules.length); // mutates CSSOM → recalc

// getComputedStyle forces a synchronous style recalc (and layout for lengths):
const w = getComputedStyle(el).width; // ❌ in a loop this is a repeated forced recalc
```

```html
<!-- media that can't match now is NOT render-blocking (still downloaded, low priority) -->
<link rel="stylesheet" href="print.css" media="print" />
<!-- a media query that COULD match the current viewport IS render-blocking -->
<link rel="stylesheet" href="wide.css" media="(min-width: 600px)" />
```

## ⚖️ Trade-offs

- **Deep descendant and universal selectors used to be a real cost;** modern engines with Bloom filters make selector matching rarely the bottleneck. Optimise your CSS for *readability and invalidation*, not for hand-tuned selector speed — that advice is mostly cargo-culted from 2010.
- **`@import` is the anti-pattern.** An `@import` inside CSS can't be discovered until the parent sheet downloads, creating a **serial waterfall** of blocking requests. Use `<link>` so the preload scanner finds them in parallel.
- **Runtime rule injection (CSS-in-JS) trades authoring ergonomics for recalc churn** — every injected rule dirties style. Fine at mount, expensive if you inject per-interaction.

## 💣 Gotchas interviewers probe

- **CSS is render-blocking, not parser-blocking.** The DOM keeps being built while CSS downloads; it's *painting* that waits for the CSSOM. Precision here is the senior signal.
- **CSS also blocks synchronous JS.** A `<script>` after a `<link>` waits for that stylesheet, because the script might call `getComputedStyle`. So CSS can delay script execution and thus first paint.
- **`getComputedStyle()` forces a synchronous style recalc** — and for geometric properties, a layout flush too. Reading it in a loop is a hidden performance bug.
- **`media="print"` is downloaded but not render-blocking;** a query that matches the current viewport *is*. People assume all non-matching media is free — the download isn't.
- **Parsing recovers from errors per-declaration.** One invalid line is dropped, the rule lives on. Candidates often think a bad value kills the whole rule.

## 🎯 Say this in the interview

> "CSS is parsed into the CSSOM — a tree of rule objects. The key fact is that it's not incremental like HTML: because the cascade lets a later rule override an earlier one, the browser needs the *entire* stylesheet before it can compute any element's final style, and that's precisely why CSS is render-blocking. It'll build the DOM while CSS downloads, but it won't paint until the CSSOM is ready. Two details I'd flag: selectors are matched right-to-left starting from the element, which is why the rightmost selector should be the selective one; and `getComputedStyle` forces a synchronous style recalc, so I never call it in a hot loop. The CSSOM is also a live API — `insertRule`, `styleSheets`, `el.style` — which is what CSS-in-JS is really poking at."

## 🔗 Go deeper

- [web.dev — Constructing the object model (CSSOM)](https://web.dev/articles/critical-rendering-path-constructing-the-object-model) — how bytes become the DOM and CSSOM, and why CSS blocks.
- [MDN — CSS Object Model](https://developer.mozilla.org/en-US/docs/Web/API/CSS_Object_Model) — the scriptable API surface: `styleSheets`, `insertRule`, `CSSRule`.
- [MDN — CSS error handling](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_syntax/Error_handling) — why invalid declarations are dropped, not fatal.
