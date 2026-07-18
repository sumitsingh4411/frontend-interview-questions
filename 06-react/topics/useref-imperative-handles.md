<div align="center">

# `useRef` & imperative handles

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#hooks`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `useRef` is a **mutable box that survives re-renders but never triggers one** — use it for DOM access and for values the UI shouldn't react to (timer ids, the "latest" of something). An *imperative handle* (`useImperativeHandle`) lets a component hand its parent a **curated method API** instead of the raw DOM node, keeping the escape hatch narrow.

---

## 🧠 Mental model

State and refs answer two different questions. **State** = "a value that, when it changes, the screen must change." **Ref** = "a value that must persist across renders but must *not* cause one."

`useRef(initial)` returns the *same* `{ current }` object for the entire life of the component. Writing `ref.current = x` is a plain synchronous assignment — no scheduling, no re-render, no tracking. That's the whole design: it's React's **imperative escape hatch** out of the declarative model. Two families of use follow: reaching *out* to a DOM node (`.focus()`, `.scrollIntoView()`, measuring, wiring a canvas/media/third-party library), and holding a render-invisible mutable value.

An imperative handle is the disciplined version of "let the parent poke at me." Instead of exposing the DOM node, you expose `{ open, close, scrollToRow }` — a small, intention-revealing contract the parent can't use to break your invariants.

## ⚙️ How it actually works

- **DOM ref timing.** `<input ref={r} />` sets `r.current` to the node during the **commit phase**, *before* effects run, bottom-up; it's set back to `null` on unmount. So `ref.current` is `null` during render — read it in effects or event handlers, never in the render body.
- **Ref callbacks.** `ref={node => …}` runs on attach (with the node) and detach (with `null`). In **React 19** the callback can *return a cleanup function*, so you handle attach/detach symmetrically instead of branching on `null`.
- **Initial value is evaluated every render.** `useRef(expensiveInit())` still *calls* `expensiveInit()` on every render and discards all but the first result. Guard heavy init: `if (ref.current === null) ref.current = expensiveInit()`.
- **Imperative handle** — `useImperativeHandle(ref, () => ({ … }), deps)` overrides what the parent's ref receives. In **React 19**, `ref` is a normal prop, so no `forwardRef` wrapper is needed. The factory re-runs when `deps` change; omitting deps you depend on is a staleness bug.
- **The latest-ref pattern.** Mirror a frequently-changing value into a ref (`latest.current = value` in an effect or on each render) so a long-lived callback/subscription can read the *current* value without re-subscribing and without a stale closure.

## 💻 Code

```jsx
// Render-invisible mutable value — NOT state, changing it must not re-render
function Stopwatch() {
  const intervalId = useRef(null);
  const start = () => { intervalId.current = setInterval(tick, 1000); };
  const stop  = () => clearInterval(intervalId.current);
}

// Curated imperative API instead of the raw <dialog> (React 19: ref is a prop)
function Modal({ ref }) {
  const dialog = useRef(null);
  useImperativeHandle(ref, () => ({
    open:  () => dialog.current.showModal(),
    close: () => dialog.current.close(),
  }), []); // parent receives {open, close}, cannot touch the DOM node directly
  return <dialog ref={dialog}>…</dialog>;
}

// Latest-ref: read fresh value from a stable subscription without re-subscribing
function useEvent(handler) {
  const latest = useRef(handler);
  useLayoutEffect(() => { latest.current = handler; });
  return useCallback((...args) => latest.current(...args), []); // stable identity, fresh logic
}
```

## ⚖️ Trade-offs

- **Prefer state; reach for refs only when you must be imperative.** Focus, scroll, measurement, media, canvas/WebGL, and non-React DOM libraries are legitimate. Stashing derived UI data in a ref "to avoid renders" gives you **stale UI** — that's a bug, not an optimisation.
- **Expose a handle, not the node.** Handing out the raw DOM element lets callers do anything, including violate your component's contract. A curated `{ open, close }` keeps the surface tiny.
- **When NOT to use a ref:** anything the screen should reflect. If reading it should update the UI, it's state.
- **Imperative handles are a smell in bulk.** One or two (focus, imperative animations) are fine; a component exposing ten methods usually wants its state lifted or its API rethought declaratively.

## 💣 Gotchas interviewers probe

- **Refs are `null` during render.** Populated at commit, so reading `ref.current` in the render body gets `null`. Read in effects/handlers.
- **Mutating a ref doesn't re-render.** The defining property — and a beginner trap when they expect the screen to update.
- **`useRef(init)` runs `init` every render.** Unlike `useState`'s lazy initialiser. Guard expensive creation.
- **`useImperativeHandle` needs its dep array.** Stale methods otherwise. And the parent only sees the handle *after* commit.
- **React 19: `ref` is a prop.** `forwardRef` is deprecated; `function Modal({ ref })` works directly. Claiming you "always need `forwardRef`" dates you.
- **The stale-closure trap.** A `setInterval`/subscription set up once captures the first render's variables. The latest-ref pattern (or exhaustive deps) fixes it.

## 🎯 Say this in the interview

> "A ref is a mutable `{current}` box that persists across renders but never causes one — the imperative escape hatch. I use it for DOM work like focus, scroll, and measurement, for wiring non-React libraries, and for render-invisible values like a timer id. My rule: if changing it should update the screen, it's state, not a ref. DOM refs are populated at commit, so I only read `current` in effects or handlers, never during render. When a parent needs to drive a child imperatively, I don't expose the DOM node — I use `useImperativeHandle` to hand out a curated API like `{open, close}`, which keeps the contract small and protects my invariants. In React 19 that's even cleaner because `ref` is a normal prop, so `forwardRef` is gone. And for stable callbacks that still need fresh state, I reach for the latest-ref pattern to dodge stale closures."

## 🔗 Go deeper

- [react.dev — `useRef`](https://react.dev/reference/react/useRef) — the render-invisible mutable box and its rules.
- [react.dev — Manipulating the DOM with refs](https://react.dev/learn/manipulating-the-dom-with-refs) — legitimate imperative use cases and commit-phase timing.
- [react.dev — `useImperativeHandle`](https://react.dev/reference/react/useImperativeHandle) — exposing a curated handle instead of the raw node.
- [react.dev — Referencing values with refs](https://react.dev/learn/referencing-values-with-refs) — refs vs state, and when each is right.
