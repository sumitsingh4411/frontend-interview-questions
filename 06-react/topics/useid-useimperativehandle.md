<div align="center">

# `useId`, `useImperativeHandle`

<sub>⚛️ React · 🟡 Medium · ⏱ 30m · `#hooks`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Two unrelated escape hatches. `useId` generates an ID that's **identical on server and client** so SSR'd `label`/`aria-*` links don't cause hydration mismatches — it is *not* a key generator. `useImperativeHandle` lets a component hand its parent a **curated method API** (`{ focus, scrollTo }`) instead of the raw DOM node, keeping the imperative escape hatch narrow.

---

## 🧠 Mental model

Both exist to solve a specific correctness problem, not to be reached for casually.

**`useId`** answers: "how do I generate a unique `id` that survives SSR?" A counter or `Math.random()` produces one value on the server and a *different* one on the client, so hydration sees mismatched `htmlFor`/`aria-describedby` attributes. `useId` derives the ID from the component's **position in the React tree**, so it's deterministic across both environments.

**`useImperativeHandle`** answers: "my parent needs to *do* something to my component — focus it, play it, scroll it — but I don't want to expose the whole DOM node." It replaces what `ref.current` points at with an object you define. The escape hatch stays as small as the two or three methods you actually expose.

## ⚙️ How it actually works

`useId` walks the tree during render; each call gets an ID built from its parent's tree path plus a local counter, producing tokens like `:r0:`, `:r1:`. Because the algorithm is identical on server and client, the strings match on hydration. The `:` delimiters are **deliberately invalid** in CSS selectors so you can't accidentally `querySelector` them. One call can seed several related IDs by suffixing:

```jsx
const id = useId();
<label htmlFor={`${id}-email`}>Email</label>
<input id={`${id}-email`} aria-describedby={`${id}-hint`} />
<p id={`${id}-hint`}>We never share it.</p>
```

`useImperativeHandle(ref, createHandle, deps)` runs during **commit** (like a ref callback). `createHandle` returns the object that becomes `ref.current`; `deps` control when it's rebuilt. In React ≤18 the component must be wrapped in `forwardRef` to receive `ref`; in **React 19, `ref` is a regular prop**, so `forwardRef` is largely obsolete — you read `ref` straight from props.

## 💻 Code

```jsx
// React 19: ref is a plain prop. Expose a narrow API, not the <input>.
function FancyInput({ ref, ...props }) {
  const inputRef = useRef(null);
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; },
    // NOTE: no raw node leaked — parent can't restyle or remove it
  }), []);
  return <input ref={inputRef} {...props} />;
}

// Parent drives it imperatively, but only through the curated surface.
function Form() {
  const api = useRef(null);
  return (
    <>
      <FancyInput ref={api} />
      <button onClick={() => api.current.focus()}>Focus</button>
    </>
  );
}
```

```jsx
// ❌ useId is NOT for list keys — it identifies a component instance, not a data row.
{items.map(() => <li key={useId()}>…</li>)}   // wrong AND breaks Rules of Hooks
// ✅ keys come from stable data identity:
{items.map((it) => <li key={it.id}>{it.name}</li>)}
```

## ⚖️ Trade-offs

- **`useId` is for accessibility/form wiring, full stop.** Linking labels, `aria-describedby`, `aria-labelledby`, `<use href>`. It's overkill for anything that never renders to an attribute.
- **`useImperativeHandle` is a controlled leak.** It's better than forwarding the raw node because the parent can only call what you allow — but every imperative method is still API surface you now maintain. Prefer props/state; use the handle only for genuinely imperative actions (focus, scroll, media play/pause, animations).
- **Empty `deps` freezes the handle.** `[]` builds it once. If the methods close over props/state, they go stale — list the deps or read live values through a ref.

## 💣 Gotchas interviewers probe

- **`useId` is not a key or a unique-per-item ID.** It's stable *per component instance*, so every row rendered by the same component would share it. Keys come from data.
- **Don't call `useId` in a loop or condition.** It's a hook — same Rules of Hooks as the rest. One call per component, suffix for multiples.
- **`crypto.randomUUID()` for a rendered `id` breaks SSR.** Different value server vs client → hydration mismatch. That's the exact problem `useId` was built to kill.
- **`useImperativeHandle` without `forwardRef` (React ≤18) silently does nothing** — the component never receives `ref`. In React 19 you read `ref` from props instead.
- **The handle runs at commit, not render.** Don't expect `ref.current` to be populated during the parent's render pass — it's set after the child commits.
- **Reaching for imperative handles often means fighting React.** If you find yourself exposing setters, that state probably belongs lifted up as props.

## 🎯 Say this in the interview

> "They're two different escape hatches. `useId` gives me an ID that's identical on the server and client, which matters because anything random or counter-based produces a different value on each and breaks hydration on `htmlFor` or `aria-describedby`. It derives the ID from the component's position in the tree, so it's deterministic — and I'm careful that it's for accessibility wiring, not list keys, since keys come from data identity. `useImperativeHandle` lets a child expose a curated API to its parent's ref — like `{ focus, scrollIntoView }` — instead of leaking the raw DOM node, which keeps the imperative surface narrow. In React 19 I just take `ref` as a normal prop; pre-19 I'd wrap it in `forwardRef`. And I treat it as a last resort — if I'm exposing setters, the state usually wants to be lifted instead."

## 🔗 Go deeper

- [react.dev — `useId`](https://react.dev/reference/react/useId) — why it exists, and the "not for keys" warning.
- [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) — the curated-API pattern and commit-phase timing.
- [react.dev — `ref` as a prop (React 19)](https://react.dev/blog/2024/12/05/react-19#ref-as-a-prop) — how `forwardRef` becomes optional.
