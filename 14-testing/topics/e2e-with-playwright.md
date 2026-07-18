<div align="center">

# E2E with Playwright

<sub>🧪 Testing · 🔴 Hard · ⏱ 1.5h · `#e2e` `#playwright`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Playwright drives a **real browser over the DevTools/CDP protocol**, and its headline feature isn't the API — it's **auto-waiting on web-first assertions**, which is what actually kills flake. Master locators, `expect().toBeVisible()`, and trace-on-retry and you've solved 80% of E2E pain.

---

## 🧠 Mental model

An E2E test is a **hostile user** poking your fully-assembled app through a real browser — no mocked components, no shallow rendering, just the shipped bundle talking to (usually) a real or seeded backend. It's the only layer that proves the pieces actually fit together.

The thing that makes Playwright different from Selenium-era tools: **every action and assertion auto-retries until the app is ready, or the timeout expires.** You don't `sleep`. You don't poll. `await expect(locator).toBeVisible()` re-evaluates on a loop until it's true. That single design decision is why Playwright tests are dramatically less flaky — the framework encodes "wait for the app to settle" instead of making you guess a magic number.

The second idea: a **locator is a lazy query, not an element**. `page.getByRole('button')` doesn't touch the DOM when you create it — it resolves at the moment you act on it, so it survives re-renders that would leave a stale Selenium `WebElement` pointing at garbage.

## ⚙️ How it actually works

**Auto-waiting.** Before any action (`.click()`, `.fill()`), Playwright runs **actionability checks**: the element must be attached, visible, stable (not animating), enabled, and receiving pointer events (nothing overlaying it). It retries these until they pass. This is why you rarely need explicit waits — and why `waitForTimeout(3000)` is an anti-pattern that should fail code review.

**Web-first assertions.** `expect(locator).toHaveText('Done')` polls the DOM until the text matches or ~5s elapses. Contrast with `expect(await locator.textContent()).toBe('Done')` — that reads **once**, immediately, and flakes the instant there's async work. The `await` placement is the tell: assert on the *locator*, not on a resolved value.

**Locator priority.** Use user-facing, accessibility-first queries: `getByRole`, `getByLabel`, `getByText`, `getByTestId`. These are resilient to markup churn and double as accessibility smoke tests — if `getByRole('button', { name: 'Save' })` can't find it, a screen reader can't either.

**Isolation via browser contexts.** Each test gets a fresh `BrowserContext` — its own cookies, storage, cache — but shares the browser *process*, so it's near-instant, unlike spawning a new browser. Parallelism runs across worker processes.

**Trace viewer.** `trace: 'on-first-retry'` captures a DOM snapshot, screenshot, network log, and console for every step. When CI fails, you open the trace and *time-travel* through the run. This is the single biggest debugging upgrade over legacy E2E.

## 💻 Code

```ts
import { test, expect } from '@playwright/test';

test('checkout flow', async ({ page }) => {
  await page.goto('/cart');

  // ❌ Reads the DOM ONCE — flakes if the button renders a tick late.
  expect(await page.locator('.checkout').isVisible()).toBe(true);

  // ✅ Role-based locator + web-first assertion: auto-waits, retries.
  await page.getByRole('button', { name: 'Checkout' }).click();

  // ❌ Guessing at timing. Slow when it passes, flaky when it doesn't.
  await page.waitForTimeout(2000);

  // ✅ Assert the end state; Playwright waits for it to become true.
  await expect(page.getByRole('heading', { name: 'Order confirmed' }))
    .toBeVisible();
  await expect(page).toHaveURL(/\/orders\/\d+/);
});
```

Network stubbing without a mock server — intercept at the browser boundary:

```ts
test('handles API failure', async ({ page }) => {
  await page.route('**/api/checkout', (route) =>
    route.fulfill({ status: 500, body: 'boom' })
  );
  await page.goto('/cart');
  await page.getByRole('button', { name: 'Checkout' }).click();
  await expect(page.getByRole('alert')).toContainText('try again');
});
```

Config that makes CI trustworthy:

```ts
// playwright.config.ts
export default {
  retries: process.env.CI ? 2 : 0,   // absorb genuine infra blips, not real bugs
  use: { trace: 'on-first-retry' },  // debuggable failures, zero cost on green runs
  webServer: { command: 'npm run start', url: 'http://localhost:3000' },
};
```

## ⚖️ Trade-offs

- **E2E is the slowest, most expensive, flakiest layer — so own few of them.** They're for critical user journeys (signup, checkout, the one flow that loses money if it breaks), not for exhaustively covering every branch. Cover branches in unit/integration tests; use E2E to prove the wiring.
- **`retries: 2` is a double-edged sword.** It hides genuine infra flake, which is good — but it also masks a *real* 1-in-3 race condition in your app. Treat any test that only passes on retry as a bug to investigate, not a win.
- **Real backend vs mocked.** A real (seeded) backend catches contract drift Playwright's `route()` mocks never will; mocked backends are faster and deterministic but let the frontend and backend silently diverge. Most teams want a thin layer of real-backend smoke tests plus mocked tests for edge cases.
- **When NOT to use it:** don't reach for Playwright to test a date-formatting util or a reducer. If it doesn't cross a component boundary or hit the network, it belongs in a faster layer.

## 💣 Gotchas interviewers probe

- **`await page.waitForTimeout()` is the flake smell.** Fixed sleeps are never the answer — if you're tempted, you've misunderstood auto-waiting. Assert on the state you're waiting for instead.
- **Assert on the locator, not a resolved value.** `expect(locator).toHaveText(x)` retries; `expect(await locator.textContent()).toBe(x)` doesn't. Candidates who put the `await` in the wrong place ship flaky suites.
- **`getByText` matches substrings and is case-insensitive by default** — `getByText('Save')` also matches "Save changes". Use `{ exact: true }` or a role query when precision matters.
- **Tests must be independent.** Sharing state (a user created in test A, consumed in test B) breaks the moment you enable parallelism or sharding. Each test seeds its own world.
- **`networkidle` is discouraged.** Waiting for zero network requests is brittle on apps with polling/analytics/websockets. Wait for a *visible outcome*, not network silence.
- **Auto-waiting doesn't wait for *your* app logic.** It waits for the element to be actionable, not for your debounced search to fire. You still assert on the resulting UI state.

## 🎯 Say this in the interview

> "Playwright's core advantage is auto-waiting: before every action it runs actionability checks — visible, stable, enabled, not occluded — and its `expect` assertions poll the DOM until they pass. That's what removes flake, so I never write fixed `waitForTimeout` sleeps; I assert on the end state and let Playwright wait for it. I lead with role-based locators like `getByRole` because they're resilient to markup changes and double as accessibility checks. For debugging I turn on trace-on-first-retry so a CI failure gives me a full time-travel snapshot instead of a stack trace. Philosophically I keep E2E tests few and reserved for critical journeys — they're the slowest, flakiest layer, so they prove the pieces integrate, while branch coverage lives in faster unit and integration tests."

## 🔗 Go deeper

- [Playwright — Introduction](https://playwright.dev/docs/intro) — install, first test, the mental model.
- [Playwright — Auto-waiting](https://playwright.dev/docs/actionability) — the exact actionability checks behind every action.
- [Playwright — Locators](https://playwright.dev/docs/locators) — the priority order and why role-based queries win.
- [Playwright — Trace viewer](https://playwright.dev/docs/trace-viewer) — the time-travel debugging that changes how you triage CI.
