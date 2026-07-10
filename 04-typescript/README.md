<div align="center">

<img src="banner.svg" alt="04 · TypeScript" width="100%" />

</div>

Type-level thinking. Senior+ interviews increasingly ask you to design APIs with types and reason about generics.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 36 TypeScript questions across 6 categories →](question-bank/README.md)**

## Basics

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Type basics & inference | 🟢 | 45m | `#basics` | [TS Handbook: everyday types ⭐](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) |
| Interfaces vs type aliases | 🟢 | 30m | `#basics` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#interfaces-vs-type-aliases) |
| Union & intersection types | 🟢 | 30m | `#basics` | [TS Handbook: unions ⭐](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#union-types) |
| Literal & enum types | 🟢 | 30m | `#basics` | [TS Handbook: enums ⭐](https://www.typescriptlang.org/docs/handbook/enums.html) |
| Functions & overloads | 🟡 | 45m | `#basics` | [TS Handbook: functions ⭐](https://www.typescriptlang.org/docs/handbook/2/functions.html) |
| Narrowing & type guards | 🟡 | 45m | `#guards` | [TS Handbook: narrowing ⭐](https://www.typescriptlang.org/docs/handbook/2/narrowing.html) |
| Discriminated unions | 🟡 | 45m | `#patterns` `#state` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) |
| `unknown` vs `any` vs `never` | 🟡 | 30m | `#basics` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) |

## Advanced types

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Generics | 🟡 | 1h | `#generics` | [TS Handbook: generics ⭐](https://www.typescriptlang.org/docs/handbook/2/generics.html) |
| Generic constraints & defaults | 🟡 | 45m | `#generics` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/generics.html#generic-constraints) |
| Utility types (Partial/Pick/Omit/Record…) | 🟡 | 45m | `#utility-types` | [TS Handbook: utility types ⭐](https://www.typescriptlang.org/docs/handbook/utility-types.html) |
| `keyof` & `typeof` | 🟡 | 30m | `#type-ops` | [TS Handbook: keyof ⭐](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) |
| Indexed access types | 🟡 | 30m | `#type-ops` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) |
| Mapped types | 🔴 | 1h | `#type-ops` | [TS Handbook: mapped types ⭐](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) |
| Conditional types & `infer` | 🔴 | 1.5h | `#type-ops` `#advanced` | [TS Handbook: conditional types ⭐](https://www.typescriptlang.org/docs/handbook/2/conditional-types.html) |
| Template literal types | 🔴 | 1h | `#type-ops` `#advanced` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) |
| Variance & assignability | 🔴 | 1h | `#advanced` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) |
| Type-level programming | 🔴 | 2h | `#advanced` | [Type Challenges ⭐](https://github.com/type-challenges/type-challenges) |

## Tooling & practice

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Declaration files (`.d.ts`) | 🟡 | 45m | `#config` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html) |
| Decorators | 🟡 | 45m | `#advanced` | [TS Handbook: decorators ⭐](https://www.typescriptlang.org/docs/handbook/decorators.html) |
| `tsconfig` deep dive | 🟡 | 45m | `#config` | [TSConfig reference ⭐](https://www.typescriptlang.org/tsconfig) |
| `strict` mode & flags | 🟡 | 30m | `#config` | [TS Handbook ⭐](https://www.typescriptlang.org/tsconfig#strict) |
| Project references & monorepos | 🔴 | 1h | `#monorepo` `#config` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/project-references.html) |
| Typing React components & hooks | 🟡 | 1h | `#react` | [React TS cheatsheet ⭐](https://react-typescript-cheatsheet.netlify.app/) |
| Typing async & generics in APIs | 🟡 | 45m | `#patterns` | [TS Handbook ⭐](https://www.typescriptlang.org/docs/handbook/2/generics.html) |

## ❓ Rapid-fire TypeScript interview questions

Real TypeScript interview questions. Answer out loud, then verify above.

1. **`interface` vs `type`** — when to use each?
2. **`unknown` vs `any` vs `never`** — what's the difference?
3. What are **generics** and why use them?
4. Explain **union vs intersection** types.
5. What are **type guards** and **narrowing**?
6. What are **discriminated unions**?
7. Name the common **utility types** (`Partial`, `Pick`, `Omit`, `Record`…).
8. What do **`keyof`** and **`typeof`** do at the type level?
9. What are **mapped types**?
10. What are **conditional types** and **`infer`**?
11. What are **template literal types**?
12. What is a **declaration file** (`.d.ts`)?
13. What does **`strict` mode** turn on?
14. What is the difference between **`enum` and a union of literals**?
15. How do you **type a React component and its props/hooks**?
16. What is **structural typing** (duck typing)?
17. What is **type assertion** and when is it dangerous?
18. How do **generic constraints** (`extends`) work?
19. What's the difference between **`readonly` and `const`**?
20. How does **type inference** work and when does it fail?

---

**Related:** [03-javascript](../03-javascript/) · [06-react](../06-react/) · [08-architecture](../08-architecture/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
