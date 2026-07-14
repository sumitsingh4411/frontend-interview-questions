<div align="center">

# Refs & `forwardRef`

<sub>⚛️ React · 🟡 Medium · ⏱ 30m · `#patterns`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A ref is an **escape hatch to imperative DOM/instance access** that persists across renders without triggering one; `forwardRef` used to be required to pass a ref *through* your component to a child DOM node — but in **React 19 `ref` is just a regular prop**, so `forwardRef` is on its way out.

---

## 🧠 Mental model

State is for values that **should trigger a render** when they change. A **ref** is for values that should **survive re-renders but never cause one** — the canonical case being a handle to a DOM node so you can call `.focus()`, `.scrollIntoView()`, measure it, or integrate a non-React library.

`ref.current` is a mutable box. Reading or writing it doesn't re-render and isn't tracked. That's the whole point: it's the **imperative escape hatch** from React's declarative model. Use it when you genuinely need to reach *out* to the DOM or hold a mutable value (a timer id, a previous value) that shouldn't drive UI.

The `forwardRef` question exists because a ref attached to *your* component doesn't automatically reach a DOM node *inside* it — components aren't DOM elements, so React needs to be told where the ref should land.

## ⚙️ How it actually works

- **`useRef(initial)`** returns a stable `{ current }` object — same reference for the component's whole life. Mutating `current` is synchronous and render-invisible.
- **Ref on a host element** (`<input ref={r} />`) → React sets `r.current` to the DOM node on mount, `null` on unmount, during the **commit phase** (so refs are populated before effects run, in bottom-up order).
- **Ref on a custom component** → historically ignored unless you wrapped the component in `forwardRef((props, ref) => …)`, which received the ref as a second argument to attach to a child.
- **React 19 change:** `ref` is now a **normal prop** for function components — `function Input({ ref }) {…}` works directly. `forwardRef` still works but is **deprecated** going forward.
- **`useImperativeHandle`** lets a component expose a *custom* imperative API (`{ focus, scrollToTop }`) instead of the raw node — the right way to hand out a controlled handle.
- **Ref callbacks** (`ref={node => …}`) run on attach/detach; in React 19 they can **return a cleanup function**.

## 💻 Code

```jsx
// React 19: ref is just a prop — no forwardRef needed
function TextInput({ label, ref }) {
  return (
    <label>
      {label}
      <input ref={ref} />
    </label>
  );
}

// Pre-19 equivalent (still valid, now deprecated):
const TextInput = forwardRef(function TextInput({ label }, ref) {
  return <label>{label}<input ref={ref} /></label>;
});

// Expose a CURATED imperative API instead of the raw DOM node
function Modal({ ref }) {
  const dialog = useRef(null);
  useImperativeHandle(ref, () => ({
    open: () => dialog.current.showModal(),
    close: () => dialog.current.close(),
  }), []); // parent gets {open, close}, not the <dialog> itself
  return <dialog ref={dialog}>…</dialog>;
}

// Refs are also for render-invisible mutable values
function Timer() {
  const id = useRef(null);            // NOT state — changing it shouldn't re-render
  const start = () => { id.current = setInterval(tick, 1000); };
  const stop = () => clearInterval(id.current);
}
```

## ⚖️ Trade-offs

- **Prefer state; reach for refs only when you must be imperative.** Focus, scroll, measurement, media playback, canvas/WebGL, and third-party DOM libraries are legitimate. Storing derived UI data in a ref to "avoid renders" is usually a bug — the UI goes stale.
- **`useImperativeHandle` over exposing the raw node.** Handing out the DOM node lets callers do anything (including break your component's invariants); a curated handle keeps the contract small.
- **When NOT to use a ref:** anything the UI should reflect. If reading it should update the screen, it's state.
- **`forwardRef` in new code:** on React 19, don't — use the `ref` prop. Keep `forwardRef` only for pre-19 or library back-compat.

## 💣 Gotchas interviewers probe

- **Refs are `null` during render.** They're populated in the commit phase, so you can't read `ref.current` during rendering — only in effects or event handlers.
- **Mutating a ref doesn't re-render.** Change `ref.current` and expect the screen to update → nothing happens. That's the defining property, and a common beginner trap.
- **React 19: `ref` is a prop.** Knowing `forwardRef` is being retired is a strong currency signal; asserting you "always need `forwardRef`" dates you.
- **`useImperativeHandle` needs a dep array** and recreates the handle when deps change — omitting it is a subtle staleness bug.
- **Ref callbacks fire twice on updates** (detach with old node → attach with new); in React 19 return a cleanup instead of handling `null`.
- **`useRef` initial value is set once.** `useRef(expensive())` still *calls* `expensive()` every render (the result is just ignored after first); guard heavy init.
- **Don't overuse refs to escape re-renders** — you lose React's guarantees and get stale UI.

## 🎯 Say this in the interview

> "A ref is React's imperative escape hatch: a mutable `{current}` box that persists across renders but never triggers one. I use it for DOM access — focus, scroll, measurement, wiring a non-React library — and for render-invisible mutable values like a timer id. The rule I hold is: if changing it should update the screen, it's state, not a ref. Passing a ref *through* a component used to require `forwardRef`, but in React 19 `ref` is just a regular prop, so I'd write `function Input({ ref })` directly and treat `forwardRef` as deprecated. When I expose imperative behaviour to a parent, I use `useImperativeHandle` to hand out a curated API like `{open, close}` rather than the raw DOM node, so callers can't break the component's invariants. And the gotcha I always keep in mind is that refs are `null` during render and only populated at commit, so I read them in effects or handlers, never in the render body."

## 🔗 Go deeper

- [react.dev — `forwardRef`](https://react.dev/reference/react/forwardRef) — the classic API and the deprecation note pointing to the `ref` prop.
- [react.dev — Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs) — legitimate imperative use cases and timing.
- [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) — exposing a curated handle instead of the raw node.
- [react.dev — `useRef`](https://react.dev/reference/react/useRef) — the render-invisible mutable box and its rules.
