<div align="center">

# Heaps / priority queues

<sub>🧠 DSA for Frontend · 🔴 Hard · ⏱ 1h · `#heap`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A heap is a tree that keeps the min (or max) at the root with **O(log n) insert and O(log n) extract**, and O(1) peek. The recognition signal: **"top-k", "k largest/smallest", "median of a stream", or "always process the highest-priority item next"** — that's a priority queue, and a heap is how you build one.

---

## 🧠 Mental model

A heap answers one question fast: *"what's the smallest (or largest) thing right now?"* — while still letting you add and remove efficiently. A sorted array gives O(1) min but O(n) insert; an unsorted array gives O(1) insert but O(n) to find the min. A heap is the **balance**: O(log n) for both, O(1) to peek.

The trick is that a heap is only *partially* ordered — a **min-heap** guarantees every parent ≤ its children, so the minimum bubbles to the root, but siblings are unordered. That weaker invariant is exactly why it's cheaper to maintain than a fully sorted structure.

```
min-heap (parent ≤ children):        stored as a flat array:
        1                            [1, 3, 2, 7, 4, 9, 8]
      /   \                           parent(i) = (i-1) >> 1
     3     2                          left(i)   = 2i + 1
    / \   / \                         right(i)  = 2i + 2
   7  4  9  8
```

The elegant part: a heap is a **complete binary tree**, so it packs perfectly into an array with no pointers — parent/child are pure index arithmetic. No node objects, no wasted space.

## ⚙️ How it actually works

**Two operations, both O(log n) because they walk one root-to-leaf path:**

- **Insert (sift-up):** append to the end of the array, then swap it upward while it's smaller than its parent, until the heap property holds. At most `height = log n` swaps.
- **Extract-min (sift-down):** the root is your answer; move the last element to the root, then swap it downward with its smaller child until it settles. Again ≤ log n swaps.

**Peek is O(1)** — the min is always at index 0. **Build-heap from an array is O(n)**, *not* O(n log n) — a subtle, favourite interview fact. Sifting down from the bottom up, most nodes are near the leaves and sift a short distance; the sum works out to O(n).

**The signature use: top-k in O(n log k).** To find the k largest of n items, keep a **min-heap of size k**. Push each item; if the heap exceeds k, pop the smallest. The heap always holds the k biggest seen so far, and each of n pushes/pops is O(log k). This beats sorting everything (O(n log n)) when k ≪ n, and it works on a **stream** where you can't hold all n items at once — the frontend-real case: "top 10 trending items from an infinite feed."

**Streaming median = two heaps:** a max-heap for the lower half, a min-heap for the upper half, kept balanced. The median is the root(s). O(log n) per element, O(1) to read the median.

**Heapsort:** build-heap then extract-min n times → O(n log n), in-place, but not stable and cache-unfriendly, so real engines use it only as the fallback tier of introsort.

## 💻 Code

A min-heap — the array-backed implementation interviewers expect (JS has **no built-in heap**):

```js
class MinHeap {
  #h = [];
  peek() { return this.#h[0]; }                 // O(1)
  get size() { return this.#h.length; }

  push(val) {                                    // O(log n)
    this.#h.push(val);
    let i = this.#h.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.#h[parent] <= this.#h[i]) break;  // heap property holds
      [this.#h[parent], this.#h[i]] = [this.#h[i], this.#h[parent]]; // sift up
      i = parent;
    }
  }

  pop() {                                        // O(log n) — extract-min
    const top = this.#h[0], last = this.#h.pop();
    if (this.#h.length) {
      this.#h[0] = last;
      let i = 0;
      const n = this.#h.length;
      while (true) {
        let smallest = i, l = 2 * i + 1, r = 2 * i + 2;
        if (l < n && this.#h[l] < this.#h[smallest]) smallest = l;
        if (r < n && this.#h[r] < this.#h[smallest]) smallest = r;
        if (smallest === i) break;
        [this.#h[i], this.#h[smallest]] = [this.#h[smallest], this.#h[i]]; // sift down
        i = smallest;
      }
    }
    return top;
  }
}
```

Top-k largest with a size-k min-heap — O(n log k):

```js
function topK(nums, k) {
  const heap = new MinHeap();
  for (const n of nums) {
    heap.push(n);
    if (heap.size > k) heap.pop();   // evict the smallest → heap keeps the k biggest
  }
  return [...Array(k)].map(() => heap.pop()); // ascending; reverse if you want desc
}
```

## ⚖️ Trade-offs

- **Heap vs sort for top-k:** sorting is O(n log n) and dead simple; a heap is O(n log k). If `k` is close to `n`, just sort — the heap's win only shows when `k ≪ n` or the data is a stream you can't fully materialise. Don't over-engineer a heap for "top 3 of 20 items."
- **Heaps give you the extreme, not order.** They're wrong when you need the *full* sorted sequence or arbitrary-position access — that's a sorted array or balanced BST. A heap only cheaply exposes the min/max.
- **No `decrease-key` in the naive version.** Dijkstra "needs" it; the pragmatic fix is to push duplicates and skip stale entries on pop. A pairing/Fibonacci heap does it properly but is rarely worth the complexity.
- **JS ships no heap.** You implement it, or pull a tiny library. Interviewers expect you to hand-roll the array version.

## 💣 Gotchas interviewers probe

- **k-largest uses a *min*-heap (and k-smallest a *max*-heap)** — the counterintuitive one. The min-heap's root is the *weakest* of your current top-k, so it's exactly what to evict. Getting this backwards is the classic error.
- **Build-heap is O(n), not O(n log n).** Knowing this — and roughly why (most nodes sift a short distance) — is a strong senior signal.
- **Peek O(1), insert/extract O(log n), search O(n).** A heap can't find an arbitrary element fast — only the root. Candidates over-claim its powers.
- **Partially ordered, not sorted.** In-order traversal of a heap is meaningless; only the root is guaranteed. Some think a heap is sorted — it isn't.
- **Array index math:** parent `(i-1)>>1`, children `2i+1`/`2i+2`. Off-by-one here corrupts the heap silently.
- **Stability & comparator.** For objects you must pass a comparator; and heapsort isn't stable. Mention when that matters.

## 🎯 Say this in the interview

> "A heap keeps the min or max at the root with O(log n) insert and extract and O(1) peek, backed by a flat array where parent and child are just index math. My trigger for it is 'top-k', 'kth largest', 'streaming median', or 'always take the highest-priority item next'. The move people get backwards is that k-*largest* uses a *min*-heap of size k: the root is the weakest of my current top-k, so when the heap exceeds k I pop it, and each operation is O(log k) — that's O(n log k) total, which beats sorting when k is much smaller than n or when it's a stream I can't fully hold. Two facts I'd drop: build-heap is O(n), not O(n log n), because most nodes sift a short distance; and a heap is only partially ordered, so it's the wrong tool if I need the full sorted order. And JS has no built-in heap, so I'd hand-roll the array version."

## 🔗 Go deeper

- [NeetCode — practice (Heap / Priority Queue)](https://neetcode.io/practice) — kth largest, top-k frequent, find median from data stream.
- [Wikipedia — Binary heap](https://en.wikipedia.org/wiki/Binary_heap) — sift-up/down, the O(n) build-heap proof, and array index formulas.
- [MDN — Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — the backing store; why a flat array beats a pointer tree for a complete binary tree.
