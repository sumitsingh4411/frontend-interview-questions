# 📍 The Frontend System Design Roadmap

A **Beginner → Advanced** path through the whole repo. Don't read top-to-bottom randomly — follow a track below, then use the section tables to go deep.

Difficulty legend: 🟢 Easy · 🟡 Medium · 🔴 Hard

---

## 🧱 Stage 0 — Foundations (must know cold)

You can't design systems on shaky ground. Lock these first.

```
01-fundamentals ──▶ 02-browser ──▶ 03-javascript ──▶ 05-css
```

- **[Fundamentals](01-fundamentals/)** 🟢 — rendering, DOM, HTTP, storage, SEO
- **[Browser Internals](02-browser/)** 🟡 — event loop, rendering pipeline, GC
- **[JavaScript](03-javascript/)** 🟡 — closures, promises, `this`, prototypes, modules
- **[CSS](05-css/)** 🟢 — box model, flexbox, grid, cascade, specificity

## 🧩 Stage 1 — Framework & Types

```
04-typescript ──▶ 06-react ──▶ 07-nextjs
```

- **[TypeScript](04-typescript/)** 🟡 — generics, utility types, guards
- **[React](06-react/)** 🟡 — reconciliation, hooks, memoization, error boundaries
- **[Next.js](07-nextjs/)** 🟡 — routing, SSR/SSG/ISR, caching, server actions

## 🚦 Stage 2 — The Cross-Cutting Concerns

The topics every system-design answer touches.

```
09-performance ──▶ 10-security ──▶ 11-accessibility ──▶ 12-networking ──▶ 13-state-management
```

- **[Performance](09-performance/)** 🔴 — Core Web Vitals, bundles, virtualization
- **[Security](10-security/)** 🔴 — XSS, CSRF, CSP, auth
- **[Accessibility](11-accessibility/)** 🟡 — ARIA, WCAG, keyboard, focus
- **[Networking](12-networking/)** 🟡 — HTTP/2-3, WebSocket, SSE, GraphQL, CDN
- **[State Management](13-state-management/)** 🟡 — Redux, Zustand, React Query, signals

## 🏛️ Stage 3 — Architecture & Testing

```
08-architecture ──▶ 14-testing ──▶ 18-design-patterns
```

- **[Architecture](08-architecture/)** 🔴 — micro-frontends, monorepos, design systems
- **[Testing](14-testing/)** 🟡 — RTL, Playwright, MSW, visual/a11y testing
- **[Design Patterns](18-design-patterns/)** 🟡 — observer, factory, strategy, DI

## 🚀 Stage 4 — The Interview Itself

This is what the interview actually tests. Do these last, do them a lot.

```
17-interview-patterns ──▶ 15-system-design ──▶ 16-machine-coding ──▶ 20-company-guides
```

- **[Interview Patterns](17-interview-patterns/)** 🔴 — real-time, offline, infinite data, optimistic UI
- **[Frontend System Design](15-system-design/)** 🔴 — 200+ "Design X" problems + flagships
- **[Machine Coding](16-machine-coding/)** 🔴 — 300+ build-this-component problems + flagships
- **[Company Guides](20-company-guides/)** 🔴 — what each company actually asks

## 🛠️ Stage 5 — Master (optional, for Staff)

Nothing teaches internals like rebuilding them.

- **[Build Your Own](19-build-your-own/)** 🔴 — React, Redux, Router, Virtual DOM, a bundler

---

## 🎯 Time-boxed tracks

### ⚡ 2-Week Crash Course
For "my interview is soon."

| Days | Focus |
|------|-------|
| 1–2 | [Fundamentals](01-fundamentals/) + [Browser](02-browser/) essentials |
| 3–4 | [JavaScript](03-javascript/) 🟡 + [React](06-react/) core |
| 5–6 | [Performance](09-performance/) + [Networking](12-networking/) |
| 7–8 | [State](13-state-management/) + [Security](10-security/) + [a11y](11-accessibility/) |
| 9–11 | 5 flagship [system designs](15-system-design/#-flagship-solutions) |
| 12–13 | 4 flagship [machine coding](16-machine-coding/#-flagship-solutions) |
| 14 | [Company guide](20-company-guides/) for your target |

### 📈 SDE-2 → Senior (4–6 weeks)
All 🟢 + 🟡 topics, every flagship, [Performance](09-performance/) + [State](13-state-management/) + [a11y](11-accessibility/) end-to-end.

### 🎯 Staff / FAANG (8–12 weeks)
Everything, with emphasis on all 🔴 topics, [Architecture](08-architecture/), [Build Your Own](19-build-your-own/), and mock interviews from [Company Guides](20-company-guides/).

---

> Tip: keep a checklist. Fork the repo, tick rows in each section table as you master them, and you'll see your gaps at a glance.
