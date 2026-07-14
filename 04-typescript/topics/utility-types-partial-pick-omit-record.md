<div align="center">

# Utility types (Partial/Pick/Omit/Record…)

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#utility-types`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Utility types are just the standard library's pre-built **mapped and conditional types**: `Partial`, `Pick`, `Omit`, `Record` *derive* a variant of a type you already have instead of you re-declaring the shape. They're pure compile-time transforms — none of them exist or validate anything at runtime.

---

## 🧠 Mental model

DRY, applied to types. You keep **one** source-of-truth type and derive every variant from it: the update payload is `Partial<User>`, the API response is `Omit<User, 'passwordHash'>`, the lookup table is `Record<UserId, User>`. Deriving beats duplicating because when the base type changes, every derived type moves with it — a hand-copied interface silently drifts.

The trick to *reading* them is knowing they're not magic keywords — they're ordinary type-level functions built from `keyof`, mapped types, and conditional types. Once you can read their one-line definitions, you can predict their behaviour instead of memorising it.

## ⚙️ How it actually works

Most are two lines. The definitions *are* the explanation:

```ts
type Partial<T>  = { [P in keyof T]?: T[P] };      // add ?
type Required<T> = { [P in keyof T]-?: T[P] };     // remove ? (the -? modifier)
type Readonly<T> = { readonly [P in keyof T]: T[P] };
type Pick<T, K extends keyof T> = { [P in K]: T[P] };
type Record<K extends keyof any, V> = { [P in K]: V };
type Exclude<T, U> = T extends U ? never : T;      // conditional, distributes
type Omit<T, K extends keyof any> = Pick<T, Exclude<keyof T, K>>;
```

Three families worth grouping:

| Family | Members | Built from |
|---|---|---|
| Object-shape transforms | `Partial` `Required` `Readonly` `Pick` `Omit` `Record` | mapped types |
| Union filters | `Exclude` `Extract` `NonNullable` | conditional types |
| Function / inference | `ReturnType` `Parameters` `InstanceType` `Awaited` | `infer` |

The killer detail hides in `Omit`: its key parameter is `K extends keyof any` — **not** `keyof T`. So `Omit` never checks that the keys you remove actually exist. `Pick`, by contrast, is constrained to `keyof T` and will reject a typo.

## 💻 Code

```ts
interface User { id: string; name: string; email: string; passwordHash: string }

// ✅ Derive variants — one source of truth
type PublicUser = Omit<User, 'passwordHash'>;      // { id; name; email }
type UserPatch  = Partial<Pick<User, 'name' | 'email'>>;
type UsersById  = Record<string, User>;            // { [k: string]: User }

// ❌ Omit does NOT validate its keys — this typo compiles silently
type Oops = Omit<User, 'passwrd'>;                 // no error; still has passwordHash!

// ✅ Pick WOULD catch it
// type Bad = Pick<User, 'passwrd'>;               // ❌ error, good

// Inference helpers pair with `typeof`
function load() { return { ok: true, data: [1] }; }
type Loaded = ReturnType<typeof load>;             // { ok: boolean; data: number[] }
```

## ⚖️ Trade-offs

- **Prefer `Pick` when the keep-list is short; reach for `Omit` when the drop-list is short** — but know `Pick` is the *safer* of the two because it type-checks its keys and `Omit` doesn't.
- **`Partial`, `Readonly`, `Required` are shallow.** They touch only the top level. A `DeepPartial<T>` is writable but often a smell — if you need deep-optional everywhere, your type is probably doing too much.
- **Chained utilities get unreadable fast.** `Partial<Omit<Pick<T, K>, J>>` is technically fine and practically hostile; a named intermediate type or an explicit interface often reads better.
- **Zero runtime effect.** `Partial<User>` doesn't make anything optional at runtime, and *nothing* here validates. A value typed `PublicUser` coming off the wire can still be garbage.

## 💣 Gotchas interviewers probe

- **`Omit` doesn't type-check its keys.** `Omit<User, 'passwrd'>` (typo) compiles and silently keeps the field. This is the single highest-value gotcha here — it's why some teams ban `Omit` in favour of `Pick` or a stricter custom `StrictOmit`.
- **`Readonly` is compile-time only.** It stops *TypeScript* from letting you assign; it does nothing at runtime. `Object.freeze` is the runtime counterpart (and even that is shallow).
- **`Record<string, V>` is an open index signature; `Record<'a' | 'b', V>` is a *closed*, exhaustive set.** Very different — one accepts any key, one requires exactly those two.
- **All of these are erased.** A `Partial<Config>` you got from `JSON.parse` is a *claim*, not a guarantee. Validate at the boundary (Zod, a hand-written guard) — the utility type gives you editor safety, not input safety.
- **`ReturnType<typeof fn>` needs `typeof`** — `ReturnType<fn>` (passing the value) is an error; you must lift the function into type space first.

## 🎯 Say this in the interview

> "Utility types are the standard library's pre-built mapped and conditional types — they let me keep one source-of-truth type and derive the variants: `Partial` for a patch, `Omit` for a public DTO, `Record` for a lookup. I lean on them so derived types can't drift from the base. The gotcha I always call out is that `Omit`'s key argument is `keyof any`, not `keyof T`, so it won't catch a typo'd key — `Pick` will, because it's constrained to real keys, so I prefer `Pick` when the keep-list is small. And I'm clear that all of this is erased: `Readonly` and `Partial` are compile-time only, they don't freeze or validate anything, so untrusted input still gets a real runtime check at the boundary."

## 🔗 Go deeper

- [TS Handbook — Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — the full catalogue with signatures.
- [TS Handbook — Mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) — how `Partial`/`Pick`/`Record` are actually built.
- [TS source — `lib.es5.d.ts`](https://github.com/microsoft/TypeScript/blob/main/src/lib/es5.d.ts) — read the real one-line definitions; nothing demystifies them faster.
