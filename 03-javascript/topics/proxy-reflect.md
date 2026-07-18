<div align="center">

# Proxy & Reflect

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 1h · `#metaprogramming`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A `Proxy` wraps an object and lets you intercept the fundamental operations on it — get, set, has, delete, call — via "traps." `Reflect` gives you the *default* behaviour of each of those operations as a plain function, so inside a trap you do the normal thing and then add your logic around it.

---

## 🧠 Mental model

Every object operation — reading a property, assigning one, checking `in`, calling as a function — is a low-level **internal method** the engine invokes (`[[Get]]`, `[[Set]]`, `[[Has]]`…). Normally these are hard-wired. A `Proxy` lets you **substitute your own implementation** for any of them.

```
code:  proxy.name
         ↓ engine calls [[Get]]
       get trap runs  →  you decide what "reading .name" means
```

Think of a Proxy as a **customs checkpoint** in front of an object: nothing gets in or out without passing through your handler, and you can inspect, modify, block, or log every operation. `Reflect` is the checkpoint's "just do the normal thing" button — `Reflect.get(target, key, receiver)` performs the default read. The two are designed as a **matched pair**: every trap has a same-named, same-signature `Reflect` method.

This is the machinery behind Vue 3's reactivity, MobX, Immer, and validation/ORM libraries.

## ⚙️ How it actually works

A proxy is `new Proxy(target, handler)`. The handler's methods are **traps** — omit a trap and that operation passes through to the target untouched. The common ones:

| Trap | Fires on | Reflect counterpart |
|---|---|---|
| `get` | `obj.x`, `obj['x']` | `Reflect.get` |
| `set` | `obj.x = v` | `Reflect.set` |
| `has` | `'x' in obj` | `Reflect.has` |
| `deleteProperty` | `delete obj.x` | `Reflect.deleteProperty` |
| `apply` | `fn(...)` | `Reflect.apply` |
| `construct` | `new Fn(...)` | `Reflect.construct` |
| `ownKeys` | `Object.keys`, spread | `Reflect.ownKeys` |

Two staff-level reasons `Reflect` is not optional:

1. **The `receiver` and getters/inheritance.** `return target[key]` breaks when a getter on the prototype references `this` — `this` would be the raw target, not the proxy, so nested reactive reads escape tracking. `Reflect.get(target, key, receiver)` forwards the correct `receiver`, so `this` stays the proxy. This is *the* reason Vue switched to Proxy+Reflect.
2. **Invariants.** Traps must obey consistency rules — e.g. you can't report a non-configurable, non-writable property as a different value, or hide a non-configurable own property from `ownKeys`. Violate an invariant and the engine throws a `TypeError`. Delegating through `Reflect` keeps you honest automatically.

`Proxy.revocable(target, handler)` returns `{ proxy, revoke }`; calling `revoke()` makes every future operation throw — a clean way to invalidate a capability (e.g. tear down access after a component unmounts).

## 💻 Code

```js
// Reactive object: track reads, react to writes — the core of Vue-style reactivity.
function reactive(target, onChange) {
  return new Proxy(target, {
    get(t, key, receiver) {
      const value = Reflect.get(t, key, receiver);       // correct `this` for getters
      return typeof value === 'object' && value !== null
        ? reactive(value, onChange)                       // deep: proxy nested objects lazily
        : value;
    },
    set(t, key, value, receiver) {
      const ok = Reflect.set(t, key, value, receiver);    // do the real write
      onChange(key, value);                               // then react
      return ok;                                          // MUST return boolean
    },
  });
}

// Validation: reject bad writes at assignment time.
const user = new Proxy({}, {
  set(t, key, value) {
    if (key === 'age' && !Number.isInteger(value)) throw new TypeError('age must be int');
    return Reflect.set(t, key, value);
  },
});
user.age = 30;      // ok
user.age = 'x';     // throws

// ❌ Naive trap: breaks inherited getters and forgets the return value.
new Proxy(obj, { get: (t, k) => t[k], set: (t, k, v) => { t[k] = v; } }); // set returns undefined → strict-mode TypeError
```

## ⚖️ Trade-offs

- **Use for cross-cutting interception** you can't get otherwise: reactivity/observation, validation, negative-array-index or default-value objects, API mocking, access control, lazy-loading/hydration. When the *behaviour of the object itself* must change, Proxy is the only clean tool.
- **When NOT to use it:** anything hot. Every trapped operation is a function call through the handler — a proxied object property read is meaningfully slower than a plain one, and it defeats some JIT optimisations. Never proxy a hot inner-loop data structure.
- **Not fully transparent.** `proxy === target` is `false`; `WeakMap`/`Map` keyed by the target won't find the proxy; some engine internals and private class fields (`#x`) don't play nicely. It *looks* like the object but isn't identical to it.
- **Debuggability.** Traps make "why did reading this property do that?" genuinely hard to trace. Keep handlers small and obvious.

## 💣 Gotchas interviewers probe

- **Why `Reflect` at all?** The answer is `receiver`/`this` correctness for getters and prototype chains, plus invariant preservation. "It's just a nicer syntax" is a shallow answer — it's about *correct forwarding*.
- **`set` and `deleteProperty` must return a boolean.** Returning `undefined` (falsy) signals failure and throws in strict mode. Silent data loss otherwise. Extremely common bug.
- **Traps don't fire recursively.** Proxying an object does *not* proxy its nested objects — you must wrap them on access (see `get` above) for deep reactivity. Candidates assume it's deep.
- **Private fields escape.** `#field` access inside a class method uses the real `this`, not the proxy, so proxies can't intercept private fields — a known limitation.
- **Proxy breaks identity.** `proxy !== target`, and it won't be found as a `WeakMap`/`Set` key registered under the raw target. Reactivity libs keep a `target → proxy` map to dedupe.
- **Performance.** If asked "why not proxy everything?", cite the per-operation trap overhead and lost JIT optimisation.

## 🎯 Say this in the interview

> "A Proxy intercepts the fundamental operations on an object — get, set, has, delete, apply, construct — through traps, so I can add behaviour around reading and writing without touching the object's call sites. `Reflect` is its matched pair: it exposes the default version of each operation as a function, so inside a trap I do the normal thing with `Reflect.get`/`set` and layer my logic on top. `Reflect` isn't cosmetic — passing the `receiver` through `Reflect.get` keeps `this` pointing at the proxy, so getters on the prototype are still tracked, which is exactly why Vue 3's reactivity uses it; and delegating through `Reflect` preserves the engine's invariants so I don't accidentally throw. The gotchas I watch: `set` and `deleteProperty` must return a boolean or strict mode throws, traps aren't recursive so deep reactivity means wrapping nested objects on access, and proxies break identity, so `proxy !== target`. And I never proxy hot data — every trapped operation is a function call that defeats JIT optimisation."

## 🔗 Go deeper

- [javascript.info — Proxy and Reflect](https://javascript.info/proxy) — every trap, the invariants, and the `receiver` subtlety, worked through.
- [MDN — Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) — the full trap list and handler signatures.
- [MDN — Reflect](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Reflect) — why each trap has a `Reflect` counterpart with the same signature.
