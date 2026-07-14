<div align="center">

# Destructuring, spread, rest

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Destructuring pulls values *out* by shape; spread scatters values *out* into a new list/object; rest gathers the *remainder* *in*. `...` on the left of `=` is rest (gather), on the right it's spread (scatter) — and every one of them is **shallow**.

---

## 🧠 Mental model

Three tools, two directions. **Destructuring** reads structure — it pattern-matches the shape of an array/object and binds the pieces. **Spread** expands an iterable or object's own properties into a new literal or argument list. **Rest** does the inverse of spread: it collects the leftovers into a fresh array/object. The same `...` means opposite things by position: gather on the left/parameters, scatter on the right/literals.

## ⚙️ How it actually works

Object destructuring matches **by key**; array destructuring consumes the **iterator** (so it works on strings, `Set`s, `NodeList`s — anything iterable). Defaults kick in **only when the value is `undefined`** — not `null`, not `0`, not `''`. Object spread copies **own enumerable** properties (like `Object.assign`), evaluates getters, and applies last-wins ordering. Rest must be the final element. Critically, both spread and destructuring copy **references** one level deep — nested objects are shared, not cloned.

## 💻 Code

```js
// Destructuring: rename, default, nested (with fallback), and rest
const { id, name: label = 'anon', meta: { role } = {}, ...others } = user;

// Array: skip a hole, default, collect the tail, swap without a temp
const [first, , third = 0, ...tail] = list;
[a, b] = [b, a];

// Spread: shallow clone, merge (later wins), insert
const clone  = { ...state };
const merged = { ...defaults, ...overrides };
const arr2   = [0, ...list, 99];

// Rest in parameters
function log(level, ...args) { /* args is a real Array */ }
```

```js
// Guard against destructuring null/undefined (which throws)
const { theme } = settings ?? {};   // safe even if settings is null
```

## ⚖️ Trade-offs

- **Spread clones are shallow** — nested references are shared, so mutating a nested object mutates the "clone" too. Use `structuredClone` for a deep copy.
- **`{...instance}` is not a faithful clone.** It drops the prototype and non-enumerable members, returning a plain object with the methods gone — a real trap for class instances.
- **Spread has a cost.** `acc = [...acc, x]` inside a `reduce`/loop is accidental O(n²) — push into an array or use `.concat` deliberately instead.
- **Readability ceiling.** Deeply nested destructuring with renames and defaults quickly becomes write-only code; stop before it hurts.

## 💣 Gotchas interviewers probe

- **Defaults only fire on `undefined`.** `const { x = 5 } = { x: null }` gives `null`, not `5`. A frequent source of bugs.
- **Destructuring `null`/`undefined` throws.** `const { a } = null` → TypeError; guard with `?? {}`.
- **Spread is shallow.** The single most common misconception — people expect a deep clone.
- **Object spread loses the prototype.** Spreading a class instance yields a plain object; methods vanish.
- **Spread in a loop is O(n²).** Interviewers specifically probe this in reduce-based accumulation.
- **Object spread copies only enumerable own props** and evaluates getters (copying the returned value, not the accessor).
- **Array destructuring uses the iterator, object destructuring uses keys** — you can't array-destructure a plain object.
- **Rest must be last**; a trailing comma after it is a syntax error. And `[a, b] = [b, a]` needs the previous statement terminated (ASI will otherwise glue it to a preceding line).

## 🎯 Say this in the interview

> "Destructuring, spread, and rest are three tools in two directions. Destructuring pattern-matches shape to pull values out — by key for objects, by iteration for arrays — with renames and defaults, where defaults only apply when the value is strictly `undefined`, not `null` or zero. Spread scatters an object's own enumerable properties or an iterable's elements into a new literal, last-wins for objects. Rest is the inverse — it gathers leftovers and must come last. The thing I always call out is that all of this is shallow: `{...obj}` is a one-level copy, nested objects stay shared, and it drops the prototype, so it's not a real clone of a class instance — for that I'd use `structuredClone`. And I avoid spreading inside a reduce because it's quietly O(n²)."

## 🔗 Go deeper

- [javascript.info — Destructuring assignment](https://javascript.info/destructuring-assignment) — patterns, defaults, and the rest element.
- [MDN — Spread syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax) — where spread is legal and how object vs array spread differ.
- [MDN — Rest parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters) — gather semantics and the "must be last" rule.
