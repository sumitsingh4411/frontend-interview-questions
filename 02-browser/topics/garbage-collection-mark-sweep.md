<div align="center">

# Garbage collection (mark & sweep)

<sub>🌐 Browser · 🔴 Hard · ⏱ 45m · `#memory` `#v8`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Mark-and-sweep traces the object graph from the roots, **marks** everything reachable, then **sweeps** (reclaims) everything it didn't mark; V8 layers a **generational** split and **incremental/concurrent** work on top so the main thread doesn't freeze while it does this.

---

## 🧠 Mental model

Mark-and-sweep answers the reachability question from the memory-management model with a concrete algorithm:

1. **Mark.** Start at the roots (globals, stack, closures, handles). Do a graph traversal, painting every object you can reach as "live".
2. **Sweep.** Walk the heap linearly. Anything *not* marked is garbage — reclaim its memory. Reset the marks for next time.

The genius is that it's **liveness by construction**: you never ask "is this dead?", you only prove what's *alive*, and dead-ness is the residue. This is why it handles cycles that reference counting can't — an unreachable cycle simply never gets marked.

The problem is that a naive version is **stop-the-world**: it has to pause your JavaScript so the graph doesn't mutate mid-trace. On a big heap that's a visible jank spike. Every real-world refinement — generations, tri-colour marking, incremental steps — exists to shrink or hide that pause.

## ⚙️ How it actually works

**The generational hypothesis.** Most objects die young. V8 exploits this by splitting the heap:

| | Young generation (nursery) | Old generation |
|---|---|---|
| Holds | freshly allocated objects | survivors of ≥1–2 GCs |
| Collector | **Scavenger** (Cheney's copying) | **Mark-Compact** |
| Frequency | very often, very fast | rarely, more work |

**Minor GC (Scavenge)** uses two semi-spaces: allocate into "to-space", and when it fills, copy the *live* objects into the other space and flip. Copying only the survivors is cheap precisely because survivors are few. Objects that survive twice get **promoted** to the old generation.

**Major GC (Mark-Compact)** runs mark-and-sweep over the old generation, then **compacts** — slides live objects together to defragment, so future allocation is a fast pointer bump instead of a free-list search.

**Tri-colour marking** is how V8 marks *incrementally* without corrupting state. Objects are white (unvisited), grey (visited, children pending), or black (fully processed). The invariant: **no black object may point to a white object**. A **write barrier** intercepts pointer writes during marking — if you make a black object point to a white one, the barrier re-greys something so nothing is wrongly swept. This lets marking pause and resume, interleaved with JS.

**Concurrent & parallel.** Orinoco (V8's GC) does most marking on **background threads** concurrently with JS, and parallelises sweeping. The main-thread pause is reduced to short "handshakes", which is why modern V8 GC pauses are typically well under a millisecond rather than tens.

## 💻 Code

You can't call the GC, but you can *observe pressure* and reason about promotion.

```js
// Allocation-heavy loop: churns the young generation.
// These arrays die immediately → cheap scavenges, never promoted.
for (let i = 0; i < 1e6; i++) {
  const tmp = [i, i * 2];        // born and dies in the nursery
  process(tmp);
}

// ❌ Accidentally promoting garbage: pushing into a long-lived array
// keeps each entry reachable, so it survives to the OLD generation,
// where collection is far more expensive.
const kept = [];
for (let i = 0; i < 1e6; i++) kept.push({ i }); // now a major-GC problem
```

```js
// Measure heap growth (Chrome, with --enable-precise-memory-info or DevTools).
performance.memory.usedJSHeapSize; // bytes; watch it across a workflow
// In Node: process.memoryUsage().heapUsed, and --expose-gc gives global.gc()
// ONLY for benchmarking — never ship code that calls gc().
```

## ⚖️ Trade-offs

- **Throughput vs latency.** Stop-the-world collectors have higher throughput (less coordination overhead) but ugly pauses. Concurrent/incremental collectors trade a little total CPU and add write-barrier cost on *every* pointer write to buy smooth frame times. For UIs, latency wins — which is exactly what V8 optimises for.
- **Copying wastes space to buy speed.** The Scavenger needs two semi-spaces, so half the young-gen memory is idle at any moment. That's a deliberate trade: copying survivors is O(live), and live is small.
- **When you can't out-clever the GC:** don't try to "help" it by nulling locals or triggering `gc()`. The wins are algorithmic — reduce *allocation rate* and avoid promoting short-lived data into long-lived containers. Object pooling can help in extreme hot paths but usually just fights the Scavenger, which is already fast.

## 💣 Gotchas interviewers probe

- **"Why not reference counting?" — cycles.** Two objects referencing each other keep non-zero counts forever. Tracing collectors don't care; unreachable is unreachable.
- **Minor vs major GC.** Confusing them is a tell. Minor = fast copying scavenge of the nursery; major = mark-compact of the old gen. Frequent minor GCs are healthy; frequent *major* GCs signal you're promoting too much.
- **The write barrier isn't free.** Incremental/concurrent marking taxes every reference store. This is the hidden cost of "no pauses" — total CPU goes up slightly so the main thread stays responsive.
- **Compaction moves objects, so raw addresses aren't stable** — which is why JS gives you no pointers, and why native addons use handles, not raw pointers.
- **A GC pause is measured in *pause time*, not frequency.** A collector running often but for 0.2ms is invisible; one running rarely for 40ms drops frames.
- **`WeakRef` referents can vanish between ticks** — the spec deliberately gives no timing guarantee, precisely because the GC decides.

## 🎯 Say this in the interview

> "Mark-and-sweep traces from the roots, marks everything reachable, and sweeps whatever it didn't mark — so it defines *live* and treats dead as the leftover, which is why it collects cycles that reference counting can't. The naive version is stop-the-world, so V8 layers three things on top. First, generations: most objects die young, so it has a small nursery collected by a fast copying scavenger, and only twice-survivors get promoted to the old generation, which is collected by mark-compact. Second, tri-colour incremental marking with a write barrier, so marking can pause and resume without freezing JS. Third, concurrent marking on background threads. The practical upshot for me as an app author is that GC cost tracks *allocation rate* and *promotion*, so the lever I actually have is allocating less and not stuffing short-lived objects into long-lived arrays or caches."

## 🔗 Go deeper

- [V8 — Trash talk](https://v8.dev/blog/trash-talk) — Orinoco, generational GC, and the move to concurrent/parallel marking.
- [V8 — Concurrent marking](https://v8.dev/blog/concurrent-marking) — tri-colour marking and the write barrier, explained by the team that built it.
- [MDN — Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) — the reachability foundation mark-sweep implements.
- [A tour of V8: Garbage Collection (Jay Conrod)](https://jayconrod.com/posts/55/a-tour-of-v8-garbage-collection) — a clear walkthrough of semi-spaces and mark-compact.
