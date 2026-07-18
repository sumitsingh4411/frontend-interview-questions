<div align="center">

# Accessible forms

<sub>♿ Accessibility · 🟡 Medium · ⏱ 1h · `#forms`</sub>

<a href="../README.md">⬅ Accessibility</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Accessible forms are 90% **correct semantics**: a real `<label>` bound to every control, native inputs so state and keyboard come free, errors linked with `aria-describedby` and flagged with `aria-invalid`, related controls grouped in `<fieldset>`/`<legend>`, and errors **announced and focused** — not signalled by red colour alone.

---

## 🧠 Mental model

A form is a conversation, and for a screen-reader user the whole conversation happens through the **accessible name and state** of each control. When focus lands on an input, the screen reader reads its *name* (from the label), its *role* ("edit text", "checkbox"), its *state* ("required", "invalid"), and any *description* (hint or error). If any of those aren't wired into the accessibility tree, that part of the conversation is simply missing — the user reaches a field that announces "edit text" with no idea what to type.

So the mental model is: every control needs a programmatic **name**, its constraints need to be **exposed** (not just visually implied), and when something goes wrong the error has to be **connected to the field** and **actively surfaced**. Get the semantics right and native HTML delivers most of this for free; reach for ARIA only to bridge what HTML can't express (linking an error, marking invalidity).

## ⚙️ How it actually works

**Labels.** A `<label>` associates via `for="id"` matching the input's `id`, or by wrapping the input. Association does two things: it computes the accessible name *and* enlarges the click/tap target to include the label text. `placeholder` is **not** a label — it's grey, low-contrast, and vanishes on input, so the user loses the field's name the moment they start typing. An icon-only or visually-labelled-by-layout field still needs a real label (visually hidden if the design demands).

**Constraints, exposed.** `required` (or `aria-required`) tells AT the field is mandatory. `type="email"`, `type="tel"`, `inputmode`, and `autocomplete` tokens (`autocomplete="email"`, `"current-password"`) let browsers autofill and mobile keyboards adapt — a huge usability win, especially for motor and cognitive accessibility.

**Grouping.** Radio buttons and related checkboxes need a group name: wrap them in `<fieldset>` with a `<legend>`. Without it, a screen reader reads each radio's own label but never the *question* — the user hears "Standard", "Express" with no idea it's about shipping.

**Errors — the hard part, done right:**

- Link the error text to the field with **`aria-describedby="err-id"`** so it's read as part of the field's description.
- Mark the field **`aria-invalid="true"`** so its state announces as invalid.
- **Move focus** to the first invalid field on submit — or announce a summary via a live region — so the error isn't a silent red border the user never discovers.
- Never signal errors by **colour alone** (WCAG 1.4.1): pair red with an icon and text.

## 💻 Code

```html
<!-- ❌ Placeholder-as-label: name disappears on input, poor contrast,
     and screen readers may not treat it as the accessible name. -->
<input type="email" placeholder="Email" />

<!-- ✅ Real label (name + bigger target), typed input, autofill, required. -->
<label for="email">Email</label>
<input id="email" type="email" name="email"
       autocomplete="email" required
       aria-describedby="email-hint email-err" aria-invalid="false" />
<p id="email-hint">We'll only use this to send your receipt.</p>
<p id="email-err" hidden>Enter a valid email like name@example.com.</p>
```

```html
<!-- Grouped choices: the legend gives the whole set its question. -->
<fieldset>
  <legend>Shipping speed</legend>
  <label><input type="radio" name="ship" value="std"> Standard</label>
  <label><input type="radio" name="ship" value="exp"> Express</label>
</fieldset>
```

```js
// On invalid submit: expose state, link the error, and MOVE FOCUS
// so the user actually encounters it — not just a red outline.
function showError(input, errEl, msg) {
  errEl.textContent = msg;
  errEl.hidden = false;
  input.setAttribute('aria-invalid', 'true');
  input.setAttribute('aria-describedby', errEl.id); // read as the field's description
  input.focus();                                    // land the user on the problem
}
```

## ⚖️ Trade-offs

- **Native validation vs custom.** The browser's built-in `required`/`type` validation is accessible and free, but its bubble UI is inconsistent and unstyleable across engines. Most design systems disable it (`novalidate`) and build custom messaging — which is fine *only if* you re-implement the accessibility (describedby, invalid, focus) the native version gave you.
- **Inline vs on-submit validation.** Validating on `blur`/inline is friendly but can announce errors mid-typing and fight the user; validating on submit is predictable but late. A common answer: validate on submit, then re-validate on `input` once a field has already errored — least noisy.
- **When NOT to over-ARIA:** don't slap `role="textbox"` or `aria-label` on native inputs that already have a `<label>`. A `<label for>` beats `aria-label` because it also grows the click target and shows visibly — reserve `aria-label` for when no visible text exists.

## 💣 Gotchas interviewers probe

- **Placeholder is not a label.** Stating this, and *why* (disappears on input, fails contrast, unreliable as the accessible name), is a reliable senior signal.
- **Errors must be linked and announced, not just coloured.** `aria-describedby` + `aria-invalid` + focus/live-region. A red border alone fails colour-blind and screen-reader users both (WCAG 1.4.1).
- **Radio/checkbox groups need `<fieldset>`/`<legend>`** — otherwise the group's question is never announced. Very commonly missed.
- **`aria-describedby` can reference multiple IDs** (`"hint err"`) — hint *and* error read together; the order matters.
- **`<label>` must point to a real form control.** `for` referencing a `<div>` does nothing; wrapping non-inputs doesn't create an association.
- **`autocomplete` tokens are an accessibility feature** (WCAG 1.3.5 Identify Input Purpose), not just convenience — they help users with cognitive and motor disabilities most.
- **Disabling submit until valid** hides *why* it's disabled from screen-reader users — prefer an always-enabled button that surfaces errors on click.
- **Required indicated only by a red asterisk** is inaccessible unless the asterisk is explained and the field is programmatically `required`.

## 🎯 Say this in the interview

> "I build forms semantics-first, because native HTML gives me most of accessibility for free. Every control gets a real `<label>` bound with `for`/`id` — not a placeholder, which disappears on input and isn't a reliable accessible name — and that also enlarges the tap target. I use typed inputs and `autocomplete` tokens so autofill and mobile keyboards adapt, which is itself an accessibility win, and I group radios and related checkboxes in a `<fieldset>` with a `<legend>` so the screen reader announces the actual question, not just each option. Errors are where teams slip: I link the message to the field with `aria-describedby`, set `aria-invalid`, and move focus to the first invalid field on submit — or announce a summary in a live region — so it's discovered, never signalled by red colour alone. If I disable native validation for styling, I re-implement all of that; I don't get it back for free."

## 🔗 Go deeper

- [web.dev — Learn Forms](https://web.dev/learn/forms) — the full course: labels, validation, autofill, accessibility.
- [MDN — Accessible forms](https://developer.mozilla.org/en-US/docs/Learn/Accessibility/HTML#accessible_forms) — labels, fieldsets, and error handling.
- [WCAG — 3.3.1 Error Identification](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) — the requirement behind linked, announced errors.
- [WebAIM — Creating Accessible Forms](https://webaim.org/techniques/forms/) — the practical reference, including required-field patterns.
