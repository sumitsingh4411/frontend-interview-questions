<div align="center">

# `tsconfig` deep dive

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 45m · `#config`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `tsconfig.json` answers three separate questions people constantly conflate: **which files** to include, **how strictly** to check them, and **what to emit**. Most `tsconfig` pain is mixing a *checking* flag with an *emit* flag — and the single biggest footgun is `module`/`moduleResolution`, which decides whether your imports even resolve.

---

## 🧠 Mental model

Read every option as belonging to one of three axes:

| Axis | Question | Key options |
|---|---|---|
| **Input** | Which files? | `include`, `exclude`, `files` |
| **Checking** | How safe? | `strict` family, `lib`, `noUncheckedIndexedAccess` |
| **Output** | Emit what? | `target`, `module`, `moduleResolution`, `outDir`, `noEmit` |

Almost every "why is TypeScript doing this?" resolves to putting a question on the wrong axis — e.g. expecting `paths` (a *checking* convenience) to change the emitted JavaScript (an *output* concern). It doesn't.

## ⚙️ How it actually works

**`target` sets the JS you downlevel to — and quietly sets your default `lib`.** `target: "ES2020"` means the compiler assumes ES2020 globals exist (`Promise.allSettled`, etc.) unless you override `lib`. Set `target` too low and you lose APIs; too high and you emit syntax old runtimes can't run.

**`module` vs `moduleResolution` is the confusion that eats afternoons.** `module` controls the *output* module format (`ESNext`, `CommonJS`); `moduleResolution` controls *how imports are found*. Modern guidance:

- `"bundler"` (TS 5.0) — for Vite/webpack/esbuild apps. Node-style resolution *without* requiring file extensions, matching what bundlers do.
- `"node16"` / `"nodenext"` — for code Node runs directly. Enforces explicit `.js` extensions in imports and honours `package.json` `exports`/`type`.
- `"node10"` (the old `"node"`) — legacy; avoid for new work.

**`paths` + `baseUrl` are type-check-only aliases.** `"@/*": ["src/*"]` makes the *compiler* resolve `@/foo`, but `tsc` **does not rewrite the import in emitted JS**. At runtime you still need the bundler (or `tsconfig-paths`) to perform the same aliasing, or you ship code that imports a path that doesn't exist. This is the classic "works in the editor, crashes at runtime" bug.

**`esModuleInterop`** fixes `import express from 'express'` against CommonJS defaults; leave it on. **`isolatedModules`** makes each file transpilable in isolation (required for esbuild/swc/Babel, which don't type-check across files) — it bans things those tools can't handle, like re-exporting a type without `export type`. **`verbatimModuleSyntax`** (TS 5.0) supersedes the old interop flags: it keeps `import`/`export` exactly as written, forcing you to mark type-only imports, which is what single-file transpilers need.

**`skipLibCheck`** skips type-checking `.d.ts` files — nearly every real repo enables it for speed and to dodge broken third-party declarations, at the honest cost of missing genuine bugs in dependency types. **`noEmit`** is standard when a bundler owns output and `tsc` is only your type-checker.

## 💻 Code

```jsonc
// A sane modern app (Vite / bundler owns the build; tsc only type-checks)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",   // extension-less, bundler-style
    "strict": true,
    "noUncheckedIndexedAccess": true, // strict doesn't include this — add it
    "verbatimModuleSyntax": true,     // explicit type-only imports
    "skipLibCheck": true,
    "noEmit": true,                   // Vite emits, not tsc
    "jsx": "react-jsx",
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }     // ⚠ mirror this alias in vite.config
  },
  "include": ["src"]
}
```

```jsonc
// A publishable library — tsc DOES emit, and must ship declarations
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "declaration": true,     // ship .d.ts
    "declarationMap": true,  // go-to-definition into source for consumers
    "sourceMap": true,
    "outDir": "dist",
    "strict": true
  },
  "include": ["src"]
}
```

## ⚖️ Trade-offs

- **`paths` aliases are ergonomic but leak a runtime dependency.** Every alias you add is one your bundler config must also know about. Prefer them for import cleanliness, but never assume `tsc` rewrites them — it doesn't.
- **`skipLibCheck: true` is the pragmatic default and a real compromise.** It hides type errors inside `node_modules`; the alternative is your build breaking because a transitive `@types` package is momentarily wrong. Most teams accept the trade.
- **`bundler` resolution is wrong when Node runs the file directly.** For CLIs and server code executed by Node without a bundler, use `nodenext` so extension and `exports`-map behaviour matches reality.

## 💣 Gotchas interviewers probe

- **`paths` don't affect emitted JS.** The most common `tsconfig` bug: aliases resolve in the editor and explode at runtime unless a bundler mirrors them.
- **`module` ≠ `moduleResolution`.** One is output format, one is lookup algorithm. Setting `module: "ESNext"` doesn't imply how imports resolve.
- **`target` silently controls the default `lib`.** Missing a global you expect? Your `target` is too low, or you overrode `lib` and dropped it.
- **`extends` resolves relative paths from the *base* config's location, not the child's** — a frequent surprise in shared monorepo configs.
- **`include`/`exclude` defaults bite.** With no `files`/`include`, `tsc` grabs every `.ts` under the config dir; `exclude` defaults to `node_modules`/`outDir`/build dirs — so an explicit `include` that forgets to re-exclude can drag in your `dist`.
- **`isolatedModules` bans const-enum re-exports and unmarked type re-exports** — because single-file transpilers can't see across files.

## 🎯 Say this in the interview

> "I read `tsconfig` on three axes: input — which files; checking — how strict; and output — what gets emitted. Most confusion comes from mixing them. The flag I watch hardest is `moduleResolution`: `bundler` for a Vite or webpack app because it does extension-less node-style lookup like the bundler does, and `nodenext` for code Node executes directly so extensions and `package.json` exports maps are honoured. And I'm careful that `paths` aliases are a type-check-only convenience — `tsc` never rewrites them into the emitted JavaScript, so the bundler has to mirror every alias or it works in the editor and crashes at runtime. Beyond that I turn on `strict`, add `noUncheckedIndexedAccess` because `strict` doesn't include it, enable `skipLibCheck` for build speed knowing it hides dependency type bugs, and set `noEmit` when the bundler owns the build."

## 🔗 Go deeper

- [TSConfig reference](https://www.typescriptlang.org/tsconfig) — every option with examples; keep it open while configuring.
- [TS Handbook — Module resolution](https://www.typescriptlang.org/docs/handbook/modules/theory.html) — the mental model behind `module`/`moduleResolution`.
- [TS 5.0 — `--moduleResolution bundler`](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#moduleresolution-bundler) — why the bundler mode exists.
- [Total TypeScript — `tsconfig` cheat sheet](https://www.totaltypescript.com/tsconfig-cheat-sheet) — opinionated, correct defaults for apps vs libraries.
