# 🟦 Dropbox — Frontend Interview Guide

> **Emphasis:** File UIs, sync/offline, large-data handling, and uploads. Rendering huge file trees and resumable uploads are on-brand.

**Related:** [Company index](README.md) · [ROADMAP](../ROADMAP.md)

---

## The loop (typical)

| Round | Focus | Prep section |
|-------|-------|--------------|
| Phone screen | JS/DSA | [03-javascript](../03-javascript/) |
| Coding | UI component / machine coding | [16-machine-coding](../16-machine-coding/) |
| Frontend system design | File/sync "Design X" | [15-system-design](../15-system-design/) |
| Behavioral | Collaboration | — |

## What they emphasize

- **File UIs** — trees, explorers, large lists (virtualization).
- **Upload flows** — chunked, resumable, progress, retries.
- **Sync & offline** — conflict handling, optimistic updates.
- **Large-data performance.**

## Frequently asked (community-sourced)

**Machine coding**
- Build a File Explorer / Tree View → [nested comments pattern](../16-machine-coding/nested-comments.md)
- Build a chunked/resumable File Upload → [pattern](../17-interview-patterns/)
- Build a Data Grid (file list) → [flagship](../16-machine-coding/data-grid.md)
- Build a Virtualized List → [flagship](../06-react/build-a-virtualized-list.md)

**System design**
- Design Dropbox / a file browser → [15-system-design](../15-system-design/)
- Design a File Upload system → [pattern](../17-interview-patterns/)
- Design offline sync → [flagship](../15-system-design/design-google-docs.md)

**Patterns**
- Offline-first, sync, optimistic UI → [17-patterns](../17-interview-patterns/) · [13-state](../13-state-management/)

## Prep plan (2 weeks)

1. Build a file tree + [virtualization](../06-react/build-a-virtualized-list.md).
2. Implement a chunked/resumable upload with progress + retries.
3. Study [offline/sync patterns](../17-interview-patterns/).
4. Practice a file-browser system design.

---

> _Interviewed at Dropbox? Add the questions you got (role + year) via a [PR](../CONTRIBUTING.md)._
