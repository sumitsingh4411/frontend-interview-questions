<div align="center">

# Component architecture & composition

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 1h · `#components` `#patterns`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Good component architecture is about **where complexity lives**, not how many components you have. Composition (passing behaviour and UI *in*, via `children`/slots) beats configuration (adding another boolean prop) because it keeps components open to cases you didn't predict — the cost is that the caller now assembles the pieces.

---

## 🧠 Mental model

A component has two audiences: the **screen** and the **next engineer who calls it**. Most component design mistakes come from optimising only for the screen. The real architectural question is: *when a new requirement lands, do I add a prop, or does the call site absorb it?*

There's a spectrum:

```
configuration  ◀───────────────────────────────▶  composition
add a prop          headless / render props           pass JSX in
<Modal fancy />   <Modal>{(api) => ...}</Modal>   <Modal><Header/>...</Modal>
closed, opinionated                                   open, flexible
easy first call                                       easy hundredth call
```

Configuration is cheaper for the *first* caller and gets exponentially more expensive as variants pile up (`<Button primary large loading iconLeft rounded>`). Composition front-loads a little ceremony at the call site in exchange for a component that never needs another boolean.

## ⚙️ How it actually works

The core primitive is that **`children` (and any prop that holds JSX) is just a value you slot into the tree.** That's what makes "composition" mechanical rather than magical — you're deciding which parts of the render tree the parent owns and which the caller provides.

Three patterns, in order of how much control they hand back:

1. **Slots** — accept `children` or named JSX props (`header`, `footer`). The component owns layout; the caller owns content. This is 80% of real-world composition.
2. **Compound components** — a set of components that share implicit state via context (`<Tabs>`, `<Tabs.List>`, `<Tabs.Tab>`). The parent coordinates; the children stay declarative. The caller controls *structure*, not just content.
3. **Headless components / hooks** — the component owns behaviour and state but renders nothing (`useCombobox`, Radix primitives). The caller owns 100% of the markup. Maximum flexibility, maximum caller responsibility.

The senior insight: **"prop explosion" is a design smell that composition fixes.** When you see a component with 15 props, half of which are booleans that toggle bits of markup, the component is trying to be a config language for a shape that wants to be JSX.

## 💻 Code

```jsx
// ❌ Configuration: every new need is another prop. This never stops growing.
<Card
  title="Report"
  subtitle="Q3"
  showFooter
  footerText="Updated today"
  headerIcon={<Icon />}
  badge="new"
  badgeColor="green"
/>

// ✅ Composition: the Card owns spacing + elevation; the caller owns content.
<Card>
  <Card.Header>
    <Icon /> Report <Badge tone="green">new</Badge>
  </Card.Header>
  <Card.Body>…</Card.Body>
  <Card.Footer>Updated today</Card.Footer>
</Card>
```

Compound components share state without prop-drilling:

```jsx
const TabsContext = createContext(null);

function Tabs({ defaultValue, children }) {
  const [value, setValue] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ value, setValue }}>
      {children}                 {/* caller controls structure */}
    </TabsContext.Provider>
  );
}
Tabs.Tab = function Tab({ value, children }) {
  const ctx = useContext(TabsContext);
  return (
    <button aria-selected={ctx.value === value}
            onClick={() => ctx.setValue(value)}>
      {children}
    </button>
  );
};
```

## ⚖️ Trade-offs

- **Composition pushes complexity to the call site.** That's usually right — but if 40 call sites all assemble the same five sub-components identically, you've traded one bad prop for copy-paste. The fix is a *second*, opinionated wrapper built on the flexible one. Ship both layers.
- **Don't abstract on the first repetition.** A component extracted from a single use case bakes in assumptions you can't yet see; you'll fight it at use #2. Wait for the pattern to prove itself (rule of three).
- **When NOT to compose:** a genuinely closed, single-purpose element (an `<Avatar>`, a `<Spinner>`) should just take props. Compound components for something with no internal coordination is ceremony for its own sake.
- **Context-based compound components have a performance cost** — every consumer re-renders when the shared value changes. Fine for a tab set, wrong for a 10,000-row table cell.

## 💣 Gotchas interviewers probe

- **"Composition over inheritance" — do you know *why* React chose this?** React has no meaningful class inheritance for UI because behaviour reuse composes far better as hooks/children than as a base-class hierarchy. If you reach for `extends BaseButton`, you've imported an OO problem React deliberately doesn't have.
- **Prop drilling is not automatically bad.** Passing a prop through two layers is fine and explicit. Context is the fix for *deep* or *wide* sharing, not for "I passed something through one component I didn't want to."
- **Booleans that are mutually exclusive should be one enum.** `primary`, `secondary`, `danger` as three booleans lets a caller set all three. `variant="danger"` makes the illegal state unrepresentable.
- **`children` typing.** `ReactNode` accepts anything renderable; a render-prop `children` is a *function*. Mixing them silently breaks. Interviewers notice if you know the difference.
- **Over-composition is a real failure mode.** Ten tiny components where three would do makes the tree harder to read, not easier. Granularity should follow *reuse and change boundaries*, not a rule that "components should be small."

## 🎯 Say this in the interview

> "I think about component architecture as deciding where complexity lives — in the component's prop API, or at the call site. My default is composition: I let a component own layout, spacing and behaviour, and I pass the actual content in through `children` or slots. That keeps it open to cases I didn't anticipate without me adding yet another boolean prop, which is how components rot into 15-prop config languages. For things that need to coordinate — tabs, menus, accordions — I use compound components sharing state through context, so the caller controls structure declaratively. The trade-off I'm honest about is that composition moves assembly to the call site, so if I see the same five pieces wired up identically everywhere, I ship a second opinionated wrapper on top of the flexible one. And I don't abstract early — I wait for the third real repetition, because a component extracted too soon bakes in the wrong assumptions."

## 🔗 Go deeper

- [patterns.dev — Design patterns](https://www.patterns.dev/) — compound components, render props, and container patterns with runnable examples.
- [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) — the primitive that makes composition mechanical.
- [react.dev — Choosing the state structure](https://react.dev/learn/choosing-the-state-structure) — where state should live relative to your component tree.
- [Kent C. Dodds — Compound components with context](https://kentcdodds.com/blog/compound-components-with-react-hooks) — the canonical write-up of the pattern.
