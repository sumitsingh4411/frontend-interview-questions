<div align="center">

# How the web works (request → render)

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 30m · `#networking` `#basics`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A URL becomes pixels in two halves: **get the bytes** (DNS → TCP → TLS → HTTP) and **turn bytes into pixels** (HTML→DOM, CSS→CSSOM, render tree → layout → paint → composite). Every frontend performance lever you will ever pull lives in one of those two halves.

---

## 🧠 Mental model

Most people memorise the sequence and stop there. The useful framing is that the whole pipeline is a **chain of round trips followed by a chain of main-thread work**, and you only have three moves:

1. **Remove a round trip** (caching, `preconnect`, HTTP/2, TLS 1.3 resumption).
2. **Start work earlier** (preload scanner, `preload`, streaming SSR, early hints).
3. **Do less main-thread work** (less CSS, less JS, fewer layouts).

If you can classify any optimisation into one of those three buckets, you actually understand this topic.

## ⚙️ How it actually works

**Phase 1 — getting the bytes**

| Step | Cost | What people miss |
|---|---|---|
| URL parse + HSTS | ~0 | An HSTS entry turns `http://` into `https://` **before** any request — no redirect round trip. |
| DNS | 0–120ms | Four caches deep: browser → OS → router → resolver. Usually free; brutal when cold. |
| TCP handshake | 1 RTT | QUIC/HTTP-3 folds transport + crypto into ~1 RTT (0 on resume). |
| TLS handshake | 1–2 RTT | TLS 1.3 is 1 RTT; session resumption can be 0-RTT. |
| HTTP request → first byte | 1 RTT + server think-time | This is **TTFB**. It is a *server* and *network* metric, not a rendering one. |

The critical insight: on a cold connection you have paid **~3–4 round trips before a single byte of HTML arrives**. On a 100ms RTT link that is ~300–400ms you cannot code your way out of — you can only avoid it (`preconnect`, fewer origins, HTTP/2 to reuse one connection).

**Phase 2 — bytes into pixels**

The HTML arrives as a *stream*, and the browser does not wait for it all:

1. **HTML → DOM**, incrementally, as chunks land.
2. **The preload scanner** runs *ahead* of the main parser, speculatively fetching `<img>`, `<script>`, `<link>` it can see in the raw markup. This is the single most underrated part of the pipeline.
3. **CSS → CSSOM.** CSS is **render-blocking**: the browser will not paint until it has the CSSOM, because painting with the wrong styles then repainting is a flash of unstyled content.
4. **DOM + CSSOM → render tree** — only what will be shown. `display: none` nodes are excluded entirely; `visibility: hidden` nodes are *included* (they occupy layout).
5. **Layout (reflow)** — compute geometry: where and how big.
6. **Paint** — fill in pixels, into layers.
7. **Composite** — the GPU assembles layers. `transform`/`opacity` can be done here alone, which is exactly why they are the cheap things to animate.

## 💻 Code

Resource hints let you buy back round trips *before* the parser reaches the resource:

```html
<!-- Warm the connection: DNS + TCP + TLS, in parallel with HTML parsing. -->
<link rel="preconnect" href="https://api.example.com" crossorigin />

<!-- DNS only. Cheaper, weaker — use when you may not need the origin. -->
<link rel="dns-prefetch" href="https://cdn.example.com" />

<!-- "I will definitely need this, and the preload scanner can't see it." -->
<link rel="preload" as="font" type="font/woff2" href="/f/inter.woff2" crossorigin />
```

Script loading is where most people fumble the detail:

```html
<script src="a.js"></script>              <!-- blocks the parser. Worst. -->
<script src="a.js" async></script>        <!-- runs the moment it lands; ORDER NOT GUARANTEED -->
<script src="a.js" defer></script>        <!-- runs after parse, IN ORDER. Usually what you want. -->
<script src="a.js" type="module"></script><!-- deferred by default -->
```

## ⚖️ Trade-offs

- **`preload` is a loaded gun.** It fetches at high priority and *competes for bandwidth* with things that may matter more. Preloading everything is identical to preloading nothing, only slower.
- **More origins = more handshakes.** Sharding assets across domains was an HTTP/1.1 trick to escape the 6-connection limit. Under HTTP/2 it is actively harmful — you pay a fresh DNS+TCP+TLS per origin and lose multiplexing.
- **SSR trades TTFB for FCP.** The server does work before the first byte (worse TTFB), but the user sees content far sooner (better FCP/LCP). Streaming SSR gets you both.

## 💣 Gotchas interviewers probe

- **"Is CSS parser-blocking?"** No — it is *render*-blocking. But a `<script>` that follows a `<link rel=stylesheet>` **will** wait for the CSSOM, because the script might call `getComputedStyle()`. So CSS *can* block the parser transitively. This is the answer that separates people.
- **HTTP/2 multiplexing removes head-of-line blocking — at the HTTP layer only.** A single lost TCP packet still stalls every stream, because HOL blocking simply moved down to TCP. That is the actual reason QUIC/HTTP-3 exists (it runs over UDP).
- **The preload scanner cannot see what does not exist.** Resources injected by JavaScript (`document.createElement('img')`) are invisible to it and start late. This is a large hidden cost of client-rendered apps.
- **TTFB is not FCP is not LCP.** A fast TTFB with a 2MB render-blocking bundle is still a blank screen.
- **`async` on a dependency-ordered script is a race condition**, not an optimisation.

## 🎯 Say this in the interview

> "I'd split it into getting the bytes and painting the bytes. Getting the bytes is DNS, TCP, TLS, then the HTTP request — that's roughly three round trips before any HTML, which is why `preconnect` and connection reuse matter more than micro-optimising payloads on high-latency links. Then the browser streams the HTML into the DOM, with a preload scanner running ahead to start fetching subresources early. CSS is render-blocking because painting unstyled content and repainting would flash. DOM plus CSSOM gives the render tree, then layout, paint, composite. Once I've got that pipeline, I can hang each metric off it — TTFB on the network phase, FCP/LCP on the render phase, INP on main-thread availability afterwards — and every fix is either removing a round trip, starting work earlier, or doing less main-thread work."

Then stop, and let them pick the branch they want to go deep on.

## 🔗 Go deeper

- [MDN — How the web works](https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Web_standards/How_the_web_works) — the clean baseline.
- [web.dev — Critical rendering path](https://web.dev/articles/critical-rendering-path) — the render half, precisely.
- [High Performance Browser Networking](https://hpbn.co/) — the network half. Free, and still the definitive text.
- [Inside look at a modern web browser](https://developer.chrome.com/blog/inside-browser-part1) — what the process/thread architecture is really doing.
