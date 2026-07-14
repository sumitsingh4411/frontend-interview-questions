<div align="center">

# Memoization

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#functional` `#performance`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Memoization caches a pure function's result keyed by its arguments, so the second call with the same input is a map lookup instead of a recomputation. It trades memory for time, and it's only correct when the function is pure and the key uniquely identifies the inputs.

---

## 🧠 Mental model

Memoization is a **bet**: "I'll spend memory to avoid repeating work I've already done." It only pays off when the same inputs recur *and* the computation is expensive enough to beat the cost of hashing the key and holding the cache.

The two preconditions people skip:

1. **The function must be pure.** If output depends on anything but its arguments — the clock, global state, `this` — the cache serves stale answers. Memoizing an impure function is a correctness bug, not a slow function.
2. **The key must capture *all* inputs.** Miss one argument and you get cache collisions returning the wrong value.

Think of it as a lookup table you build lazily. Everything hard about memoization is really about **the key function and the eviction policy**, not the caching itself.

## ⚙️ How it actually works

The naive version uses a `Map` keyed by a serialised argument list:

```js
function memoize(fn, keyFn = (...a) => JSON.stringify(a)) {
  const cache = new Map();
  return function (...args) {
    const key = keyFn(...args);
    if (cache.has(key)) return cache.get(key);   // has(), not get()!
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```

Two staff-level details are hiding here:

- **`cache.has(key)` not `if (cache.get(key))`** — a legitimately cached `0`, `false`, `null`, or `undefined` would fail a truthiness check and recompute forever.
- **`fn.apply(this, args)`** preserves `this` so you can memoize methods.

`JSON.stringify` as a key is a **footgun**: it's order-sensitive (`{a,b}` ≠ `{b,a}`), drops `undefined` and functions, and can't distinguish `1` from `"1"`. For single-object-argument functions, a `WeakMap` keyed by the object *reference* is far better — it's O(1), needs no serialisation, and **lets entries be garbage-collected when the argument dies** (React's cache and reselect lean on exactly this).

**Unbounded caches are memory leaks.** A production `memoize` needs an eviction policy — LRU with a max size — or it grows forever. That's the difference between a whiteboard answer and a shippable one.

## 💻 Code

```js
// LRU-bounded memoize: Map preserves insertion order, so the oldest key is first.
function memoize(fn, { max = 100 } = {}) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      const v = cache.get(key);
      cache.delete(key); cache.set(key, v);   // move to "most recent"
      return v;
    }
    const v = fn(...args);
    cache.set(key, v);
    if (cache.size > max) cache.delete(cache.keys().next().value); // evict oldest
    return v;
  };
}

// WeakMap variant for a single object arg — auto-evicting, no serialisation.
function memoizeByRef(fn) {
  const cache = new WeakMap();
  return (obj) => cache.has(obj) ? cache.get(obj) : (cache.set(obj, fn(obj)), cache.get(obj));
}
```

## ⚖️ Trade-offs

- **Memory for time.** Obvious, but the memory is *unbounded by default*. Always bound it or key it by reference so the GC can help.
- **When NOT to use it:** cheap functions, functions with huge input spaces (near-zero hit rate), and anything impure. Memoizing `x => x + 1` is pure overhead — the hash costs more than the add.
- **Key computation can dominate.** `JSON.stringify` on a large object every call may cost more than the memoized work. Measure before assuming it's a win.
- **Concurrency:** memoizing an *async* function should cache the **promise**, not the resolved value, so concurrent callers dedupe the in-flight request instead of all firing it.

## 💣 Gotchas interviewers probe

- **`get` vs `has`.** Checking `if (cache.get(key))` breaks for falsy cached results. Use `has`. This is the single most common bug in a live implementation.
- **Unbounded growth = leak.** "How does your cache free memory?" If you have no answer, you've written a memory leak. LRU or `WeakMap`.
- **`JSON.stringify` key pitfalls.** Property order, `undefined`/functions dropped, `NaN`→`null`, no distinction between types that stringify the same. Name at least two.
- **Purity requirement.** Memoizing a function that reads external state returns stale data. The classic wrong answer is memoizing something time- or locale-dependent.
- **React `useMemo` is not general memoization** — it caches only the *last* render's value and can be dropped by React at any time. It's a render optimisation, not a guaranteed cache.
- **Async dedupe:** cache the promise so a burst of identical calls shares one request; delete on rejection so failures can retry.

## 🎯 Say this in the interview

> "Memoization caches results keyed by arguments so a repeat call is a lookup. It's a memory-for-time trade that's only correct when the function is pure and the key captures every input. Implementing it, the two things I'm careful about: I check `cache.has(key)` not the truthiness of `get`, because a cached `0` or `false` would otherwise recompute forever; and I use `fn.apply(this, args)` so methods keep their receiver. The naive `JSON.stringify` key is order-sensitive and drops `undefined`, so when the argument is an object I prefer a `WeakMap` keyed by reference — it's O(1) and lets entries get garbage-collected when the argument dies. And a real cache needs eviction — an unbounded `Map` is a memory leak — so I bound it with LRU. For async I cache the promise, not the value, so concurrent identical calls dedupe."

## 🔗 Go deeper

- [MDN — Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — insertion-order iteration, the basis of the LRU trick.
- [MDN — WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — reference-keyed, auto-evicting caches.
- [BigFrontend.dev](https://bigfrontend.dev/) — "implement `memo`" with a custom resolver; a staple live-coding task.
