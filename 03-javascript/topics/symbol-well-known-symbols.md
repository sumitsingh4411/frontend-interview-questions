<div align="center">

# `Symbol` & well-known symbols

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#advanced`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A `Symbol` is a guaranteed-unique, immutable primitive used as a non-colliding property key. **Well-known symbols** (`Symbol.iterator`, `Symbol.asyncIterator`, `Symbol.toPrimitive`, `Symbol.hasInstance`, `Symbol.toStringTag`) are the hooks the language itself calls, letting your objects plug into built-in syntax and operators.

---

## 🧠 Mental model

Symbols solve two unrelated problems. **First, collision-free keys:** every `Symbol()` is unique even with an identical description, so a library can stash metadata on an object without ever clobbering a user's key. **Second, protocol hooks:** the spec reserves a set of *well-known* symbols as the official extension points where you customise how the language treats your object — iteration (`for…of`), coercion, `instanceof`, the string tag. Miss the second use and you've only understood half of why Symbols exist.

## ⚙️ How it actually works

`Symbol('desc')` is unique every call — the description is just a debug label, not identity. For a *shared* symbol across modules or realms, `Symbol.for('key')` uses a global registry and returns the same symbol every time. Symbol-keyed properties are skipped by `for…in`, `Object.keys`, and `JSON.stringify`, but they're reachable via `Object.getOwnPropertySymbols` / `Reflect.ownKeys` — so they're *hard to hit accidentally*, not private.

The well-known symbols are where it gets powerful: implement `[Symbol.iterator]` and your object works with `for…of`, spread, and array destructuring; implement `[Symbol.toPrimitive]` and you control coercion; `[Symbol.toStringTag]` sets the `Object.prototype.toString` label; `[Symbol.hasInstance]` customises `instanceof`.

## 💻 Code

```js
// 1) Unique keys — invisible metadata that never collides with user data
const CACHE = Symbol('cache');
obj[CACHE] = expensive();     // skipped by JSON.stringify and Object.keys

// 2) The iteration protocol
const range = {
  from: 1, to: 3,
  [Symbol.iterator]() {
    let n = this.from;
    const last = this.to;
    return { next: () => n <= last ? { value: n++, done: false } : { value: undefined, done: true } };
  },
};
[...range];                   // [1, 2, 3]

// 3) Control coercion
const money = {
  amount: 5,
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? `$${this.amount}` : this.amount;
  },
};
`${money}`;                   // '$5'
money * 2;                    // 10
```

## ⚖️ Trade-offs

- **Symbol keys are great for hidden metadata**, but they're *not* an access-control boundary — `getOwnPropertySymbols` exposes them. For true privacy use `#private` fields.
- **`Symbol.for` shares across the whole realm** — powerful for cross-module singletons, but it's a global namespace you can collide in; namespace your key (`Symbol.for('myLib.state')`).
- **Well-known symbols are the idiomatic way to make objects behave like built-ins** and are underused — implementing `Symbol.iterator` on a custom collection reads far better than exposing a `.toArray()`.

## 💣 Gotchas interviewers probe

- **`Symbol('x') !== Symbol('x')`** — description is not identity. Only registry symbols compare equal: `Symbol.for('x') === Symbol.for('x')`.
- **Symbols are skipped by `JSON.stringify`, `Object.keys`, and `for…in`** — surprising when you expected serialization; reach them via `Object.getOwnPropertySymbols`.
- **You can't `new Symbol()`** — it's a primitive, not a constructor; it throws.
- **Implicit string coercion of a symbol throws** — `'' + sym` is a TypeError. Use `String(sym)` or `sym.description`.
- **Symbol keys require computed syntax** — `{ [sym]: value }`, and `typeof sym === 'symbol'`.
- **Registry symbols persist process-wide** — never use `Symbol.for` where you actually wanted per-instance uniqueness.

## 🎯 Say this in the interview

> "Symbols do two things. They're unique primitive keys — every `Symbol()` is distinct even with the same description — so libraries can attach metadata to objects without colliding with user keys, and those keys are skipped by `JSON.stringify` and `Object.keys`, though they're still reachable via `getOwnPropertySymbols`, so it's obscurity, not privacy. The more interesting use is the well-known symbols: they're the language's official hooks. If I implement `Symbol.iterator`, my object works with `for…of`, spread, and destructuring; `Symbol.toPrimitive` lets me control coercion; `Symbol.toStringTag` sets the `toString` label. For shared symbols across modules I use `Symbol.for`, which dedupes through a global registry — but I namespace the key because that registry is global."

## 🔗 Go deeper

- [javascript.info — Symbol type](https://javascript.info/symbol) — unique keys, the registry, and hidden properties.
- [MDN — `Symbol`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol) — the primitive, the registry, and coercion rules.
- [MDN — Well-known symbols](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol#well-known_symbols) — the full list of language hooks.
- [MDN — `Symbol.iterator`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Symbol/iterator) — the iteration protocol in detail.
