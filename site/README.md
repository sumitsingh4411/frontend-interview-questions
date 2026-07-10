# Site

The website for this handbook. It is **generated from the repo's Markdown** — the `.md`
files at the repo root stay the single source of truth. Edit a question, push, and the
site redeploys.

```bash
npm install
npm run dev        # local dev at /frontend-interview-questions
npm run build      # static output in dist/
npm test           # unit tests for the content transforms
npm run test:e2e   # browser tests (needs the built site served on :4321)
```

## How it works

`src/lib/` reads the repo at build time and renders it two ways:

| Source | Rendered as |
|---|---|
| Section `README.md`, flagship pages, `FAQ.md`, `ROADMAP.md` | Styled **prose pages** |
| `question-bank/*.md`, `06-react/question-bank.md` | Structured, **interactive question lists** |

- `transform.ts` — pure functions: strip GitHub-only chrome (banners, badges, back-links),
  map repo paths to site routes, parse `- 🟡 Question` bullets into `{difficulty, text}`.
  Unit-tested; unrouted repo files fall back to their GitHub URL.
- `markdown.ts` — markdown-it + Shiki (dual light/dark themes) + heading anchors, with a
  link renderer that rewrites every relative `.md` link to its site route.
- `content.ts` — globs the repo, orders bank categories using each bank's index table,
  and computes the live stats shown on the homepage.

## The design

Dark-first. The **difficulty spectrum** is the signature: a tricolor bar sized by the real
proportions of whatever question set it describes. It's the homepage hero, the top bar's
bottom edge, a mini-bar on every card, and on a category page each segment fills with the
brand accent as you complete questions of that difficulty.

Progress is stored in `localStorage` under `fip:done:<bank>:<category>`; theme under
`fip-theme`. There is no backend.

## Progress dashboard

`/progress/` turns those saved ids into a dashboard: an overall ring, per-difficulty and
per-bank breakdowns, and a "pick up where you left off" list. It fetches
`progress-catalog.json` (built alongside the site) to map each saved id back to its
difficulty and category.

Both the checkboxes and the dashboard derive ids from `questionId()` in `transform.ts`.
They **must** agree — a unit test pins one known id so a refactor can't silently stop
progress from counting.

## Search

`search-index.json` is generated at build time: every question, its difficulty, and its
category (≈53 KB gzipped). The ⌘K palette fetches it once on first open and scores
matches client-side. No search service, no crawler step.

## Deploying

`.github/workflows/deploy-site.yml` builds and publishes to GitHub Pages on every push to
`main`. Enable it once under **Settings → Pages → Source: GitHub Actions**.

The `base` path is set in `astro.config.mjs`. If the repository is ever renamed, update
`base` and `site` there.
