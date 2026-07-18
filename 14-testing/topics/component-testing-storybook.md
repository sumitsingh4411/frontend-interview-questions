<div align="center">

# Component testing (Storybook)

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#component`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A Storybook **story is a test fixture you can also see.** Modern Storybook runs those stories in a *real browser* (via Vitest + Playwright), so the same `play` function that documents an interaction also asserts it — closing the gap where jsdom lies about layout, focus, and visibility, without the cost of a full E2E stack.

---

## 🧠 Mental model

A story is just "this component, in this state." That single artifact is doing three jobs at once, and Storybook's whole value is that you don't write it three times:

- **Documentation** — the state rendered visually for humans.
- **A test fixture** — a fully-mounted component with props/context wired up.
- **A test** — attach a `play` function and it drives interactions and asserts, right there.

The mental shift from RTL-in-jsdom: **jsdom is a fake DOM with no layout engine.** It can't compute contrast, can't tell you if an element is actually visible or covered, can't measure a scroll position, and fakes focus. Storybook's browser-mode runner mounts your story in **real Chromium** through Playwright, so those things are true. You get the ergonomics of component testing (mount one unit in isolation) with the fidelity of E2E (a real rendering engine).

The framing to land: **component testing sits exactly between unit and E2E on the trophy.** It's isolated like a unit test (no server, no routing, mock the network) but rendered like an E2E test (real browser). That's the sweet spot for testing a design-system component's *behaviour and appearance* without booting the whole app.

## ⚙️ How it actually works

**Stories are the source of truth.** [Component Story Format (CSF)](https://storybook.js.org/docs/api/csf) exports a default (the component + meta) and named exports (each a state). Because a story is a plain object of `args`, every downstream tool — the test runner, visual regression, a11y addon, docs — consumes the *same* definition. Write the state once; test it many ways.

**The `play` function** runs *after* the story mounts. It receives a `canvas` scoped to that story and Storybook's wrapped Testing-Library queries plus `userEvent`. You query by role, fire real clicks/typing, and `expect(...)`. In browser mode these run against real Chromium via Playwright, so `userEvent.click` dispatches genuine trusted-ish events and focus/visibility behave like production.

**Two things you assert that unit tests can't:**
1. **Interaction** — the `play` function: click, type, assert the resulting state, all watchable step-by-step in the Interactions panel when it fails.
2. **Appearance** — pair stories with visual regression (Chromatic or Playwright screenshots). The story is the input; a pixel diff is the assertion. This catches the entire class of CSS regressions that behavioural tests are blind to.

**The runner.** `@storybook/addon-vitest` turns every story into a Vitest test executed in a Playwright-driven browser. Stories with no `play` become smoke tests (did it render without throwing?); stories with `play` become interaction tests. One config, and your documentation *is* your test suite.

## 💻 Code

```ts
// Button.stories.ts — Component Story Format 3
import type { Meta, StoryObj } from '@storybook/react';
import { expect, userEvent, within, fn } from '@storybook/test';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  component: Button,
  args: { onClick: fn() },       // a spy, reused across every story
};
export default meta;
type Story = StoryObj<typeof Button>;

// A story with NO play = a smoke test. Renders without throwing? Pass.
export const Primary: Story = { args: { variant: 'primary', children: 'Save' } };

// A story WITH play = an interaction test, run in a real browser.
export const SubmitsOnClick: Story = {
  args: { children: 'Save' },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);            // scoped to THIS story
    const btn = canvas.getByRole('button', { name: /save/i });
    await userEvent.click(btn);
    await expect(args.onClick).toHaveBeenCalledOnce(); // real assertion
  },
};

// Disabled state — asserts the interaction is genuinely blocked.
export const DisabledDoesNotFire: Story = {
  args: { children: 'Save', disabled: true },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: /save/i }));
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};
```

```ts
// vitest.config — every story becomes a browser test, one config.
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
export default {
  plugins: [storybookTest()],
  test: { browser: { enabled: true, provider: 'playwright', name: 'chromium' } },
};
```

## ⚖️ Trade-offs

- **Isolation is the point — and the limit.** You mount one component with mocked data and context, which makes tests fast and stable, but you are *not* testing that it integrates with the real app, router, or backend. Component tests never replace a thin layer of true E2E through the whole stack.
- **Browser mode costs more than jsdom.** Real Chromium per test is heavier than an RTL unit test in Node. Worth it for design-system components and anything layout/focus-sensitive; overkill for a pure formatting util that jsdom (or no DOM at all) tests fine.
- **Stories drift into test-only artifacts.** If you write stories purely to host `play` functions, you lose the documentation value — and a reviewer browsing Storybook sees noise. Keep stories meaningful states; add `play` where behaviour matters.
- **Visual regression needs infrastructure.** Chromatic (hosted) or self-managed Playwright screenshots both bring baseline management, review flows, and flake from font/rendering differences across machines. It's the highest-value addon and the highest-maintenance one.
- **When NOT to use it:** don't Storybook-test business logic, reducers, or data transforms — those are plain unit tests with no DOM. Reserve component testing for things whose *rendering and interaction* are the contract.

## 💣 Gotchas interviewers probe

- **"Isn't a story just a demo?"** The senior answer: no — it's a reusable fixture consumed by the test runner, visual regression, and the a11y addon simultaneously. Write the state once, test it many ways. That reuse is the whole pitch.
- **jsdom vs real browser.** The reason to run stories in Playwright is that jsdom has no layout engine — it can't judge visibility, overlap, contrast, or real focus. If someone claims RTL-in-jsdom covers the same ground, they've missed why browser mode exists.
- **`play` runs after mount, not during render.** It's an interaction script, not a lifecycle hook. Assertions about initial render go outside `play` (or at its start); interactions go inside.
- **Test behaviour, not implementation — even here.** Query by role and accessible name, not by CSS selector or internal state. A story that reaches into component internals breaks on every refactor, same as any brittle unit test.
- **`fn()` spies must be in `args`, not closed over.** Putting the spy in `args` lets Storybook reset it between renders and surface calls in the panel; a module-level mock leaks state across stories.
- **Interaction tests ≠ visual tests.** A green `play` function says the behaviour works; it says nothing about whether the component *looks* right. Padding, color, and z-index regressions only fall out of a pixel diff. You need both.

## 🎯 Say this in the interview

> "I treat a Storybook story as a fixture that's simultaneously documentation and a test. Each named export is the component in one state, defined with args, and that single definition feeds the test runner, the visual-regression tool, and the a11y addon — so I write the state once and test it three ways. For behaviour I attach a `play` function that queries by role, drives real clicks and typing with userEvent, and asserts — and modern Storybook runs that in real Chromium via Vitest and Playwright, which matters because jsdom has no layout engine and lies about visibility and focus. That puts component testing right between unit and E2E: isolated like a unit test, mocking the network, but rendered in a real browser like E2E. The one thing I'm clear on is that it doesn't replace true end-to-end coverage through the router and backend, and that a passing interaction test still needs a visual snapshot alongside it to catch CSS regressions."

## 🔗 Go deeper

- [Storybook — Writing tests](https://storybook.js.org/docs/writing-tests) — the interaction/visual/a11y testing model and the Vitest runner.
- [Storybook — Component Story Format](https://storybook.js.org/docs/api/csf) — the story-as-object contract every tool consumes.
- [Storybook — Interaction tests](https://storybook.js.org/docs/writing-tests/interaction-testing) — the `play` function API in depth.
- [Chromatic — Visual testing](https://www.chromatic.com/docs/) — turning stories into pixel-diff regression tests.
- [Testing Library — Guiding principles](https://testing-library.com/docs/guiding-principles) — why role/name queries beat implementation-coupled selectors, in Storybook too.
