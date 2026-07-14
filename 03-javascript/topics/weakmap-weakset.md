<div align="center">

# WeakMap & WeakSet

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#memory`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `WeakMap`/`WeakSet` hold their keys **weakly**: if the only reference to a key object is the one inside the WeakMap, the garbage collector is free to remove it. That makes them the correct tool for attaching data to objects you don't own the lifecycle of — no manual cleanup, no leaks.

---

## 🧠 Mental model

A normal `Map` **owns** its keys: as long as the Map is alive, every key it holds is reachable and therefore *cannot be garbage-collected*, even if the rest of your program dropped that object ages ago. A Map is a leak waiting to happen if you key it by DOM nodes or component instances.

A `WeakMap` holds keys **weakly**: the entry does not count as a reference for GC purposes. The moment nothing *else* points to the key object, the whole entry (key + value) becomes eligible for collection automatically.

```
Map:      Map ──strong──► keyObj    (keyObj lives as long as the Map does → leak risk)
WeakMap:  WeakMap ─weak─► keyObj    (keyObj dies when everything else drops it → auto cleanup)
```

The one-line intuition: **a WeakMap lets you tag an object with metadata that disappears exactly when the object does.** You never write cleanup code because the GC *is* your cleanup code.

## ⚙️ How it actually works

The weakness comes with hard constraints that are direct consequences of "the entry can vanish at any time":

- **Keys must be objects** (and, since ES2023, symbols registered non-globally). Primitives can't be keys — a `42` has no identity to be collected, and would define "when is this unreferenced" incoherently.
- **Not iterable, no `size`, no `clear` (WeakMap)/`clear` exists but no enumeration.** You cannot list the contents. If you *could* enumerate a WeakMap, GC timing would become *observable* — you'd see entries appear and vanish non-deterministically, breaking the language's determinism guarantees. So the API is deliberately limited to `get`/`set`/`has`/`delete`.
- **Non-deterministic.** You never know *when* an entry is collected — only that it will be once the key is unreachable. You can't and shouldn't depend on the timing.

This is why WeakMaps are the canonical home for **private data** (`#fields` do this natively now, but WeakMaps were the pre-class-fields idiom), **caches keyed by object**, and **metadata on DOM nodes/framework instances** — when the node is removed and dereferenced, its cached data evaporates with it.

## 💻 Code

```js
// Attach data to DOM nodes with zero cleanup — when the node is GC'd, its entry goes too.
const nodeData = new WeakMap();
function tag(el, meta) { nodeData.set(el, meta); }
// No removeEventListener-style teardown needed for the map: drop the node → entry dies.

// ✅ Object-keyed cache that can't leak.
const cache = new WeakMap();
function compute(obj) {
  if (cache.has(obj)) return cache.get(obj);
  const result = expensive(obj);
  cache.set(obj, result);              // freed automatically when `obj` is unreachable
  return result;
}

// ❌ The same cache with a Map is a leak: every obj ever passed lives forever.
const leakyCache = new Map();          // holds every key strongly → grows without bound

// WeakSet: track membership without pinning objects alive (e.g. "already processed").
const seen = new WeakSet();
function processOnce(obj) {
  if (seen.has(obj)) return;
  seen.add(obj);
  process(obj);
}

// Private fields, pre-class-fields idiom:
const _balance = new WeakMap();
class Account { constructor(n) { _balance.set(this, n); } get balance() { return _balance.get(this); } }
```

## ⚖️ Trade-offs

- **Use when you don't control the key's lifecycle:** metadata on DOM nodes, per-instance private state, object-keyed memo caches, "have I seen this object" sets. The GC handles teardown for free.
- **When NOT to use it:** when you need to **enumerate, count, or serialise** the collection — a WeakMap can do none of those. If you need `size`, iteration, or primitive keys, you need a `Map`/`Set` and manual eviction.
- **Not a general memory fix.** A WeakMap only helps if the *key* is what should drive lifetime. If your leak is a growing array or a closure holding a big object, a WeakMap does nothing.
- **The value can still leak indirectly.** If a WeakMap's *value* holds a strong reference back to the key (or to a long-lived root), you can accidentally keep things alive. Weak keys don't make values weak.

## 💣 Gotchas interviewers probe

- **Keys must be objects (or symbols).** `weakMap.set('str', 1)` throws. The most common immediate mistake.
- **Not iterable, no `size`.** You can't loop or count a WeakMap — *by design*, because enumeration would leak GC timing. If a candidate reaches for `.forEach` on one, that's a tell.
- **"Weak" applies to the key reference, not the value.** The value is held normally; only the key is weak. A value that references the key defeats collection.
- **Non-deterministic collection.** You cannot force or observe *when* an entry is freed. Don't build logic that assumes prompt cleanup — use `FinalizationRegistry` only if you truly need a post-collection callback (and even then, cautiously).
- **`WeakMap` vs `WeakRef`.** A WeakMap weakly holds *keys* and is a collection; a `WeakRef` weakly holds a *single* object and lets you attempt to read it. Different tools; interviewers test the distinction.
- **Not for object-identity dedupe across serialisation** — structured clone and JSON don't preserve identity, so WeakMap-based tagging doesn't survive them.

## 🎯 Say this in the interview

> "A `WeakMap` holds its keys weakly — the entry doesn't count as a reference for the garbage collector, so when nothing else points to the key object, the whole entry is collected automatically. That makes it the right tool for attaching data to objects whose lifecycle I don't own: metadata on DOM nodes, per-instance private state, or an object-keyed cache. The equivalent `Map` would hold every key strongly and leak, because the Map keeps them reachable forever. The constraints follow from the weakness: keys must be objects, and it's deliberately not iterable and has no `size` — if you could enumerate it, GC timing would become observable and non-deterministic, which the language won't allow. Two things I'm careful about: only the *key* is weak, so a value that references its key can still keep things alive; and collection timing is non-deterministic, so I never build logic that assumes prompt cleanup."

## 🔗 Go deeper

- [javascript.info — WeakMap and WeakSet](https://javascript.info/weakmap-weakset) — the caching and DOM-metadata use cases, clearly motivated.
- [MDN — WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — the exact API surface and why it's limited.
- [MDN — WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet) — membership tracking without pinning objects alive.
