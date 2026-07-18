<div align="center">

# Rules of hooks

<sub>⚛️ React · 🟢 Easy · ⏱ 30m · `#hooks`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Call hooks **only at the top level, only from React functions, and in the same order every render.** This isn't style policing: React stores hook state in a **positional linked list** and matches each call to its slot **by call order** — a conditional hook shifts every later index and hands the wrong state to the wrong hook.

---

## 🧠 Mental model

Hooks have no names as far as React is concerned. `useState` doesn't know it's called `count`. React identifies a hook purely by **the order in which it's called** during a render. First `useState` → slot 0. Second `useState` → slot 1. The `useEffect` after it → slot 2. Every render must produce that *exact same sequence* so React can line up each call with the state it created last time.

> The rules aren't arbitrary — they're the API contract that a *positional* storage model requires. Break call-order stability and you're indexing into the wrong memory cell.

That's the entire reason for both rules:
1. **Top level only** (no `if`/`for`/`return`/nested functions) → guarantees the same calls in the same order.
2. **React functions only** (components or other hooks) → guarantees there *is* a fiber holding the linked list to index into.

## ⚙️ How it actually works

Each fiber owns a **linked list of hook records** (`memoizedState`). On the *first* render React walks your component top to bottom; each hook call appends a node (its state, its deps, its queue) to the list. On *every subsequent* render React walks the same list in lock-step with your calls: call #0 reads node #0, call #1 reads node #1, and so on.

Now insert a conditional:

```
Render 1 (loggedIn = true)        Render 2 (loggedIn = false)
 [0] useState(name)                [0] useState(name)
 [1] useState(theme)  ← in if      [1] useEffect(...)   ← was [2]!
 [2] useEffect(...)
```

On render 2 the `if` is skipped, so `useEffect` is now the *second* call and reads node **[1]** — which holds `theme`'s state and queue. State is corrupted, effects fire with the wrong deps, and you may crash with "rendered fewer hooks than expected." There is no name to fall back on; position is the only key.

**Why not name them?** Because a stable, per-call identity would require either explicit keys on every hook (ugly) or a compiler. The linked-list-by-order design keeps the hook API dead simple at the cost of these two rules — a deliberate trade.

**The linter enforces it structurally.** `eslint-plugin-react-hooks` flags hooks under conditionals/loops and uses the `use` prefix + capitalised component name to know where the rules apply. It also powers the exhaustive-deps rule. React 19's Compiler assumes these rules hold — it can't safely memoise code that violates them.

## 💻 Code

```jsx
// ❌ Conditional hook: on renders where user is null, the hook count changes.
function Profile({ user }) {
  if (!user) return <Login />;        // early return BEFORE a hook below
  const [tab, setTab] = useState(0);  // ← sometimes call #0, sometimes never called
  useEffect(() => log(user.id), [user.id]);
  return <Tabs value={tab} onChange={setTab} />;
}

// ✅ Hooks first, unconditionally. Branch on the VALUE, not on the call.
function Profile({ user }) {
  const [tab, setTab] = useState(0);              // always call #0
  useEffect(() => { if (user) log(user.id); }, [user]); // condition INSIDE
  if (!user) return <Login />;                    // early return AFTER hooks
  return <Tabs value={tab} onChange={setTab} />;
}
```

```jsx
// ❌ Hook in a loop / callback — order depends on data, and it's not a React fn.
items.forEach((it) => useState(it));   // count varies with items.length
button.onClick = () => useState(0);    // not called during render at all

// ✅ Need N states? Use ONE state holding a collection.
const [values, setValues] = useState(() => items.map(() => ""));
```

## ⚖️ Trade-offs

- **The rules cost you ergonomics** — you can't conditionally "turn off" a hook, so you sometimes run an effect that immediately no-ops, or call `useMemo` you only need on one branch. That waste is the price of the simple positional model, and it's cheap.
- **Custom hooks compose freely** *because* of the rule — a hook can call other hooks unconditionally, and they all flatten into the caller's one ordered list. The rule that constrains you is the same one that makes composition trivial.
- **When you genuinely need conditional logic**, move the condition *inside* the hook (guard the effect body, pass `undefined` deps) rather than around the call.

## 💣 Gotchas interviewers probe

- **"Why can't hooks be conditional?"** Because state is matched by call order into a linked list, so a skipped call shifts every later index onto the wrong slot. Answering "the linter says so" is a junior answer; explaining the positional storage is the senior one.
- **Early `return` before a hook is a conditional hook** — the sneakiest violation, because there's no `if` around the hook itself.
- **A hook in a loop or event handler** breaks the rule too — loops make the count data-dependent, and handlers don't run during render.
- **"Rendered fewer hooks than expected"** is the runtime symptom of a hook count that changed between renders.
- **Custom hooks must start with `use`** so the linter knows to apply the rules and check deps inside them.
- **The rules apply per-component-instance**, but the linked list is per-fiber — which is exactly why two components calling the same custom hook don't share state.

## 🎯 Say this in the interview

> "React stores hook state in a linked list on the fiber and matches each hook call to its slot purely by call order — there are no names. So the rules — top level only, and only from React functions — exist to guarantee the same hooks are called in the same order every render. If I put a hook behind an `if` or an early return, then on the render where it's skipped every later hook shifts up one slot and reads the wrong state; you get corrupted state or the 'rendered fewer hooks' crash. The fix is always to call hooks unconditionally and move the condition inside — guard the effect body instead of the call. That same positional model is why custom hooks compose so cleanly: they just flatten into the caller's ordered list, and it's why two components using one hook get independent state."

## 🔗 Go deeper

- [react.dev — Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks) — the two rules and the reasoning.
- [react.dev — State: a component's memory](https://react.dev/learn/state-a-components-memory#how-does-react-know-which-state-to-return) — the official "matched by call order" explanation.
- [React RFC — Hooks: why call order](https://legacy.reactjs.org/docs/hooks-rules.html#explanation) — the array/linked-list model walked through.
- [eslint-plugin-react-hooks](https://www.npmjs.com/package/eslint-plugin-react-hooks) — the enforcement you should always have on.
