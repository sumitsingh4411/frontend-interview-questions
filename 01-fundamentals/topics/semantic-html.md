<div align="center">

# Semantic HTML

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 30m · `#html` `#a11y` `#seo`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Semantic HTML means choosing elements for **what they mean**, not how they look. The payoff is not tidiness: the right element ships you keyboard behaviour, focus management, an accessibility role, and browser defaults **for free** — all of which you must otherwise reimplement, badly, in JavaScript.

---

## 🧠 Mental model

Every HTML element is a **contract with the browser**. `<button>` is not "a div that looks pressable" — it is a promise that this thing is focusable, activates on both `Enter` and `Space`, fires a click on activation, is exposed to assistive tech as `role=button`, and participates in form submission.

When you write `<div onclick>`, you have not "kept it simple". You have **silently opted out of that entire contract**, and now you owe the browser: `tabindex="0"`, an `Enter` handler, a `Space` handler (with `preventDefault` to stop page scroll), `role="button"`, `aria-disabled` handling, and focus-visible styling. Almost nobody pays that debt in full.

**The rule:** reach for a `div` only when no element carries the meaning you need. `div`/`span` are the *absence* of semantics — that is their entire job.

## ⚙️ How it actually works

Semantics feed the **accessibility tree**, a parallel tree the browser derives from the DOM and hands to screen readers, switch devices, and voice control. Each node gets:

- a **role** (`button`, `navigation`, `heading`, `listitem`…),
- an **accessible name** (from content, `aria-label`, `<label>`, `alt`…),
- a **state** (`expanded`, `checked`, `disabled`…).

Native elements populate all three automatically. `<div>` contributes a `generic` node with no name and no state — invisible in any meaningful sense.

Landmarks (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`) matter enormously because screen-reader users **navigate by landmark and by heading**, not by reading top to bottom. A page of `div`s has no navigable structure at all: it is one undifferentiated blob.

## 💻 Code

The classic failure, and its cost:

```html
<!-- ❌ Looks identical. Is functionally broken. -->
<div class="btn" onclick="save()">Save</div>

<!-- To make the div actually equivalent, you owe ALL of this: -->
<div class="btn" role="button" tabindex="0"
     onclick="save()"
     onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();save();}">
  Save
</div>

<!-- ✅ Or just use the element that already does all of it. -->
<button type="button" onclick="save()">Save</button>
```

Structure that a screen reader can actually navigate:

```html
<header><nav aria-label="Primary"><!-- … --></nav></header>
<main>
  <h1>Interview prep</h1>
  <section aria-labelledby="banks">
    <h2 id="banks">Question banks</h2>
    <ul>
      <li><a href="/banks/css/">CSS</a></li>
    </ul>
  </section>
</main>
<footer><!-- … --></footer>
```

> Note `type="button"`. A `<button>` inside a `<form>` defaults to `type="submit"` — one of the most common accidental-form-submission bugs in React codebases.

## ⚖️ Trade-offs

- **Native elements are harder to style.** This is the one real cost, and it is why design systems reinvent `<select>`. The honest trade is: a custom listbox is *legitimate* — but you must then implement the full [ARIA combobox pattern](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/), and you will get it wrong at least twice.
- **ARIA is a patch, not an upgrade.** The first rule of ARIA is *don't use ARIA* — if a native element exists, use it. `<div role="button">` is strictly worse than `<button>`; it is the same semantics with none of the behaviour.
- **Over-sectioning is real.** Wrapping everything in `<section>` without an accessible name produces a wall of meaningless "region" landmarks that make navigation *worse*.

## 💣 Gotchas interviewers probe

- **`<section>` without an accessible name is just a `<div>`.** It only becomes a `region` landmark when it has `aria-labelledby` or `aria-label`. Most people don't know this.
- **`<b>`/`<i>` vs `<strong>`/`<em>`:** the former are purely presentational; the latter carry importance/emphasis and *can* change screen-reader inflection. Not interchangeable.
- **Heading levels are structure, not size.** Skipping `h1 → h3` breaks the outline. Never pick a heading for its font-size — that is what CSS is for.
- **`alt=""` is not a bug — it is a decision.** An empty `alt` on a decorative image correctly *hides* it from assistive tech. Omitting `alt` entirely is the bug: screen readers then fall back to reading the filename.
- **`<div onclick>` isn't reachable by keyboard at all** — no `tabindex`, no focus, no activation. It is invisible to a keyboard-only user.
- **Semantics help SEO, but that's the smaller prize.** Lead with accessibility and free behaviour; mention SEO second.

## 🎯 Say this in the interview

> "I treat each element as a contract with the browser. A `<button>` gives me focusability, Enter *and* Space activation, a `button` role in the accessibility tree, and form participation — all free. The moment I write `<div onclick>` I've opted out of that contract and I now owe `tabindex`, two key handlers, a role, and focus styles, which teams almost never fully pay. So my rule is: use the element that already means the thing, and drop to a `div` only when nothing carries that meaning. That's also why the first rule of ARIA is don't use ARIA — `<div role=button>` gives you the semantics with none of the behaviour, which is the worst of both."

## 🔗 Go deeper

- [web.dev — Learn HTML](https://web.dev/learn/html) — modern and semantics-first.
- [MDN — HTML element reference](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) — what each element actually *means*.
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — the correct patterns when you genuinely must build custom.
- [The A11y Project — checklist](https://www.a11yproject.com/checklist/) — ship-against-able.
