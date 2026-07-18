<div align="center">

# Testing hooks

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#rtl` `#hooks`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Hooks can't run outside a component, so `renderHook` mounts a throwaway host component to call yours and hands back a `result.current` reference — but the *default* answer is usually "test the component that uses the hook", and `renderHook` earns its place only for reusable, standalone hooks.

---

## 🧠 Mental model

A hook is not a function you can call — it's a function that only means anything **inside React's render cycle**, because it reads from the fiber's hook linked-list. Calling `useCounter()` in a test throws "Invalid hook call".

`renderHook` solves this with a trick: it renders a tiny internal component whose entire body is `result.current = callback()`. That's it. So `renderHook` is not a special hook runtime — it's **a component test where the component is invisible and the assertion target is a return value.**

The important judgement call: a hook is an implementation detail of the components that use it. If `useFilteredList` exists only to serve `<ProductList>`, testing the list gives you more confidence per test. Reach for `renderHook` when the hook is a genuine reusable API — a published package, a shared `useDebounce`, a data-fetching primitive many features consume.

## ⚙️ How it actually works

**`result.current` is a snapshot, not a live binding.** It's re-assigned on every render. Destructuring it once and asserting later gives you a *stale* value — the single most common mistake.

**`act()` is how you flush.** Any state update triggered outside React's own event handling must be wrapped in `act()`, which tells React "I'm about to cause updates; process effects and re-render before returning". RTL wraps `render` and `userEvent` for you, but a bare `result.current.increment()` is *your* call to wrap.

**`rerender(newProps)`** re-invokes the callback with new arguments — that's how you test dependency-array behaviour, memoisation, and prop-change effects.

**`unmount()`** triggers effect cleanup — the only way to assert that your hook removes its listeners, aborts its fetch, or clears its interval.

## 💻 Code

```jsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useCounter } from './useCounter';

test('increments', () => {
  const { result } = renderHook(() => useCounter({ initial: 5 }));

  // ❌ stale: `count` captured the value from the FIRST render
  // const { count, increment } = result.current;
  // act(() => increment());
  // expect(count).toBe(6); // still 5 — fails

  // ✅ always read through result.current at assertion time
  expect(result.current.count).toBe(5);
  act(() => result.current.increment()); // wrap: state update outside React
  expect(result.current.count).toBe(6);
});

test('reacts to changed props', () => {
  const { result, rerender } = renderHook(({ id }) => useUser(id), {
    initialProps: { id: 1 },
  });
  rerender({ id: 2 }); // exercises the dependency array
  expect(result.current.id).toBe(2);
});

test('cleans up its subscription on unmount', () => {
  const off = vi.fn();
  vi.spyOn(window, 'addEventListener');
  const { unmount } = renderHook(() => useOnResize(off));
  unmount();
  expect(window.removeEventListener).toHaveBeenCalled();
});
```

```jsx
// Hooks that need context — pass a wrapper:
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);
const { result } = renderHook(() => useProducts(), { wrapper });
await waitFor(() => expect(result.current.isSuccess).toBe(true));
```

## ⚖️ Trade-offs

- **Isolation vs realism.** `renderHook` tests the hook's contract precisely and fast — but a green hook test plus a broken component is entirely possible. Component tests catch integration mistakes (wrong argument, missing provider) that hook tests can't.
- **Reusable hooks deserve direct tests.** For a library hook with many call shapes, testing every permutation through a component is slow and noisy. Direct tests are the right tool.
- **When NOT to use it:** a hook that exists for exactly one component. Testing it separately doubles your maintenance and couples tests to an internal API — you'll rewrite them the moment you inline the logic. Test the component instead.
- **Never export internals just to test them.** If a hook is hard to test, that's usually a design signal (too many responsibilities), not a tooling gap.

## 💣 Gotchas interviewers probe

- **Destructuring `result.current` too early.** The classic. `result.current` is replaced each render; destructured values are frozen snapshots.
- **Missing `act()`.** Calling a setter directly without `act` gives "An update to TestComponent was not wrapped in act" and assertions that read pre-update state.
- **`act` vs `await act`.** If the update chain includes promises, you need `await act(async () => {...})` — or better, `waitFor`, which retries until the assertion passes.
- **`renderHook` moved.** It used to live in `@testing-library/react-hooks`; since React 18 it's built into `@testing-library/react`. Naming the old package unprompted dates you.
- **StrictMode double-invocation.** In dev/StrictMode React mounts, unmounts, and remounts effects. A hook with a non-idempotent effect passes in a plain test and breaks in the app — test under StrictMode to catch it.
- **Not testing cleanup.** Listener and timer leaks are the most common real hook bug, and only `unmount()` surfaces them. Most candidates never write this test.
- **Async hooks need `waitFor`, not arbitrary sleeps.** `await new Promise(r => setTimeout(r, 100))` is a flake generator.

## 🎯 Say this in the interview

> "Hooks only work inside a render, so `renderHook` mounts a tiny host component that calls the hook and exposes its return value as `result.current`. Two things I'm careful about: `result.current` is re-assigned each render, so I always read through it at assertion time rather than destructuring early, and any state update I trigger myself gets wrapped in `act` so React flushes before I assert. I use `rerender` to exercise dependency arrays and `unmount` to prove the hook cleans up its listeners — that cleanup test catches the most common real bug and most people skip it. But my default is to test the component that uses the hook. A hook used by one component is an implementation detail; I only test it directly when it's a genuinely reusable API with many call shapes."

## 🔗 Go deeper

- [Testing Library — `renderHook`](https://testing-library.com/docs/react-testing-library/api/#renderhook) — the API, `initialProps`, `wrapper`, `rerender`.
- [react.dev — Reusing logic with custom hooks](https://react.dev/learn/reusing-logic-with-custom-hooks) — what belongs in a hook in the first place.
- [react.dev — Synchronizing with effects](https://react.dev/learn/synchronizing-with-effects) — cleanup semantics you should be asserting on.
- [Kent C. Dodds — Testing custom hooks](https://kentcdodds.com/blog/how-to-test-custom-react-hooks) — the "test the component instead" argument in full.
