<div align="center">

# Memory leaks in JS

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 1h · `#memory`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A JS memory leak isn't "memory that got lost" — it's **memory that's still reachable but will never be used again**. The GC can only collect what nothing points to, so every leak is really *an unintended reference you forgot to drop*: a listener, a timer, a closure, or a global.

---

## 🧠 Mental model

JavaScript is garbage-collected, so people assume leaks are impossible. They're not — the GC is *precise*, not *smart*. It uses **reachability**: starting from roots (the global object, the current call stack), it marks everything reachable and sweeps the rest. It collects exactly what's unreachable and **nothing that's still pointed at**, even if you're morally done with it.

So the mental reframe: **you never "leak" memory in JS — you fail to become unreachable.** Every leak traces back to a live reference chain from a root to an object you thought was dead. Debugging a leak is detective work on *"what is still pointing at this?"* — and the DevTools Memory tab's **retainer path** answers exactly that.

## ⚙️ How it actually works

The handful of reference chains that cause ~95% of real-world leaks:

- **Detached DOM nodes.** You remove a node from the document, but a JS variable, array, or closure still references it. The node — *and its entire subtree* — stays in memory. This is the #1 SPA leak. DevTools flags these as "Detached HTMLElement".
- **Listeners that outlive their target.** `addEventListener` on `window`/`document` from inside a component, never removed. The handler closure retains the component, which retains its DOM and state. The component unmounts; the listener keeps it all alive.
- **Timers & intervals.** A `setInterval` whose callback closes over component state keeps that state alive **forever** — intervals don't stop themselves. Same for a `setTimeout` you never clear or an animation loop.
- **Closures capturing more than you think.** A closure retains its *entire enclosing scope*, not just the variables it uses. One long-lived callback can pin a huge object that happened to be in scope.
- **Unbounded caches / `Map`s keyed by object.** A plain `Map` holds keys strongly — cache every object you ever see and it grows without bound. (This is what `WeakMap` fixes.)
- **Accidental globals.** In non-strict mode, a mistyped assignment (`count = 0` without `let`) attaches to `window` and never dies. `'use strict'` turns this into an error.
- **Growing arrays/logs.** An in-memory event log or undo stack you never trim.

## 💻 Code

```js
// ❌ Classic SPA leak: listener + interval outlive the component.
class Widget {
  constructor() {
    this.data = new Array(1e6).fill('*');           // big
    window.addEventListener('resize', this.onResize.bind(this)); // NEW fn ref every time
    this.timer = setInterval(() => this.poll(), 1000); // closes over `this` forever
  }
  onResize() { /* ... */ }
  poll() { /* ... */ }
  // No teardown → after "removal", window + timer still retain `this` + `this.data`.
}
```

```js
// ✅ Symmetric teardown. Every subscription has a matching unsubscription.
class Widget {
  constructor() {
    this.data = new Array(1e6).fill('*');
    this.onResize = this.onResize.bind(this);        // stable ref we can remove
    window.addEventListener('resize', this.onResize);
    this.timer = setInterval(() => this.poll(), 1000);
  }
  onResize() { /* ... */ }
  poll() { /* ... */ }
  destroy() {                                        // call on unmount
    window.removeEventListener('resize', this.onResize); // needs the SAME ref
    clearInterval(this.timer);
    this.data = null;
  }
}

// Even cleaner: AbortController removes every listener in one shot.
const ac = new AbortController();
window.addEventListener('resize', onResize, { signal: ac.signal });
window.addEventListener('scroll', onScroll, { signal: ac.signal });
ac.abort(); // ✅ removes BOTH — no need to track individual refs
```

## ⚖️ Trade-offs

- **Not every growth is a leak.** Memory rising then falling after GC is normal. A *leak* is a monotonic climb across repeated identical actions (mount/unmount a route 10×, take a heap snapshot each time — retained size that only ever grows is the tell). Measure before you "optimise".
- **`WeakMap`/`WeakRef` are tools, not cures.** They help when *object lifetime* should drive collection. They do nothing for a leaking interval or a growing array — using them as a blanket fix is cargo-culting.
- **Frameworks reduce but don't eliminate leaks.** React's `useEffect` cleanup, Vue's `onUnmounted`, and Svelte's `onDestroy` exist *precisely* so you have a symmetric teardown hook. Forgetting the cleanup return is the modern version of forgetting `removeEventListener`.

## 💣 Gotchas interviewers probe

- **"GC means no leaks."** Wrong, and a red flag. GC collects the *unreachable*; leaks are unintended *reachability*.
- **`removeEventListener` needs the same function reference.** `addEventListener('x', this.fn.bind(this))` then `removeEventListener('x', this.fn.bind(this))` removes **nothing** — each `.bind()` makes a new function. The bind footgun.
- **Detached DOM is the #1 SPA leak.** Know the term, know it retains the whole subtree, know DevTools surfaces it as "Detached HTMLElement".
- **Closures capture the whole scope**, not just referenced vars — so a callback can pin a large object it never touches.
- **`setInterval` never stops itself.** An uncleared interval is an eternal retainer of everything its callback closes over.
- **Three-snapshot technique:** snapshot → repeat the action → snapshot → compare "Objects allocated between snapshots" that survive. That's how you *find* a leak, not just theorise about one.
- **`console.log` holds references.** Logged objects are retained by DevTools so you can inspect them — a leak that vanishes when DevTools is closed is often this.

## 🎯 Say this in the interview

> "In a GC language a leak isn't lost memory — it's memory that's still *reachable* but will never be used again, because the collector only frees what nothing points to. So every leak is an unintended reference chain from a root. The usual suspects are event listeners and intervals that outlive their component, detached DOM nodes still held by a variable or closure, closures capturing more scope than they need, and unbounded caches keyed by objects. My defence is symmetric teardown: every `addEventListener` has a `removeEventListener` with the *same* function reference, every `setInterval` a `clearInterval` — and increasingly I just pass an `AbortController` signal so one `abort()` tears everything down. To actually diagnose one I'd use the DevTools Memory tab: take heap snapshots before and after repeating an action, look for objects with growing retained size, and follow the retainer path to whatever's still pointing at them."

## 🔗 Go deeper

- [Chrome DevTools — Fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) — the three-snapshot technique and retainer paths, from the source.
- [MDN — Memory management](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) — reachability and how the mark-and-sweep GC decides.
- [web.dev — Debug memory leaks](https://developer.chrome.com/docs/devtools/memory-problems/heap-snapshots) — reading heap snapshots and detached nodes.
- [MDN — AbortController](https://developer.mozilla.org/en-US/docs/Web/API/AbortController) — the modern one-shot listener teardown.
