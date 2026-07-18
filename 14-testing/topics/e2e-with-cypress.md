<div align="center">

# E2E with Cypress

<sub>🧪 Testing · 🟡 Medium · ⏱ 1h · `#e2e` `#cypress`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Cypress runs **inside the browser alongside your app** (not driving it remotely), which gives it a killer DX — time-travel debugging, automatic retry-ability — at the cost of one architectural constraint: **no `async/await`**. Commands are queued and chained, and `cy.get(...)` retries until it passes.

---

## 🧠 Mental model

Most E2E tools drive the browser from the outside via a wire protocol. Cypress **executes in the same run loop as your app** — its commands run in the browser, next to the code under test. That's the source of both its best feature (you can inspect real objects, freeze on any step, see exactly what the DOM looked like) and its most confusing one: **Cypress commands are not promises.** They're queued.

When you write `cy.get('.btn').click()`, nothing runs immediately. You're *enqueuing* commands into a chain that Cypress executes asynchronously, in order, later. This is why `await` does nothing useful and why you can't store `cy.get(...)` in a variable and use it like a value. Internalize "commands are a queue, not promises" and 90% of Cypress confusion evaporates.

The second pillar: **retry-ability**. `cy.get('.status')` doesn't fail if the element isn't there yet — it re-queries until the element exists *and* the assertion chained after it passes, up to the default 4s timeout. Like Playwright, this is the anti-flake mechanism.

## ⚙️ How it actually works

**The command queue.** Each `cy.*` call returns a chainable, not a value. Cypress runs them serially, waiting for each to resolve before starting the next. Assertions with `.should()` are **retried together with the preceding query** — `cy.get('.count').should('have.text', '3')` re-runs the whole `get` until the text is 3 or it times out. That's retry-ability in one line.

**Yielded subjects.** To act on a command's result you use `.then()`: `cy.get('.item').then(($el) => { ... })`. The `$el` is a jQuery-wrapped element. You reach for `.then()` only when you need the actual value — most of the time chaining `.should()` is better because `.then()` runs *once* and defeats retry-ability.

**In-browser architecture consequences.** Because Cypress lives in the browser, it historically ran **one browser, one tab, same-origin** — cross-origin navigation was a wall (now eased by `cy.origin()`), multi-tab is unsupported, and it's Chromium/Firefox/WebKit but never truly "all browsers at scale" the way remote drivers claim. The trade is DX: `cy.intercept()` stubs network with a spy you can assert on, and the Test Runner shows every command with a DOM snapshot you can hover to time-travel.

**Automatic waiting, no sleeps.** Like Playwright, fixed `cy.wait(3000)` is an anti-pattern. Wait on an *aliased request* instead: `cy.intercept('POST', '/api/save').as('save'); ...; cy.wait('@save')` blocks until that specific request completes — deterministic, not guessed.

## 💻 Code

```js
describe('login', () => {
  it('logs in and lands on dashboard', () => {
    // Stub the network so the test doesn't depend on a live backend.
    cy.intercept('POST', '/api/login', { fixture: 'user.json' }).as('login');

    cy.visit('/login');
    cy.get('[data-cy=email]').type('a@b.com');
    cy.get('[data-cy=password]').type('hunter2');
    cy.get('[data-cy=submit]').click();

    // ✅ Deterministic wait on the real request — never a fixed sleep.
    cy.wait('@login');

    // ✅ get + should retries the query until the assertion passes.
    cy.get('[data-cy=greeting]').should('contain', 'Welcome');
    cy.location('pathname').should('eq', '/dashboard');
  });
});
```

The two most common beginner mistakes:

```js
// ❌ Commands aren't promises — await yields undefined, breaks nothing useful.
const el = await cy.get('.btn');       // el is NOT the element

// ❌ Storing a subject in a variable — stale, and skips retry-ability.
const btn = cy.get('.btn');
btn.click();                            // fragile

// ✅ Chain, or use an alias if you need it later.
cy.get('.btn').as('cta');
cy.get('@cta').click();

// ✅ Need the raw value? .then() — but know it runs ONCE (no retry).
cy.get('.count').then(($c) => expect($c.text()).to.eq('3'));
```

## ⚖️ Trade-offs

- **Cypress vs Playwright is the real interview question.** Cypress: unbeatable interactive debugging, gentler onboarding, in-browser realism. Playwright: true parallelism, multiple tabs/origins/contexts natively, faster CI, cross-browser including WebKit. For a greenfield suite in 2025 most teams pick Playwright for scale; Cypress still wins on developer happiness and component-testing ergonomics.
- **The in-browser model is a ceiling.** No native multi-tab, historically painful cross-origin (`cy.origin()` helps but is clunky), and parallelism costs money via Cypress Cloud rather than being free across workers.
- **`.then()` defeats retry-ability.** Every `.then()` is a point where you've dropped back to a one-shot read. Overusing it reintroduces the flake retry-ability was meant to remove.
- **When NOT to use it:** anything needing multi-tab flows, broad WebKit/Safari coverage, or massive free parallelism — reach for Playwright instead.

## 💣 Gotchas interviewers probe

- **"Cypress commands are asynchronous but not promises."** They're a queued chain. `await` and `.then()`-chaining like a Promise both misunderstand the model. This is the single most-probed Cypress concept.
- **`cy.wait(3000)` vs `cy.wait('@alias')`.** The first is a flaky fixed sleep; the second waits on a specific intercepted request and is deterministic. Knowing to alias-and-wait is the senior signal.
- **`data-cy` / `data-testid` over CSS or text selectors.** Selecting by class or copy couples tests to styling and wording that change constantly. Dedicated test attributes are the documented best practice.
- **Retry-ability only covers the *last* command + its assertions.** A stale subject captured earlier won't retry. Keep the query and the `should()` in one chain.
- **State bleed between tests.** Cypress clears cookies/storage between tests by default, but app-level state (a seeded DB row) is yours to reset. Programmatic setup via `cy.request()` beats clicking through the UI to set up state.

## 🎯 Say this in the interview

> "The thing to understand about Cypress is that it runs inside the browser next to your app, and its commands are a queued chain, not promises — so `await` doesn't apply, and you chain with `.should()` for assertions or `.then()` when you genuinely need the value. Its anti-flake mechanism is retry-ability: `cy.get(...).should(...)` re-runs the query until the assertion passes or it times out, so I never write fixed `cy.wait(3000)` sleeps — I intercept the request, alias it, and `cy.wait('@alias')` for a deterministic wait. I select with `data-cy` attributes so tests don't break on styling or copy changes. Its superpower is interactive debugging — time-travel snapshots for every command. Where I'd pick Playwright instead is when I need real parallelism, multiple tabs or origins, or WebKit coverage."

## 🔗 Go deeper

- [Cypress — Why Cypress](https://docs.cypress.io/guides/overview/why-cypress) — the architecture and what it's for.
- [Cypress — Introduction to Cypress](https://docs.cypress.io/guides/core-concepts/introduction-to-cypress) — the command queue, retry-ability, subjects. Essential reading.
- [Cypress — Best Practices](https://docs.cypress.io/guides/references/best-practices) — selectors, state setup, and the anti-patterns to avoid.
- [Cypress — Network Requests](https://docs.cypress.io/guides/guides/network-requests) — `cy.intercept`, aliasing, and stubbing.
