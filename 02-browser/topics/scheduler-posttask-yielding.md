<div align="center">

# `scheduler.postTask` / yielding

<sub>🌐 Browser · 🔴 Hard · ⏱ 45m · `#async` `#modern`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `scheduler.postTask` is the browser's first-class, **priority-aware** task queue, and `scheduler.yield()` breaks a long task into chunks that resume *ahead* of freshly-arrived work — retiring the `setTimeout(0)` and `requestIdleCallback` hacks with real priorities, cancellation, and a promise-based API.

---

## 🧠 Mental model

For years there were only two crude scheduling primitives: `setTimeout(0)` ("run soon, no say over priority") and `requestIdleCallback` ("run whenever, maybe never"). `scheduler` gives the platform an actual priority system:

| Priority | Meaning | Example |
|---|---|---|
| `user-blocking` | Highest. Blocking the user right now. | Responding to a tap, rendering the clicked view. |
| `user-visible` | Default. Visible but not blocking. | Rendering below-the-fold content. |
| `background` | Lowest. Never urgent. | Logging, prefetch, index building. |

The event loop drains higher-priority task queues before lower ones. So instead of *hoping* your `setTimeout` runs at the right time, you **declare intent** and the browser orders the work for you.

## ⚙️ How it actually works

- **`postTask` returns a promise** that resolves with your callback's return value, so it composes with `async`/`await` and `try/catch` naturally.
- **`TaskController` gives you cancellation *and* dynamic reprioritization.** Its `signal` aborts a queued task; `controller.setPriority('background')` can *demote* an in-flight task — e.g. downgrade a fetch-parse job the moment the user scrolls it offscreen. No other primitive can do this.
- **`scheduler.yield()` is the headline feature.** `await scheduler.yield()` pauses a long task and lets the browser handle input/render — but the continuation is queued at a priority that **keeps your place in line**, ahead of tasks that arrived while you were running. Contrast `await new Promise(r => setTimeout(r))`, which sends your continuation to the *back* of the task queue, behind everything else.
- **Why yielding matters at all:** any task over **50ms** is a "long task" that blocks input and wrecks **INP** (Interaction to Next Paint). Chunking with `yield()` keeps every task short so input is never stuck behind your work.

## 💻 Code

```js
// A long job chopped into responsive chunks.
async function processLargeDataset(rows) {
  for (let i = 0; i < rows.length; i++) {
    handle(rows[i]);
    // Every ~50 rows, give the browser a chance to paint / take input.
    if (i % 50 === 0 && scheduler.yield) {
      await scheduler.yield();  // resumes AHEAD of newly-queued tasks
    }
  }
}
```

Priorities and cancellation with a `TaskController`:

```js
const controller = new TaskController({ priority: 'user-visible' });

// Cancel or reprioritize based on user behaviour.
scheduler.postTask(() => renderChart(data), { signal: controller.signal })
  .then(() => console.log('done'))
  .catch((e) => e.name === 'AbortError' && console.log('cancelled'));

onScrollAway(() => controller.setPriority('background')); // demote, don't cancel
onNavigateAway(() => controller.abort());                 // drop it entirely
```

The yielding contrast that interviewers love:

```js
// ❌ Continuation goes to the BACK of the queue — every other task cuts in line.
await new Promise((r) => setTimeout(r, 0));

// ✅ Continuation keeps priority — the browser runs your remaining work first
//    once it has handled the urgent input/paint it yielded for.
await scheduler.yield();
```

## ⚖️ Trade-offs

- **`postTask` replaces `setTimeout(0)` for chunking and `requestIdleCallback` for deferral** — one API, three priorities, cancellation, promises. On a greenfield project it's the default.
- **Chromium-only for now** (behind support in Firefox/Safari). You need a feature-detected fallback (`setTimeout`/`isInputPending` polyfill, or React/Scheduler-style userland scheduler). Don't assume `scheduler` exists.
- **Priorities are cooperative, not preemptive.** A running task still runs to completion — declaring `user-blocking` doesn't interrupt in-progress work. You still have to *yield* to be responsive; priorities only order what's queued.
- **When NOT to bother:** short, one-shot callbacks where ordering is irrelevant. The API earns its keep on long or competing workloads, not on a single `setTimeout` for a tooltip delay.

## 💣 Gotchas interviewers probe

- **`await scheduler.yield()` ≠ `await setTimeout`.** The entire point is that `yield()` resumes *ahead* of newly-enqueued tasks; `setTimeout` resumes *behind* them. Confusing the two is the tell that you've only read the headline.
- **Priority ≠ preemption.** Setting `user-blocking` doesn't pause other running JS — the main thread is single-threaded. It only affects the *order* of queued tasks. You still need to yield.
- **`TaskController.setPriority` mutates a live task.** Dynamic demotion/promotion is the feature that has no equivalent in `setTimeout` or `rIC` — worth naming explicitly.
- **50ms is the long-task line.** Interviewers tie this to **INP**; chunking exists to keep tasks under it so interactions aren't blocked.
- **Aborting rejects with `AbortError`.** Handle it, or an intentional cancellation looks like an unhandled rejection.
- **`isInputPending()`** is the older, coarser cousin: "is a user input waiting?" — useful in a fallback yield loop, but `yield()` is the cleaner primitive.

## 🎯 Say this in the interview

> "`scheduler.postTask` is the browser's real scheduler — three priorities, user-blocking, user-visible, and background — returning a promise, with a `TaskController` for cancellation and even live reprioritization. The piece I'd emphasize is `scheduler.yield()`: to keep interactions responsive I break long tasks into sub-50ms chunks, and unlike `await setTimeout(0)`, yielding resumes my continuation *ahead* of tasks that arrived while I was running, so I don't lose my place behind unrelated work. That directly protects INP. The important nuance is that priority is cooperative, not preemptive — declaring `user-blocking` only reorders the queue; the thread is still single-threaded, so I have to actually yield. And it's Chromium-only today, so in production I feature-detect and fall back to a `setTimeout`/`isInputPending` scheduler."

## 🔗 Go deeper

- [web.dev — Optimize long tasks](https://web.dev/articles/optimize-long-tasks) — the definitive guide to yielding and `scheduler.yield()` vs `setTimeout`.
- [MDN — `Scheduler.postTask()`](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/postTask) — priorities, `TaskController`, signals.
- [MDN — `Scheduler.yield()`](https://developer.mozilla.org/en-US/docs/Web/API/Scheduler/yield) — the "keep your place in line" semantics.
- [web.dev — INP](https://web.dev/articles/inp) — why sub-50ms tasks matter for the metric this all serves.
