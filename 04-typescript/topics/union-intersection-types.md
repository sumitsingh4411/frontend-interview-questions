<div align="center">

# Union & intersection types

<sub>🔷 TypeScript · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A union `A | B` is "**one of** these" so you can only touch the members they *share* until you narrow; an intersection `A & B` is "**all of** these at once" and combines every member — and the names lie to your set-theory intuition: union types have the *smaller* usable surface, intersections the larger.

---

## 🧠 Mental model

Set theory feels backwards here, and interviewers love it. `A | B` sounds like it should be *bigger*, but as a **type** it's more restrictive: a value could be either shape, so the only operations guaranteed to be safe are the ones present on **both**. `A & B` sounds smaller but is *more capable*: the value is guaranteed to satisfy every member, so you can use everything from both.

The reconciliation: think in terms of **the set of values**, not the set of properties. `string | number` is a *larger* set of values (more things qualify) but a *smaller* set of safe operations. `{a} & {b}` is a *smaller* set of values (must have both) but a *larger* set of operations. Values and operations move in opposite directions — that inversion is the whole insight.

## ⚙️ How it actually works

On a **union of object types**, property access is restricted to the common members. `{ kind: 'a'; x: number } | { kind: 'b'; y: string }` lets you read `.kind` freely (both have it) but blocks `.x` until you narrow, because it might be the `b` variant. Narrowing (via `typeof`, `in`, a discriminant) collapses the union to one member and unlocks its properties.

**Intersection of objects** merges keys. `{a: 1} & {b: 2}` has both. But intersecting *incompatible primitives* yields `never`: `string & number` is the empty set — no value is both — so TS gives you `never`, which is correct and occasionally surprising when a mapped/conditional type produces one accidentally.

**Distribution** is the subtle bit. Unions *distribute* over conditional and mapped types by default (`T extends U ? …` runs per-member when `T` is a union). Functions in unions become intersections of their signatures on call — `(a: A) => void | (b: B) => void` means you must pass something assignable to `A & B`. This "union of functions = intersection of parameters" rule catches people constantly.

## 💻 Code

```ts
// Union: only shared members are accessible until you narrow
type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'square'; side: number };

function area(s: Shape) {
  // s.radius; // ❌ Error: not on every member of the union
  if (s.kind === 'circle') return Math.PI * s.radius ** 2; // ✅ narrowed
  return s.side ** 2;
}

// Intersection: combine capabilities
type WithId = { id: string };
type Timestamped = { createdAt: number };
type Entity = WithId & Timestamped; // must have BOTH id and createdAt

// Incompatible intersection → never (the empty set)
type Impossible = string & number; // never — no value is both

// Gotcha: union of functions → intersection of parameters
type F = ((x: string) => void) | ((x: number) => void);
declare const f: F;
// f('a'); // ❌ must accept string & number → never; effectively uncallable
```

```ts
// Distribution: conditional types map over union members individually
type ToArray<T> = T extends any ? T[] : never;
type R = ToArray<string | number>; // string[] | number[]  (distributed, NOT (string|number)[])
```

## ⚖️ Trade-offs

- **Unions model "state" honestly** — a request is `loading | success | error`, never a bag of nullable fields. Reach for discriminated unions over optional-property soup; the compiler then forces you to handle each case.
- **Intersections compose capabilities** cleanly (mixins, `props & extraProps`) but deep intersection chains slow the checker and can silently produce `never` on key conflicts — a class of bug that type-checks and then behaves nothing like you expect.
- **Don't over-union.** A 12-member string union you keep extending might really want an enum or a branded type; unions of many object shapes without a discriminant are painful to narrow.

## 💣 Gotchas interviewers probe

- **"Which has the bigger type, `A | B` or `A & B`?"** Union = bigger *set of values*, smaller usable surface; intersection = smaller set of values, bigger surface. Getting the value-vs-operations inversion right is the senior signal.
- **You can't access non-shared members of a union without narrowing** — this is the whole reason discriminated unions exist.
- **Incompatible intersections become `never`**, not an error — silent and easy to miss in generated types.
- **Conditional types distribute over unions**; wrap in a tuple `[T] extends [U]` to *stop* distribution when you want the union treated as a whole.
- **Union of function types = intersection of their parameters**, which frequently makes the value effectively uncallable — a classic "why won't this compile" puzzle.

## 🎯 Say this in the interview

> "A union is 'one of', an intersection is 'all of'. The counterintuitive part is that a union has the *smaller* usable surface — since the value could be either shape, I can only touch members common to all of them until I narrow with `typeof`, `in`, or a discriminant. An intersection has the larger surface because the value satisfies every member at once. I think of it as values and operations moving in opposite directions. In practice I use unions to model state — `loading | success | error` — so the compiler forces me to handle each case, and intersections to compose capabilities like `Props & ExtraProps`. Two traps I watch for: intersecting incompatible types silently gives `never`, and conditional types distribute over union members individually unless I wrap them in a tuple to stop it."

## 🔗 Go deeper

- [TS Handbook — Union types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) — the basics and why narrowing is required.
- [TS Handbook — Intersection types](https://www.typescriptlang.org/docs/handbook/2/objects.html#intersection-types) — combining object shapes.
- [TS Handbook — Distributive conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html#distributive-conditional-types) — how unions distribute and how to stop it.
