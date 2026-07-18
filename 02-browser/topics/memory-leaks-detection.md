<div align="center">

# Memory leaks & detection

<sub>🌐 Browser · 🔴 Hard · ⏱ 1h · `#memory` `#performance`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A JS leak is memory that stays **reachable but is never used again**; you find it by watching the heap fail to return to baseline across a repeated action, then use a **heap snapshot's retainer path** to see *which reference is keeping it alive*.

---

## 🧠 Mental model

Because GC frees anything unreachable, a leak is definitionally a **retained reference you no longer need**. The diagnostic mindset is therefore always the same two-step:

1. **Prove growth.** Do a round-trip action (open a view, close it) N times. If memory doesn't return to baseline, you're accumulating.
2. **Find the retainer.** Take a snapshot, find the objects that shouldn't exist, and read the **retaining path** — the chain of references from a GC root down to the leaked object. The fix is always "cut one edge in that chain."

The mental trap is thinking of leaks as "objects the GC missed". They aren't. They're objects *you* asked it to keep. The four evergreen culprits: **detached DOM nodes, forgotten timers/listeners, unbounded caches, and closures** capturing more than they need.

## ⚙️ How it actually works

**The detached DOM subtree** is the archetypal SPA leak. You remove a node from the document, but a JS variable (or a closure, or an array) still references it. The GC can't collect it *or its entire subtree* — including nodes that are no longer in the DOM. DevTools flags these as **"Detached HTMLElement"** in a snapshot.

```
document ──▶ (node removed from tree)
component.savedRef ──▶ <div#panel> ──▶ 500 child nodes   ← all retained, all detached
```

**Detection tools, and what each is for:**

- **Performance Monitor** (DevTools → More tools) — live "JS heap size" and "DOM Nodes" counters. First line of triage: do the numbers climb and never drop after GC?
- **Memory → Heap snapshot** — a full graph dump. The killer feature is **Comparison** view: snapshot, act, snapshot again, and diff the **`# Delta`** to see exactly what was allocated-and-kept between them. Then click an object and read **Retainers** (bottom pane) — the path back to a root.
- **Memory → Allocation instrumentation on timeline** — records allocations over time; blue bars that never turn grey are objects that were allocated and survived. Great for "which line allocates the leak".
- **`performance.measureUserAgentSpecificMemory()`** — the modern, accurate, cross-origin-isolated API for *monitoring* total memory in production (successor to the crude `performance.memory`).

**Retained size vs shallow size** — the number that matters. *Shallow* size is the object itself; **retained** size is everything that would be freed if this object were deleted. A leak with huge *retained* size but small shallow size is the tell: one small forgotten object anchoring a giant subtree.

## 💻 Code

```js
// ❌ LEAK 1 — timer keeps the closure (and its captures) alive forever.
function startPolling(bigState) {
  setInterval(() => sync(bigState), 1000); // never cleared → bigState immortal
}

// ✅ Return a disposer; clear on teardown.
function startPolling(bigState) {
  const id = setInterval(() => sync(bigState), 1000);
  return () => clearInterval(id);
}
```

```js
// ❌ LEAK 2 — unbounded cache: grows without limit, every entry is a root.
const cache = new Map();
function memo(key, val) { cache.set(key, val); } // never evicts

// ✅ Bound it (LRU) or key by object with a WeakMap so entries die with the key.
const cache = new WeakMap(); // key must be an object; GC reclaims dead keys
```

```js
// ❌ LEAK 3 — detached node: component unmounts but ref survives.
class Panel {
  mount(el) { this.el = el; document.body.append(el); }
  unmount() { this.el.remove(); }        // removed from DOM…
  // …but `this.el` (and the whole subtree) is still retained. Add: this.el = null
}
```

## ⚖️ Trade-offs

- **Snapshots are heavy and perturb timing.** Taking one triggers a full GC and can freeze the tab for seconds on a large heap. Use Performance Monitor for cheap continuous triage; reach for snapshots only once you've confirmed growth.
- **`WeakMap`/`WeakRef` prevent leaks but aren't a cure-all.** They only help when the natural lifetime is "as long as some object exists." For time- or size-bounded caches you still need explicit eviction (LRU/TTL) — weakness gives you no control over *when* things go.
- **Don't over-null.** Manually setting fields to `null` everywhere is a code smell; scope things correctly and tear down in lifecycle hooks. The right fix is ownership, not defensive nulling.
- **When a "leak" isn't one:** heap that grows *then plateaus* is often just caches warming up or the engine sizing its heap. A real leak grows **unbounded** across identical cycles.

## 💣 Gotchas interviewers probe

- **Detached DOM nodes** — name this first. Removing from the DOM ≠ freeing; a lingering JS ref pins the whole subtree.
- **`addEventListener` without `removeEventListener`** (and anonymous handlers you *can't* remove). Use `{ signal }` with an `AbortController` to kill many listeners at once, or `{ once: true }`.
- **`setInterval`/`setTimeout` closures** are GC roots until cleared. Long-lived intervals holding component state are a top SPA leak.
- **Global caches and singletons.** Anything on `window`, a module-level `Map`, or a Redux store slice never shrinks unless you evict.
- **"GC should have caught it."** No — if it's reachable, the GC is *correct* to keep it. The bug is the reference.
- **Framework-specific:** stale closures in React `useEffect` without cleanup, subscriptions/observables not unsubscribed, and portals whose refs outlive the portal.
- **Retained vs shallow size** — confusing them means you'll chase the wrong object. Sort by retained size to find the anchor.

## 🎯 Say this in the interview

> "I treat a leak as a reachable reference I no longer need, so my process is two steps. First I prove growth: repeat one round-trip action — mount and unmount a view several times — and watch the JS heap and DOM-node counters in the Performance Monitor. If they climb and never fall after GC, something's retained. Then I take heap snapshots before and after, use the comparison view to diff what was allocated and kept, and read the *retainer path* to find the exact reference chain from a root to the leaked object. Ninety percent of the time it's one of four things: a detached DOM subtree held by a stale ref, a timer or event listener never torn down, an unbounded cache, or a closure capturing more than it needs. The fix is always cutting one edge in that retainer chain — clearing the interval, aborting the listener, evicting the cache, or nulling the ref on teardown."

## 🔗 Go deeper

- [Chrome DevTools — Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) — the canonical workflow: monitor, snapshot, compare, read retainers.
- [Chrome DevTools — Heap snapshots](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) — shallow vs retained size and how to read the retaining tree.
- [web.dev — monitor total page memory usage](https://web.dev/articles/monitor-total-page-memory-usage) — `measureUserAgentSpecificMemory()` for production monitoring.
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — cancel listeners and fetches en masse to prevent listener leaks.
