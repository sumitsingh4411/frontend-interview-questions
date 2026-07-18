<div align="center">

# Rendering & re-render mental model

<sub>⚛️ React · 🟡 Medium · ⏱ 1h · `#rendering`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — "Rendering" is React **calling your component function** to get a fresh element tree; it is not the same as touching the DOM. A component re-renders when its **state changes** or when its **parent re-renders** — *not* because a prop "looks different". Render → reconcile → commit → paint are four distinct steps.

---

## 🧠 Mental model

Three verbs people blur into one:

| Step | What happens | Cost |
|---|---|---|
| **Render** | React calls `Component(props)` and gets an element tree | Pure JS, cheap-ish |
| **Reconcile** | React diffs new tree vs previous fiber tree | Proportional to tree size |
| **Commit** | React applies the minimal DOM mutations | Touches the DOM |
| **Paint** | The *browser* draws pixels | Out of React's hands |

The critical insight: **rendering is not painting.** A re-render that produces an identical tree costs a function call and a diff but zero DOM writes. This is why "my component re-renders" is not automatically a bug — the Virtual DOM exists precisely so that re-rendering can be cheap and the commit can be minimal.

The trigger model is equally important: **a component re-renders because *it* set state, or because its *parent* re-rendered.** Props changing is a *consequence* of a parent re-rendering, not an independent cause. By default, when a parent re-renders, React re-renders **all** its children regardless of whether their props changed.

## ⚙️ How it actually works

**A state update schedules a render; it doesn't render synchronously.** Calling `setCount(1)` marks the fiber dirty and queues work. React then renders from that component *downward*, calling every descendant's function (unless it hits a bail-out).

**The default is: parent renders → all children render.** People assume React compares props and skips unchanged children. It does not — that comparison is exactly what `React.memo` adds. Without memo, a child re-renders even if you pass it the same primitives, because React re-ran the parent and produced fresh child elements.

**Bail-outs — when React *stops*:**
- `setState` to an `Object.is`-equal value bails out of that update (React may still render once to check, then discard).
- `React.memo(Child)` shallow-compares props; equal props → React reuses the previous output and skips the subtree.
- An element passed through as `children` (created by a higher-up parent) keeps the same reference, so a re-rendering intermediate component doesn't force it to re-render.

**Rendering is a snapshot.** Each render closes over the props and state values *from that render*. `count` inside a render is a number, frozen for that pass — not a live reference. Event handlers and effects created in that render see that snapshot. This is the true basis of "stale closures": nothing is stale, you're just looking at an *old snapshot* that never mutates.

## 💻 Code

```jsx
// Every child re-renders when Parent's state changes — even <Pure> below,
// unless it's wrapped in React.memo.
function Parent() {
  const [n, setN] = useState(0);
  return (
    <>
      <button onClick={() => setN(n + 1)}>{n}</button>
      <Child />        {/* re-renders every click, though its props never change */}
    </>
  );
}
```

```jsx
// ❌ Inline object → new reference every render → React.memo can't help.
<MemoChild style={{ color: "red" }} onSave={() => save()} />

// ✅ Stable references let memo actually skip the child.
const style = useMemo(() => ({ color: "red" }), []);
const onSave = useCallback(() => save(), []);
<MemoChild style={style} onSave={onSave} />
```

```jsx
// The snapshot model, demonstrated:
function Counter() {
  const [n, setN] = useState(0);
  function handle() {
    setN(n + 1);
    setTimeout(() => alert(n), 3000); // alerts the OLD n — this render's snapshot
  }
  return <button onClick={handle}>{n}</button>;
}
```

## ⚖️ Trade-offs

- **Re-renders are usually cheap; don't pre-optimise them.** Wrapping everything in `memo`/`useCallback` adds comparison cost and cognitive load. Profile first — the expensive thing is rarely the render, it's a giant list or a synchronous layout thrash.
- **`React.memo` earns its place at boundaries:** a heavy subtree, a list item, a component whose parent re-renders often for unrelated reasons. Sprinkled everywhere, it mostly buys you shallow-compare overhead.
- **Moving state down beats memoising up.** If only a small subtree needs the state, colocate it there so the big siblings never re-render — structural fixes outperform `memo` band-aids.

## 💣 Gotchas interviewers probe

- **"Does a component re-render only when its props change?"** No — that's the single most common misconception. By default it re-renders whenever its parent does. Prop comparison is what `React.memo` opts *into*.
- **Re-render ≠ DOM update.** React can call your function and produce an identical tree, committing nothing. Conflating the two leads to phantom "performance" fixes.
- **State updates are asynchronous *within an event*.** After `setN(n+1)`, `n` is still the old value in that scope — you read the new value on the next render, not the next line.
- **Inline objects/functions/arrays break `memo`** because they're new references each render. This is *the* reason `useMemo`/`useCallback` exist.
- **StrictMode renders components twice in dev** to surface impure renders. If a double render breaks you, your render isn't pure.
- **Reading state in a `setTimeout`/`setInterval`** captures that render's snapshot — the classic "counter stuck at 1" bug. Use the functional updater `setN(x => x + 1)`.

## 🎯 Say this in the interview

> "I separate rendering from painting. Rendering is just React calling my component function to get a new element tree; reconciliation diffs it against the last one, and only the commit touches the DOM. So a re-render isn't automatically expensive — the whole point of the diff is that the commit is minimal. A component re-renders when it sets state or when its parent re-renders, and by default a parent re-render re-renders *all* children — React doesn't compare props unless I wrap the child in `React.memo`. I also lean hard on the snapshot model: each render freezes its own props and state, so a value captured in a timeout is that render's snapshot, not a live variable — that's what people call a stale closure. My first move for perf is usually to move state down, not to memoise everything up."

## 🔗 Go deeper

- [react.dev — Render and commit](https://react.dev/learn/render-and-commit) — the render → commit pipeline, officially.
- [react.dev — State as a snapshot](https://react.dev/learn/state-as-a-snapshot) — the frozen-per-render model.
- [react.dev — `React.memo`](https://react.dev/reference/react/memo) — exactly what it compares and when to reach for it.
- [A (Mostly) Complete Guide to React Rendering Behavior — Mark Erikson](https://blog.isquaredsoftware.com/2020/05/blogged-answers-a-mostly-complete-guide-to-react-rendering-behavior/) — the definitive deep dive on what triggers renders.
