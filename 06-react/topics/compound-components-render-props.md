<div align="center">

# Compound components / render props

<sub>⚛️ React · 🔴 Hard · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Compound components** share implicit state between a parent and its subcomponents through context so consumers compose the markup (`<Tabs><Tab/></Tabs>`); **render props** invert control by handing state back to a function child. Both solve "share behaviour, let the caller own the UI" — hooks now cover most cases, but these still win for **layout freedom**.

---

## 🧠 Mental model

Both patterns answer the same question: *how do I share stateful logic while letting the consumer decide what the UI looks like?* They differ in **where the flexibility lives**.

- **Compound components** flip the API from a config bag (`<Tabs tabs={[…]} activeIndex={i} />`) to a **composable JSX vocabulary** (`<Tabs><TabList><Tab/></TabList><TabPanel/></Tabs>`). The parent holds state; children read it through an implicit **context**. The consumer arranges the pieces freely — that's the whole appeal.
- **Render props** pass a **function as `children`** (or a named prop) that receives the shared state: `<Toggle>{({on, toggle}) => …}</Toggle>`. The component owns the logic; the caller owns every pixel of the render.

The through-line: **separate behaviour from presentation.** A `<select>`-style config prop dictates the UI; these patterns hand the UI back to the caller.

## ⚙️ How it actually works

**Compound components** rely on context, not on inspecting `children`. The old approach cloned children with `React.cloneElement` to inject props — brittle, breaks with wrapping `<div>`s, only reaches direct children. The modern approach: the root provides a context; each subcomponent consumes it. This is why `<Tab>` works no matter how deeply you nest it.

```
<Tabs>              ← provides { active, setActive } via context
  <TabList>
    <Tab index={0}/> ← consumes context; highlights if active === 0
  </TabList>
  <TabPanel index={0}/> ← consumes context; renders only if active === 0
</Tabs>
```

**Render props** work because `children` can be *anything*, including a function. The component calls `children(state)` in its own render. The historical downside — a new function every render creating "wrapper hell" when nested — is exactly the itch **hooks** were built to scratch: a custom hook returns the same state without the JSX nesting or the extra component.

## 💻 Code

Compound component with context (the modern form):

```jsx
const TabsContext = createContext(null);

function Tabs({ children, defaultIndex = 0 }) {
  const [active, setActive] = useState(defaultIndex);
  const value = useMemo(() => ({ active, setActive }), [active]); // stable value
  return <TabsContext.Provider value={value}>{children}</TabsContext.Provider>;
}

function Tab({ index, children }) {
  const { active, setActive } = useContext(TabsContext);
  return (
    <button aria-selected={active === index} onClick={() => setActive(index)}>
      {children}
    </button>
  );
}
function TabPanel({ index, children }) {
  const { active } = useContext(TabsContext);
  return active === index ? <div role="tabpanel">{children}</div> : null;
}
Tabs.Tab = Tab;         // attach for the <Tabs.Tab/> namespace ergonomics
Tabs.Panel = TabPanel;

// Consumer composes freely — wrapping divs, ordering, extra markup all fine:
<Tabs>
  <div className="bar"><Tabs.Tab index={0}>One</Tabs.Tab></div>
  <Tabs.Panel index={0}>First panel</Tabs.Panel>
</Tabs>;
```

Render props → now usually a custom hook:

```jsx
// Render prop
function Toggle({ children }) {
  const [on, setOn] = useState(false);
  return children({ on, toggle: () => setOn((v) => !v) });
}
<Toggle>{({ on, toggle }) => <Switch on={on} onClick={toggle} />}</Toggle>;

// Same logic as a hook — no wrapper component, no nesting
function useToggle(init = false) {
  const [on, setOn] = useState(init);
  return [on, () => setOn((v) => !v)];
}
```

## ⚖️ Trade-offs

- **Compound components buy layout freedom at the cost of an implicit contract.** The pieces only work inside the parent; used alone they crash or no-op. Guard with a context check that throws a helpful error.
- **`cloneElement` is a smell.** It can't reach nested children and breaks when consumers add wrappers. Use context.
- **Render props → prefer hooks** for logic reuse; they avoid the extra tree node and the new-function-per-render churn. Render props still shine when the shared thing genuinely needs to *render* (e.g. a virtualizer or measurement component that owns a DOM node and hands back size).
- **When NOT to use compound components:** a simple, fixed UI with no composition need — a config-prop component is less machinery.

## 💣 Gotchas interviewers probe

- **"How do children get the state?"** Context, not prop-drilling or `cloneElement`. Saying `cloneElement` is a dated answer; naming its limitations is the senior signal.
- **Unstable context `value`.** A new object each render re-renders every subcomponent — memoise the provider value.
- **Render props vs hooks.** Be ready to say hooks superseded most render-prop usage for *logic*, and *why* (no wrapper hell, no per-render function). Know the case where render props still win.
- **Accessibility isn't free.** A DIY `<Tabs>` needs `role="tablist"`, `aria-selected`, roving `tabindex`, and arrow-key navigation — the hard part these patterns don't hand you.
- **`Tabs.Tab` namespacing** is ergonomics, not magic — it just attaches the child to the parent function so imports stay tidy.
- **Nested render props** create the "callback pyramid" — the exact anti-pattern hooks fixed.

## 🎯 Say this in the interview

> "Both patterns separate behaviour from presentation so the caller owns the UI. Compound components turn a config-bag API into a composable JSX vocabulary — `<Tabs><Tab/><TabPanel/></Tabs>` — where the root holds state and the children read it through context. I stress context specifically, because the old `cloneElement` approach can't reach nested children and breaks when someone wraps a piece in a div. The trade-off is an implicit contract: the subcomponents only work inside the parent, so I throw a clear error if the context is missing, and I memoise the provider value so I don't re-render every child. Render props solve the same problem by passing a function child that receives the state, but hooks have largely replaced them for logic reuse because they avoid wrapper hell and a new function every render — I'd reach for a custom hook first, and keep render props only when the shared thing genuinely needs to render, like a measurement or virtualization component."

## 🔗 Go deeper

- [patterns.dev — React patterns](https://www.patterns.dev/react) — compound components, render props, and how hooks reshaped them.
- [react.dev — Passing data with context](https://react.dev/learn/passing-data-deeply-with-context) — the mechanism compound components are built on.
- [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — why hooks superseded most render-prop usage.
- [WAI-ARIA — Tabs pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) — the accessibility contract a hand-built `<Tabs>` must satisfy.
