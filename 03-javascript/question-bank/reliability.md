<div align="center">

# Reliability

<sub>⚡ JavaScript · **16 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

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

---

_Part of the [⚡ JavaScript question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
