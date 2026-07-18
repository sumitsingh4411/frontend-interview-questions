<div align="center">

# Avoiding unnecessary re-renders

<sub>⚛️ React · 🔴 Hard · ⏱ 1h · `#performance`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A render is React calling your function and diffing — usually cheap; the cost is a render that **cascades through a large subtree**. Fix the *cause* with state colocation, composition (`children` as props), and context splitting **before** you reach for `memo`.

---

## 🧠 Mental model

Two things people fuse into one word "render":

- **Render** = React calls your component function and reconciles the returned elements. Pure JS + a diff. Often sub-millisecond.
- **Commit** = React applies the diff to the real DOM. This is the expensive part, and React only commits what actually changed.

So a "re-render" is not automatically a problem — a component re-rendering that produces the same output commits *nothing*. The pathology is a **state change high in the tree** re-rendering a **big subtree** underneath it. The default rule: when a component renders, **all of its descendants render**, regardless of whether their props changed. State flows down, so an update re-renders the owner and everything below — not ancestors, not siblings.

## ⚙️ How it actually works

A component re-renders for exactly four reasons: **its own state changed**, **its parent re-rendered**, **a context it consumes changed**, or **a subscribed external store changed**. Note props "changing" is not on the list — a child re-renders because its parent did, whether or not props differ.

The best fixes attack the *structure*, not the symptom:

1. **Colocate state.** Push state down to the smallest component that needs it. A hover state on one button shouldn't live in `App`.
2. **Lift content up, pass it as `children`.** An element passed as `children` is created by the *parent's* parent. When the middle component's state changes, `children` is the **same element reference**, so React bails out of re-rendering it — no `memo` required.
3. **Split context.** A context value re-renders **every consumer** on any change. Separate rarely-changing data from frequently-changing data into different providers, and memoise the provider `value`.

`memo` is the *last* tool, for when a genuinely expensive component keeps getting the same props from a parent you can't restructure.

## 💻 Code

The "children as props" trick — the expensive tree does **not** re-render when the counter ticks:

```jsx
// ❌ <ExpensiveTree/> re-renders on every click because Counter re-renders
function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount((c) => c + 1)}>
      {count}
      <ExpensiveTree /> {/* created inside Counter → re-renders every tick */}
    </div>
  );
}

// ✅ Move state to a wrapper; pass the tree in as children
function Counter({ children }) {
  const [count, setCount] = useState(0);
  return (
    <div onClick={() => setCount((c) => c + 1)}>
      {count}
      {children} {/* same element reference across renders → React bails out */}
    </div>
  );
}

function App() {
  return (
    <Counter>
      <ExpensiveTree /> {/* created by App, which isn't re-rendering */}
    </Counter>
  );
}
```

No `memo`, no `useCallback` — the render simply never reaches the expensive subtree.

## ⚖️ Trade-offs

- **Measure before optimising.** Open the **React Profiler**, record the interaction, and look for what actually renders and for how long. Optimising a 0.3 ms render is negative work — you add complexity and a comparison cost for nothing.
- **`memo` everywhere is cargo cult.** It adds a shallow comparison and retained memory per component, obscures intent, and silently breaks the moment one prop is an inline literal.
- **When NOT to bother:** interactions that already commit in a few ms, lists small enough that a full re-render is imperceptible, prototypes.
- **The React Compiler changes the calculus** — it auto-memoises correctly, so on a compiled codebase most of this is handled for you.

## 💣 Gotchas interviewers probe

- **"State colocation" and "children as props" beat `memo`** — knowing to restructure rather than memoise is the senior signal here.
- **Context re-renders every consumer** regardless of `memo`, because it's a subscription, not a prop. A new object as `value` each render re-renders all consumers.
- **Inline objects/functions only matter when something reads them** — a memoised child or a hook dependency array. On a plain child that always re-renders anyway, `useCallback` buys nothing.
- **`useState`/`useMemo` initializers.** `useState(expensiveCall())` runs the call **every render**; pass a function — `useState(() => expensiveCall())` — to run it once.
- **Strict Mode double-invokes renders in dev** to surface impurity. That's not a perf bug and doesn't happen in production.
- **Same element reference bails out.** React's core optimisation: if an element (`===`) is unchanged, it skips re-rendering that child — the mechanism behind the `children` trick.

## 🎯 Say this in the interview

> "First I separate render from commit — rendering is just calling the function and diffing, which is usually cheap; the DOM commit is the expensive bit and React only commits real changes. So 'unnecessary re-render' is often a non-issue until the Profiler shows a state change high in the tree cascading through a big subtree. When it is real, I fix the cause before reaching for `memo`: colocate state so an update stays local; lift the expensive tree up and pass it as `children`, because a `children` element keeps the same reference and React bails out of re-rendering it for free; and split context so a fast-changing value doesn't re-render every consumer. `memo` is my last resort, for an expensive component I can't restructure — and even then it only works if the parent stabilises every non-primitive prop. On a codebase with the React Compiler I'd let it handle memoisation and delete most of the manual work."

## 🔗 Go deeper

- [react.dev — Render and commit](https://react.dev/learn/render-and-commit) — the two-phase model this whole topic rests on.
- [react.dev — `useState` (lazy initializer)](https://react.dev/reference/react/useState) — why you pass a function to avoid re-running expensive init.
- [react.dev — Passing data with context](https://react.dev/learn/passing-data-deeply-with-context) — the consumer-re-render behaviour and splitting contexts.
- [React Profiler](https://react.dev/reference/react/Profiler) — measuring what actually renders before you optimise.
