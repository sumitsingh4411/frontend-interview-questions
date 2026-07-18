<div align="center">

# Code splitting & `lazy`/`Suspense`

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#performance` `#bundling`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `lazy(() => import('./X'))` tells the bundler to emit `X` as a **separate chunk** fetched on first render, and `Suspense` renders a fallback while it loads; you're not shrinking the app, you're **deferring the bytes the user doesn't need yet** — so split at route and interaction boundaries, not everywhere.

---

## 🧠 Mental model

Your JS bundle is a bill the user pays **before the page is interactive**. Code splitting never reduces the total bytes; it reorders *when* they arrive so the critical path ships less. The mental picture: one giant `main.js` becomes a tree of chunks, and only the chunks needed for the current route/interaction are on the critical path.

`lazy` is React's binding to the bundler's **dynamic `import()`**. When Webpack/Vite/esbuild sees `import('./X')`, it cuts `X` (and its unique deps) into its own file. `lazy` wraps that promise so React can render a placeholder until it resolves. `Suspense` is the mechanism that catches the "still loading" signal and shows `fallback`.

## ⚙️ How it actually works

`lazy` returns a component that, on **first render**, calls your factory, which throws the returned promise. The nearest `Suspense` boundary catches it, renders `fallback`, and re-renders the subtree when the promise resolves — caching the module so subsequent renders are synchronous.

- **Must be module-scope.** `const X = lazy(...)` defined *inside* a component creates a new lazy type every render → remount and refetch. Declare it at the top level.
- **Named exports** need a remap: `lazy(() => import('./X').then(m => ({ default: m.Y })))`.
- **Failures throw.** A dropped network or — very common — a **stale chunk hash after a deploy** rejects the import and surfaces as a `ChunkLoadError`. `Suspense` does *not* catch errors; you need an **error boundary** around it.
- **Preloading** is just calling the factory early: on hover/focus/route-intent, fire `import('./X')` so the chunk is warm by the time it's needed. This kills the loading flash.

## 💻 Code

```jsx
import { lazy, Suspense, startTransition } from 'react';

const Settings = lazy(() => import('./Settings')); // top-level → stable identity

function App() {
  return (
    <ErrorBoundary fallback={<RetryChunk />}>   {/* catches ChunkLoadError */}
      <Suspense fallback={<Skeleton />}>
        <Settings />
      </Suspense>
    </ErrorBoundary>
  );
}

// Preload on intent so there's no fallback flash when the user commits
const preload = () => import('./Settings');
<button onMouseEnter={preload} onFocus={preload} onClick={openSettings}>
  Settings
</button>;

// Route swaps: wrap the navigation in a transition so the OLD screen stays
// on-screen instead of flashing the Suspense fallback
startTransition(() => navigate('/settings'));
```

## ⚖️ Trade-offs

- **Split at boundaries, not per component.** Route-level and heavy-interaction (modals, editors, charts) splits pay off. Splitting tiny leaves creates a **waterfall of requests** and per-chunk overhead that can be *slower* than one bundle.
- **Don't split above-the-fold.** Anything on the critical render path should stay in the main chunk — a lazy hero image or first-view component just adds a round trip.
- **Fallbacks cause layout shift.** A skeleton that doesn't match the loaded size janks the page. Reserve space, or use a transition to avoid showing the fallback at all.
- **`Suspense` fallback ≠ error state.** Loading and failure are different axes; you need both a boundary and a fallback.

## 💣 Gotchas interviewers probe

- **`ChunkLoadError` after deploy.** Old tabs request hashed chunk names that no longer exist. Wrap in an error boundary and offer a reload; some teams keep N old builds on the CDN.
- **`lazy` inside render** → new type each render → infinite remount/refetch. Always module-scope.
- **Fallback flash on fast networks.** Use `startTransition` (or a router that does) so React keeps the current UI while the chunk loads instead of unmounting to the fallback.
- **`Suspense` doesn't catch rejections** — only the "pending" signal. Errors need an error boundary.
- **SSR + `lazy`.** Client-only `lazy` throws during server render; SSR streaming (`renderToPipeableStream`) and RSC handle Suspense on the server — but naive `lazy` in a plain SSR setup needs care.
- **Nested boundaries.** Multiple `Suspense` boundaries let independent chunks reveal separately instead of one big all-or-nothing spinner.

## 🎯 Say this in the interview

> "`lazy` plus `Suspense` is React's front end to the bundler's dynamic `import()`. The bundler cuts the lazily-imported module into its own chunk, and on first render `lazy` throws the import promise, which the nearest `Suspense` boundary catches to show a fallback until it resolves. The framing I hold onto is that this doesn't reduce total bytes — it defers the bytes you don't need yet — so I split at route and heavy-interaction boundaries, never per component, because over-splitting creates a request waterfall. Two things I always handle: chunk-load failures after a deploy, which need an error boundary since `Suspense` only catches the pending state; and the fallback flash, which I avoid by preloading on hover and wrapping route swaps in `startTransition` so the old screen stays put instead of flashing a spinner."

## 🔗 Go deeper

- [react.dev — `lazy`](https://react.dev/reference/react/lazy) — the API, named-export remap, and pitfalls.
- [react.dev — `Suspense`](https://react.dev/reference/react/Suspense) — boundaries, fallbacks, and coordinating with transitions.
- [web.dev — Code splitting with dynamic import](https://web.dev/articles/code-splitting-suspense) — the bundling mechanics and performance framing.
- [react.dev — `startTransition`](https://react.dev/reference/react/startTransition) — how to avoid the fallback flash on navigation.
