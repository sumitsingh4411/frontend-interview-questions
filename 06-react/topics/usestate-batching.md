<div align="center">

# `useState` & batching

<sub>⚛️ React · 🟢 Easy · ⏱ 45m · `#hooks` `#state`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `setState` doesn't mutate a variable; it **schedules a re-render**, and the state value is a frozen snapshot for the current render. React **batches** multiple updates in the same tick into one render (in React 18, *everywhere* — including promises and timeouts), so read the previous value with the **functional updater** `setX(x => x + 1)`, never `setX(x + 1)`.

---

## 🧠 Mental model

`const [count, setCount] = useState(0)` gives you two things: a **snapshot** of the state for this render (`count` is just a number, fixed) and a **request function** (`setCount`) that asks React to render again with a new value.

The crucial reframe: **state is a snapshot, not a variable.** Within one render, `count` never changes — even after you call `setCount`. You don't see the new value until the *next* render, when React calls your function again and hands you the updated snapshot. This is why "I called setState but it logged the old value" is expected, not a bug.

Batching is the second half: **within a single event (or tick), all your `setState` calls are collected and applied in one re-render**, not one render each. Three `setCount` calls with the direct form all read the *same* stale snapshot, so they collapse to a single +1.

## ⚙️ How it actually works

**`setState` enqueues an update and marks the fiber dirty.** React doesn't re-run your component synchronously; it schedules work. After the current event handler finishes, React processes the queue and renders once.

**Direct value vs functional updater — the whole ballgame:**

```js
setCount(count + 1); // "set it to (this render's count) + 1" — uses the snapshot
setCount(c => c + 1);// "set it to (whatever it is when applied) + 1" — reads the queue
```

Three direct calls in a row all compute from the same snapshot `count`, so `count+1, count+1, count+1` → net **+1**. Three functional calls each receive the running result of the queue → **+3**. The updater is the only way to build on updates you just queued.

**Automatic batching (React 18).** Before 18, React only batched inside React event handlers; updates inside `setTimeout`, promises, or native events each caused a separate render. React 18's `createRoot` batches **everywhere** — timeouts, `fetch().then`, native handlers — so `flushSync` is now the *opt-out* when you truly need a synchronous DOM update between two state changes.

**Bail-out on `Object.is`.** If you `setState` to a value that's `Object.is`-equal to the current one, React bails out — it may render once to compare, then skip committing. This is why passing a *new object with the same contents* still re-renders: `{a:1} !== {a:1}`.

**Lazy initialiser.** `useState(() => expensive())` runs the initialiser only on the first render. `useState(expensive())` runs `expensive()` *every* render and throws the result away — a common perf leak.

## 💻 Code

```jsx
// ❌ Three direct updates read the SAME snapshot → net +1, not +3.
function BrokenCounter() {
  const [n, setN] = useState(0);
  const tripleUp = () => { setN(n + 1); setN(n + 1); setN(n + 1); }; // → n+1
  return <button onClick={tripleUp}>{n}</button>;
}

// ✅ Functional updater reads the queued value each time → +3.
const tripleUp = () => { setN(v => v + 1); setN(v => v + 1); setN(v => v + 1); };
```

```jsx
// ❌ Mutating state in place — same reference → Object.is bail-out → no re-render.
setItems(items.push(newItem) && items); // push returns length; and it's a mutation

// ✅ New reference for a new value.
setItems(prev => [...prev, newItem]);
```

```jsx
// Lazy init: run the expensive read from localStorage exactly once.
const [data, setData] = useState(() => JSON.parse(localStorage.getItem("k")) ?? {});

// Opt OUT of batching when you must read the DOM between two updates (rare).
flushSync(() => setOpen(true)); // DOM is updated synchronously here
node.scrollIntoView();          // now safe to measure/scroll
```

## ⚖️ Trade-offs

- **Prefer the functional updater whenever the next state depends on the previous** — it's correct under batching, StrictMode double-invokes, and stale closures alike. Use the direct form only for "set to this fixed value."
- **Automatic batching is almost always a win** (fewer renders, no intermediate flicker). `flushSync` is an escape hatch that forces a synchronous render+commit — it defeats batching, so reserve it for measuring the DOM between updates.
- **Don't over-split state into many `useState`s** if they always change together — a single object (or `useReducer`) keeps related transitions atomic and readable. Conversely, don't jam unrelated values into one object just to have fewer hooks.

## 💣 Gotchas interviewers probe

- **"Why does `setN(n+1)` three times only add one?"** Because all three read the same render snapshot of `n`, and batching collapses them. The functional updater fixes it. This is the flagship question.
- **State updates are asynchronous within an event** — logging `n` right after `setN` shows the old value. You get the new value on the next render.
- **Mutating state doesn't re-render** — same reference passes the `Object.is` bail-out. Always produce a new object/array.
- **`useState(expensive())` runs every render**; `useState(() => expensive())` runs once. Easy, costly slip.
- **React 18 batches in timeouts/promises now** — code that relied on separate renders per async update behaves differently after upgrading.
- **Setting state during render** (not in an effect/handler) is only legal as the "store previous prop" pattern with a guard; otherwise it's an infinite loop.
- **Passing a function as the new value** requires the updater form: `setValue(() => fn)` to *store* a function, since `setValue(fn)` would *call* it.

## 🎯 Say this in the interview

> "`setState` doesn't mutate anything — it schedules a re-render, and the state I read in this render is a frozen snapshot. So three `setN(n+1)` calls in one handler all read the same snapshot and collapse to a single increment, especially since React 18 batches every update in a tick into one render, even inside promises and timeouts. The fix is the functional updater, `setN(v => v + 1)`, which reads the value as the queue is applied — I default to it whenever the next state depends on the previous. Two other things I'm careful about: mutating state in place doesn't re-render because React bails out on `Object.is`, so I always return a new object; and I use the lazy initialiser for expensive initial state so it runs once. If I ever need the DOM updated synchronously between two updates I reach for `flushSync`, but that's rare."

## 🔗 Go deeper

- [react.dev — `useState`](https://react.dev/reference/react/useState) — the reference, including lazy init and updater form.
- [react.dev — State as a snapshot](https://react.dev/learn/state-as-a-snapshot) — why reads are frozen per render.
- [react.dev — Queueing a series of state updates](https://react.dev/learn/queueing-a-series-of-state-updates) — batching and the updater, worked through.
- [React 18 — Automatic batching](https://react.dev/blog/2022/03/29/react-v18#new-feature-automatic-batching) — what changed and how to opt out.
