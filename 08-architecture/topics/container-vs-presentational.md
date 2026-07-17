<div align="center">

# Container vs presentational

<sub>🏛️ Architecture · 🟢 Easy · ⏱ 30m · `#patterns`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Split a component into a **presentational** part (props in, JSX out, no idea where data comes from) and a **container** (fetches, subscribes, holds state, renders the presentational one). Hooks made the *literal* two-component version mostly obsolete, but the underlying principle — **isolate I/O from rendering** — is more relevant than ever.

---

## 🧠 Mental model

The pattern answers one question: *how much does this component know about the outside world?*

| | Presentational | Container |
|---|---|---|
| Concerned with | how it **looks** | how it **works** |
| Data | receives via props | fetches / subscribes |
| State | UI-only (open/hover) | app/server state |
| Reusable? | highly — pure of context | rarely — tied to a data source |
| Testable with | just props | mocks, providers, network |

The value isn't the folder split. It's that a **pure, dumb component is trivially testable, storybook-able, and reusable**, because it has no hidden dependencies. All the messy, hard-to-test parts — network, global state, side effects — get quarantined in a thin shell.

## ⚙️ How it actually works

Dan Abramov popularised this in 2015, then in 2019 added a note that he **no longer recommends splitting components this way** as a rule, because **hooks let you extract the same stateful/impure logic without an extra component layer.** This is the part interviewers want you to know — quoting the pattern as gospel signals you stopped reading in 2016.

Here's the evolution:

- **2015:** container component owns `componentDidMount` + `setState`, passes data down. Presentational component is a pure function of props.
- **Today:** a **custom hook** is the container. `useUser(id)` does the fetching/subscribing; the component that calls it is still "presentational" in spirit — it just reads a hook instead of receiving a prop.

So the modern framing is: **the boundary moved from a component boundary to a hook boundary.** The principle survived; the mechanism changed. What you're really doing is keeping the *rendering function* free of I/O so it stays a predictable `props → JSX` mapping.

## 💻 Code

```jsx
// The presentational component — pure. Doesn't know Redux/fetch/anything exists.
function UserCard({ user, isLoading, onRefresh }) {
  if (isLoading) return <Spinner />;
  return (
    <article>
      <h2>{user.name}</h2>
      <button onClick={onRefresh}>Refresh</button>
    </article>
  );
}

// ── Classic container (2015 style): a whole component just to wire data ──
class UserCardContainer extends React.Component {
  state = { user: null, loading: true };
  componentDidMount() { fetchUser(this.props.id).then(user => this.setState({ user, loading: false })); }
  render() {
    return <UserCard user={this.state.user} isLoading={this.state.loading}
                     onRefresh={() => this.setState({ loading: true })} />;
  }
}

// ── Modern equivalent: the "container" is a hook. No extra component. ──
function useUser(id) {
  const { data, isLoading, refetch } = useQuery(['user', id], () => fetchUser(id));
  return { user: data, isLoading, onRefresh: refetch };
}

// The screen stays thin; the impure part is a named, testable hook.
function UserScreen({ id }) {
  return <UserCard {...useUser(id)} />;
}
```

## ⚖️ Trade-offs

- **The principle is timeless; the two-component version is often overhead.** For most components, a custom hook gives you the same separation with one fewer file and no prop-passing boilerplate. Don't split into container/presentational *by default*.
- **When the literal split still earns its keep:** design-system components you publish (they *must* be pure of your app's data layer), components you want to render in Storybook/visual tests without a network, and any component reused across two different data sources.
- **The failure mode is dogma:** teams that mechanically create a `FooContainer` for every `Foo` end up with a maze of pass-through files that add indirection and zero value.
- **Don't confuse this with "smart vs dumb" being a *quality* judgement.** A presentational component isn't lesser; it's where all your accessibility and visual correctness lives.

## 💣 Gotchas interviewers probe

- **"Is this pattern still recommended?"** The honest answer — *not as a blanket rule.* Abramov himself walked it back once hooks shipped. Say that. It's the difference between reciting and understanding.
- **Hooks didn't kill the concept — they relocated it.** A component reading `useQuery` directly is still doing container work; the separation is now "impure hook vs pure render", not "two components".
- **A presentational component with `useState` is fine.** *UI* state (is the dropdown open, is the input focused) is presentational. The line is about **app/server state and side effects**, not "any state at all". Candidates often over-purify.
- **Containers shouldn't render layout.** A container that also does flexbox is doing two jobs. Keep it a thin data shell so the presentational component stays the single source of visual truth.
- **This is orthogonal to state-management choice.** Redux, Zustand, React Query, or plain `fetch` — the pattern is about *where* the wiring lives, not *what* library does the wiring.

## 🎯 Say this in the interview

> "It's the separation between a presentational component — pure, just props in and JSX out, no idea where its data comes from — and a container that does the fetching, subscribing and state-holding, then feeds the presentational one. The point is to quarantine the hard-to-test parts, network and global state, so the visual component stays a predictable mapping from props to markup that I can Storybook and unit-test trivially. I'd be upfront that the *literal* two-component version is largely obsolete: hooks let me extract the exact same impure logic into a custom hook — `useUser(id)` — without a second component, and Abramov himself stopped recommending the split once hooks landed. So the boundary moved from a component boundary to a hook boundary, but the principle, isolate I/O from rendering, is if anything more important now. I still do the full split for design-system components I publish, because those genuinely must be pure of my app's data layer."

## 🔗 Go deeper

- [Dan Abramov — Presentational and Container Components](https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0) — the original article, including his 2019 note walking it back.
- [patterns.dev — React patterns](https://www.patterns.dev/react) — container/presentational alongside the hook patterns that superseded it.
- [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — how the container's job became a hook.
- [Kent C. Dodds — When to break up a component](https://kentcdodds.com/blog/when-to-break-up-a-component-into-multiple-components) — pragmatic guidance on splitting.
