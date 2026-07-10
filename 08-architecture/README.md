<div align="center">

<img src="banner.svg" alt="08 · Frontend Architecture" width="100%" />

</div>

How to structure apps that many engineers and many teams touch. The Staff-level differentiator.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 31 Architecture questions across 6 categories →](question-bank/README.md)**

## Component & app structure

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Component architecture & composition | 🟡 | 1h | `#components` `#patterns` | [patterns.dev ⭐](https://www.patterns.dev/) |
| Container vs presentational | 🟢 | 30m | `#patterns` | [patterns.dev ⭐](https://www.patterns.dev/react) |
| Atomic Design | 🟢 | 45m | `#design-systems` | [Atomic Design (Brad Frost) ⭐](https://atomicdesign.bradfrost.com/) |
| Feature-based / feature-sliced structure | 🟡 | 45m | `#structure` | [Feature-Sliced Design ⭐](https://feature-sliced.design/) |
| MVC / MVVM in the frontend | 🟡 | 45m | `#patterns` | [MDN: MVC ⭐](https://developer.mozilla.org/en-US/docs/Glossary/MVC) |
| Clean architecture / layering | 🔴 | 1h | `#architecture` | [The Clean Architecture ⭐](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html) |
| Domain-Driven Design (frontend) | 🔴 | 1.5h | `#ddd` | [DDD reference ⭐](https://www.domainlanguage.com/ddd/reference/) |
| Dependency injection | 🟡 | 45m | `#patterns` | [patterns.dev ⭐](https://www.patterns.dev/) |
| State architecture (where state lives) | 🔴 | 1h | `#state` `#architecture` | [State management ⭐](../13-state-management/) |

## Scaling to many teams

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Micro-frontends | 🔴 | 2h | `#micro-frontends` `#scale` | [martinfowler.com: micro frontends ⭐](https://martinfowler.com/articles/micro-frontends.html) |
| Module Federation | 🔴 | 1.5h | `#micro-frontends` `#bundling` | [Module Federation ⭐](https://module-federation.io/) |
| Monorepos (Nx / Turborepo) | 🔴 | 1.5h | `#monorepo` `#scale` | [Turborepo ⭐](https://turborepo.com/docs) |
| Design systems | 🔴 | 1.5h | `#design-systems` | [Design Systems Handbook ⭐](https://www.designbetter.co/design-systems-handbook) |
| Component libraries & API design | 🟡 | 1h | `#components` `#design-systems` | [react.dev ⭐](https://react.dev/learn/sharing-state-between-components) |
| Design tokens | 🟡 | 45m | `#design-systems` `#theming` | [W3C: design tokens ⭐](https://tr.designtokens.org/format/) |
| Plugin / extension systems | 🔴 | 1h | `#extensibility` | [VS Code extension API ⭐](https://code.visualstudio.com/api) |
| Versioning & release strategy | 🟡 | 45m | `#tooling` | [Changesets ⭐](https://github.com/changesets/changesets) |

## Delivery & cross-cutting

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Rendering strategy selection (CSR/SSR/SSG/ISR) | 🔴 | 1h | `#rendering` | [web.dev: rendering on the web ⭐](https://web.dev/articles/rendering-on-the-web) |
| Backend-for-Frontend (BFF) | 🟡 | 45m | `#api` `#architecture` | [samnewman.io: BFF ⭐](https://samnewman.io/patterns/architectural/bff/) |
| Build tooling (Vite/Webpack/esbuild) | 🟡 | 1h | `#bundling` `#tooling` | [Vite ⭐](https://vitejs.dev/guide/why.html) |
| Error handling & observability | 🟡 | 45m | `#reliability` | [Sentry docs ⭐](https://docs.sentry.io/) |
| Feature flags & experimentation | 🔴 | 1h | `#architecture` | [martinfowler.com ⭐](https://martinfowler.com/articles/feature-toggles.html) |
| Internationalization architecture | 🟡 | 45m | `#i18n` | [FormatJS ⭐](https://formatjs.io/docs/getting-started/installation/) |
| CI/CD for frontend | 🟡 | 45m | `#tooling` | [GitHub Actions ⭐](https://docs.github.com/en/actions) |

## ❓ Rapid-fire architecture interview questions

Real architecture questions asked at the SDE-2 / senior / staff level. Answer out loud, then verify above.

1. What are **micro-frontends** and when would you use (or avoid) them?
2. What is **Module Federation**?
3. **Monorepo vs polyrepo** — trade-offs?
4. How do you design a **reusable component library API**?
5. What is a **design system** and what does it include?
6. What are **design tokens**?
7. How do you **structure a large frontend codebase** (feature-based/FSD)?
8. What is a **Backend-for-Frontend (BFF)**?
9. How do you decide **CSR vs SSR vs SSG** for a project?
10. What is **dependency injection** on the frontend?
11. How do you share **state across micro-frontends**?
12. How do you **version and release** shared packages?
13. What is **atomic design**?
14. How do you **enforce architectural boundaries** in a codebase?
15. How do you roll out changes safely with **feature flags**?

---

**Related:** [06-react](../06-react/) · [13-state-management](../13-state-management/) · [18-design-patterns](../18-design-patterns/) · [19-build-your-own](../19-build-your-own/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
