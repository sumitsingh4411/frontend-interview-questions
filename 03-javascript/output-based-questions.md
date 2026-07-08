# JavaScript Output-Based Questions (with answers)

> **Difficulty:** 🟡 Medium · **Est. time:** `1.5h` · **Tags:** `#output-based` `#tricky` `#interview`

**The classic "guess the output" set.** Cover the answer, predict the output, then reveal. Each one teaches a core concept — hoisting, closures, the event loop, `this`, coercion, and promises. Great warm-up before any JS interview.

**Related:** [JavaScript section](README.md) · [Promise/debounce flagship](promise-polyfills-and-throttle-debounce.md) · [DSA for Frontend](../21-dsa-for-frontend/)

---

## 🪜 Hoisting & scope

**Q1**
```js
console.log(a);
var a = 5;
```
**Output:** `undefined` — `var a` is hoisted (declaration only); the assignment stays in place.

**Q2**
```js
console.log(b);
let b = 5;
```
**Output:** `ReferenceError: Cannot access 'b' before initialization` — `let`/`const` are in the **Temporal Dead Zone** until declared.

**Q3**
```js
let x = 1;
(function () {
  console.log(x);
  let x = 2;
})();
```
**Output:** `ReferenceError` — inside the IIFE, `x` is block-scoped and hoisted into the TDZ, so the outer `x` is shadowed and not yet initialized.

---

## 🔒 Closures & loops

**Q4**
```js
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
**Output:** `3 3 3` — `var` is function-scoped; all three callbacks close over the **same** `i`, which is `3` when they run.

**Q5**
```js
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
```
**Output:** `0 1 2` — `let` creates a **new binding** each iteration.

**Q6**
```js
function counter() {
  let count = 0;
  return () => ++count;
}
const c = counter();
console.log(c(), c(), c());
```
**Output:** `1 2 3` — the returned closure keeps a private `count` alive.

---

## ⏳ Event loop (micro vs macrotasks)

**Q7**
```js
console.log('A');
setTimeout(() => console.log('B'), 0);
Promise.resolve().then(() => console.log('C'));
console.log('D');
```
**Output:** `A D C B` — synchronous first (`A`, `D`), then the **microtask** (`C`), then the **macrotask** (`B`).

**Q8**
```js
async function f() {
  console.log(1);
  await null;
  console.log(2);
}
console.log(0);
f();
console.log(3);
```
**Output:** `0 1 3 2` — code up to the first `await` runs synchronously; everything after `await` is queued as a microtask.

**Q9**
```js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => {
  console.log(3);
  setTimeout(() => console.log(4));
});
console.log(5);
```
**Output:** `1 5 3 2 4` — sync (`1`,`5`) → microtask (`3`) → macrotasks in order queued (`2`, then `4`).

---

## 🎯 `this`

**Q10**
```js
const obj = {
  name: 'JS',
  greet() { return this.name; },
};
const g = obj.greet;
console.log(g());
```
**Output:** `undefined` (strict mode) / `''` (sloppy, `this` = window) — `this` is determined at **call time**; detaching the method loses the receiver.

**Q11**
```js
const obj = {
  name: 'JS',
  greet() {
    return (() => this.name)();
  },
};
console.log(obj.greet());
```
**Output:** `JS` — the arrow function has **no own `this`**; it uses `greet`'s `this`, which is `obj`.

---

## 🔀 Coercion & operators

**Q12**
```js
console.log(1 + '2' + 3);
console.log('5' - 2);
```
**Output:** `"123"` and `3` — `+` with a string concatenates; `-` forces numeric coercion.

**Q13**
```js
console.log([] + []);
console.log([] + {});
console.log(0.1 + 0.2 === 0.3);
```
**Output:** `""`, `"[object Object]"`, `false` (it's `0.30000000000000004` — floating point).

**Q14**
```js
console.log([1, 2, 3].map(parseInt));
```
**Output:** `[1, NaN, NaN]` — `map` passes `(value, index)`, so it calls `parseInt(1,0)=1`, `parseInt(2,1)=NaN`, `parseInt(3,2)=NaN`.

**Q15**
```js
console.log(typeof null, typeof NaN, typeof undefined, typeof function () {});
```
**Output:** `"object" "number" "undefined" "function"` — `typeof null === "object"` is a historic bug.

**Q16**
```js
console.log(null == undefined, null === undefined, NaN === NaN);
```
**Output:** `true false false` — `NaN` is never equal to anything, including itself.

**Q17**
```js
console.log([] == ![]);
```
**Output:** `true` — `![]` is `false`; then `[] == false` → `'' == 0` → `0 == 0` → `true`.

**Q18**
```js
console.log(1 < 2 < 3);
console.log(3 > 2 > 1);
```
**Output:** `true` and `false` — evaluated left-to-right: `(3 > 2) > 1` → `true > 1` → `1 > 1` → `false`.

---

## 📦 References, arrays & objects

**Q19**
```js
const a = { x: 1 };
const b = a;
b.x = 2;
console.log(a.x);
```
**Output:** `2` — objects are held by **reference**; `a` and `b` point to the same object.

**Q20**
```js
console.log([3, 1, 10, 2].sort());
```
**Output:** `[1, 10, 2, 3]` — default `sort` compares elements as **strings** (`"10" < "2"`). Use `sort((a,b)=>a-b)`.

**Q21**
```js
const arr = [1, 2, 3];
arr.length = 0;
console.log(arr[0]);
```
**Output:** `undefined` — setting `length = 0` truncates the array.

**Q22**
```js
const { x, y = 10 } = { x: 1, y: undefined };
console.log(x, y);
```
**Output:** `1 10` — destructuring defaults apply when the value is `undefined`.

---

## 🤝 Promises

**Q23**
```js
Promise.resolve(1)
  .then(() => 2)
  .then((v) => console.log(v));
```
**Output:** `2` — the first `.then` ignores `1` and returns `2`, which flows down the chain.

**Q24**
```js
Promise.reject('e')
  .catch((e) => e)
  .then((v) => console.log('then:', v));
```
**Output:** `then: e` — `.catch` handles the rejection and returns a value, so the chain **recovers** and continues to `.then`.

**Q25**
```js
console.log('start');
Promise.resolve().then(() => console.log('promise'));
setTimeout(() => console.log('timeout'), 0);
console.log('end');
```
**Output:** `start end promise timeout` — sync → microtask → macrotask.

---

## 🧪 More brain-teasers

**Q26**
```js
console.log(typeof typeof 1);
```
**Output:** `"string"` — `typeof 1` is `"number"`; `typeof "number"` is `"string"`.

**Q27**
```js
const obj = {};
obj[[1, 2]] = 'a';
console.log(obj['1,2']);
```
**Output:** `"a"` — object keys are strings; the array key becomes `"1,2"`.

**Q28**
```js
console.log(0.1.toFixed(20));
```
**Output:** `"0.10000000000000000555"` — reveals the real stored floating-point value.

**Q29**
```js
let a = { n: 1 };
let b = a;
a.x = a = { n: 2 };
console.log(a.x, b.x);
```
**Output:** `undefined { n: 2 }` — `a.x` is evaluated on the **old** object (bound before assignment) so `b.x` gets `{n:2}`; the new `a` never gets an `x`.

**Q30**
```js
console.log([1, 2, 3, 4].reduce((acc, x) => acc + x));
```
**Output:** `10` — no initial value, so it starts from the first element.

---

## 🎓 What these test

| Concept | Questions |
|---------|-----------|
| Hoisting / TDZ | Q1–Q3 |
| Closures | Q4–Q6 |
| Event loop | Q7–Q9, Q25 |
| `this` binding | Q10–Q11 |
| Type coercion | Q12–Q18 |
| References | Q19, Q29 |
| Promises | Q23–Q25 |

**Next:** [Implement-this challenges](README.md#-implement-this-coding-challenges) · [DSA for Frontend](../21-dsa-for-frontend/)
