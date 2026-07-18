<div align="center">

# Flaky tests & determinism

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#strategy`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A flaky test is one that passes and fails on the *same* code, and it's almost never random: it's a **hidden input** — time, order, network, animation, or a race between your assertion and the app's async work. Retries hide flake; they don't fix it. The cure is to remove the nondeterminism or wait on the right signal.

---

## 🧠 Mental model

A test is a function: `code → pass/fail`. Flake means that function isn't pure — something else is feeding it. Debugging flake is therefore not "why is this test weird", it's a **hunt for the undeclared input**.

There are only about five of them, and naming them fast is the senior signal:

| Hidden input | Symptom | Fix |
|---|---|---|
| **Time** | fails at midnight, in CI's timezone, or "sometimes" | fake timers, inject the clock |
| **Order / shared state** | passes alone, fails in the suite | reset state; run in random order |
| **Async races** | fails on a slow/loaded CI box | await the *signal*, never a duration |
| **Network / real I/O** | fails when an API blips | mock the boundary (MSW) |
| **Animation / layout** | click lands on a moving element | disable animations; auto-waiting locators |

The framing that matters: **flake is a real bug report you're choosing to ignore.** A race in a test is often a race in the app; the test just runs on hardware weird enough to expose it. Teams that reflexively add `retries: 3` are auto-suppressing their own bug tracker.

## ⚙️ How it actually works

**The canonical async race.** `userEvent.click()` triggers a fetch; your assertion runs on the next line, before the promise resolves. Fast dev machine: the microtask happens to land first, green. Loaded CI box: it doesn't, red. The test was *always* broken — you just got lucky locally. This is why `await screen.findBy*` (which polls until the DOM matches) exists and why `getBy*` immediately after an action is a flake factory.

**Why `waitFor(() => sleep(500))` is the wrong fix.** A fixed sleep is a bet on the machine's speed. It's simultaneously too short (flakes under CI load) and too long (every test pays the full 500ms even when the work took 3ms). Sleeps are the single biggest cause of slow *and* flaky suites. Wait on a **condition**, not a **duration** — Playwright's locators and RTL's `findBy` both do this by polling with a deadline.

**Test order dependence.** Jest/Vitest reuse a module registry per file and share globals across tests in that file. A test that writes `localStorage`, leaves a `spyOn` unrestored, mutates a module-level cache, or leaves a timer running poisons its neighbours. The tell: it passes with `.only` and fails in the suite. The diagnostic is to **randomise order deliberately** — if random order breaks you, you have coupling, and coupling is latent flake waiting for someone to add a test above yours.

**Retries as a signal, not a fix.** Playwright's `retries` exist for a specific reason: to keep CI usable *while* marking a test flaky in the report. The value is the **label** — "this passed on attempt 2" is data. Using retries to make the red go away means you've traded a visible bug for an invisible one.

## 💻 Code

The three flake archetypes, wrong and right:

```js
// ❌ RACE — assertion runs before the fetch resolves. Green locally, red on CI.
await userEvent.click(screen.getByRole('button', { name: /load/i }));
expect(screen.getByText('Ada')).toBeInTheDocument();

// ✅ Wait for the SIGNAL. findBy polls the DOM until it matches (or times out).
await userEvent.click(screen.getByRole('button', { name: /load/i }));
expect(await screen.findByText('Ada')).toBeInTheDocument();
```

```js
// ❌ TIME — this test dies on New Year's Eve, and in CI's UTC timezone.
expect(formatDate(new Date())).toBe('15 Jul 2026');

// ✅ Freeze the clock. Now the test has one input, not two.
beforeEach(() => vi.useFakeTimers({ now: new Date('2026-07-15T12:00:00Z') }));
afterEach(() => vi.useRealTimers()); // ← forgetting this leaks into other files
expect(formatDate(new Date())).toBe('15 Jul 2026');
```

```js
// ❌ ORDER — module-level cache survives between tests in this file.
import { cache } from './cache';
test('a', () => { cache.set('k', 1); /* ... */ });
test('b', () => { expect(cache.get('k')).toBeUndefined(); }); // fails only after 'a'

// ✅ Reset every shared seam. Cheap insurance.
afterEach(() => {
  cache.clear();
  localStorage.clear();
  vi.restoreAllMocks(); // un-spies; `clearMocks` alone does NOT
});
```

Make flake *visible* rather than tolerated:

```js
// vitest.config.ts — random order surfaces hidden coupling before CI does.
export default { test: { sequence: { shuffle: true } } };
```

```js
// playwright.config.ts — retries on CI only, so local red stays honest.
export default {
  retries: process.env.CI ? 2 : 0,
  use: { trace: 'on-first-retry' }, // ← the actual payoff: a trace of the flaky run
};
```

## ⚖️ Trade-offs

- **Retries buy CI throughput and cost you truth.** They're defensible with two conditions: retries only on CI, and flaky results *reported and triaged*, not silently swallowed. Retries with no dashboard is just a slower way to ship the bug.
- **Quarantine beats deleting, and beats ignoring.** Move the flaky test out of the blocking suite, file a ticket, keep it running. A permanently-skipped test is dead code that lies about your coverage.
- **When determinism isn't worth it:** a true third-party integration smoke test (does the real payment sandbox still respond?) is *intentionally* nondeterministic. Run it on a schedule, not on every PR — don't let it gate merges.
- **Over-mocking to kill flake overshoots.** Mock the network and the clock. Mock your own components to stop a race and you've deleted the coverage you were trying to protect.

## 💣 Gotchas interviewers probe

- **"It's just flaky, re-run it."** The answer that ends the interview. Flake is a hypothesis about a real race — investigate it before you retry it.
- **`waitFor` with a sleep inside, or any bare `sleep`.** Waiting on duration instead of condition. Also: `waitFor` must contain an *assertion*, not a side effect — putting `userEvent.click` inside `waitFor` re-fires it on every poll.
- **Fake timers + `await` deadlock.** With fake timers installed, real promises that depend on timers never settle unless you advance the clock — `await vi.advanceTimersByTimeAsync(1000)`. Candidates hit this and conclude "async tests are cursed".
- **Forgetting `useRealTimers()` / `restoreAllMocks()`** — leaks across files and produces flake in a *different* test than the broken one. The hardest kind to trace.
- **`getBy*` never waits; `findBy*` does; `queryBy*` returns null.** Reaching for `getBy` after an async action is the #1 source of RTL flake. Conversely, `waitFor(() => expect(queryByText(x)).toBeNull())` passes instantly and vacuously if the element was *never* there.
- **Animations and `act()` warnings are flake precursors.** A state update after the test ends means unfinished async work — the warning is telling you there's a race, not nagging you.
- **Parallel workers sharing a database or port.** Passes at `--workers=1`, fails at 4. Isolate per-worker fixtures.

## 🎯 Say this in the interview

> "I treat a flaky test as a real bug report, not noise — it means the test has a hidden input, and there are only a handful of candidates: time, test order, an async race, the network, or animation. So I go looking for which one rather than re-running. The most common by far is asserting before the app's async work finished — the fix is waiting on a signal, like RTL's `findBy` or a Playwright locator that auto-waits, never a fixed sleep, because a sleep is a bet on machine speed that's both too slow and too short. For time I freeze the clock; for order I reset shared state and actually run the suite shuffled, because if random order breaks me I already have coupling. I'll use retries on CI, but only with traces on first retry and the flake reported — retries are a way to *see* flake, not to hide it."

## 🔗 Go deeper

- [Playwright — Test retries](https://playwright.dev/docs/test-retries) — retries, flaky reporting, and why traces on first retry are the real feature.
- [Playwright — Auto-waiting](https://playwright.dev/docs/actionability) — the actionability checks that remove entire classes of flake.
- [Testing Library — Async methods](https://testing-library.com/docs/dom-testing-library/api-async/) — `findBy` vs `waitFor`, and the polling model.
- [Martin Fowler — Eradicating Non-Determinism in Tests](https://martinfowler.com/articles/nonDeterminism.html) — the definitive taxonomy of flake causes.
- [Google Testing Blog — Flaky Tests at Google](https://testing.googleblog.com/2016/05/flaky-tests-at-google-and-how-we.html) — what flake costs at scale, with real numbers.
