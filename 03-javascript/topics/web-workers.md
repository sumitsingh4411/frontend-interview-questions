<div align="center">

# Web Workers

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#workers` `#performance`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A Web Worker runs JavaScript on a **separate OS thread** with its own event loop, so heavy CPU work never blocks the main thread that paints and handles input. It has no DOM access; you talk to it only through `postMessage`, which copies (or transfers) data across the thread boundary.

---

## 🧠 Mental model

The browser's main thread does *everything visible*: layout, paint, input handling, and your JS — all on **one thread**. A long synchronous task (parsing a 10MB JSON, running an image filter) freezes all of it: the page can't scroll, buttons don't respond, animations jank. This is the "one thread, one problem" reality of the web.

A Web Worker is a second thread whose only job is to run script. Think of it as a **colleague in another room**: they can do heavy lifting in parallel, but they can't touch your desk (the DOM) and you can only communicate by **passing notes** (`postMessage`). Nothing is shared by default — each thread has its own memory, its own globals, its own event loop.

The design consequence: workers are for **CPU-bound** work you want *off* the main thread. They do nothing for I/O — `fetch` is already async and non-blocking on the main thread.

## ⚙️ How it actually works

You spawn a worker from a script URL; it runs in a `DedicatedWorkerGlobalScope` (aliased `self`) with **no `window`, no `document`, no DOM** — but it *does* have `fetch`, `WebSocket`, `IndexedDB`, timers, and `importScripts`/ESM.

Communication is **message passing over a channel**, and the critical detail is *how the data crosses*:

- **Structured clone (default):** `postMessage(obj)` deep-copies the object using the structured clone algorithm. Handles Maps, Sets, Dates, typed arrays, cyclic refs — but **not** functions, DOM nodes, or class prototypes. Copying a large object is O(size) and itself blocking, so a huge payload can defeat the point.
- **Transferable objects:** for `ArrayBuffer`, `MessagePort`, `ImageBitmap`, `OffscreenCanvas`, you pass a second arg — `postMessage(buf, [buf])` — to **transfer ownership** with zero copy. The buffer becomes *neutered* (unusable) on the sender's side. This is the difference between shipping a photocopy and handing over the original.
- **SharedArrayBuffer:** genuinely *shared* memory across threads (no copy, no transfer), coordinated with `Atomics`. Gated behind cross-origin isolation (`COOP`/`COEP` headers) since Spectre.

Modern spawning uses ESM workers, which lets bundlers resolve dependencies:

```js
new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });
```

Because a worker has its own event loop, a `while(true)` inside it spins *its* thread, not yours — that isolation is the whole value.

## 💻 Code

```js
// main.js
const worker = new Worker(new URL('./sort.worker.js', import.meta.url), { type: 'module' });

worker.onmessage = (e) => render(e.data);          // receive result
worker.onerror   = (e) => console.error(e.message); // worker-thread errors surface here

// Zero-copy transfer of a big buffer — `buffer` is neutered here afterwards.
const buffer = new Float64Array(1e7).buffer;
worker.postMessage({ cmd: 'sort', buffer }, [buffer]);

worker.terminate(); // kill it from outside — frees the thread immediately

// sort.worker.js  (its own global scope; `self`, no DOM)
self.onmessage = (e) => {
  const arr = new Float64Array(e.data.buffer);
  arr.sort();                                        // heavy CPU work, off main thread
  self.postMessage(arr.buffer, [arr.buffer]);        // transfer back, zero-copy
  // self.close(); // terminate from inside
};
```

Wrapping the postMessage dance in a promise (via [Comlink](https://github.com/GoogleChromeLabs/comlink)) makes a worker feel like a normal async API — worth mentioning.

## ⚖️ Trade-offs

- **Use for CPU-bound work:** parsing/serialising large data, image/video processing, crypto, syntax highlighting, physics, big sorts/searches. Anything that would otherwise stall the frame budget (~16ms at 60fps).
- **When NOT to use:** I/O-bound work (already async), tiny tasks (spawn + message overhead dwarfs the work), or anything needing the DOM. A worker that does 2ms of work but 5ms of cloning is a net loss.
- **Data cost is the hidden trade-off.** Structured clone copies; a huge object costs real time *twice* (out and back). Transferables or `SharedArrayBuffer` are how you avoid it — reach for them when payloads are large.
- **Complexity:** separate file, no shared state, async everything, harder debugging. Justify it with a measured main-thread stall, not a hunch.
- **Memory:** each worker is a real thread with its own heap/VM overhead (order of a few MB). Pool and reuse them; don't spawn one per task.

## 💣 Gotchas interviewers probe

- **No DOM in a worker.** No `window`, `document`, `alert`, or `localStorage`. Candidates who try to update the UI from a worker miss the core constraint — post the result back and let the main thread render.
- **`postMessage` copies by default.** It's structured clone, not a reference share — mutating the object on one side never affects the other. And functions/DOM nodes/class instances don't survive the clone.
- **Transfer neuters the source.** After `postMessage(buf, [buf])`, `buf` is unusable on the sender. Reading it throws/returns empty. Surprises everyone the first time.
- **`SharedArrayBuffer` needs cross-origin isolation** (`COOP`/`COEP`). Not knowing why it's often unavailable is a gap.
- **Workers don't auto-terminate** on navigation the way you might expect for some; call `terminate()`/`close()` or you leak threads. Pool them for repeated work.
- **Errors don't propagate to the main thread's try/catch** — you handle them via `worker.onerror`/`messageerror`.

## 🎯 Say this in the interview

> "A Web Worker is a real second thread with its own event loop, so CPU-heavy work runs in parallel instead of blocking the main thread that paints and handles input. The constraints define the tool: no DOM access, and communication only through `postMessage`, which by default deep-copies data with the structured clone algorithm. That copy is the hidden cost — for large payloads I use transferable objects like `ArrayBuffer`, passing them in the transfer list so ownership moves with zero copy, though that neuters the buffer on my side, or `SharedArrayBuffer` with `Atomics` when I need genuinely shared memory. I reach for workers on CPU-bound work — parsing megabytes of JSON, image processing, big sorts — never for I/O, which is already async, and never for tiny tasks where the messaging overhead exceeds the work. In production I pool and reuse workers rather than spawning per task, and I often wrap the message protocol with Comlink so it reads like a normal async call."

## 🔗 Go deeper

- [MDN — Using Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — the full lifecycle, message passing, and error handling.
- [MDN — Transferable objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects) — zero-copy transfer semantics and neutering.
- [web.dev — Use web workers to run JS off the main thread](https://web.dev/articles/off-main-thread) — when it actually pays off, with Comlink.
