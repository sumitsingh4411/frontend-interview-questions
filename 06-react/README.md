<div align="center">

<img src="banner.svg" alt="06 · React" width="100%" />

</div>

The framework most FAANG frontend loops assume. They'll ask *how it works*, not just how to use it.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full topic bank — 75 React topics →](question-bank.md)**

⭐ **Flagship:** [Build a Virtualized List](build-a-virtualized-list.md)

## Fundamentals & rendering

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [JSX & `createElement`](topics/jsx-createelement.md) | 🟢 | 30m | `#basics` | [react.dev: JSX ⭐](https://react.dev/learn/writing-markup-with-jsx) |
| [Components, props, composition](topics/components-props-composition.md) | 🟢 | 45m | `#basics` | [react.dev: components ⭐](https://react.dev/learn/your-first-component) |
| [Rendering & re-render mental model](topics/rendering-re-render-mental-model.md) | 🟡 | 1h | `#rendering` | [react.dev: render & commit ⭐](https://react.dev/learn/render-and-commit) |
| [Reconciliation & keys](topics/reconciliation-keys.md) | 🟡 | 45m | `#rendering` `#internals` | [react.dev: preserving state ⭐](https://react.dev/learn/preserving-and-resetting-state) |
| [Fiber architecture](topics/fiber-architecture.md) | 🔴 | 1.5h | `#internals` | [Lin Clark: cartoon intro to Fiber ⭐](https://www.youtube.com/watch?v=ZCuYPiUIONs) |
| [Controlled vs uncontrolled inputs](topics/controlled-vs-uncontrolled-inputs.md) | 🟡 | 45m | `#forms` | [react.dev: forms ⭐](https://react.dev/reference/react-dom/components/input) |
| [Lists, keys & reconciliation pitfalls](topics/lists-keys-reconciliation-pitfalls.md) | 🟡 | 45m | `#rendering` | [react.dev: rendering lists ⭐](https://react.dev/learn/rendering-lists) |

## Hooks

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Rules of hooks](topics/rules-of-hooks.md) | 🟢 | 30m | `#hooks` | [react.dev: rules ⭐](https://react.dev/reference/rules/rules-of-hooks) |
| [`useState` & batching](topics/usestate-batching.md) | 🟢 | 45m | `#hooks` `#state` | [react.dev: useState ⭐](https://react.dev/reference/react/useState) |
| [`useEffect` & effect timing](topics/useeffect-effect-timing.md) | 🟡 | 1h | `#hooks` | [react.dev: you might not need an effect ⭐](https://react.dev/learn/you-might-not-need-an-effect) |
| [`useLayoutEffect` vs `useEffect`](topics/uselayouteffect-vs-useeffect.md) | 🟡 | 30m | `#hooks` | [react.dev: useLayoutEffect ⭐](https://react.dev/reference/react/useLayoutEffect) |
| [`useMemo` / `useCallback`](topics/usememo-usecallback.md) | 🟡 | 45m | `#hooks` `#performance` | [react.dev: useMemo ⭐](https://react.dev/reference/react/useMemo) |
| [`useRef` & imperative handles](topics/useref-imperative-handles.md) | 🟡 | 45m | `#hooks` | [react.dev: useRef ⭐](https://react.dev/reference/react/useRef) |
| [`useContext` & context perf](topics/usecontext-context-perf.md) | 🟡 | 1h | `#hooks` `#state` | [react.dev: useContext ⭐](https://react.dev/reference/react/useContext) |
| [`useReducer` & state machines](topics/usereducer-state-machines.md) | 🟡 | 45m | `#hooks` `#state` | [react.dev: useReducer ⭐](https://react.dev/reference/react/useReducer) |
| `useTransition` / `useDeferredValue` | 🔴 | 1h | `#concurrent` | [react.dev: useTransition ⭐](https://react.dev/reference/react/useTransition) |
| `useSyncExternalStore` | 🔴 | 45m | `#hooks` `#state` | [react.dev ⭐](https://react.dev/reference/react/useSyncExternalStore) |
| `useId`, `useImperativeHandle` | 🟡 | 30m | `#hooks` | [react.dev: useId ⭐](https://react.dev/reference/react/useId) |
| [Custom hooks](topics/custom-hooks.md) | 🟡 | 45m | `#hooks` `#patterns` | [react.dev: reusing logic ⭐](https://react.dev/learn/reusing-logic-with-custom-hooks) |

## Performance & patterns

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [`React.memo` & referential equality](topics/react-memo-referential-equality.md) | 🟡 | 45m | `#performance` | [react.dev: memo ⭐](https://react.dev/reference/react/memo) |
| [Code splitting & `lazy`/`Suspense`](topics/code-splitting-lazy-suspense.md) | 🟡 | 45m | `#performance` `#bundling` | [react.dev: lazy ⭐](https://react.dev/reference/react/lazy) |
| [Virtualization / windowing](topics/virtualization-windowing.md) | 🔴 | 1.5h | `#performance` `#large-data` | [Flagship ⭐](build-a-virtualized-list.md) |
| [Avoiding unnecessary re-renders](topics/avoiding-unnecessary-re-renders.md) | 🔴 | 1h | `#performance` | [react.dev ⭐](https://react.dev/learn/render-and-commit) |
| [Error boundaries](topics/error-boundaries.md) | 🟡 | 30m | `#errors` | [react.dev ⭐](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) |
| [Portals](topics/portals.md) | 🟢 | 30m | `#patterns` | [react.dev: createPortal ⭐](https://react.dev/reference/react-dom/createPortal) |
| [Refs & `forwardRef`](topics/refs-forwardref.md) | 🟡 | 30m | `#patterns` | [react.dev: forwardRef ⭐](https://react.dev/reference/react/forwardRef) |
| [Compound components / render props](topics/compound-components-render-props.md) | 🔴 | 45m | `#patterns` | [patterns.dev: React patterns ⭐](https://www.patterns.dev/react) |
| [HOCs](topics/hocs.md) | 🟡 | 30m | `#patterns` | [patterns.dev ⭐](https://www.patterns.dev/react/hoc-pattern) |
| [React Compiler](topics/react-compiler.md) | 🟡 | 45m | `#performance` `#modern` | [react.dev: compiler ⭐](https://react.dev/learn/react-compiler) |

## Rendering strategies & advanced

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Concurrent rendering | 🔴 | 1h | `#concurrent` | [react.dev ⭐](https://react.dev/blog/2022/03/29/react-v18) |
| Suspense & streaming | 🔴 | 1h | `#concurrent` `#data` | [react.dev: Suspense ⭐](https://react.dev/reference/react/Suspense) |
| React Server Components (RSC) | 🔴 | 1.5h | `#rsc` `#rendering` | [react.dev: server components ⭐](https://react.dev/reference/rsc/server-components) |
| SSR & hydration | 🔴 | 1h | `#ssr` | [react.dev: hydrateRoot ⭐](https://react.dev/reference/react-dom/client/hydrateRoot) |
| Server Actions | 🟡 | 45m | `#rsc` `#data` | [react.dev: 'use server' ⭐](https://react.dev/reference/rsc/use-server) |
| Testing React | 🟡 | 1h | `#testing` | [Testing Library ⭐](https://testing-library.com/docs/react-testing-library/intro/) |

## ❓ Rapid-fire React interview questions

The most-asked React interview questions. Say your answer, then verify against the resources above.

1. What is the **virtual DOM** and how does **reconciliation** work?
2. Why are **keys** important in lists? What happens if you use the index?
3. **`useEffect` vs `useLayoutEffect`** — what's the difference?
4. **When does a component re-render?**
5. What does **`React.memo`** do? **`useMemo` vs `useCallback`**?
6. What are the **rules of hooks** and why do they exist?
7. **Controlled vs uncontrolled** components?
8. What is **`useRef`** used for (vs state)?
9. How does **Context** work, and what are its performance pitfalls?
10. **`useReducer` vs `useState`** — when to use each?
11. What are **error boundaries**?
12. How do **code splitting**, `lazy`, and `Suspense` work?
13. What is **React Fiber**?
14. What are **React Server Components (RSC)**?
15. **CSR vs SSR vs SSG vs ISR** — trade-offs?
16. What is **hydration** and what causes hydration mismatches?
17. How do you **avoid unnecessary re-renders**?
18. What is a **custom hook**?
19. What is **prop drilling** and how do you avoid it?
20. Difference between **state and props**?
21. What is **`useTransition`** / concurrent rendering?
22. How do **portals** work and when do you need them?
23. How does **state batching** work in React 18?
24. What is the difference between **`useEffect` cleanup** and unmount?
25. What are **compound components** and render props?

## ⚛️ Advanced & scenario questions

The "how would you actually build/fix this" questions senior React interviews lean on.

1. A component **re-renders too often** — how do you diagnose and fix it?
2. Why does my **`useEffect` run twice** in development (StrictMode)?
3. What is a **stale closure** in `useEffect` and how do you fix it?
4. How do you **fetch data** in React and avoid **race conditions**?
5. How do you build a **debounced search** input?
6. When do **`useMemo`/`useCallback` actually help** — and when do they hurt?
7. How do you **share state** across the tree without prop drilling?
8. How would you build an **infinite scroll / virtualized list**? → [flagship](build-a-virtualized-list.md)
9. How do you **persist state to localStorage** with a custom hook?
10. How does changing a **`key`** reset a component's state? Give an example.
11. How do you **prevent a memory leak** from a subscription/timer in a component?
12. How do you **code-split** a route or heavy component?
13. **Controlled vs uncontrolled** form — build both.
14. How do you **test** a component with React Testing Library?
15. How do you implement a **global store without Redux** (Context/Zustand/`useSyncExternalStore`)?
16. How do you handle **error states** and error boundaries in a data-fetching UI?
17. What's the difference between **`useEffect` and `useLayoutEffect`** in practice?
18. How do you **optimize a list** of thousands of rows?
19. How would you implement **optimistic updates** for a like button?
20. How do you avoid **prop drilling** vs when is it actually fine?

---

**Related:** [13-state-management](../13-state-management/) · [07-nextjs](../07-nextjs/) · [09-performance](../09-performance/) · [19-build-your-own](../19-build-your-own/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
