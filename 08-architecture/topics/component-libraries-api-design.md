<div align="center">

# Component libraries & API design

<sub>🏛️ Architecture · 🟡 Medium · ⏱ 1h · `#components` `#design-systems`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A component's props *are* its public API, and the whole craft is choosing the right amount of flexibility: too few props and teams fork it, too many and it becomes an unmaintainable config bag — the senior move is reaching for **composition** (children/slots) instead of piling on `boolean` props.

---

## 🧠 Mental model

Every prop you expose is a promise you have to keep forever. That reframes API design from "what options might someone want" to "what am I willing to support across every future version". The failure mode has a name: **prop explosion** — a `<Button>` that started clean grows `isLoading`, `leftIcon`, `rightIcon`, `iconOnly`, `fullWidth`, `loadingText`… until it's a settings panel pretending to be a button, and every combination is a state you must test.

The escape is **inversion of control via composition**. Instead of `<Button leftIcon={...} loadingText="...">`, you let the *caller* compose: `<Button><Spinner /> Saving…</Button>`. You give them structural slots and get out of the way. The guiding question isn't "should this be configurable?" but "**should the component decide this, or should the caller?**" Push decisions outward and your API stays small while remaining infinitely flexible.

## ⚙️ How it actually works

Component APIs fall on a control spectrum, from most opinionated to most flexible:

1. **Config props** — `<Select options={[...]} />`. Fast to use, rigid. Every new need is a new prop. Fine for narrow, stable components.
2. **Compound components** — `<Select><Select.Option/></Select>`, sharing state via context. The caller controls structure; the component owns behaviour. This is the sweet spot for anything with variable content.
3. **Render props / slots** — `renderItem={(item) => ...}`. Hand rendering back to the caller entirely.
4. **Headless hooks** — `useSelect()` returns state + prop-getters, zero markup. Maximum flexibility, maximum caller responsibility.

Two mechanisms every senior component gets right:

- **Controlled vs uncontrolled.** Support both: `value`/`onChange` (controlled) *and* `defaultValue` (uncontrolled). React's rule — a prop is controlled if `value !== undefined` — must be decided once and stay stable, or you get the "changing from uncontrolled to controlled" warning and lost state.
- **Prop forwarding + `ref`.** A library component that swallows `className`, `aria-*`, `onClick`, and `ref` is broken. Spread `...rest` onto the real DOM node and forward the ref, so consumers can style, label, and measure it. This is the difference between a component people can live with and one they fork.

## 💻 Code

```tsx
// ❌ Prop explosion: every new need adds a boolean; combinations multiply.
<Button
  isLoading loadingText="Saving…"
  leftIcon={<Save />} rightIcon={<Arrow />}
  iconOnly={false} fullWidth
/>

// ✅ Composition: the caller composes content; the API stays tiny.
<Button variant="primary" fullWidth>
  <Save /> Saving…
</Button>
```

```tsx
// ✅ Controlled AND uncontrolled, plus forwarding + ref — the senior baseline
const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(function Toggle(
  { checked, defaultChecked, onChange, className, ...rest }, ref,
) {
  const isControlled = checked !== undefined;      // React's rule, decided once
  const [internal, setInternal] = useState(defaultChecked ?? false);
  const on = isControlled ? checked : internal;

  return (
    <button
      ref={ref}                                    // forward the ref
      role="switch" aria-checked={on}              // a11y baked in
      className={cn('ds-toggle', className)}        // merge, don't swallow
      onClick={() => { if (!isControlled) setInternal(!on); onChange?.(!on); }}
      {...rest}                                    // forward aria-*, data-*, id…
    />
  );
});
```

## ⚖️ Trade-offs

- **When NOT to invert control:** a genuinely fixed, single-purpose component (a branded `<Avatar>`) doesn't need compound APIs or slots — that's flexibility nobody asked for and extra surface to document. Match the API's openness to how much the content actually varies.
- **Compound components cost ergonomics.** `<Select><Select.Trigger/><Select.Content/></Select>` is more powerful but more verbose than `<Select options={...} />`. For a simple, stable case the config prop is kinder to callers. Flexibility is not free.
- **Every prop is a support burden.** More props ⇒ more combinations ⇒ more tests, docs, and bug surface. A smaller API you can evolve beats a huge one you can't change without breaking someone.
- **Headless is maximally flexible and maximally demanding** — the caller now owns markup and styling. Great for a library serving many design languages; overkill for one product's internal button.

## 💣 Gotchas interviewers probe

- **Prop explosion → composition.** The single highest-signal answer here. If asked to design a `<Button>` and you start listing boolean props, you've failed; if you reach for children/slots, you've passed.
- **Controlled vs uncontrolled** — must support both, and know React's `value !== undefined` rule. Flipping between them mid-life is a classic React warning and a real bug.
- **Swallowing `className`, `ref`, `aria-*`, and event handlers** makes a component unusable in a real app — no styling, no measuring, no labelling. Spread `...rest` and `forwardRef`. Interviewers specifically probe this.
- **Boolean-trap APIs.** `<Modal show close />` — meaningless at the call site. Prefer explicit unions (`variant="primary"`) over many booleans, and enums over magic strings.
- **Breaking changes are semver events.** Renaming a prop breaks every consumer; you deprecate and codemod, you don't just rename. The API being *public* is the whole point.

## 🎯 Say this in the interview

> "I treat a component's props as its public API — every prop is a promise I have to keep across versions, so I keep the surface small. The failure mode I design against is prop explosion, where a button slowly grows a dozen booleans and every combination is a state to test. The fix is inverting control with composition: give the caller children and slots instead of configuration props, so the question becomes 'should the component decide this or should the caller?' For anything with variable content I reach for compound components sharing context. And there are non-negotiables: support both controlled and uncontrolled with a stable rule, forward the ref, and spread the rest of the props so `className`, `aria-*`, and event handlers reach the real DOM node — a component that swallows those gets forked. I match the API's openness to how much the content actually varies; a fixed branded component doesn't need any of this."

## 🔗 Go deeper

- [react.dev — Sharing State Between Components](https://react.dev/learn/sharing-state-between-components) — controlled/uncontrolled and lifting state, the foundation of component APIs.
- [react.dev — Passing JSX as children](https://react.dev/learn/passing-props-to-a-component#passing-jsx-as-children) — composition and slot thinking.
- [Kent C. Dodds — Compound Components](https://kentcdodds.com/blog/compound-components-with-react-hooks) — the pattern for flexible APIs via context.
- [Radix Primitives](https://www.radix-ui.com/primitives) — a reference library for `asChild`, compound APIs, and correct prop forwarding.
