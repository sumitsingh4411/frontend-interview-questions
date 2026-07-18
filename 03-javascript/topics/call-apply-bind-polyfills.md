<div align="center">

# `call` / `apply` / `bind` (+ polyfills)

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#this` `#polyfill`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — All three set `this` explicitly. `call` and `apply` invoke **immediately** (differ only in how args are packaged — `apply` takes an array); `bind` is **lazy**, returning a new function permanently pinned to that `this`. Writing their polyfills is a classic interview because it forces you to prove you actually understand `this`.

---

## 🧠 Mental model

These are the "explicit" rule of `this`-binding turned into methods. `call` and `apply` are the same operation with different argument packaging — mnemonic: **A**pply takes an **A**rray. `bind` is the odd one out: it doesn't call anything, it manufactures a *new* function whose `this` (and optionally leading arguments) are frozen. Think of `bind` as partial application for `this`.

## ⚙️ How it actually works

`call`/`apply` install the function as a temporary property of the context object and invoke it, so the ordinary *implicit* binding rule does the work — that's the trick behind the polyfill. `bind` returns an exotic bound function; invoking it runs the target with the pinned `this` and prepends any pre-supplied args. One spec subtlety worth knowing: calling a bound function with **`new` overrides the bound `this`** (the fresh instance wins) while still keeping the bound leading arguments. And binding twice does nothing — once `this` is fixed it can't be re-fixed.

## 💻 Code

```js
// call — args listed individually
Function.prototype.myCall = function (ctx, ...args) {
  ctx = ctx ?? globalThis;
  const key = Symbol('fn');          // Symbol → never clobbers a real property
  ctx[key] = this;                   // `this` here IS the function being called
  const out = ctx[key](...args);     // implicit binding sets `this` = ctx
  delete ctx[key];
  return out;
};

// apply — args as an array
Function.prototype.myApply = function (ctx, args = []) {
  ctx = ctx ?? globalThis;
  const key = Symbol('fn');
  ctx[key] = this;
  const out = ctx[key](...args);
  delete ctx[key];
  return out;
};

// bind — returns a new function, and must still work with `new`
Function.prototype.myBind = function (ctx, ...bound) {
  const fn = this;
  function boundFn(...args) {
    const calledWithNew = this instanceof boundFn; // `new` → ignore ctx
    return fn.apply(calledWithNew ? this : ctx, [...bound, ...args]);
  }
  boundFn.prototype = Object.create(fn.prototype ?? null); // preserve inheritance
  return boundFn;
};
```

Why the `Symbol` key: the naive version `ctx.fn = this` can overwrite an existing `fn` property and breaks under re-entrancy. A unique Symbol sidesteps both.

## ⚖️ Trade-offs

- **`bind` allocates a new function every call.** Binding inside a React render creates a fresh reference each render, defeating `React.memo`/`useCallback` and causing needless re-renders. Bind once (constructor) or use a class field / arrow.
- **`apply` was the pre-spread way to pass an array** (`Math.max.apply(null, arr)`). Today `Math.max(...arr)` reads better; `apply` mostly survives in polyfills and variadic forwarding.
- **Don't over-bind.** For most callback `this` problems, an arrow function or class field is clearer than a `.bind()` chain.

## 💣 Gotchas interviewers probe

- **`call` vs `apply` is *only* args-vs-array.** Nothing else differs. Know the mnemonic cold.
- **`bind` is not immediate.** `el.onclick = fn.bind(obj)` is correct; `fn.bind(obj)()` calls it now and assigns its return value — a common typo.
- **Double-binding is a no-op.** `fn.bind(a).bind(b)` stays bound to `a`. Interviewers love this one.
- **`new` beats a bound `this`** but keeps the bound leading args — the reason a correct polyfill needs the `this instanceof boundFn` check.
- **`null`/`undefined` context.** In sloppy mode it's substituted with `globalThis`; in strict mode it stays `null`/`undefined`.
- **Losing the method's `prototype`.** A naive `bind` polyfill that skips `boundFn.prototype = Object.create(...)` breaks `instanceof` on instances built from the bound constructor.

## 🎯 Say this in the interview

> "`call`, `apply`, and `bind` all set `this` explicitly. `call` and `apply` invoke immediately and differ only in argument packaging — `apply` takes an array. `bind` is lazy: it returns a new function with `this` permanently pinned, plus optional leading arguments, so it's partial application for `this`. To polyfill `call` I stash the function as a temporary Symbol-keyed property on the context and invoke it, letting the normal method-call rule bind `this`; the Symbol avoids clobbering real properties. The subtle parts are all in `bind`: it must return a function that still works with `new` — where the fresh instance overrides the bound `this` but keeps the bound args — and binding twice is a no-op because `this` can only be fixed once. Practically, I avoid binding in render because it allocates a new reference every time and breaks memoisation."

## 🔗 Go deeper

- [MDN — `Function.prototype.bind`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) — semantics including the `new`-override behaviour.
- [MDN — `Function.prototype.call`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/call) — and the sibling `apply` page for the array form.
- [javascript.info — Function binding](https://javascript.info/bind) — losing `this`, partial application, and the classic pitfalls.
