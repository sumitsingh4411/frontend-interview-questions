<div align="center">

# Numbers, `BigInt`, floating point

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Every JS `number` is an IEEE-754 double: 64 bits, ~15–17 significant decimal digits, and it **cannot exactly represent most decimals** (that's why `0.1 + 0.2 !== 0.3`) or integers beyond 2⁵³. `BigInt` fixes the integer limit but not the fractions; for money you use integer minor units or a decimal library.

---

## 🧠 Mental model

There is **one** number type in JavaScript, and it is a 64-bit binary floating-point double. It stores values as `sign × mantissa × 2^exponent` — 1 sign bit, 11 exponent bits, 52 mantissa bits. The consequence that trips everyone up: **only fractions whose denominator is a power of two are exact.** `0.5` and `0.25` are exact; `0.1` and `0.3` are *not* — they're stored as the nearest representable double, which is slightly off. The error was always there; arithmetic just makes it visible.

Two separate limits fall out of the same 64 bits:

- **Precision:** ~15–17 significant decimal digits. Beyond that, digits are lost.
- **Integer safety:** integers are exact only up to **2⁵³ − 1** (`Number.MAX_SAFE_INTEGER`, ~9 quadrillion). Above it, consecutive integers become unrepresentable and round.

`BigInt` exists for that second limit — arbitrary-precision *integers*. It does nothing for fractions.

## ⚙️ How it actually works

**Why `0.1 + 0.2 === 0.30000000000000004`:** `0.1` and `0.2` each round to the nearest double on the way in. Their stored values sum to a double that prints as `0.30000000000000004`, which isn't the stored value of `0.3`. Nothing is "buggy" — this is IEEE-754 behaving exactly as specified, identical in Java, C, Python, and every other double.

**The integer cliff is real and dangerous:**

```js
Number.MAX_SAFE_INTEGER;      // 9007199254740991  (2^53 - 1)
9007199254740992 === 9007199254740993; // true (!) — both round to the same double
```

This is why **large IDs from a backend (Twitter snowflake IDs, 64-bit DB keys) must arrive as strings**, not JSON numbers — `JSON.parse` will silently corrupt them.

**`BigInt`** is a distinct primitive (`typeof 10n === 'bigint'`) with no upper bound, but it's integer-only, doesn't mix with `number` in arithmetic (`1n + 1` throws `TypeError`), can't be `JSON.stringify`-ed, and is slower. Use it for exact large-integer math (crypto, precise 64-bit IDs you need to compute on), not as a default.

**Special values:** `NaN` (the only value `!== itself` — that's how `Number.isNaN` used to be polyfilled), `Infinity`/`-Infinity`, and `-0` (distinguishable only via `Object.is(-0, 0) === false` or `1/x === -Infinity`).

**Comparing floats** needs an epsilon, not `===`: check `Math.abs(a - b) < Number.EPSILON` (scaled to magnitude for large values).

## 💻 Code

```js
// ❌ The classic — and why naive rounding of money loses cents
0.1 + 0.2;                       // 0.30000000000000004
(0.1 + 0.2) === 0.3;             // false
0.1 + 0.2 < 0.3;                 // true (!)

// ✅ Compare with a tolerance
const eq = (a, b) => Math.abs(a - b) < Number.EPSILON;
eq(0.1 + 0.2, 0.3);              // true

// ✅ Money: work in integer minor units (cents), never floats
const cents = 1099;              // $10.99
const total = cents * 3;         // 3297 → format as "$32.97" at the edge

// toFixed lies and is not a rounding fix — it's string formatting with bugs
(0.1 + 0.2).toFixed(2);          // "0.30"  (display only)
(1.005).toFixed(2);              // "1.00"  (!) — 1.005 is stored as 1.00499...

// Integer safety
Number.isSafeInteger(2 ** 53);   // false
9007199254740993n;               // 9007199254740993n — BigInt keeps it exact

// BigInt doesn't mix with Number
// 10n + 5;                       // TypeError
10n + BigInt(5);                 // 15n
Number(10n) + 5;                 // 15  (only when the value is safe)

// Parsing gotchas
parseInt('08');                  // 8   (fine now, but base matters)
parseInt('0.1e1');               // 0   (stops at '.') vs Number('0.1e1') === 1
Number('');                      // 0   (surprising) vs parseInt('') → NaN
```

## ⚖️ Trade-offs

- **`BigInt` vs `Number`:** BigInt is exact and unbounded but ~10× slower, integer-only, and won't serialize to JSON. Default to `Number`; reach for `BigInt` only when you provably exceed 2⁵³ and need *integer* exactness.
- **When NOT to use floats at all:** anything financial or where rounding is legally observable. Use integer minor units for simple cases, a decimal library (`decimal.js`, `dinero.js`) when you need division/tax/currency math.
- **`toFixed` is formatting, not rounding** — it's locale-blind and has documented edge cases (`1.005` → `"1.00"`). For real rounding, `Math.round(x * 100) / 100` is better but *still* float-limited; `Intl.NumberFormat` is the right tool for display.

## 💣 Gotchas interviewers probe

- **"Why is `0.1 + 0.2 !== 0.3`?"** The answer they want: IEEE-754 doubles can't represent `0.1`/`0.2`/`0.3` exactly, so rounding errors surface. Bonus points for "it's not a JS bug — every language with doubles does this."
- **Big integer IDs corrupt silently.** A 64-bit ID over 2⁵³ loses precision through `JSON.parse`; the fix is transporting it as a string. This is a frequent production bug, not a trivia question.
- **`toFixed` doesn't round the way you think** — `(1.005).toFixed(2)` gives `"1.00"` because `1.005` isn't stored exactly.
- **`NaN !== NaN`.** Use `Number.isNaN` (not global `isNaN`, which coerces: `isNaN('foo') === true`).
- **`parseInt` vs `Number`** — `parseInt` reads a prefix and stops (`parseInt('12px') === 12`), `Number` demands the whole string be numeric (`Number('12px') === NaN`). Always pass `parseInt`'s radix.
- **`-0` exists** and equals `0` under `===` but not `Object.is` — matters for sign-sensitive math and cache keys.
- **`0.1 + 0.2 < 0.3` is `true`** — the error can go either direction, so *never* use floats in a loop counter or accumulator you compare exactly.

## 🎯 Say this in the interview

> "JavaScript has a single number type — a 64-bit IEEE-754 double — so there are two limits I design around. First, precision: most decimals like `0.1` can't be represented exactly in binary floating point, which is why `0.1 + 0.2` comes out as `0.30000000000000004`. It's not a JS bug; any language with doubles behaves identically. So I never compare floats with `===` — I use an epsilon — and for money I work in integer minor units like cents, or a decimal library, and only format at the very edge with `Intl.NumberFormat`. The second limit is integer safety: integers are exact only up to 2⁵³ minus one, so large 64-bit IDs from a backend have to travel as strings, otherwise `JSON.parse` silently corrupts them. When I genuinely need exact math above that range I use `BigInt`, keeping in mind it's integer-only, doesn't mix with `Number` in arithmetic, and won't `JSON.stringify`. And I avoid `toFixed` for rounding — it's string formatting with its own float artifacts."

## 🔗 Go deeper

- [javascript.info — Numbers](https://javascript.info/number) — imprecise-decimal explanation, `toFixed`, rounding, parsing.
- [MDN — `Number.MAX_SAFE_INTEGER`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) — the 2⁵³ boundary and why it matters.
- [MDN — `BigInt`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt) — semantics, the no-mixing rule, and JSON limitations.
- [What Every Computer Scientist Should Know About Floating-Point (Goldberg)](https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html) — the definitive reference on IEEE-754.
- [0.30000000000000004.com](https://0.30000000000000004.com/) — the same result across every language, driving home that it's the format, not the language.
