<div align="center">

# Generic constraints & defaults

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#generics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A **constraint** (`<T extends U>`) is a *lower bound on capability*: it restricts what callers may pass **and** unlocks `U`'s members inside the body. A **default** (`<T = U>`) is unrelated — it's the fallback `T` becomes when inference finds nothing. One narrows the door; the other fills in a blank.

---

## 🧠 Mental model

An unconstrained `<T>` is maximally permissive, which sounds good but is useless inside the function: because `T` could be *anything*, you can't read a single property off it. A constraint fixes that. `<T extends { length: number }>` is a promise that **every** `T` has a `.length`, so the body is allowed to touch it. It's the type-level version of "I accept anything that quacks like this" — structural, not a class hierarchy.

A default lives in a different dimension entirely. `<T = string>` says nothing about what's *allowed*; it says what `T` **becomes** when the compiler can't work it out from the arguments. You can have both at once: `<T extends PropertyKey = string>` — constrained *and* defaulted.

## ⚙️ How it actually works

**`extends` here means "assignable to", not inheritance.** `<T extends string>` accepts `string`, string-literal types, and unions of them — anything structurally assignable to `string`.

**A constraint gates entry but does *not* widen the inferred type.** This is the detail people miss. `function id<T extends object>(x: T): T` called on `{ a: 1 }` returns `{ a: 1 }`, *not* `object`. The constraint decides who gets in; inference keeps the precise argument type once they're through.

**The workhorse pattern is `K extends keyof T`:**

```ts
function get<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

`K` is constrained to be a real key of `T`, and the return type is the indexed access `T[K]` — so `get(user, 'name')` is typed as exactly `user.name`'s type, and `get(user, 'nope')` is a compile error.

**Defaults only fire at the tail.** If *any* argument pins `T`, the default is ignored. Defaults can also reference earlier parameters: `<T, U extends T = T>`.

## 💻 Code

```ts
// ✅ Constraint unlocks members the body needs
function longest<T extends { length: number }>(a: T, b: T): T {
  return a.length >= b.length ? a : b; // .length is safe — constraint guarantees it
}
longest('abc', 'de');        // T = string
longest([1, 2], [3]);        // T = number[]
// longest(1, 2);            // ❌ number has no .length

// ✅ Constraint gates entry; inference keeps the SPECIFIC type
function tag<T extends object>(x: T): T { return x; }
const r = tag({ id: 1 });    // r: { id: number } — NOT widened to object

// ✅ Default supplies T only when nothing else determines it
function make<T = string>(): T[] { return []; }
const a = make();            // string[]  (default kicks in)
const b = make<number>();    // number[]  (default overridden)

// ❌ Constrains nothing — remove it
function noop<T extends unknown>(x: T) {}  // `extends unknown` == plain <T>
```

## ⚖️ Trade-offs

- **Constrain to the *minimum* capability you actually use.** `<T extends { id: string }>` beats `<T extends SomeConcreteClass>` — over-constraining throws away structural flexibility for no gain.
- **Defaults are an ergonomics win** (`Map<K, V = unknown>`, `useState<T>()`) but a default that quietly papers over an inference failure can hide a real bug — the call *looks* typed while `T` silently became the fallback.
- **Don't use a constraint as documentation.** `<T extends any>` / `<T extends unknown>` constrain nothing; they just add noise.

## 💣 Gotchas interviewers probe

- **Constraint vs default is the classic confusion.** `<T extends X>` restricts what's allowed; `<T = X>` supplies a fallback. Different jobs, often on the same parameter.
- **A constraint does NOT widen the inferred type.** Candidates assume `<T extends string>` returns `string`; it returns the *literal* you passed. The constraint is a filter, not a cast.
- **`extends` is structural assignability, not nominal inheritance.** No `class`/`implements` relationship is required.
- **Parameter order matters** — a default or constraint can reference an *earlier* type parameter but not a later one.
- **Constraints and defaults are fully erased.** `<T extends HTMLElement>` gives **zero** runtime guarantee; an `any` that lied its way across your boundary still satisfies every constraint. Type-check at the edge with an actual runtime check, not a generic.

## 🎯 Say this in the interview

> "I think of a constraint as a lower bound on capability — `<T extends { length: number }>` lets callers pass anything with a `length`, and in return the body is allowed to read `length`. The subtlety I always flag is that the constraint gates *entry* but doesn't widen the inferred type: pass a string literal and `T` stays that literal, not the constraint. A default is a completely different tool — `<T = string>` is just what `T` falls back to when inference has nothing to go on, and it only fires if no argument pinned `T` first. You can use both together. And I remember all of this is erased: a constraint is a compile-time gate, not a runtime guard, so anything crossing a real boundary still needs validating with actual code."

## 🔗 Go deeper

- [TS Handbook — Generic constraints](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints) — constraints, `keyof` constraints, and using type parameters in constraints.
- [TS Handbook — Default type parameters](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-parameter-defaults) — when defaults apply and how they interact with inference.
- [TS Handbook — Type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — why `extends` is structural assignability, not inheritance.
