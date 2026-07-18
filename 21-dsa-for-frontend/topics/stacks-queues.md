<div align="center">

# Stacks & queues

<sub>🧠 DSA for Frontend · 🟢 Easy · ⏱ 45m · `#stack` `#queue`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A **stack** is LIFO (last in, first out); a **queue** is FIFO (first in, first out). The signal: reach for a stack when you need to remember "the most recent unresolved thing" (matching brackets, undo, DFS), and a queue when you must process "in arrival order" (BFS, task scheduling, rate-limit buffers).

---

## 🧠 Mental model

Both are just *ordered access disciplines* over a list — the difference is **which end you take from**.

```
STACK (LIFO)              QUEUE (FIFO)
push →│ D │               enqueue → │ A B C D │ → dequeue
       │ C │  ← pop                   ↑ front    ↑ back
       │ B │                take from front, add to back
       │ A │
     take from top
```

A stack answers "what's the most recent thing I haven't dealt with yet?" — which is exactly the shape of nested/matching problems and depth-first exploration. A queue answers "what came first?" — level-by-level processing, fairness, buffering.

The frontend connection is direct: **the JS call stack is a stack**, the **event loop's task/microtask queues are queues**, and the browser's history is a stack. These aren't analogies — they're literally these data structures.

## ⚙️ How it actually works

**Stack in JS: just an array.** `push` and `pop` both operate on the *end* — both amortised O(1). That's the entire implementation; no class needed.

**Queue is where people go wrong.** The naive queue is `push` to add and `shift` to remove — but **`shift()` is O(n)** because it re-indexes every remaining element. A loop of `shift()`s is O(n²). The correct O(1) queue options:

- **Head-pointer array:** keep an index `head` instead of calling `shift`; `dequeue` returns `arr[head++]`. O(1) per op, O(n) memory that you can periodically compact.
- **Two stacks:** an `inbox` and `outbox`. Enqueue pushes to `inbox`; dequeue pops from `outbox`, refilling it by draining `inbox` (reversing order) when empty. Each element is moved at most once between stacks → **O(1) amortised**.
- **Linked list** with head and tail pointers: true O(1) both ends, at the cost of pointer overhead.

**Two stacks make a queue; two queues make a stack.** This pair is a classic interview question specifically because it tests whether you understand LIFO vs FIFO deeply enough to simulate one with the other.

**Deque (double-ended queue):** both ends support O(1) add/remove — the substrate for sliding-window-maximum and other monotonic-structure problems.

## 💻 Code

Stack — balanced brackets, the archetypal stack problem:

```js
function isBalanced(s) {
  const pairs = { ')': '(', ']': '[', '}': '{' };
  const stack = [];
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') stack.push(ch);   // remember open
    else if (ch in pairs) {
      if (stack.pop() !== pairs[ch]) return false;  // must match MOST RECENT open
    }
  }
  return stack.length === 0;   // nothing left unclosed
}
```

Queue — O(1) amortised via two stacks (never use `shift` in a hot loop):

```js
class Queue {
  #inbox = [];   // enqueue side
  #outbox = [];  // dequeue side (reversed)

  enqueue(x) { this.#inbox.push(x); }        // O(1)

  dequeue() {
    if (this.#outbox.length === 0) {          // refill only when empty
      while (this.#inbox.length) this.#outbox.push(this.#inbox.pop()); // reverse
    }
    return this.#outbox.pop();                // O(1) amortised
  }

  get size() { return this.#inbox.length + this.#outbox.length; }
}
```

The trap to avoid:

```js
// ❌ O(n²): each shift() re-indexes the whole array.
const q = [];
while (q.length) process(q.shift());

// ✅ O(n) total: head pointer, no re-indexing.
let head = 0;
while (head < q.length) process(q[head++]);
```

## ⚖️ Trade-offs

- **Array-as-stack is perfect; array-as-queue is a trap.** `push`/`pop` are O(1); `shift` is O(n). If you catch yourself writing `shift()` in a loop, switch to a head pointer or two-stack queue.
- **Two-stack queue is O(1) *amortised*, not per-op.** One dequeue occasionally does O(n) work to drain the inbox — usually fine, but for latency-sensitive paths a linked-list queue gives worst-case O(1).
- **Memory:** the head-pointer queue never reclaims the consumed prefix until you compact it, so a long-lived queue slowly leaks. Reset `arr = arr.slice(head)` periodically, or use a ring buffer for bounded queues.
- **Don't build a class when an array literal will do.** For a quick stack, `[]` with `push`/`pop` is idiomatic and fast — reserve the class for queues where you're hiding the O(1) machinery.

## 💣 Gotchas interviewers probe

- **`shift()` is O(n).** The single most common queue mistake — and interviewers deliberately ask you to build a queue to see if you know it.
- **"Implement a queue with two stacks"** (and the reverse). Know the amortised argument: each element moves between stacks at most once.
- **Which end?** Stack pushes and pops the *same* end; queue adds one end, removes the other. Mixing them up (`push` + `pop` thinking it's FIFO) is a subtle bug.
- **The call stack IS a stack** — "maximum call stack size exceeded" is stack overflow from too-deep recursion. Converting recursion to iteration means managing an explicit stack yourself.
- **Microtask vs macrotask queues** are both queues but drained differently (microtasks fully between each macrotask) — a favourite when the round bridges DSA and the event loop.
- **Monotonic stack/queue** — keeping elements in sorted order as you push/pop — is the pattern behind "next greater element" and "sliding window maximum". Recognising it separates senior from mid.

## 🎯 Say this in the interview

> "Stack is LIFO, queue is FIFO — the whole choice is which end you remove from. I reach for a stack when the problem is about the *most recent unresolved item*: bracket matching, undo, or depth-first traversal where I explicitly manage a stack instead of recursing. I reach for a queue when order of arrival matters — breadth-first traversal, scheduling, buffering. In JS the stack is trivial: an array with `push`/`pop`, both O(1). The queue is where people slip, because `shift` is O(n) — it re-indexes everything — so a `shift` loop is secretly O(n²). I implement a real queue with either a head pointer or two stacks for O(1) amortised. And I'd point out these aren't abstractions in frontend — the call stack, the browser history, and the event loop's task queues are literally these structures."

## 🔗 Go deeper

- [NeetCode — practice (Stack)](https://neetcode.io/practice) — valid parentheses, min stack, monotonic-stack problems in order.
- [MDN — Array push/pop/shift/unshift](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — confirm which operations are O(1) vs O(n).
- [MDN — The event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model) — the call stack and task queues as real stacks and queues.
