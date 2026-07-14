<div align="center">

# `Map` / `Set` vs objects/arrays

<sub>⚡ JavaScript · 🟢 Easy · ⏱ 30m · `#basics`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Use `Map` when keys aren't strings or you need ordered, size-aware, frequently-mutated key/value storage; use `Set` for uniqueness and O(1) membership. Objects are *records* with a known shape; arrays are ordered lists. Reaching for `{}` as a general-purpose hash map is the default that quietly bites.

---

## 🧠 Mental model

Objects and arrays are **structures with meaning** — a user record, a list of line-items. `Map` and `Set` are **collections** — general-purpose containers built for dynamic membership and lookup. The senior signal is knowing that `{}` makes a *bad* dictionary: string-only keys, inherited prototype keys, no `.size`, and property ordering that silently reshuffles numeric keys.

| | Object | Map |
|---|---|---|
| Keys | strings / symbols only | **any value** — objects, functions, `NaN` |
| Size | `Object.keys(o).length` | `.size` (O(1)) |
| Iteration | via `Object.entries`; own+enumerable | directly iterable, **insertion order** |
| Prototype | inherits (`toString`, `__proto__`) | no default keys |
| Best at | fixed shape, JIT hidden classes, JSON | frequent add/delete, lookup |

## ⚙️ How it actually works

`Map`/`Set` compare keys with **SameValueZero** — so `NaN` equals `NaN` and `+0`/`-0` are the same, and object identity is respected (two different objects are two different keys). Object keys, by contrast, are **stringified**: `1` and `'1'` collide, and any object key becomes `'[object Object]'`, so *all* objects map to one slot. Object property order also puts integer-like keys first in ascending order, then string keys in insertion order — `Map` is pure insertion order, always. `WeakMap`/`WeakSet` take only object keys, aren't iterable, and don't prevent garbage collection — ideal for per-object metadata.

## 💻 Code

```js
// ❌ object as a map: keys stringify, collisions, inherited keys
const seen = {};
seen[1] = 'a';
seen['1'];          // 'a' — 1 and '1' are the SAME key
'toString' in seen; // true — inherited, a false positive

// ✅ Map: real keys, honest membership
const m = new Map();
const key = { id: 1 };
m.set(key, 'meta');
m.get(key);         // 'meta' (object identity as key)
m.has('toString');  // false
m.size;             // 1

// Set for dedupe + O(1) membership
const unique = [...new Set([1, 1, 2, 3])]; // [1, 2, 3]

// WeakMap: GC-friendly cache keyed by an object — no leak
const cache = new WeakMap();
cache.set(domNode, data); // entry disappears when domNode is collected
```

## ⚖️ Trade-offs

- **Object wins** for fixed-shape records (V8 optimises stable shapes into hidden classes), for JSON serialization, and for literal ergonomics.
- **Map wins** for dynamic dictionaries, non-string keys, frequent add/delete, guaranteed order, and O(1) `.size`.
- **Set replaces `array.includes` (O(n)) with O(1) membership** — a real win in hot loops and dedup.
- **WeakMap/WeakSet** for metadata keyed by objects without leaking — but you trade away iteration and size by design.
- **Don't Map everything.** For small fixed data that has to serialize, a plain object is lighter and freer.

## 💣 Gotchas interviewers probe

- **Object keys are strings/symbols.** `obj[1] === obj['1']`, and every object key collapses to `'[object Object]'` — so objects can't be distinct keys in a plain object.
- **Prototype pollution.** `'toString' in obj` is `true`; assigning `obj['__proto__']` is dangerous. `Object.create(null)` or `Map` avoids it.
- **Integer-like keys reorder.** `{ 2:'a', 1:'b' }` iterates `1` then `2` — insertion order is lost. `Map` preserves it.
- **`Map`/`Set` are not JSON-serializable.** `JSON.stringify(new Map())` yields `{}`; convert with `[...map]`.
- **`WeakMap` can't be iterated or sized** — deliberate, and its keys must be objects.
- **`Object.keys(map)` returns `[]`** — a `Map`'s entries aren't own properties; iterate the Map directly or spread it.
- **`NaN` handling differs.** A `Map` can key on `NaN`; `array.indexOf(NaN)` is `-1` while `array.includes(NaN)` is `true`.

## 🎯 Say this in the interview

> "I split them by intent: objects and arrays are structures with meaning — a record, a list — while `Map` and `Set` are general collections. My default rule is: the moment keys aren't fixed strings, or I need frequent add/delete, ordered iteration, or a real size, I use a `Map`. A plain object is a poor dictionary because keys are stringified — `1` and `'1'` collide, every object key becomes `'[object Object]'` — and it inherits prototype keys, so `'toString' in obj` is a false positive. `Map` uses SameValueZero and preserves insertion order, which objects don't for integer-like keys. `Set` gives me O(1) membership instead of `includes`'s O(n). And `WeakMap` is my go-to for caching data against an object without leaking memory, since entries are collected with their keys."

## 🔗 Go deeper

- [javascript.info — Map and Set](https://javascript.info/map-set) — key equality, iteration order, and when to choose which.
- [MDN — `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — full API and the object-vs-Map comparison table.
- [MDN — `Set`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set) — uniqueness and membership semantics.
- [MDN — `WeakMap`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — GC-friendly keying and its deliberate limitations.
