<div align="center">

# Fetch & AJAX

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#fetch` `#api`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `fetch` is a two-stage promise: it resolves the moment the **headers** land, not the body, and — the trap everyone hits — it only rejects on a *network* failure, never on a `404` or `500`. You must check `response.ok` yourself.

---

## 🧠 Mental model

"AJAX" is the *idea* — update the page without a full reload by talking to the server in the background. `XMLHttpRequest` was the original transport; `fetch` is the modern one. Don't conflate the concept with the API.

The key mental shift for `fetch`: a response is a **stream with a header**, not a blob of data. The promise settles as soon as the status line and headers arrive; the body is a separate, lazily-consumed `ReadableStream`. That's why reading it (`.json()`, `.text()`, `.blob()`) is itself async — and why you can only do it **once**.

## ⚙️ How it actually works

`fetch(url, init)` returns a promise that:

- **Resolves** with a `Response` as soon as headers arrive — *including* for `4xx`/`5xx`. A `500` is a perfectly successful fetch as far as the promise is concerned.
- **Rejects** only when the request never completed: DNS failure, offline, CORS block, or an `AbortController` abort.

So the branch is: promise settled → check `response.ok` (status 200–299) → *then* parse the body.

Other mechanics that separate seniors:

- **No timeout.** `fetch` will wait forever. You add one with `AbortSignal.timeout(ms)` (or a manual `AbortController`).
- **Credentials** default to `same-origin`. Cross-origin cookies require `credentials: 'include'` *and* the server's CORS headers to allow it.
- **No upload progress.** The one thing `XHR` still does that `fetch` can't (cleanly) — `xhr.upload.onprogress`. Download progress you can get by reading `response.body` manually.
- **`keepalive: true`** lets a request outlive the page (analytics on `unload`) — the modern `navigator.sendBeacon`.

## 💻 Code

```js
// ❌ The bug in 90% of tutorials: a 404 falls straight through to .then()
fetch('/api/user').then((r) => r.json()).then(use); // parses an error page as data

// ✅ Check ok, add a timeout, handle both failure modes.
async function getJSON(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`); // 4xx/5xx don't reject — do it yourself
  return res.json();                                   // body read exactly once
}

try {
  const user = await getJSON('/api/user');
} catch (err) {
  // err is either a network/abort rejection OR our thrown HTTP error — handle both
}
```

```js
// Manual cancellation (e.g. a stale search request):
const ctrl = new AbortController();
fetch('/search?q=' + q, { signal: ctrl.signal });
ctrl.abort(); // rejects with an AbortError
```

## ⚖️ Trade-offs

- **`fetch` vs a library (axios/ky).** Libraries give you interceptors, auto-JSON, timeouts, retries, and a proper `HTTPError` for free. `fetch` is zero-dependency but you rebuild that ergonomics layer yourself. On a large app, a thin wrapper around `fetch` is usually the right call — not axios, not raw `fetch` everywhere.
- **When NOT to use `fetch`:** if you genuinely need **upload progress**, reach for `XMLHttpRequest` — it's the one legitimate remaining use.
- **Streaming vs buffering.** `.json()` buffers the whole body. For huge or incremental responses (LLM token streams, large NDJSON), read `response.body` with a reader instead.

## 💣 Gotchas interviewers probe

- **`fetch` does not reject on HTTP errors.** This is *the* question. `response.ok` / `response.status` is on you.
- **The body can only be read once.** Call `.json()` twice and the second throws. Need it twice? `res.clone()` first.
- **No default timeout.** A hung endpoint hangs your UI forever without an `AbortSignal`.
- **`await res.json()` throws on an empty body** (e.g. a `204 No Content`) — guard it.
- **A "CORS error" isn't a fetch bug.** The response is opaque by design; you can't read it or its status from JS. Fix it on the server.
- **`Content-Type` isn't set for you** on a POST — send `application/json` yourself, or the server may mis-parse the body.

## 🎯 Say this in the interview

> "The mental model I hold is that `fetch` returns a two-stage promise — it resolves when the headers arrive, and the body is a stream I consume separately, which is why parsing is async and single-use. The single biggest gotcha is that it only rejects on network-level failures, so a 404 or 500 still *resolves* — I always branch on `response.ok` before parsing. Beyond that I'm careful about three things: there's no default timeout, so I attach an `AbortSignal.timeout`; cross-origin cookies need `credentials: 'include'` plus server CORS; and if I need upload progress I fall back to `XMLHttpRequest`, which is the one thing `fetch` still can't do. In a real codebase I'd wrap all of this in one small client rather than sprinkling raw `fetch` calls around."

## 🔗 Go deeper

- [MDN — Using Fetch](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) — the canonical walkthrough, including streams.
- [MDN — Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) — `ok`, `status`, `clone`, and the body methods.
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — cancellation and timeouts done right.
- [web.dev — Fetch API streaming](https://web.dev/articles/fetch-upload-streaming) — when to read `response.body` yourself.
