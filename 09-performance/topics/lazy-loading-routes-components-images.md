<div align="center">

# Lazy loading (routes/components/images)

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#loading`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Lazy loading defers fetching a resource **until it's actually needed** — a route on navigation, a component on interaction, an image as it nears the viewport. It shrinks the critical path, but the art is **loading *just before* the user needs it** so the deferral is invisible. Lazy-loading something the user needs *right now* just adds a spinner.

---

## 🧠 Mental model

Every resource sits somewhere on a spectrum from "needed for first paint" to "maybe never needed." Lazy loading pushes everything you can toward *on-demand* and keeps the critical path lean.

```
NOW (eager)          SOON (prefetch on intent)        MAYBE (pure lazy)
─────────────────────────────────────────────────────────────────────▶
above-the-fold img   next route on hover              modal, export dialog
app shell            image about to scroll in         admin-only panels
```

The core tension: **defer too little and you bloat the initial load; defer too much and you stall the interaction.** The winning move is *anticipatory* loading — start the fetch on a signal of intent (hover, focus, scroll-approach) so the resource is warm by the time it's actually used. Done right, lazy loading is invisible; done naively, it's a spinner tax on everything.

## ⚙️ How it actually works

**Routes** — the biggest win. Each route becomes a dynamic-`import()` chunk fetched on navigation. Pair with **prefetch on link hover/focus** so the chunk is cached before the click. Frameworks (React Router, Next.js) do the split-and-prefetch automatically for links in the viewport.

**Components** — `React.lazy(() => import('./X'))` behind `Suspense`. Ideal for things gated on interaction (modals, editors, charts) or below the fold. Prefetch on the *intent* event (button `mouseenter`) rather than waiting for the click.

**Images & iframes** — the native, zero-JS path: `loading="lazy"`. The browser only fetches the resource as it approaches the viewport (with a generous rootMargin so it's ready by the time it's visible). For finer control — trigger animations, load background images, lazy-init widgets — use **`IntersectionObserver`**, which fires a callback when an element crosses a viewport threshold, off the main thread and far cheaper than scroll listeners.

The non-negotiable pairing: **lazy images need explicit `width`/`height` (or `aspect-ratio`)**, otherwise the late-arriving image has no reserved space and shoves the layout down — a CLS disaster. Lazy loading and layout stability are the same problem viewed twice.

The one thing you must **never** lazy-load: the **LCP image**. It's the most important pixel on the page; deferring it directly delays your LCP. Above-the-fold hero images should be `loading="eager"` with `fetchpriority="high"`.

## 💻 Code

```jsx
// ✅ Route + component lazy loading with Suspense.
const Settings = lazy(() => import('./routes/Settings'));

<Suspense fallback={<PageSkeleton />}>
  <Route path="/settings" element={<Settings />} />
</Suspense>

// ✅ Prefetch the chunk on intent so navigation feels instant.
<Link
  to="/settings"
  onMouseEnter={() => import('./routes/Settings')}  // warm the cache
/>
```

```html
<!-- ✅ Native lazy images — but ALWAYS reserve space to avoid CLS. -->
<img src="thumb.jpg" loading="lazy" width="400" height="300" alt="…" />

<!-- ❌ The LCP hero — do NOT lazy-load it. Prioritise it instead. -->
<img src="hero.jpg" loading="eager" fetchpriority="high" width="1200" height="600" alt="…" />
```

```js
// ✅ IntersectionObserver for anything the native attr can't cover.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    loadWidget(e.target);          // init map, fetch bg image, play video…
    io.unobserve(e.target);        // one-shot
  }
}, { rootMargin: '200px' });       // start 200px early so it's ready in time

document.querySelectorAll('[data-lazy]').forEach((el) => io.observe(el));
```

## ⚖️ Trade-offs

- **Lazy loading trades initial bytes for a possible mid-session wait.** If the deferred resource lands on a critical interaction, you've relocated the delay, not removed it. Anticipatory prefetch (hover/scroll-approach) is what makes it a net win.
- **Every lazy boundary needs a fallback UI.** A skeleton or reserved box is mandatory — a raw spinner that pops in and shifts layout is worse than eager loading. Design the loading state, don't bolt it on.
- **Don't lazy-load above-the-fold or the LCP element.** It's on screen at load; deferring it just adds latency and risks CLS. Eager-load and prioritise instead.
- **Over-eager prefetching wastes data**, especially on mobile/metered connections. Prefetch on *intent*, and consider `navigator.connection.saveData` before speculatively fetching.

## 💣 Gotchas interviewers probe

- **Never lazy-load the LCP image.** The most common self-inflicted LCP regression. Above-the-fold hero → `eager` + `fetchpriority="high"`.
- **Lazy images without `width`/`height` cause CLS.** Reserve space with dimensions or `aspect-ratio` — lazy loading and layout stability must be solved together.
- **`IntersectionObserver` beats scroll listeners.** Scroll handlers fire constantly on the main thread; IO is async, batched, and off the critical path. Using `onscroll` for lazy loading in 2024 is a red flag.
- **`React.lazy` needs Suspense and a default export**, and doesn't do SSR out of the box (use framework-level lazy or `React.lazy` with a loadable pattern for streaming).
- **`content-visibility: auto`** is the underrated cousin — it skips rendering (layout + paint) of off-screen sections entirely, cutting main-thread work, not just network. Pair with `contain-intrinsic-size` to avoid scrollbar jump.
- **Prefetch vs preload vs lazy** — `preload` = need it *now*, high priority; `prefetch` = might need it *next*, idle priority; lazy = fetch *when* needed. Mixing them up is a common confusion.

## 🎯 Say this in the interview

> "Lazy loading defers fetching until a resource is needed — routes on navigation via dynamic import, components on interaction with `React.lazy` and Suspense, images with native `loading=\"lazy\"` or IntersectionObserver for anything custom. The principle I lead with is that the goal isn't just to defer, it's to load *just before* the user needs it, so I prefetch route chunks on link hover and images with a generous rootMargin — deferral should be invisible. Two hard rules: I never lazy-load the LCP image, because that directly delays my largest paint; above-the-fold heroes get `eager` and `fetchpriority=\"high\"`. And every lazy image gets explicit dimensions or an aspect-ratio, because a late image with no reserved space is a CLS bug. I also reach for `content-visibility: auto` to skip rendering off-screen sections, which saves main-thread work, not just network."

## 🔗 Go deeper

- [web.dev — Lazy loading](https://web.dev/articles/lazy-loading) — strategies across images, video, and JS.
- [MDN — Lazy loading (loading attribute)](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading) — the native path and its caveats.
- [MDN — IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — the correct primitive for visibility-triggered loading.
- [web.dev — content-visibility](https://web.dev/articles/content-visibility) — skipping off-screen rendering work.
