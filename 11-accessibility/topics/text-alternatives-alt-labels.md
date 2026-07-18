<div align="center">

# Text alternatives (alt, labels)

<sub>♿ Accessibility · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every non-text thing that carries meaning needs a text equivalent, and every control needs an accessible name. `alt` conveys an image's *purpose in context* (and is deliberately **empty** for decoration); a `<label>` gives an input a name. Missing or wrong text alternatives are the single most common — and most consequential — a11y bug.

---

## 🧠 Mental model

The accessibility tree needs a **name** for anything meaningful — that's the "N" in role/name/state. `alt` and `<label>` are just two ways of supplying that name for the two most common cases: images and form controls. The framing that gets it right every time is: **describe the *function*, not the *appearance*.**

- The alt for a company logo that links home isn't "blue swoosh logo" — it's what it *does*: "Acme, home".
- The alt for a magnifying-glass icon inside a search button isn't "magnifying glass" — the button's job is "Search".
- A chart's alt isn't "bar chart" — it's the takeaway: "Revenue up 12% in Q3."

And the counter-intuitive half: **decorative images must have `alt=""`** (empty, not missing). Empty alt tells the screen reader "skip this, it adds nothing"; *omitting* alt makes many readers announce the filename — "image, hero-2-final-v3-dot-jpg". Empty alt is a decision you're stating, not an absence.

## ⚙️ How it actually works

`alt` is the name source for `<img>`. But the accessible name for a *control* is computed by the **accname algorithm**, and its priority order is what interviewers probe:

**`aria-labelledby` → `aria-label` → native (`<label>` / `alt` / `<legend>`) → `title`.**

Higher wins and stops the walk. This is why `aria-label` on a button *replaces* its visible text, and why a `<label>` and an `aria-label` on the same input don't concatenate — the `aria-label` silently wins.

For form controls specifically, there are exactly three correct ways to attach a name, and one that's a trap:

```html
<label for="q">Search</label> <input id="q">   <!-- ✅ explicit: for/id, most robust -->
<label>Search <input></label>                   <!-- ✅ implicit: wraps the control -->
<input aria-label="Search">                      <!-- ✅ when a visible label truly can't exist -->
<input placeholder="Search">                     <!-- ❌ placeholder is NOT a label -->
```

A placeholder isn't a name: it disappears on input, fails contrast, and isn't reliably in the accessible name. Interviewers use "is placeholder a label?" as a quick filter — the answer is no.

Two more real cases:

- **`aria-labelledby`** points at *existing visible text* by id (and can reference several ids, which concatenate) — the best option because the visible and accessible names stay in sync, and it helps voice-control users.
- **`aria-describedby`** supplies a *description* (hint, error text, format rule) — read *after* the name, not instead of it. Name says *what it is*; description says *more about it*.

Complex images (charts, diagrams) need more than alt: a short alt for the gist plus a longer description nearby (`aria-describedby`, a caption, or adjacent prose / a data table for the real content).

## 💻 Code

```html
<!-- Images: the alt depends on ROLE, not on the file. -->
<img src="logo.svg" alt="Acme, home">                <!-- functional (a link) -->
<img src="chart.png" alt="Revenue up 12% in Q3">     <!-- informative: the takeaway -->
<img src="divider.svg" alt="">                        <!-- decorative: explicitly empty -->

<!-- Icon-only button: the ICON is decorative, the BUTTON carries the name. -->
<button>
  <svg aria-hidden="true">…</svg>          <!-- hide the icon from the tree -->
  <span class="sr-only">Delete</span>      <!-- name the control -->
</button>

<!-- Inputs: label + description do different jobs. -->
<label for="pw">Password</label>
<input id="pw" type="password" aria-describedby="pw-hint">
<p id="pw-hint">At least 12 characters.</p>   <!-- read after the name -->
```

The classic overrides that break silently:

```html
<!-- ❌ Announced "Settings" — visible "Preferences" is discarded,
     and voice users saying "click Preferences" get nothing. -->
<button aria-label="Settings">Preferences</button>

<!-- ✅ Keep visible text as the name; describe extra via aria-describedby. -->
<button aria-describedby="s-hint">Preferences</button>
```

## ⚖️ Trade-offs

- **`aria-label` is tempting and overused.** It's invisible, so it drifts out of sync with the UI, isn't translated by some tooling, and overrides content. Prefer a real `<label>` or `aria-labelledby` to *visible* text; reserve `aria-label` for controls that genuinely have no visible text (an icon-only close button).
- **Empty alt vs no alt is a real decision, not a shortcut.** `alt=""` is correct *only* when the image is truly decorative and its meaning is available elsewhere. If in doubt whether it carries info, it probably does — describe it.
- **Don't over-describe.** Alt like "image of a photo showing a man who is smiling while holding…" is worse than a tight phrase. Screen-reader users pay for every word in time. Also: don't start alt with "image of" — the role already says "image".

## 💣 Gotchas interviewers probe

- **"Is a placeholder a label?"** No. It's low-contrast, vanishes on typing, and isn't a reliable accessible name. Using it as the only label fails 3.3.2 and 4.1.2.
- **Decorative images need `alt=""`, not a missing attribute.** Missing alt → filename announced. This is the most common quick-check.
- **The accname priority order** — `aria-labelledby` > `aria-label` > `<label>`/`alt` > `title`. `title` alone is the weakest and unreliable (no touch, no keyboard-only exposure).
- **Icon-only buttons are the top offender.** An `<svg>` with no name gives a button named "" — announced as just "button". Hide the icon (`aria-hidden`) and name the button.
- **`aria-describedby` ≠ label.** It's supplementary and read *after* the name; it can't be the control's only name.
- **Alt describes context, not pixels.** The *same* image is `alt=""` as decoration, "Acme, home" as a link, and "Revenue up 12%" as data. There's no single "correct alt" for a file.

## 🎯 Say this in the interview

> "A text alternative supplies the *name* in the accessibility tree, and the rule that keeps me right is: describe the function, not the appearance. A logo that links home is `alt=\"Acme, home\"`, an informative chart's alt is its takeaway, and a purely decorative image gets an explicitly empty `alt`, because empty alt means 'skip me' whereas a *missing* alt makes readers announce the filename. For controls, the name comes from the accname algorithm — `aria-labelledby`, then `aria-label`, then a native `<label>` or alt, then title — and higher sources override, which is exactly why `aria-label` silently replaces visible button text and can break voice control. So I prefer a real visible `<label>` or `aria-labelledby`, and I never use a placeholder as a label because it fails contrast and disappears. The icon-only button is where I'm most careful: hide the SVG with `aria-hidden` and give the button a name with visually-hidden text."

## 🔗 Go deeper

- [web.dev — Images and text alternatives](https://web.dev/learn/accessibility/images) — the decision tree for informative/decorative/functional alt.
- [W3C WAI — An alt Decision Tree](https://www.w3.org/WAI/tutorials/images/decision-tree/) — flowchart for exactly what alt to write.
- [MDN — Labels and text alternatives / accessible name](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Text_labels_and_names) — the accname sources and priority.
- [MDN — `<label>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/label) — explicit vs implicit association, and why placeholders don't count.
