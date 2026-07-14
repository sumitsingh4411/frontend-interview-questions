<div align="center">

# Type basics & inference

<sub>🔷 TypeScript · 🟢 Easy · ⏱ 45m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — TypeScript is a *compile-time* layer that is erased to nothing before your code runs, so it gives you **zero runtime safety**; its job is to infer and check the shapes flowing through your program, and the skill is knowing when to let inference work and when to annotate the *inputs* it can't see.

---

## 🧠 Mental model

Think of TS as a **spellchecker for values**, not a runtime guard. Every type you write vanishes during compilation (`tsc` and esbuild both just strip them), so a `number` parameter can absolutely receive a string at runtime if the value came from JSON, the DOM, or an `any`. The type system is a *proof* that, **given your assumptions hold**, the shapes line up. If the assumptions are wrong — an API returns a different shape — TS is silent, because it was never there when the bytes arrived.

The second idea: **inference is the default, annotation is the exception.** TS derives types from the right-hand side of assignments and from return positions. You annotate the *boundaries* — function parameters, external data, public APIs — because those are the places TS genuinely cannot infer intent.

## ⚙️ How it actually works

Inference has two modes that trip people up. **Widening**: `let x = 3` infers `number` (mutable, so it could become any number), but `const x = 3` infers the literal `3`. The `const` context tells TS the value can never change, so it keeps the narrowest type. This is why `const` vs `let` changes your types, not just your runtime binding.

**Contextual typing** flows the *other* direction — from expected type into an expression. In `arr.map(x => x.toUpperCase())`, `x` is typed from `arr`'s element type; you don't annotate it. Same with `onClick={e => …}` in typed JSX — the event type comes from the prop. Annotating these manually is a smell.

The escape hatch is `any`, and it's radioactive: an `any` **disables checking on everything it touches**. `const data: any = fetch(...); data.foo.bar.baz` compiles, and every downstream variable that reads from `data` silently becomes `any` too. This is how a single unchecked boundary poisons a whole module.

## 💻 Code

```ts
// Inference vs annotation — annotate inputs, let outputs infer
function double(n: number) {   // ✅ annotate the parameter (a boundary)
  return n * 2;                // return type inferred as number — no annotation needed
}

let a = 3;         // number (widened, because let is mutable)
const b = 3;       // 3 (literal type kept, because const can't change)

// ❌ any turns off the type checker silently
const raw: any = JSON.parse('{"n": 1}');
const wrong: number = raw.doesNotExist.atAll; // compiles! crashes at runtime.

// ✅ types are erased — this is what actually ships
function greet(name: string): string { return `hi ${name}`; }
// compiles to:  function greet(name) { return `hi ${name}`; }
```

```ts
// The boundary problem: TS trusts your annotation, the network doesn't
const user = await fetch('/api/me').then(r => r.json()); // r.json() is Promise<any>
// user is `any` — every property access is unchecked. Validate here (see Zod).
```

## ⚖️ Trade-offs

- **Inference keeps code DRY and refactor-safe** — change a return value and every caller updates. But *over*-inferring public API return types leaks internals and makes the type contract implicit; annotate exported function returns so the boundary is stable and errors surface at the definition, not the call site.
- **`any` is occasionally pragmatic** (migrating JS, genuinely dynamic metaprogramming) but it's a hole in the net, not a tool. Reach for `unknown` first.
- **Don't annotate what TS already knows.** `const n: number = 5` is noise; `const els: HTMLElement[] = [...]` where the right side is already typed is noise. Redundant annotations rot when the source changes.

## 💣 Gotchas interviewers probe

- **"Does TypeScript make my code safe at runtime?"** No. Types are erased. The only runtime safety comes from actual runtime code (validation, guards). This is the #1 thing they want you to say unprompted.
- **`let` vs `const` change inferred types.** `const s = 'GET'` is `"GET"`; `let s = 'GET'` is `string`. Matters hugely when passing to functions expecting a literal union.
- **`any` is contagious, `unknown` is contained.** Reading a property off `any` gives `any`; you can't touch `unknown` without narrowing first.
- **Excess property checks only fire on fresh object literals.** `fn({ a: 1, b: 2 })` errors on `b`; assigning to a variable first launders the check away.
- **`noImplicitAny` is the real baseline.** Without it, an un-annotated parameter is silently `any` and you get none of TS's value.

## 🎯 Say this in the interview

> "The mental model I lead with is that TypeScript is entirely compile-time — every type is erased before the code runs, so it gives me zero runtime safety. Its value is catching shape mismatches during development and powering editor tooling. Practically, I let inference do the work inside a function and I annotate the boundaries: parameters, exported return types, and anything crossing into the program from outside — network, storage, the DOM — because that's where TS can't see the real shape. I avoid `any` because it silently disables checking on everything it touches and spreads; I use `unknown` when a value is genuinely dynamic and narrow it before use. And at true runtime boundaries like `fetch`, I validate with something like Zod, because the type annotation is a promise TS can't enforce."

## 🔗 Go deeper

- [TS Handbook — Everyday types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html) — the canonical tour of the primitives and annotation syntax.
- [TS Handbook — Type inference](https://www.typescriptlang.org/docs/handbook/type-inference.html) — widening, best-common-type, and contextual typing explained.
- [TS Handbook — `any`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any) — why it opts out of checking, straight from the source.
