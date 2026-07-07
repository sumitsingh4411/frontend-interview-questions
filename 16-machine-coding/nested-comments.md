# Build Nested Comments (Tree)

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#recursion` `#tree` `#state`

**Asked at:** _Meta, Reddit-style products, Atlassian_ · **Related:** [Kanban](kanban-drag-and-drop.md) · [File Explorer / Tree View](README.md)

---

## 1. The Question

> Build a nested comment thread (Reddit/HN style): comments can have replies, arbitrarily deep. Support collapse/expand, reply, and delete.

## 2. Requirements

**Functional**
- [ ] Render a tree of comments to arbitrary depth.
- [ ] Reply to any comment (adds a child).
- [ ] Collapse/expand a subtree.
- [ ] Delete a comment (and its subtree).
- [ ] Show reply counts on collapsed nodes.

**Non-functional**
- [ ] Handle deep nesting without breaking layout or perf.
- [ ] Immutable updates (predictable state).
- [ ] Keyboard accessible; indentation is visual, not semantic-only.

## 3. Data Model

```ts
type Comment = {
  id: string;
  text: string;
  author: string;
  children: Comment[]; // or store flat: { id, parentId } + build tree
};
```

Two shapes:
- **Nested** (`children[]`) — natural to render recursively; updates require recursive tree edits.
- **Normalized flat** (`{id → comment, parentId}`) — O(1) updates by id, build the tree with a memoized selector. **Prefer flat for large threads.**

## 4. Implementation Notes & Trade-offs

**Rendering** → a recursive `<CommentNode>` that maps over `children` and renders itself. Pass `depth` for indentation; cap visual indent so deep threads don't run off-screen (clamp padding, or "continue thread" link like Reddit).

**Immutable updates** → adding/removing a node in a nested tree means cloning the path to the node. With a **normalized** store it's a simple map update + selector rebuild — cleaner and faster. Discuss both.

**Collapse/expand** → per-node `collapsed` state (local component state or a `Set<id>` in the store). Collapsed nodes still show a reply count.

**Delete semantics** → deleting removes the subtree, or replaces with "[deleted]" if children remain (product decision — call it out).

**Performance** → very deep/large threads: lazy-render collapsed subtrees (don't mount hidden children), and consider windowing the top level. Avoid re-rendering the whole tree on one edit — memoize nodes (`React.memo` keyed by id) and update via normalized state.

**Accessibility** → use a `tree`/`group` structure or headings + landmarks; make collapse toggles real `<button>`s with `aria-expanded`; ensure keyboard focus order follows visual order.

**Edge cases** → empty thread; optimistic reply (temp id); very long single-line text (wrap/break); recursion depth limits.

## 5. What Interviewers Probe

- Nested vs normalized state — trade-offs.
- How do you update immutably deep in a tree?
- Avoiding full re-renders on a single edit (memoization).
- Handling extreme depth (indent clamping, lazy render).
- Accessibility of a collapsible tree.

## 6. Curated Resources

- [react.dev: rendering lists & recursion ⭐](https://react.dev/learn/rendering-lists)
- [Redux: normalizing state shape](https://redux.js.org/usage/structuring-reducers/normalizing-state-shape)
- [ARIA APG: tree view](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/)

## 7. Related Topics

- [Kanban board](kanban-drag-and-drop.md)
- [State: normalization](../13-state-management/)
- [JS: recursion & immutability](../03-javascript/)
