<div align="center">

# `var` / `let` / `const`, scope, hoisting, TDZ

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 45m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — All declarations are hoisted; the difference is what they're **initialised to**. `var` is initialised to `undefined` at scope entry, `function` to the whole function, and `let`/`const` to *nothing at all* — which is what the Temporal Dead Zone is.

---

## 🧠 Mental model

Stop thinking of hoisting as "code moves to the top". Nothing moves. When the engine enters a scope it **creates the environment record first**, binding every declared name *before* a single statement runs. Hoisting is just the observable side-effect of that setup pass.

The only question that matters is: **what is the binding's value between scope entry and the line that declares it?**

| Declaration | Hoisted? | Value before its line | Scope |
|---|---|---|---|
| `var x` | yes | `undefined` | function |
| `function f(){}` | yes | the full function | block (in strict mode) |
| `let x` / `class X` | yes | **uninitialised → throws** | block |
| `const x` | yes | **uninitialised → throws** | block |

So `let` *is* hoisted. Anyone who tells you "`let` isn't hoisted" is describing the symptom, not the mechanism — and an interviewer who knows the spec will notice.

## ⚙️ How it actually works

Every scope has an **Environment Record** — a map of names to binding slots. On entry:

1. `var` and function declarations are **instantiated and initialised** (`undefined` / the function object). This is why `var` reads don't throw.
2. `let`, `const` and `class` are **instantiated but left uninitialised**. The slot exists, but it's marked "not yet initialised".
3. Execution begins. Touching an uninitialised slot throws `ReferenceError: Cannot access 'x' before initialization`.

That window — slot exists, but reading it throws — is the **Temporal Dead Zone**. It's *temporal*, not spatial: it's about time-of-execution, not position in the file.

```js
function f() {
  console.log(x); // ReferenceError — TDZ, NOT "undefined"
  let x = 1;
}
```

The TDZ is deliberate. If `let` defaulted to `undefined`, `const` would have to be assignable once at declaration and `undefined` before it — making `const` observably mutable. The TDZ is the price of making `const` mean something.

**Crucially, the binding is created — so it shadows outer scopes even inside the TDZ:**

```js
let y = 'outer';
{
  console.log(y); // ReferenceError — NOT 'outer'
  let y = 'inner';
}
```

That example is the single fastest way to prove you understand the mechanism rather than the folklore.

**`const` is not immutability.** It freezes the *binding*, not the value. `const a = []; a.push(1)` is fine. Only reassignment (`a = []`) throws.

## 💻 Code

The classic loop question — and *why* it behaves that way:

```js
// ❌ `var` has ONE binding for the whole function. All three closures share it.
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 3 3 3

// ✅ `let` gets a FRESH binding PER ITERATION, copied forward each step.
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i)); // 0 1 2
```

The `let` version isn't magic scoping — the spec literally performs `CreatePerIterationEnvironment`, copying the value into a new binding each turn. That's why `for (const i = 0; ...)` throws on increment but `for (const x of arr)` is fine: `for...of` creates a new binding per iteration and never increments it.

Redeclaration rules, which output questions love:

```js
var a = 1; var a = 2;   // ✅ fine
let b = 1; let b = 2;   // ❌ SyntaxError — thrown at PARSE time, before ANY code runs
const c;                // ❌ SyntaxError — const must be initialised
```

Note that `SyntaxError` means the *entire script/module fails to run* — not that it fails at that line.

## ⚖️ Trade-offs

- **Default to `const`, use `let` when you must reassign, never use `var`.** Not dogma: `const` communicates "this name never changes", which is real information for the next reader and lets engines and linters reason more tightly.
- **The one honest argument for `var`** is function-scoped hoisting for a variable assigned in a `try` and read after it. The right answer there is to restructure, not reach for `var`.
- **Block scoping costs nothing at runtime** — engines resolve most bindings statically. Don't micro-optimise this.
- **`var` isn't a bug, it's a legacy design** where function was the only scope unit. Understand it because you'll read old code and be asked about it, not because you'll write it.

## 💣 Gotchas interviewers probe

- **"Is `let` hoisted?"** — The trap answer is "no". The correct answer: *yes, but uninitialised*, which is the TDZ. This is the single most common gotcha in this topic.
- **TDZ shadows the outer scope.** `let y='outer'; { console.log(y); let y; }` throws — it does not print `'outer'`.
- **`typeof` is not safe anymore.** `typeof undeclared` → `"undefined"`, but `typeof x` inside `x`'s TDZ **throws**. The one guaranteed-safe `typeof` was quietly broken by ES6, on purpose.
- **`const` ≠ frozen.** Objects behind a `const` are fully mutable. Reach for `Object.freeze()` (shallow!) if you actually mean immutable.
- **Function declarations in blocks** are block-scoped in strict mode/modules, but legacy web semantics hoist them to the function scope in sloppy mode. Use `const fn = () => {}` and the ambiguity disappears.
- **`var` at top level of a script creates a property on `globalThis`; `let`/`const` do not.** `var g=1; globalThis.g // 1` vs `let g=1; globalThis.g // undefined`.
- **Redeclaration errors are `SyntaxError`s** — they fire before execution, so no earlier `console.log` in the file will print.

## 🎯 Say this in the interview

> "All three are hoisted — the difference is initialisation. When the engine enters a scope it creates every binding first: `var` gets initialised to `undefined`, function declarations get their function object, and `let`/`const`/`class` get created but left *uninitialised*. Reading one in that window throws a `ReferenceError` — that's the Temporal Dead Zone. So 'let isn't hoisted' is wrong; it's hoisted but unreachable, which you can prove because a `let` in a block shadows an outer variable even *before* its declaration line. The TDZ exists so `const` can actually mean 'never observably unassigned'. In practice I default to `const`, use `let` when I need reassignment, and never `var` — mainly because `var`'s single function-scoped binding is what makes the classic `setTimeout`-in-a-loop print `3 3 3`."

## 🔗 Go deeper

- [javascript.info — Variable scope, closure](https://javascript.info/closure) — lexical environments explained with the right diagrams.
- [MDN — let](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/let) — the TDZ described precisely, including the `typeof` caveat.
- [MDN — Hoisting](https://developer.mozilla.org/en-US/docs/Glossary/Hoisting) — short, and correctly frames it as initialisation rather than movement.
- [ECMAScript spec — Declarative Environment Records](https://tc39.es/ecma262/#sec-declarative-environment-records) — where "uninitialised binding" is actually defined.
