<div align="center">

# `this` binding (4 rules)

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#this`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `this` is neither lexical nor "the function" — it's decided **at call time by how the function is called**. Four rules, in priority order: `new` > explicit (`call`/`apply`/`bind`) > implicit (method call) > default. Arrow functions opt out of all four and inherit `this` lexically.

---

## 🧠 Mental model

Stop asking "where is this function defined?" Ask "**how was it called?**" `this` is effectively an implicit parameter passed at the *call site*. The thing to the left of the dot, or the `new`, or the `.call(...)`, is what sets it. Move the same function to a different call site and `this` changes — that's the whole idea, and the source of every surprise.

## ⚙️ How it actually works

The engine resolves `this` by checking, in this priority:

1. **`new Foo()`** → `this` is a brand-new object linked to `Foo.prototype`.
2. **Explicit:** `fn.call(o)`, `fn.apply(o)`, or a `fn.bind(o)` result → `this` is `o`.
3. **Implicit:** `obj.fn()` → `this` is `obj` (the receiver, left of the dot).
4. **Default:** a bare `fn()` → `undefined` in strict mode, `globalThis` in sloppy mode.

The failure mode is losing the dot: `const f = obj.method; f()` drops the receiver, so rule 4 applies and `this` is `undefined`. That's why passing a method as a callback "loses `this`". Arrow functions sidestep the entire table — they have no `this` binding and resolve `this` from the enclosing lexical scope, which cannot be overridden by `call`, `bind`, or even `new`.

## 💻 Code

```js
const user = {
  name: 'Ada',
  greet() { return `Hi ${this.name}`; },
};

user.greet();               // 'Hi Ada'   — implicit: receiver is `user`
const g = user.greet;
g();                        // 💥 undefined.name — dot gone → default binding
g.call(user);               // 'Hi Ada'   — explicit binding
setTimeout(user.greet, 0);  // 💥 detached — passed without the receiver

// Arrow inherits `this` lexically → survives detachment
const timer = {
  label: 'tick',
  start() {
    setTimeout(() => console.log(this.label), 0); // 'tick' — `this` is `timer`
  },
};
```

```js
// `new` wins over implicit; even wins over bind (keeps bound args, not `this`)
function Point(x) { this.x = x; }           // `this` = fresh instance
const p = new Point(5);                      // p.x === 5
```

## ⚖️ Trade-offs

- **Arrows for callbacks and class fields; regular functions for methods.** Arrows give you stable lexical `this` (perfect inside `map`, `setTimeout`, event handlers you close over). Regular functions give you dynamic `this` — exactly what prototype methods and DOM handlers want.
- **Never use an arrow as an object method** if you need `this` to be that object — it'll capture module/global scope instead.
- **Never use an arrow as a constructor** — no `this`, no `prototype`; `new` throws.

## 💣 Gotchas interviewers probe

- **`this` is call-time, not definition-time.** The most repeated mistake. Same function, different call site, different `this`.
- **Detached methods lose `this`.** `arr.forEach(obj.method)` breaks; use `arr.forEach(obj.method.bind(obj))` or an arrow wrapper.
- **Arrow functions can't be rebound.** `arrow.call(x)` / `arrow.bind(x)` are no-ops for `this`; as a DOM handler, `this` is *not* the element.
- **Sloppy vs strict default.** Bare-call `this` is `globalThis` in sloppy mode, `undefined` in strict. Modules and class bodies are always strict — a big source of "it worked in the console but not in my module".
- **Nested plain function inside a method** gets the *default* binding, not the outer object. Pre-arrow, people wrote `const self = this`.
- **Top-level `this`** is `undefined` in ES modules, `globalThis`/`module.exports` elsewhere.

## 🎯 Say this in the interview

> "`this` isn't lexical and it isn't the function — it's set at the call site by how you call the function. I resolve it with four rules in priority order: `new` creates and binds a fresh object; `call`/`apply`/`bind` set it explicitly; a method call binds it to the receiver left of the dot; and a bare call falls back to `undefined` in strict mode or the global object in sloppy mode. The classic bug is losing the dot — assigning `obj.method` to a variable or passing it as a callback drops the receiver, so `this` becomes `undefined`. Arrow functions are the exception: they have no `this` of their own and inherit it lexically, which is exactly why they're the right tool inside callbacks and the wrong tool as object methods or constructors."

## 🔗 Go deeper

- [javascript.info — Object methods, "this"](https://javascript.info/object-methods) — the four call patterns with clear examples.
- [MDN — `this`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/this) — the exhaustive spec-accurate reference, including strict-mode and arrow behaviour.
- [javascript.info — Arrow functions revisited](https://javascript.info/arrow-functions) — why arrows have no `this` and when that matters.
