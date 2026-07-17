<div align="center">

# `structuredClone` & deep clone

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#patterns`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `structuredClone()` exposes the browser's **structured clone algorithm** (the one `postMessage` has always used) as a synchronous call: it copies cycles, `Map`, `Set`, `Date`, typed arrays and shared references correctly — but it **drops prototypes, functions and symbols**, so it deep-clones *data*, not *objects*.

---

## 🧠 Mental model

Structured cloning was never designed as a JS convenience. It's the **serialisation format for crossing a realm boundary** — worker `postMessage`, `IndexedDB`, `history.pushState`, `BroadcastChannel`. All of those needed a way to turn a live object graph into something that could survive a hop into another JS heap. `structuredClone()` (2022) simply lets you invoke that machinery without actually going anywhere.

That origin explains every single one of its limitations. Ask yourself: *"could this thing exist meaningfully in a different JS realm with no shared code?"*

- A `Map` of dates? Yes — pure data. Cloned perfectly.
- A closure? No — its scope lives in *this* heap. `DataCloneError`.
- A `class User` instance? The data can travel; the *class* can't. So the data arrives, and the prototype doesn't. You get a plain object with the right fields and no methods.

Once you hold that frame, you stop being surprised.

## ⚙️ How it actually works

The algorithm walks the graph depth-first with a **memory map** of already-visited references. That map buys you two things people credit to magic:

**Cycles work.** `a.self = a` clones fine. JSON throws `Converting circular structure to JSON`.

**Shared references stay shared.** If `obj.x` and `obj.y` are the *same* array, then `clone.x === clone.y`. This is the detail almost nobody mentions and it is the real difference between a clone and a copy — the *shape of the graph* is preserved, not just the values.

What crosses, and what doesn't:

| Cloned faithfully | Silently changed | Throws `DataCloneError` |
|---|---|---|
| primitives, `BigInt` | class instances → plain object | functions |
| `Object`, `Array`, cycles | getters → flattened to data props | most DOM nodes |
| `Map`, `Set`, `Date`, `RegExp` | non-enumerable props → dropped | `Symbol` values |
| `ArrayBuffer`, typed arrays, `DataView` | symbol-keyed props → dropped | `WeakMap` / `WeakSet` |
| `Blob`, `File`, `ImageData`, `Error` | property descriptors → all `writable`/`enumerable` | `Proxy` (throws if target does) |

Note the middle column carefully: **those failures are silent.** A getter is *invoked* during the clone and its return value is baked in as a static property. Your lazily-computed field becomes a stale snapshot, and nothing warns you.

**Transfer, not copy.** `structuredClone(obj, { transfer: [obj.buffer] })` moves an `ArrayBuffer` by pointer instead of memcpy-ing it: O(1) instead of O(n), and the source buffer is left **detached** (`byteLength === 0`). That's the same option `postMessage` takes, and it's how you move a 50MB image out of a worker without a copy.

## 💻 Code

The JSON round-trip everybody still writes, and everything it quietly destroys:

```js
const state = {
  when: new Date('2020-01-01'),
  tags: new Set(['a']),
  index: new Map([[1, 'one']]),
  missing: undefined,
  nope: NaN,
  big: 10n,
  fn() {},
};

JSON.parse(JSON.stringify(state));
// ❌ when   → "2020-01-01T00:00:00.000Z"  (string! silently)
// ❌ tags   → {}                          (Set has no JSON form)
// ❌ index  → {}                          (same)
// ❌ missing→ key vanishes entirely
// ❌ nope   → null                        (NaN and ±Infinity both become null)
// ❌ big    → TypeError: Do not know how to serialize a BigInt
// ❌ fn     → key vanishes
// …and `toJSON()` on any nested object hijacks its own serialisation behind your back.

structuredClone(state);
// ✅ Date, Set, Map, undefined, NaN, BigInt all survive intact.
// ❌ but `fn` throws DataCloneError — remove functions first.
```

The prototype trap, which is the one that bites in production:

```js
class User {
  constructor(name) { this.name = name; }
  greet() { return `hi ${this.name}`; }
}

const clone = structuredClone(new User('ada'));
clone.name;              // 'ada'          ← data survived
clone instanceof User;   // false          ← ❌
clone.greet();           // TypeError: clone.greet is not a function
Object.getPrototypeOf(clone) === Object.prototype; // true

// ✅ If you own the class, clone the data and rehydrate deliberately:
const revived = Object.assign(Object.create(User.prototype), structuredClone({ ...user }));
// ✅ Or better: give the class an explicit boundary.
class User { toJSON() { … }  static from(data) { return new User(data.name); } }
```

## ⚖️ Trade-offs

- **It is not automatically faster than `JSON.parse(JSON.stringify(x))`.** This surprises people. For a large, plain, JSON-shaped object the JSON round-trip is a tight, heavily-optimised native path and frequently *wins*; `structuredClone` pays for graph bookkeeping and type dispatch on every node. Choose it for **correctness**, not speed, and benchmark before claiming otherwise.
- **It's synchronous and it blocks.** Cloning a 100k-node tree janks the main thread exactly like any other long task. Being a browser API doesn't make it free or off-thread.
- **Reach for `lodash.cloneDeep` when you need prototypes.** It preserves class instances, copies functions by reference instead of throwing, and never `DataCloneError`s — at the cost of a dependency and a hand-written approximation of the same algorithm. That's a real trade, not an obviously wrong one.
- **Don't deep-clone as a default.** Most "I need a deep clone" moments are really "I mutated shared state and got caught". Structural sharing (spread the one level you're changing) or an immutable helper is cheaper *and* expresses intent. A deep clone of app state on every action is a performance smell.

## 💣 Gotchas interviewers probe

- **"Does `structuredClone` preserve the class?"** No. Prototypes are dropped — instances arrive as plain objects with no methods and `instanceof` returns `false`. This is the single most common miss.
- **Getters are executed and flattened.** A computed property becomes a frozen value. So do non-enumerable and symbol-keyed props — except those are just *dropped*, with no error.
- **Shared references stay shared, cycles survive.** Both JSON and a naive hand-rolled recursive clone get this wrong (JSON throws; the naive version infinite-loops until it blows the stack).
- **`Symbol` as a *value* throws; symbol as a *key* is silently ignored.** Two different behaviours for the same type — an easy trip-up.
- **`transfer` detaches the source.** After transferring an `ArrayBuffer`, the original is `byteLength === 0` and every read from it throws. People transfer, then try to reuse the buffer.
- **`Object.freeze` isn't cloned.** The clone is mutable regardless of the original's frozen/sealed state — the algorithm copies data, not integrity levels.
- **`DataCloneError` is a `DOMException`, not a `TypeError`.** If you're catching narrowly, you'll miss it.
- **Availability**: browsers from ~2022, Node from 17. If you support older runtimes it needs a fallback, and there's no faithful polyfill (you cannot recreate `Blob` transfer semantics in userland).

## 🎯 Say this in the interview

> "`structuredClone` is the structured clone algorithm — the same thing `postMessage` and IndexedDB use — exposed as a direct call. That framing predicts its behaviour: anything that could meaningfully exist in another JS realm survives, so `Map`, `Set`, `Date`, typed arrays, cycles and even shared references all clone correctly. Anything tied to *this* realm doesn't: functions throw `DataCloneError`, and — the one people miss — prototypes are dropped, so a class instance comes back as a plain object with no methods and `instanceof` false. It's strictly more correct than `JSON.parse(JSON.stringify())`, which silently turns Dates into strings, `NaN` into `null`, and drops `undefined`. But I wouldn't claim it's faster — for plain JSON-shaped data the JSON round-trip is often quicker, and `structuredClone` is synchronous, so cloning a big graph blocks the main thread. Mostly, if I reach for a deep clone at all, I ask first whether I should be sharing structure instead of copying it."

## 🔗 Go deeper

- [MDN — `structuredClone()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) — the API, plus the `transfer` option.
- [MDN — The structured clone algorithm](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm) — the authoritative list of what clones and what throws.
- [web.dev — Deep-copying in JavaScript using `structuredClone`](https://web.dev/articles/structured-clone) — good on why the JSON hack persisted for so long.
- [HTML spec — StructuredSerialize](https://html.spec.whatwg.org/multipage/structured-data.html#structuredserializeinternal) — where the getter-flattening and memory-map behaviour is actually defined.
