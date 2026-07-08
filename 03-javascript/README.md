# 03 · JavaScript

The language, deeply. These are the questions that get asked in *every* frontend loop — and where machine-coding rounds start.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

⭐ **Flagship:** [Promise polyfills + debounce/throttle deep-dive](promise-polyfills-and-throttle-debounce.md)

## Core language

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| `var` / `let` / `const`, scope, hoisting, TDZ | 🟢 | 45m | `#basics` | [javascript.info: variables ⭐](https://javascript.info/var) |
| Data types & coercion (`==` vs `===`) | 🟢 | 45m | `#basics` | [javascript.info: type conversions ⭐](https://javascript.info/type-conversions) |
| Closures | 🟡 | 1h | `#closures` | [javascript.info: closures ⭐](https://javascript.info/closure) |
| `this` binding (4 rules) | 🟡 | 45m | `#this` | [javascript.info: this ⭐](https://javascript.info/object-methods) |
| `call` / `apply` / `bind` (+ polyfills) | 🟡 | 45m | `#this` `#polyfill` | [MDN: bind ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) |
| Prototypes & prototype chain | 🟡 | 1h | `#prototype` `#oop` | [javascript.info: prototypes ⭐](https://javascript.info/prototype-inheritance) |
| Classes & inheritance | 🟡 | 45m | `#oop` | [javascript.info: classes ⭐](https://javascript.info/class) |
| Objects, descriptors, getters/setters | 🟡 | 45m | `#objects` | [javascript.info: property flags ⭐](https://javascript.info/property-descriptors) |
| Destructuring, spread, rest | 🟢 | 30m | `#basics` | [javascript.info: destructuring ⭐](https://javascript.info/destructuring-assignment) |
| Optional chaining & nullish coalescing | 🟢 | 20m | `#basics` | [MDN: optional chaining ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) |
| `Symbol` & well-known symbols | 🟡 | 30m | `#advanced` | [javascript.info: symbols ⭐](https://javascript.info/symbol) |
| `Map` / `Set` vs objects/arrays | 🟢 | 30m | `#basics` | [javascript.info: Map/Set ⭐](https://javascript.info/map-set) |

## Async

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Event loop, micro/macrotasks | 🟡 | 1h | `#async` `#internals` | [Jake Archibald: in the loop ⭐](https://www.youtube.com/watch?v=cCOL7MC4Pl0) |
| Callbacks & callback hell | 🟢 | 30m | `#async` | [javascript.info: callbacks ⭐](https://javascript.info/callbacks) |
| Promises (states, chaining) | 🟡 | 1h | `#async` `#promises` | [javascript.info: promises ⭐](https://javascript.info/promise-basics) |
| `Promise.all/allSettled/race/any` | 🟡 | 45m | `#async` `#polyfill` | [Flagship ⭐](promise-polyfills-and-throttle-debounce.md) |
| async / await + error handling | 🟡 | 45m | `#async` | [javascript.info: async/await ⭐](https://javascript.info/async-await) |
| Debounce & throttle | 🟡 | 45m | `#patterns` `#performance` | [Flagship ⭐](promise-polyfills-and-throttle-debounce.md) |
| AbortController & cancellation | 🟡 | 30m | `#async` | [MDN: AbortController ⭐](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) |
| Async iterators & `for await` | 🔴 | 45m | `#async` `#iterators` | [javascript.info: async iteration ⭐](https://javascript.info/async-iterators-generators) |
| Concurrency control (promise pool) | 🔴 | 45m | `#async` `#patterns` | [BFE.dev ⭐](https://bigfrontend.dev/) |

## Functions & FP

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Higher-order functions | 🟢 | 30m | `#functional` | [javascript.info ⭐](https://javascript.info/) |
| Currying & partial application | 🟡 | 45m | `#functional` | [javascript.info: currying ⭐](https://javascript.info/currying-partials) |
| Composition (`pipe`/`compose`) | 🟡 | 30m | `#functional` | [BFE.dev ⭐](https://bigfrontend.dev/) |
| Pure functions & immutability | 🟡 | 45m | `#functional` `#state` | [Immer docs ⭐](https://immerjs.github.io/immer/) |
| Memoization | 🟡 | 30m | `#functional` `#performance` | [BFE.dev ⭐](https://bigfrontend.dev/) |
| Generators | 🔴 | 1h | `#generators` | [javascript.info: generators ⭐](https://javascript.info/generators) |
| Iterators & iterables | 🟡 | 45m | `#iterators` | [javascript.info: iterables ⭐](https://javascript.info/iterable) |

## Modules, workers & advanced

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Modules (ESM vs CJS) | 🟡 | 45m | `#modules` | [javascript.info: modules ⭐](https://javascript.info/modules-intro) |
| Web Workers | 🟡 | 1h | `#workers` `#performance` | [MDN: web workers ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) |
| Service Workers | 🔴 | 1.5h | `#workers` `#offline` | [MDN: service workers ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) |
| Shared Workers | 🔴 | 45m | `#workers` | [MDN: SharedWorker ⭐](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) |
| Streams API | 🔴 | 1h | `#streams` | [MDN: streams ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Streams_API) |
| Proxy & Reflect | 🔴 | 1h | `#metaprogramming` | [javascript.info: Proxy ⭐](https://javascript.info/proxy) |
| WeakMap & WeakSet | 🟡 | 45m | `#memory` | [javascript.info: WeakMap ⭐](https://javascript.info/weakmap-weakset) |
| WeakRef & FinalizationRegistry | 🔴 | 45m | `#memory` `#advanced` | [MDN: WeakRef ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) |
| Memory leaks in JS | 🔴 | 1h | `#memory` | [web.dev: memory ⭐](https://developer.chrome.com/docs/devtools/memory-problems) |
| Regular expressions | 🟡 | 1h | `#regex` | [javascript.info: regexp ⭐](https://javascript.info/regular-expressions) |
| `structuredClone` & deep clone | 🟡 | 30m | `#patterns` | [MDN: structuredClone ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) |
| Polyfills (map/filter/reduce/bind/Promise) | 🔴 | 2h | `#polyfill` | [Flagship ⭐](promise-polyfills-and-throttle-debounce.md) |
| Numbers, `BigInt`, floating point | 🟡 | 30m | `#basics` | [javascript.info: numbers ⭐](https://javascript.info/number) |
| Date & time handling | 🟢 | 30m | `#basics` | [MDN: Date ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date) |

## ❓ Rapid-fire JavaScript interview questions

The exact questions asked in real JavaScript interviews. Answer out loud, then verify against the resources above.

1. What is a **closure**? Give a real-world use case.
2. Explain the **event loop** — how do microtasks and macrotasks differ?
3. What's the difference between **`==` and `===`**?
4. What is **hoisting**? How do `var`, `let`, and `const` differ?
5. How does **`this`** work? What do `call`, `apply`, and `bind` do?
6. What is the **prototype chain** and prototypal inheritance?
7. Difference between **`null` and `undefined`**?
8. What is **event delegation** and why is it useful?
9. How do you **deep clone** an object? Shallow vs deep copy?
10. What are **`debounce` and `throttle`** — and when do you use each?
11. Explain **`Promise.all` vs `allSettled` vs `race` vs `any`**.
12. What is `async`/`await` and how do you handle errors in it?
13. What is the **temporal dead zone (TDZ)**?
14. How do **ES Modules** differ from CommonJS?
15. What is **currying** and partial application?
16. `map` vs `forEach` vs `reduce` — when to use which?
17. What is a **generator** function?
18. What causes **memory leaks** in JavaScript?
19. What are **`WeakMap`/`WeakSet`** and when are they useful?
20. What is a **Proxy** and what can it do?
21. What's the difference between **synchronous and asynchronous** code?
22. How does **garbage collection** work in JS engines?
23. What is a **pure function** and why does immutability matter?
24. What do **optional chaining (`?.`)** and **nullish coalescing (`??`)** do?
25. How do you **cancel a fetch request** (AbortController)?
26. `slice` vs `splice`? What does `Object.freeze` do?
27. `setTimeout` vs `setInterval` vs `requestAnimationFrame`?
28. What is the difference between **call by value and call by reference**?
29. How does **`Array.prototype.reduce`** work — implement it.
30. What is the output? (event-loop / closure / hoisting trick questions)

## 🧩 Output-based & "predict the output" questions

The trick questions that separate people who *know* JS from people who *use* JS.

1. What logs? `console.log(1); setTimeout(()=>console.log(2)); Promise.resolve().then(()=>console.log(3)); console.log(4);`
2. `for (var i=0;i<3;i++) setTimeout(()=>console.log(i))` — output? Fix with `let`.
3. What does **`[1,2,3].map(parseInt)`** return and why?
4. Why is **`0.1 + 0.2 === 0.3`** false?
5. What is **`typeof null`**, `typeof NaN`, `typeof function(){}`?
6. `[] == ![]` — true or false? Walk through the coercion.
7. Arrow vs regular function: what is **`this`** in each here?
8. Predict the output with **hoisting** (function vs `var` declarations).
9. `console.log("b" + "a" + +"a" + "a")` — what prints?
10. What's the order of **`async`/`await` + `.then` + `setTimeout`** logs?
11. `{} + []` vs `[] + {}` — explain.
12. Does modifying a copied object mutate the original? (reference vs value)

## 💻 "Implement this" coding challenges

Classic implement-from-scratch prompts — see the [flagship](promise-polyfills-and-throttle-debounce.md) and [machine-coding utilities](../16-machine-coding/#-js-utilities-implement-these).

1. Implement **`debounce`** and **`throttle`**.
2. Implement **`Promise.all`**, `allSettled`, `race`, `any`.
3. Implement **`Array.prototype.map` / `filter` / `reduce`**.
4. Implement **`Function.prototype.bind`**.
5. Implement **`deepClone`** (handle cycles).
6. Implement **`curry`**, `pipe`, `compose`.
7. Implement **`memoize`**.
8. Implement an **EventEmitter** (`on`/`off`/`emit`/`once`).
9. Implement **`flatten`** for a nested array.
10. Implement **`retry`** with exponential backoff.
11. Implement **`once`** (call a function at most once).
12. Implement a **promise-based `sleep(ms)`**.
13. Implement **`groupBy`** / `chunk` / `uniqBy`.
14. Implement an **LRU cache**.
15. Implement a **promise concurrency limiter** (pool).

---

**Related:** [02-browser](../02-browser/) · [04-typescript](../04-typescript/) · [18-design-patterns](../18-design-patterns/) · [16-machine-coding](../16-machine-coding/#-js-utilities-implement-these)

_Missing something? [Add a row](../CONTRIBUTING.md)._
