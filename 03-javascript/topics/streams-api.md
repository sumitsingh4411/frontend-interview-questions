<div align="center">

# Streams API

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 1h · `#streams`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The Streams API lets you process data **chunk by chunk as it arrives** instead of buffering the whole thing in memory. Its defining feature is **backpressure**: a slow consumer automatically signals the producer to slow down, so you never fill up RAM streaming a 4GB file.

---

## 🧠 Mental model

Most JS handles data as a **complete value** — `await res.json()` waits for the entire body, then hands you one object. Streams handle data as a **flow** — you get the first chunk while the rest is still downloading, process it, discard it, and move on. Constant memory, first-byte-fast, cancellable.

Three stream types, and they compose like Unix pipes:

```
ReadableStream ──▶ TransformStream ──▶ WritableStream
   (source)          (middle)            (sink)
   .pipeThrough(transform).pipeTo(sink)
```

- **ReadableStream** — a source you pull from (a `fetch` body, a file, a generator).
- **WritableStream** — a sink you push to (a file, a socket, the console).
- **TransformStream** — a writable+readable pair; write chunks in, transformed chunks come out (compression, text decoding, JSON parsing).

The genius is **backpressure**. In a naive "producer pushes as fast as it can" model, a fast source and slow sink means the buffer between them grows unbounded — an OOM. Streams invert control: the consumer *pulls*, and the pipe only asks the producer for more when the downstream buffer (the "highWaterMark") has room. Flow rate self-regulates end to end.

## ⚙️ How it actually works

You consume a readable via a **reader**, pulling `{ value, done }` — deliberately the same shape as the iterator protocol, and indeed `ReadableStream` is now **async-iterable**, so `for await...of` works directly:

```js
for await (const chunk of readable) { process(chunk); }   // simplest consumption
```

Under the hood each stream has an internal **queue** bounded by a `highWaterMark` and a `size()` strategy. When the queue is full, the source's `pull` isn't called; `writer.write()` returns a promise that only resolves when there's room. Awaiting that promise is *how you honour backpressure by hand*. `pipeTo`/`pipeThrough` wire this plumbing — and error/close propagation — for you, which is why you almost always prefer them to a manual read loop.

**Two reader modes:** the default gives you whatever chunks the source emits; a **BYOB (bring-your-own-buffer)** reader lets you supply an `ArrayBuffer` to read *into*, avoiding an allocation per chunk for byte streams.

Streams are **transferable** (you can `postMessage` a stream to a worker) and **cancellable** — `reader.cancel()` or an `AbortSignal` tears down the whole pipeline and releases the source. This is what makes streamed rendering (React Server Components, streamed HTML) and progressive downloads possible.

## 💻 Code

```js
// Stream a large download, count bytes as they arrive — never buffers the whole body.
const res = await fetch('/big-file');
let bytes = 0;
for await (const chunk of res.body) {          // res.body is a ReadableStream
  bytes += chunk.byteLength;                     // process each chunk, then drop it
  updateProgress(bytes, +res.headers.get('content-length'));
}

// Pipe with a transform — decode bytes → text → uppercase, honouring backpressure.
const upper = new TransformStream({
  transform(chunk, controller) { controller.enqueue(chunk.toUpperCase()); },
});
await res.body
  .pipeThrough(new TextDecoderStream())          // Uint8Array → string
  .pipeThrough(upper)
  .pipeTo(new WritableStream({                    // the sink; write() applies backpressure
    write(text) { return append(text); },        // returning a promise throttles the source
  }));

// Manual read loop — always releaseLock() and handle done.
const reader = res.body.getReader();
try {
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    handle(value);
  }
} finally { reader.releaseLock(); }
```

## ⚖️ Trade-offs

- **Use for large or unbounded data:** multi-GB downloads/uploads, log tailing, streamed HTML/SSR, real-time media, transforming data too big to fit in memory. Constant memory + fast first byte are the wins.
- **When NOT to use:** small payloads. `await res.json()` on a 5KB API response is simpler and the streaming machinery is pure overhead. Streams earn their complexity only past the point where buffering hurts.
- **Complexity + async everywhere.** Manual readers require careful `releaseLock`, `done` handling, and error propagation. Prefer `pipeThrough`/`pipeTo`, which handle backpressure and teardown correctly — hand-rolled loops are where the bugs live.
- **Uneven support/ergonomics historically** — async iteration of `res.body` landed later in some engines; `WritableStream`/`TransformStream` came after `ReadableStream`. Check targets.

## 💣 Gotchas interviewers probe

- **Backpressure is the whole point.** If you describe streams as "just chunked callbacks" and miss that the consumer regulates the producer, you've missed why they exist. `write()` returning a promise *is* the backpressure signal.
- **A stream is single-consumer.** Once you `getReader()`, the stream is *locked* — you can't read it twice. To fan out, `.tee()` it into two branches (but the slower branch buffers, re-introducing memory pressure).
- **`res.body` can only be consumed once.** Read it as a stream *or* call `res.json()`/`.text()`, not both — the second throws "body already used". Clone the response first if you need both.
- **Always `releaseLock()`** in a manual reader (and on error), or the stream stays locked and downstream code can't touch it.
- **Cancellation must propagate.** Use an `AbortSignal` or `reader.cancel()` so aborting a fetch actually tears down the source; forgetting it leaks the connection.
- **`highWaterMark` tuning.** Too small starves throughput; too large defeats backpressure. It's a real knob, not a formality.

## 🎯 Say this in the interview

> "Streams process data chunk by chunk as it arrives instead of buffering the whole payload, so you get constant memory and a fast first byte. There are three types — readable sources, writable sinks, and transforms in the middle — and they compose like Unix pipes with `pipeThrough` and `pipeTo`. The defining feature is backpressure: the consumer pulls, and the pipe only asks the producer for more when the downstream buffer has room, so a slow sink automatically throttles a fast source and you never OOM streaming a huge file. Concretely, `writer.write()` returning a promise that resolves when there's space *is* the backpressure signal, and `pipeTo` honours it for me. `fetch`'s `res.body` is a readable stream and it's async-iterable, so I can `for await` over chunks. The traps I watch for: a stream is single-consumer and gets locked on `getReader`, `res.body` can only be read once, and I always `releaseLock` and wire an `AbortSignal` so cancellation tears down the source."

## 🔗 Go deeper

- [MDN — Streams API concepts](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) — readable/writable/transform and the backpressure model.
- [MDN — Using readable streams](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Using_readable_streams) — readers, `tee`, locking, and consumption patterns.
- [web.dev — Streams — the definitive guide](https://web.dev/articles/streams) — pipes, backpressure, and transform streams with runnable examples.
