<div align="center">

# Compression (gzip/brotli)

<sub>📡 Networking · 🟢 Easy · ⏱ 30m · `#performance`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Text compresses ~70–90%, so gzip/brotli are the cheapest big win on the wire. The client advertises support with `Accept-Encoding`; the server picks and marks it with `Content-Encoding`. Rule of thumb: **Brotli (static, max level) for build-time assets, gzip or low-level Brotli for dynamic responses, and never compress already-compressed formats.**

---

## 🧠 Mental model

Compression works because text is *redundant* — HTML, JS, CSS, and JSON repeat tokens (`<div`, `function`, `"id":`) constantly, and a compressor replaces repeats with short back-references. Images, video, and fonts are *already* compressed, so running gzip over a JPEG wastes CPU to make it slightly **bigger**.

The negotiation is a two-line HTTP handshake:

```
Request:   Accept-Encoding: br, gzip          ← "I can decode these"
Response:  Content-Encoding: br                ← "I used Brotli"
           Vary: Accept-Encoding              ← "cache separately per encoding"
```

So the real decisions are only: **which algorithm**, **what level**, and **compress at build time or per request?**

## ⚙️ How it actually works

**gzip (DEFLATE)** is universal — every client and proxy understands it, and it's fast enough to run per-request on dynamic responses.

**Brotli (`br`)** is newer, compresses text **~15–25% smaller than gzip** at comparable speed, and ships with a **built-in dictionary of common web strings** (HTML tags, JS keywords) that gives it an edge on small files. Supported by all modern browsers over HTTPS.

The subtlety is **compression level vs cost**:

- **Static assets** (your bundled JS/CSS) are compressed **once at build/deploy time** at the **maximum level** (`brotli -q 11`, `gzip -9`). You pay the expensive CPU once and serve the tiny result forever — this is why you precompress `app.js.br` alongside `app.js`.
- **Dynamic responses** (an API JSON payload generated per request) must compress **on the fly**, so max level is too slow — a Brotli level 11 on every request would melt your CPU. Use gzip, or **Brotli at a low level (4–5)**, which beats gzip's ratio at similar speed.

`Content-Encoding` (end-to-end, the resource *is* compressed) differs from `Transfer-Encoding` (hop-by-hop). And **`Vary: Accept-Encoding` is mandatory** so a cache doesn't hand a Brotli body to a client that only speaks gzip.

## 💻 Code

```nginx
# Server: negotiate automatically. Serve PRECOMPRESSED static .br/.gz if present,
# otherwise compress dynamic responses on the fly — but only text types.
gzip on;
gzip_types text/plain text/css application/javascript application/json image/svg+xml;
gzip_comp_level 6;                 # dynamic: balance CPU vs ratio (NOT 9)
gzip_min_length 1024;              # don't bother below ~1KB — overhead > savings

brotli on;
brotli_static on;                  # serve app.js.br built at deploy time (level 11)
brotli_comp_level 5;               # dynamic Brotli: low level, still beats gzip
brotli_types text/css application/javascript application/json image/svg+xml;
```

```js
// Build step: precompress static assets at MAX level, once.
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';
const js = readFileSync('dist/app.js');
writeFileSync('dist/app.js.br',
  brotliCompressSync(js, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
writeFileSync('dist/app.js.gz',
  gzipSync(js, { level: 9 })); // fallback for the rare client without br
```

## ⚖️ Trade-offs

- **Compression is almost always worth it for text** — a 90% smaller payload dwarfs the CPU cost, especially on slow mobile links. It's one of the highest ROI perf changes you can make.
- **Never compress already-compressed binaries.** JPEG/PNG/WebP/MP4/WOFF2 gain ~0% and cost CPU (and can slightly *inflate*). Restrict `*_types` to text-like MIME types.
- **Tiny responses aren't worth it.** Below ~1KB the gzip/Brotli header and framing overhead can exceed the savings; set a `min_length`.
- **Max level is for static only.** **When NOT to use Brotli-11:** on dynamic, per-request responses — the compression time blows your latency budget and CPU. Match level to whether the work is amortized.
- **Compression + secrets = BREACH/CRIME.** Compressing responses that reflect user input alongside a secret (CSRF token) can leak it via size side-channels. Don't compress sensitive dynamic responses that mix secrets with attacker-controlled input.

## 💣 Gotchas interviewers probe

- **`gzip_comp_level 9` on dynamic responses is a trap.** The ratio gain over level 6 is marginal but the CPU cost is large — for per-request work it hurts throughput. Level 9 belongs to build-time static compression only.
- **Forgetting `Vary: Accept-Encoding`** lets a shared cache serve a Brotli body to a gzip-only client (or a compressed body to a proxy that strips encoding), producing garbage. Always vary.
- **Double compression.** If your app compresses and then the CDN/proxy compresses again, you waste CPU and can corrupt the `Content-Encoding` header. Compress in exactly one place.
- **Brotli only over HTTPS in browsers.** Browsers advertise `br` in `Accept-Encoding` only on secure origins — expect gzip on plain HTTP.
- **Compressing images/fonts.** WOFF2 is already Brotli-compressed internally; re-compressing it is pure waste. SVG, however, is text — *do* compress it.
- **HTTP/2 header compression is separate.** HPACK/QPACK compress *headers*; `Content-Encoding` compresses the *body*. Interviewers sometimes conflate them.

## 🎯 Say this in the interview

> "Compression is the cheapest large win on the wire because text is hugely redundant — HTML, JS, JSON compress 70–90%. The client sends `Accept-Encoding`, the server picks and responds with `Content-Encoding`, and I always add `Vary: Accept-Encoding` so caches don't cross the streams. My rule is to match algorithm and level to whether the work is amortized: static build assets get Brotli at level 11, precompressed once at deploy and served forever, because Brotli beats gzip by 15–25% on text and has a web dictionary that helps small files. Dynamic per-request responses can't afford level 11, so I use gzip around level 6 or Brotli at a low level like 4–5. And I never compress already-compressed formats — JPEGs, WOFF2, video gain nothing and cost CPU, so I scope the MIME types and set a minimum size around 1KB. The one security note is BREACH: don't compress responses that mix a secret token with reflected user input."

## 🔗 Go deeper

- [web.dev — Reduce network payloads using text compression](https://web.dev/articles/reduce-network-payloads-using-text-compression) — gzip vs Brotli, levels, and static precompression.
- [MDN — `Content-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Encoding) — the header semantics and negotiation.
- [MDN — `Accept-Encoding`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Encoding) — how clients advertise support and quality values.
