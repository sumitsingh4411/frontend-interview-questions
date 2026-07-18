<div align="center">

# Reconciliation & keys

<sub>⚛️ React · 🟡 Medium · ⏱ 45m · `#rendering` `#internals`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Reconciliation is React deciding, for each position in the tree, **"same element → update the existing fiber, or different → throw it away and build a new one."** The decision hinges on **element type + key**. Keys are how you tell React *identity* so it can move a fiber instead of destroying and recreating it — which is what preserves state, DOM, and focus across reorders.

---

## 🧠 Mental model

React holds the previous tree of **fibers** (its internal instances) and compares it to the new **element** tree your render produced. For each slot it asks one question: *is this the same thing as before?*

- **Same `type` and same `key`** → reuse the fiber. Keep its state and DOM node, just apply prop changes.
- **Different `type` or `key`** → unmount the old fiber (destroying its state) and mount a fresh one.

The mental model that makes keys click: **state lives at a position in the tree, identified by type + key — not by which component wrote it.** `<Counter/>` in slot 0 has a state cell. If slot 0 still holds a `<Counter/>` next render, that cell survives. Change what occupies slot 0, and its state is gone.

A general tree diff is O(n³). React makes it O(n) with two heuristics: **different types are never diffed** (a `<div>` never morphs into a `<span>`, the whole subtree is replaced), and **siblings are matched by key**, not by deep comparison.

## ⚙️ How it actually works

**Positional matching by default.** With no keys, React pairs old and new children *by index*. Child 0 to child 0, child 1 to child 1. If the type at that index matches, the fiber is reused and only props update.

**Keys override position with identity.** When children have keys, React matches by key instead of index. A row that moved from index 5 to index 0 keeps its fiber — React records a *move*, not a destroy + create. This is why keyed lists preserve input values, scroll position, animation state, and focus across reordering.

**Type change nukes the subtree.** If element type at a slot changes (`<ProfileA/>` → `<ProfileB/>`, or even wrapping a subtree in an extra `<div>`), React unmounts everything below and remounts it. State, DOM, effects — all reset. Conditionally rendering the *same* component under different wrappers is a classic accidental-remount bug.

**Keys are scoped to siblings.** They must be unique *among siblings*, not globally. And they're compile-time metadata lifted out of props — `props.key` is `undefined` inside the component.

**Weaponising the key: force a remount.** Changing a component's `key` deliberately (`<Form key={userId} />`) tells React "this is a different instance" so it *resets all internal state* — the idiomatic way to blow away form state when the underlying entity changes.

## 💻 Code

```jsx
// ❌ Index as key: React matches by position anyway, so index adds nothing
//    and actively lies when the list reorders. Delete row 0 and every row's
//    state shifts up by one — checkboxes, inputs, focus all land on the wrong item.
{rows.map((row, i) => <Row key={i} data={row} />)}

// ✅ Stable identity from the data. Now a reorder moves fibers correctly.
{rows.map((row) => <Row key={row.id} data={row} />)}
```

```jsx
// Reset state on purpose by changing the key — cleaner than a useEffect
// that manually clears every field when `userId` changes.
function Editor({ userId }) {
  return <ProfileForm key={userId} userId={userId} />; // remounts per user
}
```

```jsx
// ❌ Same component, different wrappers → React sees a type change at the slot
//    and REMOUNTS <Chat/>, wiping its draft message.
{isWide ? <div className="wide"><Chat /></div> : <Chat />}

// ✅ Keep <Chat/> in a stable position; move the styling, not the element's ancestry.
<div className={isWide ? "wide" : ""}><Chat /></div>
```

## ⚖️ Trade-offs

- **Index keys are acceptable only when the list is static** — never reordered, filtered, inserted-into, or sorted, and items have no local state. The moment any of that changes, index keys silently corrupt state.
- **`Math.random()` / `Date.now()` as keys is worse than index** — a new key every render forces a full unmount + remount of every row on every render, killing performance *and* focus. This is a red flag in a review.
- **Key-to-remount is powerful but blunt.** It throws away *all* state and re-runs *all* effects. When you only want to reset one field, do it explicitly; reserve key-remounting for "this is genuinely a different entity."

## 💣 Gotchas interviewers probe

- **"Why not use the array index as a key?"** Because React already matches by position without keys — the index adds no identity, and it *breaks* the instant the list reorders, since state stays pinned to position while data moves. Naming this precisely is a strong signal.
- **State follows position, not the component.** Two `<Counter/>`s swapped by a conditional can appear to "swap" their counts, because the state is tied to the slot. Keys fix it.
- **Keys don't need to be globally unique** — only unique among siblings. Candidates who insist on UUIDs everywhere misunderstand the scope.
- **Changing a key resets state; that's a feature, not a bug** — the canonical way to reset an uncontrolled form when the entity changes.
- **`key` is not readable as a prop.** It's reconciliation metadata; `props.key` is `undefined`.
- **A type change remounts the whole subtree.** Even an "innocent" extra wrapper `<div>` introduced conditionally counts as a different type at that slot.

## 🎯 Say this in the interview

> "Reconciliation is React deciding, position by position, whether the new element is the same thing as the old one — and the test is element type plus key. Same type and key, it reuses the fiber and keeps its state and DOM; different, it unmounts and remounts, which resets everything. Keys exist because by default React matches siblings by index, and index is a lie the moment a list reorders — the data moves but the state stays pinned to position, so checkboxes and inputs land on the wrong rows. A stable id from the data fixes that by letting React move fibers instead of recreating them. I also use keys deliberately in reverse: putting `key={userId}` on a form is the cleanest way to force a remount and reset all its state when the entity changes."

## 🔗 Go deeper

- [react.dev — Preserving and resetting state](https://react.dev/learn/preserving-and-resetting-state) — state-follows-position, with interactive demos.
- [react.dev — Rendering lists](https://react.dev/learn/rendering-lists) — the rules for keys.
- [react.dev — Reconciliation (legacy but still accurate)](https://legacy.reactjs.org/docs/reconciliation.html) — the O(n) heuristics explained by the team.
- [react.dev — `useState`, resetting with a key](https://react.dev/reference/react/useState#resetting-state-with-a-key) — the intentional-remount pattern.
