<div align="center">

# Arrays & string manipulation

<sub>🧠 DSA for Frontend · 🟢 Easy · ⏱ 1h · `#arrays` `#strings`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Most array/string interview problems are a **two-pointer** or **sliding-window** problem in disguise: instead of a nested loop that rescans (O(n²)), you keep one or two indices moving through the data in a single pass (O(n)). Recognising which pattern applies is 80% of the solve.

---

## 🧠 Mental model

Arrays and strings are the same shape — an ordered, index-addressable sequence — so the same three patterns cover almost everything an interviewer throws at you:

| Signal in the prompt | Reach for | Cost |
|---|---|---|
| "sorted array", "pair that sums to", "reverse in place" | **Two pointers** (ends → middle, or slow/fast) | O(n) |
| "longest/shortest substring", "at most k", "contiguous" | **Sliding window** (grow right, shrink left) | O(n) |
| "count of", "have we seen", "group by" | **Hash map / Set** (see the hashmap topic) | O(n) |

The anti-pattern all three replace is the same: a nested loop that keeps re-scanning the array. If your instinct is `for i { for j }`, stop and ask *which pointer can I move instead of restarting.*

**Strings are immutable in JS.** You cannot edit a character in place — every "mutation" builds a new string. So the frontend-real move is: convert to an array, mutate, `join('')` back.

## ⚙️ How it actually works

**Two pointers** exploit *structure* — usually sortedness or symmetry. Reversing: swap `left`/`right`, walk inward. Two-sum on a *sorted* array: if the pair sums too low, move `left` up; too high, move `right` down — each pointer only ever moves one direction, so it's O(n), not O(n²). The invariant "left only increases, right only decreases" is what guarantees linear time.

**Sliding window** maintains a contiguous range `[left, right]` and a running summary (a count, a sum, a Set). You **grow `right`** every step; when the window violates its constraint, you **shrink `left`** until it's valid again. Because each index is visited at most twice (once by `right`, once by `left`), the whole thing is O(n) despite looking nested. The key insight: you never *recompute* the window from scratch, you *update* it incrementally.

**In-place vs copy** is the space axis. Reversing with two pointers is O(1) space; building a reversed copy is O(n) space. Interviewers say "in place" specifically to force O(1) space and rule out the easy `[...arr].reverse()`.

**Method costs you must know cold:** `push`/`pop` amortised O(1); `shift`/`unshift`/`splice` are O(n) (they re-index); `slice`/`concat`/`map`/`filter` allocate a new array O(n); `sort` is O(n log n) and **coerces to strings by default** (`[10,2,1].sort()` → `[1,10,2]`).

## 💻 Code

Two pointers — reverse in place, O(1) space:

```js
function reverse(arr) {
  let l = 0, r = arr.length - 1;
  while (l < r) {
    [arr[l], arr[r]] = [arr[r], arr[l]]; // swap ends
    l++; r--;                            // walk inward
  }
  return arr;
}
```

Sliding window — longest substring without repeating characters, O(n):

```js
function longestUnique(s) {
  const seen = new Set();
  let left = 0, best = 0;
  for (let right = 0; right < s.length; right++) {
    // shrink from the left until the window is valid again
    while (seen.has(s[right])) seen.delete(s[left++]);
    seen.add(s[right]);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
// each char enters the window once and leaves once → O(n), not O(n²)
```

The string-immutability gotcha, done right:

```js
// ❌ Does nothing — strings are immutable, this assignment is silently ignored.
function badUpper(s) { s[0] = s[0].toUpperCase(); return s; }

// ✅ Convert → mutate → join.
function capitalize(s) {
  const chars = [...s];        // spread handles surrogate pairs / emoji correctly
  chars[0] = chars[0].toUpperCase();
  return chars.join('');
}
```

## ⚖️ Trade-offs

- **Two pointers needs structure** (sorted or symmetric). On unsorted data you either sort first (O(n log n) + O(n) two-pointer) or use a hashmap (O(n) time, O(n) space) — the hashmap usually wins unless you also need O(1) space.
- **Sliding window only works for *contiguous* subarrays/substrings.** "Subsequence" (non-contiguous) breaks it — that's usually a DP problem instead.
- **In-place saves memory but destroys the input.** In real frontend code, mutating a prop or a piece of state in place is a bug that breaks change detection — the interview's "in place" and React's "never mutate" are in direct tension. Know which world you're in.

## 💣 Gotchas interviewers probe

- **`[...str]` vs `str.split('')`.** `split('')` splits by UTF-16 code unit and *breaks emoji and other astral characters*; spread and `Array.from` iterate by code point. Reversing a string with emoji using `split('')` corrupts it.
- **`sort()` is lexicographic by default.** `[10, 9, 1].sort()` → `[1, 10, 9]`. Always pass `(a, b) => a - b` for numbers.
- **`sort()` mutates in place** and returns the same reference — a classic "why did my original array change" bug.
- **`shift`/`splice` are O(n).** Building a result by `unshift`ing in a loop is O(n²). Push and reverse instead.
- **Off-by-one in windows.** Window length is `right - left + 1`, not `right - left`. The `+ 1` bug is the most common sliding-window mistake.
- **`indexOf`/`includes` inside a loop = O(n²).** Swap for a Set.
- **`.length` on strings counts UTF-16 units**, so `'👋'.length === 2`. Grapheme counting needs `Intl.Segmenter`.

## 🎯 Say this in the interview

> "My first move on an array or string problem is to avoid the nested-loop rescan. If the data's sorted or symmetric, two pointers walking inward or a slow/fast pair gets me O(n) with O(1) space. If it's about a contiguous substring or subarray with a constraint — longest, at most k, no repeats — that's a sliding window: I grow the right edge, and shrink the left when the window breaks its rule, so each index is touched at most twice and it's O(n). And if it's about counts or membership, a Map or Set. Two things I'm careful about in JS specifically: strings are immutable, so I spread to an array, mutate, and join — and I spread rather than `split('')` so emoji and astral characters survive. And `sort` is string-based and mutating by default, so I always pass a numeric comparator."

## 🔗 Go deeper

- [NeetCode — practice (Arrays & Two Pointers)](https://neetcode.io/practice) — the canonical problem set for both patterns, ordered by difficulty.
- [MDN — Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — the true cost and mutating-vs-copying behaviour of every method.
- [MDN — String](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) — immutability, and why `.length` counts UTF-16 code units.
