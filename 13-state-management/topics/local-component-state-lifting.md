<div align="center">

# Local component state & lifting

<sub>🗃️ State management · 🟢 Easy · ⏱ 30m · `#basics` `#react`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Keep state as **low in the tree as possible** (colocation); the moment two components must agree on it, **lift it to their closest common ancestor** and pass it down as props. State has one owner — the rest read it.

---

## 🧠 Mental model

React state is owned by exactly one component. "Sharing" state doesn't mean copying it into two places — it means finding the **single owner** and letting everyone else receive it as props or callbacks.

There are only two moves, and they pull in opposite directions:

- **Colocate** — push state *down* to the smallest component that uses it. A local `useState` inside a `<Toggle>` is invisible to the rest of the app and can't be corrupted from outside.
- **Lift** — when a *sibling* also needs to read or change that value, hoist it *up* to the nearest ancestor both share, and pass `value` down and `onChange` back up.

The skill is knowing which way to move. Default to colocation; lift only when a concrete second consumer appears. Lifting pre-emptively is how you end up with everything in a giant root component.

## ⚙️ How it actually works

Two sibling inputs can't talk to each other directly — React data flow is **one-way, top-down**. The only way for `<InputA>` to influence `<InputB>` is for their shared parent to hold the value and hand it to both. That's all "lifting state up" is: relocate the `useState` to the common ancestor.

The mechanical pattern:

1. Find the value both components need.
2. Move its `useState` to the closest common parent.
3. Pass the value down as a prop, and pass a setter down as a callback prop.
4. The children become **controlled** — they render what they're given and report changes upward.

This is why a controlled input takes both `value={x}` and `onChange={setX}`: the child has surrendered ownership. It's now a pure function of props, which makes it trivial to test and impossible to desync.

The cost is **prop drilling** — if the owner is five levels above the consumer, four intermediate components must forward props they don't care about. That friction is the signal to reach for Context or a store — but only *after* lifting stops scaling, not before.

## 💻 Code

```jsx
// ❌ Two independent sources of truth. They drift apart instantly.
function Celsius()   { const [c, setC] = useState(0); /* ... */ }
function Fahrenheit(){ const [f, setF] = useState(32); /* ...never agrees with Celsius */ }

// ✅ Lift to the common parent. ONE source of truth; children are controlled.
function Converter() {
  const [celsius, setCelsius] = useState(0);          // single owner
  const fahrenheit = celsius * 9 / 5 + 32;            // derive, don't store (see: derived state)
  return (
    <>
      <TempInput value={celsius}    onChange={setCelsius} label="°C" />
      <TempInput value={fahrenheit} onChange={(f) => setCelsius((f - 32) * 5 / 9)} label="°F" />
    </>
  );
}

// Child is a pure function of props — it owns nothing.
function TempInput({ value, onChange, label }) {
  return <input value={value} onChange={(e) => onChange(Number(e.target.value))} />;
}
```

The counter-move — **colocate** when state is genuinely local:

```jsx
// This dropdown's open/closed state matters to no one else. Keep it inside.
function Dropdown() {
  const [open, setOpen] = useState(false); // lifting this would be pure overhead
  // ...
}
```

## ⚖️ Trade-offs

- **Colocation makes components portable and fast** — local state re-renders only that subtree. But it can't be shared, so a value used by two siblings *must* move up.
- **Lifting centralises truth** (no desync) at the cost of prop drilling and wider re-renders — the owner re-rendering re-renders its children unless you memoize.
- **When NOT to lift:** if only one component reads the value, lifting is premature abstraction. And when lifting would drill through many layers, that's the boundary where Context or a store starts to pay off — lifting isn't free at depth.
- **Lift to the *closest* common ancestor**, not the root. Hoisting everything to `<App>` turns your app into one god-component and re-renders the world on every keystroke.

## 💣 Gotchas interviewers probe

- **"State has to live somewhere specific"** — there's exactly one owner. Candidates who imagine siblings syncing directly miss React's one-way flow.
- **Copying props into state.** `useState(props.value)` snapshots the prop *once* — later prop changes are ignored, and now you have two sources of truth. If you're deriving from props, compute during render instead.
- **Lifting turns a child controlled** — forget to pass `onChange` and the input goes read-only (React even warns). Uncontrolled ↔ controlled switches mid-life throw.
- **Over-lifting is a real anti-pattern**, not just a style nit: a value lifted to the root re-renders every descendant on each change. Keep state as low as correctness allows.
- **`key` resets local state.** Changing a component's `key` unmounts and remounts it, wiping its `useState`. Powerful for "reset this form," surprising when accidental.

## 🎯 Say this in the interview

> "My default is colocation — keep each piece of state in the smallest component that actually uses it, so re-renders stay scoped and the component is self-contained. The moment a *sibling* needs the same value, I lift it: React data flow is one-way, so two siblings can't talk directly — I move the `useState` up to their closest common ancestor and pass the value down as a prop and a setter down as a callback. That gives me a single source of truth and makes the children controlled and easy to test. I'm deliberate about lifting only to the *nearest* shared ancestor, not the root, because over-lifting re-renders the whole tree. And once lifting means drilling props through many layers that don't care, that's my signal to switch to Context or a small store."

## 🔗 Go deeper

- [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) — the canonical lifting walkthrough.
- [react.dev — Choosing the State Structure](https://react.dev/learn/choosing-the-state-structure) — single source of truth, avoiding redundant state.
- [react.dev — Preserving and Resetting State](https://react.dev/learn/preserving-and-resetting-state) — how position and `key` control local state lifetime.
- [Kent C. Dodds — State Colocation](https://kentcdodds.com/blog/state-colocation-will-make-your-react-app-faster) — why keeping state low is a performance win.
