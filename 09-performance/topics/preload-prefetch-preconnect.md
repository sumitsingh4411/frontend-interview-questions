<div align="center">

# Preload / prefetch / preconnect

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#loading`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Resource hints let you fight the browser's discovery order: `preconnect` warms a *connection* before you need it, `preload` fetches a *this-page-critical* asset the parser hasn't reached yet, and `prefetch` speculatively pulls a *next-navigation* asset at idle priority. Wrong hint or wrong priority and you slow the page down.

---

## 🧠 Mental model

The browser is a greedy but short-sighted downloader: it can only request what it has already *discovered* in the markup. A font referenced deep inside a CSS file isn't discovered until the CSS is downloaded, parsed, and matched against the DOM — three round trips late. Resource hints are you telling the browser about things it will need *before* it would find them itself.

Line them up by **how early** and **how sure**:

| Hint | Buys you | Priority | You're saying |
|---|---|---|---|
| `dns-prefetch` | DNS lookup | idle | "you'll talk to this host" |
| `preconnect` | DNS + TCP + TLS | idle | "you'll talk to this host *soon*" |
| `preload` | the actual bytes | **high** | "you need *this file* on *this page*" |
| `prefetch` | the actual bytes | **lowest** | "you'll need this on the *next* page" |
| `modulepreload` | JS module + its deps | high | "preload this ES module graph" |

## ⚙️ How it actually works

**`preconnect`** front-loads the expensive part of a cross-origin request. Establishing a connection is ~3 round trips (DNS → TCP handshake → TLS handshake) — often 100–300ms before a single byte moves. Preconnecting to your API/font/image CDN during the HTML parse hides that latency behind work you're doing anyway. But an open connection that goes unused is wasted, and browsers cap unused preconnects (~10s), so only preconnect to origins you're **certain** to hit, and ideally only the 2–4 that matter most.

**`preload`** raises an asset's priority and starts it immediately, decoupled from parser discovery. The classic win: a `@font-face` font, or the LCP hero image that's set via CSS `background-image` (invisible to the preload scanner). `preload` demands the right `as` — `as="font"`, `as="image"`, `as="style"` — because it sets the Accept header, the priority, and the CSP bucket. Fonts additionally need `crossorigin` even same-origin, or you download the font **twice**.

**`prefetch`** fetches at the lowest priority into the HTTP cache for a *future* navigation — the product page a user is hovering, the next step in a wizard. It competes with nothing on the current page. This is the mechanism behind Next.js prefetching links in the viewport.

The preload scanner is the unsung hero here: a secondary parser that races ahead of the main HTML parser looking for fetchable URLs even while the main thread is blocked on a script. `preload` exists partly to feed assets it *can't* see (CSS-referenced fonts, JS-injected images).

## 💻 Code

```html
<!-- Warm the connection to your font/image CDN early. crossorigin matters for fonts/CORS. -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
<link rel="dns-prefetch" href="https://cdn.example.com" /> <!-- fallback for old browsers -->

<!-- Preload the LCP font. crossorigin is REQUIRED even same-origin, or it's fetched twice. -->
<link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossorigin />

<!-- Preload an LCP hero set via CSS background (preload scanner can't see it). -->
<link rel="preload" href="/hero.avif" as="image" fetchpriority="high" />

<!-- Speculatively fetch the likely next page's data/bundle at idle priority. -->
<link rel="prefetch" href="/dashboard.js" as="script" />
```

```html
<!-- ❌ preload without `as`: fetched at low priority, wrong headers, likely double-downloaded -->
<link rel="preload" href="/app.js" />

<!-- ✅ Priority Hints on a normal tag beat preload for the LCP <img> — no double-fetch risk -->
<img src="/hero.avif" fetchpriority="high" alt="…" />
```

## ⚖️ Trade-offs

- **`preload` is a priority *reallocation*, not free speed.** Bandwidth is finite — preloading a font at high priority steals it from something else. Preload the *one or two* assets on the critical path, not ten. Over-preloading is a classic self-inflicted regression.
- **When NOT to preload:** anything the preload scanner already finds (a normal `<img src>` or `<script src>` in the initial HTML). You'd just duplicate work. Reach for it only when discovery is *late* (CSS/JS-referenced) or priority is *wrong*.
- **`prefetch` costs the user's bandwidth and your egress** on pages they may never visit. Great on a wizard's next step; wasteful sprayed across every link on a data-plan phone.
- **`fetchpriority="high"` on the LCP image is usually better than preloading it** — it lifts the priority of the real element without the double-download footguns.

## 💣 Gotchas interviewers probe

- **Missing `crossorigin` on a font preload downloads it twice.** Fonts fetch in CORS mode; a preload without `crossorigin` sits in a different cache partition than the real request, so the browser can't reuse it. The single most common preload bug.
- **`preload` ≠ `prefetch`.** Preload is *this page, high priority, will be used now*. Prefetch is *next page, idle priority, might be used later*. Swapping them either wastes bandwidth or fails to help.
- **An unused `preload` triggers a console warning** ("was preloaded but not used within a few seconds") — usually a wrong `as`, a wrong URL, or a hint you forgot to delete.
- **`prerender` / Speculation Rules are a different, heavier tool** — they render the whole next page in the background. Powerful for near-certain navigations, but they run scripts and cost real memory.
- **Order and count matter.** Browsers process too many preconnects poorly; 4+ speculative connections can *delay* the connection you actually need.

## 🎯 Say this in the interview

> "Resource hints exist because the browser can only fetch what it's discovered, and discovery order is often wrong for performance. I reach for three: `preconnect` to hide the DNS-plus-TLS handshake for an origin I'm certain to use, like the font or image CDN — but only a couple, because idle connections get wasted. `preload` for a critical asset the parser finds too late, classically a CSS-referenced font or a CSS `background-image` LCP — and I always set the right `as`, and `crossorigin` on fonts or it downloads twice. `prefetch` is the opposite mood: idle-priority fetch of the *next* navigation's bundle. My rule is that hints are a priority budget, not free speed — I preload the one or two things on the critical path, and for the LCP image specifically I usually prefer `fetchpriority=\"high\"` on the real `<img>` over a preload."

## 🔗 Go deeper

- [web.dev — Preload critical assets](https://web.dev/articles/preload-critical-assets) — when preload actually helps, with the `as`/`crossorigin` rules.
- [web.dev — Establish network connections early](https://web.dev/articles/preconnect-and-dns-prefetch) — preconnect vs dns-prefetch and their cost.
- [MDN — `rel=preload`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/rel/preload) — the spec-accurate semantics and the double-fetch caveat.
- [web.dev — Fetch Priority](https://web.dev/articles/fetch-priority) — `fetchpriority` and why it often beats preloading the LCP image.
