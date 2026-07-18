<div align="center">

# Memory management

<sub>🌐 Browser · 🔴 Hard · ⏱ 1h · `#memory`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — JavaScript memory is automatic, not free: the engine allocates on assignment, decides liveness by **reachability from roots**, and reclaims automatically — so "leaks" are never the GC failing, they're *you* holding a reference the GC is contractually obliged to respect.

---

## 🧠 Mental model

Think of the heap as a graph, not a pool. There's a set of **roots** — the global object, the currently executing stack frames and their local variables, and a few engine-held anchors. Every object is "alive" if and only if there's a **chain of references from a root to it**. The garbage collector's entire job is to answer one question: *what is still reachable?* Everything else is garbage, whether or not you're "done" with it.

This reframes the whole topic. You never free memory in JS. You make things **unreachable**, and freeing is a side effect the engine performs on its own schedule. A memory leak, then, is not a bug in the collector — it's a reference you forgot you were still holding. The GC is doing exactly what you told it to.

```
ROOTS ──▶ window ──▶ appState ──▶ cache ──▶ {bigObject}   ← reachable, kept
                                    │
stack frame ─▶ localVar ───────────┘
                                             {orphan}     ← unreachable, collected
```

## ⚙️ How it actually works

**Allocation is implicit.** `const o = {}` reserves heap space; a string literal, a closure, a DOM node — all allocate. You never call `malloc`. The engine tracks the size, and V8 in particular allocates most short-lived objects into a small **young generation** (nursery) because the empirical truth of JS programs is that *most objects die young*.

**Reachability, not reference counting.** Naive reference counting — "free when the count hits zero" — cannot handle **cycles**: `a.b = b; b.a = a` keeps both counts at 1 forever even after both are unreachable. That's why real engines use a **tracing** collector: start from roots, mark everything you can reach, sweep the rest. Cycles are collected correctly because an unreachable cycle is simply never marked.

**The three sources of `roots`** you must be able to name:
- The **global** object (`window` / `globalThis`) and everything hanging off it.
- The **call stack** — every local variable and closure currently on the stack.
- Engine-internal handles (e.g. objects pinned by native code, active timers' callbacks, pending promises).

**Closures capture the whole scope.** A closure doesn't retain just the variables it uses — the engine may keep the entire lexical environment alive. One long-lived closure that closes over a giant array pins that array for its whole lifetime, even if the closure only reads one small field.

## 💻 Code

```js
// ❌ The reference you forgot: an event listener pins the whole closure.
function attach(node, hugeData) {
  node.addEventListener('click', () => console.log(hugeData.length));
  // `hugeData` is now reachable as long as `node` (and its listener) live.
}

// ✅ Detach explicitly, or let ownership end.
function attach(node, hugeData) {
  const onClick = () => console.log(hugeData.length);
  node.addEventListener('click', onClick);
  return () => node.removeEventListener('click', onClick); // cleanup handle
}
```

```js
// WeakMap: associate data with an object WITHOUT keeping the object alive.
const meta = new WeakMap();
meta.set(domNode, { renderedAt: Date.now() });
// When domNode becomes unreachable elsewhere, this entry is collected too —
// a plain Map would keep domNode alive forever (a classic detached-node leak).
```

## ⚖️ Trade-offs

- **Automatic GC trades control for safety.** You can't leak via forgotten `free()` or double-free, but you also can't *force* deterministic cleanup — no destructors, no guaranteed timing. For scarce non-memory resources (file handles, sockets, WebGL contexts) you must release manually; GC won't save you.
- **`WeakMap`/`WeakRef` are the escape valves**, not everyday tools. Reach for them for caches and metadata keyed by object identity. Don't reach for `WeakRef` to "optimise" — its whole point is *not guaranteeing* the referent survives, which is rarely what app code wants.
- **When NOT to think about this at all:** most code. Premature memory micro-management (nulling every variable) is noise. Care intensely at the boundaries: long-lived caches, listeners, timers, and anything keyed by DOM nodes.

## 💣 Gotchas interviewers probe

- **"How does JS decide what to free?" — say *reachability*, not "when nothing points to it".** Reference counting is the wrong answer because it can't collect cycles. Tracing GC can.
- **Setting `x = null` doesn't free anything** if another reference still reaches the object. It only removes *one* edge in the graph. This is the single most common misconception.
- **Closures retain more than you think.** The classic V8 gotcha: two closures sharing one lexical environment means a "small" closure can keep a "big" sibling's captures alive.
- **A `Map`/`Set` is a GC root for its keys and values.** Anything you put in a global cache lives until you `delete` it — `WeakMap` is the fix when the key is an object whose lifetime you don't own.
- **`globalThis` is forever.** Accidentally-global variables (a missing `let`, or `this` at module top-level in sloppy mode) never get collected.
- **The stack vs heap distinction still matters conceptually** — but in JS, primitives and object *pointers* live logically on the stack while objects live on the heap; you don't control placement, and modern engines even stack-allocate objects that provably don't escape (scalar replacement).

## 🎯 Say this in the interview

> "JavaScript memory is fully automatic, but the model I keep in my head is a reachability graph. There's a set of roots — the global object, the call stack and its closures, plus engine handles — and an object survives if and only if there's a reference chain from a root to it. So the collector's job is just to trace what's reachable and reclaim the rest. That's why 'leak' in JS almost always means *I'm still holding a reference I forgot about* — a live event listener, a growing global cache, a `Map` keyed by DOM nodes — not a bug in the GC. Setting a variable to `null` only removes one edge; it frees nothing if something else still reaches the object. When I need to associate data with an object without extending its lifetime, I use a `WeakMap` so the entry dies with the key."

## 🔗 Go deeper

- [MDN — Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) — the reachability model, allocation lifecycle, and why reference counting fails on cycles.
- [MDN — WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — the primary tool for object-keyed data that shouldn't pin its keys.
- [V8 — Trash talk](https://v8.dev/blog/trash-talk) — how a production tracing GC actually organises the heap and roots.
- [MDN — WeakRef & FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) — the advanced, non-deterministic escape hatch and its warnings.
