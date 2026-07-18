<div align="center">

# Typing React components & hooks

<sub>🔷 TypeScript · 🟡 Medium · ⏱ 1h · `#react`</sub>

<a href="../README.md">⬅ TypeScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Type the **props object directly** and let inference do the rest: skip `React.FC`, reach for `useState<T>()` only when the initial value is too weak to infer, and give every `useRef` and reducer an explicit type because that's where inference silently gives you the wrong thing.

---

## 🧠 Mental model

React types are just function types. A component is `(props: Props) => JSX.Element`; a hook is a generic function whose return type is derived from what you pass in. So the entire game is: **let inference win where it can, and intervene at exactly the boundaries where React's defaults are wrong or too loose.**

There are only a handful of those boundaries, and a senior candidate can name them: `useState(null)` (infers `null`, not `T | null`), `useRef` (mutable vs read-only DOM ref), `useReducer` (state/action union), event handlers (which `Event` subtype?), and `children` (do you even accept them?). Everything else — most props, most callbacks — should be inferred, not annotated. Over-annotating is the junior tell; knowing *where* the compiler needs help is the senior one.

## ⚙️ How it actually works

**Why not `React.FC`?** It was the community default for years and is now discouraged. It implicitly adds a `children` prop to *every* component (so a component that renders no children still type-checks when handed some), it makes generic components awkward to express, and it complicates `defaultProps`. Typing the props argument directly is stricter and reads better:

```tsx
// ❌ implicit children, awkward generics
const Avatar: React.FC<Props> = ({ src }) => <img src={src} />;
// ✅ explicit, stricter, generics-friendly
function Avatar({ src }: Props) { return <img src={src} />; }
```

**`useState` inference is a trap at `null`/`[]`.** `useState(null)` infers `null` and rejects every later `setUser(realUser)`. `useState([])` infers `never[]`. Supply the type parameter whenever the initial value can't represent the full domain:

```ts
const [user, setUser] = useState<User | null>(null); // ✅ union is explicit
```

**`useRef` has two distinct shapes, and picking wrong is a compile error.** `useRef<T>(null)` where you intend to attach it to JSX returns a **read-only** `RefObject<T>` (React writes `.current`, you don't). `useRef<T>(initial)` with a non-null initial returns a **mutable** `MutableRefObject<T>` for instance variables. Give DOM refs the element type — `useRef<HTMLInputElement>(null)` — so `.current.focus()` is typed.

**`useReducer` needs the action union up front** — that's where discriminated unions pay off, giving you exhaustive `switch` checking inside the reducer.

## 💻 Code

```tsx
import { useState, useRef, useReducer } from "react";

// --- Props: type the object, derive children intent explicitly ---
type ButtonProps = {
  variant: "primary" | "ghost";
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode; // opt IN to children deliberately
};

function Button({ variant, onClick, children }: ButtonProps) {
  return <button className={variant} onClick={onClick}>{children}</button>;
}

// --- Extend native element props without re-typing them all ---
type InputProps = React.ComponentPropsWithoutRef<"input"> & {
  label: string; // your extras on top of every real <input> attribute
};

// --- Refs: element type so .current is typed; null init = read-only DOM ref
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus(); // ✅ typed, null-guarded

// --- useReducer with a discriminated action union → exhaustive switch ---
type State = { count: number };
type Action = { type: "inc" } | { type: "add"; by: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "inc": return { count: state.count + 1 };
    case "add": return { count: state.count + action.by }; // action.by is known
  }
}
const [state, dispatch] = useReducer(reducer, { count: 0 });

// --- Generic component: the pattern React.FC makes ugly ---
function List<T>({ items, render }: { items: T[]; render: (item: T) => React.ReactNode }) {
  return <ul>{items.map((it, i) => <li key={i}>{render(it)}</li>)}</ul>;
}
```

## ⚖️ Trade-offs

- **`ComponentPropsWithoutRef<"button">` vs hand-listing HTML attributes:** the former stays correct as the DOM evolves and gives you `onClick`, `disabled`, `aria-*` for free. Use `...WithRef` only when you actually forward a ref. Rolling your own attribute list is almost always wrong.
- **`ReactNode` vs `ReactElement` vs `JSX.Element` for `children`:** `ReactNode` is the permissive, correct default (strings, numbers, arrays, `null`, elements). Narrow to `ReactElement` only when you genuinely need a single element (e.g. to `cloneElement`).
- **When NOT to annotate:** don't type callback parameters that React already infers (event handlers passed inline, `map` callbacks). Redundant annotations rot when the inferred type changes.
- **`type` vs `interface` for props** is mostly taste — but `type` composes unions and intersections more naturally, which props frequently need (discriminated variant props). Reach for `interface` when you want declaration merging (rare in app code).

## 💣 Gotchas interviewers probe

- **`useState(null)` infers `null`.** The number-one React+TS gotcha. Without `useState<User | null>(null)`, every future set call is a type error. Same story with `useState<string[]>([])`.
- **`React.FC` adds implicit `children`.** Knowing *why* it's discouraged (implicit children, generic-hostile, `defaultProps` friction) is the senior signal — "it's just deprecated" isn't enough.
- **`useRef<T>(null)` vs `useRef<T>(value)` return different types.** Read-only `RefObject` vs mutable `MutableRefObject`. Handing a null-initialised DOM ref where a mutable one is expected fails to compile.
- **Event types are specific.** `React.ChangeEvent<HTMLInputElement>`, `React.MouseEvent<HTMLButtonElement>`, `React.FormEvent<HTMLFormElement>` — using the bare DOM `Event` or the wrong element loses `e.target.value`'s type.
- **`as const` for discriminated variant props.** Union props like `{ variant: "a"; a: X } | { variant: "b"; b: Y }` only narrow correctly if the discriminant is a literal — inference can widen it to `string` without care.
- **`setState` updater functions** are typed: `setCount(c => c + 1)` infers `c` as the state type. People reach for annotations that aren't needed here.
- **Typing `children` as a render prop** (`children: (x: T) => ReactNode`) is legal and powerful — interviewers like seeing you know children can be a function.

## 🎯 Say this in the interview

> "My default is to type the props object directly as a `type` and let inference handle everything else — I avoid `React.FC` because it implicitly injects a `children` prop and fights generic components. For hooks, I intervene only where React's inference is wrong: `useState<User | null>(null)`, because a bare `null` infers as just `null`; `useRef<HTMLInputElement>(null)` for DOM refs so `.current` is typed and I get the read-only ref shape; and `useReducer` with a discriminated action union so the reducer's `switch` is exhaustively checked. For components that wrap native elements I extend `React.ComponentPropsWithoutRef<'button'>` so I inherit every real attribute and stay correct over time. `children` I type as `ReactNode` and opt into deliberately rather than getting it for free. The through-line is: infer aggressively, annotate surgically at the few boundaries where the defaults lie."

## 🔗 Go deeper

- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/) — the community reference for props, hooks, and events.
- [React docs — TypeScript](https://react.dev/learn/typescript) — official guidance on typing components and hooks.
- [Cheatsheet — Why not `React.FC`](https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components) — the reasoning behind dropping it.
- [`@types/react` hooks reference](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/index.d.ts) — the actual signatures for `useRef`, `useState`, `useReducer`.
