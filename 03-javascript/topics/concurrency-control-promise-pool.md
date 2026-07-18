<div align="center">

# Concurrency control (promise pool)

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 45m · `#async` `#patterns`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A promise pool caps how many async tasks run *at once*. Instead of firing 5,000 fetches simultaneously, you keep exactly **N in flight** and start the next task the instant one finishes — which is the only pattern that survives contact with rate limits, socket limits, and memory.

---

## 🧠 Mental model

The trap that makes this a hard question: **`Promise.all` does not control concurrency.** By the time `Promise.all` sees a promise, that promise's work has *already started* — promises are eager, they begin executing the moment they're created. `Promise.all([...])` just waits for a list of things that are all already running. Map 5,000 URLs to `fetch()` and you've opened 5,000 connections before `Promise.all` runs a single line.

So the real lever isn't the promises — it's **when the async work is allowed to start**. That means you can't pass around promises; you pass around *task factories* (functions that return a promise when called). A pool is then just **N workers pulling from a shared queue**: each worker calls the next factory, awaits it, then reaches for the next. Exactly N tasks are ever live.

## ⚙️ How it actually works

There are two implementations, and the interviewer wants you to reject the obvious one.

**❌ Chunking** — slice the tasks into batches of N and `await Promise.all` per batch. Simple, but it has **head-of-line blocking**: a batch cannot start until the *slowest* task in the previous batch finishes. If one request takes 10s and the other nine take 100ms, the whole batch idles for ~10s with nine free slots. Utilisation tanks.

**✅ Worker pool (sliding window)** — spawn N workers that share a cursor into the task array. Each worker loops: grab the next index, run that task, repeat until the array is exhausted. There's no batch boundary to stall on — the moment any task settles, its worker immediately pulls the next one, so you're always running N (until the tail). This self-balances: a worker stuck on a slow task simply grabs fewer total tasks while the others race ahead.

Results are written **by index**, not pushed, so output order matches input order regardless of which task finishes first.

## 💻 Code

```js
// ✅ Worker-pool: exactly `limit` tasks in flight, order-preserving.
// `tasks` is an array of FACTORIES: () => Promise. Not promises — factories,
// so nothing starts until a worker calls it.
async function pool(tasks, limit) {
  const results = new Array(tasks.length);
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const i = cursor++;              // claim an index (single-threaded → no race)
      results[i] = await tasks[i]();   // run one; slot frees on settle
    }
  }

  // Launch N workers; they drain the shared queue in parallel.
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

// Usage — note the arrow wrappers. These are factories, NOT fetch(url) directly.
const urls = [/* ...5000... */];
const data = await pool(urls.map((u) => () => fetch(u).then((r) => r.json())), 6);
```

```js
// ❌ The bug 90% of candidates ship: this ignores `limit` entirely.
// map() calls fetch immediately → 5000 concurrent requests → 429s / ECONNRESET.
const data = await Promise.all(urls.map((u) => fetch(u)));
```

## ⚖️ Trade-offs

- **Chunking vs worker pool:** chunking is fine when tasks have uniform, predictable duration. The moment durations vary, the worker pool's continuous utilisation wins decisively — and it's barely more code.
- **When *not* to build one:** a handful of known tasks doesn't need a pool — `Promise.all` is correct and clearer. Reach for a pool only when the task count is large, unbounded, or user-driven.
- **Fail-fast vs resilient:** the version above rejects on the first task that throws (the `await` propagates). For a scraper you usually want the opposite — wrap each task in a try/catch or use `allSettled` semantics so one 500 doesn't abort the other 4,999.
- **Don't hand-roll in production.** `p-limit` / `p-map` (Sindre Sorhus) are battle-tested, handle cancellation and error modes, and are ~1KB. Hand-roll it in the interview; import it at work.

## 💣 Gotchas interviewers probe

- **"Doesn't `Promise.all` already do this?"** No — and saying yes is an instant fail. `Promise.all` sets no concurrency limit; it awaits things already running.
- **Promises are eager.** You *must* pass factories (`() => fetch(u)`), not `fetch(u)`. Passing the latter starts everything up front and the limit is a no-op. This is the single most common bug.
- **Why not chunk?** If you don't volunteer head-of-line blocking, they'll ask. A slow task in a batch strands the whole batch's slots.
- **Result ordering.** Write to `results[i]`, never `results.push()` — completion order ≠ input order.
- **Why limit at all?** Browsers cap ~6 connections per origin anyway (extra requests queue), servers return `429`, and unbounded fan-out can OOM the tab by buffering thousands of responses. The limit is about being a good client, not just speed.
- **Cancellation.** Real pools thread an `AbortController` / `signal` so in-flight tasks can be torn down when the user navigates away.

## 🎯 Say this in the interview

> "The key realisation is that `Promise.all` doesn't limit concurrency — promises are eager, so by the time `all` sees them they're already running. To cap concurrency I control *when work starts*, which means I pass task factories, not promises. Then it's a worker-pool: I spawn N workers that share a cursor into the task array, and each worker loops — claim the next index, await that task, grab the next. That keeps exactly N in flight and, crucially, has no batch boundary, so unlike naive chunking there's no head-of-line blocking when one task is slow. I write results by index to preserve input order. I'd limit concurrency to avoid hitting server rate limits and exhausting sockets, and for a resilient version I'd catch per-task so one failure doesn't kill the batch. In production I'd just use `p-limit`."

## 🔗 Go deeper

- [BigFrontend.dev — implement a general async pool](https://bigfrontend.dev/) — the canonical interview version of this problem.
- [p-limit (Sindre Sorhus)](https://github.com/sindresorhus/p-limit) — the reference implementation; read the source, it's tiny.
- [MDN — Promise.all](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) — confirm for yourself that it takes no limit argument.
- [javascript.info — Promise API](https://javascript.info/promise-api) — the combinators you're building on top of.
