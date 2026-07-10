<div align="center">

<img src="banner.svg" alt="17 · Interview Patterns" width="100%" />

</div>

The reusable "moves." Most "Design X" problems are combinations of these. Learn the pattern once, apply it everywhere.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 24 Interview Patterns questions across 5 categories →](question-bank/README.md)**

## Rendering & data delivery

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Rendering strategy selection (CSR/SSR/SSG) | 🔴 | 1h | `#rendering` | Every SSR-able app |
| Client-side caching & invalidation | 🔴 | 1h | `#caching` | Feeds, search, dashboards |
| Prefetching & preloading | 🟡 | 45m | `#loading` | Navigation, hovers |
| Skeleton & loading states | 🟢 | 30m | `#ux` | Every async UI |
| Streaming & progressive rendering | 🔴 | 1h | `#rendering` | Large pages, feeds |

## Large data & real-time

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Large data handling & virtualization | 🔴 | 1h | `#large-data` | Feeds, tables, chat |
| Pagination vs infinite scroll | 🟡 | 45m | `#large-data` | Any long list |
| Search & typeahead | 🟡 | 45m | `#search` | Everywhere |
| Real-time updates (WS / SSE / polling) | 🔴 | 1h | `#realtime` | Chat, notifications, trading |
| Polling & backoff | 🟡 | 45m | `#realtime` | Status, jobs |
| Media streaming & lazy media | 🔴 | 1h | `#media` | Video, images |
| Debounce / throttle input | 🟡 | 30m | `#interaction` | Search, resize, scroll |

## Sync, offline & consistency

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Optimistic UI updates | 🔴 | 45m | `#ux` | Likes, chat, cart |
| Offline-first & sync | 🔴 | 1.5h | `#offline` | PWAs, docs, email |
| Conflict resolution (OT / CRDT) | 🔴 | 1.5h | `#collaboration` | Docs, whiteboard |
| Data normalization | 🔴 | 1h | `#state` | Relational client data |
| Idempotency & dedupe | 🟡 | 45m | `#reliability` | Payments, mutations |
| Undo/redo & command history | 🟡 | 45m | `#state-machine` | Editors, forms |

## Robustness & UX

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Error handling & retries | 🟡 | 45m | `#reliability` | Every network call |
| Error boundaries & fallback UI | 🟡 | 30m | `#reliability` | Component trees |
| Forms & validation strategy | 🟡 | 45m | `#forms` | Checkout, settings |
| State machines for complex UI | 🔴 | 1h | `#state-machine` | Wizards, players |
| Animation & 60fps interactions | 🔴 | 1h | `#animation` | Drag, transitions |
| Accessibility patterns (focus, ARIA) | 🔴 | 1h | `#a11y` | Every component |
| Internationalization (i18n/l10n) | 🟡 | 45m | `#i18n` | Global apps |

## Auth & scale

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Authentication & session flow | 🔴 | 1h | `#auth` | Every logged-in app |
| Authorization & feature gating | 🟡 | 45m | `#authz` | Dashboards, admin |
| Feature flags & A/B testing | 🔴 | 1h | `#architecture` | Rollouts |
| Scalability of the frontend codebase | 🔴 | 1h | `#architecture` | Micro-frontends, monorepos |
| Observability & error reporting | 🟡 | 45m | `#reliability` | Production apps |

**Related:** [15-system-design](../15-system-design/) · [09-performance](../09-performance/) · [13-state-management](../13-state-management/)

_These patterns tie the whole repo together. [Suggest a pattern](../CONTRIBUTING.md)._
