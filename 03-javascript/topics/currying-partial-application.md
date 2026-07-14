<div align="center">

# Currying & partial application

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#functional`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Currying** turns `f(a, b, c)` into `f(a)(b)(c)` — a chain of one-argument functions. **Partial application** just pre-fills *some* arguments and returns a function wanting the rest. They're related but not the same thing, and interviewers love that most candidates use the words interchangeably.

---

## 🧠 Mental model

Both are about **deferring arguments** — but they differ in shape:

| | Input | Output |
|---|---|---|
| **Currying** | `f(a, b, c)` | `f(a)(b)(c)` — strictly unary steps |
| **Partial application** | `f(a, b, c)` + `a` | `g(b, c)` — one call, fewer args |

`fn.bind(null, a)` is partial application, **not** currying. Say that out loud in an interview and you've already separated yourself from most candidates.

The practical value is **specialisation**: you bake in the config once and get back a focused function. `const log = curriedLog('app')('error')` gives you a logger that only needs a message. This is the same idea as dependency injection, expressed with closures.

Real currying implementations in the wild (lodash, Ramda) are actually *variadic* — they accept `f(a)(b, c)` or `f(a, b)(c)` too. That's a curry/partial hybrid, and it's what interviewers usually ask you to implement.

## ⚙️ How it actually works

The mechanism is **closure + arity checking**. A curried wrapper compares how many arguments it has collected against `fn.length` — the declared parameter count. If it has enough, it invokes; otherwise it returns a new function that remembers what it's seen so far.

The critical subtlety: **`fn.length` lies.** It stops counting at the first default or rest parameter.

```js
((a, b = 1, c) => 0).length   // 1  — stops at the default
((...args) => 0).length       // 0  — rest params don't count
```

So `curry` fundamentally cannot work on variadic functions. You must pass an explicit arity for those. Knowing *why* the naive implementation breaks is the senior signal here.

Two more mechanics worth naming:

- **Accumulation must be immutable.** Each partially-applied function is its own value; if you push into a shared `args` array, two branches of the same curried function will corrupt each other. Always `[...prev, ...next]`.
- **Argument order matters enormously.** Currying is only useful if the *data* is the last parameter, because that's the one you supply last: `map(fn)(list)`, not `map(list)(fn)`. This is why Ramda is "data-last" and native `Array.prototype.map` (data-first, via `this`) can't be curried usefully.

## 💻 Code

The classic interview implementation — variadic, arity-aware, reusable:

```js
function curry(fn, arity = fn.length) {
  return function curried(...args) {
    // Enough args? Call through, forwarding `this` so methods still work.
    if (args.length >= arity) return fn.apply(this, args);

    // Not enough: return a collector that remembers what we have.
    // ✅ Spread into a NEW array — never mutate `args`, or sibling
    //    branches of the same curried fn will stomp on each other.
    return function (...next) {
      return curried.apply(this, [...args, ...next]);
    };
  };
}

const add = (a, b, c) => a + b + c;
const c = curry(add);

c(1)(2)(3);      // 6   — strict currying
c(1, 2)(3);      // 6   — variadic: partial application
c(1)(2, 3);      // 6
const add1 = c(1);
add1(2, 3);      // 6   — and add1 is REUSABLE, not consumed
```

Partial application is a one-liner by comparison:

```js
const partial = (fn, ...preset) => (...later) => fn(...preset, ...later);

const greet = (greeting, punct, name) => `${greeting}, ${name}${punct}`;
const hi = partial(greet, 'Hi', '!');
hi('Ada');                       // "Hi, Ada!"

// Native, but beware: bind also permanently pins `this`.
const hi2 = greet.bind(null, 'Hi', '!');
```

**The infinite-sum trick** (`sum(1)(2)(3)()`) — asked more often than it deserves:

```js
const sum = (a) => {
  let total = a;
  const next = (b) => (b === undefined ? total : ((total += b), next));
  return next;
};
sum(1)(2)(3)();   // 6  — terminate with an empty call
// The "no terminator" variant abuses valueOf/toString coercion — a party trick,
// not production code. Say so if asked.
```

## ⚖️ Trade-offs

- **Currying buys reuse and costs allocations.** Every partial step allocates a closure. In a hot loop over 100k items, `curried(a)(b)` is measurably slower than `fn(a, b)` — you're trading CPU for expressiveness. Fine at the edges, wrong in the inner loop.
- **It only pays off with data-last argument order.** If you have to `flip` your arguments to make currying work, currying isn't helping you.
- **Debuggability suffers.** Stack traces fill with anonymous `curried` frames, and `fn.name` / `fn.length` are destroyed by the wrapper.
- **When NOT to use it:** in a codebase where nobody else writes FP. `curry` sprinkled through an otherwise imperative React app is a readability tax, not a win. Point-free style taken too far is write-only code.

## 💣 Gotchas interviewers probe

- **"Is `bind` currying?"** No — it's partial application. Also, `bind` permanently fixes `this`, which `partial` doesn't.
- **`fn.length` with defaults or rest params.** `curry((a, b = 2) => a + b)` has arity 1 and will fire after one argument. Accept an explicit `arity` override — this is the detail that shows you've actually implemented it.
- **Mutating the accumulated `args` array.** The bug appears only when you reuse a partial: `const f = c(1); f(2,3); f(4,5);` — with mutation, the second call sees stale args.
- **Losing `this`.** If you curry a method, the innermost call must `fn.apply(this, args)`, and the collector must forward `this` too.
- **Passing `undefined` as a real argument.** `c(1)(undefined)(3)` counts `undefined` as a supplied argument — which is correct, but surprises people who use `undefined` as "skip". Placeholder support (lodash's `_`) is the fix, and it's a good follow-up to volunteer.
- **Currying ≠ composition.** They pair well (`pipe(map(double), filter(isEven))`), but they're different tools.

## 🎯 Say this in the interview

> "Currying converts an n-argument function into a chain of unary functions — `f(a)(b)(c)` — while partial application just pre-fills some arguments and returns a function that wants the rest. `bind` is partial application, not currying. In practice I implement the variadic version: the wrapper collects arguments and compares them against `fn.length`, calling through once it has enough. Two things I watch for: `fn.length` stops counting at the first default or rest parameter, so I always accept an explicit arity override — and I spread into a new args array rather than mutating, because otherwise reusing a partially-applied function corrupts it. The real-world value is specialisation with data-last arguments, and the cost is a closure allocation per step plus worse stack traces, so I keep it out of hot loops."

## 🔗 Go deeper

- [javascript.info — Currying](https://javascript.info/currying-partials) — the canonical walkthrough, including the arity trick.
- [MDN — Function.prototype.bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) — partial application, natively.
- [MDN — Function.prototype.length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/length) — read the "default and rest parameters" note; it's the whole gotcha.
- [Ramda docs](https://ramdajs.com/docs/) — a library designed data-last and auto-curried; useful for seeing why argument order is the real decision.
