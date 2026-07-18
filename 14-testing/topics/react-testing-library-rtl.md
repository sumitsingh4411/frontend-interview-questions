<div align="center">

# React Testing Library (RTL)

<sub>🧪 Testing · 🟡 Medium · ⏱ 1.5h · `#component` `#rtl`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — RTL tests your component the way a user experiences it — by rendering to a DOM and querying by accessible role and text, never by reaching for internal state, props, or instances — so your tests survive refactors and only break when the *behaviour* breaks.

---

## 🧠 Mental model

The guiding principle, straight from the library's author: **"The more your tests resemble the way your software is used, the more confidence they give you."** RTL is opinionated tooling that makes the *right* thing easy and the *wrong* thing hard.

The wrong thing is testing implementation: "does state equal X", "was this prop passed", "is the component in loading mode". Those tests break every time you refactor even though nothing the user sees changed — false negatives that erode trust. RTL deliberately gives you **no API to read state or props.** You get a DOM, and you interrogate it the way a screen reader or a user would: *what text is on screen, what button can I click, what's the value of this labelled input.*

If you can't test what you want through the DOM, that's often a signal the behaviour isn't actually observable to users — and maybe shouldn't be asserted at all.

## ⚙️ How it actually works

**`render()`** mounts your component into a real (JSDOM) `document.body` and returns query functions bound to that container, plus a `container` ref and `unmount`. It auto-cleans between tests when the framework adapter is set up.

**Queries** come in a matrix of two axes: the **verb** (`getBy`, `queryBy`, `findBy`, and their `All` variants) and the **selector** (`ByRole`, `ByLabelText`, `ByText`, `ByTestId`, …). The verb decides throw/return/await behaviour; the selector decides *how* you find it.

| Verb | Not found | Found | Async |
|---|---|---|---|
| `getBy` | throws | element | no |
| `queryBy` | returns `null` | element | no |
| `findBy` | rejects | element | yes (retries) |

Use `getBy` to assert presence, `queryBy` to assert *absence*, `findBy` for things that appear after an async update.

**`userEvent`** simulates real interaction sequences (focus → keydown → input → keyup), not the single synthetic `fireEvent` dispatch — it catches bugs `fireEvent.change` masks. It's async; always `await`.

**Auto-`act()`.** RTL wraps `render` and `userEvent` in React's `act()` so state updates flush before assertions. Warnings about "not wrapped in act" almost always mean an update happened *outside* an awaited interaction.

## 💻 Code

```jsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

test('shows an error when submitting empty', async () => {
  const user = userEvent.setup();
  render(<LoginForm onSubmit={vi.fn()} />);

  // ❌ implementation detail — breaks on any DOM refactor
  // expect(screen.getByTestId('submit-btn')).toBeInTheDocument();

  // ✅ query the way a user (and a screen reader) would
  await user.click(screen.getByRole('button', { name: /log in/i }));

  // error appears asynchronously → findBy retries until it does
  expect(await screen.findByText(/email is required/i)).toBeVisible();
});

test('renders no error initially', () => {
  render(<LoginForm onSubmit={vi.fn()} />);
  // asserting ABSENCE → queryBy (returns null instead of throwing)
  expect(screen.queryByText(/required/i)).not.toBeInTheDocument();
});
```

## ⚖️ Trade-offs

- **Confidence vs granularity.** Testing through the DOM gives refactor-proof, high-confidence tests — but pinpointing *why* something failed can be harder than a white-box unit test that pokes one function. That trade is almost always worth it for UI.
- **Speed vs realism.** JSDOM isn't a browser: no layout, no real paint, `IntersectionObserver`/`ResizeObserver`/`scrollIntoView` need mocking. For genuine visual/layout behaviour you need Playwright/Cypress, not RTL.
- **When NOT to use it:** pure logic (a reducer, a formatter, a hook's math) — test that as a plain function, no render needed. And don't use RTL to snapshot huge trees; that recreates the implementation-coupling RTL exists to avoid.

## 💣 Gotchas interviewers probe

- **`getByTestId` is the last resort, not the first.** Reaching for `data-testid` immediately signals you've skipped the accessibility-first query ladder. Interviewers notice.
- **`fireEvent` vs `userEvent`.** `fireEvent.click` dispatches one event; `userEvent.click` fires the full pointer/focus sequence a real click produces. Prefer `userEvent` — it catches bugs like a disabled button still firing.
- **Not awaiting `userEvent` / `findBy`.** Both are async in modern versions. Forgetting `await` gives "act" warnings and flaky passes.
- **Querying by role requires the accessible name to exist.** `getByRole('button', { name: /save/i })` fails if the button has only an icon and no `aria-label` — which is *correctly* telling you the button is inaccessible.
- **`waitFor` misuse.** Put a single assertion inside `waitFor`; don't fire events inside it (it runs the callback repeatedly). For "element appears", prefer `findBy` over `waitFor(() => getBy...)`.
- **Forgetting cleanup with manual setups.** Without the auto-cleanup adapter, previous renders leak into `screen`, and `getBy` throws "multiple elements found".

## 🎯 Say this in the interview

> "RTL's whole philosophy is that the more a test resembles how the app is actually used, the more confidence it gives. So it deliberately gives you no way to read state or props — you render to a DOM and query by accessible role, label, and text, the way a user or screen reader would. That makes tests survive refactors: they only break when behaviour breaks. I follow the query priority — role and label first, `getByTestId` only as an escape hatch — and I use `userEvent` over `fireEvent` because it simulates the full interaction sequence. The verbs matter too: `getBy` to assert something exists, `queryBy` to assert it's absent because it returns null instead of throwing, and `findBy` for things that appear after an async update. A nice side effect: if I can't query it accessibly, that's usually a real a11y bug, not a testing problem."

## 🔗 Go deeper

- [Testing Library — React intro](https://testing-library.com/docs/react-testing-library/intro/) — setup and the core `render`/`screen` API.
- [Kent C. Dodds — Guiding Principles](https://testing-library.com/docs/guiding-principles/) — the "resemble how it's used" philosophy in the author's words.
- [Testing Library — user-event](https://testing-library.com/docs/user-event/intro/) — why it beats `fireEvent`, and the async API.
- [Common mistakes with RTL](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library) — the definitive list of anti-patterns.
