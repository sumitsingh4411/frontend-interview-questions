<div align="center">

# Interfaces vs type aliases

<sub>🔷 TypeScript · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `interface` and `type` are ~90% interchangeable for object shapes; the real differences are that **interfaces merge and extend** (open, great for public APIs and augmentation) while **type aliases can name anything** — unions, tuples, primitives, mapped and conditional types — and are closed.

---

## 🧠 Mental model

An `interface` describes the **shape of an object or class**. A `type` alias is a **name for any type expression at all**. Every interface can be written as a type alias, but not every type alias can be written as an interface — you can't `interface X = string | number`, because a union isn't a shape.

The dividing question at scale: *do I want this to be extendable and augmentable by others?* Interfaces are **open** — declaring the same interface twice merges the members (declaration merging). Type aliases are **closed** — a duplicate name is a hard error. That single property drives most real decisions: library public APIs and things you might need to patch (like `Window`) want interfaces; internal unions, function types, and computed types want aliases.

## ⚙️ How it actually works

**Declaration merging** is interface-only. Two `interface Window {}` declarations combine, which is exactly how you augment global or third-party types. Type aliases have no such mechanism — that's a feature, not a gap: an alias means "this is the whole definition, nothing can inject into it."

**Extension differs in kind.** `interface B extends A` establishes a *named relationship* the compiler tracks and can report cache-friendly errors on. Type aliases compose with `&` (intersection), which is structurally equivalent for objects but computed differently — the compiler flattens interface inheritance eagerly and can produce clearer errors, while large intersection chains can be slower and yield gnarlier messages.

**Performance and errors.** For object types, interfaces are marginally friendlier to the compiler's caching and produce error messages that reference the interface *name* rather than expanding the full structure. This matters in big codebases where "`Type 'X' is not assignable…`" beats a 40-line structural dump.

## 💻 Code

```ts
// Only interfaces merge — this is how you augment third-party/global types
interface Window { myAnalytics: (e: string) => void; }
interface Window { featureFlags: Record<string, boolean>; } // merges, both exist
window.myAnalytics('signup'); // ✅ typed

// Only type aliases can name non-object types
type ID = string | number;           // union — impossible as an interface
type Point = [number, number];       // tuple
type Handler = (e: Event) => void;   // function type (reads cleanly)
type Nullable<T> = T | null;         // generic alias over anything

// Extension: both work for objects, different machinery
interface Animal { name: string; }
interface Dog extends Animal { bark(): void; }      // named inheritance
type Cat = Animal & { meow(): void; };              // intersection

// ❌ can't do this — alias for a shape can't be reopened
type Cfg = { a: number };
type Cfg = { b: number }; // Error: Duplicate identifier 'Cfg'
```

```ts
// Subtle: interface extends enforces compatibility; intersection silently narrows to never
interface A { x: number }
// interface B extends A { x: string } // ❌ Error: incompatible — caught early
type C = A & { x: string };            // no error; C['x'] is `never` — a silent trap
```

## ⚖️ Trade-offs

- **Prefer `interface` for public/exported object and class contracts** — better error messages, and consumers can augment. The TS team's own historical default was "interface unless you need a feature only `type` has."
- **Prefer `type` for unions, tuples, functions, and anything computed** (mapped/conditional types, template literals). This is not a style choice — interfaces literally cannot express them.
- **Declaration merging is a double-edged sword.** It's essential for augmentation but it means an interface's shape isn't guaranteed to be what you see in one place — a footgun for internal types where you want a closed, single-source definition.
- **Consistency > dogma.** Pick a team rule (many codebases say "type by default, interface when merging/OO"), because the practical difference is small and mixing arbitrarily just adds cognitive load.

## 💣 Gotchas interviewers probe

- **"When can't you use an interface?"** For anything that isn't an object shape: unions, tuples, primitives, function-type aliases, mapped/conditional types. Naming this instantly signals you understand the boundary.
- **Declaration merging is interface-only** and is the mechanism behind global augmentation (`declare global`, module augmentation). Type aliases can't do it.
- **`interface extends` catches incompatible overrides; `&` produces `never`.** Redeclaring `x: number` as `x: string` errors under `extends` but silently becomes `never` under intersection — a real bug source.
- **Both are erased at runtime.** Neither exists after compilation — you cannot `instanceof` an interface or reflect over a type. Runtime shape checking needs actual code.
- **Performance in large repos:** interfaces cache and produce name-based errors; deep intersection aliases can slow the checker and bloat messages.

## 🎯 Say this in the interview

> "For object shapes they're mostly interchangeable, so I focus on the differences that actually decide it. Interfaces are open — they support declaration merging, which is how you augment `Window` or a third-party module — and they give the compiler nicer, name-based error messages, so I lean on them for public and class-facing contracts. Type aliases can name *anything*: unions, tuples, function types, and computed mapped or conditional types, none of which an interface can express, and they're closed, which is what I want for internal definitions. One trap I call out: `interface extends` will reject an incompatible property override, but composing with `&` silently collapses it to `never`. And both are fully erased at runtime, so neither gives me any runtime type checking."

## 🔗 Go deeper

- [TS Handbook — Interfaces vs type aliases](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#differences-between-type-aliases-and-interfaces) — the official side-by-side.
- [TS Handbook — Declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) — the interface-only feature and how augmentation uses it.
- [TS Performance wiki — Interfaces vs intersections](https://github.com/microsoft/TypeScript/wiki/Performance#preferring-interfaces-over-intersections) — why interfaces are easier on the compiler.
