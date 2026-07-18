<div align="center">

# Conditional types & `infer`

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 1.5h · `#type-ops` `#advanced`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `T extends U ? X : Y` is the type system's `if`. Its one non-obvious behaviour is **distribution**: when the checked type is a *naked* type parameter and you hand it a union, the conditional runs once per member and re-unions the results. `infer` is pattern-matching inside the `extends` clause — it captures part of a matched shape into a fresh type variable.

---

## 🧠 Mental model

A conditional type is a compile-time branch that stays **deferred** until it has enough information to resolve. Inside a generic, `T extends string ? A : B` doesn't pick a branch yet — it waits for `T` to be known, then evaluates. That's why conditional types compose: `ReturnType`, `Parameters`, `Awaited`, `NonNullable` are all thin conditionals stacked on top of each other.

`infer` is the part that makes them powerful. It says "match this shape, and wherever I write `infer X`, bind whatever fills that slot to `X`." It's destructuring for types — you don't compute the inner type, you *catch* it.

## ⚙️ How it actually works

**Distribution is the behaviour that surprises everyone.** When the checked type is a bare type parameter (`T extends …`, not `[T] extends …` or `{ x: T } extends …`) and the argument is a union, TypeScript maps the conditional across each member:

```ts
type ToArray<T> = T extends any ? T[] : never;
type A = ToArray<string | number>; // string[] | number[]  ← NOT (string | number)[]
```

Two consequences fall out of this:

- **`never` short-circuits.** `never` is the empty union, so distributing over it yields `never` — a conditional over `never` never runs its branches.
- **`boolean` splits into `true | false`** and distributes into *both* branches, which silently doubles your result.

Turn distribution **off** by wrapping both sides in a one-tuple — the senior tell:

```ts
type IsString<T> = [T] extends [string] ? true : false; // no distribution
```

**`infer` and variance.** Where you place `infer` changes how multiple matches combine. In a **covariant** position (like an array element or return type) multiple candidates **union**; in a **contravariant** position (function parameters) they **intersect**:

```ts
type Elem<T>   = T extends (infer E)[] ? E : never;
type U = Elem<(string | number)[]>;                 // string | number (union)

type Param<T>  = T extends (arg: infer P) => any ? P : never;
type I = Param<((a: string) => void) & ((a: number) => void)>; // string & number
```

**`infer … extends`** (TS 4.7) constrains the captured type, which lets it narrow instead of falling back to `unknown`:

```ts
type FirstChar<S> = S extends `${infer C extends string}${string}` ? C : never;
```

**Deferred evaluation** is what lets conditionals guard generics. A conditional that depends on an unresolved `T` is carried around symbolically and resolved at the call site — which is how a generic function can return `T extends X ? A : B` and have each caller get the right branch.

Runtime reality: **conditionals are erased**. `T extends string ? … : …` produces no `typeof` check, no branch, nothing. If you need to actually decide at runtime, you write a `typeof`/`in` guard in real JavaScript — the conditional type only describes what that guard *should* prove.

## 💻 Code

```ts
// Rebuild the standard-library conditionals — a frequent whiteboard task
type MyReturnType<T>   = T extends (...args: any[]) => infer R ? R : never;
type MyParameters<T>   = T extends (...args: infer P) => any ? P : never;
type MyNonNullable<T>  = T extends null | undefined ? never : T;
type MyAwaited<T>      = T extends Promise<infer V> ? MyAwaited<V> : T; // recurse to unwrap nesting

type R = MyReturnType<() => string>;         // string
type A = MyAwaited<Promise<Promise<number>>>; // number
```

```ts
// The distribution gotcha, made explicit
type Wrap<T> = T extends any ? { v: T } : never;
type Distributed = Wrap<'a' | 'b'>;      // { v: 'a' } | { v: 'b' }
type Blocked = [('a' | 'b')] extends [any] ? { v: 'a' | 'b' } : never; // { v: 'a' | 'b' }

// Why NonNullable is written with a naked T: it must distribute to filter each member
type Clean = NonNullable<string | null | undefined>; // string
```

## ⚖️ Trade-offs

- **Distribution is a feature, not a bug — but it's implicit.** Utilities like `NonNullable` *rely* on it to filter unions member-by-member. The failure mode is turning it off (or on) by accident, so make the `[T]` wrapping a deliberate, commented decision.
- **Nested conditionals become unreadable fast.** Three levels of `T extends A ? … : T extends B ? … : …` is a maintenance liability. Prefer a lookup via an object/mapped type when you're really doing a `switch`.
- **`infer`-heavy types are fragile to upstream changes.** They pattern-match a specific shape; when the matched type's structure shifts, your `infer` silently falls to the `never` branch. Add a test type (`type _check = Expect<Equal<…>>`) so the break is loud.

## 💣 Gotchas interviewers probe

- **Naked vs wrapped checked type.** `T extends U ? …` distributes over unions; `[T] extends [U] ? …` does not. This is the single most-tested detail here.
- **`never` as input yields `never`**, because it's the empty union — a conditional over `never` never evaluates its branches. Catches people writing `T extends never ? … : …` and wondering why it "doesn't work" (use `[T] extends [never]`).
- **`any` in a conditional returns *both* branches** as a union: `any extends string ? 1 : 2` is `1 | 2`.
- **`boolean` distributes** because it's `true | false` — a conditional over a `boolean` param runs twice.
- **`infer` in contravariant position intersects, not unions.** Extracting a parameter type from an overloaded/intersected function surprises people who expect a union.
- **Recursion depth is capped (~50).** Deep `Awaited`-style unwrapping needs tail-recursive accumulation or it errors with "excessively deep."

## 🎯 Say this in the interview

> "A conditional type is the type system's `if`, and it stays deferred inside a generic until `T` is known. The behaviour I'm always conscious of is distribution: when the checked type is a naked type parameter and I pass a union, the conditional runs once per member and re-unions — that's exactly how `NonNullable` filters `null` and `undefined` out of a union. I switch it off by wrapping both sides in a one-element tuple, `[T] extends [U]`. `infer` is pattern-matching in the `extends` clause: I match a shape and capture a slot, which is how `ReturnType` and `Awaited` are built. One subtlety is that where I put `infer` matters — in a return-type position multiple candidates union, but in a parameter position they intersect, because parameters are contravariant. And none of it survives to runtime, so a conditional type describes a guard I still have to write in real code."

## 🔗 Go deeper

- [TS Handbook — Conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) — distribution and `infer`, canonical.
- [TS 4.7 — `infer extends`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#extends-constraints-on-infer-type-variables) — constraining captured types.
- [TS Handbook — Type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — why `infer` positions union vs intersect.
- [Type Challenges](https://github.com/type-challenges/type-challenges) — the fastest way to internalise `infer`.
