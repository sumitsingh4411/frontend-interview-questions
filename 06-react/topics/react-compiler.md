<div align="center">

# React Compiler

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#performance` `#modern`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The React Compiler is a **build-time tool** that reads your components, figures out what each render actually depends on, and **auto-inserts memoization** — making most hand-written `memo`/`useMemo`/`useCallback` obsolete, provided your code follows the Rules of React.

---

## 🧠 Mental model

Manual memoization is a chore we did because React had no idea which values were stable. You told it, by hand, with dep arrays — tedious, error-prone, and stale-prone. The compiler flips this: instead of *you* proving to React what can be reused, a **compiler analyses the code and proves it automatically**, then rewrites your component to cache exactly the right things.

The right framing: it's **not a new runtime feature you call** — it's a Babel-style build step that transforms your source. Your components stay plain function components; the compiler emits versions that memoize values and JSX at a fine grain, so a state change only re-runs the parts that actually depend on it. Think "sufficiently smart compiler for re-renders."

## ⚙️ How it actually works

The compiler builds a model of each component's data flow — which props/state/values feed which expressions and which JSX. It then caches results keyed on their real inputs, at **finer granularity than `useMemo`**: it can memoize an individual JSX element, a sub-expression, or a computed value, and reuse it across renders whenever its inputs are unchanged (`Object.is`).

Two things this depends on absolutely:

1. **The Rules of React.** Components and hooks must be **pure** — no mutating props/state during render, no reading refs in render, calling hooks unconditionally. The compiler *assumes* purity to reason safely; if you break the rules, memoizing could skip a render that had a side effect. It ships with an **ESLint plugin** (`eslint-plugin-react-hooks` / `react-compiler` rules) that flags code it can't safely optimize — and it **skips** components it can't prove safe rather than miscompiling them.
2. **It's opt-in per build**, integrates via Babel/SWC/Vite plugins, and works incrementally — you can roll it out directory by directory.

Crucially, the compiler doesn't *reduce* renders you asked for; it eliminates the **wasteful re-computation and re-rendering** that manual memo was fighting — the same goal, done correctly and exhaustively.

## 💻 Code

```jsx
// You write plain, un-memoized code:
function ProductList({ products, query }) {
  const filtered = products.filter((p) => p.name.includes(query)); // no useMemo
  const onSelect = (id) => open(id);                               // no useCallback
  return filtered.map((p) => (
    <Row key={p.id} product={p} onSelect={onSelect} />             // no memo(Row)
  ));
}

// The compiler emits (conceptually) memoized equivalents:
//  - `filtered` recomputed only when `products` or `query` change
//  - `onSelect` given a stable identity
//  - each <Row> element reused when its inputs are unchanged
// → the manual memo/useMemo/useCallback trio becomes redundant.
```

The workflow shift: **write clean code, run the linter, let the compiler optimize.** You stop scattering `useCallback` "just in case" and instead treat a lint warning as "the compiler bailed here — fix the rule violation."

## ⚖️ Trade-offs

- **It doesn't excuse breaking the Rules of React.** If anything, it *raises* the stakes: impure render logic that "happened to work" can now be optimized into skipping, surfacing latent bugs. The lint plugin is not optional.
- **Not every component gets optimized.** The compiler conservatively **bails on code it can't prove safe** — you get correctness, not a guarantee of speedup everywhere. Check the compiler's output/DevTools badge to see what was optimized.
- **When NOT to expect wins:** apps that weren't render-bound, or already carefully hand-memoized — the compiler mostly removes your manual code rather than adding new speed.
- **Debugging shifts.** The code that runs isn't quite the code you wrote; source maps and the React DevTools "Memo ✨" indicator matter more.

## 💣 Gotchas interviewers probe

- **"Does the compiler make `memo`/`useMemo`/`useCallback` obsolete?"** Largely yes, for the common cases — and you can delete most manual memoization once it's on. That's the headline.
- **It only works if your code is pure.** Mutating during render, reading refs in render, conditional hooks — the compiler skips (or the lint flags) these. Naming the Rules of React is the senior signal.
- **It's build-time, not runtime.** Candidates who describe it as "a new hook" or "a runtime optimization" misunderstand it — it's a compiler that rewrites your source.
- **It bails safely rather than miscompiling.** Correctness first: unsure code is left un-optimized, not broken.
- **Lint warnings are now performance-relevant** — a rule violation isn't just style, it's the compiler refusing to optimize that component.
- **Doesn't replace architectural fixes.** State colocation and passing `children` still matter; the compiler handles memoization, not data-flow design.

## 🎯 Say this in the interview

> "The React Compiler is a build-time transform that analyses each component's data flow and auto-inserts memoization at a finer grain than `useMemo` could — individual JSX elements and sub-expressions, not just whole values. The practical upshot is that it makes most hand-written `memo`, `useMemo`, and `useCallback` obsolete: I write plain function components and let it cache what's safe to cache. The catch is that it relies completely on the Rules of React — components and hooks must be pure — because it assumes purity to prove a value is reusable; if you mutate during render or read refs in render, it either bails or the ESLint plugin flags it. So it doesn't lower the bar on discipline, it raises it, and a lint warning becomes a performance signal. And it fails safe: anything it can't prove, it leaves un-optimized rather than miscompiling. It handles memoization; I still colocate state and pass `children` for the architectural wins."

## 🔗 Go deeper

- [react.dev — React Compiler](https://react.dev/learn/react-compiler) — what it does, install, and rollout strategy.
- [react.dev — Rules of React](https://react.dev/reference/rules) — the purity constraints the compiler depends on.
- [react.dev — React Compiler (reference)](https://react.dev/reference/react-compiler) — configuration, bail-out behaviour, and directives.
- [react.dev — Keeping components pure](https://react.dev/learn/keeping-components-pure) — why purity is the precondition for safe auto-memoization.
