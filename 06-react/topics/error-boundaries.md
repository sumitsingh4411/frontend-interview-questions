<div align="center">

# Error boundaries

<sub>⚛️ React · 🟡 Medium · ⏱ 30m · `#errors`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An error boundary is a **class** component with `getDerivedStateFromError`/`componentDidCatch` that catches errors thrown **during render/commit of its children** and shows a fallback instead of unmounting the whole tree — but it catches **nothing** from event handlers, async code, or the server.

---

## 🧠 Mental model

Without a boundary, a thrown error during rendering **unmounts the entire React tree** — React 16+ deliberately bails to a blank screen rather than leave a corrupted UI on screen. An error boundary is a **circuit breaker**: it wraps a subtree, and if anything inside throws while rendering, it isolates the damage to that subtree and renders a fallback while the rest of the app keeps working.

The crucial limitation lives in *when* React is in control. Boundaries only catch errors thrown **inside React's render/reconciliation/commit and lifecycle** — the synchronous call stack React itself drives. Anything React isn't on the stack for — a click handler, a `setTimeout`, a `fetch` `.then` — throws to the normal browser, and the boundary never sees it.

## ⚙️ How it actually works

There is **no hook** for this. As of React 19 you still write a class (or use `react-error-boundary`), because the two methods have no hook equivalent:

- **`static getDerivedStateFromError(error)`** — runs in the **render phase**; returns new state to switch to the fallback UI. Must be pure (no side effects).
- **`componentDidCatch(error, info)`** — runs in the **commit phase**; the place to log to Sentry/Datadog. `info.componentStack` tells you *where* it threw.

A boundary catches errors from its **descendants**, never from itself. Granularity matters: one boundary at the root turns any error into a full-page fallback; boundaries around each widget/route isolate failures so one broken chart doesn't blank the dashboard.

**What it does NOT catch** (interviewers always ask):

- Event handlers → use `try/catch`.
- Asynchronous code (`setTimeout`, promises, `fetch`) → `try/catch` + set error state.
- Server-side rendering errors (different code path).
- Errors thrown in the boundary itself.

Uncaught errors during render **remount the tree** — recovery means giving users a way to reset (a "Try again" that re-mounts the subtree by changing a `key` or resetting boundary state).

## 💻 Code

```jsx
class ErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error }; // render phase: flip to fallback. Pure.
  }
  componentDidCatch(error, info) {
    logToSentry(error, info.componentStack); // commit phase: side effects OK
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error, () =>
        this.setState({ error: null }) // reset → re-mount children, retry
      );
    }
    return this.props.children;
  }
}

// ❌ This throw is NOT caught by any boundary — it's an event handler
<button onClick={() => { throw new Error('boom'); }} />;

// ✅ Handle imperative/async errors yourself, then surface via state
async function onSave() {
  try {
    await api.save();
  } catch (e) {
    setError(e); // now render a fallback / toast from state
  }
}
```

Pair boundaries with `Suspense`: `Suspense` handles the *loading* state, the boundary handles the *failed* state — together they cover the full async lifecycle.

## ⚖️ Trade-offs

- **Granularity is a design decision.** Root-only = simple but any error blanks everything. Per-route/per-widget = resilient but more boilerplate. Put boundaries at boundaries of *independent* UI.
- **Don't swallow errors silently.** A boundary that shows a generic "something went wrong" without logging destroys your ability to debug production. Always report in `componentDidCatch`.
- **When NOT to lean on them:** for expected, recoverable failures (a failed API call, a validation error), model them as *state*, not exceptions — boundaries are for the *unexpected*.
- **Use `react-error-boundary`** rather than re-writing the class each time; it adds `onReset`, `resetKeys`, and a `useErrorBoundary` hook to bridge async errors into a boundary.

## 💣 Gotchas interviewers probe

- **"Do boundaries catch event-handler errors?"** No — the single most common trap. Event handlers, async callbacks, and SSR are all outside a boundary's reach.
- **Still a class in React 19.** There's no hook; be ready to explain *why* (`getDerivedStateFromError`/`componentDidCatch` have no hook form yet).
- **`getDerivedStateFromError` must be pure** — it runs during render. Logging belongs in `componentDidCatch`.
- **Recovery needs a reset.** After catching, the subtree stays on the fallback; you must reset state or change a `key` to retry.
- **A boundary can't catch its own errors** — if the fallback UI throws, it propagates to the *next* boundary up.
- **Bridging async errors:** a common pattern is to `catch` an async error and then `setState` to something that *re-throws during render*, so a boundary can handle it uniformly.

## 🎯 Say this in the interview

> "An error boundary is a circuit breaker: a class component with `getDerivedStateFromError` and `componentDidCatch` that catches errors thrown while React renders or commits its children, and shows a fallback instead of letting one thrown error unmount the whole tree to a blank screen. The key limitation is scope — it only catches what happens on React's own call stack, so event handlers, `setTimeout`, promises, and SSR are *not* covered; those I wrap in `try/catch` and surface through state. It's still a class in React 19 because those two methods have no hook equivalent, though I'd usually reach for `react-error-boundary`. In practice I place boundaries around independent units — routes, widgets — so a broken chart doesn't blank the dashboard, I always log the `componentStack` to Sentry in `componentDidCatch`, and I pair them with `Suspense` so loading and error states are both covered."

## 🔗 Go deeper

- [react.dev — Catching rendering errors with an error boundary](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) — the class API and exactly what it catches.
- [react.dev — `getDerivedStateFromError`](https://react.dev/reference/react/Component#static-getderivedstatefromerror) — render-phase fallback, and why it must be pure.
- [react-error-boundary](https://github.com/bvaughn/react-error-boundary) — the community-standard wrapper with reset keys and async bridging.
- [react.dev — `Suspense`](https://react.dev/reference/react/Suspense) — pairing loading and error handling for async UI.
