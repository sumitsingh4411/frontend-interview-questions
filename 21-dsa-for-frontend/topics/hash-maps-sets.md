<div align="center">

# Hash maps & sets

<sub>🧠 DSA for Frontend · 🟢 Easy · ⏱ 1h · `#hashmap`</sub>

<a href="../README.md">⬅ DSA for Frontend</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A hash map trades **O(n) space for O(1)-average lookup**, and that single trade is the most common way to turn an O(n²) interview solution into O(n). When you see "have I seen this before?", "count of", or "find the pair" — reach for `Map` or `Set`.

---

## 🧠 Mental model

A hash map is an **index by content instead of position**. An array lets you ask "what's at slot 5?"; a hash map lets you ask "have I got a value for key `'user:42'`?" in constant time. It does that by running the key through a hash function to compute a bucket, so it never scans.

The recognition signal is almost mechanical: **any time your brute force is "for each element, look through the rest of the array"**, a hash map removes the inner loop. You pre-record what you've seen (or its count/index) in one pass, then answer each question in O(1).

```
Two Sum, brute force:  for i { for j } → O(n²)
Two Sum, hashed:       for i { does map have (target - a[i])? } → O(n)
                       ^ the map remembers everything to the left
```

**`Set` = keys only** ("is this present?"). **`Map` = keys → values** ("what's stored for this?"). Same engine, different question.

## ⚙️ How it actually works

Lookup is **O(1) average, O(n) worst case**. The worst case is when every key hashes to the same bucket (a degenerate chain) — real engines resize and use good hash functions to keep this rare, but the honest answer in an interview is "O(1) amortised/average, O(n) worst".

**Why `Map`/`Set` over a plain object `{}`** — this is the senior distinction:

| | `Map` / `Set` | plain object `{}` |
|---|---|---|
| Key types | **any** value (objects, functions, NaN) | strings & symbols only |
| Key coercion | none — `1` ≠ `'1'` | everything coerced to string |
| Ordering | **insertion order**, guaranteed | mostly insertion, integer keys sorted first |
| Size | `.size` in O(1) | `Object.keys(o).length` in O(n) |
| Prototype traps | none | `obj['toString']`, `__proto__` pollution |
| Iteration | directly iterable | needs `Object.keys/entries` |

Use `Map`/`Set` for algorithmic work; reach for `{}` only for fixed-shape records you'll JSON-serialise.

**Equality is `SameValueZero`.** `Map`/`Set` treat `NaN` as equal to `NaN` (unlike `===`), and `+0`/`-0` as the same. But **object keys are compared by reference** — `map.set({a:1}, 'x')` then `map.get({a:1})` returns `undefined` because they're different objects. To key on structural equality you must serialise (`JSON.stringify`) or build a composite string key.

**`WeakMap`/`WeakSet`** hold keys weakly — entries vanish when the key is garbage-collected. That's the correct tool for attaching metadata to DOM nodes or component instances *without leaking memory* when they're removed.

## 💻 Code

The canonical O(n²) → O(n) rewrite:

```js
// Two Sum — hashed. One pass, O(n) time, O(n) space.
function twoSum(nums, target) {
  const seen = new Map();           // value → index, of everything to the left
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];  // O(1) lookup
    seen.set(nums[i], i);
  }
  return null;
}
```

Frequency counting — the other 40% of hashmap problems:

```js
function firstNonRepeating(str) {
  const count = new Map();
  for (const c of str) count.set(c, (count.get(c) ?? 0) + 1); // tally, O(n)
  for (const c of str) if (count.get(c) === 1) return c;      // first with count 1
  return null;
}
```

The reference-equality trap and its fix:

```js
const m = new Map();
m.set({ id: 1 }, 'a');
m.get({ id: 1 });                 // ❌ undefined — different object reference

// ✅ Key on a stable primitive when you need value equality.
const key = ({ id, type }) => `${type}:${id}`;
const byKey = new Map();
byKey.set(key({ id: 1, type: 'user' }), 'a');
byKey.get(key({ id: 1, type: 'user' })); // 'a'
```

## ⚖️ Trade-offs

- **You pay O(n) memory** for the speed. For a one-shot pass over small data, a sort or nested loop may be simpler and use O(1) space — the hashmap is the reflex, not always the optimum.
- **Hash maps destroy ordering guarantees you might need.** If the problem cares about *sorted* order, a Map won't give it to you — you'd sort the keys (O(n log n)) or reach for a different structure.
- **Don't use `{}` as a map.** Prototype keys (`__proto__`, `constructor`), string-only keys, and O(n) size checks are real bugs. `Map` exists precisely to fix this — use it.
- **`WeakMap` for lifecycle-tied metadata**; a plain `Map` keyed on a DOM node *leaks* because it pins the node in memory forever.

## 💣 Gotchas interviewers probe

- **`{}` vs `Map`.** Not knowing the differences (any-type keys, no coercion, `.size`, no prototype traps, insertion order) is a junior tell. This is the most common hashmap follow-up.
- **Object keys are by reference.** `new Set([{a:1}, {a:1}]).size === 2`. To dedupe by value you must stringify.
- **`SameValueZero`:** `Map`/`Set` consider `NaN === NaN` (they store it fine), unlike `===`. Occasionally the exact thing being tested.
- **`obj['hasOwnProperty']` collisions.** Using `key in obj` or `obj[key]` on user-controlled keys is a security/correctness footgun; `Object.create(null)` or a `Map` avoids the prototype.
- **Iteration order is insertion order** for both `Map` and `Set` — reliable, unlike the folklore that objects are unordered.
- **Memory leaks with strong Maps** keyed on DOM/objects. `WeakMap` is the fix; know when to use it.

## 🎯 Say this in the interview

> "The moment my brute force is 'for each element, scan the rest', I reach for a Map or Set — it trades O(n) space for O(1)-average lookup and collapses the O(n²) to O(n). Two Sum is the archetype: I walk once, and for each element ask the map whether I've already seen its complement. I use `Map`/`Set` rather than a plain object deliberately — they take any key type without string coercion, they don't have prototype-key traps, they give me `.size` in O(1), and they preserve insertion order. The gotcha I watch for is that object keys compare by reference, so if I need value equality I serialise to a string key. And lookup is O(1) *average* — worst case O(n) if everything collides — which I'll state honestly. For metadata tied to DOM nodes I use a WeakMap so it doesn't leak."

## 🔗 Go deeper

- [MDN — Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — the API plus the explicit "Map vs Object" comparison table.
- [MDN — Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) — membership, `SameValueZero` equality, iteration order.
- [MDN — WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — weak references and the memory-leak use case.
