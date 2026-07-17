<div align="center">

# Polyfills (map/filter/reduce/bind/Promise)

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 2h · `#polyfill`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Nobody asks you to write a polyfill because they need one; they ask because the *boring branches* — sparse holes, `length` read once, `enumerable: false`, and Promise's microtask guarantee — are where knowing the language separates from having used it.

---

## 🧠 Mental model

A polyfill is **an implementation of a specification, not of a happy path**. The naive `for (let i = 0; i < this.length; i++)` version of `map` passes every test a candidate writes for themselves and fails the spec in four different ways. That gap *is* the interview.

Two things are being measured. For `map`/`filter`/`reduce`: do you know arrays are just objects with weird `length` semantics, and that "empty slot" is not "undefined"? For `Promise`: can you build a state machine that never leaks synchronous execution?

> **Polyfill vs ponyfill:** a polyfill mutates the global (`Array.prototype.map = ...`); a ponyfill exports a standalone function you import. In application code, ship the ponyfill — monkey-patching a built-in you don't own is how two libraries end up fighting over `Array.prototype.flat`. Say this out loud; it's a rare signal.

## ⚙️ How it actually works

Read the spec text for `Array.prototype.map` and four requirements fall out that almost nobody implements:

1. **`ToObject(this)`** first — so `map.call(null, fn)` throws a `TypeError`, and `map.call('abc', fn)` works on a boxed string.
2. **`len = ToLength(O.length)` is read exactly once**, before the loop. Elements you `push` mid-iteration are never visited; elements you delete mid-iteration *are* skipped, because…
3. **`HasProperty(O, k)`** is checked each step. `[1, , 3]` has a hole at index 1. The callback is **not called** for it, and `map` copies the hole through to the output — `[1, , 3].map(x => x * 2)` is `[2, <1 empty item>, 6]`, and the callback ran twice, not three times.
4. **`ArraySpeciesCreate(O, len)`** builds the result — the output is pre-sized, and subclasses get their own constructor back.

`filter` deviates deliberately: it keeps a **separate write cursor** (`to`) from the read cursor (`k`), which is precisely why `filter` compacts holes away while `map` preserves them.

`reduce` has the one branch everyone forgets: **no initial value on an all-holes-or-empty array is a `TypeError`**, and the search for the seed must itself skip holes.

For `bind`, the spec detail that matters is that a bound function invoked with `new` **ignores the bound `this`** but keeps the bound leading args — see [`call`/`apply`/`bind`](call-apply-bind-polyfills.md) for the full treatment.

`Promise`'s non-negotiable clause is **Promises/A+ 2.2.4**: `onFulfilled` must never be called until the stack contains only platform code. A `then` callback that can fire synchronously turns your promise into Zalgo — the caller can no longer reason about whether their next line ran first.

## 💻 Code

```js
// ❌ The version 90% of candidates write.
Array.prototype.myMap = function (cb) {
  const out = [];
  for (let i = 0; i < this.length; i++) out.push(cb(this[i], i, this));
  return out;                       // holes become undefined; `length` re-read every step;
};                                  // no thisArg; enumerable → breaks every for…in in the app

// ✅ Spec-shaped.
Object.defineProperty(Array.prototype, 'myMap', {
  enumerable: false,                // built-ins are non-enumerable. This is the tell.
  writable: true,
  configurable: true,
  value: function (cb, thisArg) {
    if (this == null) throw new TypeError('called on null or undefined');
    if (typeof cb !== 'function') throw new TypeError(cb + ' is not a function');
    const O = Object(this);
    const len = O.length >>> 0;     // ToLength: clamps, floors, handles NaN → 0
    const out = new Array(len);     // pre-sized, so holes survive
    for (let k = 0; k < len; k++) {
      if (k in O) out[k] = cb.call(thisArg, O[k], k, O); // HasProperty → skip holes
    }
    return out;
  },
});
```

`reduce`'s seed hunt — the branch interviewers actually check:

```js
let k = 0, acc;
if (arguments.length >= 2) acc = arguments[1];   // NOT `if (init !== undefined)`:
else {                                           // reduce(fn, undefined) passed a seed!
  while (k < len && !(k in O)) k++;              // skip holes to find the first real value
  if (k >= len) throw new TypeError('Reduce of empty array with no initial value');
  acc = O[k++];
}
for (; k < len; k++) if (k in O) acc = cb(acc, O[k], k, O);
```

Promise, reduced to the parts that are actually hard:

```js
function MyPromise(executor) {
  let state = 'pending', value, cbs = [];

  const settle = (s, v) => {
    if (state !== 'pending') return;             // latch: settle exactly once
    state = s; value = v;
    cbs.forEach(queueMicrotask);                 // A+ 2.2.4 — async, always
    cbs = [];
  };

  // The Resolution Procedure — where thenable assimilation lives.
  const resolve = (x) => {
    if (x === promise) return settle('rejected', new TypeError('Chaining cycle'));
    if (x && (typeof x === 'object' || typeof x === 'function')) {
      let then;
      try { then = x.then; } catch (e) { return settle('rejected', e); } // getter may throw
      if (typeof then === 'function') {
        let called = false;                      // a hostile thenable may call BOTH
        try {
          return then.call(x, (y) => { if (!called) { called = true; resolve(y); } },
                              (r) => { if (!called) { called = true; settle('rejected', r); } });
        } catch (e) { if (!called) settle('rejected', e); return; }
      }
    }
    settle('fulfilled', x);
  };

  const promise = this;
  this.then = (onOk, onErr) => new MyPromise((res, rej) => {
    const run = () => {
      const handler = state === 'fulfilled' ? onOk : onErr;
      if (typeof handler !== 'function') {       // pass-through when no handler:
        return state === 'fulfilled' ? res(value) : rej(value); // this IS how .catch works
      }
      try { res(handler(value)); } catch (e) { rej(e); }
    };
    state === 'pending' ? cbs.push(run) : queueMicrotask(run);
  });

  try { executor(resolve, (r) => settle('rejected', r)); }
  catch (e) { settle('rejected', e); }
}
```

## ⚖️ Trade-offs

- **`>>> 0` is not `ToLength`.** It's the classic shorthand and it's *wrong* above 2³²−1 — it wraps. Real `ToLength` clamps at 2⁵³−1. Fine for every array you'll ever hold in memory; know that you cheated, and say so.
- **Don't ship hand-rolled polyfills.** `core-js` via `@babel/preset-env` with `useBuiltIns: 'usage'` and a `browserslist` is the answer in production — it's spec-exhaustive and only injects what your targets lack. Hand-rolling is an interview exercise and a bundle-size regression.
- **Prototype extension has a real cost beyond taste**: it deoptimises megamorphic property lookup on `Array.prototype`, and `enumerable: true` silently breaks any `for…in` in any dependency. If you must patch, guard with `if (!Array.prototype.at)` and always use `defineProperty`.
- **A hand-written Promise is never a drop-in.** You'd also owe `Symbol.toStringTag`, subclass-aware `then` via `SpeciesConstructor`, `unhandledrejection`, and native devtools async stack traces. Scope it explicitly in the interview rather than pretending.

## 💣 Gotchas interviewers probe

- **Holes are not `undefined`.** `[1, , 3]` — `map` skips the callback for index 1 *and* keeps the hole; `filter` drops it; `forEach` skips it; but `for…of` and spread **do** visit it as `undefined`, because iteration goes through `Symbol.iterator`, not `HasProperty`. Candidates who conflate `[,]` with `[undefined]` get caught here.
- **`arguments.length >= 2` in `reduce`, not `init !== undefined`.** `[1,2].reduce(fn, undefined)` *did* supply a seed. This is the single most common polyfill bug.
- **Assigning to `Array.prototype.map` makes it enumerable.** Every `for…in` over an array in the entire app now yields `"map"`. Use `Object.defineProperty`.
- **`length` is snapshotted.** `arr.myMap(() => arr.push(1))` must terminate. If your loop condition re-reads `this.length`, it hangs — an interviewer can trigger that in one line.
- **A `then` callback that fires synchronously is a bug, not an optimisation.** Resolving an already-resolved promise still defers by a microtask. If your polyfill calls back synchronously when the state is already settled, you've released Zalgo.
- **`x.then` must be read exactly once.** It can be a getter with side effects, and it can throw — that throw must *reject*, not propagate.
- **A thenable can call `resolve` twice, or call both `resolve` and `reject`.** The `called` latch inside the resolution procedure exists specifically for hostile input; the outer state latch is not enough.
- **`.catch(fn)` is literally `.then(undefined, fn)`** — which only works because a missing handler *passes the value through* to the next link. That pass-through is why a rejection can travel down five `.then`s to one `.catch` at the bottom.

## 🎯 Say this in the interview

> "I'd write these spec-shaped rather than intuition-shaped, because that's what's being tested. For `map`: coerce `this` with `Object()` so `null` throws, read `length` exactly once up front, and guard each index with `k in O` — because holes must not invoke the callback, and `map` preserves them in the output while `filter` compacts them. I'd install it with `Object.defineProperty` and `enumerable: false`, since a plain assignment would show up in every `for…in` in the codebase. For `reduce`, the seed check is `arguments.length >= 2`, not `init !== undefined` — otherwise `reduce(fn, undefined)` silently loses its seed, and an empty array with no seed has to throw a `TypeError`. For Promise, the two parts that are genuinely hard are the resolution procedure — thenable assimilation, reading `.then` only once, and latching against a thenable that calls back twice — and the A+ rule that handlers always run in a microtask, never synchronously. In production I'd never ship any of this; I'd let `core-js` and browserslist decide."

## 🔗 Go deeper

- [ECMA-262 — `Array.prototype.map`](https://tc39.es/ecma262/#sec-array.prototype.map) — read the actual algorithm steps once; `HasProperty` and the single `length` read jump straight out.
- [Promises/A+ specification](https://promisesaplus.com/) — short enough to read in ten minutes, and clause 2.3 (the resolution procedure) is the whole interview.
- [MDN — `Array.prototype.reduce`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) — documents the empty-array `TypeError` and the seed semantics precisely.
- [MDN — Polyfill (glossary)](https://developer.mozilla.org/en-US/docs/Glossary/Polyfill) — the polyfill/ponyfill/transpile distinction, stated canonically.
- [core-js](https://github.com/zloirock/core-js) — what a genuinely spec-complete polyfill looks like, and why you don't hand-roll one.
