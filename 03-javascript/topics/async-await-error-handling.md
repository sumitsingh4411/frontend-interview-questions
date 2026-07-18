<div align="center">

# async / await + error handling

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#async`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `async`/`await` is not concurrency, it's *sequencing sugar over promises*: `await` suspends the function and hands control back to the event loop, resuming as a microtask. `try/catch` finally makes async errors behave like sync ones — but only if you actually `await` the thing inside the `try`.

---

## 🧠 Mental model

`await x` means: "evaluate `x` to a promise, park this function, let everything else run, and resume here — as a microtask — once that promise settles." The thread is **never blocked**; only *this one function* is paused. An `async` function always returns a promise, and a `throw` inside it becomes a rejection of that promise. That symmetry is the whole point: sync code uses `return`/`throw`, async code uses resolve/reject, and `await` lets you write the second in the shape of the first.

The trap hiding in that convenience is that `await` **serialises**. Each `await` waits for the previous one before starting the next, so a function full of independent `await`s runs slower than it needs to. `await` is for *dependencies*; `Promise.all` is for *independence*.

## ⚙️ How it actually works

Under the hood `await` is roughly a `.then()` continuation. The moment you hit `await`, the function returns a pending promise to its caller and schedules the rest of its body to run later on the **microtask queue** — the same queue as `.then()` callbacks, drained after the current task and before the next render or `setTimeout`.

Error handling has one genuinely senior subtlety: **`return await` vs `return`**.

```js
async function bad() {
  try {
    return fetchUser();      // ❌ returns the promise, function already exited
  } catch (e) {              //    the try/catch is GONE by the time it rejects
    return fallback();       //    → this NEVER runs
  }
}

async function good() {
  try {
    return await fetchUser(); // ✅ stays parked inside the try, so catch can fire
  } catch (e) {
    return fallback();
  }
}
```

`return promise` hands the promise back and unwinds the stack — the `catch` is out of scope before rejection arrives. `return await promise` keeps the frame alive inside the `try`. Outside a `try`, the two are behaviourally identical (and `return await` costs one extra microtask tick), which is why linters flag it *except* inside try/catch.

## 💻 Code

```js
// ❌ Accidentally sequential — 3 requests, one after another (~3× the latency)
const a = await getA(); // waits
const b = await getB(); // then waits again, though it needs nothing from a
const c = await getC();

// ✅ Fire all three, then await together
const [a, b, c] = await Promise.all([getA(), getB(), getC()]);

// Awaiting in a loop is sequential BY DESIGN — good for rate limits, bad for throughput
for (const id of ids) {
  await process(id);            // one at a time
}

// Parallel with a cap on failures surfacing:
const results = await Promise.allSettled(ids.map(process));
const failed = results.filter((r) => r.status === 'rejected');
```

```js
// forEach does NOT await — the async callbacks fly off and the loop finishes instantly
ids.forEach(async (id) => { await save(id); }); // ❌ "done" logs before any save
console.log('done');
// Use for...of (sequential) or Promise.all(map(...)) (parallel) instead.
```

## ⚖️ Trade-offs

- **Readability vs. hidden serialisation.** `await` reads top-to-bottom like sync code, which is exactly why people accidentally serialise independent work. The linear look hides the latency cost.
- **`try/catch` vs `.catch()`.** try/catch is great for a whole block; per-operation recovery (`fetchX().catch(fallback)`) can be cleaner than wrapping each in its own try. Mix deliberately.
- **When not to reach for it:** fire-and-forget side effects where you never consume the result — an unawaited async call there just risks an unhandled rejection. And a bare `await` at module top level (top-level `await`) blocks the module graph, delaying every importer; use it for genuine init, not convenience.

## 💣 Gotchas interviewers probe

- **"Does `await` block the thread?"** No. It suspends the *function* and yields to the event loop. Saying "it blocks" is an instant junior signal.
- **`return promise` inside `try/catch` won't be caught.** The single highest-value detail here — use `return await` when you need the catch.
- **`await` resumes as a *microtask*, not a macrotask.** So `await null` still defers to the next microtick — it doesn't run synchronously even though the value is already available.
- **An async function that rejects with no handler → `unhandledrejection`.** Every branch that can throw needs a catch somewhere, or the process/window fires the global handler.
- **`Promise.all` rejects on the *first* failure** and abandons your other results (though those tasks keep running). Use `allSettled` when partial success matters.
- **`await` in a `.forEach` / `.map` without collecting the promises** silently loses ordering and error handling. `for...of` awaits; array methods don't.
- **`finally` runs but can't see the value/error** — and a `return`/`throw` inside `finally` overrides whatever the try/catch produced. A subtle way to swallow errors.

## 🎯 Say this in the interview

> "I think of `await` as `.then()` with better ergonomics — it suspends the async function and schedules the rest as a microtask, so the thread's never blocked, only that function is. The mistake I watch for is accidental serialisation: if three requests don't depend on each other I use `Promise.all`, not three sequential `await`s. For errors, `try/catch` around awaited code behaves just like synchronous throw/catch — with one gotcha: inside a `try`, `return somePromise()` escapes the catch because the function has already unwound, so if I need the catch to fire I write `return await`. And I never use `forEach` with async callbacks — it doesn't await — I use `for...of` for sequential or `Promise.all(map(...))` for parallel."

## 🔗 Go deeper

- [javascript.info — Async/await](https://javascript.info/async-await) — the mechanism and its relationship to promises.
- [MDN — await](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await) — exact semantics, including thenable handling.
- [V8 — Faster async functions and promises](https://v8.dev/blog/fast-async) — why `return await` used to cost extra ticks and how the engine optimises it.
- [MDN — Promise.allSettled](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) — the right tool when partial success is acceptable.
