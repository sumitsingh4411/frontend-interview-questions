<div align="center">

# `useSyncExternalStore`

<sub>⚛️ React · 🔴 Hard · ⏱ 45m · `#hooks` `#state`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The hook that lets **external mutable stores** (Redux, Zustand, `matchMedia`, `navigator.onLine`) subscribe to React **without tearing** under concurrent rendering. It reads a snapshot during render and forces a synchronous re-render on change, guaranteeing every component in one commit sees the *same* value. You rarely call it directly — it's a **library primitive**.

---

## 🧠 Mental model

Concurrent React can pause mid-render and resume later. If an external store mutates *between* those slices, components rendered before the mutation read the old value and components rendered after read the new one — the same commit shows two different truths. That inconsistency is **tearing**, and it's a bug that literally could not happen in React 17's blocking renderer.

`useSyncExternalStore` is React's promise: "I will read this store **synchronously and consistently**, opting this particular read out of time-slicing." It's correctness bought at the price of concurrency for that one value — a deliberate trade.

## ⚙️ How it actually works

```ts
const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot?);
```

- **`subscribe(cb)`** — register `cb` to fire on every store change; return an unsubscribe. React calls `cb` to know it must re-read.
- **`getSnapshot()`** — return the current value. React calls it during render **and again at commit**; if the value changed in between, React re-renders synchronously so the tree can't tear.
- **`getServerSnapshot()`** — the value to use during SSR and the initial hydration render. Must match what the server rendered or you get a hydration mismatch.

The load-bearing rule: **`getSnapshot` must return a referentially stable value when nothing changed.** React compares snapshots with `Object.is`. Return a fresh `{...}` or `.filter()` result every call and React sees "changed → changed → changed…" and either warns (`The result of getSnapshot should be cached`) or loops infinitely. Cache the object in the store; derive/select with a memoizing wrapper (`useSyncExternalStoreWithSelector` from the official shim).

Why not the old `useState` + `useEffect` subscribe pattern? Two reasons: the effect subscribes *after* render+commit, so any store change in that window is **missed** until the next render; and that pattern reads through React state, which time-slicing can tear. `useSyncExternalStore` subscribes at the right moment and reads synchronously.

## 💻 Code

```js
// A tiny store — note the snapshot object is cached, not rebuilt each read.
function createStore(initial) {
  let state = initial;
  const listeners = new Set();
  return {
    getSnapshot: () => state,                 // stable reference until setState
    setState: (next) => { state = next; listeners.forEach((l) => l()); },
    subscribe: (l) => { listeners.add(l); return () => listeners.delete(l); },
  };
}
```

```js
// Subscribing to a browser API safely — SSR-friendly.
function useOnlineStatus() {
  return useSyncExternalStore(
    (cb) => {
      window.addEventListener('online', cb);
      window.addEventListener('offline', cb);
      return () => {
        window.removeEventListener('online', cb);
        window.removeEventListener('offline', cb);
      };
    },
    () => navigator.onLine,   // client snapshot
    () => true                // server snapshot — no navigator on the server
  );
}
```

```js
// ❌ Infinite loop / warning: new array identity every render.
getSnapshot: () => store.items.filter((i) => i.active);
// ✅ Cache the derived value in the store, or use a memoized selector.
```

## ⚖️ Trade-offs

- **App code almost never needs it.** It's built for state-management libraries. If you're wiring one by hand — or bridging a non-React source like `localStorage`, `matchMedia`, or a WebSocket — reach for it; otherwise use normal state.
- **It opts out of concurrency for that read.** The forced synchronous re-render means updates from this store can't be deferred or time-sliced. That's the point (no tearing), but it's why you don't route *all* state through it.
- **`subscribe` identity matters.** If `subscribe` is recreated every render, React re-subscribes every render. Define it outside the component or memoize it.

## 💣 Gotchas interviewers probe

- **Returning a new object from `getSnapshot`.** The single most common failure — a `.map`/`.filter`/`{...}` in the snapshot getter. Cache it, or use `useSyncExternalStoreWithSelector` with an equality function.
- **Forgetting `getServerSnapshot`.** Omit it and the store throws during SSR (`getSnapshot` touches `window`). Provide a server value that matches the initial client value to avoid hydration mismatch.
- **Why not `useState` + `useEffect`?** The effect subscribes too late (misses the gap between render and commit) and can tear. This is the answer interviewers want.
- **Tearing is invisible in dev without concurrent features.** The bug only surfaces once transitions/Suspense start slicing renders — which is precisely why the hook exists.
- **It's not a store — it's a bridge.** It doesn't hold state; it connects React to state that lives *outside* React.

## 🎯 Say this in the interview

> "It's the hook for subscribing external mutable state to React safely under concurrent rendering. Because React 18 can pause and resume a render, an external store that mutates between slices could make some components read the old value and others the new one in the same commit — that's tearing. `useSyncExternalStore` reads a snapshot during render, re-reads at commit, and forces a synchronous re-render if it changed, so the whole tree is consistent. The catch is `getSnapshot` has to return a stable reference when nothing changed, or React loops — so I cache the snapshot in the store or use a memoized selector. And I always pass `getServerSnapshot` for SSR. In practice I rarely call it directly; it's what Redux and Zustand use under the hood, but I'd reach for it to bridge something like `matchMedia` or online status."

## 🔗 Go deeper

- [react.dev — `useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore) — signature, snapshot caching, and SSR guidance.
- [React RFC — `useMutableSource` → `useSyncExternalStore`](https://github.com/reactwg/react-18/discussions/86) — the working-group write-up on tearing and why the hook exists.
- [MDN — `Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is) — the equality React uses to compare snapshots.
