<div align="center">

# Hidden classes & inline caches

<sub>🌐 Browser · 🔴 Hard · ⏱ 1h · `#v8` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — To make dynamic objects fast, V8 secretly gives every object a **hidden class** (a shape descriptor mapping property names to fixed memory offsets), and caches property lookups at each call site as **inline caches** — so `obj.x` becomes "check the shape, read offset 8" instead of a hash-map probe. Break the shape and you break the speed.

---

## 🧠 Mental model

A JS object *looks* like a dictionary — arbitrary string keys, added and removed at will. If V8 implemented it literally as a hash map, every `obj.x` would be a hash lookup: slow. Instead V8 bets that objects come in a small number of repeated **shapes**, and creates a hidden class per shape — think of it as reconstructing a C `struct` from your dynamic object.

Two objects with the *same properties added in the same order* share one hidden class, which says "`x` lives at offset 0, `y` at offset 8." Now a property read is just: "does this object have hidden class H? Yes → read the fixed offset." No hashing. **Inline caches** then memoize that decision at the specific call site so it doesn't even re-check the map next time.

The whole mechanism collapses the instant your objects stop sharing shapes. This is *the* reason "same properties, different order" is a real performance bug.

## ⚙️ How it actually works

**Hidden class transitions.** Hidden classes are built incrementally as you add properties. Starting from `{}`:

```
{}                → C0
this.x = 1        → C0 --add x--> C1   (x @ offset 0)
this.y = 2        → C1 --add y--> C2   (x @ 0, y @ 8)
```

The transitions form a tree. Any object that goes `x` then `y` lands on **C2** and shares it. But add them in the *other* order and you walk a *different* branch to a *different* class — incompatible with C2 even though the objects have identical properties. **Insertion order is part of the identity of the shape.**

**Inline caches (ICs) and their states.** Each property-access site in the compiled code carries a cache of "which shape did I see, and what's the offset":

| IC state | Meaning | Speed |
|---|---|---|
| **Monomorphic** | Site always sees one shape | 🟢 Fastest — direct offset |
| **Polymorphic** | Site sees a few (2–4) shapes | 🟡 Checks a small list |
| **Megamorphic** | Site sees many shapes | 🔴 Falls back to generic hash lookup |

The optimizing JIT (TurboFan) *depends* on monomorphic ICs to inline and specialize. A megamorphic site can't be specialized, so it blocks the fast path entirely. This is the concrete link between hidden classes and the JIT.

**What quietly breaks shape sharing:**
- Adding properties in different orders across instances.
- Adding properties *after* construction (creates new transitions, often per-instance).
- `delete obj.prop` — punts the object out of the fast hidden-class world into slow **dictionary/"deopt" mode** entirely.
- Sparse/holey arrays and mixed element kinds (the array analogue of shapes).

## 💻 Code

```js
// ✅ Every Point gets the SAME hidden class: props set in constructor, same order.
class Point {
  constructor(x, y) { this.x = x; this.y = y; } // x@0, y@8 for ALL instances
}
const a = new Point(1, 2), b = new Point(3, 4); // share hidden class → mono IC

// ❌ Same properties, DIFFERENT order → two hidden classes → polymorphic site.
const p1 = {}; p1.x = 1; p1.y = 2; // C: x→y
const p2 = {}; p2.y = 2; p2.x = 1; // C: y→x  (incompatible with p1!)

// ❌ Adding props conditionally after the fact → shape divergence per instance.
function make(hasZ) {
  const o = { x: 1, y: 2 };
  if (hasZ) o.z = 3;   // two shapes leak out of one factory
  return o;
}

// ❌ delete drops the object into slow dictionary mode:
const o = { x: 1, y: 2 };
delete o.x;            // now o is deoptimized; prefer o.x = undefined / null

// ✅ Initialize ALL fields up front, even the optional ones, to lock one shape:
function make(hasZ) {
  return { x: 1, y: 2, z: hasZ ? 3 : null }; // one shape always
}
```

## ⚖️ Trade-offs

- **This is micro-optimization — profile first.** Shape discipline matters in genuinely hot paths (physics loops, parsers, data grids over huge arrays), not in a click handler that runs twice. Contorting readable code for hidden classes everywhere is a bad trade.
- **Consistency beats cleverness.** The rule "construct objects with all fields, same order, never `delete`" is cheap and readable, so it's worth adopting as a default even without profiling — you get the fast path for free.
- **`Map` exists for a reason.** If you're using an object as a genuine dictionary (dynamic, unknown keys, frequent add/delete), stop fighting the hidden-class system — use `Map`, which is *designed* for that access pattern.

## 💣 Gotchas interviewers probe

- **Property insertion order changes the shape.** `{x, y}` ≠ `{y, x}` to V8. The single most surprising fact here — and a real cause of polymorphism in factory functions.
- **`delete` is a performance cliff**, not just a semantic operation — it can drop an object into dictionary mode permanently. Set to `null`/`undefined` instead in hot code.
- **Monomorphic → megamorphic is the degradation to fear.** A shared helper called with many object shapes has a megamorphic IC that can't be optimized — the reason "generic" utility code is sometimes slower than duplicated specialized code.
- **Arrays have the same concept via "elements kinds."** Packed-SMI → packed-double → holey → generic; each transition is one-way-ish and slower. Don't pre-size with holes or mix types.
- **Hidden classes are a V8 implementation detail** (SpiderMonkey calls them "shapes," JSC "structures"). The *concept* is universal; the exact behaviour isn't guaranteed by spec.

## 🎯 Say this in the interview

> "V8 makes dynamic objects fast by giving each one a hidden class — a shape descriptor that maps property names to fixed memory offsets, basically reconstructing a struct. Objects with the same properties added in the same order share a hidden class, so a property read becomes 'check the shape, read a known offset' instead of a hash lookup. Then inline caches memoize that at each call site: monomorphic if the site always sees one shape, which is what the optimizing JIT needs to inline and specialize; megamorphic if it sees many, which kills the fast path. The practical rules fall out of that: initialize all fields in the constructor in a consistent order, don't add properties later, and never `delete` in hot code — set to null instead, because delete drops the object into slow dictionary mode. It's a micro-optimization, so I apply it in genuinely hot loops, and reach for a Map when I actually need a dictionary."

## 🔗 Go deeper

- [V8 — Hidden classes / fast properties](https://v8.dev/docs/hidden-classes) — the canonical explanation from the V8 team.
- [V8 — Elements kinds in V8](https://v8.dev/blog/elements-kinds) — the array analogue of hidden classes and its transitions.
- [Mathias Bynens — What's up with monomorphism?](https://mathiasbynens.be/notes/shapes-ics) — shapes and inline caches, deeply and clearly.
