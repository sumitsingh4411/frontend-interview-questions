<div align="center">

<img src="banner.svg" alt="09 · Frontend Performance" width="100%" />

</div>

Every system-design answer is judged on this. Know the metrics, know how to move them.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 31 Performance questions across 5 categories →](question-bank/README.md)**

## Metrics

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Core Web Vitals overview](topics/core-web-vitals-overview.md) | 🟡 | 45m | `#metrics` | [web.dev: Web Vitals ⭐](https://web.dev/articles/vitals) |
| [LCP (Largest Contentful Paint)](topics/lcp-largest-contentful-paint.md) | 🟡 | 45m | `#metrics` `#lcp` | [web.dev: LCP ⭐](https://web.dev/articles/lcp) |
| [CLS (Cumulative Layout Shift)](topics/cls-cumulative-layout-shift.md) | 🟡 | 45m | `#metrics` `#cls` | [web.dev: CLS ⭐](https://web.dev/articles/cls) |
| [INP (Interaction to Next Paint)](topics/inp-interaction-to-next-paint.md) | 🔴 | 1h | `#metrics` `#inp` | [web.dev: INP ⭐](https://web.dev/articles/inp) |
| [TTFB](topics/ttfb.md) | 🟡 | 30m | `#metrics` | [web.dev: TTFB ⭐](https://web.dev/articles/ttfb) |
| [FCP & FID (legacy)](topics/fcp-fid-legacy.md) | 🟢 | 30m | `#metrics` | [web.dev: FCP ⭐](https://web.dev/articles/fcp) |
| [Lab vs field data (RUM)](topics/lab-vs-field-data-rum.md) | 🟡 | 45m | `#metrics` `#tooling` | [web.dev: RUM ⭐](https://web.dev/articles/user-centric-performance-metrics) |

## Loading performance

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Bundle optimization & code splitting](topics/bundle-optimization-code-splitting.md) | 🔴 | 1.5h | `#bundling` | [web.dev: code splitting ⭐](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting) |
| [Tree shaking & dead code](topics/tree-shaking-dead-code.md) | 🟡 | 45m | `#bundling` | [web.dev: tree shaking ⭐](https://web.dev/articles/reduce-javascript-payloads-with-tree-shaking) |
| [Lazy loading (routes/components/images)](topics/lazy-loading-routes-components-images.md) | 🟡 | 45m | `#loading` | [web.dev: lazy loading ⭐](https://web.dev/articles/lazy-loading) |
| [Image optimization (formats, responsive)](topics/image-optimization-formats-responsive.md) | 🟡 | 1h | `#images` | [web.dev: images ⭐](https://web.dev/learn/images) |
| [Font loading strategy](topics/font-loading-strategy.md) | 🟡 | 45m | `#fonts` | [web.dev: fonts ⭐](https://web.dev/learn/performance/optimize-web-fonts) |
| [Preload / prefetch / preconnect](topics/preload-prefetch-preconnect.md) | 🟡 | 45m | `#loading` | [web.dev: resource hints ⭐](https://web.dev/articles/preload-critical-assets) |
| [Compression (gzip/brotli)](topics/compression-gzip-brotli.md) | 🟢 | 30m | `#networking` | [web.dev: compression ⭐](https://web.dev/articles/reduce-network-payloads-using-text-compression) |
| [Critical CSS & above-the-fold](topics/critical-css-above-the-fold.md) | 🟡 | 45m | `#rendering` | [web.dev: critical CSS ⭐](https://web.dev/articles/extract-critical-css) |
| HTTP caching & service worker cache | 🟡 | 1h | `#caching` | [web.dev: HTTP cache ⭐](https://web.dev/articles/http-cache) |
| CDN & edge delivery | 🟡 | 45m | `#cdn` | [Cloudflare: CDN ⭐](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) |

## Runtime performance

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| List virtualization / windowing | 🔴 | 1.5h | `#large-data` `#rendering` | [Flagship ⭐](../06-react/build-a-virtualized-list.md) |
| Infinite scroll vs pagination | 🟡 | 45m | `#large-data` `#ux` | [Flagship ⭐](../15-system-design/design-news-feed.md) |
| Debounce/throttle & long-task splitting | 🟡 | 45m | `#interaction` | [web.dev: long tasks ⭐](https://web.dev/articles/optimize-long-tasks) |
| Rendering performance (reflow/repaint) | 🔴 | 1h | `#rendering` | [web.dev: rendering perf ⭐](https://web.dev/articles/rendering-performance) |
| [Avoid layout thrashing](topics/avoid-layout-thrashing.md) | 🔴 | 45m | `#rendering` | [web.dev ⭐](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) |
| [Web Workers offloading](topics/web-workers-offloading.md) | 🟡 | 1h | `#workers` | [web.dev: off main thread ⭐](https://web.dev/articles/off-main-thread) |
| [Memory leaks & profiling](topics/memory-leaks-profiling.md) | 🔴 | 1h | `#memory` | [Chrome DevTools ⭐](https://developer.chrome.com/docs/devtools/memory-problems) |
| React render optimization | 🔴 | 1h | `#react` | [React deep dive ⭐](../06-react/) |

## Tooling

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Lighthouse | 🟡 | 45m | `#tooling` | [Lighthouse ⭐](https://developer.chrome.com/docs/lighthouse/overview) |
| DevTools Performance panel | 🟡 | 1h | `#tooling` | [Chrome DevTools ⭐](https://developer.chrome.com/docs/devtools/performance) |
| Performance budgets | 🔴 | 45m | `#strategy` | [web.dev: budgets ⭐](https://web.dev/articles/performance-budgets-101) |
| Bundle analysis | 🟡 | 30m | `#bundling` `#tooling` | [webpack-bundle-analyzer ⭐](https://github.com/webpack-contrib/webpack-bundle-analyzer) |

## ❓ Rapid-fire web performance interview questions

Real performance interview questions. Answer out loud, then verify above.

1. What are the **Core Web Vitals** (LCP, CLS, INP) and their thresholds?
2. How do you **improve LCP**?
3. What causes **layout shift (CLS)** and how do you prevent it?
4. What is **INP** and how do you make interactions faster?
5. How does **code splitting** reduce bundle size?
6. What is **tree shaking**?
7. How do you **optimize images** (formats, `srcset`, lazy loading)?
8. **`preload` vs `prefetch` vs `preconnect`** — what's the difference?
9. How does **HTTP caching** improve performance?
10. What is **list virtualization** and when do you need it?
11. **Infinite scroll vs pagination** — performance trade-offs?
12. How do you **debounce/throttle** expensive handlers?
13. How do you **find and fix a memory leak**?
14. What is a **performance budget**?
15. How do you **measure** performance in the field (RUM vs lab)?
16. How do **web workers** improve responsiveness?

---

**Related:** [02-browser](../02-browser/) · [12-networking](../12-networking/) · [17-interview-patterns](../17-interview-patterns/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
