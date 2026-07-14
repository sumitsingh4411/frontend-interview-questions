<div align="center">

# Prototypes & prototype chain

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 1h · `#prototype` `#oop`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every object has a hidden `[[Prototype]]` link to another object; a property read that misses walks *up* that chain until it hits `null`. That delegation chain — not classes — is JavaScript's real inheritance mechanism. `class` is sugar over it.

---

## 🧠 Mental model

Objects **delegate**. Read `obj.x`; if `obj` lacks `x` the engine asks `obj`'s prototype, then *its* prototype, up to `Object.prototype`, then `null` → `undefined`. Writing is different and this is the crux: **assignment sets the property on the object itself (shadowing) — it never travels up the chain.** Only reads delegate.

Three names people blur, kept straight:

| Expression | What it is |
|---|---|
| `obj.__proto__` / `getPrototypeOf(obj)` | the object `obj` delegates to |
| `Fn.prototype` | the object that becomes `__proto__` of `new Fn()` — exists **only on functions** |
| `Fn.prototype.constructor` | a back-pointer from the prototype to `Fn` |

## ⚙️ How it actually works

`new Fn()` does three things: create a fresh object whose `[[Prototype]]` is `Fn.prototype`, run `Fn` with `this` bound to that object, and return it (unless the constructor explicitly returns an object). So instance methods you put on `Fn.prototype` are found via delegation, and `this` inside them is the *instance* that triggered the lookup — shared code, per-instance data.

```
d ──▶ Dog.prototype ──▶ Object.prototype ──▶ null
```

`instanceof` implements exactly this: it checks whether `Constructor.prototype` appears anywhere in the object's chain.

## 💻 Code

```js
function Dog(name) { this.name = name; }
Dog.prototype.speak = function () { return `${this.name} barks`; };

const d = new Dog('Rex');
Object.getPrototypeOf(d) === Dog.prototype; // true
d.speak();                                  // 'Rex barks' — found on prototype, this = d
d.hasOwnProperty('speak');                  // false (inherited)
d.hasOwnProperty('name');                   // true  (own)
```

Delegation and shadowing:

```js
const base = { greet() { return `hi ${this.name}`; } };
const child = Object.create(base);   // child.__proto__ = base
child.name = 'Sam';
child.greet();                       // 'hi Sam' — greet on base, this = child

child.greet = () => 'overridden';    // sets an OWN prop; base is untouched
```

`Object.create(null)` — a dictionary with no inherited keys (no `toString`, no `__proto__` trap), the safe choice for a lookup map.

## ⚖️ Trade-offs

- **Prototype methods are shared → memory-efficient.** One function serves every instance. Defining methods inside the constructor (`this.speak = () => …`) allocates a fresh copy per instance — wasteful at scale.
- **`Object.create(null)` for maps** avoids inherited-key collisions, but such objects lack `Object.prototype` helpers — a deliberate trade. (Often `Map` is the cleaner answer entirely.)
- **When NOT to use it:** never monkey-patch built-in prototypes (`Array.prototype.foo = …`) in shared code — it's a hidden global, a compatibility landmine, and a V8 megamorphic deopt. Deep inheritance chains are a design smell; prefer composition.

## 💣 Gotchas interviewers probe

- **`__proto__` vs `prototype`.** `__proto__` is the link an *instance* has; `prototype` is a property on *constructor functions*. The single most confused pair in JS.
- **Assignment shadows, it doesn't mutate the prototype.** `child.x = 1` never changes the parent — only reads delegate.
- **`in` vs `hasOwnProperty`.** `in` searches the whole chain; `hasOwnProperty` only the object. Prefer `Object.hasOwn(obj, k)` now (immune to shadowed/`null`-proto objects).
- **`instanceof` can lie** across realms (iframes have their own `Object`) or if `.prototype` is reassigned. It's a chain check, not a type check.
- **Changing `Fn.prototype` after instances exist** doesn't relink them — they keep pointing at the old object.
- **Forgetting `new`** calls the constructor with `this === undefined` (strict) → a crash, or silent global pollution in sloppy mode.

## 🎯 Say this in the interview

> "Every object has a hidden prototype link, and property *reads* that miss walk up that chain until `Object.prototype` and then `null`. That delegation is JavaScript's actual inheritance model — classes are just sugar over it. The distinction I'm careful about is `__proto__` versus `prototype`: `__proto__` is the link an instance has, while `prototype` is a property on a constructor function that becomes the instance's `__proto__` when you call it with `new`. The subtlety people miss is that only reads delegate — assignment always creates an own property and shadows, it never mutates the prototype. I put shared methods on the prototype so all instances share one function instead of allocating a copy each, and I never patch built-in prototypes in shared code because it's effectively a global and a performance deopt."

## 🔗 Go deeper

- [javascript.info — Prototypal inheritance](https://javascript.info/prototype-inheritance) — the clearest treatment of `[[Prototype]]` and lookup.
- [javascript.info — Native prototypes](https://javascript.info/native-prototypes) — how built-ins wire up, and why not to patch them.
- [MDN — Inheritance and the prototype chain](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Inheritance_and_the_prototype_chain) — spec-accurate reference with the `new` algorithm.
