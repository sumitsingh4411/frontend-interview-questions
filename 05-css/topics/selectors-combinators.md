<div align="center">

# Selectors & combinators

<sub>🎨 CSS · 🟢 Easy · ⏱ 45m · `#selectors`</sub>

<a href="../README.md">⬅ CSS</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Selectors target elements; **combinators** describe the *relationship* between them: descendant (space), child (`>`), next-sibling (`+`), and subsequent-sibling (`~`). The mental unlock is that the browser reads selectors **right-to-left**, starting from the rightmost "key" selector — which is why selector shape matters for both correctness and performance.

---

## 🧠 Mental model

Every selector has a **key selector** — the rightmost simple selector — and everything to its left is a *condition* that must also hold. `.menu > li a` means: "find every `<a>` (the key), keep those inside an `<li>`, keep those whose `<li>` is a *direct child* of `.menu`."

Reading it left-to-right (the way you write it) makes you think "start at `.menu`, walk down." The browser does the opposite: it starts from every `<a>` and walks *up*, discarding non-matches. That's why a broad key selector like `* {}` or `div {}` at the end of a long chain is expensive — the engine tests it against far more candidates.

## ⚙️ How it actually works

The four structural combinators:

| Combinator | Name | Matches |
|---|---|---|
| `A B` (space) | Descendant | `B` anywhere inside `A` |
| `A > B` | Child | `B` that is a *direct* child of `A` |
| `A + B` | Next-sibling | `B` immediately following `A`, same parent |
| `A ~ B` | Subsequent-sibling | Any `B` after `A`, same parent |

Sibling combinators only look **forward** — there is no "previous sibling" combinator, because CSS matches in document order and can't cheaply look backward. This forward-only rule is why `label + input` styles the input *after* the label, and why the classic "checkbox hack" (`input:checked ~ .panel`) works but the reverse doesn't.

**Combinators add zero specificity.** Specificity counts the *simple* selectors (ids, classes/attributes/pseudo-classes, types), not the ` `, `>`, `+`, `~` between them. So `.a > .b` and `.a .b` have identical specificity (0-2-0); the combinator only changes *what matches*, never *who wins*.

Attribute selectors give you substring matching: `[href^="https"]` (starts-with), `[href$=".pdf"]` (ends-with), `[href*="track"]` (contains), `[lang|="en"]` (exactly `en` or `en-*`), and `[data-x="y" i]` (case-insensitive).

## 💻 Code

```css
/* Child vs descendant — a classic source of over-reaching styles */
.nav > li      { border: 1px solid; } /* ONLY top-level items */
.nav li        { padding: 4px; }      /* every li, nested submenus too */

/* Sibling combinators look forward only */
h2 + p         { margin-top: 0; }     /* the p immediately after an h2 */
h2 ~ p         { color: gray; }       /* every p after an h2, same parent */

/* Attribute matching */
a[href^="http"]:not([href*="mysite.com"])::after { content: " ↗"; } /* external links */
input[type="checkbox"] { accent-color: rebeccapurple; }
```

```css
/* ❌ Slow + fragile: broad key selector, deep chain */
#app .list .item .row * { color: red; }

/* ✅ Target the thing directly; combinators for the ONE relationship that matters */
.row__cell { color: red; }
```

```html
<!-- The checkbox hack relies on forward-only sibling matching -->
<input type="checkbox" id="menu">
<label for="menu">☰</label>
<nav class="drawer">…</nav>
```
```css
#menu:checked ~ .drawer { transform: translateX(0); } /* .drawer must come AFTER */
```

## ⚖️ Trade-offs

- **Descendant selectors are convenient but leaky.** `.card p` also styles a `<p>` inside a nested card or an embedded widget. The child combinator (`>`) scopes tightly; a single class on the element scopes tightest of all.
- **Deep selector chains couple CSS to DOM structure.** `.a > .b > .c` breaks the moment someone adds a wrapper `<div>`. Flat, class-based selectors (BEM-style) trade a little verbosity for resilience.
- **Selector performance rarely matters** on modern engines — but *pathological* cases (thousands of nodes × complex descendant selectors, or `:has()` on hot paths) can. Optimise the key selector, not micro-details.

## 💣 Gotchas interviewers probe

- **Right-to-left matching.** The rightmost selector is evaluated first. Candidates who think it's left-to-right misunderstand both performance and how `:has()` differs.
- **No previous-sibling combinator (pre-`:has()`).** You can style the element *after* another, never before. This drives a lot of DOM-ordering decisions.
- **Combinators don't add specificity.** `div > .x` and `div .x` tie; the space vs `>` never affects who wins.
- **`>` vs space is not cosmetic.** Child scoping prevents styles leaking into nested instances of the same component.
- **The universal selector `*` and type selectors are cheap in specificity but broad in matching** — a wide net at the key position is the actual perf cost.
- **`A + B` needs B immediately after A** with no element between them; a stray `<span>` breaks it. `~` is the forgiving version.

## 🎯 Say this in the interview

> "The key thing about selectors is that the browser reads them right-to-left, from the rightmost 'key' selector — so `.menu > li a` starts from every anchor and walks up checking the conditions, not top-down from `.menu`. That's why a broad key selector is the real performance cost. For combinators: space is any descendant, `>` is a direct child, `+` is the immediately-following sibling, and `~` is any following sibling. Sibling combinators only look *forward* — there's no previous-sibling combinator historically, which is why the checkbox-hack pattern requires the target to come after the input in the DOM. And a detail people miss: combinators add zero specificity, so `.a > .b` and `.a .b` tie — the combinator changes what matches, never who wins. In practice I prefer flat, class-based selectors over deep chains because deep chains couple CSS to DOM structure and break when someone adds a wrapper."

## 🔗 Go deeper

- [MDN — CSS selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors) — the full catalogue, grouped by type.
- [MDN — Combinators](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors/Selector_structure) — descendant, child, and sibling relationships.
- [MDN — Attribute selectors](https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors) — substring matching operators and the case-insensitive flag.
