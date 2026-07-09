# Frontend Interview Prep — Website Design

**Date:** 2026-07-10
**Goal:** A premium, static, always-online website that showcases the repo's frontend
interview content (156 Markdown files, 3,071 questions, 21 sections). Dark, sleek,
developer aesthetic. Zero-maintenance, free hosting.

## Decisions (locked)

| Area | Decision |
|---|---|
| Scope | Full handbook (20+ sections) **and** the 5 question banks |
| Stack | **Astro** static site generator (pure static HTML output) |
| Hosting | **GitHub Pages**, built by a GitHub Action, lives in `/site` in this repo |
| Aesthetic | **Dark-first**, sleek/developer (Linear/Vercel/Raycast energy) + light toggle |
| Content source | **Auto-parse existing Markdown** — repo is the single source of truth |
| Search | **Pagefind** — static, client-side, zero backend |
| Progress | Per-question "mark done" + progress bar, saved in `localStorage` |

## Architecture

### Content pipeline (the crux)
The `/site` Astro app reads the repo's existing `.md` files at build time. No copies.

1. **Glob** all `**/*.md` outside `/site`, `/docs`, `/node_modules`.
2. **Transform layer** (remark/rehype + a small preprocessor):
   - Rewrite relative `*.md` links → site routes (`../README.md` → parent section route,
     `question-bank/two-pointers.md` → `/banks/<bank>/two-pointers/`).
   - Strip GitHub-only chrome: the `<div align="center">` nav rows ("⬅ Back", "Home"),
     duplicate difficulty legends. Keep meaningful prose, tables, code, images.
   - Resolve `banner.svg` / asset references to bundled site assets.
3. **Two render modes** from the same Markdown:
   - **Prose pages** (21 sections + 35 sub-pages/flagships/company guides): render
     Markdown → styled HTML with the site's typography, tables, code blocks.
   - **Bank category pages** (~92 pages): *parse* `- {🟢|🟡|🔴} {question}` lines into
     structured `{difficulty, text}` records → render an **interactive** component
     (difficulty filter chips, search-within-page, mark-done checkboxes + progress bar).

### Routes
```
/                                  Home: hero, live stats, section grid, featured banks
/sections/                         All sections index
/sections/<nn-slug>/               Section landing (prose)
/sections/<nn-slug>/<page>/        Flagship / sub-page (prose)
/banks/                            All banks index
/banks/<bank>/                     Bank index (category table w/ counts)
/banks/<bank>/<category>/          Interactive question list  ← premium money page
/search  (Pagefind overlay, global)
```
Banks: `machine-coding`, `javascript`, `system-design`, `dsa`, `react` (react = single list).

### Layout & navigation
- Sticky **top bar**: logo/wordmark, global search trigger (`⌘K`), GitHub link, theme toggle.
- Persistent **left sidebar**: 21 sections grouped (Foundations / Core / Systems / Practice),
  collapses to a drawer on mobile.
- **Right "on this page"** mini-TOC on prose pages (desktop).
- Content column with premium typography, code theme matching the site.

## Premium features (v1)
- 🔍 Global fuzzy search over every question + section title (Pagefind).
- 🎯 Difficulty filter chips (🟢🟡🔴) + in-page search on bank category pages.
- ✅ Mark-done checkboxes + per-category and per-bank progress bars (localStorage).
- 🌑 Dark-first theme with light toggle (persisted).
- ⌘K command palette for search/navigation.
- 📱 Responsive; ⚡ target 100 Lighthouse (static HTML, minimal JS islands).

## Visual system (dark-first, sleek dev)
- **Background:** near-black layered surfaces (e.g. `#0a0b0f` base, `#12141a` panels).
- **Accent:** a single confident accent (electric indigo/violet) + subtle glow on focus/hover.
- **Type:** a crisp geometric/grotesk sans for UI + a mono for code and difficulty/counts.
- **Difficulty tokens:** green/amber/red dots, consistent across the whole site.
- **Motion:** restrained — hover lifts, focus glow, page-fade; nothing bouncy.
- Executed with the `frontend-design` skill so it doesn't read as a template.

## Deployment
- `/site` Astro project, `output: 'static'`, `base` set for the Pages path.
- `.github/workflows/deploy-site.yml`: on push to `main`, build `/site`, deploy to Pages.
- Free, permanent, auto-updates whenever Markdown changes.

## Build task order
1. Scaffold Astro in `/site` (deps: astro, @astrojs/mdx if needed, pagefind, sharp).
2. Content pipeline: glob loader + link-rewrite + chrome-strip + bank parser (with tests
   on the transform functions).
3. Base layout: top bar, sidebar nav (data-driven from sections), theme toggle.
4. Design system: tokens (CSS variables), typography, difficulty tokens, components.
5. Home page: hero + live computed stats + section grid + featured banks.
6. Section + sub-page prose rendering.
7. Bank index + interactive category pages (filters, search-within, progress).
8. Global search (Pagefind) + ⌘K palette.
9. Responsive pass + a11y pass + Lighthouse check.
10. GitHub Pages workflow + first deploy.

## Out of scope (v1 / YAGNI)
- Accounts, server, database, comments.
- Editing content through the site (Markdown stays the source of truth).
- i18n, analytics dashboards.

## Risks / notes
- Markdown chrome varies slightly per file — the transform must be resilient and covered
  by unit tests on representative samples (section README, bank index, bank category).
- Keep JS minimal: prose pages ship zero JS; interactivity only on bank pages + search.
- Content is already public (prompts/lists only) — no new exposure by publishing.
