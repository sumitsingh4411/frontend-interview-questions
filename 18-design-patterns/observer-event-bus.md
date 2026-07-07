# Pattern Deep-Dive: Observer / Event Bus (Pub-Sub)

> **Difficulty:** 🟡 Medium · **Est. time:** `45m` · **Tags:** `#behavioral` `#patterns` `#async`

**Asked at:** _Amazon, Uber, Microsoft (and as a "build an EventEmitter" machine-coding task)_ · **Related:** [debounce/throttle](../03-javascript/promise-polyfills-and-throttle-debounce.md) · [State management](../13-state-management/)

---

## 1. The Pattern

**Observer / Pub-Sub:** subjects publish events; observers subscribe and react. Decouples producers from consumers — they never reference each other, only the bus. It's the backbone of DOM events, state stores (Redux subscribe), RxJS, and cross-component messaging.

## 2. Build an Event Emitter (the classic ask)

```js
class EventEmitter {
  #events = new Map(); // event -> Set<listener>

  on(event, listener) {
    if (!this.#events.has(event)) this.#events.set(event, new Set());
    this.#events.get(event).add(listener);
    return () => this.off(event, listener); // unsubscribe handle
  }

  once(event, listener) {
    const wrap = (...args) => { this.off(event, wrap); listener(...args); };
    return this.on(event, wrap);
  }

  off(event, listener) {
    this.#events.get(event)?.delete(listener);
  }

  emit(event, ...args) {
    // copy so handlers that unsubscribe during emit don't mutate mid-iteration
    [...(this.#events.get(event) ?? [])].forEach(l => {
      try { l(...args); } catch (e) { console.error(e); } // isolate listener errors
    });
  }
}
```

**Design decisions to mention:**
- **`Set` for listeners** → automatic dedupe, O(1) add/remove.
- **Return an unsubscribe fn** from `on` — ergonomic cleanup (React effect returns it).
- **Copy before emit** → a listener that calls `off()` mid-emit won't corrupt iteration.
- **Error isolation** → one throwing listener shouldn't stop the rest.
- **`once`** → wrap-and-remove.

## 3. Trade-offs & Pitfalls

**Memory leaks** → the #1 danger. Every `on` needs a matching `off`, or listeners (and everything they close over) leak. In React, unsubscribe in the effect cleanup. Consider `WeakRef`/`WeakMap` keyed by owner for auto-cleanup in advanced cases.

**Debuggability** → decoupling is powerful but makes flow hard to trace ("who emitted this?"). Namespaced events and dev logging help. Don't overuse a global bus where explicit props/callbacks are clearer.

**Ordering & sync vs async** → listeners fire synchronously in subscription order here. For a truly decoupled bus you might defer with `queueMicrotask` so `emit` returns fast and errors don't block the emitter.

**Backpressure / wildcards** → advanced buses support wildcard events (`user.*`) and buffering. Mention RxJS for stream operators (map/filter/debounce over events).

## 4. Where It Shows Up

- **DOM:** `addEventListener`/`removeEventListener` is pub-sub.
- **State:** Redux `store.subscribe`, signals, MobX reactions.
- **Cross-component/micro-frontend messaging** without prop drilling.
- **Mediator pattern:** a central bus coordinating many components (see [design patterns index](README.md)).

## 5. What Interviewers Probe

- Implement `on`/`off`/`emit`/`once` correctly.
- Why return an unsubscribe function?
- The mid-emit unsubscription bug (copy before iterating).
- Error isolation between listeners.
- Memory-leak prevention.
- Observer vs Mediator vs plain callbacks — when to use which.

## 6. Curated Resources

- [patterns.dev: Observer pattern ⭐](https://www.patterns.dev/vanilla/observer-pattern)
- [Refactoring Guru: Observer](https://refactoring.guru/design-patterns/observer)
- [RxJS: overview](https://rxjs.dev/guide/overview) — observer pattern as streams
- [MDN: EventTarget](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget) — the platform's own emitter

## 7. Related Topics

- [Design Patterns index](README.md) — Mediator, Strategy, Command
- [State management](../13-state-management/)
- [Build your own: Event Emitter](../19-build-your-own/)
