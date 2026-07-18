# Topic deep dives — premium learning views

**Date:** 2026-07-14
**Status:** Approved (design), implementing on branch `feat/topic-deep-dives`

## Problem

Every section README is a table of topics — `| Topic | Difficulty | Time | Tags | Best Resources |`.
Today a topic row's only affordance is an **outbound** link to MDN/web.dev, so the repo tells you
*what* to learn and then sends you away. There is nowhere on the repo to actually **learn the
topic**, and no answer written at the depth an interviewer is listening for.

Goal: give each topic row a **premium deep-dive view**, written at staff-frontend-engineer depth.

## Scale & why we stage it

There are **784 table rows** repo-wide (~520 true "topic" rows; the rest are system-design /
machine-coding problems and company guides). A real deep dive is 500–900 words with code and
trade-offs; 520 of those is 300k+ words. Mass-generating them produces formulaic filler, which
contradicts the standing staff-engineer quality bar.

**Therefore:** build the engine once, ship **8 deep dives** for the `01-fundamentals` →
"The platform" table, get them reviewed, lock the format, then fill in the rest section by section.

## Design

### 1. Content model

One markdown file per topic:

```
<section>/topics/<slug>.md      e.g. 01-fundamentals/topics/the-dom.md
```

Markdown remains the single source of truth (repo-wide principle) so every deep dive is fully
readable on GitHub with no website. `slug` = `slugify(topic title)`.

### 2. Linking — one link, both surfaces

The Topic cell becomes a link to the deep dive:

```
| [The DOM](topics/the-dom.md) | 🟢 | 45m | `#dom` | [javascript.info: DOM ⭐](…) |
```

- **GitHub** → opens the markdown file.
- **Site** → existing `repoPathToRoute()` already maps `<section>/topics/<slug>.md` →
  `/sections/<section>/topics/<slug>/`. **No change to link resolution is needed** — we only add a
  page at that route.

Only rows whose `topics/<slug>.md` exists are linked. Unwritten rows stay plain text, so there are
never dead links; linking is progressive as content lands.

### 3. Metadata is read, never duplicated

The table row already carries difficulty, time, tags and the best-resource link. The deep-dive page
reads **metadata from the table row** and **body from the `.md`**. No frontmatter, no drift.

New pure function in `transform.ts` (unit-tested):

```ts
interface TopicRow {
  title: string; slug: string; group: string;      // group = the "## " heading above the table
  difficulty: Difficulty; time: string; tags: string[];
  resource?: { label: string; url: string };
  hasDeepDive: boolean;                            // set by the loader, not the parser
}
export function parseTopicTables(md: string): TopicRow[]
```

It must handle a Topic cell that is **plain text or a markdown link** (rows get linked over time).

### 4. The premium page

`src/pages/sections/[section]/topics/[topic].astro`:

- Premium header: title, difficulty pill, ⏱ time, tags, breadcrumb back to the section.
- Body rendered through the existing `getProseDoc()` / `.prose` pipeline (Shiki, anchors).
- TOC from the body headings; prev/next topic nav within the section; back-to-section.
- Deep dives are added to the ⌘K search index (`pages` bucket).

### 5. Deep-dive anatomy (the quality bar)

Each file, GitHub-first, in this order:

1. Centered title block + `<sub>` metadata + nav (matches existing repo chrome)
2. `> ⚡ **TL;DR**` — the one-sentence answer
3. `## 🧠 Mental model`
4. `## ⚙️ How it actually works` — the mechanism
5. `## 💻 Code` — real, runnable
6. `## ⚖️ Trade-offs` — including when NOT to use it
7. `## 💣 Gotchas interviewers probe`
8. `## 🎯 Say this in the interview`
9. `## 🔗 Go deeper` — curated links

Content is original prose, never copied from the user's paid course material.

### 6. Pilot set — `01-fundamentals` / "The platform" (8)

How the web works (request → render) · Semantic HTML · The DOM · DOM manipulation & traversal ·
Event handling, bubbling & delegation · Virtual DOM · Shadow DOM & Web Components · Forms & validation

## Testing

- Unit: `parseTopicTables` — plain rows, linked rows, difficulty/time/tags/resource extraction,
  slug generation, group heading attribution.
- Unit: no orphans — every `topics/*.md` has a matching table row, and every linked row has a file.
- e2e: a deep-dive page renders its header badges, all anatomy headings, TOC, and prev/next nav;
  the linked topic row in the section table navigates to it.

## Constraints

- Work stays on branch `feat/topic-deep-dives`. **Do not push** until the user has reviewed.
- Do not alter question text, the search-index question ids, or the `questionId` hash.

## Out of scope (for this pass)

- Deep dives for the other ~512 topic rows (follow-up, section by section).
- Deep dives for system-design / machine-coding problem rows and company guides.
