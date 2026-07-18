<div align="center">

# `Promise.all/allSettled/race/any`

<sub>⚡ JavaScript · 🟡 Medium · ⏱ 45m · `#async` `#polyfill`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Four combinators over an iterable of promises: **`all`** = every value or the first rejection (fail-fast); **`allSettled`** = wait for everything, never rejects; **`race`** = first to *settle* (fulfil **or** reject); **`any`** = first to *fulfil*, else an `AggregateError`. Picking the wrong one is a correctness bug, not a style choice.

---

## 🧠 Mental model

They differ on two axes: *how many* results you need, and *whether a rejection ends it early*.

| Combinator | Fulfils when | Rejects when | Result shape |
|---|---|---|---|
| `all` | **all** fulfil | **any** rejects (first) | array of values, in input order |
| `allSettled` | **all** settle | **never** | array of `{status, value \| reason}` |
| `race` | first **settles** (either) | first settle is a rejection | that single value / reason |
| `any` | first **fulfils** | **all** reject | value / `AggregateError` of reasons |

The two "first-past-the-post" ones trip people up: **`race` settles on the first to finish *however it finishes*** — a fast rejection beats a slow success. **`any` ignores rejections** and waits for the first *success*. If you want a timeout, that's `race`; if you want "first server that answers OK," that's `any`.

## ⚙️ How it actually works

- **`all` is fail-fast**: the *first* rejection rejects the aggregate immediately — but the other promises are **not cancelled**. Promises have no cancellation; the losers keep running, their side effects still land, their rejections may surface as unhandled. To actually stop them you need `AbortController`.
- **`all` and `allSettled` preserve *input order*** in the result array, regardless of which settled first. The array index is fixed at iteration time, not completion time.
- **`allSettled` never rejects.** You get one entry per input, each `{status:'fulfilled', value}` or `{status:'rejected', reason}`. *You* must inspect them — forgetting to filter for `'rejected'` silently hides failures.
- **`any` (ES2021)** collects rejections and only rejects once *all* have — with an `AggregateError` whose `.errors` array holds each reason.
- **Empty iterables** are the edge: `all([])` and `allSettled([])` fulfil immediately with `[]`; **`any([])` rejects** with an `AggregateError`; **`race([])` stays pending forever**.

## 💻 Code

```js
// Timeout pattern — race real work against a rejecting timer
const withTimeout = (work, ms) =>
  Promise.race([
    work,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), ms)),
  ]);

// Partial success — allSettled, then split winners from losers
const results = await Promise.allSettled(urls.map((u) => fetch(u)));
const ok = results.filter((r) => r.status === 'fulfilled').map((r) => r.value);
const failed = results.filter((r) => r.status === 'rejected').map((r) => r.reason);
```

```js
// Polyfill of Promise.all — shows fail-fast + order preservation
Promise.myAll = (items) => new Promise((resolve, reject) => {
  const arr = [...items];
  const out = new Array(arr.length);
  let remaining = arr.length;
  if (remaining === 0) return resolve(out);     // empty → resolve now
  arr.forEach((item, i) => {
    Promise.resolve(item).then(                 // wrap non-promise values
      (value) => {
        out[i] = value;                         // index fixes input order
        if (--remaining === 0) resolve(out);    // last one wins
      },
      reject,                                    // FIRST rejection settles the aggregate
    );
  });
});
```

## ⚖️ Trade-offs

- **`all` for "I need all of them, and any failure is fatal"** — a dashboard that can't render with a missing panel. **`allSettled` for "show me what succeeded"** — render the panels that loaded, mark the rest as errored. Choosing `all` when you wanted partial success turns one flaky request into a blank screen.
- **`race` is for *deadlines*, `any` is for *redundancy*.** Race the work against a timer; `any` across mirror endpoints and take the first healthy one.
- **None of them cancel the losers.** If un-run work is expensive, pair the combinator with an `AbortController` and abort the rest once you have your answer.
- **When NOT to fan out:** if the requests hit the same rate-limited backend, launching 200 in parallel via `all` can get you throttled — batch with a concurrency limit instead.

## 💣 Gotchas interviewers probe

- **`race` settles on the first *rejection* too.** People expect "first success" and get burned when the fastest promise rejects. First-success is `any`, not `race`.
- **`all` doesn't cancel siblings on rejection.** The other requests still complete and can throw unhandled rejections. Naming this is a strong signal.
- **`allSettled` never rejects — so `try/catch` around it catches nothing.** You must walk the results and check `status` yourself.
- **Empty-iterable behaviour differs**: `all([])`/`allSettled([])` → `[]`; `any([])` → rejects; `race([])` → **hangs forever**. A `race` that never settles is a real deadlock.
- **Order vs. completion order.** `all`'s result array is in *input* order, not the order things resolved. Assuming completion order is a bug.
- **Non-promise values are allowed.** `Promise.all([1, fetch(x)])` works — plain values are wrapped via `Promise.resolve`. That's why polyfills must `Promise.resolve(item)`.
- **`any`'s failure is an `AggregateError`**, not a normal `Error`. Read `err.errors` for the individual reasons.

## 🎯 Say this in the interview

> "I pick by two questions: do I need all the results or just one, and does a failure end it early. `all` waits for every value but is fail-fast — the first rejection rejects the whole thing, though importantly it doesn't cancel the others, they keep running. `allSettled` waits for everything and never rejects, so it's my choice when I want partial success and to report which ones failed. `race` settles on whichever finishes first *including a rejection*, so it's the timeout primitive; `any` is the one that waits for the first *success* and only rejects, with an `AggregateError`, if they all fail. The traps I watch for: `race` firing on a fast rejection, `allSettled` making `try/catch` pointless because it never throws, and `race([])` hanging forever. If cancellation actually matters, I wire an `AbortController` in, since promises don't cancel themselves."

## 🔗 Go deeper

- [MDN — Promise.all()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all) — fail-fast semantics and order preservation.
- [MDN — Promise.allSettled()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/allSettled) — the `{status, value/reason}` result shape.
- [MDN — Promise.any()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/any) — first-fulfilment and `AggregateError`.
- [javascript.info — Promise API](https://javascript.info/promise-api) — all four side by side, with worked examples.
