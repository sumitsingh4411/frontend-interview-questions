<div align="center">

# Higher-order functions

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 30m · `#functional`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A higher-order function takes a function as an argument, returns a function, or both. That's it — but it's the mechanism behind every callback, every decorator, every hook, and every middleware you've ever written.

---

## 🧠 Mental model

JavaScript has **first-class functions**: a function is just a value, like `42` or `"hi"`. You can store it, pass it, return it, put it in an array. A "higher-order function" (HOF) is simply a function that *takes advantage of that fact*.

The reason it matters isn't elegance — it's **inversion of control**. `array.map(fn)` owns the loop; you own the transformation. `withRetry(fn)` owns the retry policy; you own the work. You hand over the *what*, the HOF supplies the *how*.

| Shape | Example | What it buys you |
|---|---|---|
| Takes a fn | `arr.filter(pred)`, `addEventListener` | The caller injects behaviour |
| Returns a fn | `debounce(fn)`, `bind()` | Behaviour is configured, then reused |
| Both | `withLogging(fn)`, middleware | A **decorator** — wrap, don't modify |

That last row is the interview money. A HOF that takes a function and returns an enhanced one is how you add caching, retries, logging, throttling, or auth to code you don't want to touch.

## ⚙️ How it actually works

Two mechanisms do all the work.

**1. Closures.** A returned function captures the variables of the scope it was created in. That captured scope is what turns a HOF into a *factory* — each call to `once(fn)` gets its own private `called` flag, living on the heap for exactly as long as the returned function is reachable.

**2. `this` and argument forwarding.** This is where most candidates' decorators quietly break. If you wrap a method, your wrapper must forward `this` and *all* arguments faithfully:

```js
function withLogging(fn) {
  return function (...args) {          // ✅ rest args, not arguments
    console.log(fn.name, args);
    return fn.apply(this, args);       // ✅ forward `this` AND the return value
  };
}
```

Use a **regular function**, not an arrow, for the wrapper — an arrow has no own `this`, so `this` would leak from the enclosing lexical scope instead of being the object the method was called on. And `return` the result, or you've silently turned every wrapped function into `undefined`.

## 💻 Code

The decorator pattern, done properly:

```js
// ❌ Breaks on methods: `this` is lost, args are dropped, return value swallowed.
const badOnce = (fn) => {
  let done = false;
  return () => { if (!done) { done = true; fn(); } };
};

// ✅ Preserves `this`, forwards args, caches and returns the result.
function once(fn) {
  let called = false;
  let result;
  return function (...args) {
    if (called) return result;
    called = true;
    result = fn.apply(this, args);
    fn = null;              // let the original fn be GC'd — it can never run again
    return result;
  };
}

const init = once(function () { console.log('boot'); return Date.now(); });
init(); init();             // logs once, both calls return the same timestamp
```

A retry decorator — same skeleton, different policy:

```js
const withRetry = (fn, times = 3) =>
  async function (...args) {
    let lastErr;
    for (let i = 0; i < times; i++) {
      try { return await fn.apply(this, args); }
      catch (err) {
        lastErr = err;
        await new Promise((r) => setTimeout(r, 2 ** i * 100)); // backoff
      }
    }
    throw lastErr;          // ✅ preserve the real error, don't invent one
  };
```

## ⚖️ Trade-offs

- **Composability vs. stack traces.** Three layers of decorators means three extra frames in every stack trace, and `fn.name` becomes `""` unless you set it. Debuggability is the real cost of HOF-heavy code.
- **Don't reach for a HOF when a loop is clearer.** `for...of` with an early `break` beats a `.find()` chain that allocates two intermediate arrays. Chained `map().filter().reduce()` over a 100k-element array does N passes and N allocations; one loop does one.
- **Returned functions are new identities.** `useCallback`, `React.memo`, and `removeEventListener` all compare by reference. A HOF called inside a render creates a *new* function every time — that's how you accidentally re-subscribe on every render.
- **When NOT to use it:** as indirection for its own sake. A `pipe(a, b, c)` that runs once, in one place, is harder to read than `c(b(a(x)))`.

## 💣 Gotchas interviewers probe

- **Arrow functions in decorators lose `this`.** The wrapper must be a `function`, and must call `fn.apply(this, args)`. Nearly everyone writes the arrow version and never tests it on a method.
- **`arguments` vs. rest.** `arguments` isn't a real array and doesn't exist in arrows. Use `...args`.
- **Forgetting to return.** `wrapper` that calls `fn(...args)` without `return` breaks every non-void function it wraps.
- **`map(parseInt)` — the classic.** `['1','2','3'].map(parseInt)` is `[1, NaN, NaN]`, because `map` passes `(value, index, array)` and `parseInt` reads the second arg as a *radix*. Pass only what you mean: `.map(Number)` or `.map((s) => parseInt(s, 10))`.
- **HOFs that capture large objects leak.** A closure keeps its entire captured scope alive. A memoized function holding DOM nodes will pin them in memory forever — one reason `WeakMap` exists.
- **`fn.length` and `fn.name` are lost through a wrapper.** Anything that introspects arity (currying helpers, DI containers) will break on your decorated version.

## 🎯 Say this in the interview

> "A higher-order function either takes a function, returns one, or both — and the reason that matters is inversion of control: `map` owns the loop, I own the transform. The pattern I actually use day to day is the decorator: a function that takes a function and returns an enhanced one, so I can add retries or memoization or logging without touching the original. The two things I'm careful about there are that the wrapper must be a regular function, not an arrow, so `fn.apply(this, args)` correctly forwards `this` when I wrap a method — and that I forward the rest args and return the result, because dropping the return value is the classic silent bug. The trade-off is debuggability: every layer adds a stack frame and hides the original function's name."

## 🔗 Go deeper

- [javascript.info — Function expressions & callbacks](https://javascript.info/function-expressions) — first-class functions from the ground up.
- [javascript.info — Decorators and forwarding, call/apply](https://javascript.info/call-apply-decorators) — exactly the `this`-forwarding trap above.
- [MDN — Function.prototype.apply](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/apply) — the primitive every decorator is built on.
- [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures) — why a returned function keeps its scope alive.
