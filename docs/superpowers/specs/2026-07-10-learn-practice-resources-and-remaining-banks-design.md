# Learn & Practice resources + remaining question banks

**Date:** 2026-07-10
**Status:** Approved (design), implementing

## Problem

The question banks are "prompts only" — a reader on GitHub gets a list of questions but
nowhere to actually learn or solve them. The repo README even promises it "points each item
at the single best place to actually learn it," but the banks don't deliver that. Two goals:

1. **Make the markdown a complete standalone source** — usable without the website.
2. **Give every question a way to read / solve / find more.** Chosen shape: **curated
   resources per bank** (not per-question search links), **context-aware** — hands-on banks
   point to places to *solve*, concept banks point to places to *read*.

Also: 6 sections still have no question bank (Next.js, Architecture, State management,
Interview patterns, Design patterns, Build-your-own). Company guides is excluded — it already
has 16 per-company guide pages, so it needs resources but not a synthetic topical bank.

## Design

### Part A — 6 new topical banks

Same pipeline already used for the previous 9 banks:

- Original curated prompts, 🟢→🔴, ~25–35 per bank (~180 new).
- Exact repo format: `question-bank/README.md` index + one `<slug>.md` per category.
- Wire-up: widen `BankSlug` union, add `bank:` to the 6 `SectionMeta` entries, add 6 `BANKS`
  entries in `sections.ts`; add the 6 folders to `BANK_FOR_SECTION` in `transform.ts`.
- Insert the `> 📚 **[Full question bank …]**` callout after the `> Difficulty:` line in each
  of the 6 section READMEs.
- Prompts authored originally — no verbatim paid-course content.

### Part B — Curated "Learn & Practice" resources (single source → two renderings)

**Single source of truth:** `site/src/lib/resources.ts`. For each of the 21 bank slugs, a
typed record:

```ts
interface Resource { label: string; url: string; note?: string }
interface BankResources { read: Resource[]; practice?: Resource[] }
export const RESOURCES: Record<BankSlug, BankResources>
```

- **Concept banks** (css, javascript, typescript, react, browser, fundamentals, performance,
  security, accessibility, networking, testing, nextjs→n/a, system-design, architecture,
  state-management, design-patterns, build-your-own, interview-patterns) get a rich `read`
  list: MDN, web.dev, react.dev, patterns.dev, JavaScript.info, Josh Comeau, etc.
- **Hands-on banks** (dsa, machine-coding) get a `practice` list: LeetCode, NeetCode,
  GreatFrontEnd, BigFrontEnd.dev, Frontend Mentor — plus a small `read` list.

**Rendering 1 — website:** a resources block on each bank index page
(`banks/[bank]/index.astro`), reading `RESOURCES[bank.slug]`.

**Rendering 2 — GitHub markdown (the priority):** a generator injects a
`## 📚 Learn & Practice` section into each bank's `README.md` (and React's single
`question-bank.md`) from the same `RESOURCES` data. Marked with an HTML comment fence
(`<!-- resources:auto:start -->` … `:end`) so it is idempotently regenerable.

### Part C — Placement & safety constraints

- Resources live in the bank **index** / single-file header, **never on question bullets**.
  This keeps `parseBankCategoryFile` / `parseReactBank` output — and therefore question text,
  the search index, and the stable `questionId` hash — byte-for-byte unchanged. Progress
  cannot break.
- For React's single file, the injected section sits **before the first `###`** so
  `parseReactBank` (which only accretes bullets after a category heading) never captures the
  resource bullets. Resource sub-groups use bold labels, not `###`.
- Top README stats refreshed to the real numbers (bump the deliberately-vague `3,000+`).

## Testing

- Unit (`resources.ts` integrity): every `BankSlug` present; every URL `https://` and
  well-formed; no duplicate URLs within a bank; each bank has ≥1 link.
- e2e: a bank index page renders the Learn & Practice block with ≥1 external link.
- Question totals already derive dynamically from the live index — nothing hard-codes a stale
  count.

## Out of scope

- Per-category resources (staleness-prone at ~150 categories) — bank-level only for v1.
- A synthetic company-guides bank.
- Per-question links (explicitly de-scoped in favor of curated).
