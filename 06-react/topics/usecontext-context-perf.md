<div align="center">

# `useContext` & context perf

<sub>⚛️ React · 🟡 Medium · ⏱ 1h · `#hooks` `#state`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Context is a **dependency-injection channel, not a state manager**. When a Provider's `value` changes by identity, **every** consumer re-renders — React has no idea which slice each one reads — so the perf trap is a single fat context holding fast-changing state. Split by change frequency, memoise the value, and reach for an external store when you need selectors.

---

## 🧠 Mental model

`useContext` is not subscribing to a store; it's reading the **nearest Provider's current value** off the fiber tree. There is no selector, no equality function, no "read only `.theme`". A consumer is subscribed to the *whole* value object, and React compares that value with `Object.is` against the last render. Change the reference → the consumer re-renders, full stop.

So the mental model is: **one context = one atom that re-renders all its readers together.** That's fine for things that change rarely (theme, locale, the current user, a router). It's a landmine for things that change on every keystroke or every animation frame, because you've wired a broadcast to every consumer in the subtree.

## ⚙️ How it actually works

Two independent re-render causes get conflated here, and the interviewer wants you to separate them:

1. **Provider parent re-renders.** If you write `<Ctx.Provider value={{ user, setUser }}>`, that object literal is a **fresh reference every render**. Even if `user` is unchanged, the new identity forces every consumer to re-render. Fix: `useMemo` the value.
2. **The value genuinely changes.** Now every consumer re-renders *by design* — and critically, `React.memo` **cannot** stop it. `memo` guards against prop changes; a context read is a back-channel that bypasses props entirely. A memoised component that calls `useContext` still re-renders when the context updates.

The scaling failure: one `AppContext = { user, theme, cart, notifications, ...}`. A cart badge update re-renders the theme consumers, the user menu, everything. React re-renders **all** consumers because it can't see that one only reads `theme`. Context has no fine-grained subscription — that's the entire reason libraries like Redux, Zustand, and Jotai exist.

## 💻 Code

```jsx
// ❌ New object every render → all consumers re-render even when nothing changed
function App() {
  const [user, setUser] = useState(null);
  return <Ctx.Provider value={{ user, setUser }}>{children}</Ctx.Provider>;
}

// ✅ Stable value; and split the setter out so state-only consumers
//    don't re-render when nothing they read changed.
const UserStateCtx = createContext(null);
const UserApiCtx = createContext(null); // setters are stable, never change

function App() {
  const [user, setUser] = useState(null);
  const api = useMemo(() => ({ setUser }), []);   // identity stable forever
  return (
    <UserApiCtx.Provider value={api}>
      <UserStateCtx.Provider value={user}>{children}</UserStateCtx.Provider>
    </UserApiCtx.Provider>
  );
}
```

The **split-context pattern** above is the highest-leverage move: components that only *dispatch* subscribe to `UserApiCtx`, whose value never changes, so they never re-render on state updates. Only components that read the state pay for state updates.

When you need real selectors (read one field, ignore the rest), stop using context as the store and put the state in an external store, exposing a `useSelector`:

```jsx
// Context passes the *store*, not the state. Value identity is stable.
const store = useSyncExternalStore(store.subscribe, () => selector(store.get()));
```

## ⚖️ Trade-offs

- **Context is perfect for low-frequency, widely-read values:** theme, locale, auth user, feature flags, a design-system config. Zero-dependency, colocated, SSR-friendly.
- **When NOT to use it:** as a general state manager for anything that updates frequently or where consumers read disjoint slices. You'll either over-render or end up hand-rolling the split-context gymnastics that a store gives you for free.
- **Don't over-split either.** Ten providers deep is its own readability cost. Split by *change frequency* (does it update together?), not by arbitrary field boundaries.
- **`memo` is not a fix.** If a re-render storm comes from context, memoising children does nothing — you must change the value's granularity, not wrap the consumers.

## 💣 Gotchas interviewers probe

- **"Can `React.memo` stop a context-driven re-render?"** No. Context reads bypass props. This is the single most common misconception — say it clearly.
- **Inline `value={{...}}` re-renders everything.** A fresh object each render defeats the whole thing. Memoise it, or the split doesn't help.
- **Context doesn't do partial subscriptions.** Reading `.theme` still subscribes you to the entire value. There is no built-in selector — React 19 has no `useContextSelector` (it's a userland/library concept).
- **The default value only applies with no Provider above.** A common bug: forgetting the Provider and silently getting the default instead of an error.
- **`use(Context)` in React 19** can read context conditionally (inside an `if`), unlike `useContext`. Handy, but it still subscribes to the whole value.
- **Provider nesting order matters for overrides** — the nearest Provider wins, which is how you scope a theme to a subtree.

## 🎯 Say this in the interview

> "Context is dependency injection, not a state store. The key fact is that it has no selectors: when the Provider's value changes by identity, *every* consumer in the subtree re-renders, because React can't tell which slice each one reads — and `React.memo` can't stop it, since a context read bypasses props. So the two things I watch for are, first, never pass an inline object as `value` — memoise it, or you re-render everyone on every parent render for no reason. Second, split contexts by change frequency: I'll put stable setters in one context and the changing state in another, so dispatch-only components never re-render on state updates. Once I need components to read genuinely disjoint slices of fast-changing state, I stop using context as the store and move to an external store with `useSyncExternalStore` or a library like Zustand, which gives me real per-field subscriptions."

## 🔗 Go deeper

- [react.dev — `useContext`](https://react.dev/reference/react/useContext) — the read semantics and the "before you optimise" caveats.
- [react.dev — Passing data deeply with context](https://react.dev/learn/passing-data-deeply-with-context) — when context earns its place vs prop drilling.
- [react.dev — Scaling up with reducer and context](https://react.dev/learn/scaling-up-with-reducer-and-context) — the reducer + split-context pattern in full.
- [react.dev — `use`](https://react.dev/reference/react/use) — reading context conditionally in React 19.
