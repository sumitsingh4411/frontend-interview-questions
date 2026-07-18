<div align="center">

# Accessibility testing

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#a11y`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Automated a11y checks (axe) catch roughly **30–40%** of WCAG issues — the machine-detectable ones like missing labels and low contrast. They are a cheap regression net, not a certificate of accessibility. The other 60% (focus order, screen-reader coherence, "is this actually operable?") only falls out of tests written the way an assistive-tech user *reaches* the UI.

---

## 🧠 Mental model

There are two completely different questions hiding under "accessibility testing", and conflating them is the classic mistake:

1. **Does the DOM violate a known rule?** — a missing `alt`, a form control with no accessible name, a 3:1 contrast ratio. Deterministic, tooling-friendly. `axe-core` runs a static ruleset over the rendered tree and answers this in milliseconds.
2. **Can a human using a keyboard or screen reader actually accomplish the task?** — is focus trapped in the modal, does the error get *announced*, does the toggle report its pressed state? No linter can answer this. It's a behavioural property of your component.

The senior framing: **axe is a spell-checker, not an editor.** Zero axe violations means you didn't misspell anything obvious — it says nothing about whether the sentence makes sense. So you run axe on everything as a floor, and you write *interaction* tests that query the DOM the way assistive tech exposes it: by **role and accessible name**, never by class or test-id.

## ⚙️ How it actually works

**`jest-axe` / `axe-core`.** You render a component to real DOM (jsdom in unit tests, a real browser in Playwright/Cypress), hand the node to `axe()`, and it walks the accessibility tree applying ~90 rules. Each violation comes back with the rule id, the offending nodes, and a help URL. Crucially, jsdom does **not** compute layout or color — so contrast and any geometry-dependent rule are unreliable or silently skipped there. Real contrast testing needs a real rendering engine (Playwright's `@axe-core/playwright`), which is why serious a11y coverage lives in E2E, not jsdom unit tests.

**The accessible name/role is the contract.** Testing Library's `getByRole('button', { name: /save/i })` resolves the name through the same [accessible name computation](https://www.w3.org/TR/accname-1.2/) a screen reader uses — `aria-label`, `aria-labelledby`, associated `<label>`, then text content. If your test can't find the element by role and name, **a screen reader user can't either.** That's the whole reason RTL pushes role queries: the test *is* the assistive-tech simulation.

**What automation structurally cannot see:** logical focus order, whether an announcement fired (`aria-live`), whether a custom widget honours its keyboard contract (arrow keys on a listbox), and whether the reading order matches the visual order. These are behaviours you assert explicitly by driving `Tab`, reading `document.activeElement`, and checking `aria-*` state transitions.

## 💻 Code

```js
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

// 1) The static floor — cheap regression net on the rendered output.
test('dialog has no automatically-detectable a11y violations', async () => {
  const { container } = render(<ConfirmDialog open />);
  expect(await axe(container)).toHaveNoViolations();
});

// 2) The part axe CANNOT check — behaviour an AT user depends on.
test('focus is trapped and the dialog is named', async () => {
  const user = userEvent.setup();
  render(<ConfirmDialog open />);

  // Found BY ROLE + NAME — same path a screen reader takes.
  const dialog = screen.getByRole('dialog', { name: /delete account/i });
  expect(dialog).toBeInTheDocument();

  // Focus moved INTO the dialog on open (not left on the trigger).
  expect(dialog).toContainElement(document.activeElement);

  // Tab from the last control wraps back inside — no escaping to the page.
  await user.tab();
  await user.tab();
  expect(dialog).toContainElement(document.activeElement);
});

// 3) State is announced via ARIA, not just visual colour.
test('toggle reports pressed state to assistive tech', async () => {
  const user = userEvent.setup();
  render(<MuteButton />);
  const btn = screen.getByRole('button', { name: /mute/i });
  expect(btn).toHaveAttribute('aria-pressed', 'false'); // ❌ colour-only would fail here
  await user.click(btn);
  expect(btn).toHaveAttribute('aria-pressed', 'true');
});
```

## ⚖️ Trade-offs

- **Automated scans are high-precision, low-recall.** Near-zero false positives, but they miss the majority of real barriers. Treat a green axe run as necessary, never sufficient — and never let it create false confidence in a compliance review.
- **jsdom vs real browser.** Unit-level `jest-axe` is fast and catches structural issues on every PR, but can't judge contrast, focus visibility, or anything needing layout. Push those to Playwright + `@axe-core/playwright`. Use both tiers deliberately.
- **Don't gate CI on a full-page scan of legacy pages** — you'll drown in pre-existing violations. Scope axe to the component under test, or snapshot the violation count and ratchet it downward.
- **Automated testing never replaces manual AT testing.** One real pass with VoiceOver/NVDA and keyboard-only finds things no tool will. Budget for it on anything user-critical.

## 💣 Gotchas interviewers probe

- **"Does passing axe mean it's accessible?"** No — and saying yes is the fail signal. Axe covers ~30–40% of WCAG success criteria. Name the gap: focus management, announcements, reading order, cognitive load.
- **Contrast in jsdom is a lie.** jsdom doesn't compute color, so contrast rules are skipped or wrong. Candidates who assert contrast in a Jest unit test don't understand the runtime.
- **`getByTestId` is an a11y smell.** If you *had* to reach for a test-id because no role/name existed, that's often the component failing a real user, not just the test. Prefer `getByRole`; let the query pressure-test the markup.
- **Querying by `aria-live` content directly.** You can assert the live region's text updated, but jsdom won't actually *announce* it — only a real screen reader will. Assert the mechanism (region exists, text changed, correct `aria-live`/`role="status"`), and verify the announcement manually.
- **`toBeVisible()` ≠ perceivable by AT.** `aria-hidden="true"` or `display:none` removes something from the tree; `visibility:hidden` too. An element can be visually present yet invisible to a screen reader, and vice versa.
- **Disabled vs `aria-disabled`.** A native `disabled` control is removed from the tab order and can't be focused to hear *why* it's disabled; `aria-disabled` keeps it discoverable. Tests should assert the intended one.

## 🎯 Say this in the interview

> "I run accessibility testing in two layers. First, automated scanning with axe on the rendered output — jest-axe in unit tests, axe-core in Playwright — as a cheap regression floor. But I'm explicit that axe only catches the machine-detectable ~30–40% of WCAG: missing labels, bad contrast, structural issues. It says nothing about whether the thing is *operable*. So the second layer is behavioural tests that query the DOM by role and accessible name — the same path a screen reader takes — and drive the keyboard: is focus moved into the modal and trapped, does the toggle expose `aria-pressed`, does the error land in a live region. If a test can't find an element by role and name, neither can a screen-reader user, so the test doubles as an a11y assertion. And none of that replaces one manual pass with VoiceOver and keyboard-only, which I'd always budget for on critical flows."

## 🔗 Go deeper

- [jest-axe](https://github.com/nickcolley/jest-axe) — wiring axe-core into Jest, plus the honest note on what it does and doesn't cover.
- [Deque — axe-core rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md) — the exact ruleset, so you know the boundary of automation.
- [Testing Library — About queries](https://testing-library.com/docs/queries/about) — the query priority (role first) and why it maps to accessibility.
- [W3C — Accessible Name and Description Computation](https://www.w3.org/TR/accname-1.2/) — how the name your test matches on is actually derived.
- [web.dev — How to do an accessibility review](https://web.dev/articles/how-to-review) — the manual half automation can't reach.
