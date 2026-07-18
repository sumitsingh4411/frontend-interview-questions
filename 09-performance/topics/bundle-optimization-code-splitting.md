<div align="center">

# Bundle optimization & code splitting

<sub>🚀 Performance · 🔴 Hard · ⏱ 1.5h · `#bundling`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Code splitting breaks one giant bundle into chunks loaded **on demand**, so the initial download only ships what the first paint needs. The lever is the **dynamic `import()`** — it's a code-split point the bundler honours. The goal isn't "smaller total JS"; it's **less JS on the critical path**, because JS is the most expensive byte you ship (download *plus* parse *plus* execute).

---

## 🧠 Mental model

A byte of JavaScript costs far more than a byte of image or CSS. An image byte is decoded off the main thread; a JS byte must be **downloaded, parsed, compiled, and executed** on the main thread — the same thread that handles interactions. So 300 KB of JS doesn't just cost network time; it costs **main-thread time** that blocks INP and delays hydration.

```
One bundle (bad):    [████████████████ everything ████████████████]  ships on every page
Split (good):        [██ core ██][ route-A ][ route-B ][ modal ][ chart ]
                       ↑ initial   ↑ loaded when you navigate/interact
```

The reframing: **your bundle is a budget, not a build artifact.** Every module a user downloads but doesn't use on this page is pure tax. Code splitting is how you defer that tax until (and unless) it's actually incurred.

## ⚙️ How it actually works

Bundlers build a **module graph** from your imports. A **static** `import` pulls the target into the current chunk. A **dynamic** `import()` returns a Promise and tells the bundler: *emit this subtree as a separate chunk, fetch it at runtime.* That single syntactic difference is the entire mechanism.

The natural split points, in priority order:

1. **Per route.** The single biggest win — no reason to ship the settings page's code to someone on the login screen. Frameworks wire this via lazy routes.
2. **Below-the-fold / on-interaction components.** Modals, date pickers, rich text editors, charts. Load when the user opens them.
3. **Heavy libraries behind conditions.** A 200 KB PDF renderer only when someone clicks "export".
4. **Vendor / shared chunks.** Long-lived dependencies split into their own chunk with a **content hash** so they cache across deploys — changing your app code doesn't bust React's chunk.

Two forces to balance: **too few chunks** ships dead code; **too many tiny chunks** means request overhead and a waterfall of dependent fetches. HTTP/2 multiplexing softens the request cost, but a *deep* dependency chain (chunk A must load before it knows it needs chunk B) is still latency you feel. The fix for waterfalls is **preloading** the next chunk before it's needed.

**Analyse before you split.** Run a bundle analyzer, find the actually-large modules (moment.js locales, a duplicated lib, an accidental barrel import pulling a whole UI kit), and split *those*. Splitting blindly adds complexity without moving bytes.

## 💻 Code

```jsx
// ❌ Everything in the initial bundle — the chart lib ships even to
//    users who never scroll to the dashboard.
import Dashboard from './Dashboard';
import HeavyChart from './HeavyChart';

// ✅ Route-level split: React.lazy + Suspense. Chunk fetched on navigation.
const Dashboard  = lazy(() => import('./Dashboard'));
const HeavyChart = lazy(() => import('./HeavyChart'));

<Suspense fallback={<Skeleton />}>
  <Route path="/dashboard" element={<Dashboard />} />
</Suspense>
```

```js
// ✅ On-interaction split: don't pay for the editor until they click "Edit".
editButton.addEventListener('click', async () => {
  const { RichTextEditor } = await import('./RichTextEditor'); // its own chunk
  mount(RichTextEditor);
});
```

```js
// ✅ Kill the waterfall: warm the chunk on intent (hover/focus),
//    so it's cached by the time the click happens.
link.addEventListener('mouseenter', () => import('./NextPage'), { once: true });
```

```html
<!-- Tell the browser to fetch a known-critical async chunk early -->
<link rel="modulepreload" href="/chunks/route-checkout.abc123.js" />
```

## ⚖️ Trade-offs

- **Splitting trades initial payload for runtime latency.** The deferred chunk still has to load *when you need it* — if that moment is on a critical interaction, you've just moved the jank. Preload on intent (hover/route-prediction) to hide it.
- **Over-splitting backfires.** Dozens of 2 KB chunks create request overhead and a dependency waterfall that's slower than one 40 KB chunk. Aim for meaningful boundaries, not maximal granularity.
- **Don't split what's always needed.** Core shell, above-the-fold UI, and code the first interaction depends on should stay in the initial bundle. Lazy-loading the thing on screen just adds a spinner.
- **Hashing + caching is the quiet win.** A stable vendor chunk means a code change ships a small app chunk while React stays cached — long-term this beats one-time size cuts.

## 💣 Gotchas interviewers probe

- **The goal is critical-path JS, not total JS.** A site can ship *more* total JavaScript after splitting and still be faster, because the initial load shrank. Candidates who optimise total size miss the point.
- **JS is uniquely expensive** — parse + compile + execute on the main thread, unlike images. This is *why* JS is the first thing to split.
- **Dynamic `import()` is the split point.** Bundlers only split at `import()`; a conditional static import doesn't split. Know the syntactic trigger.
- **Barrel files (`index.js` re-exports) silently kill tree-shaking and splitting** — importing one icon can pull the whole library into a chunk. A classic hidden bloat source.
- **`React.lazy` needs a `default` export** and must be wrapped in `Suspense` — a common "why is it crashing" gotcha.
- **Chunk waterfalls.** Route → component → data can be three sequential fetches. `modulepreload` or preload-on-hover flattens it.
- **Compression matters as much as splitting** — Brotli over gzip on your JS is a free ~15–20% on the wire. Measure the *transferred* size, not the raw size.

## 🎯 Say this in the interview

> "Code splitting breaks one bundle into chunks loaded on demand so the initial download only carries what the first paint and first interaction need. The mechanism is the dynamic `import()` — that's the only thing bundlers split on. I frame the bundle as a budget: JavaScript is the most expensive byte because it's parse-plus-compile-plus-execute on the main thread, which directly hurts INP and hydration, so my priority is minimising *critical-path* JS, not total JS. In practice I split per route first — that's the biggest win — then lazy-load heavy on-interaction components like editors and charts, and I keep long-lived vendor deps in a content-hashed chunk so they stay cached across deploys. The two traps I watch for are over-splitting into a request waterfall, which I fix by preloading the next chunk on hover intent, and barrel imports quietly pulling whole libraries in. And I always run a bundle analyzer first — split what's actually big, not on a hunch."

## 🔗 Go deeper

- [web.dev — Reduce JavaScript payloads with code splitting](https://web.dev/articles/reduce-javascript-payloads-with-code-splitting) — the canonical case and technique.
- [MDN — Dynamic import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import) — the split-point primitive.
- [react.dev — lazy](https://react.dev/reference/react/lazy) — `React.lazy` + Suspense mechanics and pitfalls.
- [web.dev — The cost of JavaScript](https://web.dev/articles/cost-of-javascript-2019) — why JS bytes are the expensive ones.
