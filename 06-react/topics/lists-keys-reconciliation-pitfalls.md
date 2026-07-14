<div align="center">

# Lists, keys & reconciliation pitfalls

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#rendering`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — When you `.map()` data to elements, the **key** is the identity React uses to match each item across renders. Get it right (stable id from the data) and reorders/inserts/deletes just work; get it wrong (array index, `Math.random()`) and you get mis-attached state, lost focus, wrong animations, and subtle data corruption that looks like a React bug but is yours.

---

## 🧠 Mental model

A rendered list is not "a list of components" — it's a set of tree positions React has to keep matching up as the underlying array changes. Keys are the join condition.

Think of it like a database join: without a key, React joins old rows to new rows **by row number** (index). With a key, it joins **by primary key**. Everyone knows joining by row number breaks the instant you sort or filter — same thing here. The key is your row's stable identity, and everything item-local (input text, `useState`, focus, CSS transition, scroll) is attached to whichever fiber that identity maps to.

The single rule: **keys must be stable, unique among siblings, and derived from the data — not from render-time position or randomness.**

## ⚙️ How it actually works

**Index keys are the same as no keys — until the list mutates.** React already matches siblings by position when there are no keys, so `key={index}` adds *nothing* for a static list. The damage appears on reorder/insert/delete: the *data* moves to a new index, but React sees "key 0 is still key 0" and keeps the old item's local state at that position. Delete the first of three rows and rows visually shift up, but their internal state (a checkbox, a half-typed input) stays pinned to the index — so state lands on the wrong item.

**Random keys are catastrophic.** `key={Math.random()}` or `key={uuid()}` *generated during render* produces a brand-new key every render, so React thinks every item is new: it unmounts and remounts the entire list every render. You lose focus mid-type, animations restart, and performance tanks. Generate ids when the data is *created*, not when it's rendered.

**Fragments in lists** need `<React.Fragment key={id}>` (the long form) because the shorthand `<>` can't take a key.

**Keys don't get passed to your component.** `props.key` is `undefined`; if you also need the id inside the item, pass it as a separate prop *and* as the key.

## 💻 Code

```jsx
// ❌ Index key + stateful rows = state attached to position, not to data.
function TodoList({ todos }) {
  return todos.map((todo, i) => <TodoRow key={i} todo={todo} />);
  // Delete todos[0] → every row's <input> value shifts to the wrong todo.
}

// ✅ Stable id → React moves fibers with the data; local state follows the item.
function TodoList({ todos }) {
  return todos.map((todo) => <TodoRow key={todo.id} todo={todo} />);
}
```

```jsx
// ❌ Key minted at render time → every render is a full remount.
{items.map((it) => <Card key={Math.random()} item={it} />)}

// ✅ If the data truly has no id, derive a stable one ONCE when you build it.
const withIds = useMemo(
  () => rawItems.map((it, i) => ({ ...it, _id: `${it.name}-${i}` })),
  [rawItems]
);
{withIds.map((it) => <Card key={it._id} item={it} />)}
```

```jsx
// No natural id and the list can reorder? Composite key from stable fields.
{people.map((p) => <Row key={`${p.email}`} person={p} />)} // email is unique & stable
```

## ⚖️ Trade-offs

- **Index keys are fine — narrowly.** Static, never-reordered, never-filtered lists of stateless items (a rendered menu of constants). The moment the list can change shape or items hold local state, switch to real ids. Treat "is this list ever mutated?" as the deciding question.
- **Don't fabricate ids just to satisfy the linter.** If your data genuinely lacks identity and never reorders, index is honest. Slapping `uuid()` on at render time is strictly worse.
- **Keys interact with virtualization.** In a windowed list (react-window/virtuoso), keys must still be the *data's* id, not the visible-row index — otherwise recycled rows carry stale state as you scroll.

## 💣 Gotchas interviewers probe

- **"What breaks with index keys?"** Local state, focus, and animations attach to the position, not the item; on reorder/insert/delete the data moves but the state stays, so it lands on the wrong row. Being able to say *why* (React matches by index without a key anyway) is the senior signal.
- **`Math.random()` as a key is a full remount every render** — worse than index. It's a common "clever" mistake that destroys focus and perf.
- **Keys are sibling-scoped**, not global. Two separate lists can both use `key={0}`; there's no collision across lists.
- **Reordering breaks CSS transitions with index keys** — the DOM node stays put and only content swaps, so FLIP animations animate the wrong elements.
- **Uncontrolled inputs in a list are the sharpest tell** — with index keys, delete a middle row and a `defaultValue` input keeps the deleted row's DOM node (and text) at that index.
- **`key` isn't a prop** — need the id inside the component? Pass it twice: `<Row key={id} id={id} />`.

## 🎯 Say this in the interview

> "The key is the identity React uses to match each list item across renders — think of it as a join key. Without one, React joins old and new items by array index, which is exactly why index keys break: on a reorder or delete the data moves but React keeps each item's local state pinned to its position, so checkboxes, input text, and focus land on the wrong row. The fix is a stable id from the data. The worse mistake is a key generated at render time, like `Math.random()` — that makes every item look new, so React remounts the whole list every render and you lose focus mid-keystroke. Index keys are only safe for static, stateless lists that never reorder. And I remember keys are sibling-scoped and aren't passed to the component as a prop."

## 🔗 Go deeper

- [react.dev — Rendering lists](https://react.dev/learn/rendering-lists) — the rules for keys, with the index-key warning.
- [react.dev — Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) — why state follows key/position.
- [react.dev — Keeping list items in order with `key`](https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key) — the canonical do/don't.
- [Robin Wieruch — Why index as key is an anti-pattern](https://www.robinwieruch.de/react-list-key/) — worked examples of the state-shift bug.
