<div align="center">

# `unknown` vs `any` vs `never`

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `any` is the **opt-out** (turns off checking, contagious, dangerous); `unknown` is the **safe top type** (accepts anything but forces you to narrow before use); `never` is the **bottom type** (no value at all — the return of a throw, the empty union, the "this can't happen" branch).

---

## 🧠 Mental model

Picture the type lattice. **`unknown`** sits at the top — every type is assignable *to* it, so it's the honest container for "I don't know what this is." **`never`** sits at the bottom — it's assignable *to* every type but nothing is assignable to it, so it's "a value that cannot exist." **`any`** is off the lattice entirely — it's a switch that says "stop type-checking here," which is why it flows both up and down and quietly infects everything it touches.

The rule of thumb: **`unknown` is what you should use where you're tempted to use `any`.** Both accept any value coming in; the difference is `unknown` won't let you *do* anything with it until you prove what it is. `any` is a broken window; `unknown` is a locked door with a key you have to earn.

## ⚙️ How it actually works

**`any` disables checking bidirectionally and spreads.** `const x: any = …` means every property access, call, and assignment off `x` produces `any`, so the "unsafety" propagates to every variable derived from it. It even suppresses errors *around* it. This is why one `any` at a boundary can silently defeat type-safety across a whole module.

**`unknown` accepts everything but permits nothing** until narrowed. `const u: unknown = x` is fine, but `u.foo`, `u()`, `u + 1` are all errors. You must narrow with `typeof`, `instanceof`, a guard, or validation first. It's the correct type for `JSON.parse`, `catch` clauses (with `useUnknownInCatchVariables`), and any generic "value from outside."

**`never` is the empty set.** It's what a function that always throws or loops forever returns, what a variable has in an impossible narrowing branch, and what an empty union `T & {}` collapses to. Key behaviours: `never` is assignable to *anything* (so it slots into any exhaustiveness check), nothing except `never` is assignable *to* `never` (so it catches unhandled cases), and `never` **vanishes from unions** — `string | never` is just `string`. In distributive conditional types, `never` as input produces `never` output (the "no members to distribute" case).

## 💻 Code

```ts
// any — contagious, unsafe, silent
const a: any = JSON.parse('{}');
a.foo.bar.baz();      // ✅ compiles, ❌ crashes — no checking at all
const n: number = a;  // any flows into number with no error

// unknown — safe top type; must narrow before use
const u: unknown = JSON.parse('{}');
// u.foo;             // ❌ Error: object is of type 'unknown'
if (typeof u === 'object' && u && 'foo' in u) {
  (u as { foo: unknown }).foo; // ✅ only after narrowing
}

// never — the bottom type
function fail(msg: string): never { throw new Error(msg); } // never returns
type T = string | never;   // = string  (never disappears from unions)

// never powers exhaustiveness
type Dir = 'up' | 'down';
function move(d: Dir) {
  switch (d) {
    case 'up':   return 1;
    case 'down': return -1;
    default: const _: never = d; return _; // errors if a new Dir is added
  }
}
```

```ts
// catch clauses are `unknown` (with useUnknownInCatchVariables/strict) — not `any`
try { /* ... */ } catch (e) {
  // e.message; // ❌ e is unknown
  if (e instanceof Error) console.log(e.message); // ✅ narrow first
}
```

## ⚖️ Trade-offs

- **Default to `unknown` at every dynamic boundary** — `JSON.parse`, `fetch().json()`, `catch`, `postMessage`, event payloads. You pay a narrowing step; you get real safety. `any` there is a silent liability.
- **`any` is acceptable only** as a deliberate, localized escape hatch during migration or in genuinely untypeable metaprogramming — and even then, contain it behind a typed function so it doesn't leak.
- **`never` is a tool, not just an error.** Use it for exhaustiveness, for "this function can't return," and for pruning union members in type-level code. Seeing `never` *unexpectedly* usually means an intersection conflict or an over-narrowed generic.
- **`unknown` in public APIs** forces callers to narrow — sometimes that's the honest contract, sometimes it just pushes pain downstream; prefer a precise type if you actually know the shape.

## 💣 Gotchas interviewers probe

- **"`any` vs `unknown`?"** Both accept any value; `any` then lets you do anything (unsafe, contagious), `unknown` lets you do nothing until you narrow (safe). This is the core question — answer it crisply.
- **`never` disappears from unions** (`string | never === string`) but **dominates intersections** (`string & never === never`). Mixing these up is common.
- **`never` is assignable to everything; nothing is assignable to `never`** — that asymmetry is exactly what makes the exhaustiveness check work.
- **`any` is assignable both ways**, which is why `let n: number = someAny` compiles — a frequent source of runtime `undefined is not a function`.
- **Catch variables are `unknown`** under strict mode, not `any` — you must narrow before touching `.message`.
- **Empty arrays infer `never[]`** without context (`const xs = []` → `any[]` or `never[]` depending on flags) — a subtle source of "not assignable" errors.

## 🎯 Say this in the interview

> "`any` turns off the type checker — it accepts anything and then lets you do anything with it, and it's contagious, so one `any` at a boundary silently spreads unsafety across a module. `unknown` is the safe version of that: it also accepts any value, but it won't let me touch it until I narrow with `typeof`, a guard, or validation. So my rule is: anywhere I'm tempted to write `any` — `JSON.parse`, `fetch`, a `catch` clause — I use `unknown` instead. `never` is the opposite end: the bottom type, a value that can't exist. It's what a throwing function returns, it disappears from unions but takes over intersections, and it's assignable to everything while nothing's assignable to it — which is precisely what makes the `never` exhaustiveness check catch a missing switch case at compile time."

## 🔗 Go deeper

- [TS Handbook — `unknown`](https://www.typescriptlang.org/docs/handbook/2/functions.html#unknown) — the safe top type and why it beats `any`.
- [TS Handbook — `never`](https://www.typescriptlang.org/docs/handbook/2/functions.html#never) — the bottom type and its role in exhaustiveness.
- [TS Handbook — `any`](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#any) — how it opts out of checking.
