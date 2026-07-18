<div align="center">

# Pure functions & immutability

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#functional` `#state`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A pure function returns the same output for the same input and touches nothing outside itself; immutability means you never mutate existing data, you produce new data. Together they make code cacheable, testable, and safe to reason about — which is exactly why React, Redux, and every FP toolkit are built on them.

---

## 🧠 Mental model

A pure function is a **mathematical mapping**: `f(x)` always lands on the same `y`, and calling it leaves the world untouched. Two properties, both required:

1. **Deterministic** — output depends only on arguments. No `Date.now()`, no `Math.random()`, no reading a module-level variable that changes.
2. **No side effects** — no mutating arguments, no writing to the DOM, no network, no logging that callers depend on.

Immutability is the discipline that *makes* purity achievable: if you never mutate the objects you receive, you can't accidentally create a side effect. The mental shift is **"transform, don't edit"** — every change is a new value, and the old value is still valid. This is why `Object.freeze`, spread copies, and structural sharing exist.

## ⚙️ How it actually works

The subtlety interviewers chase: **`const` is not immutability.** `const` freezes the *binding*, not the value. `const arr = []; arr.push(1)` is perfectly legal — the reference can't be reassigned, but the array it points to is mutable.

Real shallow immutability comes from **copy-on-write** with spread:

```js
const next = { ...user, name: 'Ada' };      // new object, name replaced
const next = [...list, item];               // new array, item appended
```

But spread is *shallow* — nested objects are shared by reference between old and new. Deep updates require copying every level along the path:

```js
const next = { ...state, user: { ...state.user, addr: { ...state.user.addr, city } } };
```

This verbosity is exactly why **Immer** exists. It hands you a mutable-looking `draft` backed by a Proxy that records writes, then produces an immutable next state with **structural sharing** — untouched subtrees keep the *same reference*, so downstream `===` checks (React's `memo`, Redux selectors) correctly skip re-render.

```js
const next = produce(state, (draft) => { draft.user.addr.city = city; });
```

`Object.freeze` gives you *runtime* enforcement but only one level deep, and silently no-ops in non-strict mode. It's a guardrail, not the mechanism.

## 💻 Code

```js
// ❌ Impure: mutates the argument AND is non-deterministic.
function addTax(cart) {
  cart.total = cart.subtotal * 1.2;   // mutates caller's object
  cart.stamp = Date.now();            // non-deterministic
  return cart;
}

// ✅ Pure: new object, tax rate injected, no clock.
const addTax = (cart, rate) => ({ ...cart, total: cart.subtotal * (1 + rate) });

// Immutable array ops — none of these mutate `xs`:
const withItem    = (xs, x) => [...xs, x];
const without     = (xs, i) => xs.filter((_, idx) => idx !== i);
const replaceAt   = (xs, i, v) => xs.map((x, idx) => (idx === i ? v : x));

// The trap: sort/reverse/splice MUTATE in place.
const sorted = [...xs].sort();        // ✅ copy first
// ES2023 gives immutable variants: xs.toSorted(), xs.toReversed(), xs.with(i, v)
```

## ⚖️ Trade-offs

- **Purity pushes effects to the edges.** You can't have a useful program with zero side effects — you isolate them (I/O, DOM, network) at the boundary and keep the core pure. That's the design win, not "no side effects anywhere".
- **When NOT to obsess:** hot loops over huge arrays. Copy-on-write allocates; a `map` that rebuilds a 100k-element array every keystroke is real GC pressure. There, controlled local mutation inside an otherwise-pure function is fine — the function stays pure from the *outside* even if it mutates a local it created.
- **Deep freezing is expensive** and only pays off in dev. Ship it behind `if (import.meta.env.DEV)`.
- **Immer costs a Proxy layer** — usually invisible, occasionally a bottleneck in tight update loops; drop to hand-written spreads there.

## 💣 Gotchas interviewers probe

- **"`const` makes it immutable."** No — it makes the *binding* immutable. The #1 misconception. `Object.freeze` is what freezes the value, and only shallowly.
- **Spread is shallow.** `{ ...state }` shares every nested object. Mutating `copy.user.name` mutates the original too. This breaks Redux reducers constantly.
- **Mutating array methods.** `sort`, `reverse`, `splice`, `fill`, `copyWithin`, `push`, `pop` all mutate. `map`, `filter`, `slice`, `concat` and the new `toSorted`/`toReversed`/`with` don't. Know both lists.
- **Referential equality is the payoff.** Immutability isn't aesthetic — it lets `prevProps.items === nextProps.items` short-circuit renders. Mutating in place keeps the same reference and *silently breaks memoization*.
- **A function that logs isn't pure** if callers rely on the log; a function returning a memoized value is still pure. The line is *observable* effects.

## 🎯 Say this in the interview

> "Pure means deterministic and side-effect-free — same input, same output, and it touches nothing outside itself. Immutability is how I enforce that: I never edit data I'm handed, I produce a new value. The detail people miss is that `const` only freezes the binding, not the object, and spread copies are shallow — nested objects are still shared by reference, which is what breaks Redux reducers and React's memoization. For deep updates I either copy along the whole path or use Immer, which gives me a mutable-looking draft but produces immutable state with structural sharing, so untouched branches keep their reference and `===` checks skip re-renders. I keep the core pure and push side effects — network, DOM, the clock — out to the edges, and I'm pragmatic about local mutation in hot loops as long as it isn't observable from outside."

## 🔗 Go deeper

- [Immer docs](https://immerjs.github.io/immer/) — copy-on-write with structural sharing, explained by the author.
- [MDN — Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze) — the shallow-freeze semantics and strict-mode behaviour.
- [MDN — Change Array by copy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array#copying_methods_and_mutating_methods) — the definitive mutating-vs-copying method list.
