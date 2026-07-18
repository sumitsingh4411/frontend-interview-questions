<div align="center">

# Web Workers offloading

<sub>🚀 Performance · 🟡 Medium · ⏱ 1h · `#workers`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — JavaScript is single-threaded, so any task over ~50ms on the main thread blocks input, animation, and paint. A Web Worker runs your code on a **separate OS thread** with its own event loop and no DOM access, communicating by message passing — the price is serialization cost and no shared mutable state (except `SharedArrayBuffer`).

---

## 🧠 Mental model

The main thread does *everything* visible: run your JS, calculate style and layout, paint, respond to clicks, fire scroll handlers. It's a single queue. If one task hogs it for 200ms, the user's tap sits unhandled for 200ms — that's an unresponsive page, and it's exactly what INP measures.

A Web Worker is a **second thread with a completely separate JS environment** — its own global scope, its own event loop, its own memory. It cannot touch `document`, `window`, or the DOM. You talk to it only through `postMessage`, and messages are **copied** (structured clone), not shared. So the model is: *"a worker is a coworker in another room — you slide notes under the door, you don't share a desk."*

The key reframe for interviews: **workers don't make code faster, they make the main thread free.** Parsing a 5MB JSON blob takes the same total CPU in a worker; the win is that the 300ms of parsing no longer freezes your scroll. You trade a little latency (the round-trip) for a responsive UI.

## ⚙️ How it actually works

Communication is `postMessage(data)` on one side, `onmessage` on the other. The `data` goes through the **structured clone algorithm** — it deep-copies most types (objects, arrays, Maps, Dates, `ArrayBuffer`s) but *cannot* clone functions, DOM nodes, or class prototypes. This copy is the hidden cost: cloning a large object is itself main-thread work, so shipping a 50MB array to a worker can cost more than just processing it inline.

Two escape hatches from the copy:

- **Transferables** — `postMessage(buffer, [buffer])` *transfers* ownership of an `ArrayBuffer` instead of copying it. It becomes unusable (neutered) on the sender side but arrives instantly regardless of size. This is the trick for images, audio, and big typed arrays.
- **`SharedArrayBuffer`** — genuinely shared memory both threads can read/write, coordinated with `Atomics`. Powerful but requires cross-origin isolation headers (`COOP`/`COEP`) and careful concurrency; overkill for most apps.

There are three flavours: a **dedicated worker** (one owner), a **shared worker** (multiple tabs of the same origin talk to one worker — rare), and the **service worker** (a network proxy, a different tool entirely — don't conflate them). Workers can `importScripts()`, or with `{ type: 'module' }` use real `import` statements. Bundlers detect `new Worker(new URL('./w.js', import.meta.url))` and split the worker into its own chunk automatically.

## 💻 Code

```js
// main.js — offload a CPU-heavy parse so scroll stays smooth
const worker = new Worker(new URL('./parser.worker.js', import.meta.url), {
  type: 'module',
});

worker.postMessage({ type: 'parse', text: hugeCsvString });

worker.onmessage = (e) => {
  render(e.data.rows);        // back on the main thread, DOM is available here
};
worker.onerror = (e) => console.error('worker crashed:', e.message);
```

```js
// parser.worker.js — no DOM here; only self / postMessage / importScripts
self.onmessage = (e) => {
  if (e.data.type === 'parse') {
    const rows = expensiveParse(e.data.text);  // 300ms of CPU, off the main thread
    self.postMessage({ rows });
  }
};
```

```js
// ✅ Transfer, don't clone — a 100MB buffer moves in ~0ms instead of copying
const buffer = bigFloat64Array.buffer;
worker.postMessage({ buffer }, [buffer]);   // 2nd arg = transfer list
// bigFloat64Array is now neutered on this side — don't touch it.
```

For request/response ergonomics, `Comlink` wraps the `postMessage` dance so a worker method reads like an `await`ed async call — worth it once you have more than one message type.

## ⚖️ Trade-offs

- **Serialization can dwarf the compute.** If the data is big and the work is small, the structured-clone cost makes the worker *slower* overall. Profile the round-trip before assuming it's a win — use transferables or `SharedArrayBuffer` when the payload is large.
- **No DOM, no `window`.** A worker can't measure or mutate the page. Anything touching layout has to come back to the main thread, so workers suit *pure computation*: parsing, crypto, image processing, diffing, physics, search indexing.
- **When NOT to use one:** short tasks (<50ms), anything DOM-bound, or code that's really slow because of *layout/paint* rather than JS — a worker won't help there. Fix the algorithm or use `scheduler.postTask`/`yield` for cooperative chunking first.
- **Fixed overhead.** Spawning a worker costs a few ms and its own memory; a pool of reusable workers beats spawn-per-task for frequent jobs.
- **Debugging is harder** — separate stack, separate scope, messages you have to trace across the boundary.

## 💣 Gotchas interviewers probe

- **"Do workers share memory with the main thread?"** No — by default everything is *copied*. Only `SharedArrayBuffer` shares, and only under cross-origin isolation. Saying "they share state" is a red flag.
- **Structured clone can't copy functions or DOM nodes.** Try to `postMessage` a function or an element and you get a `DataCloneError`.
- **Transferables neuter the source.** After transferring an `ArrayBuffer`, reading it on the sender throws or returns empty. Most people forget the sender loses it.
- **A worker won't fix jank caused by layout/paint.** If the bottleneck is style recalc or a huge DOM, moving JS off-thread does nothing — the main thread is still busy painting.
- **`SharedArrayBuffer` needs `COOP`/`COEP` headers** post-Spectre. It silently doesn't exist without cross-origin isolation, which trips people up.
- **Workers and the main thread each have their own event loop** — a `setTimeout` in a worker doesn't block the page, and vice versa.

## 🎯 Say this in the interview

> "The reason to reach for a worker is that the main thread is single-threaded and does everything the user sees — JS, layout, paint, input — so any task over about 50ms freezes the UI and tanks INP. A worker runs on its own OS thread with a separate JS environment and no DOM, and I communicate with it via `postMessage`, which structured-clones the data rather than sharing it. The mental model I keep is that workers don't make the work faster, they make the main thread *free* — the parse still costs 300ms of CPU, but it's no longer blocking scroll. The main cost to watch is serialization: if I'm shipping a big buffer I transfer it with the second `postMessage` argument instead of cloning, which moves ownership in near-zero time. So I use workers for pure computation — parsing, crypto, image work, search indexing — and keep anything DOM-bound on the main thread."

## 🔗 Go deeper

- [web.dev — Use Web Workers to run JavaScript off the browser's main thread](https://web.dev/articles/off-main-thread) — the case for off-main-thread work with real examples.
- [MDN — Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — the full API, message passing, and transferables.
- [MDN — Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) — how to move buffers without copying.
- [Comlink](https://github.com/GoogleChromeLabs/comlink) — makes worker calls look like normal async functions; kills the message-passing boilerplate.
