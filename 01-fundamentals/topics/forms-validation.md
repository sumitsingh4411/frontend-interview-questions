<div align="center">

# Forms & validation

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#forms`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The platform already gives you validation, accessible error announcement, keyboard submit, and autofill — **for free**, via native form semantics and the Constraint Validation API. Client-side validation is a **UX affordance, never a security control**: the server must re-validate everything, because anyone can `curl` your endpoint.

---

## 🧠 Mental model

Two ideas do most of the work here:

1. **A form is a semantic unit, not a styling wrapper.** Wrapping inputs in `<form>` buys you: Enter-to-submit, autofill/password-manager integration, `required`/`type` validation, reset, and a single `submit` event. React devs who bind every field to `onChange` and hang a `<div onClick>` off the button throw all of that away and then rebuild half of it by hand.

2. **Validation is a two-sided contract.** Client-side validation exists to give *fast, kind feedback*. Server-side validation exists because **the client is hostile** — DevTools can delete `required`, and the endpoint can be called directly. If you only say "I'd use `required` and a regex," you have failed the question.

## ⚙️ How it actually works

**Native constraints** — declarative, free, and accessible:

```html
<form novalidate>  <!-- suppress the browser's bubbles, keep the VALIDITY API -->
  <label for="email">Email</label>
  <input id="email" name="email" type="email" required
         aria-describedby="email-err" aria-invalid="false" />
  <p id="email-err" role="alert"></p>
</form>
```

`novalidate` is the key pro move: it turns off the browser's ugly, unstyleable native bubbles **while keeping the entire Constraint Validation API working**, so you keep the logic and own the presentation.

**The Constraint Validation API:**

```js
input.validity        // ValidityState: { valueMissing, typeMismatch, patternMismatch,
                      //   tooShort, tooLong, rangeUnderflow, stepMismatch, customError… }
input.checkValidity() // → boolean
input.reportValidity()// → boolean + shows the native UI
input.setCustomValidity('That email is already taken'); // '' clears it
form.elements.email   // named access to controls
new FormData(form)    // → the payload, respecting name attributes
```

`setCustomValidity` is how you plug *server* errors ("email already registered") into the *native* validity system, so `form.checkValidity()` stays the single source of truth.

## 💻 Code

Accessible, progressively-enhanced validation:

```js
form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!form.checkValidity()) return showErrors();
  submit(new FormData(form)); // FormData handles files + encoding for you
});

function showErrors() {
  for (const el of form.elements) {
    if (!el.name) continue;
    const err = document.getElementById(`${el.id}-err`);
    const invalid = !el.checkValidity();

    el.setAttribute('aria-invalid', String(invalid)); // announce state
    if (err) err.textContent = invalid ? message(el) : '';
  }
  // Move focus to the first problem — do not make a screen-reader user hunt.
  form.querySelector('[aria-invalid="true"]')?.focus();
}

const message = (el) =>
  el.validity.valueMissing ? 'This field is required'
  : el.validity.typeMismatch ? 'Enter a valid email'
  : el.validity.tooShort ? `At least ${el.minLength} characters`
  : 'Please check this field';
```

Three things make that snippet senior-grade: `aria-invalid` (state), `role="alert"` on the error node (it gets **announced** on change), and **moving focus to the first invalid field**.

**Validate at the right moment** — this is pure UX judgement:

> Validate on **blur**, re-validate on **input** *only once the field is already invalid*, and always on **submit**.

Validating on every keystroke from the start means you scream "invalid email!" at someone who has typed `s`. That is the most common validation UX bug in production.

## ⚖️ Trade-offs

- **Native constraints vs a schema library (Zod/Yup).** Native is free, accessible and progressive, but it can't express "confirm password matches" or "end date after start date". Real apps use both: native for field-level, a schema for cross-field and for **sharing the exact same rules with the server**.
- **Controlled vs uncontrolled inputs.** Controlled gives you instant derived UI at the cost of a re-render per keystroke. Uncontrolled (React Hook Form, or plain `FormData`) is dramatically faster on big forms because typing doesn't re-render — and it's closer to the platform.
- **`novalidate` shifts work to you.** You gain full control of the error UI; you owe the announcement and focus management the browser was doing.

## 💣 Gotchas interviewers probe

- **"Is client-side validation enough?"** — **Never.** It's a UX nicety. The server re-validates, full stop. Say this unprompted; it's the answer they're listening for.
- **A `<button>` inside a `<form>` defaults to `type="submit"`.** The #1 accidental-page-reload bug. Always `type="button"` for non-submit buttons.
- **Disabled inputs are not submitted.** Their values are omitted from `FormData` entirely. Use `readonly` if you need the value sent.
- **Inputs need a `name` to be submitted** — `id` is for labels, `name` is for the payload. React devs forget this constantly.
- **`type="number"` is a trap** for things like phone numbers and OTPs — it permits `e`, `+`, `-`, and scroll-wheel mutation. Use `inputmode="numeric"` + `pattern` instead.
- **A `<label>` must be associated**, via `for`/`id` or by wrapping. An unassociated label is a visual decoration that no screen reader will connect to the field — and it also kills the click-to-focus behaviour.
- **`role="alert"` announces on content change**, so the element must exist in the DOM *before* you fill it. Inserting a fresh error node may not announce.
- **Client regex for emails is a losing game.** `type="email"` is good enough; real verification is sending an email.

## 🎯 Say this in the interview

> "I'd start from the platform: a real `<form>` element, proper `label`/`for` associations, `name` attributes, and native constraints like `required` and `type=email`. That gets me Enter-to-submit, autofill, and validation for free. Then I add `novalidate` — which is the trick people miss: it kills the browser's unstyleable bubbles but keeps the whole Constraint Validation API, so I still get `validity.valueMissing`, `checkValidity()` and `setCustomValidity()` while owning the visual design. For accessibility, each field gets `aria-invalid` and an `aria-describedby` error node with `role=alert` so it's announced, and on failed submit I move focus to the first invalid field. On timing, I validate on blur and only re-validate on input once a field is *already* invalid, so I'm not yelling at someone who's typed one character. And critically — client-side validation is purely UX. The server must re-validate everything, because `required` is one DevTools click away from being deleted."

## 🔗 Go deeper

- [web.dev — Learn Forms](https://web.dev/learn/forms) — the best modern course on forms, end to end.
- [MDN — Client-side form validation](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation) — the Constraint Validation API in full.
- [MDN — The FormData API](https://developer.mozilla.org/en-US/docs/Web/API/FormData) — payloads, files, encoding.
- [React Hook Form](https://react-hook-form.com/) — the uncontrolled, performance-first approach in React.
