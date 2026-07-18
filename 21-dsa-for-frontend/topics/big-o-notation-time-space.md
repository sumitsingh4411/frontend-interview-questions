<div align="center">

# Big-O notation (time & space)

<sub>🧠 DSA for Frontend · 🟢 Easy · ⏱ 45m · `#complexity`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Big-O describes how the work **grows as the input grows**, ignoring constants and small terms. It answers one question — "if `n` doubles, what happens?" — and it's the language interviewers use to reject an O(n²) solution before you finish typing it.

---

## 🧠 Mental model

Big-O is a **shape**, not a stopwatch. It throws away the constant factor on purpose, because at interview scale the *growth rate* is what decides whether your code survives 10⁶ items. `O(n)` and `O(100n)` are the same class; `O(n)` and `O(n²)` are not remotely the same, and no constant will save the quadratic once `n` is large.

The ranking you must recognise instantly, best to worst:

```
O(1) < O(log n) < O(n) < O(n log n) < O(n²) < O(2ⁿ) < O(n!)
constant  binary   loop   good sort    nested   subsets  perms
          search          / heap ops    loops
```

The whole game in an interview is: *name the class of your solution, then argue you can't do better.* "This is O(n) and I have to read every element at least once, so it's optimal" is a complete, senior answer.

## ⚙️ How it actually works

Three rules generate almost every answer:

1. **Drop constants.** Two passes over the array is `O(2n) = O(n)`. Reading the array once and doing 40 things per element is still `O(n)`.
2. **Drop lower-order terms.** `O(n² + n)` is `O(n²)` — the `n` is noise next to `n²` at scale.
3. **Different inputs get different letters.** Iterating an `m`-length list inside an `n`-length list is `O(n·m)`, **not** `O(n²)`. Collapsing two independent sizes into one variable is a classic interview slip.

**Time and space are separate budgets.** A hashmap that turns an O(n²) two-pass into O(n) usually costs O(n) *space* — you're trading memory for speed. Saying "I can make this O(n) time but it costs O(n) space, or O(1) space if I sort first and accept O(n log n) time" is exactly the trade-off signal interviewers reward.

**Best / average / worst matter.** Hashmap lookup is O(1) *average*, O(n) worst case (every key collides into one bucket). Quicksort is O(n log n) average, O(n²) worst. Quote the average, but know the worst exists — that's the difference between memorising and understanding.

## 💻 Code

```js
// O(1) — no loop over the input; index math is constant.
const first = (arr) => arr[0];

// O(n) — one pass. Doing three things per item doesn't change the class.
const sum = (arr) => arr.reduce((a, b) => a + b, 0);

// O(n²) — the classic trap: nested loop over the SAME input.
const hasDupSlow = (arr) => {
  for (let i = 0; i < arr.length; i++)
    for (let j = i + 1; j < arr.length; j++)
      if (arr[i] === arr[j]) return true;   // ~n²/2 comparisons
  return false;
};

// O(n) time, O(n) space — trade memory to kill the inner loop.
const hasDupFast = (arr) => {
  const seen = new Set();
  for (const x of arr) {            // one pass
    if (seen.has(x)) return true;   // O(1) average lookup
    seen.add(x);
  }
  return false;
};
```

The hidden-cost trap that catches everyone:

```js
// Looks O(n). Is O(n²): .includes() scans the array EVERY iteration.
const dedupeBad = (arr) => arr.filter((x, i) => arr.indexOf(x) === i);

// O(n): Set membership is O(1) average.
const dedupeGood = (arr) => [...new Set(arr)];
```

## ⚖️ Trade-offs

- **Big-O ignores constants, and sometimes the constant is what actually matters.** For `n < 100`, an O(n²) loop can beat an O(n) solution that allocates a Map, because array iteration is cache-friendly and cheap. Big-O tells you the *asymptote*, not the runtime at your real input size.
- **Don't over-optimise past the bottleneck.** If your handler is O(n) but calls `getBoundingClientRect()` inside the loop (forcing layout each time), the DOM cost dwarfs the algorithm. The framework's reflow, not your Big-O, is the problem.
- **Space complexity is the one people forget to state.** An O(n) recursion still uses O(n) *stack* space — that's how you blow the call stack on a 100k-deep list.

## 💣 Gotchas interviewers probe

- **`Array.prototype.includes` / `indexOf` / `find` are O(n).** Calling one inside a loop is a silent O(n²). This is the single most common accidental blowup in "frontend DSA".
- **`n` vs `m`.** Two different collections are two variables. `O(n·m)` and `O(n²)` are only equal when `n === m`.
- **`O(log n)` means you halve the problem each step** — binary search, balanced-tree descent. If you're not discarding half the remaining work, it's not log.
- **String concatenation in a loop can be O(n²)** in naive engines because strings are immutable — build an array and `join` instead. (Modern V8 optimises ropes, but say the concern out loud.)
- **Amortised vs worst-case.** `array.push` is O(1) *amortised*, not always — occasionally it reallocates. Don't claim a hard O(1) when it's amortised.
- **Recursion has hidden space cost.** O(2ⁿ) *time* for naive Fibonacci, but also O(n) *stack* depth. Two separate budgets, both worth mentioning.

## 🎯 Say this in the interview

> "Big-O is about how the work scales as the input grows — I drop constants and lower-order terms and name the growth class. So my first instinct is to classify: is this a single pass, O(n)? A nested loop over the same data, O(n²)? A halving search, O(log n)? Then I ask whether I can trade space for time — the classic move is a Set or Map to turn an O(n²) nested scan into O(n) time with O(n) space. I'm careful about two things: hidden costs like `includes` or `indexOf` inside a loop, which quietly make it quadratic, and keeping separate variables for separate inputs — `O(n·m)`, not `O(n²)`. And I'll always state the space cost alongside the time cost, including recursion's stack depth, because that's a real constraint at scale."

## 🔗 Go deeper

- [Big-O cheat sheet](https://www.bigocheatsheet.com/) — the canonical growth-rate chart and data-structure operation table, worth memorising.
- [MDN — Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — for the true cost of `includes`, `indexOf`, `splice`, `sort`.
- [javascript.info — Recursion and the stack](https://javascript.info/recursion) — why recursion costs O(depth) space, not just time.
