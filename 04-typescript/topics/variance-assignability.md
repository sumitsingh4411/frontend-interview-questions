<div align="center">

# Variance & assignability

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 1h · `#advanced`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Assignability in TypeScript is **structural**, not nominal: `A` fits where `B` is wanted if `A` has at least everything `B` needs. Variance is the rule for *containers* — `Array<Dog>` is usable as `Array<Animal>` (covariant), but a function taking `Animal` is usable where one taking `Dog` is wanted (contravariant in parameters). TS deliberately makes method parameters **bivariant** for ergonomics, which is technically unsound.

---

## 🧠 Mental model

Forget classes and `implements`. TS asks one question: *"does the shape I have satisfy the shape I need?"* If yes, it's assignable — even if the two types never heard of each other. That's **structural typing** ("duck typing with a compiler").

Variance is just structural typing applied *through* a generic. When you wrap a type in `Array<T>`, `Promise<T>`, or `(x: T) => void`, which direction does assignability flow?

```
Dog <: Animal            (Dog is a subtype of Animal)

Array<Dog>   <: Array<Animal>        ✅ covariant   — flows the same direction
(x: Animal)=>void <: (x: Dog)=>void  ✅ contravariant — flows the OPPOSITE direction
```

The mnemonic: **outputs are covariant, inputs are contravariant.** A producer of `Dog` is a producer of `Animal`. A consumer of `Animal` can stand in for a consumer of `Dog` — it's less picky, so it's safe.

## ⚙️ How it actually works

**Covariance (return positions, readable properties).** If `getPet(): Dog`, it satisfies a slot wanting `getPet(): Animal`, because every `Dog` returned is a valid `Animal`.

**Contravariance (parameter positions).** This is the counterintuitive one. A callback `(e: Event) => void` is assignable to a slot expecting `(e: MouseEvent) => void`. The handler that accepts *any* `Event` is safe when the caller only ever hands it a `MouseEvent` — it's over-qualified, not under-qualified. Under `strictFunctionTypes`, standalone function-type parameters are checked contravariantly and TS will reject the unsafe direction.

**Bivariance — the deliberate hole.** `strictFunctionTypes` only tightens *function-type* properties, **not methods**. A method `push(x: T): void` is checked **bivariantly** — assignable in both directions. This is unsound, and TS chose it on purpose so `Array<Dog>` stays assignable to `Array<Animal>` (arrays have `push`, a `T` in input position) without drowning real code in errors. It's a pragmatic sound-vs-usable trade.

```ts
interface Handler<T> { handle(x: T): void }   // method → bivariant
type HandlerFn<T> = { handle: (x: T) => void } // property fn → contravariant
```

**Variance annotations (`in` / `out`, TS 4.7+).** You can now *state* intended variance on type params — `interface Box<out T>` — and TS will error if your usage contradicts it. Mostly a correctness/documentation tool for library authors.

The escape hatch to remember: `any` is assignable to and from everything (it disables the check), whereas `unknown` is assignable *from* everything but *to* nothing without narrowing — `unknown` is the type-safe top type.

## 💻 Code

```ts
class Animal { legs = 4 }
class Dog extends Animal { bark() {} }

// Covariance — return/read positions flow with the subtype
const dogs: Dog[] = [new Dog()];
const animals: Animal[] = dogs;   // ✅ Array is (unsoundly) covariant

// The classic hole this opens:
animals.push(new Animal());       // ✅ compiles… but dogs now holds a non-Dog
dogs[1].bark();                   // 💥 runtime crash — bark is undefined

// Contravariance — a broader consumer is a valid narrower consumer
type Listener = (e: MouseEvent) => void;
const broad = (e: Event) => {};
const l: Listener = broad;         // ✅ accepting more is safe

// strictFunctionTypes catches the UNSAFE direction on function-typed params:
type Narrow = (e: MouseEvent) => void;
const wide: (e: Event) => void = (e: MouseEvent) => e.button; // ❌ error under strict
```

## ⚖️ Trade-offs

- **Structural typing is a feature, not a compromise.** It's why you can type third-party data without owning the class, and why `{ x: 1, y: 2 }` satisfies `Point` with no ceremony. The cost: two unrelated types with the same shape are silently interchangeable — sometimes you *want* nominal distinctness (see branding).
- **Bivariant methods buy ergonomics at the price of soundness.** In practice the unsound array-covariance escape rarely bites, because most code reads arrays far more than it mutates them through an aliased wider type. Know it's there; don't lose sleep over it.
- **When you need nominal typing**, TS won't give it to you natively — reach for **branded types** (`type UserId = string & { __brand: 'UserId' }`) so a raw `string` can't slip into a `UserId` slot despite being structurally identical.

## 💣 Gotchas interviewers probe

- **"Is `Dog[]` assignable to `Animal[]`?"** Yes — and it's *unsound*. The senior answer names the covariance, then immediately flags that `push` on the widened alias can corrupt the array. Saying "yes" without the caveat is a partial answer.
- **Parameters are contravariant, not covariant.** Most candidates assume everything flows with the subtype. The `(e: Event) => void` fits where `(e: MouseEvent) => void` is wanted example separates people who've read the spec from people who've guessed.
- **`strictFunctionTypes` does nothing to methods.** If someone claims strict mode makes function checking fully sound, that's wrong — method bivariance is exempt by design.
- **`any` vs `unknown`.** `any` opts *out* of variance entirely; `unknown` stays sound. Reaching for `any` to "fix" a variance error is a smell.
- **Excess property checks are not variance.** `{ x, y, z }` assigned to `Point` errors on a *fresh object literal* only — the same object through a variable is fine. People conflate this with structural mismatch.

## 🎯 Say this in the interview

> "TypeScript is structurally typed, so assignability is 'do I have at least the shape you need', regardless of declared inheritance. Variance is that same rule through a generic. The core intuition is outputs are covariant, inputs are contravariant: a function that returns a `Dog` satisfies one that should return an `Animal`, but a function that *accepts* an `Animal` satisfies one that should accept a `Dog`, because it's less picky. The famous unsound spot is arrays — `Dog[]` is assignable to `Animal[]`, and then `push`-ing an `Animal` corrupts it. TS keeps that hole deliberately by checking method parameters bivariantly for ergonomics; `strictFunctionTypes` only tightens standalone function-typed parameters. When I actually need types to be distinct despite identical shapes, I brand them, because structural typing won't stop a bare `string` landing in a `UserId` slot otherwise."

## 🔗 Go deeper

- [TS Handbook — Type compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) — the canonical structural-typing and variance reference.
- [TS 2.6 release notes — strictFunctionTypes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-6.html) — exactly what the flag does and why methods are exempt.
- [TS 4.7 — Optional variance annotations](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-7.html#optional-variance-annotations-for-type-parameters) — the `in`/`out` markers.
- [MDN — Structural vs nominal typing](https://developer.mozilla.org/en-US/docs/Glossary/Type) — background on the two models.
