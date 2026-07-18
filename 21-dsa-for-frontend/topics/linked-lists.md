<div align="center">

# Linked lists

<sub>🧠 DSA for Frontend · 🟡 Medium · ⏱ 1h · `#linked-list`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A linked list is nodes chained by pointers, so **insert/delete at a known position is O(1)** (just rewire pointers) but **random access is O(n)** (you must walk from the head). Almost every linked-list interview problem is solved by **two pointers** — usually a slow/fast pair — and by carefully not losing the `next` you're about to overwrite.

---

## 🧠 Mental model

An array stores elements *contiguously*, so index math gives you O(1) random access but insertion means shifting everything (O(n)). A linked list stores elements *scattered*, each holding a pointer to the next — so you trade away random access to gain O(1) splicing.

```
head → [1|•] → [2|•] → [3|•] → null
        val next
```

The mental unlock for interviews: **you can only ever see the node you're holding and its `next`.** Everything is local. So the entire craft is *pointer choreography* — maintaining `prev`, `curr`, and a saved `next` so you never orphan the rest of the list when you rewire a link.

**Why frontend cares:** you rarely hand-roll a linked list in app code, but the *pattern* is everywhere — an **LRU cache** is a doubly linked list + hashmap, React's **Fiber tree** is a linked structure (child/sibling/return pointers) enabling interruptible traversal, and undo/redo histories are linked chains.

## ⚙️ How it actually works

**Complexity, and the honest caveat:** insert/delete is O(1) *only if you already hold the node* (or its predecessor). Finding that node is O(n). So "O(1) delete" assumes you were handed the reference — real code often pairs a linked list with a hashmap (node → reference) to make that lookup O(1) too. That combo is the LRU cache.

**Singly vs doubly:** a singly linked node knows only `next` (can't walk backward, can't delete itself without its predecessor). A doubly linked node knows `prev` and `next` — needed for O(1) removal *given only the node*, and for backward traversal. LRU needs doubly linked precisely so it can evict a node it found via the hashmap in O(1).

**The two-pointer toolkit** solves most problems:

- **Slow/fast (Floyd's):** fast moves 2×, slow 1×. If they meet, there's a **cycle**. When fast hits the end, slow is at the **middle**. Fast `n` steps ahead lets slow land on the **nth-from-end**. All O(n) time, O(1) space.
- **Reversal:** walk with `prev`/`curr`, flipping each `next` to point backward — the single most-asked linked-list operation, and the one where losing `next` before you save it bites everyone.

**Dummy head node:** allocate a throwaway node before the real head so insert/delete at the front needs no special-case. It makes edge cases (empty list, deleting the head) disappear — a senior habit.

## 💻 Code

Reversal — the operation you must be able to write without thinking:

```js
function reverse(head) {
  let prev = null, curr = head;
  while (curr) {
    const next = curr.next;  // ✅ SAVE next BEFORE you overwrite it
    curr.next = prev;        // flip the pointer backward
    prev = curr;             // advance the window
    curr = next;
  }
  return prev;               // new head (old tail)
}
// O(n) time, O(1) space
```

Slow/fast — cycle detection and midpoint in one pass:

```js
function hasCycle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) {
    slow = slow.next;          // +1
    fast = fast.next.next;     // +2
    if (slow === fast) return true;   // they can only meet inside a loop
  }
  return false;                // fast reached null → no cycle
}

function middle(head) {
  let slow = head, fast = head;
  while (fast && fast.next) { slow = slow.next; fast = fast.next.next; }
  return slow;   // when fast is at the end, slow is at the middle
}
```

Dummy head — deletion with no front-of-list special case:

```js
function removeValue(head, target) {
  const dummy = { next: head };        // sentinel before the real head
  let prev = dummy;
  while (prev.next) {
    if (prev.next.val === target) prev.next = prev.next.next; // splice out, O(1)
    else prev = prev.next;
  }
  return dummy.next;                    // real head (maybe changed)
}
```

## ⚖️ Trade-offs

- **Linked lists win at O(1) splice, lose at everything else.** No random access, terrible cache locality (nodes scattered in memory → constant pointer chasing), and per-node object overhead. In practice a plain array beats a linked list for most real workloads *even for inserts*, because CPU cache locality dominates. Interviewers love them; production rarely does.
- **Use one only when you genuinely need O(1) insert/delete at held positions** — LRU eviction, a free list, an editor's piece table. Otherwise an array is faster and simpler.
- **Singly is lighter; doubly costs an extra pointer per node** but buys backward traversal and self-deletion. Pick doubly only when you need those.

## 💣 Gotchas interviewers probe

- **Losing the rest of the list.** Overwriting `curr.next` before saving it orphans everything downstream. The `const next = curr.next` line first is the whole trick.
- **Off-by-one in slow/fast.** The loop condition `fast && fast.next` differs for even/odd length and for "which middle" you want. Know why.
- **Null-pointer edge cases:** empty list, single node, deleting the head/tail. The dummy-head sentinel erases most of these — mention it.
- **"Why not just use an array?"** If you can't articulate cache locality and the O(1)-splice-vs-O(n)-access trade, you've memorised the structure without understanding when it's actually worth it.
- **Cycle detection with a Set is O(n) space; Floyd's is O(1) space.** Interviewers ask for O(1) to force the slow/fast insight.
- **LRU cache** = doubly linked list (recency order) + hashmap (key → node) for O(1) get *and* O(1) eviction. This is the #1 place linked lists show up in frontend loops — know it cold.

## 🎯 Say this in the interview

> "A linked list trades random access for O(1) splicing — insert or delete is just rewiring pointers, but only if I already hold the node, and finding it is O(n), which is why real uses pair it with a hashmap. Almost every problem here is two pointers. Slow and fast — Floyd's — gives me cycle detection, the midpoint, and the nth-from-end all in O(n) time and O(1) space. Reversal is `prev`/`curr` flipping links, and the one discipline that matters is saving `next` before I overwrite it, or I orphan the tail. I reach for a dummy head node to kill the front-of-list edge cases. And I'd be honest that in production I'd usually just use an array — cache locality beats theoretical O(1) inserts — but the pattern is real in an LRU cache, which is a doubly linked list plus a map for O(1) get and eviction, and in things like React's Fiber tree."

## 🔗 Go deeper

- [NeetCode — practice (Linked List)](https://neetcode.io/practice) — reverse, cycle detection, merge, LRU, in order.
- [javascript.info — Recursion and linked lists](https://javascript.info/recursion) — the "Linked list" section, and why arrays' cache locality often wins.
- [Wikipedia — Cycle detection (Floyd's)](https://en.wikipedia.org/wiki/Cycle_detection) — the tortoise-and-hare proof behind the O(1)-space slow/fast trick.
