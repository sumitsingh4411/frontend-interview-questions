<div align="center">

# Mapped types

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 1h · `#type-ops`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A mapped type is a `for`-loop over the keys of a type: `{ [K in keyof T]: … }` visits every property, and you get to rewrite its **name** (via `as`), its **modifiers** (`readonly`, `?`, added with `+` or stripped with `-`), and its **value type**. `Partial`, `Readonly`, `Pick` and `Record` are all four-line mapped types — and none of them exist at runtime.

---

## 🧠 Mental model

Think of a mapped type as `Object.keys(T).map(...)` but running in the type checker. You iterate a union of keys and, for each one, produce a property. The union you iterate is usually `keyof T`, but it can be any `string | number | symbol` union — that distinction (are you mapping *over an existing type* or *building one from a key set*) is the whole game.

The syntax packs four independent levers into one line:

```ts
{ readonly [K in keyof T]-?: T[K] }
//  ^modifier  ^key var ^source  ^strip optional  ^value
```

Change the key with `as`, change the modifiers with `+`/`-`, change the value however you like. Everything else in this topic is just those levers.

## ⚙️ How it actually works

**Modifiers are additive by default, subtractive with `-`.** `readonly` and `?` on the mapped signature *add* those modifiers; prefix with `-` to *remove* them. This is how `Required` and `Mutable` are written:

```ts
type Partial<T>  = { [K in keyof T]?: T[K] };        // add ?
type Required<T> = { [K in keyof T]-?: T[K] };        // strip ? (and undefined)
type Mutable<T>  = { -readonly [K in keyof T]: T[K] };// strip readonly
```

**Key remapping with `as`** lets you rename or *filter* keys. The trick most people miss: mapping a key to `never` **deletes it**, because a property keyed by `never` doesn't exist. That gives you a type-level `filter`:

```ts
// Keep only the string-valued properties
type StringKeys<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};
```

**Homomorphic vs non-homomorphic** is the senior distinction. When the constraint is literally `keyof T` (a "homomorphic" mapped type), TypeScript does three special things: it **preserves** the original `readonly`/`?` modifiers, it **distributes over unions**, and it maps over **arrays and tuples as arrays/tuples** rather than mangling them into objects. Break the `keyof T` shape — e.g. `[K in SomeOtherUnion]` — and you lose all of that. This is why `Pick<T, K>` (still keyed by `keyof`-shaped `K`) preserves modifiers but a hand-rolled `Record<K, V>` does not.

**`keyof` yields `string | number | symbol`.** If you plan to remap keys with template literals you must narrow with `& string`, or `Capitalize<K>` fails on the `number | symbol` half.

Runtime reality: all of this is **erased**. `Readonly<User>` compiles to nothing; `readonly` is not enforced at runtime, and a value that lies about its shape (from `JSON.parse`, an API, a cast) sails straight through. Mapped types describe; they never guard.

## 💻 Code

```ts
// Build the four canonical utilities from scratch — this is a common interview ask
type MyPartial<T>  = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
type MyPick<T, K extends keyof T> = { [P in K]: T[P] };
type MyRecord<K extends PropertyKey, V> = { [P in K]: V };

// Key remapping: generate typed event handlers from a state shape
type State = { name: string; age: number };
type Handlers<T> = {
  [K in keyof T & string as `on${Capitalize<K>}Change`]: (value: T[K]) => void;
};
type H = Handlers<State>;
// { onNameChange: (v: string) => void; onAgeChange: (v: number) => void }

// Filter by mapping unwanted keys to never
type NonFunctionKeys<T> = {
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T]; // index by keyof to collapse the object into the surviving union
```

```ts
// Homomorphic preservation vs loss
type A = { readonly id: string; name?: string };
type KeepsModifiers = { [K in keyof A]: A[K] };      // readonly + ? preserved ✅
type LosesModifiers = { [K in 'id' | 'name']: string }; // flat, no modifiers ❌
```

## ⚖️ Trade-offs

- **Prefer the built-in utilities** (`Partial`, `Pick`, `Omit`, `Record`) over bespoke mapped types in app code — they're homomorphic, well-understood, and produce clean hover output. Roll your own only when you genuinely need remapping or filtering.
- **Key remapping produces unreadable errors.** When a mapped type is wrong, the compiler points at the *expanded* shape, not your definition. Keep the mapping shallow and name intermediate types so the failure is legible.
- **Don't reach for mapped types to enforce runtime shape.** They cannot. If the data crosses a boundary (network, `localStorage`, form input), validate with a schema library and *derive* the type from the validator — not the other way round.

## 💣 Gotchas interviewers probe

- **`-?` removes `undefined` from the value too**, not just the optional flag. `Required<{ x?: string }>` is `{ x: string }`, and the `| undefined` is gone — occasionally surprising.
- **Homomorphic mapped types preserve modifiers; non-homomorphic ones don't.** The tell is whether the constraint is `keyof T`. Interviewers love asking why `Pick` keeps `readonly` but a `Record`-style map doesn't.
- **Mapping a key to `never` deletes the property.** This is *the* idiom for type-level filtering — know it, and know the `[keyof T]` re-index trick that turns a `{ K | never }` object into a union.
- **`keyof T` includes `number | symbol`.** Template-literal remapping needs `& string`, or you get a "not assignable to string" error on the numeric keys.
- **`Record<string, V>` claims every string key exists.** Indexing it never narrows to `undefined` unless `noUncheckedIndexedAccess` is on — a classic false sense of safety.

## 🎯 Say this in the interview

> "A mapped type is a `for`-loop over a key union that lets me rewrite each property's name, modifiers, and value in one pass — `Partial`, `Readonly`, `Pick` and `Record` are all just that. The lever people forget is the modifier sign: `readonly` and `?` add by default, and I strip them with `-readonly` and `-?`, which is how `Required` works. For renaming or filtering I use `as`, and mapping a key to `never` deletes it, which gives me a type-level filter. The one distinction I always keep straight is homomorphic versus not: when I map over `keyof T` directly, TypeScript preserves the original modifiers and even maps tuples as tuples, but if I map over some other union I lose all of that. And I'm clear that none of this is a runtime guarantee — a `Readonly<T>` is erased, so anything crossing a boundary still needs real validation."

## 🔗 Go deeper

- [TS Handbook — Mapped types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html) — modifiers and `as` key remapping, from the source.
- [TS Handbook — Utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html) — every built-in mapped type; read their definitions.
- [Type Challenges](https://github.com/type-challenges/type-challenges) — the graded exercises where mapped types actually click.
