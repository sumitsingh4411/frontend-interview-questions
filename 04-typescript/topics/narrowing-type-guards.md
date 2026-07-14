<div align="center">

# Narrowing & type guards

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#guards`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Narrowing is TS following your *runtime* control flow (`typeof`, `in`, `instanceof`, truthiness, equality) to shrink a broad type to a specific one inside a branch; a **user-defined type guard** (`x is Foo`) lets you package that logic into a reusable function — but it's a **promise you make**, not a check TS verifies.

---

## 🧠 Mental model

TS runs a **control-flow analysis** over your code: at each point it tracks the narrowest type each variable *could* be, given the checks that led there. Inside `if (typeof x === 'string')`, `x` is `string`; in the `else`, it's whatever's left. This is why you don't cast after checking — the compiler already knows.

A **type guard** (`isUser(x): x is User`) is you telling the compiler "trust me, if this returns true, it's a `User`." The critical caveat: TS does **not** verify that the body actually proves it. `function isUser(x: unknown): x is User { return true; }` compiles and lies. Guards are how narrowing escapes into reusable functions, and they're exactly where runtime unsafety sneaks back in.

## ⚙️ How it actually works

The built-in narrowing operators each have quirks:

- **`typeof`** — great for primitives, but `typeof null === 'object'` (the ancient JS bug) means `typeof x === 'object'` includes `null`. And `typeof x === 'function'` is the reliable callable check.
- **`instanceof`** — checks the prototype chain at runtime. Breaks across realms (iframes, workers) where each has its own `Array`, and doesn't work on interfaces (they're erased — no constructor to check against).
- **`in`** — `'radius' in shape` narrows by property presence; the cheapest discriminant for object unions without a tag.
- **Truthiness** — `if (x)` narrows out `null`/`undefined`/`''`/`0`/`false`. The trap: it also removes `0` and `''`, so `if (count)` skips a legitimate zero.
- **Equality** — `if (x === y)` narrows *both* to their common type; `=== null` / `!= null` are the idiomatic nullish checks.

**Assertion functions** (`asserts x is T`) narrow by *throwing* if false — after `assertIsUser(x)`, `x` is `User` for the rest of the scope. **Discriminated unions** narrow by a shared literal `kind` field. Crucially, narrowing is **reset** across a closure or `await` boundary if the variable is mutable (`let`) — TS can't prove it didn't change.

## 💻 Code

```ts
// Built-in narrowing follows control flow — no casts needed
function fmt(x: string | number | null) {
  if (x == null) return 'none';          // narrows out null AND undefined
  if (typeof x === 'string') return x.trim(); // x: string here
  return x.toFixed(2);                    // x: number here
}

// ❌ typeof object includes null (the JS legacy bug)
function bad(x: object | null) {
  if (typeof x === 'object') x.valueOf(); // ❌ x could still be null!
}

// ✅ user-defined type guard — reusable narrowing (but UNVERIFIED)
function isString(x: unknown): x is string {
  return typeof x === 'string'; // TS trusts this return; it does NOT check it
}

// ✅ assertion function — narrows by throwing
function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
function use(x: string | undefined) {
  assert(x, 'missing'); // after this line, x is string
  return x.length;
}
```

```ts
// ❌ A lying guard type-checks — the runtime hole
function isUser(x: unknown): x is { id: number } { return true; }
const u = JSON.parse('null');
if (isUser(u)) u.id; // compiles; crashes — the guard body was a lie
```

## ⚖️ Trade-offs

- **Prefer built-in narrowing** (`typeof`/`in`/discriminant) over custom guards where possible — the compiler *verifies* those; it merely *trusts* your `x is T` function. Every hand-written guard is a spot you could be lying.
- **Guards vs assertions:** guards return a boolean and narrow in the branch; assertions throw and narrow the rest of the scope. Use assertions for invariants ("this must be present by now"), guards for filtering (`arr.filter(isDefined)`).
- **`instanceof` doesn't cross realms and can't test interfaces.** In multi-window/worker code or for structural shapes, use `in` or a validating guard instead.
- **When the value crosses a real boundary** (network, storage), a hand-rolled guard is a liability — use a schema validator (Zod's `.parse`) that both narrows *and* actually checks.

## 💣 Gotchas interviewers probe

- **"Does TS verify a type guard's body?"** No. `x is T` is trusted, not checked — the guard can return `true` for a non-`T` and everything downstream is unsafe. This is the answer they're mining for.
- **`typeof null === 'object'`** — the perennial trap; narrowing on `'object'` still includes `null`.
- **Truthiness narrowing eats `0` and `''`** — `if (value)` silently drops legitimate zero/empty-string; use `!= null` for "present."
- **Narrowing resets across closures and `await`** for `let`-bound variables, because the compiler can't prove they weren't reassigned. `const` preserves the narrowing.
- **`instanceof` fails across realms** and can't narrow interfaces (no runtime constructor).
- **`arr.filter(Boolean)` doesn't narrow** the type (still includes the falsy type); `arr.filter((x): x is T => Boolean(x))` does.

## 🎯 Say this in the interview

> "Narrowing is TS reading my runtime control flow — `typeof`, `in`, `instanceof`, truthiness, equality — and shrinking a broad type inside each branch, so I don't cast after a check because the compiler already knows. When I need reusable narrowing I write a type guard returning `x is T`, but the key thing I stress is that TS *trusts* that function without verifying the body, so a guard can lie and reintroduce runtime unsafety — that's why for real boundaries like network data I use a validator like Zod that actually checks. A few traps I keep in mind: `typeof null` is `'object'`, truthiness narrowing drops legitimate `0` and empty string, and narrowing resets across `await` or a closure for `let` variables because the compiler can't prove they didn't change."

## 🔗 Go deeper

- [TS Handbook — Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) — control-flow analysis, every built-in guard, and `never`.
- [TS Handbook — Type predicates](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates) — user-defined `x is T` guards.
- [TS Handbook — Assertion functions](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html#assertion-functions) — `asserts` and narrowing by throwing.
