<div align="center">

# Generics

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 1h · `#generics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Generics are **type-level parameters**: they let a function or type preserve the *relationship* between inputs and outputs (identity of type flows through) instead of collapsing everything to `any`; the skill is putting the type parameter where inference can *capture* it from the arguments, not making callers spell it out.

---

## 🧠 Mental model

A generic is a function that takes **types as arguments**. `function first<T>(arr: T[]): T` says "whatever element type goes in, that same type comes out" — the `T` is a placeholder the compiler fills at each call site. Without it you'd pick between `any[]` (loses the type) or overloads for every element type (unmaintainable). Generics preserve the *link* between input and output.

The mental shift from beginners: generics aren't for "any type" — that's what `unknown` is for. Generics are for **carrying a specific-but-unknown-until-called type through** a transformation so the relationship survives. `Array<T>`, `Promise<T>`, `Map<K,V>` are all "a container that remembers what it holds."

## ⚙️ How it actually works

**Inference is the goal, explicit args are the fallback.** In `first([1,2,3])`, TS infers `T = number` from the argument — you almost never write `first<number>(...)`. Placement matters: the type parameter must appear in a position TS can read from the arguments. `function make<T>(): T` can't infer anything (T isn't in any parameter), so it defaults to `unknown` and forces callers to annotate — usually a design smell.

**Generics thread through composition.** `function map<T, U>(arr: T[], fn: (x: T) => U): U[]` — TS infers `T` from the array, then uses it to type `fn`'s parameter, then infers `U` from `fn`'s return. Each type variable is solved from the call, and they chain. This is the whole reason `Array.prototype.map` is precisely typed.

**Generic classes and interfaces** parameterise their whole surface: `class Box<T> { value: T }`. And there's a rule people miss — **a type parameter used only once is often a smell**. If `<T>` appears in exactly one position and nowhere else, it's not relating anything and could just be the concrete type. Genuine generics connect two or more positions.

## 💻 Code

```ts
// Generic preserves the input→output relationship; inference fills T
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}
const n = first([1, 2, 3]);      // T = number → number | undefined
const s = first(['a', 'b']);     // T = string → string | undefined

// ❌ any loses the type; caller gets no help downstream
function firstBad(arr: any[]): any { return arr[0]; }
const x = firstBad([1, 2]);      // x: any — unsafe from here on

// Multiple type params chain through composition
function map<T, U>(arr: T[], fn: (x: T) => U): U[] {
  return arr.map(fn);
}
map([1, 2], n => `#${n}`);       // T=number inferred, U=string inferred → string[]

// ❌ Unusable generic — T appears only in return; nothing to infer from
function create<T>(): T { return {} as T; } // caller MUST annotate; smell
```

```ts
// Generic container: remembers what it holds
class Stack<T> {
  private items: T[] = [];
  push(x: T) { this.items.push(x); }
  pop(): T | undefined { return this.items.pop(); }
}
const s2 = new Stack<string>(); // or inferred from first push in some cases
```

## ⚖️ Trade-offs

- **Generics beat `any` and beat overloads** for input-preserving transforms — one signature, full type flow, self-maintaining. This is the correct default for utility functions.
- **Don't over-genericise.** A type parameter that appears once relates nothing and just adds noise; inline the concrete type. Over-parameterised APIs are hard to read and give worse error messages.
- **Explicit type arguments are a fallback, not a feature.** If callers routinely have to write `<Foo>` because inference fails, reconsider where the parameter lives — good generic APIs infer from arguments.
- **Deep generic nesting costs compile time and error clarity.** Heavily generic library types (think complex form or query builders) can produce inscrutable errors; there's a real ergonomics/precision trade.

## 💣 Gotchas interviewers probe

- **"When is a generic pointless?"** When the type parameter appears in only one position — it's relating nothing, so a concrete type is clearer. Naming this shows you understand *why* generics exist.
- **Inference position matters.** A `<T>` not present in the parameters can't be inferred and forces annotation; it usually belongs on an argument.
- **Generics are erased at runtime.** `new Stack<string>()` has no runtime knowledge of `string` — you can't `if (T === String)`. No reflection on type params, ever.
- **`const` type parameters** (`<const T>`) preserve literal types through inference instead of widening — newer, and the fix for "why did my tuple become `string[]`?"
- **Default vs constraint confusion:** `<T = string>` is a default; `<T extends string>` is a constraint. Different jobs (see the constraints topic).

## 🎯 Say this in the interview

> "Generics are type-level parameters — they let a function keep the relationship between its inputs and outputs instead of flattening everything to `any`. `first<T>(arr: T[]): T` says the element type that goes in is the type that comes out, and the compiler infers `T` from the argument, so callers rarely spell it out. The design principle I apply is that a good type parameter appears in *multiple* positions — it's connecting them; if it only shows up once, it's relating nothing and I'd use a concrete type. I also make sure the parameter sits where inference can capture it from the arguments, because a generic that forces callers to annotate is usually misplaced. And I remember they're erased at runtime — there's no reflecting on `T`, so any runtime decision needs an actual value."

## 🔗 Go deeper

- [TS Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) — the full walkthrough of generic functions, classes, and inference.
- [TS Handbook — Generic functions & inference](https://www.typescriptlang.org/docs/handbook/2/functions.html#generic-functions) — where to place type parameters for inference.
- [TS 5.0 — `const` type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters) — preserving literals through generic inference.
