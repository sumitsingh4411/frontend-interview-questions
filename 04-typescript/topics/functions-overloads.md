<div align="center">

# Functions & overloads

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Overloads let you expose several **public call signatures** backed by one **implementation signature** (which callers never see); they exist to express "these input shapes map to these *different* output types," but they're clumsier and less honest than a union or generic, so reach for them last.

---

## 🧠 Mental model

An overloaded function is **many contracts, one body**. You declare 2+ signatures with no body, then one implementation signature *with* a body that must be compatible with all of them. Callers only ever see the overload signatures; the implementation signature is invisible to the outside — a fact that trips up everyone the first time their "matching" call fails to type-check.

The core use case is **input-dependent output types** that a single signature can't express: `createElement('a')` returns `HTMLAnchorElement`, `createElement('div')` returns `HTMLDivElement`. You can't say that with one signature and a union return, because a union would let a `'div'` call be typed as an anchor. Overloads (or, better, a generic with a conditional type / lookup) pin each input to its specific output.

## ⚙️ How it actually works

Resolution is **top-down, first match wins**. TS tries each overload in source order and stops at the first that fits — so order matters: put the *most specific* signatures first, or a broad one will shadow them. This is unlike function *implementations*; the picker doesn't find the "best" match, just the first compatible one.

The **implementation signature is not a callable overload**. Even though it has a body, external callers can't use it. So if your overloads are `(x: string)` and `(x: number)` and the impl is `(x: string | number)`, a caller passing `string | number` fails — none of the *public* overloads accept a union. This asymmetry is the #1 overload gotcha.

Inside the body you get the *union* of all parameter types and must narrow. The implementation signature's return type isn't checked against callers (they see the overloads), but it must be assignable-compatible with each overload's return — TS validates the overloads against the implementation.

## 💻 Code

```ts
// Overloads: input shape determines output type
function parse(x: string): string[];        // overload 1 (public)
function parse(x: number): number;          // overload 2 (public)
function parse(x: string | number): string[] | number { // impl (hidden)
  return typeof x === 'string' ? x.split('') : x * 2;
}
const a = parse('hi'); // string[]
const b = parse(3);    // number
// parse(x as string | number); // ❌ no PUBLIC overload accepts a union

// ❌ Order matters — a broad overload first shadows the specific one
function get(k: string): unknown;
function get(k: 'id'): number;              // unreachable — never picked
// ✅ specific first
function get2(k: 'id'): number;
function get2(k: string): unknown;
```

```ts
// ✅ Often better: a generic + lookup type instead of overloads
interface Events { click: MouseEvent; key: KeyboardEvent; }
function on<K extends keyof Events>(type: K, cb: (e: Events[K]) => void) {/*...*/}
on('click', e => e.button); // e is MouseEvent — one signature, precise output

// ✅ Or a union return when inputs don't change the output shape
function toArray<T>(x: T | T[]): T[] {
  return Array.isArray(x) ? x : [x];
}
```

## ⚖️ Trade-offs

- **Overloads are the last resort, not the first.** A generic with a constraint/lookup type (`on<K extends keyof Events>`) or a single union signature usually expresses the same intent more honestly and stays DRY. Overloads duplicate signatures and let the implementation drift from its public contract silently.
- **They're genuinely necessary** when input *values* select unrelated output types and there's no indexable relationship to exploit — DOM `createElement`, or an API where `fn(true)` and `fn(false)` return different shapes.
- **Optional/default/rest params** replace many "I need two signatures" cases. `(a: number, b?: number)` beats two overloads when the difference is just arity.
- **Method overloads on interfaces** are how the DOM lib types are written — worth reading, but you rarely author them yourself.

## 💣 Gotchas interviewers probe

- **The implementation signature isn't public.** Callers see only the overload signatures; a call matching only the impl signature fails. Naming this is the senior tell.
- **First compatible overload wins, in source order** — not best match. Order specific-to-general or specific overloads become dead code.
- **A union return type ≠ overloads.** `(x): A | B` lets any call be `A | B`; overloads bind each *input* to a specific output. Confusing them is a common wrong answer.
- **Prefer generics/lookups over overloads** when a key-to-value relationship exists — cleaner and self-maintaining as the map grows.
- **`this` typing:** you can declare a fake `this` parameter (`function f(this: HTMLElement)`) — erased at runtime, purely for checking `this` inside the body.

## 🎯 Say this in the interview

> "Overloads let me publish several call signatures over one implementation, and the key subtlety is that the implementation signature is private — callers only see the overloads, so a call that only matches the impl signature won't type-check. TS also picks the first compatible overload in source order, not the best fit, so I order specific signatures before general ones. I reach for overloads only when the *input value* selects an unrelated output type and there's no indexable relationship — like the DOM's `createElement`. Most of the time a generic with a constraint and a lookup type, or a single union signature, expresses the same thing more honestly and doesn't let the public contract drift from the body. Overloads are my last resort, not my first."

## 🔗 Go deeper

- [TS Handbook — Function overloads](https://www.typescriptlang.org/docs/handbook/2/functions.html#function-overloads) — signatures, the implementation signature, and when to prefer union params.
- [TS Handbook — `this` parameters](https://www.typescriptlang.org/docs/handbook/2/functions.html#declaring-this-in-a-function) — typing `this` without a runtime cost.
- [TS Handbook — Generic functions](https://www.typescriptlang.org/docs/handbook/2/functions.html#generic-functions) — the usually-better alternative to overloads.
