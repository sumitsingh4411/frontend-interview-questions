# 21 · DSA for Frontend

Yes, frontend interviews have a DSA round — but it's a **specific slice**. You rarely need dynamic programming on trees; you very often need arrays, strings, hashmaps, recursion, and **trees (the DOM is a tree!)**. This section is that focused slice, plus the "frontend-flavored" algorithm problems companies actually ask.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

### 🎯 How DSA shows up in frontend loops
- **Phone screens** — one array/string/hashmap problem, often with a UI twist.
- **Coding rounds** — a DSA problem *or* a "frontend DSA" problem (flatten, DOM traversal, LRU).
- **Machine coding** — DSA hides inside components (tree render, virtualization math, debounce).

📖 Best practice hubs: [NeetCode 150 ⭐](https://neetcode.io/practice) · [BFE.dev (frontend-flavored) ⭐](https://bigfrontend.dev/) · [GreatFrontEnd coding](https://www.greatfrontend.com/questions/js) · [LeetCode patterns](https://seanprashad.com/leetcode-patterns/)

---

## 📏 Complexity first

| Topic | Difficulty | Time | Tags | Best Resource |
|-------|:----------:|:----:|------|---------------|
| Big-O notation (time & space) | 🟢 | 45m | `#complexity` | [Big-O cheat sheet ⭐](https://www.bigocheatsheet.com/) |
| Analyzing loops & recursion | 🟡 | 45m | `#complexity` | [NeetCode ⭐](https://neetcode.io/courses) |
| Amortized analysis (dynamic arrays) | 🟡 | 30m | `#complexity` | [MDN: arrays](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) |

## 🧱 Core data structures

| Topic | Difficulty | Time | Tags | Best Resource |
|-------|:----------:|:----:|------|---------------|
| Arrays & string manipulation | 🟢 | 1h | `#arrays` `#strings` | [NeetCode: arrays ⭐](https://neetcode.io/practice) |
| Hash maps & sets | 🟢 | 1h | `#hashmap` | [MDN: Map/Set ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) |
| Stacks & queues | 🟢 | 45m | `#stack` `#queue` | [NeetCode: stack ⭐](https://neetcode.io/practice) |
| Linked lists | 🟡 | 1h | `#linked-list` | [NeetCode ⭐](https://neetcode.io/practice) |
| Trees & binary trees | 🟡 | 1.5h | `#trees` | [NeetCode: trees ⭐](https://neetcode.io/practice) |
| Tries (autocomplete!) | 🔴 | 1h | `#trie` `#search` | [NeetCode ⭐](https://neetcode.io/practice) |
| Heaps / priority queues | 🔴 | 1h | `#heap` | [NeetCode ⭐](https://neetcode.io/practice) |
| Graphs (BFS/DFS basics) | 🔴 | 1.5h | `#graphs` | [NeetCode: graphs ⭐](https://neetcode.io/practice) |

## 🔁 Patterns you must know

| Pattern | Difficulty | Time | Tags | Best Resource |
|---------|:----------:|:----:|------|---------------|
| Two pointers | 🟡 | 45m | `#two-pointers` | [NeetCode ⭐](https://neetcode.io/practice) |
| Sliding window | 🟡 | 1h | `#sliding-window` | [NeetCode ⭐](https://neetcode.io/practice) |
| Prefix sum | 🟡 | 45m | `#prefix-sum` | [LeetCode patterns ⭐](https://seanprashad.com/leetcode-patterns/) |
| Recursion & backtracking | 🔴 | 1.5h | `#recursion` | [NeetCode ⭐](https://neetcode.io/practice) |
| BFS / DFS traversal | 🔴 | 1h | `#traversal` | [NeetCode ⭐](https://neetcode.io/practice) |
| Binary search | 🟡 | 45m | `#binary-search` | [NeetCode ⭐](https://neetcode.io/practice) |
| Sorting (and custom comparators) | 🟡 | 45m | `#sorting` | [MDN: sort ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) |
| Intervals (merge/overlap) | 🟡 | 45m | `#intervals` | [NeetCode ⭐](https://neetcode.io/practice) |
| Dynamic programming (intro) | 🔴 | 2h | `#dp` | [NeetCode: DP ⭐](https://neetcode.io/practice) |

---

## ⭐ Frontend-flavored DSA problems

The DSA problems that show up **specifically** in frontend interviews — data structures applied to real UI/JS work. High-signal; practice these first.

| Problem | Difficulty | Time | Tags | Resource |
|---------|:----------:|:----:|------|----------|
| Flatten a nested array | 🟡 | 30m | `#recursion` `#arrays` | [BFE.dev ⭐](https://bigfrontend.dev/) |
| Flatten a deeply nested object | 🟡 | 45m | `#recursion` `#objects` | [BFE.dev](https://bigfrontend.dev/) |
| Deep clone (handle cycles) | 🟡 | 45m | `#recursion` `#objects` | [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) |
| Deep equal / `isEqual` | 🟡 | 45m | `#recursion` | [BFE.dev](https://bigfrontend.dev/) |
| **DOM tree traversal** (BFS/DFS) | 🟡 | 45m | `#trees` `#dom` | [MDN: TreeWalker](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker) |
| `getElementsByClassName` / querySelector polyfill | 🔴 | 1h | `#dom` `#trees` | [BFE.dev](https://bigfrontend.dev/) |
| Find element's path / LCA in the DOM | 🔴 | 1h | `#trees` `#dom` | [BFE.dev](https://bigfrontend.dev/) |
| Render a tree (nested comments/menu) | 🟡 | 45m | `#recursion` `#trees` | [Nested comments flagship](../16-machine-coding/nested-comments.md) |
| Build a tree from a flat list (parentId) | 🟡 | 45m | `#trees` | [State normalization](../13-state-management/) |
| **LRU cache** | 🔴 | 45m | `#hashmap` `#linked-list` | [BFE.dev ⭐](https://bigfrontend.dev/) |
| Implement `JSON.stringify` | 🔴 | 1h | `#recursion` `#strings` | [BFE.dev](https://bigfrontend.dev/) |
| Implement `JSON.parse` (tokenizer) | 🔴 | 1.5h | `#parsing` | [BFE.dev](https://bigfrontend.dev/) |
| Virtual DOM diff | 🔴 | 1.5h | `#trees` `#react` | [Build your own](../19-build-your-own/) |
| Group anagrams / frequency count | 🟢 | 30m | `#hashmap` `#strings` | [NeetCode](https://neetcode.io/practice) |
| Debounce / throttle | 🟡 | 30m | `#queue` `#timing` | [JS flagship](../03-javascript/promise-polyfills-and-throttle-debounce.md) |
| Event emitter (pub/sub) | 🟡 | 30m | `#hashmap` `#patterns` | [Observer flagship](../18-design-patterns/observer-event-bus.md) |
| Promise pool / task scheduler | 🔴 | 45m | `#queue` `#async` | [BFE.dev](https://bigfrontend.dev/) |
| Rate limiter / token bucket | 🔴 | 45m | `#queue` `#timing` | [BFE.dev](https://bigfrontend.dev/) |
| Memoize with cache key | 🟡 | 30m | `#hashmap` | [BFE.dev](https://bigfrontend.dev/) |
| Search/filter a large list (trie/index) | 🔴 | 1h | `#trie` `#search` | [Autocomplete flagship](../15-system-design/design-autocomplete.md) |
| Merge intervals (calendar events) | 🟡 | 45m | `#intervals` | [NeetCode](https://neetcode.io/practice) |
| Undo/redo stack | 🟡 | 45m | `#stack` | [Command pattern](../18-design-patterns/) |

---

## 🗺️ Suggested order

1. **Complexity** → know how to reason about Big-O.
2. **Arrays, strings, hashmaps** → 80% of phone-screen problems.
3. **Recursion + trees** → the frontend sweet spot (DOM, nested data).
4. **Frontend-flavored problems** above → the highest-signal practice.
5. **Two pointers, sliding window, binary search** → common mediums.
6. **Graphs, heaps, DP** → only if targeting Staff / heavy-DSA companies.

**Related:** [03-javascript](../03-javascript/) · [16-machine-coding](../16-machine-coding/) · [19-build-your-own](../19-build-your-own/)

_Know a frontend-flavored DSA problem we're missing? [Add it](../CONTRIBUTING.md)._
