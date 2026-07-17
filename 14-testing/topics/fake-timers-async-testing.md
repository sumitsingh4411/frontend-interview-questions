<div align="center">

# Fake timers & async testing

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#mocking` `#async`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Fake timers replace `setTimeout`/`Date`/`requestAnimationFrame` with a **manually-advanced clock**, turning "wait 5 real seconds" into "advance 5 virtual milliseconds" — but they only move *timers*, not *microtasks*, which is why the classic bug is a test that advances the clock and then asserts before the promise chain has flushed.

---

## 🧠 Mental model

There are **two independent queues** in the event loop, and fake timers only own one of them:

```
   ┌─ MACROTASKS (the timer queue) ────────────┐  ← fake timers control this
   │  setTimeout, setInterval, rAF, setImmediate│    jest.advanceTimersByTime() drains it
   └───────────────────────────────────────────┘
   ┌─ MICROTASKS ──────────────────────────────┐  ← fake timers CANNOT control this
   │  Promise.then, await, queueMicrotask       │    only `await` / flushing drains it
   └───────────────────────────────────────────┘
```

Fake timers are a **time machine, not a fast-forward button**. Nothing runs "faster" — you are hand-cranking a clock and the scheduler executes whatever callbacks that crank makes due. A real `await fetch()` doesn't get faster; it isn't on the timer queue at all.

That single distinction explains ~90% of fake-timer pain: **you advanced the clock, the timer callback ran, it returned a promise, and your assertion fired before that promise resolved.**

## ⚙️ How it actually works

Installing fake timers **monkey-patches the global scheduler** (`@sinonjs/fake-timers` under the hood in Jest and Vitest). `setTimeout` no longer talks to the OS; it pushes `{ callback, dueAt }` into an in-memory sorted list. `Date.now()` and `performance.now()` read from a virtual `now` counter rather than the system clock.

The advancing APIs — know which is which, interviewers ask:

| API | What it does |
|---|---|
| `advanceTimersByTime(ms)` | Moves the clock `ms` forward, firing everything due along the way. |
| `runAllTimers()` | Fires every pending timer. **Infinite-loops** on a self-rescheduling `setInterval`. |
| `runOnlyPendingTimers()` | Fires only what's queued *now*. The safe choice for recursive timers. |
| `advanceTimersByTimeAsync(ms)` | Same as above but `await`s between timers — **drains microtasks too**. |

That last row is the fix most candidates don't know. `advanceTimersByTimeAsync` (Jest 29.5+/Vitest) yields to the microtask queue between each timer callback, so `async` code inside a timer actually settles.

**The `userEvent` deadlock.** `@testing-library/user-event` v14 internally `await`s a real `setTimeout(0)` between keystrokes. With fake timers installed, that timeout *never fires* — nobody is advancing the clock, because your test is blocked `await`ing it. The test hangs until the runner times out. The fix is one line at setup: `userEvent.setup({ advanceTimers: jest.advanceTimersByTime })`, which lets user-event crank the clock itself.

**Faking `Date` is the underrated half.** Snapshot tests containing "3 minutes ago", JWT-expiry logic, and anything sorting by `createdAt` are nondeterministic until you pin the clock with `setSystemTime`.

## 💻 Code

Debounce — the canonical fake-timer test, and the canonical mistake:

```js
beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());   // ✅ ALWAYS restore. A leaked fake clock
                                         //    breaks every later test in the file.

// ❌ Hangs forever: the clock is frozen and user-event is waiting on a real timer
test('search debounces', async () => {
  const user = userEvent.setup();
  await user.type(screen.getByRole('searchbox'), 'shoe'); // 💀 never resolves
});

// ✅ Hand user-event the crank
test('search debounces', async () => {
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  render(<Search onSearch={onSearch} />);

  await user.type(screen.getByRole('searchbox'), 'shoe');
  expect(onSearch).not.toHaveBeenCalled();     // still inside the 300ms window

  jest.advanceTimersByTime(300);
  expect(onSearch).toHaveBeenCalledTimes(1);   // one call, not four
  expect(onSearch).toHaveBeenCalledWith('shoe');
});
```

The microtask trap, and the two ways out:

```js
// The code under test: a timer that awaits something
setTimeout(async () => { setData(await fetchUser()); }, 1000);

// ❌ Timer fires, but the `await` hasn't settled yet — state is still null
jest.advanceTimersByTime(1000);
expect(screen.getByText('Ada')).toBeInTheDocument(); // fails

// ✅ Option A: the async variant flushes microtasks between timers
await jest.advanceTimersByTimeAsync(1000);
expect(screen.getByText('Ada')).toBeInTheDocument();

// ✅ Option B: advance, then let RTL retry until the assertion passes
jest.advanceTimersByTime(1000);
await waitFor(() => expect(screen.getByText('Ada')).toBeInTheDocument());
```

Pin the clock for anything date-dependent:

```js
jest.useFakeTimers({ now: new Date('2026-01-01T00:00:00Z') });
// or mid-test:
jest.setSystemTime(new Date('2026-01-01T00:00:00Z'));
expect(formatRelative(post.createdAt)).toBe('3 days ago'); // deterministic forever
```

## ⚖️ Trade-offs

- **Fake timers buy determinism and pay in coupling.** Your test now knows the debounce is 300ms. Refactor to 250ms and the test breaks even though behaviour is fine. That coupling is usually worth it — the alternative is a real 300ms sleep in every test — but it is a real cost, so assert on *behaviour either side of the boundary*, not on the exact number where you can avoid it.
- **Don't use fake timers as a substitute for `waitFor`.** For "the network resolved and the UI updated," `findBy*` and `waitFor` are the right tool — there's no timer involved, so faking the clock does nothing but add a footgun.
- **Scope them narrowly.** Global fake timers in `setupFiles` means every test in the repo inherits a frozen clock, including third-party code that quietly needs real ones. Turn them on per-file, per-suite.
- **When NOT to use them:** anything genuinely I/O bound (MSW handlers, real animations you're measuring), and any test that would still be fast with real time. A real `setTimeout(0)` costs nothing — faking it costs a footgun.

## 💣 Gotchas interviewers probe

- **"Fake timers make promises resolve" — false.** They control the *macrotask* queue only. `await`ed promises need a microtask flush: `await advanceTimersByTimeAsync(ms)`, or `await waitFor(...)`. This is the #1 thing candidates get wrong.
- **`runAllTimers()` on a self-rescheduling `setInterval` hangs forever** — each callback queues another. Use `runOnlyPendingTimers()` or `advanceTimersByTime` with a bounded window.
- **user-event v14 + fake timers deadlocks** unless you pass `advanceTimers`. Knowing this cold is a strong senior signal — it's the single most-Googled RTL bug.
- **Forgetting `useRealTimers()` in `afterEach`** leaks a frozen clock into unrelated tests, which then fail *elsewhere* with baffling timeouts. Classic action-at-a-distance.
- **Fake timers don't stop React's `act()` warnings.** Advancing the clock triggers state updates outside React's batching; wrap the advance in `act()` or use RTL's async utils, which do it for you.
- **`jest.useFakeTimers()` doesn't fake `process.nextTick` or `queueMicrotask` by default** — you must opt in via `doNotFake`/config. Most people assume "fake timers" means "fake everything scheduling-related."
- **Timers vs `Date` are separately faked in some configs.** Advancing timers without advancing `Date.now()` gives you code that sees a timer fire while the clock claims no time passed — a genuinely confusing state.

## 🎯 Say this in the interview

> "Fake timers swap the global scheduler for an in-memory clock I advance by hand, so a 300ms debounce test runs in microseconds and deterministically. The key thing I'd flag is that they only control the *macrotask* queue — `setTimeout`, `setInterval`, `rAF`. They do nothing for promises. So if the timer callback `await`s something, advancing the clock fires the callback but my assertion still runs before the promise settles. The fix is `await jest.advanceTimersByTimeAsync()`, which flushes microtasks between timers, or just `waitFor` after advancing. The other thing I always do is pass `advanceTimers` to `userEvent.setup()` — user-event awaits a real timeout between keystrokes, so with a frozen clock the test deadlocks. And I restore real timers in `afterEach`, because a leaked fake clock fails tests in completely unrelated files."

## 🔗 Go deeper

- [Jest — Timer mocks](https://jestjs.io/docs/timer-mocks) — the canonical API, including `advanceTimersByTimeAsync` and `doNotFake`.
- [Vitest — `vi.useFakeTimers`](https://vitest.dev/api/vi.html) — same model, and the config surface for choosing what to fake.
- [Testing Library — user-event options](https://testing-library.com/docs/user-event/options) — the `advanceTimers` option that unblocks the deadlock.
- [Sinon — fake timers](https://sinonjs.org/releases/latest/fake-timers/) — the library Jest and Vitest both wrap; the reference for the underlying semantics.
- [Jake Archibald — Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) — why the two queues are separate in the first place.
