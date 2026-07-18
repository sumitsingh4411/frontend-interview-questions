<div align="center">

# `React.memo` & referential equality

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#performance`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `memo` skips a re-render only when **every prop is referentially equal** (`Object.is`, prop by prop); the instant a parent passes a fresh object, array, or arrow function it does nothing — which is why it usually drags `useMemo`/`useCallback` along, and why the whole trio is often cheaper to delete than to maintain.

---

## 🧠 Mental model

By default a component re-renders whenever **its parent** re-renders — props changing or not. `memo` rewrites that rule to: *re-render only if a prop actually changed*, where "changed" means `Object.is(prev, next)` is `false` for at least one prop.

The key word is **referential**. `memo` does a **shallow** comparison — it compares prop values by identity, not by deep value. `{a: 1}` and `{a: 1}` are two different objects, so `Object.is` says they differ and `memo` re-renders. `memo` is therefore a **bet**: you wager that the skipped subtree render costs more than the per-prop comparison plus the memory of holding the previous props. For a leaf that renders in 0.1 ms, you lose that bet.

## ⚙️ How it actually works

`memo(Component)` returns a new component that caches the last rendered result and its props. On the next render it runs `Object.is` over each prop key:

- **Primitives** (`string`, `number`, `boolean`) compare by value → stable across renders.
- **Objects, arrays, functions** compare by identity → **a new literal every render breaks memo.** `onClick={() => …}`, `style={{…}}`, `items={data.filter(…)}` all mint a fresh reference each time the parent renders.

Two facts most candidates miss:

1. **`children` is a prop.** `<Memoized>{stuff}</Memoized>` passes a new element tree every render, so `memo` almost never helps a component that takes children.
2. **`memo` only guards the *props* path.** A memoized component still re-renders when its own **state** changes or when a **context** it consumes changes — `memo` cannot stop those.

You can override the comparison with a second argument, `arePropsEqual(prev, next)` — return `true` to **skip**. It's a footgun (easy to forget a prop, easy to make it slower than the render) and a signal you're modelling data wrong.

## 💻 Code

```jsx
const Row = memo(function Row({ item, onSelect }) {
  return <li onClick={() => onSelect(item.id)}>{item.label}</li>;
});

// ❌ memo is defeated: both props are new references every render
function List({ items }) {
  return items.map((item) => (
    <Row key={item.id} item={item} onSelect={(id) => open(id)} /> // new fn each render
  ));
}

// ✅ stabilise the reference so the comparison can actually pass
function List({ items }) {
  const onSelect = useCallback((id) => open(id), []); // one stable identity
  return items.map((item) => (
    <Row key={item.id} item={item} onSelect={onSelect} />
  ));
}
```

The deeper fix is often to **not need `memo` at all** — pass expensive subtrees as `children` so their element is created by a component that *doesn't* re-render (see "Avoiding unnecessary re-renders").

## ⚖️ Trade-offs

- **`memo` is not free.** You pay a shallow comparison on every render and you retain the previous props in memory. On a cheap component that comparison can cost more than the render it's trying to avoid.
- **When NOT to use it:** components that are cheap; components that receive new props nearly every render anyway (the comparison always fails, so you pay it for nothing); anything wrapping `children`.
- **`memo` alone is half a pattern.** It only pays off when the parent stabilises every non-primitive prop with `useMemo`/`useCallback`. One un-memoised prop silently voids the whole thing.
- **The React Compiler retires most of this.** If you're on the compiler, hand-written `memo`/`useMemo`/`useCallback` is largely redundant — see "React Compiler".

## 💣 Gotchas interviewers probe

- **"Why isn't my `memo` working?"** — 90% of the time a parent passes an inline object/array/function. `memo` did its job; the props genuinely differ by identity.
- **`children` defeats `memo`.** New element tree every render. Interviewers love this one.
- **`memo` doesn't stop context or state re-renders.** A memoized consumer of a changing context re-renders regardless.
- **`useCallback`/`useMemo` cost too.** They cache one value and run their own dep comparison; wrapping everything "just in case" adds overhead and noise for no measured gain.
- **`Object.is`, not `===`.** They differ on `NaN` (equal under `Object.is`) and `+0`/`-0` (unequal). Rarely bites, but it's the exact semantics.
- **Default export vs named.** `memo` wraps the component value, not the module — re-declaring the component inside render creates a new type and remounts.

## 🎯 Say this in the interview

> "`memo` changes a component's re-render rule from 'whenever my parent renders' to 'only when my props change by shallow reference comparison' — `Object.is` per prop. The catch is *referential* equality: the moment a parent passes an inline arrow, object, or array, the reference is new every render and `memo` does nothing, which is why it usually needs `useCallback`/`useMemo` around it to be worth anything. And `children` is a prop, so wrapping a component that takes children rarely helps. I treat `memo` as a measured optimisation, not a default — it costs a comparison and retained memory, and on a cheap leaf that's a net loss. My first move is usually to restructure: colocate state or pass the expensive subtree as `children` so it never re-renders in the first place. And on the React Compiler I'd delete most manual memoisation entirely."

## 🔗 Go deeper

- [react.dev — `memo`](https://react.dev/reference/react/memo) — the exact skip semantics, `arePropsEqual`, and the caveats.
- [react.dev — `useCallback`](https://react.dev/reference/react/useCallback) — when a stable function identity actually matters (and when it doesn't).
- [react.dev — "Before you memo()"](https://react.dev/learn/render-and-commit) — restructuring beats memoising; the render/commit model.
- [MDN — `Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) — the exact equality used, including the `NaN` and signed-zero edge cases.
