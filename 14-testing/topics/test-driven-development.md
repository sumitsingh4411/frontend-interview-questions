<div align="center">

# Test-driven development

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#tdd`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — TDD is **red → green → refactor**: write a failing test that describes the behaviour you want, make it pass with the least code, then clean up under a green safety net. It's not a testing technique — it's a **design technique** whose test suite is a by-product, and that reframing is the entire interview answer.

---

## 🧠 Mental model

Most people describe TDD as "write tests first." That's the mechanic, not the point. The point is that **writing the test first forces you to be the first consumer of your own API**, before you've sunk any cost into an implementation. Code that's hard to test is almost always code with a design problem — hidden dependencies, too many responsibilities, a constructor that reaches out to the network. TDD makes that pain arrive *early and cheaply*, when the fix is renaming a function instead of unpicking a module.

The loop is deliberately tiny:

```
  ┌──────────────────────────────────────────────┐
  │  🔴 RED      write a failing test            │
  │              (it MUST fail — see it fail)    │
  │  🟢 GREEN    simplest code that passes       │
  │              (ugly is allowed here)          │
  │  🔵 REFACTOR clean up, tests stay green      │
  └──────────────────────────────────────────────┘
        ↑____________ minutes, not hours ________│
```

The refactor step is the one people skip, and skipping it is what turns TDD into "I wrote some tests and now I have bad code with high coverage."

## ⚙️ How it actually works

**Why the test must fail first.** A test you never watched fail is a test you have no evidence works. The classic failure: a typo'd `describe.skip`, a missing `await`, or an assertion inside a callback that never runs — all of which produce a green test that asserts *nothing*. The red step is how you test your test.

**Why "simplest code that passes" is not a joke.** Kent Beck's fake-it-till-you-make-it — literally `return 42` — is a real technique. It proves the test is wired to the right thing and forces you to write a *second* test to justify generalising. The tests drive the generality; you don't guess at it up front. This is where TDD directly attacks speculative abstraction.

**Inside-out vs outside-in.** This distinction is a genuine senior signal:

| | Starts at | Uses | Risk |
|---|---|---|---|
| **Inside-out** (Detroit/classicist) | the smallest unit | real collaborators | you build units that don't assemble |
| **Outside-in** (London/mockist) | the user-facing behaviour | mocks for collaborators | mock-heavy tests coupled to structure |

On the frontend, outside-in with **very few mocks** is the pragmatic sweet spot: start with a failing RTL test that says "user clicks Add, badge shows 1", and let it pull the components and state into existence. You get the trophy's fat integration middle for free, because the tests you wrote first were behaviour tests.

**TDD is not "100% TDD".** In real work it shines for pure logic, bug fixes, and well-specified behaviour, and it's actively bad for exploratory UI. Nobody test-drives a hover animation.

## 💻 Code

Bug-fix TDD — the highest-ROI use of the technique, and the one to cite in an interview:

```js
// 🔴 RED — reproduce the bug as a test BEFORE touching the code.
// This test is now a permanent regression guard.
test('formats zero as "0", not "-"', () => {
  expect(formatCurrency(0)).toBe('$0.00'); // fails: returns '-'
});

// 🟢 GREEN — the smallest honest fix.
export function formatCurrency(n) {
  if (n == null) return '-';   // was `if (!n)` — 0 was falsy. That was the bug.
  return `$${n.toFixed(2)}`;
}
```

The triangulation loop — one test forces a constant, the second forces the real logic:

```js
// 1st test: fake it. Passing with `return 1` is legitimate here.
expect(fib(1)).toBe(1);

// 2nd test: the constant can no longer survive. Now you're forced to generalise.
expect(fib(2)).toBe(1);
expect(fib(6)).toBe(8);
```

Outside-in on a component — the test exists before the component does:

```jsx
// 🔴 RED — describes user-visible behaviour. <SearchBox> doesn't exist yet.
test('shows results after typing', async () => {
  render(<SearchBox onSearch={async () => [{ id: 1, title: 'Ada' }]} />);
  await userEvent.type(screen.getByRole('searchbox'), 'ada');
  expect(await screen.findByText('Ada')).toBeInTheDocument();
});
// The test just specified the props API and the a11y roles — before any markup.
```

## ⚖️ Trade-offs

- **TDD buys design feedback and pays in upfront speed.** On a well-understood problem that trade is excellent. On an unknown one — a new API you're still discovering, a layout you're still designing — the test is a guess, and you'll rewrite it three times. Spike first with throwaway code, *then* TDD the real thing.
- **When NOT to use it:** exploratory prototypes, visual/CSS work, thin glue with no logic, and generated code. Test-driving `<div className="wrapper">` is theatre.
- **Test-first ≠ TDD.** Writing all the tests up front, then all the code, loses the entire feedback loop. The value is in the *cycle length* — minutes.
- **The tests are a by-product, not the deliverable.** If you'd throw the suite away and lose nothing, you weren't doing TDD, you were doing coverage.

## 💣 Gotchas interviewers probe

- **"Did you watch it fail?"** Candidates who skip red can't explain how they'd catch a test that passes vacuously. This is the single sharpest probe in this topic.
- **The refactor step is not optional.** Red-green-red-green with no refactor is how TDD gets its bad reputation. The green bar is the *permission* to refactor, and it's the whole payoff.
- **TDD does not mean unit tests.** The most common misconception. The cycle is indifferent to altitude — you can drive an integration test or an E2E test exactly the same way. Kent Beck's original book never says "unit".
- **Mockist TDD couples you to structure.** If your outside-in test mocks every collaborator, your tests break on every refactor — the exact opposite of what TDD promises. Mock the seams (network, clock), not your own modules.
- **TDD doesn't produce good architecture on its own.** It surfaces *local* design pressure — it won't tell you your state management choice was wrong. Claiming it replaces design is a red flag.
- **Coverage is a by-product, not a goal.** TDD naturally lands near-total coverage of the code you drove; chasing the number afterwards produces assertions nobody needs.

## 🎯 Say this in the interview

> "TDD is red-green-refactor, but I'd frame it as a design technique rather than a testing one — writing the test first makes me the first consumer of my own API, so bad design shows up as awkward setup while it's still cheap to change. Watching the test actually fail matters, because that's my only evidence the test works at all; a test that never went red might be asserting nothing. Then the simplest code that passes, then refactor under a green bar — and the refactor step is the payoff, not an optional extra. Where I get the most value is bug fixes: I reproduce the bug as a failing test first, so the fix is verified and I've got a permanent regression guard. Where I don't use it is exploratory or visual work — I'll spike first, then test-drive the real implementation."

## 🔗 Go deeper

- [Martin Fowler — Test Driven Development](https://martinfowler.com/bliki/TestDrivenDevelopment.html) — the crisp canonical definition, plus the design-not-testing framing.
- [Martin Fowler — Mocks Aren't Stubs](https://martinfowler.com/articles/mocksArentStubs.html) — the classicist vs mockist split that decides how your TDD suite ages.
- [Kent Beck — Canon TDD](https://tidyfirst.substack.com/p/canon-tdd) — Beck restating the actual loop, correcting decades of misreadings.
- [Kent C. Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests) — where TDD should aim on a frontend.
