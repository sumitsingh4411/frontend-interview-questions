<div align="center">

# Visual regression testing

<sub>🧪 Testing · 🟡 Medium · ⏱ 45m · `#visual`</sub>

<a href="../README.md">⬅ Testing</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Visual regression testing renders a component, screenshots it, and **diffs the pixels against an approved baseline** — catching the entire class of "it looks broken" bugs that assertions can't express. The whole game is **taming false positives**: fonts, animations, and antialiasing will wreck you if you don't control them.

---

## 🧠 Mental model

Functional tests answer "does it *behave* right?" Visual tests answer the question no assertion can: "does it *look* right?" A CSS change that shifts a button 4px, a `z-index` regression that hides a modal, a broken web font falling back to Times — none of these throw errors or fail `expect(button).toBeVisible()`. They just look wrong. Visual regression is the only automated layer that catches them.

The mechanism is dumb on purpose: **capture a screenshot, compare it byte-by-byte (well, pixel-by-pixel) to a stored baseline, fail if they differ beyond a threshold.** The intelligence isn't in the diff — it's in making the render **deterministic** so the *only* thing that changes between runs is the thing you actually changed. Everything else — a blinking cursor, a spinner mid-spin, a lazy-loaded image, subpixel font rendering that differs between your Mac and CI's Linux — is noise that produces false positives, and a visual suite that cries wolf gets ignored within a week.

## ⚙️ How it actually works

**Baselines and the review loop.** First run has no baseline, so it *creates* one and passes. Every subsequent run diffs against it. When a diff appears, a human decides: **bug** (fix the code) or **intended change** (approve the new baseline, e.g. `--update-snapshots`). This human-in-the-loop approval is the defining feature — visual tests can't self-verify, so they need a review UI. That's the entire value proposition of hosted tools like Chromatic/Percy over raw Playwright snapshots.

**Determinism is the whole job.** The failure modes and their fixes:

- **Antialiasing / OS font rendering.** The same page renders slightly different pixels on macOS vs CI Linux. **Fix:** always generate baselines in the *same environment* that runs CI — a Docker container or the CI runner itself, never your laptop. This is the #1 cause of "passes locally, fails in CI".
- **Animations & transitions.** A screenshot mid-fade is random. **Fix:** disable them — Playwright's `toHaveScreenshot` auto-disables CSS animations; otherwise inject `* { transition: none !important; animation: none !important; }`.
- **Dynamic content.** Timestamps, avatars, ad slots, `Math.random()`. **Fix:** mask regions (`mask: [locator]`) or stub the data to a fixed value.
- **Fonts not loaded.** Screenshot before the web font arrives → fallback font → false diff. **Fix:** `await document.fonts.ready` before capturing.

**Thresholds.** `maxDiffPixels` / `maxDiffPixelRatio` let a handful of pixels differ so you don't fail on one antialiased edge. Set it too high and you miss real 3px shifts; too low and you drown in noise. Component-level shots keep this tractable — small surfaces, few variables.

## 💻 Code

Playwright's built-in snapshotting:

```ts
import { test, expect } from '@playwright/test';

test('pricing card matches baseline', async ({ page }) => {
  await page.goto('/components/pricing-card');

  // Kill nondeterminism BEFORE capturing.
  await page.evaluate(() => document.fonts.ready);          // fonts loaded
  await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}' });

  await expect(page.getByTestId('pricing-card')).toHaveScreenshot('pricing-card.png', {
    maxDiffPixelRatio: 0.01,            // tolerate ~1% antialiasing noise
    mask: [page.getByTestId('live-timestamp')], // black out dynamic content
  });
});
```

```jsonc
// playwright.config.ts — run snapshot generation in CI's environment, not your laptop
{
  "snapshotPathTemplate": "{testDir}/__screenshots__/{platform}/{arg}{ext}"
  // platform in the path → macOS and Linux baselines never clobber each other
}
```

Update baselines deliberately, never blindly:

```bash
# Only after eyeballing the diff and confirming the change is intended.
npx playwright test --update-snapshots
```

## ⚖️ Trade-offs

- **Component-level beats full-page.** Full-page screenshots are a false-positive factory — any header tweak fails every page. Screenshotting isolated components (ideally driven from Storybook stories) shrinks the surface and pins the failure to one place. This is why Storybook + Chromatic is the canonical stack.
- **Hosted (Chromatic/Percy) vs DIY (Playwright/`jest-image-snapshot`).** Hosted tools give you a review UI, parallelized cross-browser rendering, and branch-aware baselines — worth real money on a large team. DIY is free and in-repo but you own the review workflow and the CI-environment discipline yourself.
- **Baselines are binary blobs in your repo (or a service).** They bloat git and can't be code-reviewed as text — the "diff" is an image a human must eyeball. Budget for that review cost.
- **When NOT to use it:** for logic, layout math, or behaviour — assert those directly, they're faster and give precise failures. Visual regression is a supplement for the *appearance* class of bug, not a replacement for functional tests.

## 💣 Gotchas interviewers probe

- **"Passes on my machine, fails in CI."** Almost always font antialiasing across OSes. The fix is generating and running baselines in the *same* (containerized) environment — say this and you sound like you've actually shipped it.
- **Flaky visual tests destroy trust faster than any other kind.** One team ignoring red visual checks is one team that's stopped catching regressions. Determinism isn't optional polish — it's the difference between a useful suite and abandoned one.
- **Forgetting `document.fonts.ready`.** Capturing before the web font loads gives you a fallback-font baseline that fails the moment fonts load correctly.
- **Blindly running `--update-snapshots` on failure.** That approves whatever the screen currently shows — including the actual bug. The whole point is a human reviews the diff *before* accepting the new baseline.
- **Anti-aliasing threshold tuning.** `maxDiffPixelRatio: 0` is unusable; a sensible small ratio absorbs rendering noise without hiding real shifts.
- **Not masking dynamic content.** A "Last updated 3s ago" label guarantees a diff on every single run.

## 🎯 Say this in the interview

> "Visual regression testing screenshots a rendered component and diffs it pixel-by-pixel against an approved baseline — it catches the whole class of appearance bugs that assertions can't express, like a broken font fallback or a 4px layout shift. The real work isn't the diffing, it's determinism: the render has to be identical run-to-run except for the actual change. So I disable animations, wait on `document.fonts.ready`, mask dynamic content like timestamps, and — critically — generate baselines in the same containerized environment CI runs in, because font antialiasing differs across OSes and that's the number-one cause of false positives. I prefer component-level shots over full-page because the surface is smaller and failures are pinpointed, which is why the Storybook-plus-Chromatic stack is so common. And I never auto-update baselines on failure — a human reviews the diff first, otherwise you approve the bug."

## 🔗 Go deeper

- [Playwright — Visual comparisons](https://playwright.dev/docs/test-snapshots) — `toHaveScreenshot`, thresholds, masking, per-platform baselines.
- [Storybook — Visual tests](https://storybook.js.org/docs/writing-tests/visual-testing) — driving snapshots from isolated stories, the canonical component-level approach.
- [Chromatic — Visual testing](https://www.chromatic.com/docs/visual-tests/) — the review-workflow and cross-browser rendering hosted tools add.
- [web.dev — Fonts and the FOUT/FOIT problem](https://web.dev/articles/font-best-practices) — why font loading timing wrecks snapshot determinism.
