<div align="center">

# Classes & inheritance

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#oop`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `class` is sugar over prototypes, but not *only* sugar — it adds semantics you can't cleanly hand-roll: `super`, non-enumerable methods, mandatory `new`, true `#private` fields, and a TDZ on the class binding. Inheritance wires up **two** chains at once — instances up the prototype chain, statics up the constructor chain.

---

## 🧠 Mental model

A class declaration builds exactly the constructor-function-plus-prototype you'd write by hand: instance methods live on `Class.prototype`, static members on the constructor itself, instance fields get set per object in the constructor. `extends` then links two chains simultaneously — `Child.prototype`'s prototype becomes `Parent.prototype` (so instances inherit methods) *and* `Child`'s prototype becomes `Parent` (so statics inherit too). Understanding that dual wiring is the senior signal.

## ⚙️ How it actually works

Class bodies always run in **strict mode**. Methods defined in the body are **non-enumerable** (unlike `Foo.prototype.m = …`, which is enumerable). Calling a class without `new` **throws** — a deliberate guardrail constructor functions lack.

The load-bearing rule is `super`. In a derived constructor, **the parent constructor is what actually creates `this`**, so you must call `super(...)` before touching `this` — before that, `this` sits in the temporal dead zone and any access throws. `super.method()` looks the method up on the parent prototype but calls it with the current `this`, so overrides can extend rather than replace behaviour.

## 💻 Code

```js
class Animal {
  #energy = 100;                       // truly private, per-instance
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a sound`; }
  static create(n) { return new this(n); } // `this` = the class it's called on
}

class Dog extends Animal {
  constructor(name) {
    super(name);                       // MUST run before using `this`
    this.legs = 4;
  }
  speak() { return `${super.speak()} — a bark`; } // super keeps `this` = the Dog
}
```

The TDZ trap:

```js
class Cat extends Animal {
  constructor(name) {
    this.name = name;  // 💥 ReferenceError — `this` used before super()
    super(name);
  }
}
```

## ⚖️ Trade-offs

- **Classes are the right call for stateful entities** — readable construction, real privacy via `#`, clear intent, non-enumerable methods that don't pollute iteration.
- **But inheritance is the weakest form of reuse.** Deep hierarchies are rigid and couple subclasses to parent internals. For sharing *behaviour*, prefer composition — mixins, plain functions, or injected collaborators.
- **Arrow methods as class fields** auto-bind `this` (handy for handlers) but cost a per-instance allocation, sit on the instance not the prototype, and can't use `super` or be overridden via the prototype — a real testing/override friction.

## 💣 Gotchas interviewers probe

- **Classes are hoisted but in the TDZ.** `new Foo()` before `class Foo {}` throws — unlike function declarations, which are fully hoisted.
- **`super()` before `this`** in every derived constructor, or ReferenceError.
- **Methods are non-enumerable.** `Object.keys(instance)` and `for…in` skip them, whereas hand-rolled prototype methods show up. This surprises people writing generic serializers.
- **Static members are inherited too.** `Child.create()` works because `Child`'s prototype is `Parent`. Many candidates think statics don't inherit.
- **Arrow methods aren't on the prototype** — no `super`, one per instance, invisible to prototype-based spies.
- **Forgetting `new` throws** — a feature, not a bug (constructor functions silently misbehaved instead).
- **`extends` takes an expression** and can even extend `null`; extending built-ins like `Array` works but has historical engine quirks.

## 🎯 Say this in the interview

> "`class` is sugar over the prototype system, but it adds semantics I'd struggle to reproduce by hand: methods are non-enumerable, calling without `new` throws, `#` fields are genuinely private, and the class binding is in a TDZ so I can't use it before its declaration. When I use `extends`, two chains get wired up — instances inherit methods up the prototype chain, and the subclass inherits static members up the constructor chain. The rule I never violate is calling `super()` before touching `this` in a derived constructor, because the parent constructor is what actually allocates `this`; using it earlier throws. Design-wise I reach for classes for stateful entities, but for sharing behaviour I lean on composition, because deep inheritance couples subclasses to parent internals and gets brittle fast."

## 🔗 Go deeper

- [javascript.info — Class basic syntax](https://javascript.info/class) — what the sugar desugars to.
- [javascript.info — Class inheritance](https://javascript.info/class-inheritance) — `extends`, `super`, and the dual-chain wiring.
- [javascript.info — Private and protected properties](https://javascript.info/private-protected-properties-methods) — `#` fields versus the older conventions.
- [MDN — Classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes) — full reference including static blocks and field semantics.
