<div align="center">

# Optional chaining & nullish coalescing

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 20m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `?.` short-circuits to `undefined` the instant a reference is null/undefined instead of throwing; `??` supplies a fallback **only** for null/undefined — unlike `||`, which also fires on `0`, `''`, `false`, and `NaN`. Together they retire the `a && a.b && a.b.c` dance and the classic `x || default` bug.

---

## 🧠 Mental model

Both operators hinge on one predicate: **"is this value null or undefined?"** (nullish — exactly two values). `?.` guards *access*; `??` guards *value*. The distinction that separates a senior answer: `||` tests *falsy*, `??` tests *nullish*. `0` and `''` are falsy but **not** nullish — so `||` silently discards legitimate values that `??` correctly keeps.

## ⚙️ How it actually works

`a?.b` evaluates `a`; if it's null or undefined the **entire rest of the chain short-circuits** to `undefined` — `a?.b.c.d` won't throw even though `.c.d` follow, because everything after `?.` is skipped. It has three forms: `a?.b`, `a?.[expr]`, and `a?.()` (call only if the reference exists). `??` returns its right operand only when the left is nullish.

You **cannot** combine `??` with `||` or `&&` without parentheses — `a ?? b || c` is a deliberate SyntaxError, forcing you to make precedence explicit. And `?.` is read/call-only; it can't appear on the left of an assignment.

## 💻 Code

```js
user?.profile?.avatar?.url;   // undefined if any link is nullish — no throw
arr?.[0];                     // safe dynamic access
onChange?.(value);            // call only if the callback was provided

config.timeout ?? 3000;       // 3000 only when timeout is null/undefined
```

The bug `||` hides:

```js
// ❌ 0 is falsy, so a valid port of 0 gets overwritten
const port = config.port || 8080;   // config.port === 0  →  8080

// ✅ nullish keeps the legitimate 0
const port2 = config.port ?? 8080;  // config.port === 0  →  0
```

Guard a method call correctly:

```js
obj.method?.();   // ✅ skips if `method` is missing/undefined
obj?.method();    // ⚠️ guards `obj`, but throws if obj exists and method is undefined
```

## ⚖️ Trade-offs

- **`?.` is right for genuinely optional data** — API payloads, optional callbacks, feature-flagged fields. It's wrong as a blanket habit: chaining `?.` through data that *should* always exist masks a real null, converting a loud, local crash into a silent `undefined` that blows up somewhere far away and harder to trace.
- **`??` should replace `||` for defaults** whenever `0`, `''`, or `false` are valid inputs — which is most of the time.
- **Negligible cost**, but `?.` can slightly perturb engine optimisation in hot loops; almost never worth worrying about.

## 💣 Gotchas interviewers probe

- **`||` vs `??`** — the most-probed detail. `count || 10` is a bug when `0` is legitimate.
- **`?.` short-circuits the *whole* remaining chain**, not a single step — `a?.b.c` is fully safe.
- **`??` can't mix with `||`/`&&` unparenthesized** — `a ?? b || c` throws at parse time by design.
- **`?.` guards only the reference before it.** `obj?.method()` still throws if `obj` exists but `method` is `undefined`; use `obj.method?.()`.
- **`?.` only tests null/undefined**, not "is it the right type" — it won't save you from calling a number as a function.
- **It doesn't rescue undeclared identifiers** — `notDeclared?.x` still throws a ReferenceError.
- **`delete a?.b`** is legal and short-circuits, but `a?.b = 1` is a SyntaxError.

## 🎯 Say this in the interview

> "Both operators key off the same idea — is a value null or undefined. Optional chaining guards access: `a?.b` returns `undefined` the moment `a` is nullish and short-circuits the entire rest of the chain, so I don't need the old `a && a.b && a.b.c` ladder. Nullish coalescing guards values: `x ?? fallback` only substitutes when `x` is null or undefined. The key difference from `||` is that `||` uses falsiness, so it wrongly replaces `0`, empty string, and false — the classic bug is `config.port || 8080` clobbering a valid port of zero, where `??` keeps it. I lean on `?.` for genuinely optional data, but I'm careful not to sprinkle it over data that should always exist, because that hides real nulls and turns a crash into a silent failure downstream."

## 🔗 Go deeper

- [MDN — Optional chaining (`?.`)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining) — all three forms and short-circuit rules.
- [MDN — Nullish coalescing (`??`)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing) — including the no-mixing-with-`||` rule.
- [javascript.info — Optional chaining](https://javascript.info/optional-chaining) — practical patterns and the "don't overuse" guidance.
