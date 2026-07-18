<div align="center">

# Closures

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#closures`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A closure is a function plus a **live reference** to the variables of the scope it was born in — not a snapshot. It's the mechanism behind private state, memoisation, `useState`, and the single most-repeated loop bug in the language.

---

## 🧠 Mental model

Every function is created carrying a hidden link to the **lexical environment** where it was defined. That link doesn't vanish when the outer function returns — as long as the inner function is reachable, the variables it references stay alive. So a closure isn't an exotic feature; it's the ordinary consequence of functions being first-class values plus *lexical* scope (scope decided by where code is written, not where it runs).

The one sentence to burn in: **a closure closes over variables, not values.** It captures the *binding*, so if the variable changes later, the closure sees the new value. Almost every closure "gotcha" is that sentence in disguise.

## ⚙️ How it actually works

When the engine creates a function it stores an internal `[[Environment]]` pointing at the current scope chain. On each call it builds a new execution context whose *outer* reference is that stored environment — which is precisely why lookup is lexical, not dynamic. Reading a variable walks the chain outward until it's found or you hit a `ReferenceError`.

Crucially, the engine keeps the *binding* alive, shared by everything that references it. Two closures made in the same scope see the same variable. A closure made per loop iteration with `let` sees its own fresh binding, because `let` creates a new binding each iteration. That single fact resolves the classic bug below.

Modern engines (V8) don't retain the entire parent scope — only the variables actually captured — but a long-lived closure still pins whatever it *does* capture, which is a genuine memory-leak vector.

## 💻 Code

```js
// Private, persistent state — no outside handle to `count`
function makeCounter() {
  let count = 0;
  return { inc: () => ++count, get: () => count };
}
const c = makeCounter();
c.inc(); c.inc();
c.get(); // 2 — the binding survived makeCounter returning
```

The loop bug — and why it happens:

```js
// ❌ `var` has ONE binding shared by all iterations. By the time any
//    callback runs the loop is done, so i === 3 everywhere.
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3

// ✅ `let` creates a FRESH binding per iteration.
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2

// ✅ pre-ES6 fix: an IIFE snapshots the value into a new scope.
for (var j = 0; j < 3; j++) ((k) => setTimeout(() => console.log(k)))(j);
```

## ⚖️ Trade-offs

- **Closures trade memory for encapsulation.** Captured variables live as long as the closure does. One long-lived listener or cache can keep a large object alive indefinitely — deliberate closures are fine, accidental ones are leaks.
- **Shared scope cuts both ways.** Multiple closures over one scope share state (great for a counter, a bug in the `var` loop).
- **When NOT to reach for it:** don't build closure-based "privacy" when a `#private` class field or a module boundary reads clearer, and don't allocate fresh closures in a hot render path when a stable reference would do.

## 💣 Gotchas interviewers probe

- **"Closures copy the variable."** No — they reference the *binding*. Mutate it after creation and the closure sees the new value.
- **The `var` loop** is about *one shared binding*, not timing. Candidates who say "the timeout is too slow" have the wrong model.
- **Closures don't capture `this`.** `this` is set per call; only lexical variables are closed over. Arrow functions *appear* to close over `this` because they have no `this` of their own and resolve it lexically — that's the real reason arrows fix `this` in callbacks.
- **Accidental retention.** A closure referencing one field of a huge object can keep the whole object reachable. Be intentional about what you capture.
- **Everything is already a closure** — every event handler, every module, every hook. It's not a special case you opt into.

## 🎯 Say this in the interview

> "A closure is a function together with a live reference to the variables in the scope where it was defined — and the key word is *reference*, not copy. When a function is created it keeps a link to its lexical environment, and that environment stays alive as long as the function is reachable, even after the outer function returned. That's how you get private state: a factory returns functions that share a variable nobody else can touch. It also explains the classic loop bug — `var` gives every iteration the same binding so all the callbacks log the final value, whereas `let` creates a fresh binding per iteration. The trade-off I keep in mind is memory: a long-lived closure pins whatever it captures, so an accidental capture of a big object is a real leak."

## 🔗 Go deeper

- [javascript.info — Closure](https://javascript.info/closure) — the definitive walkthrough of lexical environments and the scope chain.
- [MDN — Closures](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Closures) — canonical reference, including the memory and loop notes.
- [javascript.info — Variable scope, closure](https://javascript.info/variable-scope) — how bindings and environments actually chain together.
