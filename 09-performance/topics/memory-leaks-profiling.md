<div align="center">

# Memory leaks & profiling

<sub>🚀 Performance · 🔴 Hard · ⏱ 1h · `#memory`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A JS memory leak isn't "forgot to `free()`" — it's an object the GC *can't* collect because something still references it from a root. The four classic culprits are detached DOM nodes, dangling event listeners/timers, growing global caches, and closures that outlive their purpose. You find them with the DevTools **heap snapshot** and the **allocation timeline**, not by reading code.

---

## 🧠 Mental model

JavaScript is garbage-collected: memory is reclaimed automatically when an object becomes **unreachable** from a *GC root* (the global object, the current call stack, and a handful of internal roots). "Unreachable" is the whole game — the collector does a mark-and-sweep: start at the roots, follow every reference, and anything you can't reach is freed.

So a leak is always the same shape: **you're done with an object, but a reference chain still ties it back to a root, so the GC keeps it alive forever.** The object isn't "lost" — it's *retained*. The debugging question is never "where did I forget to delete this?" but **"what is still pointing at this that I forgot to null out?"**

That's why the two numbers that matter in a snapshot are **Shallow size** (the object's own bytes) and **Retained size** (everything that would be freed *if this object went away*). A tiny array with a huge retained size is your smoking gun — it's holding a whole subtree hostage.

## ⚙️ How it actually works

Chrome's GC is generational: most objects die young (the "young generation", scavenged frequently and cheaply), survivors get promoted to the "old generation" (collected less often with a mark-sweep-compact). A leak is an object that keeps getting promoted and never collected because a root retains it.

The canonical leaks:

- **Detached DOM nodes.** You `removeChild` a node, but a JS variable, a closure, or an event handler still references it. The node is gone from the page but alive in the heap — along with *all its descendants*. In a snapshot, filter for "Detached" to find these.
- **Listeners and timers.** `addEventListener` and `setInterval` create references from a long-lived source (the element, the global timer registry) to your callback, and the callback's closure retains everything it captured. If you never `removeEventListener` / `clearInterval`, that closure lives forever.
- **Unbounded caches / arrays.** `cache[key] = value` in a module-scope object with no eviction. Every entry is reachable from the module, which is reachable from a root. Classic "memory grows linearly with usage".
- **Closures.** A closure retains its *entire lexical scope*, not just the variables it reads. One long-lived closure capturing a big object keeps that object alive.

**Finding them — the "three snapshot" technique:** take a heap snapshot, perform the suspect action (open and close a modal), take another, and use **Comparison view** to see what was *allocated and not freed* between them. Repeat the action many times first — a leak shows as a count that grows by exactly N each cycle. The **Allocation instrumentation on timeline** view shows blue bars for allocations; bars that stay (never turn grey) are retained memory.

## 💻 Code

```js
// ❌ Leak: interval + listener capture `bigData` and are never cleaned up.
function mountWidget(el, bigData) {
  const timer = setInterval(() => paint(el, bigData), 1000);
  window.addEventListener('resize', () => layout(el, bigData));
  // el gets removed later, but timer + resize listener keep el AND bigData alive forever.
}
```

```js
// ✅ Track every subscription and tear it down. AbortController is the clean seam.
function mountWidget(el, bigData) {
  const ac = new AbortController();
  const timer = setInterval(() => paint(el, bigData), 1000);
  window.addEventListener('resize', () => layout(el, bigData), { signal: ac.signal });

  return function unmount() {
    clearInterval(timer);
    ac.abort();          // removes the resize listener in one call
    // now nothing roots el or bigData → both become collectable
  };
}
```

```js
// ✅ Let the GC help you: WeakMap / WeakRef don't keep keys alive.
const meta = new WeakMap();          // key (a DOM node) can be GC'd; entry vanishes with it
meta.set(node, { clicks: 0 });       // no manual cleanup needed
// vs. `const meta = new Map()` — a strong ref that leaks the node forever.
```

React's version of the same rule: **every `useEffect` that subscribes must return a cleanup function.** A missing return is the #1 React leak.

## ⚖️ Trade-offs

- **Not every growth is a leak.** Heaps grow and get collected in a sawtooth — one climbing snapshot proves nothing. Only *monotonic growth across repeated identical cycles* is a leak. Reading a single number and shouting "leak" is a junior tell.
- **`WeakMap`/`WeakRef` trade determinism for safety.** They let the GC collect keys, but you can't enumerate a `WeakMap` and you can't predict *when* a `WeakRef` clears. Use them for caches keyed by objects, not as a general Map replacement.
- **Manual cleanup vs. framework lifecycles.** Frameworks give you `useEffect` cleanup / `onUnmounted` — lean on them. Hand-rolled subscription tracking is error-prone; `AbortController` with a `signal` is the modern one-shot teardown.
- **When NOT to chase it:** a short-lived page (a checkout flow) that leaks a few KB per interaction and gets torn down on navigation may never matter. Leaks bite **long-lived SPAs, dashboards, and Electron apps** that run for hours.

## 💣 Gotchas interviewers probe

- **"How does JS free memory?"** Reachability-based GC, not reference counting (which can't handle cycles). If someone says "reference counting", ask them about a cycle — two objects pointing at each other with nothing else referencing them are still collected by mark-and-sweep.
- **Detached DOM nodes retain their whole subtree.** Removing a parent from the page doesn't free it if any child is still referenced from JS.
- **Closures capture the entire scope, not just used variables** — in most engines. One closure over a loop variable can pin a large object.
- **`setInterval` never stops itself.** Unlike `setTimeout`, it keeps firing (and keeps its closure alive) until `clearInterval`. A component that sets an interval and unmounts without clearing leaks *and* keeps doing work.
- **Global/module-scope caches are roots.** Anything reachable from a module-level variable lives for the page's lifetime.
- **Console references leak in dev.** `console.log(bigObject)` makes DevTools retain it so you can inspect it — memory "leaks" that vanish when you close DevTools are often this.
- **Shallow vs. retained size** — knowing the difference *is* the skill of reading a snapshot.

## 🎯 Say this in the interview

> "In a GC'd language a leak isn't a missing free — it's an object I'm done with that's still reachable from a root, so the collector won't touch it. Mark-and-sweep starts at the roots and keeps anything it can reach, so my debugging question is always 'what's still pointing at this?' The usual suspects are detached DOM nodes still referenced from JS, event listeners and `setInterval`s I never cleaned up — whose closures retain everything they captured — and unbounded module-level caches. To confirm one I don't read code, I take a heap snapshot, repeat the suspect action a bunch of times, snapshot again, and use the comparison view to find objects that were allocated and never freed; a count that grows by exactly N per cycle is the leak. The retained-size column tells me what's actually being held hostage. The fix is disciplined teardown — clear timers, remove listeners (I like an `AbortController` signal for one-shot cleanup), and reach for `WeakMap` when I want the GC to collect keys for me."

## 🔗 Go deeper

- [Chrome DevTools — Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) — the three-snapshot technique and detached-node hunting, from the source.
- [Chrome DevTools — Record heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) — shallow vs. retained size and how to read the comparison view.
- [MDN — Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Memory_management) — reachability, the GC model, and why reference counting fails on cycles.
- [MDN — WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap) — weak references and when they prevent leaks.
