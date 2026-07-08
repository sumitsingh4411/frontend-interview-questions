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

**Related:** [02-browser](../02-browser/) · [04-typescript](../04-typescript/) · [18-design-patterns](../18-design-patterns/) · [16-machine-coding](../16-machine-coding/#-js-utilities-implement-these)

_Missing something? [Add a row](../CONTRIBUTING.md)._
