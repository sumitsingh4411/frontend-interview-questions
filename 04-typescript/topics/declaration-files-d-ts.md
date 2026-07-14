<div align="center">

# Declaration files (`.d.ts`)

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#config`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A `.d.ts` file is **types with no implementation** — the contract layer that lets TypeScript understand JavaScript it can't see the source of. `declare` means "trust me, this exists at runtime," and that word is also the whole risk: a hand-written declaration is an *unverified promise*, not a proof.

---

## 🧠 Mental model

TypeScript needs to know the *shape* of everything you touch, but shapes and implementations are separable. A `.d.ts` carries only the shape — no function bodies, no emitted JavaScript. It's the header file of the TS world.

Every type you get comes from one of three places: **bundled** with a library (it ships its own `.d.ts`), **DefinitelyTyped** (`@types/*`, community-maintained, installed separately), or **hand-written** by you to describe something untyped. The mental split that matters: types that are *generated from source* stay honest automatically; types you *write by hand* drift the moment the runtime changes and nobody updates the declaration.

## ⚙️ How it actually works

**`declare` = ambient, emits nothing.** It asserts something exists without providing it. That's how you describe a global script tag, an untyped npm module, or a build-time constant.

**A file is a *module* the moment it has a top-level `import`/`export`; otherwise it's *global*.** This one rule explains most "why is my declaration not applying?" confusion. Add `export {}` to force module scope, or wrap globals in `declare global` (which only works *inside* a module).

```ts
// globals.d.ts — no imports → everything here is global
declare const __BUILD_HASH__: string;      // injected by the bundler
interface Window { dataLayer: unknown[] }   // augments the global Window
```

**Declaration merging is the feature that powers augmentation.** Two `interface`s with the same name in the same scope *merge* their members — deliberately. Type aliases do **not** merge (`type X = ...` twice is a duplicate-identifier error). This is precisely why library extension points are interfaces.

**Module augmentation** reopens someone else's module to add to it:

```ts
import 'express';
declare module 'express' {          // reopen, don't replace
  interface Request { userId?: string } // merges into express's Request
}
```

**`declare module '...'` has two meanings** and people conflate them. With a body that *augments* an existing module (above), it merges. With a bare-glob name for a module that has *no* types, it *creates* an ambient module:

```ts
declare module '*.svg' {            // shim so imports type-check
  const src: string;
  export default src;
}
declare module 'legacy-untyped-lib'; // whole module becomes `any`
```

Resolution is driven by `tsconfig`: `types`/`typeRoots` control which ambient `@types` packages load, and `declaration: true` makes `tsc` *emit* `.d.ts` for your own code so consumers get types.

## 💻 Code

```ts
// Typing an untyped third-party module, properly (not just `any`)
declare module 'color-namer' {
  interface Match { name: string; hex: string; distance: number }
  interface Result { ntc: Match[]; basic: Match[] }
  export default function namer(color: string): Result;
}
```

```ts
// Adding a typed field to a request through your middleware chain
// authed.d.ts
import 'express';
declare module 'express-serve-static-core' { // express's real type home
  interface Request {
    user?: { id: string; roles: string[] };
  }
}
export {}; // ensure this file is a module so `declare module` augments
```

## ⚖️ Trade-offs

- **Prefer shipping types from source over hand-written `.d.ts`.** `declaration: true` keeps the contract in lockstep with the code. A separate declaration file is a second source of truth that *will* rot.
- **`declare module 'x'` with no body is a sledgehammer** — it silences errors by making the whole module `any`. Fine as a temporary unblock; a real liability if it stays. Write the actual shape when the module is load-bearing.
- **`@types/*` can lag or contradict a library's own types.** If a package ships its own declarations, installing `@types` for it causes duplicate-identifier conflicts. Check before adding.

## 💣 Gotchas interviewers probe

- **"Why won't my `declare global` apply?"** Because the file is global scope already (no import/export), or conversely it's a module and you forgot `declare global`. The module-vs-script rule is the whole answer.
- **Interfaces merge; type aliases don't.** Augmentation only works through interfaces (and namespaces). If an extension point is a `type`, you *cannot* extend it — that's a design decision by the author.
- **`declare` emits zero runtime code.** A `declare const` doesn't create the value; if it isn't actually there at runtime you get a clean type-check and a runtime `undefined`.
- **Augmentation must target the module's real declaration file.** For Express that's `express-serve-static-core`, not `express` — augmenting the wrong module name silently does nothing.
- **`skipLibCheck` hides `.d.ts` errors.** Most repos enable it for speed, which means a broken declaration in a dependency won't surface until it breaks *your* types downstream.

## 🎯 Say this in the interview

> "A `.d.ts` is types without implementation — it's how TypeScript understands JavaScript it can't see, whether that's a global from a script tag or an untyped npm package. The keyword is `declare`, and I treat it as a promise the compiler can't verify, so I prefer libraries that generate their declarations from source with `declaration: true` rather than maintaining a separate file that drifts. Two things I keep straight: a file is a *module* only if it has a top-level import or export — otherwise its declarations are global, which explains most 'why isn't this applying' bugs — and augmentation works through *interface merging*, so I can reopen `express`'s `Request` to add a `user` field, but I can't extend something a library exposed as a `type` alias. For genuinely untyped modules I write the real shape rather than a bare `declare module` that turns the whole thing into `any`."

## 🔗 Go deeper

- [TS Handbook — Declaration files intro](https://www.typescriptlang.org/docs/handbook/declaration-files/introduction.html) — the full authoring guide with templates.
- [TS Handbook — Declaration merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html) — exactly what merges and what doesn't.
- [TS Handbook — Modules: augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation) — reopening third-party modules safely.
- [DefinitelyTyped](https://github.com/DefinitelyTyped/DefinitelyTyped) — where `@types/*` come from, and how to contribute a fix.
