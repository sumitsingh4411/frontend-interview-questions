<div align="center">

# What to test (and what not to)

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#strategy`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Test **behaviour the user can observe**, through the public interface, and mock only the true system boundary. Don't test implementation details — state variable names, private methods, whether a function was *called* — because those tests break on refactors that changed nothing the user sees.

---

## 🧠 Mental model

Every test sits somewhere on a spectrum between two failure modes:

```
  tests coupled to CODE  ←─────────────────────→  tests coupled to BEHAVIOUR
  (implementation details)                        (user-observable contract)

  ❌ false failures on refactor          ✅ survive refactors
  ❌ green while feature is broken        ✅ fail when the feature breaks
```

A **false negative** is a test that goes red when nothing actually broke (you renamed a hook, reshaped internal state). A **false positive** is a test that stays green while the feature is broken (you asserted a mock was called, but the mock's real counterpart is wired up wrong). Implementation-detail tests give you *both*. The fix is the same guiding principle every time: **the more your tests resemble the way the software is used, the more confidence they give you.**

## ⚙️ How it actually works

The practical test is: **would a user or a caller of this module notice if this changed?** If yes, it's behaviour — test it. If no, it's an implementation detail — leave it alone.

| Test this (observable contract) | Don't test this (implementation detail) |
|---|---|
| What renders for a given prop/state | The name of a `useState` variable |
| What happens when the user clicks/types | Whether an internal helper was called |
| The returned value / thrown error of a fn | Private methods, module-internal state |
| Accessible output (roles, labels, text) | Exact DOM structure / class names |
| Error and empty and loading states | The framework's own behaviour |

**What to mock is the other half of the question.** Mock at the *architectural boundary* — the network, the clock, `crypto.randomUUID`, `localStorage` — the things that are slow, non-deterministic, or have side effects you can't run in CI. Do **not** mock your own modules to make a component testable; that's a smell that you're testing the seam instead of the behaviour. Mock the network with MSW so the component still exercises its real fetch-parse-render path; only the wire is faked.

Two more heuristics that separate senior from junior test suites:

- **Test the risky and the reused, skip the trivial.** A currency formatter used in 40 places and a checkout reducer earn tests. A one-line prop pass-through does not. Every test is code you maintain forever — spend the budget where a bug would actually hurt.
- **Cover the states, not the lines.** Loading, empty, error, success, and boundary inputs (`0`, `''`, `null`, huge lists) are where real bugs hide — not the happy path you already eyeballed.

## 💻 Code

```jsx
// ❌ Testing implementation details — brittle and low-confidence
test('sets loading state', () => {
  const { result } = renderHook(() => useSearch());
  act(() => result.current.search('x'));
  expect(result.current.isLoading).toBe(true); // internal flag, not user-facing
});
// This goes red the day you rename `isLoading` → `pending`, even though
// the UI is identical. And it never proves a spinner ever appears.

// ✅ Testing behaviour — resilient and meaningful
test('shows a spinner while searching, then results', async () => {
  render(<Search />);
  await userEvent.type(screen.getByRole('searchbox'), 'shoes');
  expect(screen.getByRole('status')).toBeInTheDocument();          // user sees loading
  expect(await screen.findByRole('list')).toHaveTextContent(/shoe/i); // then results
});
```

```js
// ❌ Asserting a mock was called proves nothing about the outcome
expect(trackEvent).toHaveBeenCalledWith('add_to_cart'); // it fired… and then?

// ✅ Assert the observable effect instead
expect(screen.getByRole('status')).toHaveTextContent('Added to cart');
```

`toHaveBeenCalled` has *one* legitimate home: verifying a **side-effecting boundary** you deliberately mocked (an analytics beacon, an API POST) whose effect is genuinely invisible in the UI. Everywhere else, assert the result.

## ⚖️ Trade-offs

- **"Behaviour only" has a cost:** behavioural tests are slower to write and slower to run than a unit test of a pure function, and when they fail the failure can be less pin-pointed. Worth it — a failing behavioural test means something *real* broke — but don't pretend it's free.
- **When implementation tests are legitimate:** a performance-critical internal (memoisation actually memoises, a cache evicts correctly) is a case where the "implementation" *is* the contract. Test it, but name it honestly.
- **Don't test the framework.** React re-renders correctly; `useState` works. Testing that you can call `setState` is testing React's maintainers' job, not yours.

## 💣 Gotchas interviewers probe

- **"Assert the mock was called" is the classic anti-pattern.** It's a false-positive factory: the mock is called, the test is green, and the real integration is broken. Assert the *effect*, not the call.
- **Snapshotting a whole component tree is testing implementation detail in disguise.** It fails on every innocuous markup change and asserts nothing about correctness.
- **Chasing coverage forces bad tests.** To hit an untested branch you'll write a test that pokes internals. Coverage should be a *byproduct* of testing behaviour, never the target.
- **Testing the happy path only.** The interviewer wants to hear "error, empty, loading, boundary." That's where production breaks.
- **Over-mocking.** If half your test is `jest.mock` calls, you've replaced the thing you meant to test with a fiction, and green means nothing.

## 🎯 Say this in the interview

> "My rule is: test behaviour the user or caller can observe, and mock only the real system boundary. Concretely, I ask 'would someone notice if this changed?' — if yes it's behaviour worth a test, if no it's an implementation detail like a state variable name, and testing it just creates false failures on refactor. The anti-pattern I actively avoid is asserting a mock was called, because that's green even when the real integration is broken; I assert the visible effect instead. I mock at the architecture boundary — network via MSW, the clock, randomness — never my own modules. And I prioritise by risk: the reused formatter and the checkout reducer get tests, the trivial pass-through doesn't, and I always cover the loading, empty, and error states because that's where real bugs live, not the happy path I already looked at."

## 🔗 Go deeper

- [Kent C. Dodds — Write tests. Not too many. Mostly integration.](https://kentcdodds.com/blog/write-tests) — the priorities argument in full.
- [Kent C. Dodds — Testing Implementation Details](https://kentcdodds.com/blog/testing-implementation-details) — why coupling to internals gives you both false positives and false negatives.
- [Testing Library — Guiding Principles](https://testing-library.com/docs/guiding-principles/) — the "resembles how it's used" north star.
- [MSW — Mock Service Worker](https://mswjs.io/docs/) — mocking the network boundary without mocking your own code.
