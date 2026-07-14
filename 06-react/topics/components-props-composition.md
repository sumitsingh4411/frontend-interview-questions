<div align="center">

# Components, props, composition

<sub>⚛️ React · 🟢 Easy · ⏱ 45m · `#basics`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A component is a **pure function from props to a UI description**. Props flow one way (parent → child) and are read-only inside the child; you compose behaviour by *passing UI as props* (`children`, render props, slots) rather than configuring one god-component with 40 booleans.

---

## 🧠 Mental model

A component is `props => element tree`. That's the whole contract. Given the same props (and the same state/context), it must return the same description — React relies on this purity to render, bail out, and re-run your function whenever it likes, including twice in StrictMode.

Props are a **one-way data channel**. The parent owns the data; the child receives a snapshot and may not mutate it. If a child needs to change something the parent owns, the parent passes down a *callback* — data flows down, events flow up. This unidirectional flow is what makes a React tree traceable: to find where a value comes from, you walk up, never sideways.

The senior reframe: **composition is React's answer to inheritance.** You almost never `extends` anything. Instead of a `<Dialog large withHeader withFooter dismissible>` that grows a prop per variation, you pass the *pieces* — `<Dialog><Dialog.Header/>…</Dialog>` — and let the caller assemble them.

## ⚙️ How it actually works

**Props is a plain object, assembled at the call site.** `<Avatar size="lg" user={u} />` compiles to `jsx(Avatar, { size: "lg", user: u })`. React calls `Avatar(props)`. There is no two-way binding, no `$emit`, no observation — just a function call with an object argument.

**`children` is just a prop** whose value is whatever you nest between the tags. That single fact unlocks composition: a component that renders `{props.children}` is a *container* that doesn't care what it wraps. `<Card>` doesn't need to know about `<Avatar>`; it renders a slot.

**Props are immutable by contract, not by force.** JS won't stop you writing `props.x = 1`, but you'll desync from React's model and defeat memoisation. Treat them as frozen.

**Default and rest patterns are ordinary JS**, which is why "React is just JavaScript" pays off:

```jsx
function Button({ variant = "primary", ...rest }) {
  return <button className={variant} {...rest} />; // spread the leftover DOM props
}
```

## 💻 Code

```jsx
// ❌ Configuration hell: every new layout adds another boolean.
<Dialog title="Delete?" body="Sure?" showCancel confirmLabel="Delete" danger />

// ✅ Composition: pass the UI, not flags describing it.
<Dialog>
  <Dialog.Title>Delete?</Dialog.Title>
  <Dialog.Body>This can't be undone.</Dialog.Body>
  <Dialog.Actions>
    <Button variant="ghost">Cancel</Button>
    <Button variant="danger">Delete</Button>
  </Dialog.Actions>
</Dialog>
```

The **slot pattern** — accept elements as props, not just strings:

```jsx
// A component that takes UI in named "slots". No prop explosion.
function Page({ header, sidebar, children }) {
  return (
    <div className="layout">
      <header>{header}</header>
      <aside>{sidebar}</aside>
      <main>{children}</main>
    </div>
  );
}

<Page header={<Nav />} sidebar={<Filters />}>
  <Results />
</Page>
```

Lifting a child *through* a parent to dodge re-renders — composition as a perf tool:

```jsx
// <ExpensiveTree/> is passed in as `children`, so when Timer's own state
// ticks, React reuses the SAME children element and skips re-rendering it.
function Timer({ children }) {
  const [n, setN] = useState(0);
  useEffect(() => { const id = setInterval(() => setN(x => x + 1), 1000); return () => clearInterval(id); }, []);
  return <div>{n}{children}</div>;
}
<Timer><ExpensiveTree /></Timer>
```

## ⚖️ Trade-offs

- **Composition over configuration — until it isn't.** Compound components (`Dialog.Title`) are wonderful for flexible, reusable primitives. For a locked-down design-system button used identically 500 times, a plain props API is simpler and easier to type. Don't cargo-cult slots onto leaf components.
- **Prop drilling is fine at 2–3 levels.** Reaching for Context the moment a prop passes through one intermediary is premature. Context trades explicitness for reach — see the context deep dive for its re-render cost.
- **`children` as a function (render props) still has its place** — but for *stateful logic* reuse, a custom hook beats a render-prop wrapper because it doesn't add tree depth.

## 💣 Gotchas interviewers probe

- **"Can a child change its props?"** No. Props are read-only. To change parent-owned data, call a callback the parent passed down. Mutating props is a hard fail signal.
- **Spreading props onto a DOM node** (`<div {...props}>`) is convenient but leaks unknown attributes and can override your own — order matters, and `key`/`ref` are never in the spread.
- **A component defined *inside* another component's body** gets a new function identity every render, so React remounts its subtree and loses state. Hoist components to module scope.
- **Passing `children` doesn't automatically memoise it** — the perf trick above only works because the *parent* creates the child element once and passes it through a component that doesn't re-create it.
- **Uppercase vs lowercase is semantic:** `<button>` is a DOM string, `<Button>` is your function. Lowercasing a component makes React render an unknown HTML tag.

## 🎯 Say this in the interview

> "A component is a pure function from props to a description of UI. Props are a one-way channel — the parent owns the data, the child gets a read-only snapshot, and if the child needs to change something it calls a callback the parent passed down. That unidirectional flow is what makes a React app traceable. For reuse I lean on composition instead of inheritance: rather than growing a component a boolean at a time, I pass UI in through `children` or named slots, so the caller assembles the pieces. Compound components like `Dialog.Title` are the clean expression of that. I also use composition for performance — passing an expensive subtree as `children` lets a parent re-render its own state without re-rendering the child."

## 🔗 Go deeper

- [react.dev — Your first component](https://react.dev/learn/your-first-component) — the props-to-UI contract, from scratch.
- [react.dev — Passing props to a component](https://react.dev/learn/passing-props-to-a-component) — one-way flow and `children` in depth.
- [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) — the slot pattern the compound examples rely on.
- [react.dev — Keeping components pure](https://react.dev/learn/keeping-components-pure) — why purity is load-bearing, not stylistic.
