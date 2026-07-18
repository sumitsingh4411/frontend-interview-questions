<div align="center">

# WeakRef & FinalizationRegistry

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 45m · `#memory` `#advanced`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `WeakRef` lets you *hold* a reference to an object without keeping it alive; `FinalizationRegistry` lets you *register a callback* for after an object is collected. Both expose GC timing, which the language spent 20 years hiding — so the correct answer is usually **"don't"**, and the senior signal is knowing why.

---

## 🧠 Mental model

A normal variable is a **strong** reference: as long as it's reachable, the object cannot be garbage-collected. A `WeakRef` is a reference the GC is *allowed to ignore* — the object it points to can be collected even while the `WeakRef` still exists. You read through it with `.deref()`, which returns the object **or `undefined`** if it's already gone.

`FinalizationRegistry` is the companion: you `register(target, heldValue)` and, *sometime after* `target` is collected, the engine *may* call your cleanup callback with `heldValue`. Note "may" and "sometime after" — nothing about either API is guaranteed or prompt.

The one-line intuition: **these are the two APIs that let GC non-determinism leak into your program.** That's exactly why TC39 shipped them with an unusually blunt warning in the spec, and why reaching for them is almost always a design smell.

## ⚙️ How it actually works

The behaviour is deliberately weak (pun intended):

- **`deref()` can return `undefined` at any time.** Between two lines of code, the object may vanish. You must handle both branches every single time — treat it like `Map.get` on a cache that can evict itself.
- **Never `deref()` twice and assume the same result.** Within one synchronous turn the spec *does* keep a `deref`'d target alive to the end of the current microtask/job, so it won't disappear mid-function — but across turns, all bets are off.
- **Finalizer callbacks are best-effort.** They may run late, in batches, or **never** — e.g. if the page is closed, or the object lives to the end of the program. You cannot use them for anything that *must* happen (flushing a file, releasing a lock). They're a hint, not a `finally`.
- **`heldValue` must not reference the target.** If your cleanup value strongly references the object you're waiting to see collected, it can never be collected. And you can pass an `unregisterToken` so you can cancel registration.
- **Collection is coarse.** Modern GCs collect in generations and on their own schedule; there is no `System.gc()`. Timing is unobservable by design — these APIs poke a hole in that, but a *leaky, non-deterministic* hole.

Legitimate uses are narrow: **memory-sensitive caches** where you'd rather lose an entry than pin it, and **releasing external resources** tied to a JS wrapper (a WASM heap pointer, a GPU handle) when the wrapper is collected.

## 💻 Code

```js
// WeakRef cache: keep a value only while SOMETHING ELSE also holds the object.
// If memory pressure collects it, we just recompute. We never keep it alive.
function makeWeakCache(compute) {
  let ref = null;                       // WeakRef | null
  return (key) => {
    const cached = ref && ref.deref();  // ⚠️ ALWAYS check — may be undefined now
    if (cached) return cached;
    const value = compute(key);
    ref = new WeakRef(value);
    return value;
  };
}
```

```js
// FinalizationRegistry: release a native handle after the JS wrapper is GC'd.
const registry = new FinalizationRegistry((handle) => {
  // ⚠️ best-effort: may run late, batched, or never. NOT a guaranteed cleanup.
  freeNativeResource(handle);           // e.g. wasm.free(ptr)
});

class Texture {
  constructor(gpuHandle) {
    this.handle = gpuHandle;
    // register the wrapper; heldValue is the raw handle (must NOT reference `this`)
    registry.register(this, gpuHandle, this /* unregisterToken */);
  }
  dispose() {                           // the REAL cleanup path — explicit, deterministic
    registry.unregister(this);
    freeNativeResource(this.handle);
  }
}
```

## ⚖️ Trade-offs

- **Prefer `WeakMap` when you can.** If you're attaching data *to* an object, `WeakMap` gives you the same "dies with the object" behaviour with a clean, deterministic-looking API and no `deref()` dance. Use `WeakRef` only when you need to weakly hold a *standalone* object, not key metadata by one.
- **Never make finalizers your primary cleanup.** Always ship an explicit `dispose()`/`close()`. The finalizer is a *safety net* for when someone forgets — and even then it's unreliable.
- **When NOT to use either:** for control flow, caching you depend on, or "run this when X is done." If correctness depends on the timing, these are the wrong tool — you've reinvented a leaky destructor.
- **Cross-engine variance.** V8, SpiderMonkey, and JSC schedule GC differently, so behaviour you observe in Chrome won't reproduce in Firefox. Never build on observed timing.

## 💣 Gotchas interviewers probe

- **`WeakRef` vs `WeakMap`.** `WeakRef` weakly holds *one* object you read via `.deref()`; `WeakMap` weakly holds *keys* in a collection. Different tools — mixing them up is the classic tell.
- **"Finalizers are guaranteed to run."** They are **not**. If the process exits or the object survives, the callback may never fire. Treating it as a destructor is a fail.
- **Forgetting `deref()` can be `undefined`.** Any code that does `ref.deref().foo` without a guard is a latent crash.
- **`heldValue` referencing the target** creates an immortal object — it can never be collected, so the finalizer never runs. Subtle and common.
- **Using them to *observe* GC.** People try to test "is this collected yet?" — the answer is non-deterministic and you shouldn't build on it.
- **They don't prevent leaks — they mitigate them.** If a strong reference exists elsewhere, the `WeakRef` is irrelevant; the object stays alive.

## 🎯 Say this in the interview

> "`WeakRef` lets me reference an object without keeping it alive — I read it with `.deref()`, which can return `undefined` the moment it's been collected, so I always handle both cases. `FinalizationRegistry` registers a callback that *might* run after an object is collected. The framing I'd lead with is that both APIs deliberately expose garbage-collection timing, which the language otherwise hides, so they're a last resort. Finalizers are best-effort — they can run late, batched, or never, so they're never my real cleanup path; I always ship an explicit `dispose()` and treat the finalizer as a safety net. The legit use cases are narrow: memory-sensitive caches where I'd rather recompute than pin an object, and releasing a native/WASM handle tied to a JS wrapper. For attaching data to an object I'd reach for `WeakMap` first — it gives the same lifetime coupling without the `deref()` fragility."

## 🔗 Go deeper

- [MDN — WeakRef](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakRef) — the API and its explicit "avoid if you can" caveats.
- [MDN — FinalizationRegistry](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry) — the best-effort semantics spelled out.
- [TC39 — WeakRefs proposal](https://github.com/tc39/proposal-weakrefs) — the rationale and the "notes on usage" that every candidate should read.
- [V8 — Weak references and finalizers](https://v8.dev/features/weak-references) — how a real engine schedules the callbacks.
