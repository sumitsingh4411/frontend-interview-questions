<div align="center">

# Custom hooks

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#hooks` `#patterns`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A custom hook is just a function that calls other hooks; it shares *stateful logic*, never *state itself*. Every component that calls `useCounter()` gets its own completely independent counter — the code is shared, the state is not.

---

## 🧠 Mental model

Before hooks, sharing logic meant sharing *component structure* — HOCs and render props wrapped your tree in layers just to pass a value down. Hooks broke that coupling: **logic is now a plain function call, not a component**.

The single idea that makes everything else fall out:

> A custom hook is **not a shared module with shared state**. It is a **recipe that is re-executed per component instance**.

```
useCounter()  ──called by──►  <A/>  ──►  A's own count  (state cell #0 in A's fiber)
              ──called by──►  <B/>  ──►  B's own count  (state cell #0 in B's fiber)
```

Two components, one function, zero shared state. If you actually want shared state, you need Context or a store — a hook alone will never give you that, and misunderstanding this is the #1 thing juniors get wrong.

## ⚙️ How it actually works

There is **no magic in the `use` prefix**. React doesn't inspect it at runtime. It exists for two reasons: the linter (`eslint-plugin-react-hooks`) uses it to know that Rules of Hooks apply inside the function, and humans use it as a signal that the function may be stateful.

The real mechanism is the **hook call order**. Each fiber holds a linked list of hook state cells. On every render, React walks that list in order — `useState` #1, `useEffect` #2, and so on — matching call *position* to cell. A custom hook is inlined into the caller's sequence:

```
function Profile() {          Profile's hook list:
  useUser()  ─┐                 [0] useState   (from useUser)
              └── expands to    [1] useEffect  (from useUser)
  useState()                    [2] useState   (Profile's own)
}
```

That's why hooks can't be conditional: a conditional call shifts every subsequent index, and React hands cell #1's state to the hook that expected cell #2. React 19's Compiler doesn't change this — it's the runtime's core invariant.

Two consequences worth naming out loud:

- **Composition is free.** A custom hook can call other custom hooks arbitrarily deep; it's just function calls flattening into one list.
- **A custom hook re-renders its caller.** If `useWindowSize()` sets state on every `resize`, *every component using it* re-renders on every resize. Custom hooks distribute re-render cost, so put a `throttle`/`useSyncExternalStore` inside them, not in the caller.

## 💻 Code

The classic mistake — an effect used as a data-fetching engine with no cleanup:

```jsx
// ❌ Race condition: a slow request for user 1 can resolve AFTER user 2's.
function useUser(id) {
  const [user, setUser] = useState(null);
  useEffect(() => {
    fetch(`/api/users/${id}`).then(r => r.json()).then(setUser);
  }, [id]);
  return user;
}
```

```jsx
// ✅ Ignore stale responses. This "ignore" flag is the canonical React fix.
function useUser(id) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let ignore = false;
    setState({ status: 'loading', user: null }); // reset when id changes
    fetch(`/api/users/${id}`)
      .then(r => r.json())
      .then(user => { if (!ignore) setState({ status: 'ready', user }); })
      .catch(err => { if (!ignore) setState({ status: 'error', err }); });
    return () => { ignore = true; }; // runs before the next effect / on unmount
  }, [id]);

  return state; // return a state MACHINE, not 3 loose booleans
}
```

Subscribing to something external? Don't reach for `useEffect` + `useState` — that tears under concurrent rendering. Use the purpose-built hook:

```jsx
// ✅ Concurrent-safe external subscription.
const subscribe = (cb) => {
  const mql = window.matchMedia('(max-width: 600px)');
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
};

function useIsMobile() {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia('(max-width: 600px)').matches, // client snapshot
    () => false                                            // server snapshot (SSR)
  );
}
```

Returning a **stable API** matters. Return an object for 3+ values (named, order-free), an array only when the caller should be free to rename (`const [value, setValue] = useToggle()`), and keep returned callbacks referentially stable with `useCallback` **if** consumers put them in dependency arrays.

## ⚖️ Trade-offs

- **Custom hooks hide re-render cost.** `useAuth()` looks free at the call site, but if it reads a Context that changes often, every consumer re-renders. The abstraction is transparent to reads and *opaque to performance* — that's the real cost.
- **Don't extract a hook after one use.** Two call sites with genuinely identical logic is the threshold. Premature extraction produces `useThing(a, b, { mode, variant })` — a config-object monster that's harder to read than the two copies it replaced.
- **A hook is not a service layer.** If the logic has no state, no effect and no context, it's a plain function — call it `formatPrice`, not `usePrice`. Naming it `use*` invites the linter to police dependency arrays for no reason and blocks you from calling it conditionally.
- **Effects are the last resort, not the tool.** The most common "custom hook" is `useEffect` synchronising derived state that should just be computed during render. Read *You Might Not Need an Effect* before extracting one.

## 💣 Gotchas interviewers probe

- **"Do two components using `useCounter()` share state?"** No. Never. If someone says yes, that's a hard signal. Shared state requires Context, a store, or lifting state up.
- **Rules of Hooks aren't style — they're load-bearing.** Order-based cell lookup means an early `return` before a hook, or a hook inside `if`/`for`/a callback, corrupts state. Say *why*, not just "the linter complains".
- **`useEffect` with an object/array dependency runs every render.** `{}` !== `{}`. Depend on primitives (`id`, `query`) or memoise the object at its source.
- **Cleanup runs between renders, not just on unmount.** Every time deps change, React runs the previous cleanup first. In StrictMode dev, effects mount → unmount → mount to *surface* missing cleanup. Don't "fix" that with a `didMount` ref — fix the cleanup.
- **`useCallback`/`useMemo` inside a hook are only useful if the consumer's identity checks care.** Returning `useCallback(fn, [])` from a hook nobody memoises is pure ceremony.
- **Testing:** you don't need a fake component — `renderHook` from Testing Library exists, but the better instinct is to test the hook *through* the component that uses it, because that's the contract users experience.

## 🎯 Say this in the interview

> "A custom hook is just a function that calls hooks — it shares logic, not state. Each component that calls it gets its own independent state cells, because React inlines the hook's calls into that component's hook list and matches them by position. That call-order invariant is exactly why hooks can't be conditional. When I write one I care about three things: the dependency array is honest, the effect has a cleanup — for fetching that means an `ignore` flag to kill race conditions — and the return value is a small state machine rather than three loose booleans that can contradict each other. And I'm conscious that a hook hides re-render cost: `useWindowSize` looks free at the call site but re-renders every consumer on every resize, so the throttling belongs inside the hook."

## 🔗 Go deeper

- [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — the canonical guide, including when *not* to extract one.
- [react.dev — You might not need an effect](https://react.dev/learn/you-might-not-need-an-effect) — deletes half the custom hooks people write.
- [react.dev — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) — the correct way to subscribe to anything outside React.
- [react.dev — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) — the invariant behind the rules.
