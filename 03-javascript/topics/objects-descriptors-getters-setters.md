<div align="center">

# Objects, descriptors, getters/setters

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#objects`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every property is really a **descriptor**: either a *data* descriptor (`value`, `writable`) or an *accessor* descriptor (`get`/`set`), each carrying `enumerable` and `configurable` flags. `obj.x = 1` just hides all of this by defaulting every flag to `true`; `Object.defineProperty` gives you the control the literal syntax conceals.

---

## 🧠 Mental model

A property is not a value — it's a small record of *attributes*. Assigning `obj.x = 1` creates a data property with `writable/enumerable/configurable` all `true`. Getters and setters are simply *accessor* descriptors: a property backed by functions that run on read/write, yet indistinguishable from a plain field at the call site — you write `obj.x`, never `obj.x()`. That transparency is the point, and also the trap.

| Data descriptor | Accessor descriptor |
|---|---|
| `value`, `writable` | `get`, `set` |
| `enumerable`, `configurable` | `enumerable`, `configurable` |

You cannot mix `value` with `get`/`set` on one property.

## ⚙️ How it actually works

- **`enumerable`** controls visibility in `for…in`, `Object.keys`, spread, and `JSON.stringify`.
- **`writable: false`** makes assignment silently fail in sloppy mode and throw in strict mode.
- **`configurable: false`** is a one-way door — you can no longer delete the property or change its flags (the sole exception: flipping `writable` from `true` to `false`).
- **`Object.defineProperty` defaults every unspecified flag to `false`** — the exact opposite of literal syntax. This is the number-one "why doesn't my property show up in `Object.keys`?" bug.

`Object.freeze`, `seal`, and `preventExtensions` are all built on these flags.

## 💻 Code

```js
const user = {};
Object.defineProperty(user, 'id', {
  value: 42,
  writable: false,      // read-only
  enumerable: false,    // hidden from Object.keys / JSON / spread
  configurable: false,  // can't be deleted or reconfigured
});
user.id = 99;           // sloppy: silently ignored; strict: TypeError
Object.keys(user);      // []  — id is non-enumerable
```

```js
// Accessor: validation + a derived, virtual property
const temp = {
  _c: 0,
  get fahrenheit() { return this._c * 9 / 5 + 32; },
  set celsius(v) {
    if (v < -273.15) throw new RangeError('below absolute zero');
    this._c = v;
  },
};
temp.celsius = 100;
temp.fahrenheit; // 212 — computed on read, looks like a plain field
```

## ⚖️ Trade-offs

- **Getters/setters buy clean APIs** — validation on write, computed props on read — but they *hide cost*: a getter can look like a field yet run expensive work on every access, and every `{...obj}` or `JSON.stringify` invokes them.
- **Non-enumerable / non-configurable props** are excellent for library internals and constants, but overusing them makes objects opaque and hard to debug.
- **`Object.freeze` is a correctness guard, not a deep one** — it's shallow, so nested objects stay mutable; deep immutability needs recursion or a library.
- **When NOT to reach for descriptors:** for app-level encapsulation, a class with `#private` fields reads far clearer than `defineProperty` gymnastics.

## 💣 Gotchas interviewers probe

- **`defineProperty` defaults flags to `false`.** Define a property the "manual" way and it's silently non-enumerable/non-writable/non-configurable. Literal syntax defaults them all to `true`.
- **Getters run on every access** — logging, spread, and `JSON.stringify` all trigger them, so a side-effecting or throwing getter surfaces in surprising places.
- **`Object.freeze` is shallow.** `freeze({a:{b:1}})` still lets you set `.a.b`.
- **Spread / `Object.assign` copy only enumerable own properties** and *evaluate* getters — they copy the returned value, not the accessor itself.
- **`configurable: false` can't be undone** — you can't delete, redefine, or re-enable it.
- **Setter without getter** makes reads return `undefined`; **getter without setter** makes writes silently no-op (sloppy) or throw (strict).
- **`__proto__` is itself an accessor** defined on `Object.prototype` — which is why `Object.create(null)` is safer for dictionaries.

## 🎯 Say this in the interview

> "Under the hood every property is a descriptor — either a data descriptor with `value` and `writable`, or an accessor descriptor with `get`/`set` — plus `enumerable` and `configurable` flags. Literal assignment just creates a data property with all flags true, which is why people forget the flags exist. The gotcha I always flag is that `Object.defineProperty` defaults every unspecified flag to *false*, so a manually defined property is non-enumerable and won't show up in `Object.keys` or `JSON.stringify` unless you opt in. Getters and setters are accessor descriptors: they look like plain fields at the call site, which is great for validation and computed values but dangerous because they run on every access — including spread and serialization. And I remember `Object.freeze` is shallow, so nested objects still mutate."

## 🔗 Go deeper

- [javascript.info — Property flags and descriptors](https://javascript.info/property-descriptors) — every flag and the `defineProperty` defaults.
- [javascript.info — Property getters and setters](https://javascript.info/property-accessors) — accessor descriptors in depth.
- [MDN — `Object.defineProperty`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) — exact attribute semantics.
- [MDN — `Object.freeze`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — including its shallow behaviour.
