<div align="center">

# `strict` mode & flags

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 30m · `#config`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `strict: true` is not one flag, it's an **umbrella** that turns on ~8 independent checks — the important ones being `strictNullChecks` (null/undefined stop being assignable to everything) and `noImplicitAny` (untyped values error instead of silently becoming `any`). Without strict, TypeScript is a linter that lies to you; with it, the types actually mean something.

---

## 🧠 Mental model

Think of `strict` as the line between "TypeScript that catches bugs" and "TypeScript as expensive syntax highlighting." The single most valuable member is `strictNullChecks`: with it off, `null` and `undefined` inhabit *every* type, so `user.name.toUpperCase()` compiles even when `user` can be `null` — and then crashes. With it on, `null` is its own thing you must narrow away, and the compiler forces you to handle the empty case. The billion-dollar mistake, fixed at the type level.

`strict` is a *meta-flag*: setting it flips a family of sub-flags to `true`. You can then selectively opt *out* of individual ones (`strict: true` + `"strictNullChecks": false`), which is exactly how you stage a migration.

## ⚙️ How it actually works

`strict: true` enables (as of current TS) this family:

| Flag | What it forbids |
|---|---|
| `strictNullChecks` | Treating `null`/`undefined` as members of other types |
| `noImplicitAny` | Values whose type can't be inferred silently becoming `any` |
| `strictFunctionTypes` | Unsound contravariant function-parameter assignments |
| `strictBindCallApply` | Wrongly-typed `.bind`/`.call`/`.apply` arguments |
| `strictPropertyInitialization` | Class fields not assigned in the constructor (needs `strictNullChecks`) |
| `noImplicitThis` | `this` of implicit `any` type |
| `useUnknownInCatchVariables` | `catch (e)` giving `e: any` instead of `unknown` |
| `alwaysStrict` | Emitting without JS `"use strict"` |

Crucially, `strict` is **erased at runtime** — like all of TypeScript, it changes *nothing* in the emitted JS except `alwaysStrict`'s `"use strict"` pragma. It's purely a compile-time contract.

Flags people wrongly assume are part of strict but **aren't**: `noUncheckedIndexedAccess` (makes `arr[i]` return `T | undefined` — arguably the most valuable non-strict flag), `exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, and `noImplicitOverride`. These are opt-in on top of strict.

## 💻 Code

```jsonc
// tsconfig.json — the baseline every new project should ship
{
  "compilerOptions": {
    "strict": true,
    // Not in `strict`, but you almost always want them:
    "noUncheckedIndexedAccess": true, // arr[i] is T | undefined — forces bounds handling
    "noImplicitOverride": true,       // must write `override` when overriding
    "noFallthroughCasesInSwitch": true
  }
}
```

```ts
// strictNullChecks OFF → this compiles and crashes at runtime:
function greet(name: string) { return name.toUpperCase(); }
greet(null);  // ❌ no error without the flag; 💥 TypeError at runtime

// strictNullChecks ON → the compiler forces the guard:
function greetSafe(name: string | null) {
  if (name == null) return "hi";        // ✅ must narrow first
  return name.toUpperCase();
}

// noUncheckedIndexedAccess ON → the off-by-one the type system now catches:
const xs = [1, 2, 3];
const first = xs[0];   // type is number | undefined, not number
first.toFixed();       // ❌ error until you handle undefined
```

## ⚖️ Trade-offs

- **Turn `strict` on from day one on greenfield.** It's near-free early and brutally expensive to retrofit later, because every unhandled null is a latent bug your team has been ignoring.
- **On a legacy codebase, migrate incrementally.** Set `strict: true` then disable the loudest sub-flag (usually `strictNullChecks`), fix the rest, and re-enable it directory-by-directory. Don't leave `strict: false` — you lose the cheap wins (`noImplicitThis`, `strictBindCallApply`) for no reason.
- **`noUncheckedIndexedAccess` is high-value but noisy.** It's correct — array/record access *can* be undefined — but it forces guards on every lookup. Teams that lean heavily on `map[key]` sometimes find the friction not worth it; know it's a deliberate call, not an oversight.
- **When NOT to obsess:** flags like `exactOptionalPropertyTypes` catch a narrow class of bug (`{ x: undefined }` vs `{}`) and can generate churn disproportionate to value on some codebases.

## 💣 Gotchas interviewers probe

- **"Is `strict` a single flag?"** No — it's an umbrella of ~8. Naming even three or four sub-flags signals you actually configure projects rather than copy a tsconfig.
- **`strict` does nothing at runtime.** A candidate who thinks strict mode adds runtime checks doesn't understand type erasure. The *only* emit difference is `alwaysStrict`'s `"use strict"`.
- **`strictPropertyInitialization` depends on `strictNullChecks`.** Disabling the latter silently disables the former — a common "why isn't this erroring?" moment.
- **`noUncheckedIndexedAccess` is NOT in `strict`.** Many assume it is. It's separately opt-in, and it's arguably the flag that catches the most real bugs after `strictNullChecks`.
- **`useUnknownInCatchVariables` makes `catch (e)` give `unknown`, not `any`.** People writing `e.message` directly break under strict and must narrow (`e instanceof Error`).
- **Adding flags is a *code* change, not just config.** Flipping a flag can surface hundreds of errors — it's a migration, and you scope it like one.

## 🎯 Say this in the interview

> "`strict` is a meta-flag — it switches on about eight independent checks. The one that matters most is `strictNullChecks`: without it, `null` and `undefined` are assignable to every type, so the compiler happily lets you deref something that can be null and it crashes at runtime. With it on, null is its own type you have to narrow away. `noImplicitAny` is the other big one — it stops values silently degrading to `any`. I turn `strict` on from the first commit on new projects because retrofitting it later means auditing every latent null bug at once. On top of strict I usually add `noUncheckedIndexedAccess` so array indexing returns `T | undefined`, which is technically correct and catches real off-by-ones. And I'd flag that none of this exists at runtime — it's all erased; the only emit change is the `use strict` pragma."

## 🔗 Go deeper

- [TSConfig reference — strict](https://www.typescriptlang.org/tsconfig#strict) — the authoritative list of what the umbrella enables.
- [TSConfig — noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess) — the high-value flag that isn't in strict.
- [TS 2.0 — strictNullChecks](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-0.html) — the origin and rationale of null-safety.
- [Total TypeScript — tsconfig cheat sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) — a pragmatic, opinionated baseline config.
