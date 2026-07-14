<div align="center">

# Controlled vs uncontrolled inputs

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#forms`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A **controlled** input's value is owned by React state (`value` + `onChange`), so React is the single source of truth on every keystroke. An **uncontrolled** input lets the **DOM** own its value (`defaultValue` + a `ref` to read it later). The one thing you must never do is switch a field from one to the other mid-life.

---

## 🧠 Mental model

Every input has a value living *somewhere*. The only question is: **does React own it, or does the DOM own it?**

| | Controlled | Uncontrolled |
|---|---|---|
| Source of truth | React state | The DOM node |
| Set initial value | `value={state}` | `defaultValue="…"` |
| Read current value | it's already in state | `ref.current.value` |
| Re-render per keystroke | yes | no |
| Validate/format live | trivial | awkward |

Controlled means a **round trip on every keystroke**: keypress → `onChange` → `setState` → re-render → React writes `value` back to the DOM. The DOM never diverges from state because React overwrites it. Uncontrolled means the browser just does its native thing and you *ask* for the value when you need it (usually on submit).

The senior framing: **controlled is a two-way binding you implement by hand.** React deliberately has no `v-model`; you wire the loop yourself, which is more code but total control — every character passes through your code before it's displayed.

## ⚙️ How it actually works

**A controlled input is pinned.** Passing `value={x}` means React sets the DOM `.value` to `x` after every render. If your `onChange` doesn't update the state that feeds `value`, the input appears *frozen* — you type and nothing shows, because React keeps resetting it to the old state. That's the #1 controlled-input bug.

**`defaultValue` seeds once.** React writes it to the DOM on mount and then never touches it again — the browser owns it from there. Using `value` without `onChange` gives you a *read-only* controlled input and a console warning; using `defaultValue` is the correct way to say "set the start value, then leave it to the DOM."

**Controlled → uncontrolled switching warns loudly.** If `value` is `undefined` on first render (e.g. data hasn't loaded) and a string later, React sees the field flip from uncontrolled to controlled and warns. Fix: default the value — `value={name ?? ""}` — so it's controlled from the very first render.

**Some inputs are always ref-based.** `<input type="file">` is *inherently uncontrolled* — its value is read-only for security, so you always read it via a ref. Checkboxes use `checked`/`defaultChecked`, not `value`.

## 💻 Code

```jsx
// ✅ Controlled — React owns the value. Live validation/formatting is trivial.
function Controlled() {
  const [email, setEmail] = useState("");
  return (
    <input
      value={email}
      onChange={(e) => setEmail(e.target.value.trim())} // transform every keystroke
    />
  );
}
```

```jsx
// ✅ Uncontrolled — the DOM owns the value; read it on submit. No re-render per key.
function Uncontrolled() {
  const inputRef = useRef(null);
  function onSubmit(e) {
    e.preventDefault();
    console.log(inputRef.current.value); // ask the DOM for the current value
  }
  return (
    <form onSubmit={onSubmit}>
      <input defaultValue="" ref={inputRef} />
      <input type="file" ref={fileRef} />  {/* files are ALWAYS uncontrolled */}
    </form>
  );
}
```

```jsx
// ❌ The classic freeze: value bound, but onChange forgets to update it.
<input value={email} onChange={(e) => e.target.value} /> // typing does nothing

// ❌ Undefined → string flip: warns "changing an uncontrolled input to controlled".
<input value={user?.name} onChange={...} />
// ✅ Default it so it's controlled from render #1.
<input value={user?.name ?? ""} onChange={...} />
```

## ⚖️ Trade-offs

- **Reach for uncontrolled when you don't need the value until submit** — big forms, file inputs, integrating a non-React widget. It skips a re-render per keystroke and is less code. React Hook Form is popular precisely because it's uncontrolled-by-default and re-renders far less.
- **Reach for controlled when the value drives the UI live** — instant validation, input masking/formatting, disabling submit until valid, syncing two fields, or when the value must round-trip through a reducer/store.
- **Controlled forms and per-keystroke re-renders scale badly** in one giant component — every character re-renders the whole form. Split fields into their own components, colocate state, or move to an uncontrolled form lib before you memoise your way out.

## 💣 Gotchas interviewers probe

- **"Why is my controlled input frozen?"** Because `value` is set but `onChange` doesn't update the state behind it, so React keeps re-writing the old value. This is *the* question in this area.
- **`value` requires `onChange`** (or `readOnly`). `value` alone is a read-only field and warns. `defaultValue` is the uncontrolled equivalent that seeds once.
- **Never switch a field controlled ↔ uncontrolled.** The trigger is usually an initially-`undefined` value becoming defined — default it with `?? ""`.
- **`type="file"` can't be controlled** — its value is read-only by spec; always use a ref.
- **Checkbox/radio use `checked`/`defaultChecked`**, not `value`. Mixing them up gives a field that won't toggle.
- **Number inputs still yield strings** — `e.target.value` is a string even for `type="number"`; the DOM doesn't coerce for you.
- **Cursor jumps** happen when you reformat the value in `onChange` (e.g. inserting commas) — you must also manage `selectionStart`, or the caret leaps to the end.

## 🎯 Say this in the interview

> "The distinction is who owns the value. Controlled means React state owns it — I pass `value` and `onChange`, so every keystroke round-trips through my code before it's shown, which makes live validation and formatting trivial but re-renders on every character. Uncontrolled means the DOM owns it — I set `defaultValue` and read `ref.current.value` when I need it, usually on submit, so there's no re-render per keystroke. I default to controlled when the value drives the UI live, and uncontrolled for large forms, file inputs, or wrapping non-React widgets. The bug I watch for is a frozen input — `value` bound but `onChange` not updating the state — and the warning about switching from uncontrolled to controlled, which I prevent by defaulting the value with `?? \"\"` so it's controlled from the first render."

## 🔗 Go deeper

- [react.dev — `<input>`](https://react.dev/reference/react-dom/components/input) — controlled vs uncontrolled semantics, straight from the reference.
- [react.dev — Reacting to input with state](https://react.dev/learn/reacting-to-input-with-state) — the controlled mindset.
- [react.dev — Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs) — reading uncontrolled values.
- [React Hook Form — why uncontrolled](https://react-hook-form.com/faqs) — the performance case for uncontrolled forms.
