<div align="center">

# AbortController & cancellation

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#async`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — You can't cancel a promise — a promise is a *value that already exists*, not an operation you can stop. `AbortController` is the platform's cancellation *token*: you hand its `signal` to an async operation, call `controller.abort()`, and the operation rejects with an `AbortError`. It's the same primitive for cancelling `fetch`, auto-removing event listeners, and timing things out.

---

## 🧠 Mental model

A promise represents the *eventual result* of work that's already underway. There's no `promise.cancel()` because cancelling would mean un-scheduling something the promise doesn't own. So the platform split the two concerns:

- **`AbortController`** — the remote control. Held by whoever *starts* the work.
- **`AbortSignal`** (`controller.signal`) — the receiver. Passed *into* the operation, which listens for the abort event and bails.

```
  controller.abort(reason)
        │
        ▼
   signal fires 'abort' ──▶ fetch/listener/your code sees it ──▶ rejects with AbortError
```

The key reframe: cancellation is **cooperative**. The controller only *requests* a stop by flipping the signal; the operation has to be written to watch the signal and honour it. `fetch` honours it for you.

## ⚙️ How it actually works

`abort()` sets `signal.aborted = true`, records `signal.reason`, and dispatches an `abort` event on the signal. Anything holding the signal can react three ways: listen for the event, poll `signal.aborted`, or call `signal.throwIfAborted()` at a checkpoint.

The under-appreciated superpower is that **one signal cleans up many things at once**. Pass `{ signal }` to `addEventListener` and the listener auto-removes when you abort — no `removeEventListener`, no stashing the handler reference. Wire every listener, timer, and fetch in a component to one controller and a single `abort()` tears them all down.

Two static helpers do the ergonomic heavy lifting:

- **`AbortSignal.timeout(ms)`** — a signal that auto-aborts after `ms`, so a fetch cancels itself.
- **`AbortSignal.any([...signals])`** — a signal that fires when *any* input does. Combine a user-cancel controller with a timeout: whichever trips first wins.

Crucially, aborting a `fetch` stops the *client* from waiting and frees the connection — it does **not** guarantee the server didn't already process the request. Cancellation is about the caller, not the callee.

## 💻 Code

```js
// Cancellable fetch that also times out — combine two signals
async function load(url, { userSignal } = {}) {
  const signal = AbortSignal.any([
    userSignal ?? new AbortController().signal,
    AbortSignal.timeout(5000),        // auto-abort after 5s
  ].filter(Boolean));

  try {
    const res = await fetch(url, { signal });
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return;  // ← expected: user left / timed out. NOT an error UI.
    throw err;                              // ← a real failure. Surface it.
  }
}
```

```js
// One controller, many listeners — abort() removes them all
const ctrl = new AbortController();
const { signal } = ctrl;
window.addEventListener('resize', onResize, { signal });
window.addEventListener('scroll', onScroll, { signal });
el.addEventListener('pointermove', onMove, { signal });
// later, teardown in a single line:
ctrl.abort();   // every listener above is now detached
```

```jsx
// React: the canonical effect cleanup — cancel the in-flight request on unmount / dep change
useEffect(() => {
  const ctrl = new AbortController();
  fetch(`/api/user/${id}`, { signal: ctrl.signal })
    .then((r) => r.json())
    .then(setUser)
    .catch((e) => { if (e.name !== 'AbortError') setError(e); });
  return () => ctrl.abort();   // stops the stale request from resolving into state
}, [id]);
```

## ⚖️ Trade-offs

- **Cancellation is opt-in per API.** `fetch` supports signals; a random third-party promise-returning function usually doesn't. If it doesn't accept a signal, you can't truly cancel it — you can only *ignore* its result (a "latch" that drops late responses).
- **Aborting frees the client, not the server.** Don't rely on abort to prevent a side effect that already reached the backend — you still need idempotency / server-side cancellation for that.
- **When not to bother:** a one-shot request whose result you always consume needs no controller. Reach for it when work can become *stale* (typeahead), *unwanted* (navigation away), or *too slow* (timeout).

## 💣 Gotchas interviewers probe

- **"Can you cancel a promise?"** No — and knowing *why* (a promise is a value, not a process) is the senior answer. `AbortController` is the token pattern that fills the gap.
- **`AbortError` is not a failure.** It's a `DOMException` with `name === 'AbortError'`. Treat it as "expected cancellation" and skip the error UI — showing "Something went wrong" when the user simply navigated away is a common bug.
- **A signal is single-use.** Once aborted it stays aborted; a fresh controller is needed per request/lifecycle. Reusing one that already fired means the next fetch aborts immediately.
- **`{ signal }` on `addEventListener` auto-removes the listener** — most candidates still hand-roll `removeEventListener`. This is the cleaner, leak-proof pattern.
- **Passing an already-aborted signal to `fetch`** rejects synchronously-ish with `AbortError` before any network — guard with `signal.throwIfAborted()` if you want an explicit checkpoint.
- **Aborting doesn't stop server-side work.** People assume it does; it only stops the client consuming the response.

## 🎯 Say this in the interview

> "Promises can't be cancelled because a promise is a value that's already in flight, not a handle on the operation. The platform's answer is `AbortController`: I create one, pass its `signal` into `fetch` or `addEventListener`, and calling `abort()` makes the operation reject with an `AbortError` and detaches any listeners wired to that signal. I lean on it hardest for stale requests — in a React effect I create a controller and return `() => controller.abort()` so a request for an old `id` can't resolve into state after the prop changed. Two things I'm careful about: I treat `AbortError` as expected, not as an error to show the user; and I remember that aborting frees the client but doesn't guarantee the server didn't already do the work, so anything with a side effect still needs to be idempotent. `AbortSignal.timeout` and `AbortSignal.any` let me compose a user-cancel with a timeout cleanly."

## 🔗 Go deeper

- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the controller/signal split and the full API.
- [MDN — AbortSignal](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal) — `timeout()`, `any()`, `throwIfAborted()`, and the `abort` event.
- [MDN — Using AbortController with addEventListener](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener#signal) — the auto-removing-listener pattern.
- [web.dev — Abortable fetch](https://web.dev/articles/abortable-fetch) — cancelling network requests in practice.
