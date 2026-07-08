<div align="center">

# Async & Concurrency

<sub>⚡ JavaScript · **38 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

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

---

_Part of the [⚡ JavaScript question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
