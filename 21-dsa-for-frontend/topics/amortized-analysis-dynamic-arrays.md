<div align="center">

# Amortized analysis (dynamic arrays)

<sub>🧠 DSA for Frontend · 🟡 Medium · ⏱ 30m · `#complexity`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Amortised analysis is the *average cost per operation across a long run*, not the worst single op. `array.push` is **O(1) amortised** even though one push in every batch secretly reallocates and copies the whole array — because doubling capacity spreads that O(n) copy thin over the n cheap pushes before it.

---

## 🧠 Mental model

A JS array isn't a magic growable list — under the hood it's a fixed-size block of memory. When it fills up, the engine allocates a **bigger** block (V8 grows capacity by roughly 1.5–2×), copies every existing element over, and frees the old one. That copy is O(n).

So how is `push` "O(1)"? Because that expensive copy happens *rarely* and gets **amortised**. If you double capacity each time, then to reach `n` elements you copy `1 + 2 + 4 + … + n ≈ 2n` elements total across all resizes — spread over `n` pushes, that's **~2 copies per push on average**, i.e. O(1) amortised.

```
push into capacity-4 array that's full:
 [a,b,c,d]  →  allocate [_,_,_,_,_,_,_,_]  →  copy a,b,c,d  →  place e
              (this ONE push is O(n)… but the next 3 are free)
```

The mental unlock: **the geometric-growth strategy is the whole trick.** Grow by a *constant amount* instead of a *factor* and the amortisation breaks — you'd get O(n) per push.

## ⚙️ How it actually works

Three ways to prove an amortised bound; the first is all you need in an interview:

- **Aggregate method:** total cost of `n` operations ÷ `n`. For doubling: total copy work is a geometric series summing to `< 2n`, so `2n / n = O(1)` amortised.
- **Banker's / accounting method:** overcharge cheap ops (pay "3" for each push — 1 to insert, 2 saved in the bank), and when a resize hits, the bank has exactly enough saved credit to pay for the O(n) copy.
- **Potential method:** the formal version, tracking a potential function; rarely needed verbally.

**Why doubling and not +1 each time?** Growing by a fixed constant `c` means resizing every `c` inserts, each copy costing O(n) → total O(n²/c) → **O(n) per push amortised**. Geometric growth makes resizes exponentially rarer as the array grows, which is what collapses the average to O(1). This is the same reason hash tables resize by doubling.

**Amortised ≠ average-case.** Average-case is about *random inputs*. Amortised is a *worst-case guarantee over a sequence* — no adversary can make a run of `n` pushes cost more than O(n) total, even though they can make one specific push cost O(n).

**The cost you can't amortise away:** memory. Doubling means an array of `n` used slots can occupy up to `2n` allocated slots — up to 2× memory overhead. And a resize is a latency *spike*: one push in a hot loop can stall while it copies millions of elements.

## 💻 Code

```js
// A dynamic array from scratch — makes the amortisation visible.
class DynamicArray {
  #data = new Array(1);   // fixed-capacity backing store
  #size = 0;              // how many slots are actually used

  push(value) {
    if (this.#size === this.#data.length) this.#grow();  // rare O(n) branch
    this.#data[this.#size++] = value;                     // usual O(1) branch
  }

  #grow() {
    const bigger = new Array(this.#data.length * 2);   // DOUBLE (geometric)
    for (let i = 0; i < this.#size; i++) bigger[i] = this.#data[i]; // O(n) copy
    this.#data = bigger;
  }

  get(i) { return this.#data[i]; }   // true O(1) — index math
  get length() { return this.#size; }
}

// n pushes → total copy work < 2n → O(1) amortised per push.
```

The operations whose *real* cost interviewers want you to know:

```js
arr.push(x);      // O(1) amortised   (may reallocate)
arr.pop();        // O(1)             (V8 may shrink, still amortised O(1))
arr.shift();      // O(n)  — re-indexes EVERY element. Not O(1)!
arr.unshift(x);   // O(n)  — same, everything moves right one slot
arr.splice(i,1);  // O(n)  — shifts the tail down
arr[i];           // O(1)  — direct index
```

## ⚖️ Trade-offs

- **`push`/`pop` are amortised O(1); `shift`/`unshift` are genuinely O(n).** If you're building a queue on an array and calling `shift()` in a loop, you've written O(n²). Use a real queue (two stacks, or a ring buffer, or just index a head pointer) instead.
- **Amortised O(1) is not latency-safe.** For animation loops or audio where a single frame's stall is visible, a resize spike matters. Pre-size with `new Array(n)` or `arr.length = n` when you know the count, to pay the allocation once up front.
- **Memory vs speed.** Geometric growth wastes up to 2× memory to buy O(1) inserts. For huge, rarely-appended arrays that's a bad trade; for hot append loops it's the right one.

## 💣 Gotchas interviewers probe

- **"Is `push` O(1)?"** The senior answer is "**amortised** O(1)" — dropping "amortised" signals you don't know the resize cost. Explain the doubling.
- **`shift()` / `unshift()` are O(n).** The most common accidental O(n²): a `while (queue.length) queue.shift()` loop. Interviewers plant this.
- **Why doubling, not +constant?** If you can't explain that +constant growth gives O(n) per push, you've memorised the fact without the mechanism.
- **Amortised vs average-case** are different claims — amortised is a guarantee over a *sequence*, not over *random input*.
- **Sparse arrays / `delete arr[i]`** leave holes and can deopt V8 out of the fast packed-array representation — a real frontend perf gotcha, not just theory.
- **Pre-sizing.** `arr.length = 10000` or `new Array(n)` avoids repeated resizes when the size is known — a legit optimisation for building large lists.

## 🎯 Say this in the interview

> "`array.push` is O(1) *amortised*, and the word amortised is the whole point. The backing store is fixed-size, so when it fills, the engine allocates a bigger block — roughly double — and copies everything over, which is O(n). But because it doubles, resizes get exponentially rarer: reaching n elements copies about 2n items total across all resizes, so spread over n pushes that's a constant per push. If it grew by a fixed amount instead of doubling, you'd resize constantly and it'd be O(n) per push. The catch is that amortised isn't latency-safe — one push occasionally stalls to copy the whole array — so in a hot loop where I know the size, I pre-allocate. And I never build a queue with `shift()`, because that re-indexes every element and turns the loop into O(n²)."

## 🔗 Go deeper

- [MDN — Array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) — the operation reference; note which methods mutate and re-index.
- [V8 blog — Elements kinds in V8](https://v8.dev/blog/elements-kinds) — how V8 actually backs arrays and why holes deopt them.
- [Wikipedia — Dynamic array](https://en.wikipedia.org/wiki/Dynamic_array) — the geometric-growth proof and amortised analysis in detail.
