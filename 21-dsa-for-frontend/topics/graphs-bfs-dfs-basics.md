<div align="center">

# Graphs (BFS/DFS basics)

<sub>🧠 DSA for Frontend · 🔴 Hard · ⏱ 1.5h · `#graphs`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A graph is nodes joined by edges, possibly with cycles — so unlike a tree, **you must track visited nodes or you loop forever**. BFS (queue) explores level by level and finds the **shortest path in unweighted graphs**; DFS (stack/recursion) goes deep and suits cycle detection, topological sort, and connectivity.

---

## 🧠 Mental model

A tree is a graph with no cycles and a single root. A **graph** drops both guarantees: any node can link to any other, cycles are allowed, and there may be no single entry point. Those two differences drive everything:

1. **Cycles mean you need a `visited` set** — without it, DFS/BFS revisit nodes endlessly. This is the #1 thing that separates graph traversal from tree traversal.
2. **No root means you may need to start traversal from *every* unvisited node** to cover disconnected components.

```
Adjacency list (the representation you'll almost always use):
  A: [B, C]        A —— B
  B: [A, D]        │    │
  C: [A, D]        C —— D
  D: [B, C]        (undirected: edges appear both ways)
```

**Frontend relevance is real:** a dependency graph (webpack modules, npm packages, React component/hook dependencies), the state machine behind a multi-step form, "friends of friends" social features, and detecting circular imports are all graph problems.

## ⚙️ How it actually works

**Representation first.** An **adjacency list** (`Map<node, node[]>`) is the default — O(V + E) space, O(degree) to list a node's neighbours, perfect for the *sparse* graphs you meet in practice. An **adjacency matrix** (`V×V` grid) is O(V²) space but O(1) edge lookup — only worth it for dense graphs or when you constantly ask "is there an edge between X and Y?".

**BFS vs DFS — same O(V + E) time, different order and different jobs:**

| | BFS | DFS |
|---|---|---|
| Frontier | **queue** (FIFO) | **stack** / recursion (LIFO) |
| Explores | level by level | deep, then backtrack |
| Superpower | **shortest path in *unweighted* graph** | cycle detection, topological sort, connected components |
| Space | O(width) — can be O(V) | O(depth) — recursion stack |

**BFS finds shortest paths because it expands in rings of increasing distance** — the first time it reaches a node is guaranteed via a shortest edge-count path. This only holds for **unweighted** graphs; add edge weights and you need **Dijkstra** (BFS + a min-heap, always expanding the closest unfinished node) or, with negative weights, Bellman-Ford.

**DFS's jobs:** *cycle detection* (in a directed graph, a back-edge to a node currently on the recursion stack = cycle — this is how "circular dependency detected" works); *topological sort* (order nodes so every edge points forward — build order for modules with dependencies, via DFS post-order reversed or Kahn's algorithm on in-degrees); *connected components* (each fresh DFS from an unvisited node discovers one component).

**The `visited` set placement matters:** mark a node visited *when you enqueue it* in BFS (not when you dequeue), or you'll queue the same node many times and blow up to near-exponential work on dense graphs.

## 💻 Code

Both traversals over an adjacency list — note the `visited` guard:

```js
const graph = new Map([
  ['A', ['B', 'C']], ['B', ['A', 'D']],
  ['C', ['A', 'D']], ['D', ['B', 'C']],
]);

// BFS — shortest path (in edges) from start to target in an UNWEIGHTED graph.
function shortestPath(graph, start, target) {
  const queue = [[start]];              // queue of PATHS
  const visited = new Set([start]);     // mark on ENQUEUE, not dequeue
  let head = 0;                         // head pointer — never shift()
  while (head < queue.length) {
    const path = queue[head++];
    const node = path[path.length - 1];
    if (node === target) return path;   // first arrival = shortest
    for (const next of graph.get(node) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push([...path, next]);
      }
    }
  }
  return null;                          // unreachable
}

// DFS — recursive, for reachability / component discovery.
function dfs(graph, node, visited = new Set()) {
  if (visited.has(node)) return visited; // the cycle guard
  visited.add(node);
  for (const next of graph.get(node) ?? []) dfs(graph, next, visited);
  return visited;
}
```

Cycle detection in a directed graph — the "circular dependency" check:

```js
function hasCycle(graph) {
  const WHITE = 0, GRAY = 1, BLACK = 2;   // unseen / on-stack / done
  const color = new Map([...graph.keys()].map((k) => [k, WHITE]));
  const visit = (node) => {
    color.set(node, GRAY);                 // now on the recursion stack
    for (const next of graph.get(node) ?? []) {
      if (color.get(next) === GRAY) return true;          // back-edge → cycle
      if (color.get(next) === WHITE && visit(next)) return true;
    }
    color.set(node, BLACK);                // fully explored
    return false;
  };
  return [...graph.keys()].some((n) => color.get(n) === WHITE && visit(n));
}
```

## ⚖️ Trade-offs

- **BFS for shortest paths, DFS for structure.** Using DFS to find a shortest path is a bug — DFS returns *a* path, not the *shortest*. Using BFS for topological sort is awkward. Match the traversal to the question.
- **Adjacency list vs matrix:** list for sparse graphs (nearly always, in frontend); matrix only when the graph is dense or you need O(1) edge existence checks. The matrix's O(V²) memory is prohibitive for large sparse graphs.
- **BFS holds a whole frontier in memory** (O(V) worst case); recursive DFS holds a path (O(depth)) but can stack-overflow on deep graphs — switch to an explicit stack when depth is unbounded.
- **Weighted graphs break plain BFS.** The instant edges have costs, reach for Dijkstra (non-negative) — don't claim BFS gives shortest paths without saying "unweighted".

## 💣 Gotchas interviewers probe

- **Forgetting `visited`.** On a cyclic graph this is an infinite loop — the defining difference from tree traversal. The first thing they check.
- **Mark visited on enqueue, not dequeue.** Marking at dequeue lets the same node be queued many times before it's processed — a real, subtle performance bug.
- **BFS shortest path is *unweighted only*.** State the assumption; the follow-up is always "what if edges have weights?" → Dijkstra with a min-heap.
- **Disconnected graphs.** A single traversal covers one component — you must loop over all nodes to reach every component (counting islands / connected components).
- **Directed vs undirected.** In an undirected adjacency list every edge appears twice; cycle detection differs (a parent back-edge isn't a cycle in undirected, but is the signal in directed via the GRAY-node/on-stack check).
- **`shift()` for the BFS queue is O(n)** → the traversal becomes O(V²). Use a head pointer or a real queue.
- **Topological sort only exists for a DAG** — if there's a cycle, there's no valid ordering (that's exactly the "circular import" error).

## 🎯 Say this in the interview

> "A graph is nodes and edges with possible cycles and no single root, so two things change versus a tree: I always keep a `visited` set or a cyclic graph loops forever, and I may have to start from every unvisited node to cover disconnected components. I default to an adjacency list — a Map of node to neighbours — because real graphs are sparse. BFS with a queue explores in rings, so the first time it reaches a node is the shortest path in *edges* — but only for unweighted graphs; add weights and it's Dijkstra, which is BFS with a min-heap. DFS goes deep and is my tool for cycle detection, topological sort, and connected components — the circular-dependency check is literally a DFS finding a back-edge to a node still on the recursion stack. Two bugs I avoid: marking visited on enqueue rather than dequeue, and never using `shift` for the queue since that makes it O(V²). This shows up in frontend as module dependency graphs and circular-import detection."

## 🔗 Go deeper

- [NeetCode — practice (Graphs)](https://neetcode.io/practice) — number of islands, clone graph, course schedule (topological sort), in order.
- [MDN — Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — the natural backing store for an adjacency list.
- [Wikipedia — Breadth-first search](https://en.wikipedia.org/wiki/Breadth-first_search) — why first-arrival equals shortest path, and where the weighted case (Dijkstra) takes over.
