<div align="center">

# The testing pyramid / trophy

<sub>🧪 Testing · 🟢 Easy · ⏱ 30m · `#strategy`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The pyramid says "mostly unit, a few E2E" and optimises for *speed*. The **trophy** re-optimises for *confidence per test*: a static base (types + lint), a thin unit layer, a **fat integration middle**, and a few E2E on top — because on the frontend the bugs live in the *wiring*, not the units.

---

## 🧠 Mental model

Both shapes answer one question: **where do you spend your finite testing budget?** The classic pyramid answers with *cost and speed* — unit tests are cheap and fast, so write thousands; E2E is slow and flaky, so write a handful.

The trophy answers with a different metric: **how much confidence does each test buy per dollar of maintenance?** For a UI, a unit test of a single function rarely fails the way production fails. Production fails when a component, its state, the router, and the DOM are *assembled* — and that assembly is exactly what unit tests mock away.

```
   PYRAMID (speed-first)          TROPHY (confidence-first)
        /\   E2E                      ___   E2E
       /  \                          (   )  Integration ← widest
      /----\ Integration             |   |  Unit
     /      \                        |___|
    /--------\ Unit ← widest          ▔▔▔   Static (types + lint)
```

The one-line creed, from Guillermo Rauch: **"Write tests. Not too many. Mostly integration."**

## ⚙️ How it actually works

The layers, and what each actually protects you from:

| Layer | Tools | Catches | Cost |
|---|---|---|---|
| **Static** | TypeScript, ESLint | typos, wrong shapes, undefined access — *before* runtime | ~free, always on |
| **Unit** | Jest/Vitest | pure logic: reducers, formatters, algorithms | fast, low value for UI glue |
| **Integration** | RTL + Jest/Vitest | a feature: components + state + events, DOM as the seam | the sweet spot |
| **E2E** | Playwright, Cypress | the real app in a real browser: routing, network, auth | slow, flaky, expensive |

The trophy's key insight is that **static analysis is a testing layer**. TypeScript eliminates a whole category of tests you'd otherwise write by hand (`is this prop defined?`), so it belongs *in the trophy as its foundation* — not off to the side.

"Integration" here doesn't mean spinning up a backend. It means **rendering a real component tree and driving it like a user** — clicking, typing, asserting on visible output — while stubbing only the true system boundary (the network). You get the wiring coverage of E2E at a fraction of the runtime, because there's no browser, no server, no network round-trip.

## 💻 Code

The same "add to cart" feature at three altitudes:

```js
// UNIT — cheap, but proves almost nothing about the feature working
expect(cartReducer([], { type: 'add', item })).toEqual([item]); // ✅ logic only

// INTEGRATION — the trophy's fat middle: real component, real user actions
test('adding an item updates the cart badge', async () => {
  render(<ProductPage product={shoe} />);          // real tree, real state
  await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
  expect(screen.getByRole('status')).toHaveTextContent('1'); // user-visible truth
});

// E2E — one happy path through the deployed app, real browser + network
test('checkout', async ({ page }) => {
  await page.goto('/product/shoe');
  await page.getByRole('button', { name: /add to cart/i }).click();
  await page.getByRole('link', { name: /checkout/i }).click();
  await expect(page).toHaveURL(/\/checkout/);
});
```

Notice the integration test found the *same* confidence the E2E one does (button wired → state updated → UI reflects it) without a browser or a server.

## ⚖️ Trade-offs

- **The pyramid isn't wrong — it's from a different world.** It was formalised for service backends where a "unit" *is* a meaningful contract. On the UI, the meaningful contract is user-visible behaviour, which is an integration concern.
- **Don't over-index on E2E either.** A tempting failure mode is "just test everything in Cypress." E2E is slow, environment-dependent, and the leading source of flake. Keep it to critical revenue paths (login, checkout, publish) and let integration carry the volume.
- **When the pyramid still fits:** a library of pure functions (date math, a parser, a state machine) is genuinely unit-shaped — mostly-unit is correct there. Match the shape to *what your code is*, not to a slogan.

## 💣 Gotchas interviewers probe

- **"More tests = more confidence" is false.** Confidence comes from tests that *resemble how the software is used*. A thousand mocked unit tests can be green while the app is broken, because every seam that could break was mocked.
- **"100% coverage" is a vanity metric.** Coverage measures lines *executed*, not behaviour *asserted*. You can hit 100% and assert nothing meaningful. Interviewers want to hear you talk about confidence, not percentages.
- **Static analysis counts as testing.** Candidates who forget TypeScript/ESLint as the trophy's *base* miss the whole point — it's the cheapest, always-on test you own.
- **Integration ≠ needing a backend.** The commonest misconception. You mock the *network boundary* (with MSW), render everything else for real.
- **The shape is a heuristic, not a law.** A CLI tool, a design-system component, and a data pipeline each want different shapes.

## 🎯 Say this in the interview

> "The pyramid optimises for speed — lots of fast unit tests, few slow E2E. For a frontend I prefer the testing trophy, which optimises for confidence per test. Its base is static analysis, TypeScript and lint, because that eliminates a whole class of bugs for free. Then a thin unit layer for pure logic, a *fat* integration layer, and a few E2E on top. The reasoning is that UI bugs almost always live in the wiring — component plus state plus events plus DOM — and unit tests mock exactly that wiring away. An integration test renders the real component tree and drives it like a user, mocking only the network, so it catches the bugs that actually ship, at a fraction of E2E's runtime and flake. Rauch's line sums it up: write tests, not too many, mostly integration."

## 🔗 Go deeper

- [Kent C. Dodds — The Testing Trophy](https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications) — the canonical framing and the confidence-per-test argument.
- [Kent C. Dodds — Static vs Unit vs Integration vs E2E](https://kentcdodds.com/blog/static-vs-unit-vs-integration-vs-e2e-testing) — what each layer is actually for.
- [Martin Fowler — The Practical Test Pyramid](https://martinfowler.com/articles/practical-test-pyramid.html) — the original pyramid, argued well; know what the trophy is reacting to.
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/) — "the more your tests resemble the way your software is used…"
