<div align="center">

# Indexed access types

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 30m · `#type-ops`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `T['key']` looks up the *type* of a property exactly the way `obj['key']` looks up a *value* — and because the index is itself a **type**, you can index with a union (`T['a' | 'b']`) or with `keyof`/`number` to extract member types without ever duplicating them.

---

## 🧠 Mental model

Indexing, but in the type world. If `user.name` gets you a value, `User['name']` gets you that value's *type*. The mental unlock is that the thing in the brackets isn't a string you type by hand — it's a **type**. So you can index with a union and get a union back, or index with `keyof T` to grab everything, or index an array type with `number` to get its element type. One operator, and it's how you keep derived types tied to their source.

## ⚙️ How it actually works

```ts
interface User { id: string; name: string; roles: Role[] }
type Id    = User['id'];              // string
type Names = User['id' | 'name'];     // string  (union index → union result)
type All   = User[keyof User];        // string | string | Role[]  → string | Role[]
```

**`T[number]` on an array or tuple gives the element type** — the single most useful form:

```ts
const COLORS = ['red', 'green', 'blue'] as const;
type Color = typeof COLORS[number];   // 'red' | 'green' | 'blue'
```

**Tuples respond to both literal and `number` indices:** `Pair[0]` is the first element's type; `Pair[number]` is the union of *all* element types. This distinction matters — `[0]` is one slot, `[number]` is "any slot."

**You must index with a valid key.** `User['nope']` is a compile error — unlike `Omit`, indexed access *does* validate. Nested lookups chain naturally: `Api['user']['name']`.

## 💻 Code

```ts
interface Api {
  user: { id: string; profile: { avatar: string } };
  posts: { title: string }[];
}

// ✅ Derive sub-types instead of re-declaring them
type Avatar = Api['user']['profile']['avatar'];   // string
type Post   = Api['posts'][number];               // { title: string }

// ✅ The `as const` + [number] idiom — union straight from data
const METHODS = ['GET', 'POST', 'PUT'] as const;
type Method = typeof METHODS[number];             // 'GET' | 'POST' | 'PUT'

// ✅ T[keyof T] extracts VALUE types (vs keyof T = KEY types)
type Values = Api['user'][keyof Api['user']];     // string | { avatar: string }

// ❌ Index with a runtime value — doesn't work
declare const k: string;
// type Bad = Api[k];                             // error: k is a value, not a type
// You need a generic K, or `typeof k`.
```

## ⚖️ Trade-offs

- **Prefer indexed access over re-declaring a sub-type.** `type Role = User['role']` beats copy-pasting the role union — the derived type updates automatically when `User` changes.
- **`typeof arr[number]` on an `as const` array is the canonical "union from a list" pattern** — one place to add a value, and both the array and the type grow together.
- **Deeply nested lookups (`A['b']['c']['d']`) can get unreadable.** A named intermediate (`type BC = A['b']['c']`) is often kinder to the next reader.

## 💣 Gotchas interviewers probe

- **Index with a *type*, not a *value*.** `T[key]` where `key` is a runtime `string` fails; you need `T[typeof key]` or a generic `K extends keyof T`. This trips people who think of it as bracket access.
- **`T[keyof T]` gives *value* types; `keyof T` gives *key* types.** Mixing these up is common — one is the union of what's stored, the other the union of the labels.
- **Use `arr[number]`, not `arr[0]`, for "the element type."** `arr[0]` is just the *first* slot's type, which for tuples is a specific different type from the rest.
- **Looked-up optional properties include `undefined`.** `{ x?: string }['x']` is `string | undefined` — the optionality rides along.
- **Index-signature lookups always "succeed."** `Record<string, V>['anything']` is `V` even for keys that don't exist — the type system trusts the signature. Turn on `noUncheckedIndexedAccess` and the result becomes `V | undefined`, which matches reality: `arr[i]` and `dict[k]` can be missing. A strong senior signal to name this flag.
- **Erased at runtime.** `Api['user']['id']` describes a shape you *hope* the payload has; it does nothing at runtime. Validate untrusted data — the lookup is a claim, not a check.

## 🎯 Say this in the interview

> "Indexed access is `T['key']` — it reads a property's *type* the way bracket access reads a value, and because the index is a type I can pass a union or `keyof` and get a union back. The form I use most is `typeof arr[number]` over an `as const` array to derive a union straight from the data, so there's one source of truth. Two things I keep straight: `T[keyof T]` gives me the *value* types while `keyof T` gives the *keys*, and `arr[number]` means 'any element' whereas `arr[0]` is specifically the first slot, which matters for tuples. I'd also flag `noUncheckedIndexedAccess`, because by default an index lookup hides the `undefined` that's genuinely possible at runtime — and none of this validates anything, so external data still needs a real guard."

## 🔗 Go deeper

- [TS Handbook — Indexed access types](https://www.typescriptlang.org/docs/handbook/2/indexed-access-types.html) — union indices, `T[number]`, and lookup rules.
- [TS Handbook — `keyof` types](https://www.typescriptlang.org/docs/handbook/2/keyof-types.html) — pairs with indexed access via `T[keyof T]`.
- [TS `noUncheckedIndexedAccess`](https://www.typescriptlang.org/tsconfig/#noUncheckedIndexedAccess) — why default index access lies about `undefined`.
