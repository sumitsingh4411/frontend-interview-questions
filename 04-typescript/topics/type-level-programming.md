<div align="center">

# Type-level programming

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 2h · `#advanced`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — TypeScript's type system is a **Turing-complete, pure-functional language that runs at compile time**: conditional types are its `if`, mapped types its `for`, recursion its loop, and `infer` its pattern-match. It's astonishingly powerful — and every clever type you write is a cost you pay on every keystroke, in the editor, forever.

---

## 🧠 Mental model

There are two programs in a `.ts` file. The one you think about produces values at runtime. The other — the types — is a *second program* the compiler evaluates while you type, and it has its own semantics: no mutation, no side effects, no loops. Types go in, types come out.

Once you internalise that, "type gymnastics" stops being mysticism and becomes ordinary programming with four primitives. The trap is treating it as a party trick. It isn't — it's how `Parameters`, `ReturnType`, `Awaited`, and every well-typed form/query library are built. But it's also where codebases go to die: a type nobody can read is worse than an `any` nobody has to.

## ⚙️ How it actually works

**Conditional types are `if`.** `T extends U ? A : B`. The genuinely load-bearing behaviour is **distribution**: when the checked type is a *naked* type parameter and you pass a union, the conditional runs once per member and re-unions the results.

```ts
type NonNull<T> = T extends null | undefined ? never : T;
type A = NonNull<string | null>; // string  ← ran per-member, never dropped out
```

Wrap both sides in a tuple to **switch distribution off** — the senior tell:

```ts
type IsNever<T> = [T] extends [never] ? true : false; // [ ] disables distribution
```

**Mapped types are `for`.** Iterate keys, optionally remap them, toggle modifiers:

```ts
type Mutable<T> = { -readonly [K in keyof T]: T[K] };        // strip readonly
type Getters<T> = { [K in keyof T & string as `get${Capitalize<K>}`]: () => T[K] };
```

**`infer` is pattern-matching** — destructure a type by matching a shape and capturing a slot:

```ts
type ElementOf<T> = T extends readonly (infer E)[] ? E : never;
type Un = ElementOf<number[]>; // number
```

**Recursion is the only loop.** There are no `while`s — you recurse and accumulate, usually in a tuple. TypeScript caps instantiation depth (~50, ~100 for tail-recursive accumulator types since 4.5), which is a feature: it stops a runaway type from hanging your editor.

```ts
// Split a route string into its segments — string parsing at the type level
type Split<S extends string> =
  S extends `${infer Head}/${infer Tail}` ? [Head, ...Split<Tail>] : [S];
type R = Split<'users/:id/posts'>; // ['users', ':id', 'posts']
```

## 💻 Code

```ts
// A recursive DeepReadonly — mapped + conditional + recursion together
type DeepReadonly<T> = T extends (infer E)[]
  ? ReadonlyArray<DeepReadonly<E>>
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T; // primitives bottom out the recursion

type Config = { db: { host: string; ports: number[] } };
type Frozen = DeepReadonly<Config>;
// { readonly db: { readonly host: string; readonly ports: readonly number[] } }
```

```ts
// Template-literal + infer as a typed string parser (real use: typed i18n keys)
type Params<S extends string> =
  S extends `${string}:${infer P}/${infer Rest}` ? P | Params<Rest>
  : S extends `${string}:${infer P}` ? P
  : never;
type P = Params<'/users/:userId/posts/:postId'>; // 'userId' | 'postId'
```

## ⚖️ Trade-offs

- **This is library-author power, not app-code power.** In application code, a type that takes a paragraph to understand is a liability — the next engineer can't extend it and the error messages are unreadable. Reach for it when the alternative is losing safety across an API boundary, not to feel clever.
- **Compile time is real.** Deep recursive types and large unions blow up instantiation counts; a single `Split` over a giant literal can visibly lag IntelliSense. Profile with `tsc --extendedDiagnostics` before shipping type wizardry into a hot path.
- **Codegen often wins.** If the logic is genuinely complex (OpenAPI → types, GraphQL → types), *generate* the concrete types at build time. You get the same safety with readable output and zero editor cost.

## 💣 Gotchas interviewers probe

- **Distributive conditionals.** `T extends U ? ...` over a union runs per-member — great until it silently changes your result. `boolean` is `true | false`, so it distributes into *both* branches. Wrap in `[T]` to stop it.
- **`any` in a conditional returns *both* branches** as a union (`any extends string ? 1 : 2` → `1 | 2`). `never` as the input yields `never` (it's the empty union — nothing to distribute).
- **Recursion depth is capped.** Non-tail-recursive types hit "Type instantiation is excessively deep" fast; refactor to accumulate in a tuple parameter to get tail-call treatment.
- **`keyof` on `{}` / `object` vs a concrete type.** `keyof any` is `string | number | symbol`; forgetting to `& string` breaks template-literal remapping.
- **The type system is deliberately unsound in places** (bivariant methods, `any`, assertions) — type-level code inherits those holes. A "proven" type can still be lied to at the value level.

## 🎯 Say this in the interview

> "I treat the type system as a second, pure-functional program that runs at compile time. Conditional types are my `if`, mapped types my `for`, `infer` is pattern-matching, and recursion is the only loop — with a depth cap that stops runaways. The one behaviour I'm always conscious of is distribution: a naked type parameter in a conditional runs once per union member, which is usually what I want but occasionally not, and I disable it by wrapping both sides in a one-tuple. Where I draw the line is readability: this is how utilities like `Awaited` and typed routers are built, but in application code a type nobody else can read is worse than an `any`. If the logic gets genuinely hairy, I generate concrete types at build time instead of paying the editor cost on every keystroke."

## 🔗 Go deeper

- [Type Challenges](https://github.com/type-challenges/type-challenges) — the canonical graded exercises; the fastest way to actually internalise this.
- [TS Handbook — Conditional types](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) — distribution and `infer`, from the source.
- [TS Handbook — Mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) — key remapping and modifiers.
- [TS Handbook — Template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) — string manipulation at the type level.
