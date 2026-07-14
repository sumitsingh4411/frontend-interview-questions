<div align="center">

# Data types & coercion (`==` vs `===`)

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 45m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `===` compares type *and* value with no conversion; `==` runs the **Abstract Equality** algorithm, which coerces both sides toward **number** (except for `null`/`undefined`, which only equal each other). Coercion isn't random — it's a short, learnable set of rules, and knowing them is what separates "avoid `==`" cargo-culting from actually understanding the language.

---

## 🧠 Mental model

JavaScript has **7 primitives** (`string`, `number`, `bigint`, `boolean`, `undefined`, `symbol`, `null`) and everything else is an **object**. Coercion is the language quietly calling one of three conversion routines when an operator gets a type it didn't want:

```
ToPrimitive(obj, hint) → ToNumber(x) → ToString(x) → ToBoolean(x)
```

The only rule you truly need: **objects become primitives before anything else can happen to them.** `ToPrimitive` tries `Symbol.toPrimitive`, then — for hint `"number"`/`"default"` — `valueOf()` then `toString()`; for hint `"string"` it flips the order.

That single fact explains almost every "WAT" in the language.

## ⚙️ How it actually works

**`==` (Abstract Equality)** is only ~6 steps:

1. Same type? → do `===`.
2. `null == undefined` → **true**. (`null == 0` is **false** — `null` is *not* coerced to a number here.)
3. `number == string` → `ToNumber(string)`.
4. `boolean` on either side → `ToNumber(boolean)` (so `true` → `1`, `false` → `0`).
5. `object == primitive` → `ToPrimitive(object)`, then re-compare.
6. Anything else → **false**.

Now watch the infamous ones fall out mechanically:

```js
[] == false    // ToPrimitive([]) → ""; ToNumber("") → 0; ToNumber(false) → 0 → true
[] == ![]      // ![] is false (objects are truthy) → same as above → true
'0' == false   // 0 == 0 → true
null == 0      // false — step 2 short-circuits, no numeric coercion
NaN == NaN     // false — NaN is never equal to anything, including itself
```

**`+` is the outlier operator.** It's the only arithmetic operator that means two things: if *either* operand becomes a string after `ToPrimitive`, it concatenates. Every other operator (`-`, `*`, `/`, `<`) forces `ToNumber`.

```js
1 + '2'   // '12'  — string wins
1 - '2'   // -1    — numeric
[] + {}   // '[object Object]'  — "" + "[object Object]"
{} + []   // 0 in a statement position — the `{}` parses as a BLOCK, then +[] → 0
```

That last one is a **parsing** joke, not a coercion one. Say that in an interview and you've just outclassed everyone who memorised the meme.

**Falsy values — the complete list, all 8:** `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, `NaN`. Everything else is truthy — including `[]`, `{}`, `"0"`, `"false"`, and `new Boolean(false)`.

## 💻 Code

The comparisons interviewers actually ask about:

```js
// ✅ Prefer === everywhere...
value === null || value === undefined

// ✅ ...with ONE justified exception: `== null` is the idiomatic nullish check.
if (value == null) { /* value is null OR undefined, nothing else */ }
// Equivalent, more explicit, and what I'd write in a code review:
if (value === null || value === undefined) {}
```

`NaN` — the value that breaks equality entirely:

```js
NaN === NaN            // false
[NaN].includes(NaN)    // true  — includes() uses SameValueZero
[NaN].indexOf(NaN)     // -1    — indexOf() uses ===
Object.is(NaN, NaN)    // true  — SameValue
Number.isNaN(NaN)      // true  — ✅ type-safe
isNaN('foo')           // true  — ❌ global isNaN COERCES first. 'foo' → NaN → true
```

Three different equality algorithms in one language (`===`/SameValueZero/SameValue), and knowing which API uses which is a genuine senior signal.

Object-to-primitive, made explicit:

```js
const money = {
  amount: 42,
  [Symbol.toPrimitive](hint) {
    return hint === 'string' ? `$${this.amount}` : this.amount;
  }
};
+money        // 42   — hint 'number'
`${money}`    // '$42' — hint 'string'
money + 1     // 43   — hint 'default'
```

## ⚖️ Trade-offs

- **`===` by default is right, but "never use `==`" is lazy.** `x == null` is the cleanest null-or-undefined guard and every major codebase uses it (ESLint's `eqeqeq` has a `"smart"`/`allow-null` option precisely for this).
- **Implicit coercion is a readability tax, not a correctness one.** `if (str)` is fine; `if (count)` is a bug waiting for `0`. The failure mode isn't coercion — it's using truthiness where you meant "is present".
- **Don't over-defend with `typeof` chains.** For untrusted input, validate at the boundary (Zod, a parser) once, rather than sprinkling coercion guards through business logic.
- **`+x` vs `Number(x)` vs `parseInt(x)` are not interchangeable.** `Number('12px')` → `NaN`; `parseInt('12px')` → `12`. Pick based on whether trailing garbage should be an error.

## 💣 Gotchas interviewers probe

- **`null == 0` is `false` but `null >= 0` is `true`.** Equality special-cases `null`; *relational* operators don't — `>=` runs `ToNumber(null)` → `0`. Two different algorithms. This is the deepest cut in the topic.
- **`NaN !== NaN`.** Use `Number.isNaN` (not global `isNaN`, which coerces) or `Object.is`.
- **`typeof null === 'object'`** — a 1995 bug, now permanently web-compatible. `Array.isArray()` exists because `typeof []` is also `'object'`.
- **`[] == ![]` is `true`.** Walk the steps out loud; don't just assert it.
- **`0.1 + 0.2 !== 0.3`.** IEEE-754 doubles. Compare with an epsilon, or use integers/`BigInt` for money.
- **`parseInt('08')` is `8` today**, but always pass the radix — `parseInt(str, 10)` — because `parseInt('0x10')` is still `16`.
- **`String(x)` vs `x.toString()`**: the latter throws on `null`/`undefined`. `String(null)` → `'null'`.
- **Template literals always use hint `'string'`** — so `` `${obj}` `` calls `toString()` first, but `+obj` calls `valueOf()` first.

## 🎯 Say this in the interview

> "`===` compares type and value directly. `==` runs Abstract Equality, which coerces toward number — with two special cases worth memorising: `null` and `undefined` equal each other and nothing else, and objects are converted via `ToPrimitive` before comparison. That's why `[] == false` is true: `[]` becomes `''`, which becomes `0`, and `false` becomes `0`. My rule is `===` everywhere, with the one deliberate exception of `x == null` as a nullish check — it's idiomatic and unambiguous. The thing I'd flag to a teammate is that equality and *relational* comparison use different algorithms: `null == 0` is false, but `null >= 0` is true, because `>=` does a plain numeric conversion. And `NaN` isn't equal to itself, which is why `Number.isNaN` and `Object.is` exist."

## 🔗 Go deeper

- [javascript.info — Type conversions](https://javascript.info/type-conversions) — the clearest short treatment of the three conversion routines.
- [MDN — Equality comparisons and sameness](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Equality_comparisons_and_sameness) — the definitive table of `==` / `===` / SameValueZero / SameValue.
- [javascript.info — Object to primitive conversion](https://javascript.info/object-toprimitive) — `Symbol.toPrimitive`, `valueOf`, `toString` and the hints.
- [ECMAScript spec — IsLooselyEqual](https://tc39.es/ecma262/#sec-islooselyequal) — the `==` algorithm itself; it's shorter than you expect.
