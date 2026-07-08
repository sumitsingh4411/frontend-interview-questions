<div align="center">

# Engine Internals

<sub>⚡ JavaScript · **25 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

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

---

_Part of the [⚡ JavaScript question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
