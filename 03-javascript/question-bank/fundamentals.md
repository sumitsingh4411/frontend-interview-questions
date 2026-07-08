<div align="center">

# Fundamentals

<sub>⚡ JavaScript · **44 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

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

---

_Part of the [⚡ JavaScript question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
