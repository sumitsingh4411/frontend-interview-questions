<div align="center">

# Typing async & generics in APIs

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#patterns`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A generic API function should **thread the caller's type through** so the return is `Promise<T>` (not `Promise<any>`), but remember TypeScript only *describes* the shape — it does nothing at runtime, so `await res.json()` is a lie until you validate it.

---

## 🧠 Mental model

Two ideas collide in an API layer, and confusing them is the classic mistake.

**Generics are for relationships.** A type parameter earns its place only when it *links* an input to an output. `getJSON<T>(url): Promise<T>` relates "what you claim the endpoint returns" to "what you get back." If a type parameter appears exactly once, it isn't doing anything — it's just `any` wearing a costume.

**`async` is a wrapper, not a transform.** An `async function` always returns `Promise<Whatever-you-return>`; TypeScript unwraps nested promises so `Promise<Promise<T>>` flattens to `Promise<T>`. The return annotation you write is the *resolved* type — the compiler adds the `Promise<…>`.

The uncomfortable truth underneath both: **`Promise<User>` is a claim about runtime data the compiler never checks.** `response.json()` is typed `Promise<any>` precisely because TypeScript cannot know what a server sends. Casting it to `User` doesn't validate anything — it silences the compiler and moves the failure from a clean type error to a `Cannot read properties of undefined` three components away.

## ⚙️ How it actually works

**Generic inference flows from arguments, not return position.** `T` gets pinned by what you pass in. When there's nothing to infer *from* — like a fetch where the type is a pure caller assertion — you must pass `T` explicitly at the call site, and the compiler cannot protect you if you lie:

```ts
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>; // ⚠️ assertion, not a check
}
const user = await getJSON<User>("/api/user"); // T is a promise you're making
```

**Constraints make generics safe.** `<T extends { id: string }>` lets the body use `.id` while staying generic. Without a constraint, the body can touch nothing on `T`.

**`Awaited<T>` is the real unwrapper.** It's how you extract a resolved type from a promise (or a promise of a promise), and it's what `ReturnType` composes with to type the result of an async function:

```ts
type User = Awaited<ReturnType<typeof getJSON<User>>>; // → User
```

**The senior move: validate at the boundary.** A schema library (Zod, Valibot) gives you a value that is *both* runtime-checked and statically typed via inference — the type and the check come from one source of truth, so they can never drift:

```ts
const User = z.object({ id: z.string(), name: z.string() });
type User = z.infer<typeof User>;              // type derived FROM the schema

async function getUser(id: string): Promise<User> {
  const res = await fetch(`/api/users/${id}`);
  return User.parse(await res.json());          // throws if the server lied
}
```

## 💻 Code

```ts
// ❌ any leaks everywhere — the return is unusable-safe
async function get(url: string) {
  const res = await fetch(url);
  return res.json(); // Promise<any> → poisons every caller silently
}

// ⚠️ Better: generic threads the type, but it's an unchecked assertion
async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json() as Promise<T>;
}

// ✅ Best: constrained generic + runtime validation via an injected parser
async function getValidated<T>(
  url: string,
  parse: (raw: unknown) => T,   // the caller supplies the runtime check
): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return parse(await res.json()); // type AND runtime shape now agree
}

// A discriminated Result type — model failure in the type, not just throws
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

async function safe<T>(p: Promise<T>): Promise<Result<T>> {
  try { return { ok: true, value: await p }; }
  catch (e) { return { ok: false, error: e as Error }; }
}

const r = await safe(getJSON<User>("/api/user"));
if (r.ok) r.value.name;   // ✅ narrowed to User
else r.error.message;     // ✅ narrowed to Error
```

## ⚖️ Trade-offs

- **Generic fetch (`getJSON<T>`) is ergonomic but unsafe** — it's an assertion the caller can't back up. Fine for internal tools; dangerous at trust boundaries (third-party APIs, user input). There, validate.
- **Schema validation costs bundle size and a little runtime, and buys you the one thing types can't give: a guarantee.** Use it at the edges (network, `localStorage`, `postMessage`, URL params), not on data that never left your own typed code.
- **`Result<T,E>` vs throwing:** encoding errors in the return type forces callers to handle them and composes well, but it's verbose and swims against JS's `try/catch` current. Great for predictable, expected failures; overkill for truly exceptional ones.
- **When NOT to make it generic:** if the endpoint returns exactly one known shape, `Promise<User>` is clearer than `getJSON<User>`. Generics that don't relate two types are noise.

## 💣 Gotchas interviewers probe

- **`res.json()` is `Promise<any>`, and `any` disables checking on everything it touches.** The single most important point — casting it doesn't validate, it just relocates the crash. Say "types are erased; the server can send anything."
- **A type parameter used once is pointless.** `function f<T>(x: T): void` is just `(x: unknown)`. Generics express *relationships* between positions.
- **`await` on a non-promise is a no-op** — `await 5` is `5`. And `Awaited<T>` recursively unwraps, so nested promises flatten. People expect `Promise<Promise<T>>` to stay nested; it doesn't.
- **Unhandled rejections vs errors:** an `async` function that throws returns a *rejected promise* — a caller who forgets `await`/`.catch()` gets an unhandled rejection, not a synchronous throw.
- **`catch (e)` gives you `unknown`** under modern strict settings (`useUnknownInCatchVariables`), because anything can be thrown — not just `Error`. You must narrow before using `e.message`.
- **Explicit type args vs inference:** `getJSON<User>(url)` supplies `T` manually because there's no argument to infer it from. If a generic's `T` can't be inferred, callers must pass it — otherwise it silently resolves to `unknown` or `{}`.
- **`Promise.all` preserves the tuple types** — `Promise.all([a, b])` returns `[A, B]`, not `(A|B)[]`. Interviewers like that you know it's tuple-typed.

## 🎯 Say this in the interview

> "I make an API function generic only when the type parameter relates the input to the output — `getJSON<T>(url): Promise<T>` threads the caller's expected shape through instead of leaking `any`, since `res.json()` is typed `Promise<any>`. But I'm explicit that this is an *assertion*, not a check: types are erased at runtime, so the compiler can't stop the server from sending something else. At a real trust boundary I validate with a schema — Zod or similar — and derive the type from the schema with `z.infer`, so the runtime check and the static type come from one source and can never drift. For error handling I lean on `async` returning a rejected promise, and where failures are expected I model them with a discriminated `Result<T, E>` so callers are forced to handle both branches. And I remember `catch` binds `unknown` now, so I narrow before touching `.message`."

## 🔗 Go deeper

- [TS Handbook — Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html) — constraints, inference, and when a type parameter is justified.
- [TS Handbook — `Awaited<T>` & utility types](https://www.typescriptlang.org/docs/handbook/utility-types.html#awaitedtype) — how promise unwrapping is typed.
- [Zod](https://zod.dev/) — schema-first validation with type inference; the canonical boundary-validation tool.
- [MDN — Using Promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises) — rejection semantics that the async types describe.
