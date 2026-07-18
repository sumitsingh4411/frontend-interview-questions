<div align="center">

# Font loading strategy

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#fonts`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Web fonts are **render-blocking for text**: the browser won't paint text in a custom font until the font file loads, so a bad setup gives you invisible text (FOIT) or a jarring reflow (FOUT). The strategy is: **self-host, subset, preload the critical font, use `font-display: swap`, and pre-match metrics** so the fallback→web-font swap doesn't shift layout (CLS).

---

## 🧠 Mental model

A custom font can't be used until three sequential things finish: **discover** the font (buried in CSS), **download** the file, **apply** it. Until then the browser must choose between two bad options:

```
FOIT — invisible text:  [          ] → [ Hello ]   text hidden until font loads
FOUT — flash of unstyled: [ Hello ] → [ Hello ]    fallback shown, then swaps
                            (fallback)   (web font)   ← this swap can shift layout → CLS
```

The reframing: **you don't get to avoid the swap — you only get to control what the user sees during it, and whether it's disruptive.** FOUT (readable fallback immediately, swap later) almost always beats FOIT (blank text). The remaining problem is that the fallback and the web font have different metrics, so the swap reflows text — and *that's* the CLS you actually fight.

## ⚙️ How it actually works

**Discovery is the hidden delay.** A `@font-face` in an external stylesheet isn't discovered until that CSS downloads and parses — and the font only *starts* downloading when a rendered element actually uses it. That's a chain of round-trips. **`<link rel="preload">`** short-circuits it: the browser fetches the font in parallel with the CSS, before it knows it's needed.

**`font-display`** dictates behaviour during the ~3s "block" and later "swap" periods:

| Value | Block period | After | Use for |
|---|---|---|---|
| `swap` | 0s — fallback shows immediately | swaps to web font whenever it lands | body text (readability first) |
| `block` | ~3s invisible | then swaps | icon fonts, where fallback glyphs are wrong |
| `fallback` | ~100ms invisible | short swap window, else keep fallback | balance |
| `optional` | ~100ms | **no swap** if slow; may skip font entirely | zero-CLS, font is "nice to have" |

`optional` is the CLS purist's choice — on a slow connection it just uses the fallback and never swaps, so no reflow ever happens (the font gets cached for next visit).

**Subsetting** ships only the glyphs you use. A full font has Cyrillic, Greek, symbols you'll never render; `unicode-range` splits it so the browser downloads only the Latin subset for a Latin page. Combined with **WOFF2** (best compression, universal support), a font can drop from 200 KB to 20 KB.

**Metric matching kills the swap-CLS.** Pick a fallback whose metrics are close, then fine-tune with `size-adjust`, `ascent-override`, and `descent-override` on an `@font-face` for the fallback so the fallback occupies *the same space* as the web font. When the swap happens, nothing moves. This is what `next/font` and Fontaine automate.

## 💻 Code

```html
<!-- ✅ Preload the ONE critical font (the one in your LCP/above-the-fold text).
     crossorigin is required even same-origin — fonts are fetched in CORS mode. -->
<link rel="preload" href="/fonts/inter-latin.woff2" as="font"
      type="font/woff2" crossorigin />
```

```css
/* ✅ Self-hosted, subset, swap, WOFF2 only. */
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-latin.woff2') format('woff2');
  font-weight: 100 900;              /* variable font: one file, all weights */
  font-display: swap;                /* readable text immediately */
  unicode-range: U+0000-00FF;        /* Latin subset only */
}

/* ✅ Metric-matched fallback so the swap causes ZERO layout shift. */
@font-face {
  font-family: 'Inter-fallback';
  src: local('Arial');
  size-adjust: 107%;                 /* tuned so Arial fills the same box */
  ascent-override: 90%;
  descent-override: 22%;
}
body { font-family: 'Inter', 'Inter-fallback', sans-serif; }
```

```css
/* ❌ The classic mistakes:
   - hosting on a third-party origin  → extra DNS/TLS + no preload benefit
   - default font-display (auto ≈ block) → FOIT, invisible text for up to 3s
   - shipping the full multi-script WOFF/TTF → 200KB when 20KB would do */
```

## ⚖️ Trade-offs

- **`swap` vs `optional`.** `swap` guarantees your font renders but risks a late swap and CLS on slow networks. `optional` guarantees no CLS but may not show your font at all on the first visit. Choose per brand tolerance: marketing site → `swap`; performance-obsessed app → `optional` with metric-matched fallbacks.
- **Self-host vs Google Fonts CDN.** Self-hosting removes a cross-origin connection, lets you preload, and avoids the third-party fetching *its own* CSS first (a two-hop chain). The CDN's edge caching rarely beats that today (and cross-site cache sharing was removed for privacy). Self-host by default.
- **Variable fonts** save requests (one file, all weights/widths) but a single variable file can be *larger* than one static weight — if you only use Regular and Bold, two static subsets may be lighter. Measure.
- **Don't preload everything.** Preload is a priority *jump*; preloading five fonts contends with your LCP image. Preload the one font in above-the-fold text, no more.

## 💣 Gotchas interviewers probe

- **`crossorigin` on font preload is mandatory** — even same-origin. Fonts fetch in CORS mode, so a preload without `crossorigin` fetches the file *twice* (once uncredentialed for the preload, once for the real request). A very common silent double-download.
- **FOIT vs FOUT** — default `font-display: auto` behaves like `block` (FOIT): text is *invisible* for up to 3s. `swap` gives FOUT (readable fallback → swap). Readable-then-swap beats blank.
- **The font swap is a CLS source**, not just a visual flash. Metric-matched fallbacks (`size-adjust`/`ascent-override`) are how you get the font *and* zero shift.
- **Fonts don't download until an element uses them** — declaring `@font-face` alone fetches nothing. That's why discovery is slow and preload matters.
- **Icon fonts should use `block`, not `swap`** — a fallback glyph for an icon is a wrong-looking box; better to wait. (Better still: SVG icons.)
- **WOFF2 only.** WOFF/TTF/EOT fallbacks are legacy; every modern browser supports WOFF2. Shipping the older formats is dead weight.

## 🎯 Say this in the interview

> "Web fonts are render-blocking for text, so my goal is to never show invisible text and never let the font swap shift layout. Concretely: I self-host the fonts so there's no extra cross-origin hop and I can preload; I subset to just the glyphs I need and ship WOFF2 only, which can take a font from 200K to 20K; I preload the one font used in above-the-fold text, with `crossorigin` — which is required even same-origin or the browser downloads it twice; and I set `font-display: swap` so readable fallback text shows immediately. The subtle part is that the fallback-to-web-font swap is itself a CLS source, so I metric-match the fallback with `size-adjust` and `ascent-override` so it occupies the same space and nothing moves when the real font lands — that's what `next/font` automates. If I want a hard zero-CLS guarantee I'd use `font-display: optional`, accepting that a slow first visit might not show the custom font at all."

## 🔗 Go deeper

- [web.dev — Optimize web fonts](https://web.dev/learn/performance/optimize-web-fonts) — the full loading strategy, end to end.
- [MDN — font-display](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) — exact block/swap/fallback/optional semantics.
- [web.dev — Prevent layout shifts with the CSS `size-adjust`](https://web.dev/blog/font-fallbacks) — metric-matched fallbacks that kill swap-CLS.
- [MDN — Preloading fonts](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload#including_media) — why `crossorigin` is required on font preloads.
