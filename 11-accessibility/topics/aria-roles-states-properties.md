<div align="center">

# ARIA roles, states, properties

<sub>♿ Accessibility · 🔴 Hard · ⏱ 1.5h · `#aria`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — ARIA is a vocabulary for **overriding the accessibility tree** — roles say *what a thing is*, states/properties say *what condition it's in*. It changes semantics and **nothing else**: no focus, no keyboard, no behaviour. The first rule of ARIA is don't use ARIA; the second is that bad ARIA is worse than none.

---

## 🧠 Mental model

ARIA (Accessible Rich Internet Applications) is a set of HTML attributes that **edit the node in the accessibility tree** without touching the DOM's appearance or behaviour. Three flavours:

- **Roles** — *what is this?* `role="tab"`, `role="dialog"`, `role="switch"`. Sets the node's type.
- **States** — *what condition, right now, changing over time?* `aria-checked`, `aria-expanded`, `aria-disabled`, `aria-selected`. These flip as the user interacts.
- **Properties** — *more stable relationships/config.* `aria-labelledby`, `aria-controls`, `aria-haspopup`, `aria-required`.

(The state/property line is fuzzy and rarely matters in practice — both are just attributes on the node. What matters is that some change often and some don't.)

The one sentence to internalise: **ARIA is a promise, not an implementation.** `role="checkbox" aria-checked="true"` promises the screen reader "this is a checked checkbox" — but it doesn't make the element focusable, doesn't toggle on Space, and doesn't render a checkmark. If your JS doesn't *keep that promise*, you've built a widget that lies to assistive tech. That's why **no ARIA beats wrong ARIA**: a bare `<div>` is honestly a generic node; a `<div role="checkbox">` that never updates `aria-checked` actively misinforms.

## ⚙️ How it actually works

**ARIA modifies only the accessibility tree.** It adds zero behaviour. `role="button"` on a div does not add focus, tab order, or Enter/Space handling — you write all of that yourself. This is the number-one ARIA misconception and the fastest way to fail a screen: thinking a role "activates" anything.

Five rules govern correct use (the [ARIA in HTML](https://www.w3.org/TR/using-aria/) rules):

1. **Prefer native HTML.** `<button>` over `<div role="button">`, always, when it exists.
2. **Don't change native semantics** unless you must — `<h2 role="tab">` is a smell; wrap or restructure instead.
3. **All interactive ARIA widgets must be keyboard-operable** — you own the key handling.
4. **Don't use `role="presentation"` / `aria-hidden="true"` on a focusable element** — you create a focusable ghost that AT can't perceive.
5. **Every interactive element needs an accessible name.**

Mechanics worth knowing cold:

- **Roles overwrite native semantics.** `<ul role="tablist">` stops being a list to AT. `<a role="button">` is announced as a button. Powerful and dangerous — you can erase correct semantics by accident.
- **Some states have a *tri-state* or specific value grammar.** `aria-checked` can be `true` / `false` / `mixed`; `aria-expanded` is `true`/`false` (and its *absence* means "not expandable" — different from `false`). `aria-pressed` turns a button into a toggle. Getting the value grammar wrong (e.g. `aria-hidden="false"` thinking it *shows* something) is a classic slip.
- **`aria-disabled` vs `disabled` differ deliberately.** Native `disabled` removes the control from the tab order and blocks events; `aria-disabled="true"` announces "dimmed" but leaves it **focusable and clickable** — you must block the action yourself. Use `aria-disabled` when you want a disabled *appearance* that's still discoverable (e.g. a disabled toolbar button a keyboard user should still land on).
- **Relationship properties use IDREFs.** `aria-controls`, `aria-labelledby`, `aria-describedby`, `aria-activedescendant` point at element ids — a typo or a not-yet-rendered target silently breaks the link with no error.

## 💻 Code

```html
<!-- ❌ Looks accessible, is a lie: no focus, no keyboard, and aria-checked
     never updates. Announced as a checkbox that won't respond. -->
<div role="checkbox" aria-checked="true">Subscribe</div>

<!-- ✅ Just use the native element. Free role, state, focus, Space-to-toggle. -->
<label><input type="checkbox" checked> Subscribe</label>
```

When you genuinely must build custom (no native switch that's fully stylable), keep every promise:

```html
<button type="button" role="switch" aria-checked="false" id="wifi">
  Wi-Fi
</button>
<script>
  const s = document.getElementById('wifi');
  s.addEventListener('click', () => {
    // Keep the ARIA promise in sync with reality on every change.
    const on = s.getAttribute('aria-checked') === 'true';
    s.setAttribute('aria-checked', String(!on));
  });
  // Space/Enter already fire click on a <button> — that's why we started
  // from <button>, not <div>: focus + keyboard came for free.
</script>
```

State that must be *announced* when it changes lives with the widget or in a live region:

```html
<button aria-expanded="false" aria-controls="menu">Filters</button>
<ul id="menu" hidden>…</ul>
<!-- On toggle: flip aria-expanded AND the hidden attribute together. -->
```

## ⚖️ Trade-offs

- **ARIA is the tool of last resort, by design.** WAI-ARIA authoring guidance and WHATWG both say: use it only when HTML can't express the semantics. The cost is that you now own keyboard, focus, and *state synchronisation forever* — and every state you forget to update becomes a lie.
- **When NOT to use ARIA:** to "boost" already-semantic HTML (`<nav role="navigation">`, `<button role="button">` are redundant noise), to label things that have visible text, or to hide focusable content. Redundant ARIA can even *override* correct native semantics and make things worse.
- **`aria-disabled` vs `disabled` is a genuine design choice.** `disabled` is cleaner but hides the control from keyboard users (they can't discover why it's off); `aria-disabled` keeps it discoverable at the cost of you manually preventing activation. Pick per UX intent, don't cargo-cult.

## 💣 Gotchas interviewers probe

- **"Does `role` make it keyboard accessible?"** No. ARIA adds semantics only — zero behaviour. This is *the* filter question. Focus, tab order, and key handling are all still yours.
- **No ARIA is better than bad ARIA.** A stale `aria-checked`/`aria-expanded` misinforms; the [WebAIM Million](https://webaim.org/projects/million/) data shows pages *with* ARIA average *more* detectable errors. ARIA is sharp.
- **`aria-hidden="true"` on a focusable element = a trap.** The user tabs to something the screen reader says nothing about. Never put it on or around interactive content.
- **Redundant roles override native semantics.** `<ul role="list">` is fine, but `role="menu"` on a nav's `<ul>` invokes the full menu keyboard model you then must implement — an accidental role can demand behaviour you didn't build.
- **`aria-expanded` absent ≠ `false`.** Absent means "not expandable"; `false` means "expandable, currently closed". Screen readers announce them differently.
- **IDREF links fail silently.** `aria-labelledby="ttl"` with no `#ttl` (or a duplicated id) just produces no name — no console error.
- **`disabled` blocks events; `aria-disabled` does not.** Forgetting to guard the click on an `aria-disabled` control ships a "disabled" button that still fires.

## 🎯 Say this in the interview

> "ARIA is a vocabulary for editing the accessibility tree — roles say what a thing is, states and properties say what condition it's in — and the critical point is that it changes semantics and nothing else. It adds no focus, no tab order, no keyboard behaviour, so `role=\"button\"` on a div is a promise I still have to implement entirely in JS. That's why the first rule of ARIA is don't use ARIA: if a native element exists, it already keeps all those promises for free. When I do build custom, I start from the closest native element — a `<button>` for a switch, so focus and Space come for free — and then I keep the ARIA in sync on every state change, because a stale `aria-checked` actively lies to the screen reader, and no ARIA is better than wrong ARIA. The distinctions I watch: `aria-disabled` stays focusable and clickable while native `disabled` doesn't, and `aria-expanded` being absent means not-expandable, which is different from false."

## 🔗 Go deeper

- [MDN — ARIA](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA) — roles, states, properties, and the "use it sparingly" framing.
- [W3C — Using ARIA (the five rules)](https://www.w3.org/TR/using-aria/) — the normative guidance, including "no ARIA is better than bad ARIA".
- [W3C — ARIA in HTML](https://www.w3.org/TR/html-aria/) — which roles/attributes are allowed on which native elements.
- [WebAIM — The WebAIM Million](https://webaim.org/projects/million/) — real data on how ARIA correlates with *more* errors when misused.
- [MDN — ARIA states and properties reference](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes) — the full attribute list with value grammars.
