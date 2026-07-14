<div align="center">

# Literal & enum types

<sub>🔷 TypeScript · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A **literal type** narrows a primitive to one exact value (`'GET'`, `200`, `true`), and a union of literals is the idiomatic "enum"; the `enum` *keyword* generates real runtime objects with quirks (reverse mappings, non-erasable), so prefer **union literals** or **`as const` objects** unless you specifically need a runtime value.

---

## 🧠 Mental model

Most of what people reach for `enum` to do is better served by a **union of literal types**: `type Method = 'GET' | 'POST'`. It's zero-runtime (fully erased), auto-completes, and is just a `string` at runtime so it interops with JSON, APIs, and third-party code without conversion.

The tension is that `enum` is the one TS construct that **emits JavaScript**. Everything else in TS disappears; `enum` leaves an object behind. That makes it *both* a type and a value — occasionally useful, but it breaks the clean "types are erased" mental model and introduces behaviours (reverse mapping, ambient-vs-const differences) that surprise people. The staff move is knowing the trade and defaulting to union literals or `as const`.

## ⚙️ How it actually works

**Literal widening** is the gotcha. `const m = 'GET'` infers `'GET'`, but `let m = 'GET'` widens to `string`, and object properties widen too: `{ method: 'GET' }` has type `{ method: string }`. To pin literals, use `as const`, which makes everything deeply `readonly` and narrow.

**Numeric enums** generate a *bidirectional* map at runtime: `enum E { A }` produces `{ A: 0, 0: "A" }`, so `E[0] === "A"`. This reverse mapping bloats output and lets invalid numbers slip in (`E` accepts any `number`-ish value in some positions). **String enums** don't reverse-map and are safer but still emit an object and aren't structurally typed — two string enums with identical members are *not* assignable to each other (nominal behaviour, unusual for TS).

**`const enum`** inlines values at call sites and emits nothing — fast and small — but it's incompatible with isolated-module bundlers (esbuild, SWC, Babel) and with `--isolatedModules`, so most modern toolchains ban it. The `as const` object pattern gives you the same ergonomics with none of these issues.

## 💻 Code

```ts
// ✅ Union of literals — the default. Zero runtime, JSON-friendly.
type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';
function request(m: Method, url: string) {/* ... */}
request('GET', '/x');   // autocompletes, narrows
// request('get', '/x'); // ❌ Error: 'get' not assignable to Method

// ✅ as const object — when you also need the runtime values
const Status = { Active: 'active', Banned: 'banned' } as const;
type Status = typeof Status[keyof typeof Status]; // 'active' | 'banned'
Object.values(Status); // real array at runtime

// ⚠️ enum keyword — emits runtime code, reverse-maps numbers
enum Color { Red, Green } // { Red:0, Green:1, 0:'Red', 1:'Green' }
Color[0]; // 'Red' — reverse mapping, extra output

// Widening trap
const a = 'GET';        // type 'GET'
let b = 'GET';          // type string (widened)
const o = { m: 'GET' }; // { m: string } — property widened
const o2 = { m: 'GET' } as const; // { readonly m: 'GET' }
```

```ts
// Exhaustiveness: unions + never catch missing cases at compile time
function label(s: Status) {
  switch (s) {
    case 'active': return 'On';
    case 'banned': return 'Off';
    default: { const _x: never = s; return _x; } // ❌ compile error if a case is unhandled
  }
}
```

## ⚖️ Trade-offs

- **Union literals win by default:** erased, structural, JSON-native, and trivially exhaustiveness-checkable. When there's no runtime need, there's no reason to reach further.
- **`as const` objects** are the right call when you need to *iterate* the values or reference them at runtime (dropdown options, a lookup table) — you get both the values and a derived literal union from one source of truth.
- **`enum` earns its place** rarely: when you want a named runtime namespace *and* a type from a single declaration and you're not in an isolated-modules bundler. Prefer **string enums** over numeric to avoid reverse-mapping and loose numeric assignment.
- **Avoid `const enum`** in app code — it breaks under most modern bundlers and `isolatedModules`. Its performance benefit is negligible next to the tooling pain.

## 💣 Gotchas interviewers probe

- **"Is `enum` erased like other types?"** No — it emits a runtime object. It's the notable exception to "types disappear," and numeric enums also emit a reverse map.
- **Numeric enums accept out-of-range numbers** in some positions and reverse-map; string enums are safer but behave *nominally*, unlike the rest of structural TS.
- **Literal widening:** `const` keeps the literal, `let` and object properties widen to the base primitive. `as const` is how you lock them.
- **`const enum` is a trap** in Babel/esbuild/SWC and under `isolatedModules` — it assumes whole-program info those tools don't have.
- **Exhaustiveness via `never`** is the payoff of literal unions: assign the switch variable to `never` in `default` and the compiler flags any unhandled case when the union grows.

## 🎯 Say this in the interview

> "I default to unions of literal types over the `enum` keyword. A union like `'GET' | 'POST'` is fully erased, it's just a string at runtime so it's JSON- and API-friendly, and it auto-completes. The `enum` keyword is the one TS feature that emits runtime JavaScript — it's both a type and a value — and numeric enums generate a reverse map and accept loose numbers, so if I do use one I pick a string enum. When I need the values at runtime, say for a dropdown, I use an `as const` object and derive the union with `typeof obj[keyof typeof obj]`, giving one source of truth. I'd also flag that `const enum` breaks under esbuild and `isolatedModules`, so I avoid it. And the big payoff of literal unions is exhaustiveness checking with a `never` in the default branch."

## 🔗 Go deeper

- [TS Handbook — Literal types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html#literal-types) — literal narrowing and widening.
- [TS Handbook — Enums](https://www.typescriptlang.org/docs/handbook/enums.html) — numeric vs string, reverse mapping, `const enum` caveats.
- [TS Handbook — `as const` (const assertions)](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions) — locking literals and building enum-like objects.
