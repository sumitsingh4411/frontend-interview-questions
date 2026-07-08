<div align="center">

# ⚡ JavaScript — Full Question Bank

**548 questions**, curated from real interview prep sheets. Prompts only — work the answers using the linked sections.

<a href="README.md">⬅ Back to JavaScript</a> &nbsp;·&nbsp; <a href="../README.md">Home</a>

</div>

Conceptual + practical JavaScript interview questions by topic. Pair with the [output-based set](output-based-questions.md) and the [polyfills flagship](promise-polyfills-and-throttle-debounce.md).

> 🟢 Easy · 🟡 Medium · 🔴 Hard. This is the exhaustive bank; the section [README](README.md) has the curated highlights with resources.

**Jump to:** [Fundamentals](#fundamentals) · [Objects & OOP](#objects-oop) · [Data Structures](#data-structures) · [Functions](#functions) · [Engine Internals](#engine-internals) · [Async & Concurrency](#async-concurrency) · [Networking](#networking) · [Language & Tooling](#language-tooling) · [Reliability](#reliability) · [DOM & Browser](#dom-browser) · [Concurrency](#concurrency) · [PWA](#pwa) · [Storage](#storage) · [Performance](#performance) · [Architecture](#architecture) · [Machine Coding](#machine-coding) · [DSA in JS](#dsa-in-js) · [Advanced Language Features](#advanced-language-features) · [Modern Browser APIs](#modern-browser-apis) · [Type Systems](#type-systems) · [Quality Engineering](#quality-engineering) · [System Design](#system-design) · [Security](#security) · [Company Specific](#company-specific)

---

### Fundamentals  
<sub>44 questions</sub>

- 🟢 What is JavaScript and how does it differ from Java, ECMAScript, and TypeScript?
- 🟡 Explain the difference between compiled and interpreted languages. Where does JS fit, given JIT compilation?
- 🟢 What are primitive vs reference types in JavaScript? How are they stored in memory?
- 🟢 Explain the difference between == and === with concrete examples of type coercion pitfalls.
- 🟢 What is NaN? Why does `NaN === NaN` return false, and how do you correctly check for NaN?
- 🟢 Explain truthy and falsy values in JavaScript with a complete list of falsy values.
- 🟢 What is the difference between `undefined` and `null`? When would you deliberately use each?
- 🟡 Explain implicit type coercion rules for `+`, `-`, and comparison operators.
- 🟢 What is the difference between synchronous and asynchronous code execution in JS?
- 🟡 Explain strict mode (`'use strict'`) — what changes and why would you enable it?
- 🟢 What are the differences between `var`, `let`, and `const` at a language-design level?
- 🟡 How does JavaScript handle number precision? Explain why `0.1 + 0.2 !== 0.3`.
- 🟢 What is the Immediately Invoked Function Expression (IIFE) pattern and why was it historically used?
- 🟢 Explain the concept of first-class functions and give three practical implications.
- 🟡 What is the difference between an expression and a statement in JavaScript?
- 🟢 Explain function scope vs block scope vs lexical scope with examples.
- 🟡 What is the Temporal Dead Zone (TDZ)? Show an example where it causes a ReferenceError.
- 🟢 Why does `var` leak out of blocks (if/for) but `let`/`const` do not?
- 🟡 Predict the output: a `for` loop with `var i` inside a `setTimeout`, vs the same with `let i`.
- 🟡 What is variable shadowing? Give an example and explain resulting bugs.
- 🟡 Explain global scope pollution and at least three ways to avoid it in a large codebase.
- 🟡 What is the scope chain and how does JS resolve identifiers through it?
- 🟢 Can you redeclare a `let` variable in the same scope? What error do you get and why?
- 🔴 Explain how block-scoped functions behave differently in strict vs non-strict mode.
- 🔴 What is the difference between lexical scoping and dynamic scoping? Does JS support both anywhere (hint: `this`)?
- 🟢 Write code demonstrating scope pollution caused by accidental global assignment (missing `let`/`const`).
- 🟡 How does the module scope in ES Modules differ from the top-level scope in a `<script>` tag?
- 🟢 List all primitive types in JavaScript including the newest additions (BigInt, Symbol).
- 🟡 Explain `typeof null === 'object'` — why is this considered a historical bug?
- 🟡 What is BigInt and when would you need it over Number?
- 🟡 Explain Symbol as a primitive type. What problem does it solve for object property keys?
- 🟡 How does JavaScript perform type coercion between arrays, objects and primitives when using `+`?
- 🟡 What is the difference between deep copy and shallow copy? Show how `structuredClone` differs from `JSON.parse(JSON.stringify())`.
- 🟡 Explain how `Object.is()` differs from `===` for edge cases like `NaN` and `-0`.
- 🔴 What are Typed Arrays and ArrayBuffer? When would a frontend engineer use them?
- 🟡 Explain wrapper objects (`Number`, `String`, `Boolean`) and autoboxing of primitives.
- 🟡 How would you reliably detect the type of any JavaScript value (array vs object vs null vs date)?
- 🟢 What is hoisting? Explain how `var`, `let`, `const`, and function declarations are each hoisted differently.
- 🟡 Predict the output of a function that reads a `var` before it's assigned, versus a `let` in the same position.
- 🟡 Explain how function expressions assigned to `var`/`let` behave with hoisting compared to function declarations.
- 🔴 What happens when you hoist a `class` declaration versus a `function` declaration? Explain the TDZ for classes.
- 🟡 Explain hoisting in the context of nested functions and IIFEs.
- 🟢 Why is it considered best practice to declare variables at the top of their scope even though hoisting exists?
- 🔴 Trace through the two-phase execution model (creation phase and execution phase) explaining hoisting mechanics.

### Objects & OOP  
<sub>28 questions</sub>

- 🟡 Explain the difference between `Object.freeze`, `Object.seal`, and `Object.preventExtensions`.
- 🔴 How do property descriptors work? Explain `writable`, `enumerable`, and `configurable`.
- 🔴 Implement a deep clone function that also copies getters/setters and handles circular references.
- 🟢 Explain the difference between `Object.assign` and the spread operator for merging objects.
- 🟢 How do you iterate over an object's keys, values, and entries? Compare `for...in` vs `Object.keys`.
- 🟢 Explain optional chaining (`?.`) and nullish coalescing (`??`) with a real-world use case.
- 🟡 What are getters and setters? Show how computed properties interact with them.
- 🟡 How does `Object.defineProperty` differ from simple assignment when creating properties?
- 🟢 Explain object destructuring with default values, renaming, and nested destructuring.
- 🟡 Implement a `deepEqual(a, b)` function comparing two objects for structural equality.
- 🟡 What is the difference between `Map` and a plain object for key-value storage?
- 🔴 Explain WeakMap/WeakSet and why they help prevent memory leaks compared to Map/Set.
- 🟡 Explain the prototype chain and how property lookup traverses it.
- 🔴 What is the difference between `__proto__`, `Object.getPrototypeOf`, and a function's `.prototype` property?
- 🔴 Implement classical inheritance using `Object.create` before ES6 classes existed.
- 🟡 Explain how `class` syntax in ES6 is syntactic sugar over prototypal inheritance.
- 🟡 What is the difference between prototypal inheritance and classical (class-based) inheritance?
- 🟡 How does method resolution work when the same method exists on both an instance and its prototype?
- 🔴 Explain `Object.setPrototypeOf` and why it's generally discouraged for performance reasons.
- 🔴 Implement a simple `instanceof` operator from scratch using the prototype chain.
- 🟡 Explain class fields, private fields (`#field`), and static members introduced in modern JS.
- 🟡 How does `super` work in both constructors and methods within class inheritance?
- 🟢 Explain the difference between static methods and instance methods, with a practical use case for each.
- 🟡 Implement a small class hierarchy (Animal -> Dog -> Puppy) demonstrating method overriding and `super` calls.
- 🟡 What are the four pillars of OOP (encapsulation, abstraction, inheritance, polymorphism) and how does JS support each?
- 🔴 Explain mixins in JavaScript and how they help work around the single-inheritance limitation of classes.
- 🟡 What are abstract classes in JS (which has no native support), and how would you simulate one?
- 🟡 Explain how private class fields differ from closures for achieving encapsulation.

### Data Structures  
<sub>23 questions</sub>

- 🟢 Explain the difference between `map`, `forEach`, `filter`, and `reduce`.
- 🟡 Implement `Array.prototype.map` from scratch without using the native method.
- 🟡 Implement `Array.prototype.reduce` from scratch, including the initial-value edge case.
- 🟡 How does `Array.prototype.sort` work by default? Why is `[10, 2, 1].sort()` surprising?
- 🟡 Explain `flat` and `flatMap` and implement a recursive array flatten function for arbitrary depth.
- 🟢 What is the difference between mutating array methods (`push`, `splice`) and non-mutating ones (`slice`, `concat`)?
- 🟢 Implement a function to remove duplicates from an array while preserving order.
- 🔴 Explain stable vs unstable sorting algorithms and whether `Array.prototype.sort` is stable in modern engines.
- 🟡 How would you efficiently find the intersection of two large arrays?
- 🟡 Implement a debounced search-as-you-type array filter using `filter` and `includes`.
- 🟡 Explain array-like objects (e.g., `arguments`, NodeList) and how to convert them to real arrays.
- 🟡 Implement a sliding-window function to find the maximum sum subarray of size k.
- 🟢 How does `Array.isArray` differ from `typeof` and `instanceof` for detecting arrays?
- 🟢 Explain string immutability in JavaScript and its performance implications.
- 🟢 Implement a function to check if a string is a palindrome, ignoring case and punctuation.
- 🟢 Implement your own `String.prototype.trim` without using the native method.
- 🟡 How do template literals differ from string concatenation? Explain tagged templates.
- 🟡 Write a function to find the first non-repeating character in a string.
- 🔴 Explain Unicode, UTF-16 surrogate pairs, and why `'😀'.length` is 2, not 1.
- 🟢 Implement a function that counts the frequency of each character in a string.
- 🟡 Explain the difference between `String.raw`, escape sequences, and regular string literals.
- 🟡 Write an anagram-checking function and discuss its time complexity trade-offs (sort vs frequency map).
- 🟡 How would you implement a basic string compression algorithm (e.g., 'aabcccccaaa' -> 'a2b1c5a3')?

### Functions  
<sub>29 questions</sub>

- 🟢 Explain the difference between function declarations, function expressions, and arrow functions.
- 🟡 Why can't arrow functions be used as constructors or have their own `this`?
- 🟢 Explain default parameters and how they interact with the `arguments` object.
- 🟢 What are higher-order functions? Give three real examples from the standard library.
- 🔴 Implement a generic `curry(fn)` function supporting variable arity.
- 🟡 Implement `compose` and `pipe` utility functions for function composition.
- 🟢 What is a pure function? Why do pure functions matter for testability and memoization?
- 🟢 Explain rest parameters vs the legacy `arguments` object.
- 🟢 Implement a `once(fn)` utility that ensures a function only runs a single time.
- 🟡 Explain function hoisting differences between function declarations and function expressions.
- 🔴 Implement a generic `memoize(fn)` function, including handling of multiple arguments.
- 🟢 What is a closure? Explain with a minimal example and describe the underlying scope-chain mechanism.
- 🟡 Classic loop + `setTimeout` + `var` bug: explain why all callbacks log the same value, and fix it three different ways.
- 🟢 Implement a private counter using closures (module pattern) with `increment`, `decrement`, and `getValue`.
- 🔴 Explain how closures can cause memory leaks if not managed carefully (e.g., retained DOM references).
- 🟡 Implement a `debounce(fn, delay)` function using closures.
- 🟡 Implement a `throttle(fn, limit)` function using closures.
- 🟡 Explain the difference between closures capturing variables by reference vs by value.
- 🟡 Implement a simple memoization cache using a closure over a `Map`.
- 🟡 How would you use closures to implement data privacy before ES2022 private class fields existed?
- 🟢 Write a function `makeAdder(x)` that returns a function adding `x` to its argument — explain what's captured in the closure.
- 🟡 Explain the four/five rules for determining `this`: default, implicit, explicit, new, and arrow-function inheritance.
- 🟡 Why does `this` become `undefined`/global inside a regular callback passed to `setTimeout` or an event handler?
- 🔴 Implement your own version of `Function.prototype.bind`.
- 🔴 Implement your own version of `Function.prototype.call` and `Function.prototype.apply`.
- 🟡 Explain how arrow functions resolve `this` lexically and why that makes them unsuitable as object methods.
- 🟡 Explain how `this` behaves inside a class method vs a class field arrow function.
- 🟡 What does `this` refer to inside a DOM event handler attached via `addEventListener` vs an inline `onclick`?
- 🟡 Explain `new` binding — what four things happen when you call a function with `new`?

### Engine Internals  
<sub>25 questions</sub>

- 🟡 Explain the Global Execution Context vs Function Execution Context.
- 🔴 What are the two phases of execution context creation (memory creation and code execution)?
- 🔴 Explain the Lexical Environment and Environment Record and how they relate to closures.
- 🟡 How does the JS engine manage the execution context stack when a function calls another function?
- 🟡 Trace the execution context stack for a small recursive function computing factorial(3).
- 🔴 Explain the difference between the Variable Environment and Lexical Environment inside an execution context.
- 🟡 How does `this` binding get determined during execution context creation?
- 🟢 What is the call stack and how does it grow/shrink as functions call each other?
- 🟡 Explain 'Maximum call stack size exceeded' and demonstrate how unbounded recursion triggers it.
- 🔴 What is tail call optimization? Why isn't it broadly implemented across JS engines despite being in the spec?
- 🔴 Rewrite a recursive factorial function to be tail-call friendly and discuss real-world engine support.
- 🔴 How does async/await interact with the call stack differently from synchronous recursive calls?
- 🟢 Explain how a stack trace helps you debug deep call chains in DevTools.
- 🟡 Explain the JavaScript memory lifecycle: allocation, use, and release.
- 🟡 What are the four common causes of memory leaks in frontend JavaScript applications?
- 🔴 How do detached DOM nodes cause memory leaks, and how would you detect them using Chrome DevTools heap snapshots?
- 🟡 Explain how closures can unintentionally retain large objects in memory.
- 🟡 What is the difference between the stack and the heap for memory allocation in JS?
- 🟡 How do global variables and forgotten timers/intervals contribute to memory leaks in single-page apps?
- 🔴 Explain WeakRef and FinalizationRegistry — what problems do they solve, and why should they be used cautiously?
- 🟡 Explain the mark-and-sweep algorithm used by JS engines for garbage collection.
- 🟡 What is reference counting garbage collection and why does it fail with circular references?
- 🔴 Explain V8's generational garbage collection (young generation / old generation, Scavenger, Mark-Compact).
- 🔴 How does garbage collection affect JS performance, and what strategies help minimize GC pauses in hot code paths?
- 🔴 Explain why object pooling can help reduce garbage collection pressure in performance-critical applications (e.g., games, canvas rendering).

### Async & Concurrency  
<sub>38 questions</sub>

- 🟡 Explain the JavaScript event loop, call stack, task queue, and microtask queue end to end.
- 🟡 Why do Promises (microtasks) always run before `setTimeout` callbacks (macrotasks), even with a 0ms delay?
- 🔴 Trace the exact console.log output order for a mix of synchronous code, `Promise.then`, and `setTimeout`.
- 🔴 Explain how `requestAnimationFrame` and `requestIdleCallback` fit into the browser's rendering pipeline relative to the event loop.
- 🔴 What is 'starvation' of the macrotask queue caused by recursive microtasks? How can it happen?
- 🔴 Explain how Node.js's event loop phases (timers, poll, check, close callbacks) differ from the browser's model.
- 🔴 How does the browser decide when to repaint relative to microtask queue draining?
- 🟢 Explain the evolution of async patterns in JS: callbacks -> Promises -> async/await.
- 🟢 What is 'callback hell' and how do Promises solve it structurally?
- 🟡 Explain concurrency vs parallelism in the context of JavaScript's single-threaded model.
- 🔴 How would you run multiple independent async operations concurrently but limit concurrency to N at a time?
- 🔴 Explain how Web Workers enable true parallelism despite JS being single-threaded.
- 🔴 What are async iterators and async generators? Give a practical use case (e.g., paginated API consumption).
- 🟢 Explain the three states of a Promise and how state transitions are one-way.
- 🔴 Implement a Promise class from scratch (Promises/A+ subset) supporting `.then` chaining.
- 🔴 Implement `Promise.all` from scratch, handling rejection short-circuiting.
- 🔴 Implement `Promise.race`, `Promise.any`, and `Promise.allSettled` from scratch.
- 🟡 Explain the difference between `Promise.all`, `Promise.allSettled`, `Promise.race`, and `Promise.any` with use cases for each.
- 🟡 What is promise chaining and how does returning a value vs a Promise from `.then` affect the chain?
- 🟡 Explain unhandled promise rejections — how do you catch them globally in browsers and Node.js?
- 🟡 Implement a `retry(fn, retries, delay)` utility that retries a Promise-returning function on failure.
- 🔴 Explain microtask ordering when multiple `.then()` handlers are chained versus attached separately to the same promise.
- 🟡 Explain how `async`/`await` desugars to Promises and generators under the hood.
- 🟢 How do you handle errors in `async`/`await` code — `try/catch` vs `.catch()`? Show both.
- 🟡 Why does using `await` inside a `for` loop run operations sequentially, and how would you parallelize them?
- 🟡 Explain what happens if you forget to `await` an async function call — what bugs can result?
- 🔴 Implement a function that processes an array of URLs with `fetch`, limiting concurrency to 3 in-flight requests.
- 🔴 Explain top-level `await` in ES modules — what constraints does it introduce for module loading?
- 🟢 What is a callback function? Distinguish synchronous callbacks (e.g., `Array.map`) from asynchronous ones (e.g., `setTimeout`).
- 🟢 Explain 'callback hell' with a nested example and refactor it using Promises.
- 🟡 What is the error-first callback convention used in Node.js? Why was it adopted?
- 🟡 Implement a simple `EventEmitter` class supporting `on`, `off`, and `emit`.
- 🟡 Explain how converting a callback-based API to a Promise-based one ('promisify') works.
- 🟢 Explain the difference between `setTimeout` and `setInterval`, including drift issues with `setInterval`.
- 🟡 Why is a `setTimeout` with 0ms delay not truly immediate? Explain minimum clamped delays.
- 🟡 Implement a recursive `setTimeout` pattern to replace `setInterval` and explain why it's more reliable.
- 🟡 Implement `debounce` and `throttle` and explain the precise behavioral difference with a UI example (search box vs scroll handler).
- 🔴 How would you implement a countdown timer that stays accurate despite tab throttling in background tabs?

### Networking  
<sub>11 questions</sub>

- 🟡 Explain the `fetch` API's default behavior — why doesn't it reject on HTTP error status codes like 404/500?
- 🟢 Compare `fetch` with the older `XMLHttpRequest` API in terms of ergonomics and capabilities.
- 🟡 Implement a `fetchWithTimeout` utility using `AbortController`.
- 🔴 Explain how to handle streaming responses using the Fetch API's `ReadableStream` body.
- 🔴 Implement retry-with-exponential-backoff logic around a `fetch` call.
- 🟡 How would you upload a file with progress tracking using `fetch` vs `XMLHttpRequest`?
- 🟢 What problem does `AbortController` solve for asynchronous operations in JavaScript?
- 🟡 Implement cancellation of an in-flight `fetch` request when a React component unmounts.
- 🟡 How would you cancel a *previous* search request when a new keystroke fires (race-condition prevention)?
- 🟡 Explain how `AbortSignal.timeout()` simplifies fetch timeout handling compared to manual `setTimeout` + abort.
- 🟡 Can `AbortController` be used to cancel things other than fetch, like custom async tasks? Show an example.

### Language & Tooling  
<sub>13 questions</sub>

- 🟡 Explain the differences between CommonJS (`require`/`module.exports`) and ES Modules (`import`/`export`).
- 🟢 What is the difference between named exports and default exports? What are the trade-offs of each?
- 🟡 Explain dynamic `import()` and a real use case for code-splitting a route-based bundle.
- 🔴 Why are ES module imports hoisted and statically analyzable, unlike CommonJS `require` calls?
- 🔴 Explain circular dependency issues between modules and how each module system handles them differently.
- 🟡 What is tree-shaking, and why does it require ES Modules' static structure to work effectively?
- 🟢 What is a polyfill, and how does it differ from a transpiler like Babel?
- 🟡 Implement a polyfill for `Array.prototype.flat` supporting arbitrary depth.
- 🔴 Implement a polyfill for `Promise.all`.
- 🟡 Implement a polyfill for `Object.assign`.
- 🔴 Implement a polyfill for `Function.prototype.bind`.
- 🟡 Implement a polyfill for `Array.prototype.includes`, correctly handling `NaN`.
- 🟡 How do feature detection and polyfill loading (e.g., polyfill.io style conditional loading) work together for performance?

### Reliability  
<sub>16 questions</sub>

- 🟡 Explain `try/catch/finally` semantics, including what happens if `finally` contains a `return`.
- 🟢 How do you create and throw custom Error subclasses with additional metadata?
- 🟡 Explain the difference between operational errors (expected, e.g., network failure) and programmer errors (bugs).
- 🔴 How would you implement a global error boundary for uncaught exceptions and unhandled promise rejections in a web app?
- 🟡 Explain the `Error.cause` property and how it helps with error chaining/wrapping.
- 🟢 Implement a `safeJsonParse` utility that never throws and returns a Result-like object instead.
- 🟡 Given a snippet with a closure-in-loop bug, identify the root cause and propose two different fixes.
- 🔴 Given a memory-leak-prone component (uncleared interval on unmount), find and fix the leak.
- 🟢 Given code with an off-by-one error in a pagination loop, trace and fix it.
- 🔴 A `fetch` call fires twice due to React StrictMode / re-render; diagnose and fix the race condition.
- 🟡 Given a deeply nested `this` bug inside a class method passed as a callback, diagnose and fix it.
- 🟡 Explain how you'd use `debugger`, breakpoints, watch expressions, and conditional breakpoints in Chrome DevTools to isolate a bug.
- 🔴 Given an app freezing on large datasets, use the Performance tab to identify whether it's a JS bottleneck or layout thrashing.
- 🟡 Diagnose a bug where an array `sort()` unexpectedly mutates a shared reference used elsewhere.
- 🟡 A Promise chain silently swallows an error — identify why and where a `.catch()` is missing.
- 🔴 Given intermittent test failures tied to `Date.now()` or timezones, diagnose flaky-test root causes.

### DOM & Browser  
<sub>23 questions</sub>

- 🟢 What is event delegation and why is it more performant than attaching listeners to every child element?
- 🟡 Explain event bubbling vs event capturing, and how `addEventListener`'s third argument controls this.
- 🟡 Implement event delegation for a dynamically generated list, using `event.target.closest()` to identify the clicked item.
- 🟡 Explain `stopPropagation` vs `stopImmediatePropagation` vs `preventDefault` with examples of when each is needed.
- 🔴 How would you delegate `focus`/`blur` events, which don't bubble by default?
- 🟡 Explain `MutationObserver` and a real use case for observing DOM changes efficiently.
- 🟡 Explain `IntersectionObserver` and how it enables efficient lazy-loading of images without scroll listeners.
- 🟡 Explain `ResizeObserver` and how it differs from listening to the `window.resize` event.
- 🟡 What is the History API (`pushState`/`replaceState`)? How does it power SPA client-side routing?
- 🟢 Explain the Clipboard API and how to implement a secure copy-to-clipboard button.
- 🟡 What is the Page Visibility API and how would you use it to pause expensive work in background tabs?
- 🟢 Explain the difference between the DOM and the HTML source — why is the DOM described as a 'live tree'?
- 🔴 What causes layout thrashing (forced synchronous reflow)? Show a code example and how to fix it by batching reads/writes.
- 🟡 Explain the difference between `innerHTML`, `textContent`, and `innerText`, including security implications.
- 🔴 How would you efficiently insert 10,000 list items into the DOM without freezing the UI (DocumentFragment / virtualization)?
- 🟡 Explain `NodeList` vs `HTMLCollection` — which is live and which is static, and why does it matter?
- 🔴 What is the Shadow DOM and how does it provide style/DOM encapsulation for Web Components?
- 🔴 Explain reflow vs repaint vs composite in the browser rendering pipeline and which CSS/JS changes trigger each.
- 🟢 What is the Browser Object Model (BOM) and how does it differ from the DOM?
- 🟢 Explain the `window` object's role as the global object in browsers.
- 🟡 How would you detect the user's screen size, viewport, and device pixel ratio for responsive JS logic?
- 🟡 Explain `navigator.onLine` and the `online`/`offline` events for building offline-aware UIs.
- 🟡 What is the difference between `location.href`, `location.assign`, and `location.replace` for navigation?

### Concurrency  
<sub>5 questions</sub>

- 🟡 What are Web Workers and how do they provide true parallelism in a single-threaded language?
- 🟡 How do the main thread and a Web Worker communicate? Explain `postMessage` and structured cloning.
- 🔴 Offload a CPU-heavy computation (e.g., image processing) to a Web Worker and explain the trade-offs.
- 🟡 What can and cannot a Web Worker access (DOM, window, fetch, etc.)?
- 🔴 Explain SharedWorker vs dedicated Worker and use cases for sharing state across multiple tabs.

### PWA  
<sub>5 questions</sub>

- 🟡 What is a Service Worker and how does its lifecycle (install, activate, fetch) work?
- 🔴 Explain the Cache API and how a Service Worker implements offline-first caching strategies (cache-first, network-first, stale-while-revalidate).
- 🔴 How does a Service Worker enable Push Notifications and Background Sync?
- 🔴 Explain the scope of a Service Worker and common pitfalls when updating a deployed Service Worker.
- 🔴 Write a basic Service Worker `fetch` handler implementing a stale-while-revalidate strategy.

### Storage  
<sub>19 questions</sub>

- 🟢 Explain `localStorage` — its capacity, synchronous nature, and same-origin scoping.
- 🟡 Why should you avoid storing sensitive data like JWTs in `localStorage`? Explain the XSS risk.
- 🟡 How would you build a typed wrapper around `localStorage` that handles JSON serialization and quota errors safely?
- 🔴 Explain the `storage` event — how can you sync state across multiple browser tabs using `localStorage`?
- 🟡 What happens when `localStorage.setItem` exceeds the quota? How should you handle `QuotaExceededError`?
- 🟢 Explain how `sessionStorage` differs from `localStorage` in lifetime and scope (per-tab vs per-origin).
- 🟡 Does `sessionStorage` persist across a page refresh? Across opening a new tab to the same URL? Explain why.
- 🟢 Give a real use case where `sessionStorage` is preferable to `localStorage` (e.g., a multi-step form wizard).
- 🟡 How would you persist and restore scroll position per-tab using `sessionStorage`?
- 🟡 Explain `HttpOnly`, `Secure`, and `SameSite` cookie attributes and what security threats each mitigates.
- 🟡 Compare cookies, localStorage, and sessionStorage in terms of size limits, expiry, and being sent with HTTP requests.
- 🟡 Why can JavaScript not read an `HttpOnly` cookie, and why is that a deliberate security feature against XSS?
- 🔴 Explain `SameSite=Strict` vs `Lax` vs `None` and their role in CSRF mitigation.
- 🟢 Implement a small utility to get, set, and delete a cookie using `document.cookie`.
- 🟡 What is IndexedDB and when would you choose it over localStorage for a frontend application?
- 🔴 Explain object stores, indexes, and transactions in IndexedDB.
- 🟡 Why is the native IndexedDB API callback/event-based, and how do libraries like `idb` wrap it in Promises?
- 🔴 Design an offline-first data layer for a note-taking app using IndexedDB with background sync to a server.
- 🔴 Explain versioning in IndexedDB (`onupgradeneeded`) and how schema migrations are handled.

### Performance  
<sub>8 questions</sub>

- 🟡 Explain the Core Web Vitals: LCP, INP (replacing FID), and CLS — what do they measure and how do you improve each?
- 🟡 What is code splitting and how does dynamic `import()` combined with a bundler reduce initial bundle size?
- 🟡 Explain debouncing and throttling as performance techniques for scroll/resize/input event handlers.
- 🔴 How would you profile a janky animation using Chrome DevTools' Performance panel to find the bottleneck?
- 🔴 Explain virtualization/windowing (e.g., react-window) for rendering large lists performantly.
- 🟡 What is tree-shaking and how do ES Modules and bundler configuration affect how much dead code gets eliminated?
- 🟡 Explain memoization at the component level (e.g., `React.memo`, `useMemo`) versus function-level memoization.
- 🔴 How do you measure and reduce Time to Interactive (TTI) and Total Blocking Time (TBT) on a JS-heavy page?

### Architecture  
<sub>8 questions</sub>

- 🟢 Explain the Module pattern and how it provides encapsulation using closures/IIFEs.
- 🟡 Implement the Singleton pattern in JavaScript and discuss whether it's an anti-pattern in modern module systems.
- 🟡 Implement the Observer pattern (Pub/Sub) from scratch with `subscribe`, `unsubscribe`, and `publish`.
- 🟡 Explain the Factory pattern and give a frontend use case (e.g., creating different UI components based on config).
- 🟡 Explain the Decorator pattern and how higher-order components/functions implement it in JS/React.
- 🔴 Implement a simple state machine pattern for managing UI states (idle/loading/success/error).
- 🟡 Explain the Strategy pattern and how it helps avoid large conditional blocks for interchangeable algorithms.
- 🔴 Explain the Proxy pattern using JavaScript's native `Proxy` object with a validation use case.

### Machine Coding  
<sub>27 questions</sub>

- 🟡 Design and implement an EventEmitter class with `on`, `once`, `off`, and `emit` methods.
- 🔴 Implement an LRU Cache with O(1) get/put using a Map and doubly linked list.
- 🔴 Implement a deep clone utility handling nested objects, arrays, dates, and circular references.
- 🔴 Implement a mini Promise library supporting `then`, `catch`, `finally`, and static `all`/`race`.
- 🔴 Implement a basic reactive Observable class with `subscribe` and `unsubscribe`.
- 🟡 Implement `debounce` with a `cancel` and `flush` method (lodash-style).
- 🟡 Implement `throttle` with leading/trailing edge options.
- 🔴 Implement a simple `curry` function that works for any function arity.
- 🟡 Implement `compose` and `pipe` functional utilities.
- 🔴 Implement a `memoize` function supporting a custom key resolver.
- 🟡 Implement `deepEqual(a, b)` for deep structural comparison of two values.
- 🟡 Implement a custom `EventTarget`-like pub/sub bus usable across unrelated modules.
- 🔴 Implement retry logic with exponential backoff for a flaky async operation.
- 🔴 Implement a task scheduler that runs a queue of async tasks with a concurrency limit.
- 🔴 Implement a rate limiter (token bucket algorithm) for limiting API calls per second.
- 🔴 Implement a Virtual DOM diffing algorithm (simplified) that produces a patch list between two trees.
- 🔴 Implement an infinite scroll component that fetches more data as the user approaches the bottom.
- 🔴 Implement a typeahead/autocomplete component with debounced search and request cancellation.
- 🔴 Implement a Redux-lite store: `getState`, `dispatch`, `subscribe`, with a reducer function.
- 🔴 Implement a circuit breaker pattern wrapping a flaky remote call (closed/open/half-open states).
- 🟡 Implement a simple client-side templating engine that interpolates `{{variables}}` into a string.
- 🔴 Implement a deep-diff utility that outputs the set of changed paths between two objects.
- 🟡 Implement `Array.prototype.map/filter/reduce` from scratch as a polyfill suite.
- 🔴 Implement a minimal signal-based reactive system using `Proxy` (get/set trap dependency tracking).
- 🔴 Implement a drag-and-drop sortable list using native HTML5 drag events (no libraries).
- 🔴 Implement a promise pool utility `promiseAllLimit(tasks, limit)` capping concurrent execution.
- 🟡 Implement a cache with TTL-based expiry supporting `get`, `set`, and lazy eviction.

### DSA in JS  
<sub>25 questions</sub>

- 🟢 Two Sum: find indices of two numbers in an array that add up to a target, in O(n) using a hash map.
- 🟢 Valid Parentheses: determine if a string of brackets is balanced using a stack.
- 🟢 Merge Two Sorted Arrays/Lists in-place or into a new sorted structure.
- 🟡 Group Anagrams: group an array of strings into anagram clusters.
- 🟡 Longest Substring Without Repeating Characters using the sliding window technique.
- 🟢 Implement a binary search and explain its invariants and edge cases (off-by-one errors).
- 🟡 Detect a cycle in a linked list using Floyd's Tortoise and Hare algorithm.
- 🟡 Find the kth largest element in an array using a heap or quickselect.
- 🔴 Implement a trie (prefix tree) supporting insert, search, and startsWith.
- 🟡 Flatten a nested array (arbitrary depth) both iteratively and recursively.
- 🟡 Number of Islands: count connected components in a 2D grid using BFS/DFS.
- 🔴 Implement a debounced binary search suggestion box combining DSA + async concepts.
- 🟢 Find the longest common prefix among an array of strings.
- 🟢 Climbing Stairs / Fibonacci-style DP: count distinct ways to reach the top, with memoization.
- 🟡 Implement quicksort or mergesort from scratch and analyze time/space complexity.
- 🟡 Word Break: determine if a string can be segmented into dictionary words using DP.
- 🟡 Find all subsets (power set) of a given array using backtracking.
- 🔴 Implement a min-heap from scratch supporting insert and extract-min.
- 🔴 LRU Cache design and implementation combining Map + doubly linked list.
- 🟡 Product of Array Except Self without using division.
- 🔴 Implement a rate-limited queue processor respecting a max-requests-per-second constraint.
- 🔴 Serialize and deserialize a binary tree.
- 🔴 Find the median of two sorted arrays in better than O(n) time.
- 🔴 Implement a basic calculator that evaluates a string math expression with +,-,*,/ and parentheses.
- 🟡 Top K Frequent Elements using a hashmap and heap/bucket sort.

### Advanced Language Features  
<sub>6 questions</sub>

- 🟡 What is a `Proxy` and what traps does it support (get, set, has, deleteProperty, apply, construct)?
- 🔴 Implement a validation layer for an object using a `Proxy`'s `set` trap (e.g., reject invalid types).
- 🔴 Explain how `Reflect` methods mirror `Proxy` traps and why they're used together.
- 🔴 Implement a simple reactivity system (like Vue 3's) using `Proxy` to track property access and mutation.
- 🔴 What are the limitations of `Proxy` (e.g., cannot be fully polyfilled, invariant violations)?
- 🟡 Implement a negative-array-index accessor (Python-style `arr[-1]`) using a `Proxy`.

### Modern Browser APIs  
<sub>8 questions</sub>

- 🔴 Explain the Streams API (`ReadableStream`/`WritableStream`/`TransformStream`) and a use case for processing large downloads incrementally.
- 🟡 How do you establish and maintain a WebSocket connection, including handling reconnection with backoff?
- 🔴 At a conceptual level, explain how WebRTC peer connections are established via signaling and ICE candidates.
- 🔴 What problem does `SharedArrayBuffer` + `Atomics` solve for cross-thread communication with Web Workers?
- 🟡 Explain the Temporal API's goals and why it aims to replace the legacy `Date` object.
- 🟢 How does `Intl.NumberFormat` and `Intl.DateTimeFormat` simplify locale-aware formatting versus manual string building?
- 🔴 Explain the lifecycle of a Custom Element (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`).
- 🟡 What is the Permissions API and how would you gracefully handle a denied camera/microphone permission?

### Type Systems  
<sub>7 questions</sub>

- 🟡 Explain structural typing in TypeScript versus nominal typing — why can two unrelated interfaces be compatible?
- 🟢 What is the difference between `interface` and `type` aliases, and when would you prefer one over the other?
- 🟡 Explain generics with a practical example (e.g., a generic `useFetch<T>` hook return type).
- 🟡 What are union and intersection types, and how does TypeScript narrow union types via type guards?
- 🟡 Explain utility types like `Partial`, `Pick`, `Omit`, and `Record`, with when you'd use each.
- 🟡 What is the difference between `any`, `unknown`, and `never`, and why is `unknown` safer than `any`?
- 🔴 Explain how TypeScript's structural typing interacts with excess property checks on object literals.

### Quality Engineering  
<sub>7 questions</sub>

- 🟢 Explain the testing pyramid (unit, integration, e2e) and where frontend component tests fit.
- 🟡 What is the difference between a mock, a stub, and a spy? Give a Jest example of each.
- 🟡 Explain React Testing Library's guiding principle of querying by accessibility roles rather than implementation details.
- 🟡 How would you test a component that makes an async `fetch` call, mocking the network layer?
- 🟡 Explain Jest snapshot testing — what are its pitfalls, and when does it provide false confidence?
- 🟡 How do you test a custom React hook in isolation using `renderHook`?
- 🔴 Explain test flakiness caused by relying on real timers, and how `jest.useFakeTimers()` helps.

### System Design  
<sub>7 questions</sub>

- 🔴 Design a client-side infinite-scrolling news feed: discuss data fetching, caching, virtualization, and de-duplication.
- 🔴 Design an autocomplete/typeahead component at scale: debouncing, caching, request cancellation, and ranking.
- 🔴 Design a real-time notification system in the browser: WebSockets vs SSE vs polling trade-offs.
- 🔴 Design the frontend architecture for a collaborative document editor (like Google Docs): conflict resolution, offline edits, syncing.
- 🔴 Design a micro-frontend architecture for a large e-commerce site: module federation, shared state, and independent deployability.
- 🟡 Design an image-heavy gallery page optimized for Core Web Vitals: lazy loading, responsive images, and CLS prevention.
- 🔴 Design a client-side state management approach for a large dashboard app with many independent widgets.

### Security  
<sub>7 questions</sub>

- 🟡 Explain Cross-Site Scripting (XSS) — stored, reflected, and DOM-based — and how to prevent each in a JS app.
- 🟡 Explain Cross-Site Request Forgery (CSRF) and how SameSite cookies and CSRF tokens mitigate it.
- 🔴 What is Content Security Policy (CSP) and how do you configure it to block inline script injection?
- 🔴 Explain prototype pollution vulnerabilities in JS — how can merging untrusted objects corrupt `Object.prototype`?
- 🟡 What is Subresource Integrity (SRI) and how does it protect against compromised third-party CDN scripts?
- 🟡 Explain CORS from the browser's perspective — preflight requests, allowed headers, and credentialed requests.
- 🔴 What are Trusted Types and how do they help prevent DOM-based XSS at the browser API level?

### Company Specific  
<sub>159 questions</sub>

- 🟡 Implement a debounce function and explain how Google-scale search-as-you-type UIs use it.
- 🔴 Explain how you'd architect a client-side module system for a very large monorepo web app.
- 🟡 Implement a function to flatten a deeply nested array without recursion (using a stack).
- 🔴 Explain the Event Loop and predict output for a mixed Promise/setTimeout snippet.
- 🔴 Design a client-side caching layer for an API-heavy dashboard, including cache invalidation strategy.
- 🔴 Implement a Trie and use it to power an autocomplete suggestion engine.
- 🟡 Explain how you'd optimize a page for Largest Contentful Paint (LCP) on a slow 3G connection.
- 🟡 Write a polyfill for `Array.prototype.reduce`.
- 🔴 Explain trade-offs between client-side rendering and server-side rendering for a search-results page.
- 🟡 Behavioral: Tell me about a time you had to make a difficult trade-off between shipping speed and code quality.
- 🔴 Explain how React's reconciliation algorithm (Fiber) relates to plain JS closures and the call stack.
- 🔴 Implement a simplified Virtual DOM diffing function for a list of keyed elements.
- 🔴 Design the data-fetching and caching layer for a social media feed with infinite scroll.
- 🟡 Implement `useDebounce` and `useThrottle` custom hooks.
- 🔴 Explain how you'd detect and fix a memory leak in a single-page app with long user sessions.
- 🟡 Implement a function to deep-compare two React props objects for a custom `shouldComponentUpdate`.
- 🔴 Explain closures in the context of React hooks — what is a 'stale closure' bug?
- 🟡 Design a notifications badge/counter system that stays in sync across multiple open tabs.
- 🔴 Implement an LRU cache to back an image-preview cache in a photo-sharing feed.
- 🟡 Behavioral: Describe a time you influenced a technical decision across multiple teams.
- 🔴 Implement a rate limiter to throttle checkout API calls during a flash sale.
- 🔴 Design the frontend architecture for a product listing page handling millions of SKUs with filters.
- 🔴 Implement a retry-with-backoff utility for flaky payment API calls.
- 🟡 Explain how you'd implement client-side A/B testing without harming Core Web Vitals.
- 🟡 Write an algorithm to find the top K best-selling products from a large in-memory array.
- 🔴 Explain your approach to debugging a checkout flow that intermittently double-submits orders.
- 🟡 Implement a shopping cart's quantity debounced update, batching rapid clicks into a single API call.
- 🔴 Design an offline-tolerant cart that syncs to the server once connectivity is restored.
- 🟡 Leadership Principle style: Tell me about a time you disagreed with a decision but committed to it anyway.
- 🔴 Explain how you'd instrument frontend performance metrics (RUM) at Amazon's scale.
- 🟢 Explain the differences between `var`, `let`, and `const` and how TypeScript (used heavily at Microsoft) builds on top of them.
- 🔴 Design a plugin/extension architecture (similar to VS Code extensions) using an event-driven pub/sub model.
- 🔴 Explain how Web Workers could be used to keep a rich text editor (like Word Online) responsive during spellcheck.
- 🔴 Implement a deep-diff algorithm to support real-time collaborative editing conflict detection.
- 🟡 Explain accessibility (ARIA roles, focus management) considerations for a custom dropdown component.
- 🔴 Debug a scenario where IndexedDB writes silently fail in a PWA offline mode.
- 🟢 Implement a memoized Fibonacci function and discuss space/time trade-offs.
- 🟡 Explain how you would design telemetry collection in the browser without blocking the main thread.
- 🟡 Behavioral: Describe how you handled ambiguous requirements on a cross-team project.
- 🔴 Design a client-side video player state machine (buffering, playing, paused, error, ended).
- 🟡 Explain how you'd implement adaptive prefetching of the next episode's metadata using IntersectionObserver.
- 🔴 Implement a circuit breaker for a flaky recommendations API call.
- 🔴 Explain how Netflix-style A/B testing frameworks might hook into a JS rendering pipeline at the edge.
- 🔴 Debug a memory leak in a long-running single-page app that never navigates away (like a TV app).
- 🔴 Implement a virtualized horizontally-scrolling row of movie posters ('infinite carousel').
- 🔴 Explain how Service Workers could support offline playback queuing of downloaded content.
- 🟡 Implement a throttled analytics-beacon sender batching UI interaction events.
- 🔴 Explain trade-offs of client-side vs server-side rendering for a content-browsing homepage.
- 🟡 Behavioral: Tell me about a time you had to make a decision with incomplete data.
- 🔴 Design a real-time driver-location-tracking UI using WebSockets, including reconnection handling.
- 🟡 Implement a debounce/throttle hybrid for map drag-to-search 'search this area' functionality.
- 🔴 Explain how you'd batch and deduplicate rapid location updates before rendering on a map.
- 🔴 Design an offline-tolerant ride-request flow for spotty network conditions (e.g., underground).
- 🔴 Implement a rate limiter for a surge-pricing polling mechanism.
- 🔴 Debug a race condition where a cancelled ride request UI still shows as 'in progress'.
- 🟡 Explain how you would keep a live ETA counter accurate and performant using timers.
- 🔴 Design a micro-frontend split between the Rider app and Driver app shared component library.
- 🟡 Implement geofencing logic client-side to detect when a device enters/exits a zone from coordinate updates.
- 🟡 Behavioral: Describe a high-pressure production incident you helped resolve.
- 🔴 Design a search-results page with filters, pagination, and URL-synced state.
- 🟡 Implement an image lazy-loading gallery using IntersectionObserver for listing photos.
- 🟡 Explain how you'd design a date-range picker component's internal state management.
- 🔴 Implement debounced address autocomplete with request cancellation on fast typing.
- 🟡 Design a booking flow that must survive a page refresh mid-checkout (persist to storage).
- 🔴 Debug a hydration mismatch bug between server-rendered and client-rendered listing prices.
- 🟡 Explain how you'd internationalize currency and date formatting using the Intl API.
- 🟡 Implement a rating/review star component supporting keyboard accessibility.
- 🟡 Explain a caching strategy for host-listing data that's viewed repeatedly but changes infrequently.
- 🟡 Behavioral: Tell me about a time you advocated for the user during a product trade-off discussion.
- 🔴 Explain how you would build a secure payment form that isolates card data using iframes (Stripe Elements style).
- 🔴 Implement idempotency-key generation client-side to prevent duplicate payment submissions.
- 🔴 Explain CSP configuration needed to safely embed a third-party payment iframe.
- 🔴 Implement retry-with-backoff for a webhook-status polling mechanism.
- 🔴 Design client-side validation for a credit card form (Luhn check, expiry, CVC) without leaking full PANs to JS memory longer than needed.
- 🟡 Debug a race condition where double-clicking 'Pay Now' triggers two charge requests.
- 🟡 Explain how you'd design error handling and user messaging for declined-card scenarios across locales.
- 🟡 Implement a masked input component for credit card number formatting as the user types.
- 🔴 Explain SameSite cookie considerations for a payment flow embedded cross-origin.
- 🟡 Behavioral: Tell me about a time correctness/security trumped shipping speed for you.
- 🔴 Design a browser-based canvas editor's undo/redo stack (command pattern).
- 🟡 Implement a debounced auto-save feature for a design document editor.
- 🔴 Explain how Web Workers could offload heavy image-filter computations off the main thread.
- 🟡 Implement a color-picker component with keyboard accessibility and ARIA live region updates.
- 🔴 Explain memory management concerns when working with large `ArrayBuffer`/`ImageData` objects in a browser editor.
- 🔴 Design a plugin architecture for third-party filters/extensions in a web-based creative tool.
- 🔴 Debug a canvas rendering performance issue during rapid brush-stroke input.
- 🟡 Implement a deep-clone utility preserving `ArrayBuffer` data for a document 'duplicate' feature.
- 🔴 Explain how you'd implement collaborative cursors (multiple users editing) using WebSockets.
- 🟡 Behavioral: Describe a time you balanced creative/design constraints with engineering feasibility.
- 🔴 Design a Kanban board's drag-and-drop reordering logic and optimistic UI updates.
- 🔴 Implement optimistic updates with rollback-on-failure for a task status change.
- 🔴 Explain how you'd architect a plugin/marketplace system (like Jira/Confluence apps) using iframes or Web Components.
- 🔴 Implement a real-time collaborative comment thread using WebSockets with conflict handling.
- 🔴 Debug stale UI state after a background sync updates a ticket another user is viewing.
- 🟡 Explain how you'd implement keyboard shortcuts globally without conflicting with browser defaults.
- 🟡 Design a notification/activity feed with read/unread state synced across devices.
- 🟡 Implement a rich-text editor's mention (`@user`) autocomplete dropdown.
- 🟡 Explain your approach to feature-flagging a risky UI change safely across teams.
- 🟡 Behavioral: Tell me about a time you had to push back on scope creep near a deadline.
- 🔴 Explain performance-first principles you'd apply building a JS web app that must feel 'native' on iOS Safari.
- 🔴 Implement smooth 60fps scroll-linked animations using `requestAnimationFrame`.
- 🟡 Explain accessibility (VoiceOver) considerations for custom interactive components.
- 🔴 Debug jank caused by layout thrashing during a scroll event handler.
- 🔴 Design a media-heavy product page (like apple.com) optimized for LCP and CLS.
- 🟡 Implement lazy-loading of below-the-fold `<video>` content with autoplay-on-visibility.
- 🔴 Explain how you'd detect and gracefully handle Safari-specific API differences (e.g., IndexedDB quirks).
- 🔴 Implement a pinch-to-zoom / gesture handler using pointer events.
- 🟡 Explain privacy-conscious analytics design (minimal data collection) for a client-side tracker.
- 🟡 Behavioral: Describe your attention to detail on a pixel-perfect UI implementation.
- 🔴 Design a live order-tracking map UI with WebSocket-driven courier location updates.
- 🟡 Implement a debounced restaurant-search-as-you-type with cancellation of stale requests.
- 🟡 Explain how you'd cache and invalidate a restaurant menu that changes infrequently but must reflect live item availability.
- 🔴 Debug a race condition between 'add to cart' clicks and a menu refresh overwriting cart state.
- 🔴 Implement a retry mechanism for order-status polling with exponential backoff.
- 🔴 Design an offline-tolerant checkout that queues an order if connectivity briefly drops.
- 🟡 Explain how you'd batch multiple rapid quantity-stepper clicks into a single cart-update API call.
- 🟡 Implement a countdown ETA timer synced against server time rather than client clock drift.
- 🟡 Explain performance considerations for rendering a long, filterable restaurant list.
- 🟡 Behavioral: Tell me about a time you shipped an MVP under time pressure and what you'd improve later.
- 🔴 Design an infinite-scrolling professional feed with ad-slot injection at intervals.
- 🟡 Implement a 'seen/unseen' notification badge synced across tabs using the storage event.
- 🟡 Explain how you'd implement a mentions/hashtag autocomplete in a post-composer textbox.
- 🟡 Debug duplicate analytics events firing due to an event listener attached multiple times.
- 🔴 Design a connections-graph visualization that stays performant with thousands of nodes.
- 🟡 Implement lazy-loaded profile images with a blurred low-res placeholder (LQIP pattern).
- 🟡 Explain how you'd throttle 'typing indicator' events in a messaging feature.
- 🟡 Design client-side rate limiting for connection-request spam prevention.
- 🟡 Explain accessibility considerations for an infinite feed for screen-reader users.
- 🟡 Behavioral: Describe a time you mentored a junior engineer through a difficult bug.
- 🔴 Design a masonry-grid image layout that virtualizes off-screen pins for performance.
- 🟡 Implement lazy-loading and blur-up placeholders for a pin image grid.
- 🟡 Explain how you'd debounce and batch 'save pin' clicks to avoid duplicate API writes.
- 🔴 Design infinite scroll with dynamic re-layout as new image dimensions load in.
- 🟡 Debug Cumulative Layout Shift caused by images without explicit width/height loading late.
- 🔴 Implement client-side image dominant-color extraction for placeholder backgrounds using Canvas.
- 🟡 Explain caching strategy for a personalized recommendation feed that updates periodically.
- 🟡 Implement a search-and-filter combo (boards + pins) with combined debounced queries.
- 🔴 Explain how Service Workers could support an offline 'saved pins' view.
- 🟡 Behavioral: Tell me about a time you improved a metric (engagement/performance) with a frontend change.
- 🔴 Design a browser-based design canvas's layer/z-index management system.
- 🔴 Implement undo/redo for a design editor using the command pattern with a history stack.
- 🔴 Explain how you'd offload expensive image filter rendering to a Web Worker without blocking drag interactions.
- 🔴 Implement snapping/alignment guide logic when dragging design elements near each other.
- 🔴 Debug a performance regression when rendering hundreds of draggable elements on a canvas.
- 🔴 Explain real-time collaborative editing conflict resolution for two users moving the same element.
- 🟡 Implement a debounced auto-save for a design project to avoid excessive network writes.
- 🟡 Explain accessibility trade-offs in a highly visual, drag-and-drop-centric editor.
- 🟡 Implement export-to-image functionality using the Canvas API's `toBlob`/`toDataURL`.
- 🟡 Behavioral: Tell me about a time you simplified a complex UI interaction based on user feedback.
- 🔴 Implement a streaming UI that renders tokens from a server-sent event / ReadableStream response incrementally.
- 🟡 Explain how you'd cancel an in-flight streaming completion request cleanly using AbortController.
- 🔴 Design a chat interface's message list virtualization for very long conversations.
- 🔴 Implement client-side rate limiting/backoff for a chat app hitting API rate limits.
- 🟡 Explain how you'd debounce 'typing...' indicator broadcasts in a multi-user chat.
- 🔴 Debug a race condition where a regenerated response overlaps with a still-streaming previous response.
- 🟡 Design optimistic UI updates for sending a chat message before server confirmation.
- 🔴 Implement markdown-to-DOM incremental rendering as streamed text arrives, safely avoiding XSS.
- 🔴 Explain how Web Workers could tokenize/highlight code blocks without blocking the main thread during streaming.
- 🟡 Behavioral: Tell me about a time you had to design UI for a fundamentally new kind of interaction pattern.

---

_Sourced & de-duplicated from interview-prep sheets. Found a duplicate or error? [Open a PR](../CONTRIBUTING.md)._
