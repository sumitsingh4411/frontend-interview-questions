<div align="center">

# `keyof` & `typeof`

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 30m · `#type-ops`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `keyof T` produces the **union of `T`'s property keys** as a type; `typeof value` **lifts a runtime value up into the type world**. Chained as `keyof typeof obj`, they let a type track a real object instead of you hand-maintaining a parallel union that drifts.

---

## 🧠 Mental model

TypeScript has two worlds: **values** (things that exist at runtime) and **types** (things erased at compile time). Most operators live in exactly one. `typeof` is the bridge *upward* — value → type. `keyof` operates *within* the type world — type → the union of its keys. Neither crosses back down; you can't `keyof` a value or `typeof` a type.

The reason to care is drift. If you write a config object *and* a `type Keys = 'a' | 'b'` union by hand, they will eventually disagree. `keyof typeof config` derives the union *from the object*, so it can never fall out of sync.

## ⚙️ How it actually works

**`keyof` turns a type into a union of its keys:**

```ts
type P = { a: number; b: string };
type K = keyof P;                 // 'a' | 'b'
```

**`typeof` (in type position) is a *type query*** — distinct from the JavaScript runtime operator that returns `"string"`. It reads the *static* type of a value in scope:

```ts
const config = { host: 'localhost', port: 5432 };
type Config = typeof config;      // { host: string; port: number }
```

**The combo derives a union from real data.** `keyof typeof config` = `'host' | 'port'`. Add `as const` and both the keys *and* the literal values stay narrow, so you can build a value-union too:

```ts
const ROLES = ['admin', 'editor', 'viewer'] as const;
type Role = typeof ROLES[number];  // 'admin' | 'editor' | 'viewer'
```

**Watch the index-signature case:** `keyof { [k: string]: V }` is `string | number` — *not* `string` — because JS silently coerces numeric keys to strings, so numeric indexing is always legal. Same for `keyof Record<string, V>`.

## 💻 Code

```ts
// A getter that's provably safe against typos
function pluck<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const user = { id: 1, name: 'Ada' };
pluck(user, 'name');              // string
// pluck(user, 'nope');           // ❌ 'nope' is not keyof typeof user

// Turn a const object into a single source of truth
const STATUS = { active: 1, archived: 2 } as const;
type StatusKey = keyof typeof STATUS;         // 'active' | 'archived'
type StatusCode = typeof STATUS[StatusKey];   // 1 | 2

// keyof an index signature is WIDER than you expect
type Dict = { [k: string]: number };
type DictKeys = keyof Dict;       // string | number  (not just string!)
```

## ⚖️ Trade-offs

- **`keyof typeof` over an `as const` object is usually better than a TS `enum`** — one source of truth, no runtime enum object, tree-shakeable, and the values stay real literals you can log and serialise.
- **`keyof` on a type with an index signature gives `string | number`,** which is often too wide to be useful as an exhaustive key list — reach for a closed object + `as const` when you need exact keys.
- **`typeof` only reads values already in scope** and never evaluates them — you can't `typeof someExpression()` to get a call result (that's `ReturnType`); `typeof fn` gives the *function* type.

## 💣 Gotchas interviewers probe

- **There are two `typeof`s.** The runtime operator (`typeof x === 'string'`, returns a string, used for narrowing) and the type-query (`typeof x` in type position, returns a type). Same keyword, opposite worlds — conflating them is a classic tell.
- **`keyof` of an index-signature type is `string | number`,** not `string`. Numeric-key coercion catches almost everyone.
- **`keyof any` is `string | number | symbol`** — which is exactly the built-in `PropertyKey`.
- **Object numeric keys are strings at runtime but `number` to `keyof`.** `{ 0: 'x' }` — `keyof` reports `0` (a number), yet `Object.keys` gives `['0']`. The type world and runtime disagree here.
- **All of it is erased.** `keyof typeof apiResponse` is a compile-time claim about a shape; a value parsed from JSON isn't guaranteed to have those keys. If the object comes from outside your program, validate it — the type is documentation, not a guard.

## 🎯 Say this in the interview

> "`keyof` gives me the union of a type's keys, and `typeof` — in type position — lifts a runtime value into the type world; it's a type query, totally separate from the JavaScript `typeof` operator that returns a string. The pattern I use constantly is `keyof typeof someConst` so a key union is derived *from* the real object and can't drift from it, and with `as const` I can pull the value union out too via `typeof OBJ[keyof typeof OBJ]`. The gotcha I'd flag is that `keyof` on an index signature is `string | number`, not `string`, because JS coerces numeric keys. And I keep in mind it's all erased — it describes a shape, it doesn't verify one, so untrusted input still needs a runtime check."

## 🔗 Go deeper

- [TS Handbook — `keyof` types](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) — including the index-signature `string | number` case.
- [TS Handbook — `typeof` types](https://www.typescriptlang.org/docs/handbook/2/typeof-types.html) — the type-query operator and its limits.
- [TS Handbook — Indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) — pairs with `keyof` to pull value types out (`T[keyof T]`).
