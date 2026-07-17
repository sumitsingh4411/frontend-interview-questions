<div align="center">

# Suspense & streaming

<sub>⚛️ React · 🔴 Hard · ⏱ 1h · `#concurrent` `#data`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `Suspense` is a boundary that catches a component **suspending** (throwing a promise) and shows a fallback until it resolves. On the server, `renderToPipeableStream` uses those boundaries to **stream HTML in chunks** — the shell flushes immediately, each boundary's real content streams in as its data resolves, and React swaps the fallback with **no client JS required**. Suspense doesn't fetch — it *reacts* to a thrown promise.

---

## 🧠 Mental model

A component "suspends" by throwing a thenable instead of returning JSX. The nearest `Suspense` boundary catches it, renders its `fallback`, subscribes to the promise, and re-renders the real content when it resolves. It's `try/catch` for async, expressed declaratively in the tree.

Streaming SSR is the same boundary reused as a **flush point**. Instead of rendering the whole page to a string and sending it once (blocked on the slowest query), the server sends the **shell** with fallbacks in place right away, then streams each boundary's HTML as its data becomes ready. The user sees a meaningful page in milliseconds and it fills in progressively.

The framing that lands: **Suspense turns loading states into a layout concern, not a per-component `if (loading)` ladder.** You declare *where* fallbacks live once, and any descendant that suspends uses them.

## ⚙️ How it actually works

Client-side, when a child throws a promise, React unwinds to the nearest `Suspense`, commits the fallback, and retries the subtree on resolution. Only **Suspense-enabled data sources** trigger this: RSC, the `use(promise)` hook (React 19), `lazy()`, and framework/library loaders. A bare `useEffect` fetch **never suspends** — it renders, then sets state.

Server-side, `renderToPipeableStream` renders the shell and flushes it with `<template>` placeholders for unresolved boundaries. As each boundary's data resolves, the server streams a hidden chunk of real HTML plus a tiny inline `<script>` that moves it into place — the swap happens **before hydration, with zero framework JS**. This pairs with **selective hydration**: React hydrates boundaries as their code and HTML arrive, and if the user clicks an as-yet-unhydrated boundary, React **prioritizes hydrating that one first** and replays the captured event.

Transitions interact deliberately: an update wrapped in a transition **won't revert an already-revealed boundary to its fallback** — it keeps the stale content visible until the new content is ready, avoiding a jarring flash back to a spinner.

## 💻 Code

```jsx
// Declarative loading boundary — fallbacks are layout, not per-component flags.
<Suspense fallback={<PageSkeleton />}>
  <Sidebar />
  <Suspense fallback={<FeedSkeleton />}>
    <Feed />           {/* streams in independently of Sidebar */}
  </Suspense>
</Suspense>
```

```jsx
// React 19: use() suspends on a promise. The promise MUST be cached/stable.
function Profile({ userPromise }) {
  const user = use(userPromise);   // suspends until resolved
  return <h1>{user.name}</h1>;
}
// ❌ Creating the promise in render restarts the fetch every render → infinite loop
// function Profile() { const user = use(fetch('/me').then(r => r.json())); }
```

```js
// Server: stream instead of buffering the whole document.
import { renderToPipeableStream } from 'react-dom/server';
const { pipe } = renderToPipeableStream(<App />, {
  onShellReady() { res.setHeader('content-type', 'text/html'); pipe(res); },
});
```

## ⚖️ Trade-offs

- **Suspense is a reaction, not a fetcher.** It needs a data layer that throws a promise (RSC, `use`, a Suspense-capable client cache). Wrapping legacy `useEffect` fetching in `<Suspense>` does nothing — a very common misconception.
- **Streaming trades a slower *complete* page for a faster *first* paint.** TTFB and FCP drop dramatically; the trade is more moving parts and out-of-order chunks. Almost always worth it for content pages.
- **Nesting boundaries can create waterfalls.** If a child boundary can't start fetching until its parent resolves, you serialize requests. Hoist fetches or start them in parallel above the boundaries.
- **Fallbacks can flash for fast responses.** A boundary that resolves in 30ms still shows its spinner for a frame. Use transitions, or delay showing the fallback, to avoid flicker.

## 💣 Gotchas interviewers probe

- **"Suspense fetches data."** No — it catches a thrown promise. Something else has to do the fetching and suspend. Getting this right is the senior signal.
- **Uncached promise in render.** Calling `use(fetch(...))` or creating a new promise each render means a new promise every time → refetch loop. The promise must be created outside render or cached.
- **`useEffect` fetching never suspends.** It commits, then updates state — Suspense never sees it. You need an integrated cache or RSC.
- **A boundary with no `fallback` bubbles up.** The suspension propagates to the next ancestor boundary; if none exists, it's an error.
- **Streaming ≠ concurrent by default in old APIs.** `renderToString` buffers everything and can't stream or suspend on the server — use `renderToPipeableStream` (Node) / `renderToReadableStream` (edge).
- **Transitions suppress fallbacks intentionally.** If navigating flashes a spinner you didn't want, wrap the navigation in a transition so the old UI stays until ready.

## 🎯 Say this in the interview

> "Suspense is a declarative boundary: when a descendant suspends by throwing a promise, the nearest boundary shows its fallback and retries when the promise resolves. The key thing people get wrong is that Suspense doesn't fetch — it reacts to a thrown promise, so you need a data source that actually suspends, like RSC or `use()` in React 19, not a `useEffect` fetch. On the server it becomes a streaming primitive: `renderToPipeableStream` flushes the shell with fallbacks immediately, then streams each boundary's real HTML as its data resolves and swaps it in with a tiny inline script — no client JS needed — and selective hydration prioritizes whatever the user interacts with first. The two traps I watch for are creating the promise inside render, which loops, and accidental fetch waterfalls from nested boundaries. And I lean on transitions to stop already-revealed content from flashing back to a spinner."

## 🔗 Go deeper

- [react.dev — `Suspense`](https://react.dev/reference/react/Suspense) — boundaries, fallbacks, and reveal behaviour with transitions.
- [react.dev — `use`](https://react.dev/reference/react/use) — reading a promise and suspending in React 19.
- [react.dev — `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) — streaming SSR and `onShellReady`.
- [GitHub — New Suspense SSR architecture](https://github.com/reactwg/react-18/discussions/37) — the working-group deep dive on streaming and selective hydration.
