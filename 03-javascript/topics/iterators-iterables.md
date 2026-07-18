<div align="center">

# Iterators & iterables

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#iterators`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An **iterable** is any object with a `[Symbol.iterator]()` method; an **iterator** is the object it returns, with a `next()` that yields `{ value, done }`. `for...of`, spread, and destructuring are all just sugar over this protocol — implement it and your object works everywhere they do.

---

## 🧠 Mental model

Two roles people constantly merge:

| Role | Contract | Answer to |
|---|---|---|
| **Iterable** | has `[Symbol.iterator]()` | "*Can* you be looped?" |
| **Iterator** | has `next() → { value, done }` | "What's the *next* value?" |

An iterable is a **factory**; calling its `[Symbol.iterator]()` produces a fresh iterator — a cursor with state. `Array`, `String`, `Map`, `Set`, `arguments`, `NodeList`, and generators are all built-in iterables. Plain objects are **not** — which is why `for...of {}` throws.

The mental unlock: `for...of`, `[...x]`, `Array.from(x)`, `const [a,b] = x`, `Promise.all(x)`, and `new Map(x)` don't know about arrays specifically — they all speak *the iterator protocol*. Satisfy it and you plug straight into the entire language.

## ⚙️ How it actually works

`for...of x` desugars to roughly:

```js
const it = x[Symbol.iterator]();     // get an iterator
let step;
while (!(step = it.next()).done) {   // pull until done:true
  const value = step.value;
  // ...loop body...
}
```

The protocol's third, optional method matters at senior level: **`return()`**. When a loop exits early (`break`, `throw`, or an error), the runtime calls `iterator.return()` so the iterator can **clean up** — close a file, release a lock. Generators implement this for free (it runs their `finally`); hand-rolled iterators should too, or early exits leak.

A subtle but heavily-tested distinction: many built-ins are **iterables that return a *fresh* iterator each time**, so you can loop them twice. But a generator object is an iterator that *is its own iterable* (`[Symbol.iterator]()` returns `this`) — so it's **one-shot**: loop it once and it's exhausted. Knowing which kind you hold predicts whether a second loop yields anything.

The cleanest way to *make* something iterable is to define `[Symbol.iterator]` as a generator method — you get `next`, `return`, and lazy evaluation for free.

## 💻 Code

```js
// Make a plain object iterable with a generator method — the idiomatic way.
const range = {
  from: 1, to: 5,
  *[Symbol.iterator]() {                 // generator = free iterator protocol
    for (let n = this.from; n <= this.to; n++) yield n;
  },
};
[...range];                 // [1,2,3,4,5]
for (const n of range) {}   // works
Math.max(...range);         // 5 — spread speaks the protocol too

// Hand-rolled iterator (no generator) — note the optional return() for cleanup.
function makeIterator(arr) {
  let i = 0;
  return {
    next: () => i < arr.length ? { value: arr[i++], done: false } : { value: undefined, done: true },
    return() { i = arr.length; return { done: true }; }, // called on break/throw
    [Symbol.iterator]() { return this; },                // make the iterator iterable
  };
}

// ❌ Iterables are NOT array-likes and vice versa.
const nl = document.querySelectorAll('div'); // iterable AND array-like
nl.map(...)                 // ❌ NodeList has no .map
[...nl].map(...)            // ✅ spread to a real array first
Array.from({ length: 3 }, (_, i) => i); // [0,1,2] — array-like → array, no iterator needed
```

## ⚖️ Trade-offs

- **Lazy by design.** The consumer *pulls* one value at a time, so iterables model infinite and expensive sequences without materialising them. That's their whole advantage over an array.
- **When NOT to build one:** if you already have an array and need random access, `length`, or multiple passes, an array is simpler and faster. Iterators are single-cursor and forward-only.
- **One-shot vs. reusable is a design decision.** Return a *fresh* iterator from `[Symbol.iterator]()` for reusable iteration; return `this` for a one-shot stream. Choose deliberately — accidental one-shots that break on a second loop are a common bug.
- **Overhead:** each `next()` is a call returning an object. For millions of tight iterations a plain indexed `for` wins measurably.

## 💣 Gotchas interviewers probe

- **Iterable vs. iterator.** The definitional question. Iterable *has* `[Symbol.iterator]`; iterator *has* `next`. Generators are both.
- **Plain objects aren't iterable.** `for...of` on `{}` throws; use `Object.entries()`/`keys`/`values`, which *return* iterables. `for...in` is a different thing entirely (enumerates keys, includes inherited, order-quirky).
- **Array-like ≠ iterable.** `arguments` and old `NodeList` are array-like (indexed + `length`). `Array.from` handles *both*; spread handles *only iterables*.
- **Generators are one-shot.** Loop one twice and the second loop is empty — because it returns `this` from `[Symbol.iterator]`. `Map`/`Set` return fresh iterators, so they're re-loopable.
- **`return()` on early exit.** `break`/`throw` triggers cleanup via `return()`. Skipping it leaks resources. This is the detail that signals depth.
- **Spread and `Promise.all` require iterables**, not just arrays — a subtlety when you pass a `Set` or a custom object.

## 🎯 Say this in the interview

> "An iterable has a `[Symbol.iterator]` method; the iterator it returns has `next()` giving `{ value, done }`. Everything that loops — `for...of`, spread, destructuring, `Array.from`, `Promise.all`, `new Map()` — is just sugar over that protocol, so if I implement it my object works with all of them. The cleanest way to make something iterable is a generator method for `[Symbol.iterator]`, because I get `next`, lazy evaluation, and the optional `return()` cleanup hook for free — and `return()` matters, it's what runs on an early `break` so resources get released. Two distinctions I'd flag: plain objects aren't iterable, only array-like or via `Object.entries`; and a generator is a one-shot iterator that returns itself, so looping it twice gives nothing, whereas `Map` and `Set` hand back a fresh iterator each time."

## 🔗 Go deeper

- [javascript.info — Iterables](https://javascript.info/iterable) — building custom iterables and the array-like distinction.
- [MDN — Iteration protocols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Iteration_protocols) — the exact iterable/iterator/`return()` contracts.
- [MDN — Symbol.iterator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator) — the well-known symbol every consumer looks up.
