<div align="center">

# V8 & JIT compilation

<sub>🌐 Browser · 🔴 Hard · ⏱ 1.5h · `#internals` `#v8`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — V8 runs your JS through a **tiered pipeline**: it starts fast with an interpreter (Ignition) so code runs immediately, watches which functions get *hot*, then a JIT (Sparkplug → Maglev → TurboFan) recompiles those into optimized machine code using assumptions about your types — and **deoptimizes** back to bytecode the instant an assumption breaks.

---

## 🧠 Mental model

A JIT is a bet. Compiling to fast machine code takes time you don't have at startup, so V8 does the opposite of "compile everything up front": it **interprets immediately** (great startup, mediocre throughput), and only pays for optimization on the small fraction of code that runs enough to be worth it. The heuristic is "hot code is worth compiling; cold code isn't."

The bet is on **types**. JS has no static types, but real programs are *practically* monomorphic — a function is almost always called with the same shapes of objects. The JIT observes those shapes at runtime, compiles a version specialized to them, and guards it. If a call later violates the assumption (you pass a string where it always saw numbers), the guard fails and V8 **deoptimizes**: throws away the optimized code and falls back to the interpreter. Your job as a performance-minded dev is to *keep the bets winnable* — stable types, stable object shapes.

## ⚙️ How it actually works

**The tiers (fast to start → fast to run):**

| Tier | What it is | Kicks in |
|---|---|---|
| **Ignition** | Bytecode interpreter | Immediately, for all code |
| **Sparkplug** | Baseline non-optimizing JIT (bytecode → machine code, no analysis) | Fast, for warm code |
| **Maglev** | Mid-tier optimizing JIT | Hotter code (newer tier) |
| **TurboFan** | Top-tier optimizing JIT, heavy analysis | Genuinely hot code |

**The lifecycle of a hot function:**

1. Source → parsed to an AST → compiled to **Ignition bytecode**. Runs interpreted.
2. As it runs, Ignition collects **type feedback** in inline-cache slots: "at this property access, I always see objects of shape X."
3. When call count / loop iterations cross a threshold, V8 promotes the function up a tier. TurboFan uses the collected feedback to **speculatively optimize** — e.g. inline the callee, assume `obj.x` is at a fixed offset, skip type checks.
4. It inserts **guards** (deopt checks). If a guard fails at runtime — a shape it never saw, an integer that overflows to a float, a `hole` in an array — it **bails out** to the bytecode at the exact point, and may re-optimize later.

**Why speculation is safe:** the optimized code is only valid *given* its assumptions. Guards make the assumptions checkable and cheap, and deopt makes violations correct (just slow). That's the entire trick that lets a dynamic language run near-native.

**Startup vs peak throughput** is an explicit tension: more time in TurboFan = faster steady state but slower startup and more memory. V8 also does **lazy compilation** (functions are only fully compiled when first called) and can **cache** compiled bytecode across page loads.

## 💻 Code

```js
// ✅ Monomorphic: `add` always sees {x:number, y:number}. TurboFan can specialize hard.
function add(p) { return p.x + p.y; }
for (let i = 0; i < 1e6; i++) add({ x: i, y: i }); // hot, stable shape → optimized

// ❌ Polymorphic → megamorphic: mixing shapes poisons the inline cache and blocks
//    the good optimizations. Same function, far slower.
add({ x: 1, y: 2 });
add({ y: 2, x: 1 });      // different property ORDER = different hidden class
add({ x: 1, y: 2, z: 3 }); // different shape again → IC degrades

// ❌ Classic deopt: an int-only array suddenly holds a float/hole.
const a = [1, 2, 3];      // V8 stores as PACKED_SMI (small ints)
a[10] = 4;                // creates holes → HOLEY array, transitions kind, deopts consumers
a.push(1.5);              // now DOUBLE → another transition
```

```bash
# See the optimizer's decisions (Node/V8):
node --trace-opt --trace-deopt app.js   # what got optimized and why it bailed
node --print-opt-code app.js            # the machine code TurboFan emitted
```

## ⚖️ Trade-offs

- **JIT vs AOT.** JITs adapt to *actual* runtime behaviour (a huge win for dynamic JS) but cost warm-up time and memory, and can be attacked (JIT spraying) — hence hardening like V8's sandbox and, on some platforms, JIT-less modes.
- **Optimizing for the JIT is usually premature.** Write clear code with stable shapes; only chase monomorphism in genuinely hot paths you've profiled. Contorting a whole codebase for the optimizer is a net loss.
- **`eval`, `with`, `arguments` leaks, `try/catch` in hot loops** historically defeated optimization. Modern V8 handles most of these far better — don't cargo-cult ancient advice; measure.

## 💣 Gotchas interviewers probe

- **"JS is interpreted" is outdated.** It's interpreted *and* JIT-compiled — a tiered pipeline. Saying only one betrays a shallow model.
- **Object *shape* (hidden class) drives optimization**, and property *insertion order* is part of the shape. `{x,y}` and `{y,x}` are different shapes → polymorphism.
- **Deoptimization is the hidden performance cliff.** Code that ran fast for a million iterations can suddenly get 10× slower because one odd input tripped a guard and forced a bailout.
- **Arrays have internal "elements kinds"** (SMI → double → generic, packed → holey). Creating holes (`a[100]=x` on a short array) or mixing types transitions to a slower kind you can't easely go back from.
- **Startup vs throughput is a real dial.** For short-lived scripts, the interpreter *is* the fast path — you may never reach TurboFan, so micro-optimizing for peak throughput is pointless.

## 🎯 Say this in the interview

> "V8 is a tiered engine. It compiles source to bytecode and runs it in the Ignition interpreter immediately, so startup is fast, and it collects type feedback as the code runs. When a function gets hot, it promotes it through baseline and optimizing JITs — Sparkplug, Maglev, TurboFan — which speculatively compile machine code specialized to the types it actually observed: inlining calls, assuming property offsets, dropping type checks. Those assumptions are protected by guards, and if one fails — say a function that only ever saw integers suddenly gets a float or a differently-shaped object — V8 deoptimizes back to bytecode. So the practical lesson is to keep types and object shapes stable in hot paths, because polymorphism poisons the inline caches and deopts are a real performance cliff. But I only reach for this after profiling — for most code, clear beats clever."

## 🔗 Go deeper

- [V8 blog](https://v8.dev/blog) — the primary source; posts on Ignition, TurboFan, Sparkplug, Maglev.
- [V8 — Hidden classes](https://v8.dev/docs/hidden-classes) — how object shapes underpin the whole optimization story.
- [Franziska Hinkelmann — JS engines under the hood](https://www.youtube.com/watch?v=p-iiEDtpy6I) — a clear, authoritative talk on the pipeline.
