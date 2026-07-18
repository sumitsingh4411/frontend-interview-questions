<div align="center">

# Testing React

<sub>⚛️ React · 🟡 Medium · ⏱ 1h · `#testing`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Test **behaviour, not implementation.** React Testing Library's whole philosophy is to query the DOM the way a **user** does — by role, label, and text — and assert on what they see, so tests survive refactors. Testing internal state, instance methods, or "did `useState` get called" is the Enzyme-era anti-pattern that makes tests break on every rename while missing real bugs.

---

## 🧠 Mental model

The guiding principle (Kent C. Dodds': *"the more your tests resemble the way your software is used, the more confidence they give you"*) drives every RTL decision. A user doesn't know your component uses `useReducer`; they see a button labelled "Submit" and expect a result. So your test finds the button by its accessible role and clicks it — exactly what a user (or a screen reader) does.

This makes tests a **refactor safety net**: rename a hook, split a component, swap `useState` for `useReducer` — if the rendered behaviour is unchanged, the tests stay green. Test the *contract* (what renders, what happens on interaction), never the *mechanism*.

## ⚙️ How it actually works

`render()` mounts your component into a **jsdom** container. You then query it, with a deliberate priority order:

| Query | Use for | Behaviour |
|---|---|---|
| `getByRole` | almost everything (buttons, headings, inputs) | throws if absent — enforces a11y |
| `getByLabelText` | form fields | throws if absent |
| `getByText` | non-interactive content | throws if absent |
| `queryBy*` | asserting **absence** | returns `null` |
| `findBy*` | **async** appearance | returns a Promise, retries until found |
| `getByTestId` | last resort only | escape hatch |

**`userEvent` over `fireEvent`.** `fireEvent.click` dispatches a single synthetic event; `userEvent.click` simulates the *full* interaction a real user causes — pointer down/up, focus, the lot — catching bugs `fireEvent` misses. In v14 `userEvent` is **async** — you must `await` it.

**`act()` and async.** React state updates must be wrapped in `act()` so effects flush and the DOM settles; RTL wraps `render` and `userEvent` for you, so an `act(...)` **warning** means an update escaped — usually an un-awaited async update after the test finished. `findBy*` and `waitFor` handle the common async cases.

**Mock at the network, not the module.** Use **MSW** (Mock Service Worker) to intercept requests at the network layer, so your real `fetch`/data-layer code runs and gets tested — far more faithful than stubbing `fetch` or the client module.

## 💻 Code

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('shows an error when submitting an empty form', async () => {
  const user = userEvent.setup();
  render(<SignupForm />);

  // Query like a user: by accessible role/label, not by class or test id.
  await user.click(screen.getByRole('button', { name: /sign up/i }));

  // findBy* retries until the async error appears — no manual waiting.
  expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

  // queryBy* for absence: getBy would throw before we can assert.
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
```

```jsx
// ❌ Testing implementation — breaks on refactor, proves nothing a user cares about.
expect(wrapper.state('count')).toBe(1);
expect(useCounterSpy).toHaveBeenCalled();

// ✅ Testing behaviour — the count the user actually sees.
await user.click(screen.getByRole('button', { name: /increment/i }));
expect(screen.getByText('Count: 1')).toBeInTheDocument();
```

## ⚖️ Trade-offs

- **`getByRole` is slower and stricter — and that's the point.** It forces accessible markup (an unnamed button isn't found), so writing the test surfaces a11y gaps. Reach for `getByTestId` only when no semantic query fits.
- **Integration-flavoured component tests beat shallow unit tests.** Rendering a component with its real children and mocked network catches far more than isolating every unit. Save pure-function unit tests for pure functions.
- **Don't snapshot everything.** Large snapshots rot — they change constantly, get rubber-stamped in review, and assert nothing meaningful. Use focused assertions; reserve snapshots for small, stable output.
- **When NOT to test through the DOM:** genuinely pure logic (formatters, reducers) is cheaper and clearer tested directly as functions.

## 💣 Gotchas interviewers probe

- **`getBy` vs `queryBy` vs `findBy`.** `getBy` throws when missing (use when it must exist), `queryBy` returns `null` (the *only* correct way to assert absence), `findBy` is async and retries (for content that appears later). Mixing these up is the classic tell.
- **`userEvent` is async in v14 — `await` it.** Forgetting the `await` causes flaky tests and `act()` warnings.
- **`act()` warnings mean an update escaped.** Something updated state after the test's synchronous portion — usually an un-awaited promise. Await the assertion (`findBy`/`waitFor`), don't wrap things in `act` by hand.
- **Don't put actions inside `waitFor`.** `waitFor` retries its callback; it's for *assertions* that need to settle, not for clicking. Side effects inside it run repeatedly.
- **Querying by test id first is a smell.** It bypasses accessibility and couples the test to markup. Prefer role/label.
- **Testing hooks in isolation:** use `renderHook` — but if a hook is only meaningful inside a component, test it *through* the component.
- **Cleanup is automatic** in modern RTL; manual `cleanup()` is legacy. Fake timers (`jest.useFakeTimers`) are needed for debounce/throttle tests.

## 🎯 Say this in the interview

> "My rule is test behaviour, not implementation. With React Testing Library I query the DOM the way a user or screen reader does — by role, label, or text — and assert on what's visible, so the tests survive refactors: I can swap `useState` for `useReducer` and if the behaviour's the same, they stay green. I use `userEvent` rather than `fireEvent` because it simulates the full interaction, and I remember it's async in v14 so I await it. I'm deliberate about queries — `getBy` when it must exist, `queryBy` to assert something's absent, `findBy` for async content that appears later — and an `act` warning tells me an update escaped, usually an un-awaited promise, so I await a `findBy` instead. For network I use MSW to intercept at the network layer so my real data-fetching code actually runs. And I avoid big snapshots and test-id queries — they're brittle and prove little."

## 🔗 Go deeper

- [Testing Library — React Testing Library intro](https://testing-library.com/docs/react-testing-library/intro/) — the philosophy and core API.
- [Testing Library — Which query should I use?](https://testing-library.com/docs/queries/about/#priority) — the role/label/text priority order.
- [Kent C. Dodds — Common mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — the `getBy`/`findBy`, `act`, and test-id pitfalls, from the author.
- [MSW — Mock Service Worker](https://mswjs.io/docs/) — mocking at the network boundary instead of stubbing `fetch`.
