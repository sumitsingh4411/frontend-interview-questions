<div align="center">

# Template literal types

<sub>🔷 TypeScript · 🔴 Hard · ⏱ 1h · `#type-ops` `#advanced`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Template literal types are string interpolation *in the type system*: `` `on${Capitalize<K>}` `` builds new string-literal types from existing ones, and — crucially — the same syntax runs **backwards** with `infer` to parse a string apart. They turn stringly-typed APIs (event names, routes, CSS values) into checked ones, at the risk of combinatorial union blow-ups.

---

## 🧠 Mental model

You already know backtick strings at the value level. Template literal *types* are the exact same idea one level up: `` `hello ${World}` `` where `World` is a type, not a value. Feed it a **union** and it expands the **cross product**:

```ts
type Size = 'sm' | 'lg';
type Kind = 'primary' | 'ghost';
type Class = `btn-${Kind}-${Size}`;
// 'btn-primary-sm' | 'btn-primary-lg' | 'btn-ghost-sm' | 'btn-ghost-lg'
```

That cross-product is the source of both the power (exhaustive, checked string sets) and the danger (four unions of ten members is 10,000 literals — enough to choke the compiler).

## ⚙️ How it actually works

**Four intrinsic string manipulators** ship built in — the only string functions the type system has:

```ts
type A = Uppercase<'abc'>;     // 'ABC'
type B = Lowercase<'ABC'>;     // 'abc'
type C = Capitalize<'abc'>;    // 'Abc'
type D = Uncapitalize<'Abc'>;  // 'abc'
```

**Inference runs the template backwards.** Put `infer` inside a template pattern and you *parse* a literal, capturing the pieces:

```ts
type Route = '/users/:userId/posts/:postId';
type ParamOf<S> =
  S extends `${string}:${infer P}/${infer Rest}` ? P | ParamOf<`/${Rest}`>
  : S extends `${string}:${infer P}` ? P
  : never;
type P = ParamOf<Route>; // 'userId' | 'postId'
```

**`${string}` and `${number}` are wildcards.** `` `${number}px` `` matches any numeric-prefixed pixel string; `` `#${string}` `` matches any hex-ish string. This is pattern-matching, not validation — `` `${number}px` `` accepts `'1.2.3px'` because `${number}` is loose about what a "number literal" looks like.

**Key remapping is where they earn their keep.** Combined with mapped types, template literals generate whole APIs from a data shape — `get`/`set` pairs, `onXChange` handlers, `--css-var` names — all fully checked and refactor-safe.

**`keyof` gives `string | number | symbol`.** Template literals only accept the string/number/bigint/boolean parts, so you routinely intersect with `& string` before interpolating an object's keys.

Runtime reality: **all erased.** `` `btn-${Kind}` `` produces no string at runtime — the *values* still come from your JavaScript. A template literal type constrains what a string *may be*; it does nothing to build or validate one. If a route string arrives from the network, its literal type is a fiction until you check it.

## 💻 Code

```ts
// Generate a fully-typed event emitter surface from an event map
type Events = { login: { userId: string }; logout: void };

type Listeners<E> = {
  [K in keyof E & string as `on${Capitalize<K>}`]: (payload: E[K]) => void;
};
type L = Listeners<Events>;
// { onLogin: (p: { userId: string }) => void; onLogout: (p: void) => void }
```

```ts
// Type-safe CSS length values — reject unit-less numbers at compile time
type Unit = 'px' | 'rem' | '%' | 'vh';
type Length = `${number}${Unit}`;

const ok:  Length = '16px';   // ✅
const bad: Length = '16';     // ❌ Type '"16"' is not assignable to type Length
```

```ts
// Parse a query string key path — template inference as a mini-parser
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}` ? [Head, ...Split<Tail, D>] : [S];
type Keys = Split<'a.b.c', '.'>; // ['a', 'b', 'c']
```

## ⚖️ Trade-offs

- **Combinatorial explosion is real and it's a compile-time cost.** Every union you interpolate multiplies. Two 50-member unions is a 2,500-literal type that lags IntelliSense on every keystroke. Keep the interpolated unions small, or generate the concrete strings at build time.
- **Great for closed sets, wrong for open ones.** Design-token classes, a fixed event vocabulary, a known route table — perfect. Arbitrary user strings — pointless, because `${string}` matches everything and you've bought nothing.
- **Parsing types are fragile.** A template-inference parser silently returns `never` when the input doesn't match its assumed shape. That's a real bug that produces no error until something downstream breaks — cover it with assertion types.

## 💣 Gotchas interviewers probe

- **Union interpolation is a cross product**, not a zip. `` `${A}-${B}` `` with two 3-member unions is 9 literals, not 3. This is how people accidentally create 100k-member types.
- **`${number}` is a loose matcher.** `` `${number}px` `` accepts malformed numerics like `'1e3px'` or `'1.2.3px'` in some cases — it's a pattern, not a numeric validator.
- **You must `& string` object keys before interpolating**, because `keyof T` includes `number | symbol`, which can't go in a template literal.
- **`Capitalize`/`Uppercase` are the *only* string ops** — there's no `Replace`, `Trim`, or `Split` built in; you build those recursively with `infer`, and they hit the recursion-depth cap on long strings.
- **The type doesn't produce the value.** A variable of type `` `on${Capitalize<K>}` `` still needs the actual string written in JS; the type only checks it.

## 🎯 Say this in the interview

> "Template literal types are string interpolation in the type system — `` `on${Capitalize<K>}` `` builds new literal types, and the same syntax runs backwards with `infer` so I can parse a string apart, which is how you type route params or a dotted key path. The behaviour I flag is that interpolating a union expands the cross product, so two large unions multiply into a huge type that slows the compiler — I keep the interpolated sets small or codegen the literals. There are only four built-in string ops — `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize` — anything like split or replace I write recursively and it hits the depth cap on long inputs. Where they shine is closed vocabularies: event names, design tokens, CSS units. And since it's all erased, the type constrains what a string may be but never produces or validates the actual value — a route that arrives at runtime still needs a real check."

## 🔗 Go deeper

- [TS Handbook — Template literal types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html) — the four intrinsics and inference, canonical.
- [TS 4.1 release notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html#template-literal-types) — the feature's original design and motivation.
- [Type Challenges](https://github.com/type-challenges/type-challenges) — string-parsing exercises that build the muscle.
