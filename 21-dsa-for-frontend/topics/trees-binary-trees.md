<div align="center">

# Trees & binary trees

<sub>🧠 DSA for Frontend · 🟡 Medium · ⏱ 1.5h · `#trees`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A tree is nodes with children and no cycles; **the DOM is a tree**, so this is the most frontend-relevant structure in DSA. Master the four traversals (DFS: pre/in/post-order, plus BFS level-order) and recursion becomes your default tool — most tree problems are "visit every node and combine the children's answers."

---

## 🧠 Mental model

A tree is a **recursive structure**: every node is itself the root of a subtree. That's why recursion fits so naturally — you solve a node by asking its children the same question and combining their answers. "Height of a tree = 1 + max(height of children)" is the entire pattern in one line.

```
        A            DFS pre-order:  A B D E C F   (node, then children)
       / \           DFS in-order:   D B E A C F   (left, node, right)
      B   C          DFS post-order: D E B F C A   (children, then node)
     / \   \         BFS level-order: A B C D E F  (row by row)
    D   E   F
```

The recognition signal: **DFS when you go "as deep as possible then backtrack"** (path sums, height, "does a root-to-leaf path exist") — **BFS when you need level-by-level or the shortest path in edges** ("nodes at depth k", "minimum depth", "level order print"). This is the same DFS/BFS split you'll use on graphs — a tree is just a graph with no cycles.

## ⚙️ How it actually works

**All four traversals visit every node once → O(n) time.** They differ in *space* and *order*:

| Traversal | How | Space | Use for |
|---|---|---|---|
| DFS (recursive) | recurse into children | O(h) stack, h = height | most problems; path/height/aggregate |
| DFS (iterative) | explicit **stack** | O(h) | when recursion might overflow |
| BFS level-order | **queue** | O(w), w = max width | shortest path, per-level work |

**DFS vs BFS space is a real trade-off, not a wash.** DFS costs O(height); BFS costs O(width). A deep skinny tree is cheap for BFS, expensive (deep stack) for DFS. A bushy balanced tree is the opposite — the bottom level alone holds ~n/2 nodes, so BFS's queue balloons to O(n). Pick the traversal whose *frontier* stays small.

**Pre / in / post-order is just *when you process the node relative to its children*:** pre = before (top-down, good for copying/serialising), in = between (yields **sorted order** for a Binary Search Tree), post = after (bottom-up, good for deleting or computing sizes/heights that depend on children).

**BST invariant:** left subtree < node < right subtree. That makes search/insert/delete O(h) — **O(log n) if balanced, O(n) if degenerate** (inserting sorted data builds a linked list). Self-balancing trees (AVL, red-black) guarantee O(log n); browsers use tree structures internally, and `Map` iteration order aside, many language `SortedMap`/`TreeMap` types are red-black trees.

**The DOM connection is literal.** `element.children`, `parentNode`, `querySelectorAll` doing a subtree walk, event bubbling walking `parentNode` to the root — these are tree traversals. Recursively serialising a DOM node, computing the depth of the deepest nesting, or diffing two trees (the Virtual DOM!) are all this topic.

## 💻 Code

DFS recursively — the template for most tree problems:

```js
// Max depth — "1 + max of children" is the whole recursion.
function maxDepth(node) {
  if (!node) return 0;                    // base case: empty subtree
  return 1 + Math.max(maxDepth(node.left), maxDepth(node.right));
}

// In-order = sorted output for a BST. Left, node, right.
function inorder(node, out = []) {
  if (!node) return out;
  inorder(node.left, out);
  out.push(node.val);       // process BETWEEN the children
  inorder(node.right, out);
  return out;
}
```

BFS with a queue — the moment you need level-by-level:

```js
function levelOrder(root) {
  if (!root) return [];
  const levels = [], queue = [root];
  while (queue.length) {
    const level = [], count = queue.length;   // snapshot THIS level's size
    for (let i = 0; i < count; i++) {
      const node = queue.shift();             // (use a head pointer in real code)
      level.push(node.val);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    levels.push(level);
  }
  return levels;
}
```

Frontend-flavoured: recursively walk the DOM (real interview question).

```js
function countNodes(el) {
  let count = 1;                                   // this element
  for (const child of el.children) count += countNodes(child); // subtree
  return count;
}
```

## ⚖️ Trade-offs

- **Recursive DFS is clean but risks stack overflow** on pathologically deep trees (a 50k-deep DOM, a deeply nested JSON). The iterative-with-explicit-stack version is uglier but stack-safe — reach for it when depth is unbounded/attacker-controlled.
- **BFS finds the shallowest answer first** (minimum depth, shortest path in edges) but holds an entire level in memory. DFS finds *an* answer with less memory but not necessarily the closest. Choose by whether "closest" matters.
- **A BST is only fast if balanced.** Building one from sorted input degrades to O(n) — if you don't control insertion order, you need a self-balancing tree or you're better off with a hashmap (O(1) average) unless you specifically need *ordered* iteration/range queries.

## 💣 Gotchas interviewers probe

- **In-order traversal of a BST yields sorted order** — the go-to for "validate a BST" or "kth smallest". Not knowing this is a common miss.
- **DFS space is O(height), BFS space is O(width)** — candidates say "both O(n)" and miss that the *right* choice depends on tree shape.
- **Unbalanced BST degrades to O(n).** "O(log n) search" is only true when balanced — state the assumption.
- **`shift()` in BFS is O(n).** The level-order queue should use a head pointer, or your O(n) traversal is secretly O(n²).
- **Base case first.** Forgetting the `if (!node) return` null check is the most common recursion crash. Every tree recursion starts there.
- **Validate a BST correctly.** Checking only `left < node < right` locally is wrong — you must pass down `[min, max]` bounds, because a deep left descendant can still violate the invariant against an ancestor.
- **The Virtual DOM diff is a tree traversal** — reconciliation walks two trees. Connecting DSA to React here is a strong signal.

## 🎯 Say this in the interview

> "A tree is a recursive structure, so recursion is my default — I solve a node by combining its children's answers, like height being one plus the max of the children. I pick DFS when I'm going deep and backtracking — path sums, height, root-to-leaf checks — and BFS with a queue when I need level-by-level work or the shortest path in edges. The trade-off people miss is space: DFS costs O(height), BFS costs O(width), so tree shape decides. For a BST, in-order traversal gives me sorted output, which is how I'd validate one or find the kth smallest — though I'd validate with min/max bounds, not just local comparisons. And I'd point out this is the most frontend-relevant structure there is: the DOM is a tree, event bubbling and `querySelectorAll` are traversals, and the Virtual DOM diff is literally walking two trees."

## 🔗 Go deeper

- [NeetCode — practice (Trees)](https://neetcode.io/practice) — traversals, BST validation, level order, path problems in order.
- [MDN — Node.childNodes / traversal](https://developer.mozilla.org/en-US/docs/Web/API/Node) — the DOM as a tree you traverse with the same techniques.
- [javascript.info — Recursion and the stack](https://javascript.info/recursion) — why recursive DFS costs O(height) stack space.
