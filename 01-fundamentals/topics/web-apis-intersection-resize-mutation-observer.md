<div align="center">

# Web APIs (Intersection/Resize/Mutation Observer)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#web-api`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The three observers exist to kill three classic performance disasters: **scroll handlers** (→ IntersectionObserver), **resize handlers + `getBoundingClientRect` in a loop** (→ ResizeObserver), and **polling the DOM for changes** (→ MutationObserver). They're all async, batched, and — critically — run *without* forcing synchronous layout.

---

## 🧠 Mental model

Before observers, you watched for things by **asking repeatedly on the main thread** — a `scroll` listener firing 60+ times a second, each call doing `el.getBoundingClientRect()` (which forces layout). Observers invert this: you *declare interest*, and the browser notifies you **off the hot path, in batches**, using geometry it already computed. You stop polling and start subscribing.

| Observer | Watches | Replaces |
|---|---|---|
| **IntersectionObserver** | element ↔ viewport/root visibility | `scroll` + `getBoundingClientRect` |
| **ResizeObserver** | an element's own box size | `window.onresize` + manual measuring |
| **MutationObserver** | DOM tree/attribute/text changes | polling, deprecated Mutation Events |

## ⚙️ How it actually works

**IntersectionObserver** answers "is this element in view?" *asynchronously*, computed by the browser's compositor rather than your JS. You give it a `root` (default: viewport), `rootMargin` (grow/shrink the trigger box — `'200px'` fires 200px *before* the element enters, ideal for lazy-loading), and `threshold` (0 = any pixel, 1 = fully visible, or an array for scroll-scrubbing). The callback receives entries with `isIntersecting` and `intersectionRatio`. This is what powers native lazy-loading, infinite scroll, and impression tracking — all without a single scroll handler.

**ResizeObserver** fires when an element's *content box* changes size — including from CSS, flexbox reflow, or siblings pushing it, none of which `window.resize` catches. It's the correct tool for container queries in JS, responsive charts, and auto-growing textareas. Its callback gives `contentRect` and `borderBoxSize` so you never call `getBoundingClientRect()` yourself.

**MutationObserver** batches DOM mutations and delivers them as microtasks *after* the current script finishes — so a hundred `appendChild` calls produce one callback, not a hundred. You configure what to watch (`childList`, `attributes`, `subtree`, `characterData`). It replaced the old synchronous Mutation Events, which fired per-change and were a documented performance catastrophe.

**The shared property that makes them fast:** all three deliver notifications in a **batched, asynchronous** way that avoids *layout thrashing* — the read-write-read-write pattern that forces the browser to recompute layout synchronously mid-frame. The observer already has the measurements; you just read them.

## 💻 Code

Lazy-loading images — the canonical IntersectionObserver win:

```js
// ❌ The old way: a scroll handler measuring every image every frame.
window.addEventListener('scroll', () => {
  imgs.forEach((img) => {
    const r = img.getBoundingClientRect(); // forces layout, ×N, ×60fps
    if (r.top < innerHeight) load(img);
  });
});

// ✅ Declare interest; the browser notifies you, off the main thread.
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (!e.isIntersecting) continue;
    e.target.src = e.target.dataset.src; // load it
    io.unobserve(e.target);              // stop watching — one-shot
  }
}, { rootMargin: '200px' });             // start 200px early, so it's ready

imgs.forEach((img) => io.observe(img));
```

ResizeObserver, with the loop-guard everyone forgets:

```js
const ro = new ResizeObserver((entries) => {
  for (const e of entries) {
    const w = e.contentRect.width;       // no getBoundingClientRect needed
    e.target.classList.toggle('is-narrow', w < 400); // JS container query
  }
});
ro.observe(chartEl);
// ⚠️ If the callback changes the observed element's size, you risk
// "ResizeObserver loop limit exceeded". Mutate a DIFFERENT box, or debounce.
```

## ⚖️ Trade-offs

- **IntersectionObserver is async by design — that's a feature, not a bug.** The callback lags the actual scroll position by a frame or two. For *impression* tracking that's fine; for pixel-perfect scroll-linked animation you may need `scroll`-driven animations (CSS) or `requestAnimationFrame`.
- **Don't reach for MutationObserver to react to your *own* state changes.** If *you* control the DOM, update your app state directly. MutationObserver is for watching DOM you *don't* own — third-party widgets, `contenteditable`, extensions.
- **Observers must be disconnected.** They hold references to their targets; forgetting `unobserve`/`disconnect` on teardown (especially in React effects) is a real memory leak.
- **A `subtree: true` MutationObserver on a large tree can fire a lot.** Scope it as tightly as possible; the callback runs for every matching mutation.

## 💣 Gotchas interviewers probe

- **IntersectionObserver replaces scroll handlers *because it doesn't force layout*.** The senior point isn't "it's cleaner" — it's that scroll+`getBoundingClientRect` forces synchronous layout every frame, and the observer uses geometry the compositor already has.
- **`window.resize` doesn't fire when an element resizes due to CSS/flex/content** — only when the *viewport* changes. That's the whole reason ResizeObserver exists; conflating them is the tell.
- **"ResizeObserver loop limit exceeded"** — caused by resizing the observed element *inside* its own callback, creating a feedback loop. Common and confusing the first time.
- **MutationObserver batches into microtasks** — you get one callback for many mutations, and it runs *after* the current synchronous code. People expect synchronous, per-change delivery (the old Mutation Events behaviour).
- **`rootMargin` uses CSS-like syntax and can be negative** — negative values shrink the trigger box, e.g. "fire only when 50% past centre". Underused.
- **The first IntersectionObserver callback fires immediately** on observe with the current state — not only on the next change. Handle the initial entry.

## 🎯 Say this in the interview

> "These three exist to replace three anti-patterns that all share the same root cause — doing measurement work on the main thread in a hot loop. IntersectionObserver replaces scroll handlers for visibility: instead of a `scroll` listener calling `getBoundingClientRect` every frame — which forces synchronous layout — I declare which elements I care about and the browser notifies me asynchronously using geometry it already has. That's what powers lazy-loading and impression tracking. ResizeObserver watches an element's *own* box, which `window.resize` never catches because that only fires on viewport change — so it's how I do container queries or responsive charts in JS. MutationObserver watches DOM I don't own, batching many changes into one microtask callback. The through-line is: stop polling, subscribe; and none of them force a synchronous layout, which is the actual performance win. I always disconnect them on teardown to avoid leaks."

## 🔗 Go deeper

- [MDN — IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) — `root`, `rootMargin`, `threshold`, and the entry shape.
- [MDN — ResizeObserver API](https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver) — content box vs border box, and the loop-limit warning.
- [MDN — MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) — configuration options and batched delivery.
- [web.dev — Browser-level lazy loading](https://web.dev/articles/browser-level-image-lazy-loading) — when `loading="lazy"` makes the observer unnecessary.
