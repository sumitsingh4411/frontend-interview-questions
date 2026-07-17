<div align="center">

# Fetch, XHR & request cancellation

<sub>📡 Networking · 🟢 Easy · ⏱ 45m · `#fetch` `#api`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `fetch` is the modern Promise-based HTTP API; XHR is its event-based predecessor. The single most important thing to master is **cancellation** via `AbortController` — because a search box, a route change, or a stale request that resolves *after* a newer one will silently corrupt your UI if you don't abort it.

---

## 🧠 Mental model

`fetch` looks simple and hides two traps that catch almost everyone:

1. **It doesn't reject on HTTP errors.** A `404` or `500` is a *successful* fetch — the network worked, the server answered. The Promise only rejects on a genuine **network failure** (DNS fail, offline, CORS block, aborted). So `res.ok` is not optional.
2. **A request has no built-in timeout and no built-in cancel.** Once fired, it runs to completion unless *you* abort it. In a SPA, requests outlive the components that started them.

`AbortController` is the missing piece. It's a general cancellation primitive — one controller exposes a `signal` you pass into `fetch`; calling `controller.abort()` rejects the fetch with an `AbortError`. The same signal cancels `addEventListener`, `setTimeout` wrappers, and more, which is why it's the *right* abstraction rather than a fetch-specific hack.

## ⚙️ How it actually works

**The response body is a stream, read once.** `res.json()`, `res.text()`, `res.blob()` each *consume* the body — call two of them and the second throws "body already read". For large downloads you can read `res.body` as a `ReadableStream` and show progress.

**`AbortController` → `signal` → `abort()`.** The controller and signal are separate on purpose: you hold the controller (the remote), consumers hold the signal (the receiver). Abort propagates to the fetch, which rejects with a `DOMException` named `AbortError` — you must distinguish it from real errors.

**The race condition cancellation actually solves.** Type "re", "rea", "reac" into a search box → three requests fire. They can return **out of order**: "re" resolves *after* "reac", overwriting the correct results with stale ones. Aborting the previous request before firing the next one makes "last write wins" mean "last *requested* wins", not "last *arrived*".

**Fetch vs XHR — what XHR still does that fetch historically couldn't:**

| | `fetch` | `XMLHttpRequest` |
|---|---|---|
| API | Promise, `async/await` | events / callbacks |
| Cancel | `AbortController` | `xhr.abort()` |
| **Upload progress** | ❌ (no native event) | ✅ `xhr.upload.onprogress` |
| Timeout | manual (`AbortSignal.timeout`) | `xhr.timeout` |
| Streaming response | ✅ `res.body` | limited |
| Send cookies cross-origin | `credentials: 'include'` | `withCredentials` |

The one real reason to still reach for XHR (or a library that uses it, like Axios) is **upload progress** — `fetch` has no upload-progress event.

## 💻 Code

Cancel the previous request on every new keystroke — the canonical pattern:

```js
let controller; // holds the in-flight request's controller

async function search(query) {
  controller?.abort();            // cancel the PREVIOUS request (kills stale results)
  controller = new AbortController();

  try {
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
      signal: controller.signal,  // wire cancellation in
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`); // fetch won't do this for you
    return await res.json();
  } catch (err) {
    if (err.name === 'AbortError') return; // expected — a newer request superseded this
    throw err;                              // a REAL failure — surface it
  }
}
```

```js
// Timeout without leaking a hanging request. AbortSignal.timeout() (modern) is cleanest:
const res = await fetch(url, { signal: AbortSignal.timeout(5000) }); // aborts after 5s

// Combine a user-cancel signal with a timeout signal:
const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]);
await fetch(url, { signal });
```

```js
// ❌ common bug: consuming the body twice
const data = await res.json();
const text = await res.text(); // throws: body already read

// ❌ another: assuming fetch throws on 500 — it does NOT
await fetch('/api').then(r => r.json()); // parses the error page, hides the failure
```

## ⚖️ Trade-offs

- **Always abort on unmount / route change**, or a late response updates a component that's gone — React's "can't update state on unmounted component" warning and memory leaks. In React, tie the controller to the effect cleanup.
- **`fetch` over XHR by default** — cleaner, streamable, standard. Drop to XHR/Axios *only* when you need upload progress.
- **Aborting is not a rollback.** The request may already have reached the server and mutated state; abort only stops the *client* from waiting. Never abort a non-idempotent `POST` and assume it didn't happen.
- **Don't hand-roll retries/dedupe/caching** for every call. At app scale, a data layer (TanStack Query, SWR, RTK Query) gives you cancellation, dedupe, and stale-while-revalidate for free — reinventing it per-component is a smell.

## 💣 Gotchas interviewers probe

- **`fetch` doesn't reject on 4xx/5xx.** The #1 gotcha. Only network-level failures reject; check `res.ok`.
- **The out-of-order response race.** If you can't explain why a search box needs cancellation — that stale requests resolve last and overwrite fresh results — you haven't understood the problem cancellation exists for.
- **Distinguish `AbortError` from real errors.** Treating an intentional abort as a failure shows a spurious error toast on every keystroke.
- **Body can only be read once.** Clone with `res.clone()` if you genuinely need it twice (e.g. logging + parsing).
- **CORS failures reject opaquely** — you get a generic `TypeError: Failed to fetch` with no status, by design (the browser hides cross-origin details). Not a fetch bug.
- **`fetch` doesn't send cookies cross-origin by default** — you need `credentials: 'include'`, *and* the server must send matching CORS headers.

## 🎯 Say this in the interview

> "The two things I lead with on `fetch`: it only rejects on network failures, not on 4xx or 5xx, so I always check `res.ok`; and it has no built-in cancel or timeout, so I wire in an `AbortController`. Cancellation isn't a nicety — it fixes a real correctness bug. In a search box, three keystrokes fire three requests that can resolve out of order, so a stale response overwrites a fresh one. By aborting the previous request before firing the next, 'last wins' means last *requested*, not last *arrived*. I abort on unmount and route change too, otherwise a late response updates a component that's gone. The one time I'd still use XHR or Axios is upload progress, which `fetch` has no event for. And I'm careful that aborting only stops the client from waiting — the server may already have processed a non-idempotent request, so I never treat an abort as a rollback."

## 🔗 Go deeper

- [MDN — Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) — the canonical guide, including `res.ok` and streaming.
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the cancellation primitive and `signal` semantics.
- [MDN — AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) — first-class timeouts and `AbortSignal.any()`.
- [javascript.info — Fetch: Abort](https://javascript.info/fetch-abort) — worked examples of cancellation and races.
