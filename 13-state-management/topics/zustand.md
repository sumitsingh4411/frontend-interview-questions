<div align="center">

# Zustand

<sub>🗃️ State management · 🟢 Easy · ⏱ 45m · `#zustand`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Zustand is a ~1KB store built on a plain closure and `useSyncExternalStore`: you `create` a store, components subscribe with a **selector**, and only components whose selected slice changed re-render — no Provider, no reducers, no boilerplate, no Context re-render tax.

---

## 🧠 Mental model

Zustand is "just a subscribable JavaScript object with a React hook bolted on." The store lives *outside* React in a closure — no `<Provider>` wrapping your tree. Components opt in by calling the hook with a **selector** that picks the slice they care about. Zustand compares the selected value across renders and re-renders the component only when it changes. That external-store-plus-selector design is precisely what Context can't do: Context re-renders *every* consumer on any change, while Zustand gives you per-slice granularity for free.

The mental unlock: **the store is not React state.** You can read and write it from anywhere — event handlers, timers, other stores, non-React code — via `store.getState()` / `store.setState()`. React is just one subscriber. This makes Zustand equally at home for global UI state and for imperative, outside-render logic (a websocket pushing into the store, say).

## ⚙️ How it actually works

`create(fn)` calls your initialiser with `set` and `get` and returns a hook that is *also* a vanilla store object (`getState`, `setState`, `subscribe`, `getInitialState`). Internally it subscribes via React 18's **`useSyncExternalStore`**, which is the officially-blessed way to read an external mutable source without tearing during concurrent rendering.

- **`set`** shallow-merges by default: `set({ count: 1 })` merges into the top level (unlike `useState`'s replace). Pass `set(fn, true)` to replace. Nested updates you do yourself, immutably.
- **Selectors** are the performance model. `useStore(s => s.count)` subscribes to `count` only. `useStore()` with no selector subscribes to the *whole* store and re-renders on any change.
- **Equality:** the default is `Object.is`. Return an object/array from a selector and every update creates a new reference → re-render. Fix with `useShallow` (v4/v5) so a `{ a, b }` selection compares field-by-field.
- **Middleware** are store wrappers: `persist` (localStorage/IndexedDB), `immer` (mutable syntax), `devtools` (Redux DevTools), `subscribeWithSelector` (imperative subscriptions).

## 💻 Code

```ts
import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface CartState {
  items: Record<string, number>;
  add: (id: string) => void;
  total: () => number;
}

export const useCart = create<CartState>((set, get) => ({
  items: {},
  // set MERGES at the top level; we rebuild `items` immutably ourselves.
  add: (id) =>
    set((s) => ({ items: { ...s.items, [id]: (s.items[id] ?? 0) + 1 } })),
  total: () => Object.values(get().items).reduce((a, b) => a + b, 0),
}));
```

```tsx
function Badge() {
  // ✅ Subscribes to ONE derived value; re-renders only when the count changes.
  const count = useCart((s) => Object.keys(s.items).length);
  return <span>{count}</span>;
}

function Controls() {
  // ❌ New object every render → re-renders on ANY store change.
  const { add, items } = useCart((s) => ({ add: s.add, items: s.items }));

  // ✅ useShallow compares the picked fields individually.
  const { add: add2 } = useCart(useShallow((s) => ({ add: s.add })));
  return <button onClick={() => add2('sku-1')}>Add</button>;
}

// Outside React entirely — no hook needed:
useCart.getState().add('sku-2');
```

## ⚖️ Trade-offs

- **Use it when** you want global/shared client state without the Redux ceremony, or you need to mutate state from outside React (websockets, event buses). It's the pragmatic default for most apps that have outgrown `useState` + prop drilling.
- **Don't use it for** server cache — same rule as always: API data with fetching/caching/expiry belongs in React Query, not a Zustand store you hand-invalidate.
- **vs Redux:** Zustand drops the action/reducer indirection and the Provider. You lose the strict "every change is a named action" audit trail and enforced purity — for many teams a worthwhile trade, for a large regulated app maybe not.
- **vs Jotai:** Zustand is one store you select *from* (top-down); Jotai composes many atoms *up*. Zustand suits a cohesive store; Jotai suits fine-grained, independent pieces.
- **No enforced structure** is a double edge: freedom to shape the store however, and freedom to make a mess. Discipline is on you.

## 💣 Gotchas interviewers probe

- **Returning a fresh object/array from a selector** re-renders on every update because the default `Object.is` check fails. This is *the* Zustand gotcha — reach for `useShallow`, or select primitives with separate hook calls.
- **`set` merges, `useState` replaces.** Candidates expecting replace semantics overwrite nothing and are surprised. For nested state you still spread manually (or add the `immer` middleware).
- **Selecting the whole store** (`useStore()` with no selector) re-renders on any change — defeats the point. Always select.
- **SSR / Next.js:** a module-level `create` store is shared across requests on the server — a cross-request state leak. Use a per-request store created in context, or the `createStore` + Provider pattern.
- **Persist hydration mismatch:** `persist` rehydrates asynchronously, so the first server/client render can differ. Gate on `persist.onFinishHydration` / a `hasHydrated` flag to avoid hydration errors.
- **Stale closures:** capturing `get()` at the wrong time. `get()` inside an action always reads *current* state — use it, don't close over a snapshot.

## 🎯 Say this in the interview

> "Zustand is a tiny external store — basically a closure holding state plus a React hook built on `useSyncExternalStore`. There's no Provider; components subscribe with a selector and re-render only when that selected slice changes, which is the granularity Context can't give you. Because the store lives outside React, I can also read and write it from event handlers or a websocket via `getState`/`setState`, which is really handy. The two things I'm careful about: selectors that return a new object or array re-render on every update since the default equality is `Object.is`, so I use `useShallow`; and `set` merges at the top level rather than replacing like `useState`, so nested updates I still spread myself. And I'd never put server data in it — that's a cache, it belongs in React Query."

## 🔗 Go deeper

- [Zustand — Docs](https://zustand.docs.pmnd.rs/) — the whole API is small; read `getting-started` and the middleware pages.
- [Zustand — Prevent re-renders with useShallow](https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow) — the fix for the new-reference selector bug.
- [React — useSyncExternalStore](https://react.dev/reference/react/useSyncExternalStore) — the primitive Zustand rides on, and why it avoids tearing.
- [Zustand — SSR and hydration](https://zustand.docs.pmnd.rs/guides/nextjs) — the per-request store pattern that avoids state leaks.
