<div align="center">

# Promises (states, chaining)

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#async` `#promises`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A promise is a **single-shot** container for a future value in one of three states — *pending*, *fulfilled*, *rejected* — that transitions **at most once** and is immutable after. `.then` returns a **new** promise; what you *return* from a handler becomes the next link's value, and what you *throw* becomes its rejection.

---

## 🧠 Mental model

A promise is a placeholder with a contract. Two rules define it:

- **Settles at most once.** Pending → fulfilled *or* pending → rejected, then frozen forever. Call `resolve` twice and the second call is a no-op.
- **Handlers always run asynchronously**, as microtasks — even if the promise is *already* settled when you attach them. This is deliberate: it kills the "sometimes-sync, sometimes-async" (Zalgo) bug that plagues raw callbacks.

The magic verb is **chaining**. `.then` doesn't mutate the promise — it returns a *brand new* promise whose fate depends on what your handler does. Return a value → the new promise fulfills with it. Return a thenable → the chain *waits* for it and adopts its result. Throw → the new promise rejects. That's the entire model; everything else follows.

## ⚙️ How it actually works

`.then(onFulfilled, onRejected)` returns a new promise resolved by the **Promise Resolution Procedure**:

- Handler returns a plain value → next promise fulfills with it.
- Handler returns a **thenable** → next promise *assimilates* it (waits, then adopts its state). This is why you **never nest** `.then` — you `return` the inner promise and keep the chain flat.
- Handler **throws** (or returns a rejected promise) → next promise rejects, and control **skips forward** to the next rejection handler.

`.catch(fn)` is literally `.then(undefined, fn)`. `.finally(fn)` runs on both paths and **passes the value/reason through unchanged** — its callback receives no arguments and its return value is ignored (unless it throws).

The senior distinction: **`.then(onF, onR)` is not the same as `.then(onF).catch(onR)`.** In the two-argument form, `onR` and `onF` are *siblings* — `onR` cannot catch an error thrown by `onF`, because `onF` is already running on the same rung. The chained `.catch` sits *downstream*, so it catches both the original rejection **and** anything `onF` throws. Reach for the chained form by default.

## 💻 Code

```js
// Return flows to the next .then; a throw/rejection skips to .catch
fetch(url)
  .then((res) => {
    // ⚠️ fetch does NOT reject on 404/500 — only on network failure
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();          // returning a promise → the chain WAITS for it
  })
  .then((data) => render(data)) // receives the resolved json, not a promise
  .catch((err) => showError(err))  // catches network errors AND the thrown HTTP error
  .finally(() => hideSpinner());   // runs on success and failure; args ignored
```

```js
// ❌ The two-arg .then trap — onError can't catch onSuccess's throw
promise.then(
  (v) => { throw new Error('in success handler'); },
  (e) => console.log('caught?')   // NEVER runs — it's a sibling, not downstream
);

// ✅ The chained form catches both
promise
  .then((v) => { throw new Error('in success handler'); })
  .catch((e) => console.log('caught')); // runs
```

```js
// The executor runs SYNCHRONOUSLY, and resolve() does not stop execution
new Promise((resolve) => {
  resolve(1);
  console.log('still runs'); // logs — resolve doesn't `return`
});
```

## ⚖️ Trade-offs

- **Promises fix inversion of control** — settle-once, immutable, always-async — which raw callbacks can't guarantee. That's their real value, not the syntax.
- **They're single-shot.** A promise represents *one* future value. For streams of values (clicks, socket messages) an async iterator or an observable fits; forcing a promise there is wrong.
- **`async/await` is usually the more readable consumer**, but promises are the substrate. You still need `.then`/`Promise.all` for fan-out, and you must understand chaining to debug an `await` that behaves oddly.
- **When NOT to hand-roll `new Promise`:** if you already have a promise, wrap/transform it — don't wrap a promise in `new Promise`, which is the "explicit promise construction antipattern" and swallows errors.

## 💣 Gotchas interviewers probe

- **`fetch` does not reject on HTTP errors.** A 404 or 500 still *fulfills*; you must check `res.ok` and throw yourself. The single most common promise bug in real code.
- **Forgetting to `return` inside a `.then`.** The next handler receives `undefined`, and rejections escape the chain. "It works but the data is undefined" almost always means a missing `return`.
- **`.then(onF, onR)` vs `.then(onF).catch(onR)`.** The two-arg `onR` can't catch `onF`'s throw. Interviewers love this one.
- **The executor is synchronous.** `new Promise(fn)` runs `fn` immediately; and `resolve()` doesn't halt — code after it still executes.
- **Resolving with a thenable adopts its state.** `Promise.resolve(anotherPromise)` doesn't wrap it in a layer — it flattens. Promises can't nest.
- **Unhandled rejection.** A rejected promise with no `.catch` fires `unhandledrejection` and, in Node, can crash the process. Every chain needs a terminal error handler.
- **`.finally` gets no arguments** and can't change the value — but it *can* override the outcome by throwing.

## 🎯 Say this in the interview

> "A promise is a single-shot box for a future value with three states — pending, fulfilled, rejected — that transitions at most once and then is immutable, and its handlers always fire asynchronously as microtasks, which kills the sync/async ambiguity callbacks have. The engine of it is chaining: `.then` returns a *new* promise, so whatever I return becomes the next value, returning a promise makes the chain wait and flatten, and throwing jumps to the next `.catch`. Two things I'm careful about: `fetch` only rejects on network failure, so I check `res.ok` and throw for HTTP errors; and I prefer a downstream `.catch` over the two-argument `.then(onF, onR)`, because in the two-arg form the error handler can't catch a throw from the success handler — they're siblings. And every chain needs a terminal `.catch`, or I get an unhandled rejection."

## 🔗 Go deeper

- [javascript.info — Promise basics](https://javascript.info/promise-basics) — states, the executor, and why handlers are async.
- [javascript.info — Promises chaining](https://javascript.info/promise-chaining) — return values, thenable assimilation, flattening.
- [MDN — Using promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) — chaining, error propagation, and common antipatterns.
- [Promises/A+ specification](https://promisesaplus.com/) — the exact resolution procedure the language implements.
