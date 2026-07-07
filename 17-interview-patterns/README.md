# 17 · Interview Patterns

The reusable "moves." Most "Design X" problems are combinations of these. Learn the pattern once, apply it everywhere.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

| Pattern | Difficulty | Time | Tags | Where it shows up |
|---------|:----------:|:----:|------|-------------------|
| Rendering strategy selection (CSR/SSR/SSG) | 🔴 | 1h | `#rendering` | Every SSR-able app |
| Client-side caching & invalidation | 🔴 | 1h | `#caching` | Feeds, search, dashboards |
| Real-time updates (WS / SSE / polling) | 🔴 | 1h | `#realtime` | Chat, notifications, trading |
| Large data handling & virtualization | 🔴 | 1h | `#large-data` | Feeds, tables, chat |
| Pagination vs infinite scroll | 🟡 | 45m | `#large-data` | Any long list |
| Optimistic UI updates | 🔴 | 45m | `#ux` | Likes, chat, cart |
| Offline-first & sync | 🔴 | 1.5h | `#offline` | PWAs, docs, email |
| Conflict resolution (OT / CRDT) | 🔴 | 1.5h | `#collaboration` | Docs, whiteboard |
| Debounce / throttle input | 🟡 | 30m | `#interaction` | Search, resize, scroll |
| Search & typeahead | 🟡 | 45m | `#search` | Everywhere |
| Media streaming & lazy media | 🔴 | 1h | `#media` | Video, images |
| Polling & backoff | 🟡 | 45m | `#realtime` | Status, jobs |
| Data normalization | 🔴 | 1h | `#state` | Relational client data |
| Authentication & session flow | 🔴 | 1h | `#auth` | Every logged-in app |
| Authorization & feature gating | 🟡 | 45m | `#authz` | Dashboards, admin |
| Error handling & retries | 🟡 | 45m | `#reliability` | Every network call |
| Loading & skeleton states | 🟢 | 30m | `#ux` | Every async UI |
| Forms & validation strategy | 🟡 | 45m | `#forms` | Checkout, settings |
| State machines for complex UI | 🔴 | 1h | `#state-machine` | Wizards, players |
| Animation & 60fps interactions | 🔴 | 1h | `#animation` | Drag, transitions |
| Accessibility patterns (focus, ARIA) | 🔴 | 1h | `#a11y` | Every component |
| Internationalization (i18n/l10n) | 🟡 | 45m | `#i18n` | Global apps |
| Scalability of the frontend codebase | 🔴 | 1h | `#architecture` | Micro-frontends, monorepos |

**Related:** [15-system-design](../15-system-design/) · [09-performance](../09-performance/) · [13-state-management](../13-state-management/)

_These patterns tie the whole repo together. [Suggest a pattern](../CONTRIBUTING.md)._
