<div align="center">

# `useTransition` / `useDeferredValue`

<sub>⚛️ React · 🔴 Hard · ⏱ 1h · `#concurrent`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Both mark work as **interruptible and low-priority** so an urgent update (typing, clicking) never waits on it. `useTransition` marks a *state update you own* as non-urgent; `useDeferredValue` marks a *value you receive* as allowed to lag. Neither makes anything faster — they change **scheduling** so the main thread stays responsive.

---

## 🧠 Mental model

React 18's concurrent renderer can split updates into two priority classes. **Urgent** updates (the keystroke landing in the input) commit immediately. **Transition** updates (re-filtering a 10,000-row list off that keystroke) render in the background, can be paused when the next keystroke arrives, and thrown away if stale.

The two hooks are the same idea from two vantage points:

| | You use it when… | It gives you |
|---|---|---|
| `useTransition` | you **call the `setState`** | `[isPending, startTransition]` |
| `useDeferredValue` | the value arrives as a **prop / you don't own the setter** | a value that lags behind during the transition |

The mental trap to avoid: **don't defer the input itself.** The input's own state is urgent and must update on every keystroke. What you defer is the *expensive thing derived from it*.

## ⚙️ How it actually works

`startTransition(fn)` runs `fn` and tags every `setState` inside it as transition-priority. React renders that update on a lower "lane": it builds the work-in-progress tree in memory, checks `shouldYield()` between units of work, and hands the main thread back to the browser so input stays live. If a new urgent update lands mid-render, React **discards the in-progress transition render and restarts** — which is exactly why render must be pure.

`useDeferredValue(value)` does a **double render**. On a new `value`, React first re-renders with the *previous* value at urgent priority (UI stays responsive and consistent), then schedules a second render with the new value at transition priority. The old view stays interactive until the expensive one is ready.

The critical caveat: **deferring does not make the slow child fast.** The expensive render still costs what it costs — it just no longer blocks the input. To actually keep frames smooth you *also* memoize the heavy child, otherwise the transition render janks the same, it just janks off the critical path.

## 💻 Code

```jsx
// ✅ Input is urgent; the derived list is deferred.
function Search({ items }) {
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);       // lags during heavy renders
  const isStale = query !== deferredQuery;

  return (
    <>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <div style={{ opacity: isStale ? 0.5 : 1 }}>
        <Results query={deferredQuery} items={items} />  {/* wrap in memo() */}
      </div>
    </>
  );
}
```

```jsx
// useTransition when you own the setState (e.g. tab switch that mounts a heavy panel)
const [isPending, startTransition] = useTransition();
function selectTab(next) {
  startTransition(() => setTab(next));  // MUST be synchronous — see gotchas
}
return <Spinner hidden={!isPending} />;
```

## ⚖️ Trade-offs

- **They fix responsiveness, not throughput.** If the expensive render is genuinely 400ms, transitions keep the input alive but the result still takes 400ms to appear. Pair with memoization, virtualization, or a Web Worker for the actual cost.
- **`useTransition` gives you `isPending`; `useDeferredValue` doesn't.** Derive staleness yourself with `value !== deferredValue`. Choose the hook by whether you hold the setter.
- **Don't use them when the update is cheap.** Wrapping a trivial `setState` in a transition adds scheduling overhead and an extra `isPending` re-render for no benefit. Reach for them only when you've measured a blocking render.
- **They keep stale Suspense content on screen.** A state change inside a transition prevents an already-revealed `Suspense` boundary from snapping back to its fallback — great for navigation, surprising if you *wanted* the spinner.

## 💣 Gotchas interviewers probe

- **`startTransition` must be synchronous (pre-React 19).** `setState` calls after an `await` inside the callback escape the transition scope and become urgent again. React 19 Actions fix this with async transitions.
- **Deferring the wrong value.** Passing `useDeferredValue` the *input's* value makes typing feel laggy. Defer the derived output, keep the input urgent.
- **`useDeferredValue` needs a stable value.** Feed it a brand-new object/array every render and it never "settles" — it's always different from itself. Defer primitives or memoized references.
- **`isPending` itself triggers a render.** It flips true then false, so the transition component re-renders twice. Keep it near the leaf.
- **Neither replaces a debounce for network calls.** They schedule *rendering*, not requests. You may still want to throttle the actual fetch.

## 🎯 Say this in the interview

> "Both are concurrent-scheduling primitives — they don't speed anything up, they change priority so urgent input never blocks on expensive work. I reach for `useTransition` when I own the setState, like switching to a tab that mounts a heavy panel: I wrap the setState so the click stays responsive and I get `isPending` for free. I reach for `useDeferredValue` when the value comes in as a prop and I can't touch the setter — I pass it the derived query, keep the raw input urgent, and it double-renders so the old list stays interactive until the new one is ready. The key nuance I'd flag: the slow render is still slow, so I always memoize the heavy child too — the hook just moves the cost off the critical path, it doesn't remove it."

## 🔗 Go deeper

- [react.dev — `useTransition`](https://react.dev/reference/react/useTransition) — the API, `isPending`, and async Actions in React 19.
- [react.dev — `useDeferredValue`](https://react.dev/reference/react/useDeferredValue) — the double-render model and stale-value pattern.
- [react.dev — Keeping the UI responsive](https://react.dev/reference/react/useTransition#preventing-unwanted-loading-indicators) — how transitions suppress Suspense fallbacks.
