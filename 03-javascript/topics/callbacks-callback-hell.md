<div align="center">

# Callbacks & callback hell

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 30m · `#async`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A callback is a function you hand to someone else to call later. "Callback hell" is the pyramid you get when you sequence async steps by nesting — but the deep problem isn't indentation, it's **inverted control**: you've trusted a third party to call your function exactly once, with the right arguments, and to not swallow your errors.

---

## 🧠 Mental model

A normal function *returns* a value to you. An async operation can't — the value doesn't exist yet — so instead you pass in a **continuation**: "here's what to do when you're done." That's callback-passing style.

Two flavours get conflated:

- **Synchronous callbacks** run before the outer call returns — `[1,2,3].map(fn)`, `arr.sort(cmp)`. No async at all.
- **Asynchronous callbacks** run later, on a fresh call stack — `setTimeout(fn)`, `fs.readFile(path, cb)`, `el.addEventListener('click', fn)`.

The "hell" is what happens when each async step depends on the previous one: you nest, and nest, and the code marches diagonally off the screen. But rewriting the *shape* (named functions, flatter nesting) fixes the aesthetics, not the real issues.

## ⚙️ How it actually works

The real cost of callbacks is **inversion of control**. When you write `getUser(id, done)`, you hand your `done` function to `getUser` and *trust* it to:

1. call it **exactly once** (not zero times, not twice),
2. call it with the **right arguments**,
3. not **swallow** an error you needed to see,
4. call it **asynchronously and consistently** (never sometimes-sync, sometimes-async — that's "releasing Zalgo").

A library that violates any of these is very hard to debug, because you don't own the calling code. Promises exist largely to *take that control back*: a promise settles at most once, immutably, and always asynchronously — the guarantees a raw callback can't make.

The other trap is **error handling**. `try/catch` is synchronous — it only catches things thrown while the stack that entered the `try` is still on the stack. An async callback fires *later*, on an empty stack, so a surrounding `try/catch` cannot see its throw. Node's answer is the **error-first convention**: `(err, data) => …`, where you must check `err` on every level and forward it up manually.

## 💻 Code

```js
// ❌ The pyramid of doom — sequential async steps by nesting
getUser(id, (err, user) => {
  if (err) return handle(err);
  getOrders(user, (err, orders) => {       // error handling repeated at every level
    if (err) return handle(err);
    getShipping(orders[0], (err, ship) => {
      if (err) return handle(err);
      render(user, orders, ship);          // …and the logic lives 3 levels deep
    });
  });
});
```

```js
// ❌ try/catch is USELESS around an async callback
try {
  setTimeout(() => { throw new Error('boom'); }, 0);
} catch (e) {
  // never runs — the callback fires later, on an empty stack.
  // The error becomes an uncaught exception instead.
}
```

```js
// Error-first convention (Node): the leak is forgetting `return`
readConfig('app.json', (err, cfg) => {
  if (err) { handle(err); return; }   // WITHOUT return, code below still runs with cfg = undefined
  start(cfg);
});
```

## ⚖️ Trade-offs

- **Callbacks aren't obsolete.** They're the right tool for **multi-shot** events — `addEventListener`, streams, `IntersectionObserver` — where the thing fires many times. Promises are strictly **single-shot**; you can't "resolve" a click stream. Don't promisify an event emitter.
- **For a single async result, promises/`async-await` win** — they restore the once-only guarantee and let you use real `try/catch` and `return`.
- **When NOT to reach for callbacks:** anything you'd want to compose, retry, race, or run in parallel. Sequencing and error propagation are exactly what callbacks are worst at and promises are built for.

## 💣 Gotchas interviewers probe

- **`try/catch` can't catch an async callback's throw.** The stack has unwound by the time it runs. This is *the* async error-handling gotcha, and it's why promises route errors through `.catch` instead.
- **"Zalgo" — a callback that's sometimes sync, sometimes async.** If a function calls back synchronously on a cache hit but asynchronously on a miss, callers get non-deterministic ordering. Rule: an API is *always* async or *always* sync, never both.
- **The double-call / never-call bug.** A raw callback offers no guarantee it fires exactly once; a promise does. Naming this is a senior signal.
- **Forgetting `return` after `if (err)`.** Execution falls through and runs the success path with bad data. Extremely common in error-first code.
- **`this` inside a callback.** A plain-function callback loses the caller's `this`; arrow callbacks capture it lexically. Passing `this.method` without binding is a classic break.
- **Callback hell is about control flow, not indentation.** Flattening with named functions helps readability but doesn't fix inverted control or error propagation — promises do.

## 🎯 Say this in the interview

> "A callback is just a continuation — you pass a function to be invoked later because the value isn't ready yet. Callback hell is what you get sequencing dependent async steps by nesting, but I'd push back on the framing: the indentation is cosmetic. The real problems are inversion of control — you're trusting someone else's code to call your function exactly once, with the right args, and not eat your errors — and the fact that `try/catch` can't catch a throw from an async callback because the stack has already unwound, which is why Node uses error-first `(err, data)` and you must forward `err` at every level. Promises exist to fix exactly that: single settlement, immutable, always async, with errors flowing to `.catch`. I'd still keep callbacks for multi-shot things like event listeners, where a single-shot promise doesn't fit."

## 🔗 Go deeper

- [javascript.info — Introduction: callbacks](https://javascript.info/callbacks) — the pyramid, error-first style, and why it motivates promises.
- [MDN — Introducing asynchronous JavaScript](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Introducing) — callbacks vs promises, with the event-loop framing.
- [Isaac Schlueter — Designing APIs for Asynchrony ("don't release Zalgo")](https://blog.izs.me/2013/08/designing-apis-for-asynchrony/) — the canonical "always async or always sync" argument.
