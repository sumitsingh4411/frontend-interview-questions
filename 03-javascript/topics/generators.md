<div align="center">

# Generators

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 1h · `#generators`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A generator is a function that can **pause and resume**, yielding values one at a time and preserving its entire local state between calls. `yield` is a two-way door: it sends a value *out* and, on the next `next(v)`, receives a value *in*.

---

## 🧠 Mental model

A normal function runs to completion the moment you call it. A generator, marked `function*`, does the opposite: calling it **runs nothing** — it returns an *iterator* frozen at the top. Each `.next()` runs the body until the next `yield`, then **freezes the stack** — locals, loop counters, the instruction pointer, all preserved — and hands control back to you.

```
gen()  → returns iterator (nothing executed yet)
.next()→ runs to first yield, pauses,     returns { value, done: false }
.next()→ resumes, runs to next yield,      returns { value, done: false }
.next()→ resumes, hits return/end,         returns { value, done: true  }
```

The killer insight: **`yield` is bidirectional.** It emits a value, but it also *evaluates to* whatever you pass into the next `next(x)`. That turns a generator into a coroutine — a function you can converse with — which is the whole basis of how `async/await` was originally polyfilled.

## ⚙️ How it actually works

A generator object is an **iterator that is also iterable** (`[Symbol.iterator]` returns itself), so it drops straight into `for...of`, spread, and destructuring.

The protocol has three control methods, and the two beyond `next` are what separate a strong answer:

- **`gen.next(v)`** — resume; `v` becomes the value the paused `yield` expression evaluates to. The *first* `next`'s argument is discarded (there's no yield waiting yet — a favourite gotcha).
- **`gen.return(v)`** — force early completion: sets `done: true`, and critically **runs `finally` blocks** so cleanup happens. This is how `for...of` breaking early releases resources.
- **`gen.throw(err)`** — inject an exception *at the paused `yield`*, which the generator's own `try/catch` can handle. This is how error propagation works in coroutine-style async.

**`yield*`** delegates to another iterable, forwarding `next`/`return`/`throw` through it and evaluating to that inner generator's `return` value — the composition primitive for generators.

Because state lives on the frozen stack rather than in the heap, generators produce **lazy, infinite, O(1)-memory** sequences: an infinite ID generator holds one number, not an array.

## 💻 Code

```js
// Lazy infinite sequence — constant memory, values on demand.
function* naturals() {
  let n = 1;
  while (true) yield n++;           // pauses here forever, resumes on next()
}
const ids = naturals();
ids.next().value; // 1
ids.next().value; // 2  (n survived across calls)

// yield is two-way: it RECEIVES the argument of the next next().
function* echo() {
  while (true) {
    const received = yield;         // paused here; value comes from next(x)
    console.log('got', received);
  }
}
const e = echo();
e.next();          // prime it: run up to the first yield
e.next('hello');   // logs "got hello"

// return() runs finally → guaranteed cleanup on early exit.
function* withCleanup() {
  try { yield 1; yield 2; }
  finally { console.log('cleanup'); }   // runs even if consumer breaks early
}
for (const x of withCleanup()) { if (x === 1) break; } // logs "cleanup"

// yield* delegates and captures the delegate's return value.
function* inner() { yield 'a'; return 'done'; }
function* outer() { const r = yield* inner(); yield r; } // yields 'a', then 'done'
```

## ⚖️ Trade-offs

- **Laziness is the point.** Generators shine for infinite/unbounded streams, pagination ("give me the next page only when asked"), and pipelines that shouldn't materialise the whole collection. If you just need an array now, `map`/`filter` are simpler and faster.
- **When NOT to use them:** hot numeric loops. Each `yield` is a suspend/resume with real overhead — a generator iterating millions of numbers is markedly slower than a plain `for`. Don't reach for elegance in a bottleneck.
- **They're single-pass.** Once exhausted, a generator is dead; you can't rewind or reuse it. Re-invoke the generator *function* to get a fresh one.
- **Debugging is harder** — the call stack pauses and resumes, so stepping through in DevTools jumps around. Worth it for the model, painful under pressure.

## 💣 Gotchas interviewers probe

- **The first `next()` argument is ignored.** There's no suspended `yield` to receive it yet. You must "prime" the generator with a bare `.next()` before sending values. Nearly everyone gets this wrong.
- **Calling a generator runs no code.** It returns an iterator; the body executes only on `.next()`. Candidates expect side effects to fire on call.
- **`return()` and `finally`.** Early termination (a `break` in `for...of`) calls `return()`, which runs `finally` for cleanup. Not knowing this means your resource cleanup silently never runs.
- **`throw()` resumes *inside* the generator** — the injected error surfaces at the paused `yield` and hits its `try/catch`, not the caller's.
- **Generators vs. async generators.** `async function*` + `for await...of` is the streaming form; a plain generator can't `await`. Conflating them is common.
- **Spreading an infinite generator hangs the tab.** `[...naturals()]` never terminates. Laziness only helps if the *consumer* is also lazy.

## 🎯 Say this in the interview

> "A generator is a pausable function. `function*` plus `yield` lets it emit a value, freeze its entire local state on the stack, and resume exactly where it left off on the next `.next()`. The subtle part is that `yield` is two-way — it sends a value out and evaluates to whatever you pass into `next(v)` — which is what makes it a coroutine and is how `async/await` was originally implemented. Calling the generator runs nothing; it returns an iterator, and it's iterable too, so it works with `for...of` and spread. Beyond `next`, I use `return()` — which runs `finally` blocks for cleanup on early exit — and `throw()`, which injects an error at the paused yield. The practical win is laziness: infinite or paginated sequences in constant memory. The classic trap is that the first `next()`'s argument is discarded, so I prime the generator before sending values in."

## 🔗 Go deeper

- [javascript.info — Generators](https://javascript.info/generators) — the two-way `yield`, `yield*`, and the full protocol, clearly worked.
- [MDN — function*](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function*) — the exact semantics of `next`/`return`/`throw`.
- [MDN — Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) — how generators satisfy iterator *and* iterable.
