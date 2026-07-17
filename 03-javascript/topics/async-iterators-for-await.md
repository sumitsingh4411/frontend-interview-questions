<div align="center">

# Async iterators & `for await`

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 45m · `#async` `#iterators`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An async iterator is a **pull** protocol where `next()` returns a `Promise<{value, done}>`; `for await` drains it **strictly one at a time**, which makes it the right tool for streams and pagination and the *wrong* tool for anything you wanted to run in parallel.

---

## 🧠 Mental model

Two axes, four quadrants. Pick the box, and the API picks itself:

| | one value | many values |
|---|---|---|
| **sync** | return | `Symbol.iterator` |
| **async** | `Promise` | `Symbol.asyncIterator` |

The bottom-right cell was the hole in the language until ES2018. Before it, "many values over time" meant **push** — event emitters, callbacks, observables — where the producer decides when you get data and you cope. An async iterator inverts that: **the consumer asks, and the producer answers when it can.** That single inversion is backpressure for free. Your `for await` body can take 400ms per item and the producer simply doesn't get asked for the next chunk until you're done. No buffer grows behind your back.

So: `Promise` is a one-shot pull. An async iterator is a repeated pull. `for await` is the sugar that makes the repeated pull look like a `for` loop.

## ⚙️ How it actually works

`for await (const x of src)` desugars to roughly this:

```js
// 1. Prefer Symbol.asyncIterator. FALL BACK to Symbol.iterator and await each value.
const it = src[Symbol.asyncIterator]?.() ?? src[Symbol.iterator]();
let res;
while (!(res = await it.next()).done) {   // await the RESULT OBJECT
  const x = await res.value;              // and (in the sync-fallback path) the value
  // ...body...
}
// on break/return/throw: await it.return?.()  ← the cleanup hook
```

Three mechanisms worth naming:

**The fallback is why `for await` works on an array of promises.** There's no async iterator on `Array.prototype`; the sync iterator is used and each yielded promise is awaited. This is a convenience, and a trap — see gotchas.

**Async generators serialise `next()` internally.** `async function*` maintains a request queue: call `next()` three times without awaiting and the generator body still runs to one `yield` at a time, resolving your promises in order. You cannot accidentally re-enter the body. That's why an async generator is a safe place to hold connection state.

**`break` runs `return()`, and `return()` is awaited.** In an async generator, that means `finally` blocks execute — which is where you close the socket, release the reader lock, abort the fetch. This is the whole reason `for await` beats a hand-rolled `while (true)` loop.

## 💻 Code

The canonical use: paginated API as a flat loop.

```js
async function* pages(url, { signal } = {}) {
  let next = url;
  try {
    while (next) {
      const res = await fetch(next, { signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`); // rejects the pending next()
      const { items, nextUrl } = await res.json();
      yield* items;        // yield* delegates: emits each item individually
      next = nextUrl;      // never fetched until the consumer asks again ← backpressure
    }
  } finally {
    // Runs on break, on throw, on early return. Guaranteed cleanup.
    console.log('generator torn down');
  }
}

const ac = new AbortController();
for await (const item of pages('/api/users', { signal: ac.signal })) {
  if (item.id === target) break;   // → calls .return() → hits `finally` → no page N+1 fetched
}
```

Sequential-by-design is the sharp edge:

```js
// ❌ 100 requests, one at a time. ~100× slower than you think.
for await (const r of urls.map(u => fetch(u))) { /* ... */ }
//         ^ WORSE: every fetch already started (map is eager). If urls[3] rejects
//           while you're awaiting urls[0], nobody is attached to it yet →
//           unhandled rejection, and in Node that can kill the process.

// ✅ Want parallel? That is not an iteration problem. That is Promise.all.
const results = await Promise.all(urls.map(u => fetch(u)));

// ✅ Want parallel WITH a cap, streamed back? Then it's a pool, not a for await.
```

## ⚖️ Trade-offs

- **You are buying ordering and backpressure, and paying in latency.** One microtask-plus-promise per item is real overhead: don't `for await` a million-element in-memory array to feel modern. A plain `for` over already-resolved data is orders of magnitude cheaper.
- **Don't use it when you don't control the producer's rate.** Async iterators are pull-based; genuine push sources (DOM events, WebSocket frames) have to be buffered into an unbounded queue to be adapted, which reinstates the exact problem backpressure solved. For those, an event listener or an observable is the honest model.
- **Async generators are single-consumer.** Two `for await` loops over the same generator interleave and each sees *some* of the values. If you need fan-out, you need a tee/broadcast layer — `ReadableStream.tee()` exists precisely because this is hard.
- **`yield` inside `.forEach()` doesn't exist.** An async generator can only yield from its own body, so callback-shaped producers must be rewritten as loops.

## 💣 Gotchas interviewers probe

- **"Does `for await` run things in parallel?"** No — and this is the answer that separates candidates. It awaits each `next()` before requesting the following one. The concurrency you want is `Promise.all` or a bounded pool.
- **`for await` over `.map(fn)` starts everything eagerly.** The loop only *awaits* serially; the work already launched. You get the worst of both: full parallel load on the server, serial latency for you, plus unhandled-rejection risk for later entries.
- **Async iterator ≠ async generator.** The generator is one *implementation* of the protocol. The protocol is just an object with `[Symbol.asyncIterator]()` returning `{ next() }`. Interviewers ask you to hand-roll it.
- **`return`/`throw` are optional.** Consuming an arbitrary iterable with `it.return()` unguarded throws; the spec calls it optionally, hence `it.return?.()`.
- **A rejected `next()` ends the iteration.** Once the loop throws, the iterator is done — you can't `try/catch` inside the loop body and expect the next item. Put the `try` *inside* the generator if you want to skip bad records.
- **`await` in a `finally` still runs on `break`.** Slow teardown silently delays the code after your loop. People are surprised that `break` isn't instant.
- **Top-level `for await` needs a module.** Same rule as top-level `await`: ESM only, not CJS.
- **Sync iterator helpers (`.map`, `.take`) shipped; the async ones are still a proposal.** Don't claim `asyncIterator.map()` is available everywhere — that's a knowledge tell.

## 🎯 Say this in the interview

> "An async iterator is the async version of the iteration protocol: `Symbol.asyncIterator` returns an object whose `next()` gives back a promise of `{ value, done }`. `for await` drains it, and the important property is that it's strictly sequential — it awaits one `next()` before asking for the next. That's a feature, not a limitation: it gives me backpressure, so a paginated API never fetches page two until I've finished processing page one. The thing I'd flag is that people reach for `for await` over `urls.map(fetch)` thinking it parallelises. It doesn't — the fetches all started eagerly and you just await them in order, so you get serial latency plus unhandled rejections on the later ones. If I want concurrency I use `Promise.all` or a bounded pool; `for await` is for streams. And I'd write it as an async generator specifically so that `break` triggers `return()` and my `finally` block tears the connection down."

## 🔗 Go deeper

- [javascript.info — Async iteration and generators](https://javascript.info/async-iterators-generators) — the clearest walkthrough of the protocol and the sync/async fallback.
- [MDN — `Symbol.asyncIterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/asyncIterator) — the exact protocol contract.
- [MDN — `for await...of`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/for-await...of) — including the array-of-promises fallback semantics people misread.
- [MDN — Streams API concepts](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API/Concepts) — where backpressure stops being theory.
