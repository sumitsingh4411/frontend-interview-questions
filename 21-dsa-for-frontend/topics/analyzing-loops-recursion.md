<div align="center">

# Analyzing loops & recursion

<sub>🧠 DSA for Frontend · 🟡 Medium · ⏱ 45m · `#complexity`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — To read a loop's complexity, ask *"how many times does the body run relative to `n`?"*; to read recursion, count **how many calls × how much work each does** — most often via the recurrence `T(n) = a·T(n/b) + work`, which the Master Theorem turns into an answer.

---

## 🧠 Mental model

**Loops:** multiply the iteration counts of the loops you're nested inside. Two independent sequential loops *add* (`O(n) + O(n) = O(n)`); two nested loops *multiply* (`O(n) × O(n) = O(n²)`). The trap is a loop whose bound *shrinks or grows* with the outer one — those aren't a flat multiply.

**Recursion:** every recursive function is a tree of calls. Its complexity is **(number of nodes in the call tree) × (work per node)**. Draw the tree, count the nodes. Naive Fibonacci branches 2-ways to depth `n` → ~2ⁿ nodes → O(2ⁿ). Binary search recurses once on half → depth `log n`, one node per level → O(log n).

```
Merge sort          Naive fib(n)
   n        (n work)      f(n)
  / \                    /    \
 n/2 n/2   (n total)  f(n-1)  f(n-2)   ← branches, no sharing
 ...       log n           ... ~2ⁿ nodes
levels → O(n log n)        → O(2ⁿ)
```

## ⚙️ How it actually works

**The Master Theorem** covers divide-and-conquer recurrences `T(n) = a·T(n/b) + f(n)` — `a` sub-calls, each on size `n/b`, plus `f(n)` work to split/combine:

| Recurrence | Class | Example |
|---|---|---|
| `T(n) = 2T(n/2) + O(n)` | `O(n log n)` | merge sort |
| `T(n) = 2T(n/2) + O(1)` | `O(n)` | tree traversal (visit every node) |
| `T(n) = T(n/2) + O(1)` | `O(log n)` | binary search |
| `T(n) = T(n-1) + O(1)` | `O(n)` | linear recursion (linked-list walk) |
| `T(n) = 2T(n-1) + O(1)` | `O(2ⁿ)` | subsets, naive fib |

The two knobs that decide everything: **do you divide `n/b` or decrement `n-1`?** (halving gives log depth; decrementing gives linear depth), and **how many branches `a`?** (one branch = linear cost down the depth; two-plus branches = exponential explosion unless you share work).

**Sharing work collapses the tree.** Memoised Fibonacci computes each `f(k)` once — the tree becomes a line of `n` distinct subproblems → O(n) time, O(n) space. That's the entire idea of dynamic programming: recognise the call tree revisits the same subproblems and cache them.

**Loop bounds that aren't `n`:** a loop `for (let j = 1; j < n; j *= 2)` runs `log n` times, not `n`. A loop whose inner bound is `i` (`for j in 0..i`) sums to `0+1+…+n = n(n+1)/2` → O(n²), but a *different* O(n²) shape than a flat nested loop — same class, worth recognising.

## 💻 Code

```js
// Two SEQUENTIAL loops → add → O(n). Not O(n²).
function process(arr) {
  for (const x of arr) validate(x);   // O(n)
  for (const x of arr) render(x);     // O(n)  → total O(n)
}

// Inner bound depends on outer → triangular → O(n²).
function pairs(arr) {
  const out = [];
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)   // n + (n-1) + … ≈ n²/2
      out.push([arr[i], arr[j]]);
  return out;
}

// Halving loop → O(log n).
function highestPowerOfTwo(n) {
  let count = 0;
  for (let k = 1; k <= n; k *= 2) count++;  // runs log₂(n) times
  return count;
}
```

Recursion: the difference one line of caching makes.

```js
// O(2ⁿ) — the call tree branches twice and shares nothing.
const fib = (n) => (n < 2 ? n : fib(n - 1) + fib(n - 2));

// O(n) time, O(n) space — memo collapses duplicate subproblems.
const fibMemo = (n, memo = new Map()) => {
  if (n < 2) return n;
  if (memo.has(n)) return memo.get(n);
  const r = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
  memo.set(n, r);
  return r;
};

// O(n) time, O(1) space — bottom-up beats recursion when order is obvious.
const fibIter = (n) => {
  let [a, b] = [0, 1];
  for (let i = 0; i < n; i++) [a, b] = [b, a + b];
  return a;
};
```

## ⚖️ Trade-offs

- **Recursion is readable but not free** — every call frame is O(1) *space* on the call stack, so depth `n` recursion is O(n) memory and can overflow. JS engines mostly **don't** do tail-call optimisation (Safari is the lone exception), so you can't rely on it to flatten deep recursion.
- **Iterative is faster and stack-safe, but sometimes unreadable.** Tree/graph problems are far clearer recursively; a manual stack is the escape hatch only when depth threatens overflow.
- **Memoisation trades space for time**, and it only helps when subproblems actually *repeat*. Memoising a function that never revisits an input just wastes memory.

## 💣 Gotchas interviewers probe

- **Sequential vs nested.** Adjacent loops add, nested loops multiply. Candidates routinely call two sequential passes "O(n²)".
- **The inner loop's bound.** `for j in 0..i` (triangular) and `for j *= 2` (logarithmic) are *not* flat `n` inner loops. Read the bound, don't assume.
- **Recursion depth is space.** "It's O(n) time" is half an answer — deep recursion is O(n) stack and can crash. Say both.
- **No reliable TCO in JS.** Don't claim tail recursion is O(1) space in V8/Node — it isn't.
- **`n²` vs `2ⁿ`.** Nested loops are polynomial; branching recursion that decrements is exponential. Subset/permutation problems are the exponential family — recognise them by "generate all combinations".
- **Hidden loops in "one line".** `.map().filter().reduce()` chained is three passes, O(3n) = O(n) — fine — but a `.find()` *inside* a `.map()` is O(n²).

## 🎯 Say this in the interview

> "For loops I look at nesting: sequential loops add, nested loops multiply, and I read the inner bound carefully — a loop that doubles its counter is log n, and one bounded by the outer index is triangular, so O(n²). For recursion I picture the call tree — complexity is the number of calls times the work per call. A single recursive call on half the input is log depth; one call on n-1 is linear; two calls that decrement is exponential, which is the subsets-and-permutations family. When I see the same subproblem recomputed — like naive Fibonacci — I memoise to collapse the tree to O(n), or go bottom-up iterative to also drop the stack cost. And I always mention recursion depth as a space cost, because JS doesn't reliably optimise tail calls, so deep recursion can overflow."

## 🔗 Go deeper

- [NeetCode — courses](https://neetcode.io/courses) — recursion and complexity walkthroughs with the call-tree drawn out.
- [javascript.info — Recursion and the stack](https://javascript.info/recursion) — call stack frames and why depth costs memory.
- [Wikipedia — Master theorem](https://en.wikipedia.org/wiki/Master_theorem_(analysis_of_algorithms)) — the exact cases for divide-and-conquer recurrences.
