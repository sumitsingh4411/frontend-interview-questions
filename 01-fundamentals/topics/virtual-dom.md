<div align="center">

# Virtual DOM

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#dom` `#react`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The Virtual DOM is a lightweight JS object tree describing what the UI *should* look like. On update, the framework diffs the new tree against the old and applies the **minimum set of real DOM mutations**. The point is **not raw speed** — hand-written DOM code is always faster. The point is that it makes a *declarative* programming model affordable.

---

## 🧠 Mental model

The honest framing, and the one that impresses:

> **The Virtual DOM is not a performance optimisation. It is a performance *budget* you pay in exchange for never writing imperative DOM updates again.**

Without it, you write "when `count` changes, find that span and set its textContent". With it, you write `<span>{count}</span>` and re-render the *whole* component tree, and the diff makes that affordable. You have traded a small, predictable CPU cost for the elimination of an entire category of bugs — stale UI, forgotten update paths, DOM and state drifting apart.

Anyone who says "the VDOM is fast" has it backwards. Say instead: **"the VDOM is fast *enough* that I can be declarative."**

## ⚙️ How it actually works

Three steps per update:

1. **Render** → call your components, producing a new tree of plain objects:
   ```js
   { type: 'li', props: { className: 'row' }, children: ['Sumit'], key: 'u1' }
   ```
   These are cheap: no layout, no style, just object allocation.

2. **Diff (reconciliation)** → compare new tree vs previous tree. A true tree-diff is O(n³), which is unusable, so React applies **two heuristics** to get O(n):
   - **Different element type ⇒ throw the whole subtree away and rebuild.** `<div>` → `<span>` does not attempt to reuse children.
   - **Children are compared by `key`**, not by position.

3. **Commit** → apply only the computed mutations to the real DOM, in one batch.

The real DOM is the expensive part (layout, paint), which is why minimising mutations matters more than the diff cost itself.

## 💻 Code

**Why `key` is not cosmetic.** Rendering a list without keys, then prepending an item:

```jsx
// ❌ index keys — React compares by position
{items.map((item, i) => <Row key={i} item={item} />)}
```

Prepend "Zara" to `[Ann, Bob]`:

| position | before | after | React's conclusion |
|---|---|---|---|
| key 0 | Ann | Zara | "same key ⇒ same component — just change the text" |
| key 1 | Bob | Ann | "same key ⇒ mutate text" |
| key 2 | — | Bob | "new node ⇒ mount" |

So React **mutated every row** instead of inserting one — and any internal state (an open dropdown, a focused input, a half-typed value) is now attached to the **wrong item**. That is the bug: not slowness, *state corruption*.

```jsx
// ✅ stable identity — React matches by id and inserts ONE node
{items.map((item) => <Row key={item.id} item={item} />)}
```

**The reconciliation heuristic, made visible:**

```jsx
// Type changed div → section: the entire subtree unmounts and remounts.
// All child state is destroyed. This surprises people.
{isWide ? <div><Editor /></div> : <section><Editor /></section>}
```

## ⚖️ Trade-offs

- **Memory + CPU overhead per update.** You allocate a whole tree of objects on every render, then throw it away. That's GC pressure a hand-written update never pays.
- **It cannot beat a targeted mutation.** `el.textContent = n` will always beat render → diff → commit. VDOM wins on *maintainability*, not on microbenchmarks.
- **Alternatives now question the premise entirely:**
  - **Svelte** compiles away the VDOM — it knows at *build* time which DOM node depends on which variable, and generates direct mutations.
  - **Solid / signals** use fine-grained reactivity: the component runs once, and only the specific text node subscribing to `count` updates. No diff at all.
  - This is the current industry direction, and mentioning it signals you're not stuck in 2018.

## 💣 Gotchas interviewers probe

- **"Is the Virtual DOM faster than the real DOM?"** — This is a **trap**. The correct answer is *no*: it's an abstraction whose cost buys you a declarative model. Candidates who say "yes, it's faster" fail this.
- **Why not `key={index}`?** Because on reorder/insert, index keys tie component identity to *position*, so state lands on the wrong row. Index keys are safe **only** if the list is append-only and never reordered or filtered.
- **The diff is O(n) only because of the heuristics** — a general tree diff is O(n³). Naming that is a strong signal.
- **VDOM ≠ Shadow DOM.** Completely unrelated: one is a diffing strategy, the other is browser-native style/DOM encapsulation. Interviewers *love* this confusion.
- **Re-render ≠ re-paint.** React re-running your component costs JS time; if the diff yields no changes, the browser paints nothing. "Wasted renders" are a JS cost, not a pixel cost.
- **React 18's `startTransition`** doesn't make the diff faster — it makes it *interruptible*, so urgent input isn't blocked.

## 🎯 Say this in the interview

> "The Virtual DOM is a plain JS object tree describing the intended UI. On update, the framework builds a fresh tree, diffs it against the previous one, and commits only the minimal real-DOM mutations. The nuance I'd stress is that it's **not** a speed optimisation — imperative DOM code is always faster. It's what makes a *declarative* model affordable: I describe what the UI should be for a given state and never hand-write update paths, which kills a whole class of stale-UI bugs. A general tree diff is O(n³), so React gets to O(n) with two heuristics: different element type means blow away the subtree, and children are matched by key. That's exactly why index keys are dangerous — on a prepend, identity follows position, so component state ends up attached to the wrong item. And it's worth noting Svelte and Solid reject the premise entirely and compile to direct updates or fine-grained signals."

## 🔗 Go deeper

- [React — Render and commit](https://react.dev/learn/render-and-commit) — the official mental model.
- [React — Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) — where keys and reconciliation actually bite.
- [Build your own React](https://pomb.us/build-your-own-react/) — implement the diff yourself; nothing teaches it faster.
- [Rich Harris — Virtual DOM is pure overhead](https://svelte.dev/blog/virtual-dom-is-pure-overhead) — the counter-argument, and required reading.
