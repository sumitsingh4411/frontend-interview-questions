<div align="center">

# HOCs

<sub>⚛️ React · 🟡 Medium · ⏱ 30m · `#patterns`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A higher-order component is a **function that takes a component and returns a wrapped component** with extra props/behaviour (`withAuth(Page)`); it was the pre-hooks way to share logic, and for **logic reuse hooks have replaced it** — but HOCs still earn their keep for cross-cutting *rendering* concerns like error/loading wrappers and instrumentation.

---

## 🧠 Mental model

An HOC is the component-level echo of a higher-order *function*: `map`/`filter` take a function and return a function; an HOC takes a component and returns a component. It's a **decorator** — it wraps your component to inject props, guard rendering, or add behaviour, without the wrapped component knowing.

Before hooks, this was *the* answer to "how do I share stateful logic across components?" You'd write `withRouter`, `connect` (Redux), `withStyles`, and compose them. Hooks then offered the same reuse **without adding a wrapper to the tree** — which is why HOCs faded for logic sharing. But an HOC does one thing a hook fundamentally cannot: **wrap the rendered output**. A hook can give you `isLoading`; only an HOC (or a wrapper component) can *replace* the whole render with a spinner.

## ⚙️ How it actually works

An HOC returns a new component that renders the original, forwarding props and adding its own:

```
withAuth(Profile)  →  function AuthWrapped(props) {
                        const user = useUser();
                        if (!user) return <Login/>;
                        return <Profile {...props} user={user}/>;
                      }
```

Three things separate a correct HOC from a broken one:

1. **Pass through props.** Spread `{...props}` so you don't swallow the consumer's props.
2. **Forward refs.** A ref on the wrapped component hits the *wrapper*, not the inner component — you must forward it (historically `forwardRef`; in React 19 the `ref` prop). Forgetting this is the classic HOC bug.
3. **Hoist statics & set `displayName`.** The wrapper loses the inner component's static methods and shows up as `Anonymous`/`AuthWrapped` in DevTools — hoist statics (`hoist-non-react-statics`) and set `WrappedComponent.displayName = `withAuth(${name})``.

**Don't create the HOC inside render** — `const C = withX(Inner)` in a render body makes a brand-new component type every render, remounting the subtree and losing all its state.

## 💻 Code

```jsx
// A rendering-concern HOC: swaps the whole output while loading. A hook can't do this.
function withLoading(Component) {
  function WithLoading({ isLoading, ...rest }) {
    if (isLoading) return <Spinner />;
    return <Component {...rest} />;   // ✅ forward remaining props
  }
  WithLoading.displayName = `withLoading(${Component.displayName || Component.name})`;
  return WithLoading;
}

const UserListWithLoading = withLoading(UserList); // ✅ at module scope, once

// ❌ Never do this — new type every render → remount + lost state
function Page({ isLoading }) {
  const Wrapped = withLoading(UserList); // recreated each render!
  return <Wrapped isLoading={isLoading} />;
}

// The same LOGIC as a hook — no wrapper node, composes trivially
function UserList() {
  const { data, isLoading } = useUsers();
  if (isLoading) return <Spinner />;
  return data.map((u) => <Row key={u.id} user={u} />);
}
```

## ⚖️ Trade-offs

- **For logic reuse, prefer hooks.** No extra tree node, no ref/statics forwarding, no "wrapper hell" when you stack five HOCs, and the data dependencies are explicit at the call site instead of hidden in injected props.
- **HOCs still win for cross-cutting *render* wrapping:** error boundaries, loading/empty-state wrappers, analytics/impression tracking, feature-flag gating, code-splitting wrappers. Anything that must sit *around* the component.
- **Prop-name collisions & opacity.** Injected props can clash with the consumer's, and it's not obvious from the JSX where a prop came from — a real maintenance cost of deep HOC stacks.
- **When NOT to use HOCs:** anything a hook can express. Reaching for an HOC to share `useState`-style logic in 2025 is a code smell.

## 💣 Gotchas interviewers probe

- **Refs don't pass through automatically.** A ref lands on the wrapper; you must forward it. The number-one HOC bug.
- **Static methods are lost** on the wrapper — hoist them, or `Component.someStatic` becomes `undefined`.
- **Creating the HOC in render** → new component type each render → full remount and state loss. Always compose at module scope.
- **`displayName`** — without it, DevTools shows a wall of `Anonymous`/`Wrapper` nodes; debugging deep stacks becomes miserable.
- **"HOC vs hook?"** The expected answer: hooks replaced HOCs for logic reuse; HOCs remain for wrapping rendered output. Know both halves.
- **Wrapper hell** — stacking many HOCs deepens the tree and muddies prop provenance; hooks flatten this.

## 🎯 Say this in the interview

> "An HOC is a function that takes a component and returns a wrapped one with extra props or behaviour — the component-level version of a higher-order function, essentially a decorator. Before hooks it was how we shared stateful logic — `connect`, `withRouter` — but hooks replaced that use because they reuse logic without adding a wrapper to the tree, without ref and static forwarding, and with the dependencies visible at the call site instead of hidden in injected props. Where I still reach for an HOC is cross-cutting *rendering* concerns a hook can't express: wrapping a component in an error boundary, a loading or empty state, analytics, or feature-flag gating — anything that has to sit *around* the render. The bugs I watch for are refs, which land on the wrapper and must be forwarded; lost static methods, which I hoist; a missing `displayName` that makes DevTools unreadable; and never creating the HOC inside render, which makes a new type every render and remounts everything."

## 🔗 Go deeper

- [patterns.dev — HOC pattern](https://www.patterns.dev/react/hoc-pattern) — the pattern, its ergonomics, and where hooks replace it.
- [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — the modern default for logic reuse.
- [react.dev — `forwardRef`](https://react.dev/reference/react/forwardRef) — forwarding refs through a wrapper (and the React 19 `ref`-prop replacement).
- [hoist-non-react-statics](https://github.com/mridgway/hoist-non-react-statics) — copying static methods onto the wrapper so they survive.
