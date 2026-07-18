<div align="center">

# Progressive enhancement

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 30m · `#basics` `#a11y`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Build in layers: **HTML that works alone**, then CSS to style it, then JS to enhance it. If any upper layer fails to load or run, the layer beneath still delivers the core task. It's the opposite of graceful degradation — you start from the floor, not the ceiling.

---

## 🧠 Mental model

Three layers, each optional above the first:

```
JS   ─ enhancement  (nice-to-have: instant validation, no full reload)
CSS  ─ presentation (looks good, but content is readable without it)
HTML ─ content + function  (the task COMPLETES here, JS or not)
```

The load-bearing idea: **the network is hostile and JS is the most fragile layer.** Scripts fail — a CDN blip, a parse error, an ad blocker, a flaky mobile connection during the 3 seconds before your bundle loads. Progressive enhancement asks: *if the JS never arrives, can the user still do the thing?* For a checkout, a search, a login — the answer should be yes.

Contrast with **graceful degradation**, which builds the full JS experience first and *then* patches fallbacks. PE is more robust because the baseline is guaranteed, not retrofitted.

## ⚙️ How it actually works

The mechanism is **the platform's own fallbacks**, which already work without JS:

- A `<form>` with `action`/`method` submits over HTTP on its own — no `fetch` required.
- An `<a href>` navigates on its own — no router required.
- `<input type="email" required>` validates in the browser — no JS validator required.
- `<details>`/`<summary>` expands — no accordion library required.

You then **layer JS on top** by intercepting these behaviours: `e.preventDefault()` on the form and do a `fetch` for a smoother experience — but only *after* confirming JS ran. The server must still accept the plain submission, so the feature works during the hydration gap and for the ~1% of sessions where JS silently fails.

This is why frameworks are converging back on it: React Server Components, Remix, and HTMX all lean on server-rendered HTML + forms that work before hydration. "JS-optional core, JS-enhanced experience" is now mainstream architecture, not a nostalgia trip.

## 💻 Code

```html
<!-- ✅ Works with zero JS: the browser submits and validates. -->
<form action="/search" method="get">
  <input type="search" name="q" required aria-label="Search" />
  <button>Search</button>
</form>
```

```js
// Enhance ONLY if JS is available and succeeds. The form still works if this fails.
document.querySelector('form')?.addEventListener('submit', async (e) => {
  e.preventDefault();                       // upgrade to async...
  const res = await fetch('/search?' + new URLSearchParams(new FormData(e.target)));
  renderResults(await res.text());          // ...but the server route still exists
});
```

```css
/* Feature-query enhancement: fall back gracefully where unsupported. */
.grid { display: flex; flex-wrap: wrap; }         /* baseline */
@supports (display: grid) {
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); }
}
```

## ⚖️ Trade-offs

- **PE adds server-side duplication:** a form that works without JS needs a real server endpoint *and* the enhanced client path. That's more code — the payoff is resilience and no hydration-gap dead zone.
- **Not everything degrades sensibly.** A real-time collaborative canvas or a 3D editor has no meaningful no-JS baseline. Forcing PE there is dogma; the honest baseline is "here's what this needs to run."
- **When NOT to insist on it:** internal tools, dashboards behind auth, and heavily interactive apps where every user has JS and SEO/reach don't matter. PE's dividends are highest on public, high-reach, conversion-critical pages.
- **It doubles as an accessibility and performance strategy** — semantic HTML baseline is what screen readers and slow devices get first.

## 💣 Gotchas interviewers probe

- **PE vs graceful degradation** — the definitional question. PE builds up from a working baseline; GD builds down from the full experience and adds fallbacks.
- **"No-JS" isn't the point; *resilience during the gap* is.** Even with 99% JS, there's a window between HTML paint and hydration where only the baseline works — PE covers it.
- **`<div onclick>` is the anti-pattern** — it needs JS to do anything, isn't focusable, and isn't keyboard-operable. A real `<a>`/`<button>` works without JS *and* is accessible for free.
- **Feature detection, not browser sniffing** — use `@supports` / `if ('IntersectionObserver' in window)`, never user-agent strings.
- **Server must accept the un-enhanced request.** Preventing default and never building the server route is fake PE.
- **SEO overlap** — the HTML baseline is exactly what crawlers consume.

## 🎯 Say this in the interview

> "Progressive enhancement means building in layers: HTML that completes the core task on its own, CSS for presentation, and JS purely as an enhancement — so if the JS layer fails, and it's the most fragile layer, the user can still do the thing. Concretely, a search or checkout is a real `<form>` with an action that the browser can submit by itself; then I intercept the submit with `preventDefault` and a `fetch` for a smoother experience, but the server endpoint still exists. This is the opposite of graceful degradation, which starts from the full JS experience and retrofits fallbacks. The reason it still matters even when everyone has JS is the hydration gap — there's always a window where only the HTML baseline is live — and it doubles as an accessibility and SEO strategy because semantic HTML is what screen readers and crawlers get first."

## 🔗 Go deeper

- [MDN — Progressive enhancement](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) — the canonical definition.
- [MDN — Graceful degradation](https://developer.mozilla.org/en-US/docs/Glossary/Graceful_degradation) — the contrast, side by side.
- [A List Apart — Understanding progressive enhancement](https://alistapart.com/article/understandingprogressiveenhancement/) — the essay that framed the layered model.
- [MDN — @supports (feature queries)](https://developer.mozilla.org/en-US/docs/Web/CSS/@supports) — the CSS enhancement primitive.
