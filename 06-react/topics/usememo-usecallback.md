<div align="center">

# `useMemo` / `useCallback`

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#hooks` `#performance`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Both are a **one-slot cache keyed by a dependency array**: `useMemo` caches a *value*, `useCallback` caches a *function*. They don't make rendering faster for free — you pay an allocation and a dep comparison **every** render — so they only earn their keep when the identity is load-bearing (a `memo` child, a hook dependency) or the computation is genuinely expensive. Everywhere else they're cargo cult.

---

## 🧠 Mental model

There is really only one hook here. `useCallback(fn, deps)` is **defined** as `useMemo(() => fn, deps)` — caching a function is just caching a value that happens to be callable. So learn `useMemo` and `useCallback` is a special case.

And "memo" is a generous word. This is not memoization in the algorithms sense — no unbounded cache of past inputs. It's **a single box holding the last value**, plus the deps that produced it. Deps match on the next render → you get the box back. Deps differ → the box is thrown away and refilled. React even reserves the right to **discard the cache whenever it wants** (e.g. to free memory for an offscreen tree), which is why you must treat these as a *performance hint, never a correctness guarantee*. Code that breaks if `useMemo` recomputes is already broken.

## ⚙️ How it actually works

Here's the part most candidates skip: **the work you're trying to avoid still runs on the render where deps change, and the allocation runs every render regardless.**

```jsx
const value = useMemo(() => compute(a, b), [a, b]);
```

Every render: the arrow `() => compute(a, b)` is allocated, the array `[a, b]` is allocated, and React runs `Object.is` across each dep against last time. If all equal, it returns the cached `value` and *throws away the fresh arrow*. If any differ, it calls the factory and caches the result. So `useMemo` **adds** overhead on the fast path — you're betting that overhead is smaller than the thing you skipped.

That framing tells you the only two shapes where the bet pays:

1. **Referential stability is the product.** The output feeds something that compares by identity — a `memo`-wrapped child's prop, a `useEffect`/`useMemo` dependency, a context `value`. Here a stable reference *prevents downstream work*, which is the real saving. `useCallback` exists almost entirely for this.
2. **The computation is genuinely expensive.** Sorting 50k rows, parsing, building a big derived structure. Memoising a `a + b` or a `.map` over 10 items is pure ceremony — you added a comparison to save nothing.

## 💻 Code

```jsx
// ❌ Cargo cult: caching a trivially cheap value. Net cost > net saving.
const total = useMemo(() => price * qty, [price, qty]); // just: const total = price * qty

// ❌ useCallback with nothing consuming the identity. Pointless allocation.
const onClick = useCallback(() => setOpen(true), []); // fine to inline if <button> is a host element

// ✅ Identity is load-bearing: this fn is a dependency of an effect
const fetcher = useCallback(() => fetch(`/api/${id}`), [id]);
useEffect(() => { fetcher(); }, [fetcher]); // without useCallback, effect re-fires every render

// ✅ Genuinely expensive derivation feeding a memo'd list
const visible = useMemo(
  () => rows.filter(matches(query)).sort(byName), // O(n log n) over a big array
  [rows, query]
);
```

You can also `useMemo` a **JSX subtree** to skip re-rendering it when unrelated state changes — but restructuring (lifting the subtree to `children`) is usually the cleaner fix.

## ⚖️ Trade-offs

- **They cost memory and CPU on every render.** Retained previous value + retained deps array + a comparison. On a cheap component rendered in a tight list, "memoise everything" measurably *loses*.
- **When NOT to use:** primitive-returning computations, functions passed to plain host elements (`<button onClick>` doesn't care about identity), anything where you haven't measured a problem.
- **Exhaustive deps are non-negotiable.** A missing dep gives you a stale closure — the classic "why is my callback seeing old state" bug. Trust the lint rule.
- **The React Compiler makes this obsolete.** It auto-memoises at build time based on real data flow, so on a compiler-enabled codebase, hand-written `useMemo`/`useCallback` is noise you should delete.

## 💣 Gotchas interviewers probe

- **"Does `useMemo` make my component faster?"** By default, *no* — it adds overhead. It's faster only when it prevents strictly more expensive downstream work. Saying "I wrap everything in useMemo for performance" is a red flag.
- **`useCallback` is `useMemo(() => fn)`.** Knowing they're the same primitive is a senior signal.
- **A stable callback alone does nothing** unless the *consumer* compares by identity (a `memo` child, an effect dep). Stabilising a prop of a non-memo component saves zero renders.
- **React may drop the cache.** Never rely on `useMemo` for correctness (e.g. don't create a singleton you assume persists — use `useRef` or state).
- **`useMemo(fn, [])` still allocates `fn` and `[]` every render.** The initial-value-once optimisation of `useState`/`useRef` does *not* apply here.
- **Object/array deps break it.** A dep that's a fresh literal each render makes the memo miss every time — you pay the comparison *and* the recompute.

## 🎯 Say this in the interview

> "`useCallback(fn, deps)` is literally `useMemo(() => fn, deps)` — one primitive, a single-slot cache keyed by a dependency array compared with `Object.is`. The thing people miss is that it isn't free: the closure and the deps array are allocated every render, and React runs the comparison every render, so on the fast path you're *adding* work. That means it only pays off in two cases: when the identity is load-bearing — the value feeds a `memo` child or a hook dependency, so a stable reference stops downstream work — or when the computation itself is genuinely expensive, like sorting tens of thousands of rows. Wrapping a `price * qty` or an inline handler on a plain button is cargo cult; I'd delete it. And on a React Compiler codebase I'd delete essentially all of it, since the compiler memoises from real data flow at build time."

## 🔗 Go deeper

- [react.dev — `useMemo`](https://react.dev/reference/react/useMemo) — the exact caching semantics and the "you don't usually need this" caveats.
- [react.dev — `useCallback`](https://react.dev/reference/react/useCallback) — when a stable function identity actually matters, framed as a special case of `useMemo`.
- [react.dev — "You Might Not Need an Effect / memo"](https://react.dev/learn/you-might-not-need-an-effect) — restructuring beats memoising most of the time.
- [react.dev — React Compiler](https://react.dev/learn/react-compiler) — automatic memoisation that retires the manual kind.
