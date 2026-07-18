<div align="center">

# RxJS & streams

<sub>🗃️ State management · 🔴 Hard · ⏱ 1.5h · `#rxjs` `#streams`</sub>

<a href="../README.md">⬅ State management</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — An Observable is a **lazy, cancellable stream of values over time** you compose with pure operators; RxJS shines exactly where Promises fall apart — multiple values, cancellation, and *coordinating* async (debounce, switch, retry, merge) — and drowns you in ceremony everywhere else.

---

## 🧠 Mental model

A Promise is **one future value, eagerly started, uncancellable**. An Observable is **zero-to-many values over time, lazy, and cancellable** — it doesn't do anything until you `subscribe`, and unsubscribing tears down the work.

The unlock is thinking of *everything that changes over time* as a stream: clicks, keystrokes, WebSocket frames, timers, HTTP responses, even state. Once inputs are streams, coordination becomes **data transformation** — you declare "keystrokes → debounce 300ms → cancel the in-flight request → fetch → results" as a pipeline, instead of hand-managing timers, flags, and stale responses.

The senior framing: RxJS is not "Promises but more." It's a **language for time**. Its entire reason to exist is the problems Promises *can't* express — cancellation and the coordination of many concurrent async sources. Reach for it when time is the hard part; avoid it when it isn't.

## ⚙️ How it actually works

An Observable is a function that, on `subscribe`, is handed an **Observer** (`next`, `error`, `complete`) and returns a **teardown**. That's the whole primitive; everything else is operators.

**Cold vs hot** — the concept interviewers weaponize:
- **Cold**: each subscriber triggers its *own* execution (a fresh HTTP call per subscribe). `of`, `from`, `ajax`.
- **Hot**: producers exist independently; subscribers share one execution and only see values emitted *after* they join (DOM events, `Subject`). `share()`/`shareReplay()` multicast a cold source into a hot one.

**Operators** are pure functions returning new Observables, chained in `.pipe()`. `map`/`filter`/`scan` you know. The ones that justify RxJS are the **flattening** operators — how a stream of streams collapses:

| Operator | On a new inner value… | Canonical use |
|---|---|---|
| `switchMap` | **cancels** the previous inner, subscribes to the new | typeahead search — kill the stale request |
| `mergeMap` | runs all inners **concurrently** | fire-and-forget parallel writes |
| `concatMap` | **queues** inners, one at a time, in order | ordered writes that must not overlap |
| `exhaustMap` | **ignores** new ones until current finishes | prevent double-submit on a button |

Choosing among these four *is* the interview. Plus `debounceTime`, `distinctUntilChanged`, `retry`/`retryWhen`, `takeUntil` (the idiomatic unsubscribe), and `combineLatest`/`withLatestFrom` for joining streams.

## 💻 Code

The typeahead — RxJS's party trick, and genuinely painful without it:

```ts
import { fromEvent } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';

const results$ = fromEvent(input, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  debounceTime(300),              // wait for a pause in typing
  distinctUntilChanged(),         // ignore "same as last query"
  switchMap((q) =>                // ← cancels the previous request on each keystroke
    ajax.getJSON(`/search?q=${encodeURIComponent(q)}`)
  ),                              // so results NEVER arrive out of order
);

const sub = results$.subscribe(render);
// later: sub.unsubscribe();  // cancels the in-flight HTTP request too
```

```ts
// The out-of-order bug this prevents, in plain async/await:
input.oninput = async (e) => {
  const r = await fetch(`/search?q=${e.target.value}`); // ❌ "reac" can resolve
  render(await r.json());                                //    AFTER "react" — stale wins
};
```

## ⚖️ Trade-offs

- **When NOT to use it:** single-value async (a Promise/`async-await` is clearer), simple state (use a store), or a team that doesn't know Rx. The operator vocabulary is large and the failure modes (leaks, cold/hot confusion) are subtle — a half-fluent team ships worse code than with Promises.
- **It's viral.** Once inputs are Observables, everything downstream tends to become one. Great when you commit (Angular does), awkward as a sprinkle in a React app where hooks already model most needs.
- **Debugging is harder.** Stack traces vanish into operator chains; you lean on `tap()` and marble diagrams. The declarative win costs you imperative introspection.
- **Where it's unbeatable:** typeahead, live collaboration/WebSockets, drag-and-drop, retry-with-backoff, rate-limiting, and any UI coordinating *several* async sources. That last one is the tell.

## 💣 Gotchas interviewers probe

- **`switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap`.** The core question. Using `mergeMap` for a typeahead reintroduces the out-of-order bug; using `switchMap` for writes silently cancels saves. Know which cancels, queues, parallelizes, or drops.
- **Memory leaks from not unsubscribing.** A subscription to a hot source lives forever until torn down. The idiomatic fix is `takeUntil(destroy$)`, not scattering manual `unsubscribe()` calls.
- **Cold vs hot / accidental double-fetch.** Subscribing to a cold HTTP Observable twice fires *two* requests. `shareReplay(1)` multicasts and replays — but a naive `shareReplay` can itself leak by keeping the source alive.
- **Observables are lazy.** No subscriber, no work — people expecting Promise-like eager execution are baffled when "nothing happens."
- **Error kills the stream.** An `error` notification is terminal — the Observable completes and stops. To survive errors you `catchError` *inside* the inner (e.g. inside `switchMap`), so the outer stream lives on.

## 🎯 Say this in the interview

> "I think of an Observable as a lazy, cancellable stream of values over time — the two things a Promise can't do. So I reach for RxJS when *time* is the hard part: typeahead, WebSockets, retry-with-backoff, coordinating several async sources. The classic example is search-as-you-type: `fromEvent` on the input, `debounceTime`, `distinctUntilChanged`, then `switchMap` to the request — and `switchMap` is doing the real work, because it cancels the previous in-flight request on each keystroke, so results can't arrive out of order. That operator choice is everything: `switchMap` cancels, `concatMap` queues, `mergeMap` parallelizes, `exhaustMap` ignores new input until the current finishes — I'd use `exhaustMap` to block double-submits. The traps are leaks from not unsubscribing — I use `takeUntil` — and that an error terminates the stream, so I `catchError` inside the inner observable to keep the outer alive. I wouldn't use RxJS for single-value async; a Promise is clearer."

## 🔗 Go deeper

- [RxJS — Overview](https://rxjs.dev/guide/overview) — Observables, Observers, the core model.
- [RxJS — Operators](https://rxjs.dev/guide/operators) — the catalogue; skim the flattening operators first.
- [Learn RxJS](https://www.learnrxjs.io/) — operators by use-case, with runnable examples — the fastest way to build the vocabulary.
- [RxMarbles](https://rxmarbles.com/) — interactive marble diagrams; the only way `switchMap` vs `mergeMap` truly clicks.
