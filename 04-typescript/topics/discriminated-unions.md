<div align="center">

# Discriminated unions

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#patterns` `#state`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A discriminated (tagged) union is a set of object types sharing a single **literal** field (`kind`, `status`, `type`) that the compiler uses to narrow the whole union in a `switch`/`if`; it's the single best pattern in TS for modelling state, because it makes **impossible states unrepresentable** and gives you compile-time exhaustiveness.

---

## 🧠 Mental model

The anti-pattern it replaces is the **bag of optional fields**: `{ isLoading: boolean; data?: T; error?: Error }`. That type permits nonsense — loading *and* errored, or data *and* an error at once — states your UI must defensively guard against forever. A discriminated union says: a request is *exactly one* of `{ status: 'loading' }`, `{ status: 'success'; data: T }`, or `{ status: 'error'; error: Error }`. The illegal combinations literally cannot be constructed.

The "discriminant" is a shared **literal-typed** property. When you check `state.status === 'success'`, TS narrows the union to just that member and unlocks its `data` field. One boolean-ish field turns an ambiguous shape into a state machine the compiler enforces.

## ⚙️ How it actually works

Narrowing works only when the tag is a **literal type**, not a widened primitive. `{ status: string }` can't discriminate — the compiler can't map `'success'` back to one member. This is why `as const` and literal fields matter: `status: 'success'` gives `'success'`, but a plain `let s = 'success'` widens to `string` and breaks narrowing.

The payoff is **exhaustiveness checking** via `never`. In a `switch (state.status)`, once you've handled every case, the `default` branch narrows `state` to `never` — the empty type. Assigning it to a `never`-typed variable compiles today; add a new union member tomorrow and that assignment *fails to compile*, pointing you at every unhandled `switch`. This turns "did I update all the call sites?" from a runtime bug hunt into a compiler error.

Discriminants can be shared across members with different types — TS handles `type: 'a' | 'b'` on one member and `type: 'c'` on another. And the discriminant doesn't have to be a string; numbers, booleans, and even `null`/`undefined` presence via `in` all work, though a string literal `kind` is the clearest.

## 💻 Code

```ts
// ✅ Model state as a discriminated union — impossible states can't exist
type RequestState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }        // data ONLY exists here
  | { status: 'error'; error: Error };    // error ONLY exists here

function render(s: RequestState<string>) {
  switch (s.status) {
    case 'idle':    return 'Start';
    case 'loading': return 'Spinner';
    case 'success': return s.data;         // ✅ data is available & typed
    case 'error':   return s.error.message;
    default: {
      const _exhaustive: never = s;        // ✅ compile error if a case is added & unhandled
      return _exhaustive;
    }
  }
}
```

```ts
// ❌ The bag-of-flags anti-pattern — permits impossible states
type Bad = { loading: boolean; data?: string; error?: Error };
const b: Bad = { loading: true, data: 'x', error: new Error() }; // nonsense, but legal

// Narrowing needs a LITERAL discriminant
type Ok = { kind: 'a'; x: number } | { kind: 'b'; y: string };
declare let k: string;
// if (shape.kind === k) — ❌ won't narrow; k is widened `string`, not a literal
```

## ⚖️ Trade-offs

- **This is the default for anything with states** — fetch results, form status, WebSocket connection, reducer actions. If you're reaching for multiple `boolean`s or optional fields that are only valid together, you want a discriminated union.
- **Exhaustiveness checking is the killer feature** — the `never` trick converts "you forgot a case" into a build failure, which is why Redux/reducer actions are almost always tagged unions.
- **When *not* to:** if members share almost all fields and differ only slightly, a single object with an optional field may be simpler — a union of near-identical shapes is boilerplate. And a huge union (dozens of members) can slow narrowing and bloat the type.
- **Interop cost:** external JSON often arrives as the flag-bag shape; you translate it into the union at the boundary (again, a good spot for a validator).

## 💣 Gotchas interviewers probe

- **The discriminant must be a literal type.** Widened `string`/`number` fields can't narrow — `as const` or literal annotations are required. Most "why won't it narrow?" bugs are this.
- **The `never` exhaustiveness pattern** — assigning the narrowed variable to `never` in `default`. Knowing *why* it works (the empty type) is a strong signal.
- **Optional fields defeat the purpose.** If you write `{ status: 'success'; data?: T }`, you've reintroduced the "success but no data" impossible state. Required fields per member are the point.
- **A shared discriminant with overlapping values** across members still narrows, but overlapping *non-literal* discriminants don't — keep tags disjoint.
- **`switch` fall-through and missing `break`/`return`** silently defeat exhaustiveness — return from each case or the flow analysis merges branches.

## 🎯 Say this in the interview

> "A discriminated union is a set of object shapes sharing one literal tag field — `status`, `kind`, `type` — that the compiler narrows on. I reach for it to model anything with distinct states, like a fetch result, because it makes impossible states unrepresentable: `data` only exists on the success member, `error` only on the error member, so I can't accidentally have both. That replaces the bag-of-booleans anti-pattern where loading, data, and error are all optional and the UI has to defend against nonsense combinations. The feature I lean on hardest is exhaustiveness: in the `switch` default I assign the value to a `never`, so if someone adds a new state and forgets a case, it fails to compile. The one requirement is that the discriminant has to be a literal type — a widened `string` won't narrow."

## 🔗 Go deeper

- [TS Handbook — Discriminated unions](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#discriminated-unions) — the pattern and how narrowing uses the tag.
- [TS Handbook — Exhaustiveness checking](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking) — the `never` trick, from the source.
- [Effective TypeScript — Prefer unions of interfaces](https://effectivetypescript.com/2020/05/12/unrepresentable/) — making illegal states unrepresentable.
