<div align="center">

# Composition (`pipe`/`compose`)

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 30m · `#functional`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Composition builds a big function out of small ones by feeding each output into the next input. `pipe` reads left-to-right in data-flow order; `compose` reads right-to-left in math order. Same machine, opposite direction.

---

## 🧠 Mental model

A composed function is an **assembly line**. Data enters one end, each station transforms it, and the finished value falls out the other end. Every station is a *unary* function — one input, one output — because a pipe can only hand one value to the next stage.

```
pipe(a, b, c)(x)     ===  c(b(a(x)))     // left → right, "do a, then b, then c"
compose(a, b, c)(x)  ===  a(b(c(x)))     // right → left, mirrors nested calls
```

The only reason two names exist is reading order. `compose` matches how you'd write it by hand — `f(g(x))` — so the *last* argument runs *first*. `pipe` matches how you *think* about a process ("validate, then normalise, then save"), which is why almost every modern codebase prefers `pipe`. If you can only remember one, remember `pipe`.

## ⚙️ How it actually works

Both are a one-line `reduce`. That's the whole trick — the operation you're reducing over *is function application*.

```js
const pipe    = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);
const compose = (...fns) => (x) => fns.reduceRight((acc, fn) => fn(acc), x);
```

`pipe` folds the array forward carrying the running value; `compose` folds it backward. Note the seed is the initial argument `x`, not `0` — a classic reduce misread.

The **hard constraint** the interviewer wants you to name: every function in the chain must take exactly one argument. Real transforms take config, so you curry them into unary shape *first*:

```js
const filterBy = (pred) => (arr) => arr.filter(pred);   // returns a unary fn
const map      = (f)    => (arr) => arr.map(f);
```

If you want to thread multiple values, the value flowing through is a single object or tuple — not multiple arguments. Composition is fundamentally **point-free**: you describe the pipeline, never naming the intermediate value.

## 💻 Code

```js
const pipe = (...fns) => (x) => fns.reduce((acc, fn) => fn(acc), x);

const trim      = (s) => s.trim();
const lower     = (s) => s.toLowerCase();
const slugify   = (s) => s.replace(/\s+/g, '-');

const toSlug = pipe(trim, lower, slugify);
toSlug('  Hello World  '); // 'hello-world'

// Async pipe: await each stage so promises don't leak through.
const pipeAsync = (...fns) => (x) =>
  fns.reduce((p, fn) => p.then(fn), Promise.resolve(x));

const loadUser = pipeAsync(fetchJson, validate, normalise, save);
```

The failure mode to show you've hit:

```js
// ❌ Non-unary function silently drops arguments.
const add = (a, b) => a + b;
pipe(add, double)(2, 3); // add receives only 2; b is undefined → NaN

// ✅ Curry it to unary.
const add = (a) => (b) => a + b;
pipe(add(3), double)(2); // (2+3)*2 = 10
```

## ⚖️ Trade-offs

- **Readability vs. debuggability.** A pipeline reads beautifully but has no intermediate variable names, so a stack trace points at an anonymous stage. Insert a `tap` (`(f) => (x) => (f(x), x)`) to log without breaking the chain.
- **When NOT to use it:** branching logic. Composition is a straight line; the moment you need `if this, go here, else there`, a pipe becomes contortion. Reach for plain functions or a small state machine instead.
- **Performance is a non-issue** — it's the same call count as nesting by hand. The cost is purely the closures, which are negligible. Don't let anyone tell you `pipe` is "slow".
- **Type inference** in TypeScript degrades past ~10 stages because each overload must be hand-written; libraries cap the typed arity. In practice, split into named sub-pipes.

## 💣 Gotchas interviewers probe

- **Direction confusion.** `compose(f, g)` runs `g` first. State this without hesitating — reversing it is the classic slip.
- **The reduce seed.** The initial value is the *argument*, not `0`/`{}`. Getting the seed wrong is the most common bug when asked to implement it live.
- **Multi-argument first stage.** `pipe` returns a unary function, so only the *first* call can be variadic if you special-case it. Purists keep everything unary; know the difference.
- **Async leaks.** A normal `pipe` passes a `Promise` straight into the next function, which then operates on the promise object, not its value. You need `pipeAsync`. Candidates trip on this constantly.
- **`this` binding.** Composition strips context — methods lose `this`. Wrap with an arrow or `.bind` before composing.

## 🎯 Say this in the interview

> "Composition chains unary functions so each output feeds the next input. I implement both as a one-line reduce — `pipe` uses `reduce` and reads left-to-right in the order things happen, `compose` uses `reduceRight` and reads right-to-left to mirror `f(g(x))`. The seed is the input argument, not zero, which is the bug people hit live. The real constraint is that every stage must be unary, so I curry config-taking functions into unary shape first, and the value threading through is a single object if I need to carry state. In practice I default to `pipe` because it matches how I describe a process, I add a `tap` for logging so I don't lose debuggability, and I use an async variant that awaits each stage — otherwise a promise leaks straight into the next function."

## 🔗 Go deeper

- [MDN — Array.prototype.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) — the primitive both functions are built on.
- [Ramda — compose / pipe](https://ramdajs.com/docs/#pipe) — the reference implementations, auto-curried and variadic.
- [BigFrontend.dev](https://bigfrontend.dev/) — implement `pipe`/`compose` from scratch; a recurring live-coding prompt.
