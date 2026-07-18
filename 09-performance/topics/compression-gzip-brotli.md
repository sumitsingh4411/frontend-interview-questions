<div align="center">

# Compression (gzip/brotli)

<sub>🚀 Performance · 🟢 Easy · ⏱ 30m · `#networking`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Text compression is the single highest-leverage byte reduction on the web: Brotli typically beats gzip by 15–25% on JS/CSS/HTML, and the real skill is knowing to compress **once at build time** at max level for static files, but at a **low, fast level on the fly** for dynamic responses — because compressing every request at level 11 will melt your server.

---

## 🧠 Mental model

Your JS/CSS/HTML is astonishingly repetitive — the same keywords, the same class names, the same JSON keys, over and over. Compression algorithms (both gzip's DEFLATE and Brotli's LZ77+context modeling) find those repeats and replace them with back-references. On typical bundles you get **60–80% reduction** on text. That's not a micro-optimization; it's often the difference between a 1MB and a 250KB transfer.

The mental split that matters: **static assets you compress once, ahead of time** (spend the CPU lavishly — nobody's waiting). **Dynamic responses you compress per-request** (CPU is on the hot path, so use a cheap level). Getting this backwards is the classic mistake — either shipping fat static files at gzip level 1, or pegging a CPU core compressing every API response at Brotli 11.

## ⚙️ How it actually works

**Content negotiation.** The browser sends `Accept-Encoding: gzip, deflate, br, zstd`. The server picks one it supports and responds with `Content-Encoding: br` plus `Vary: Accept-Encoding` (so caches don't serve a Brotli body to a client that only speaks gzip). Miss the `Vary` header behind a CDN and you'll poison caches.

**Brotli's edge** comes from two things: better entropy coding, and a built-in **~120KB static dictionary** of common web strings (`<!DOCTYPE html>`, `function`, `content-type`, …), so even small files compress well where gzip's window has nothing to reference yet.

**Levels are the whole game.** Brotli goes 0–11, gzip 1–9. Compression time rises *superlinearly* while gains flatten:

| Content | Where | Level | Why |
|---|---|---|---|
| Static JS/CSS/HTML | build/CDN | **Brotli 11** | compressed once, served millions of times — max it out |
| Dynamic HTML/JSON | server, per request | **Brotli 4–5** / gzip 6 | ~gzip-quality output at a fraction of the CPU |

Brotli 11 can be **10–20× slower** than Brotli 5 for maybe 2–5% extra savings — a terrible trade on the request path, an obvious win at build time.

**Don't double-compress.** Already-compressed formats (PNG, JPEG, WebP, AVIF, WOFF2, MP4, `.zip`) gain ~nothing and waste CPU — WOFF2 is *already* Brotli internally. Only compress text-ish MIME types.

## 💻 Code

```nginx
# Static Brotli, precompressed at build time and served as-is (zero runtime CPU):
brotli_static on;              # serve app.js.br if it exists
gzip_static  on;               # fall back to app.js.gz for non-Brotli clients

# Dynamic responses: compress on the fly, but at a CHEAP level.
brotli            on;
brotli_comp_level 5;           # NOT 11 on the request path
brotli_types      text/plain text/css application/javascript application/json
                  image/svg+xml application/xml;   # text only — never jpeg/png/woff2
```

```js
// Build step: precompress static assets at MAX level, once.
import { brotliCompressSync, constants, gzipSync } from 'node:zlib';

const brotli = brotliCompressSync(bundle, {
  params: { [constants.BROTLI_PARAM_QUALITY]: 11 }, // build time → spend the CPU
});
const gzip = gzipSync(bundle, { level: 9 });        // fallback for old clients
// emit app.js.br and app.js.gz next to app.js; server picks per Accept-Encoding
```

```http
# The response headers that make it correct:
Content-Encoding: br
Vary: Accept-Encoding      # ← without this, a shared cache serves br to a gzip-only client
```

## ⚖️ Trade-offs

- **Brotli 11 vs gzip 9 is a clear win for static assets** (smaller, and the CPU is free at build time). For dynamic content the honest comparison is *Brotli 4–5 vs gzip 6* — similar CPU, Brotli usually a bit smaller.
- **When NOT to compress:** binary/already-compressed payloads (images, video, fonts, archives). You burn CPU for <1% and can even grow the file slightly.
- **Tiny responses aren't worth it.** Below ~1KB the gzip/Brotli header overhead and CPU dominate; most servers skip bodies under a threshold for good reason.
- **`zstd`** is now shipping in browsers — comparable ratio to Brotli with dramatically faster compression, making it attractive for the *dynamic* path. Worth knowing, not yet universal.

## 💣 Gotchas interviewers probe

- **Missing `Vary: Accept-Encoding` poisons shared caches** — a CDN caches the Brotli body and later hands it to a client that can't decode it, or vice versa. The subtle bug behind "works for me, broken for some users."
- **Compressing already-compressed assets** (JPEG, WOFF2, MP4) wastes CPU for zero benefit and signals you don't understand the mechanism.
- **BREACH/CRIME:** compressing responses that mix a **secret (CSRF token) with attacker-controlled input** can leak the secret via response-size side channels. Mitigation is length randomization / not reflecting user input alongside secrets — an interviewer loves this one.
- **Level 11 on the fly** is a self-inflicted DoS: a spike in traffic pegs every CPU core on compression instead of serving.
- **Compression happens *before* TLS**, so it can't help you dodge TLS — and it's why the CRIME attack existed at the TLS layer originally.

## 🎯 Say this in the interview

> "Text compression is usually the biggest single byte win — 60–80% off JS, CSS, and HTML. Brotli beats gzip by roughly 15–25% on text, partly from a built-in dictionary of common web strings, so I default to it with gzip as a fallback via `Accept-Encoding`. The nuance I'd stress is levels: for *static* assets I precompress at build time at Brotli 11 because the CPU is free and it's served millions of times; for *dynamic* responses I compress per-request at a cheap level like Brotli 4 or 5, because level 11 on the hot path will pin your CPUs for a couple percent of extra savings. I only compress text — never images, fonts, or video, which are already compressed — and I always send `Vary: Accept-Encoding` so a CDN doesn't hand a Brotli body to a gzip-only client. And I'd flag BREACH: don't compress a response that reflects user input next to a secret."

## 🔗 Go deeper

- [web.dev — Reduce network payloads with text compression](https://web.dev/articles/reduce-network-payloads-using-text-compression) — the ratios and the static-vs-dynamic split.
- [MDN — `Content-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) — negotiation, `Vary`, and supported encodings.
- [CertSimple — Brotli levels benchmark](https://certsimple.com/blog/nginx-brotli) — real level-vs-time-vs-size numbers that justify "11 static, ~5 dynamic".
- [MDN — `Accept-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) — how the client advertises what it can decode.
