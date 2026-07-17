<div align="center">

# Caching (HTTP + browser)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#networking` `#performance`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — There are two caches, not one. **Freshness** (`Cache-Control: max-age`) decides whether the browser can skip the network entirely; **validation** (`ETag`/`Last-Modified`) decides whether a revalidation round trip returns a cheap `304` or a full body. The whole game is: make static assets *fresh forever* with a content hash, and make HTML *always revalidate*.

---

## 🧠 Mental model

A cache hit isn't binary. Sort every response into one of three outcomes, because each has a different cost:

| Outcome | Network? | Cost | Trigger |
|---|---|---|---|
| **Fresh** | none | ~0ms | still within `max-age` |
| **Revalidated** | 1 RTT, empty body | TTFB only | stale + `ETag` matches → `304` |
| **Miss** | 1 RTT, full body | TTFB + transfer | no entry, or `no-store` |

The staff-level insight: **freshness removes the round trip; validation only removes the download.** A `304 Not Modified` still costs you a full latency round trip — great for a 2MB image, near-worthless for a 1KB JSON on a 200ms link. People proudly cite their high 304 rate as if it were a hit rate. It isn't.

## ⚙️ How it actually works

**Freshness** is set by the server and honoured without asking anyone:

- `Cache-Control: max-age=31536000, immutable` — cache for a year, and `immutable` tells the browser *don't even revalidate on reload*. Only safe with a hashed filename.
- `Cache-Control: no-cache` — misleadingly named: it means "store it, but **revalidate every time** before use". Not "don't cache".
- `Cache-Control: no-store` — the real opt-out. Never written to disk. Use for anything user-sensitive.
- `private` vs `public` — `private` forbids shared/CDN caches but allows the browser; `public` allows both.

**Validation** kicks in once an entry goes stale. The browser sends the validator it stored, and the server compares:

```
If-None-Match: "a1b2c3"        ← echoes the stored ETag
If-Modified-Since: Wed, ...     ← echoes stored Last-Modified
→ 304 Not Modified (empty body)  or  200 (fresh body + new validator)
```

`ETag` beats `Last-Modified` because it's exact — `Last-Modified` has 1-second granularity and breaks for files that change sub-second or get restored from backup with a new mtime.

**`stale-while-revalidate=60`** is the pattern most people miss: serve the stale copy *instantly* (0ms) and revalidate in the background for next time. You trade one slightly-stale render for zero latency — usually the right call for avatars, config, non-critical data.

## 💻 Code

The cache-busting strategy that actually works — the "two buckets" split:

```
# Hashed static assets → cache forever, never revalidate.
/assets/app.4f2a9c.js   Cache-Control: public, max-age=31536000, immutable

# HTML entry point → never trust the cache, always check.
/index.html             Cache-Control: no-cache
```

Because the filename contains a content hash, a new deploy produces a *new URL* (`app.9be1.js`), so there's nothing stale to invalidate — the old URL is simply never requested again. The only thing that must revalidate is the HTML that points at those hashes.

```js
// Service Worker: explicit control when HTTP headers aren't enough.
self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/config')) {
    // stale-while-revalidate, by hand
    e.respondWith(caches.open('cfg').then(async (cache) => {
      const cached = await cache.match(e.request);
      const fetching = fetch(e.request).then((res) => {
        cache.put(e.request, res.clone()); // refresh for next time
        return res;
      });
      return cached || fetching; // instant if we have anything
    }));
  }
});
```

## ⚖️ Trade-offs

- **`immutable` + hashed names is the single highest-leverage caching decision** you can make, and it costs nothing. Everything else is refinement.
- **Long `max-age` on *unhashed* URLs is a footgun** — you cannot invalidate it. Users are stuck with the old asset until it expires. If you can't hash the URL, keep `max-age` short and lean on `ETag`.
- **The Service Worker cache outranks HTTP caching and can strand users on a broken build.** A bad `install` handler shipped to prod persists across reloads. Powerful, but it's a cache you now have to *operate*, with versioning and cleanup logic.
- **Don't cache authenticated responses as `public`.** A shared CDN can serve user A's data to user B. Use `private` or `no-store`.

## 💣 Gotchas interviewers probe

- **`no-cache` does NOT mean "don't cache".** It means "cache, but revalidate before every use". `no-store` is the one that skips storage. Getting this backwards is the classic tell.
- **A `304` is not free.** It's a full round trip that saves only the download. On tiny payloads over high latency, aggressive revalidation is *slower* than a cache miss would've been on a fast link.
- **`Vary: Accept-Encoding` and friends matter** — forget `Vary` and a CDN can serve a gzipped body to a client that asked for brotli, or the wrong language variant.
- **Hard reload (Ctrl+Shift+R) bypasses the cache entirely** and sets `Cache-Control: no-cache` on requests — so "it works when I hard-reload" tells you nothing about real users.
- **Back/forward cache (bfcache) is a different beast** — a full-page snapshot including JS heap. An unload/`beforeunload` listener silently disqualifies the page from it, tanking navigation speed.

## 🎯 Say this in the interview

> "I think in two layers: freshness and validation. Freshness — `Cache-Control: max-age` — lets the browser skip the network completely, so it's the big win. Validation — `ETag` or `Last-Modified` — only saves the download; you still pay a round trip for the `304`. So my default architecture is the two-bucket split: static assets get a content hash in the filename plus `max-age=31536000, immutable`, which means a deploy produces new URLs and there's nothing to invalidate; the HTML entry point gets `no-cache` so it always revalidates and picks up the new hashes. For semi-dynamic data I reach for `stale-while-revalidate` to serve instantly and refresh in the background. And I'm careful about the two classic traps — `no-cache` means revalidate not skip, and never mark authenticated responses `public`."

## 🔗 Go deeper

- [MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) — the definitive header reference, including `immutable` and `stale-while-revalidate`.
- [web.dev — Love your cache](https://web.dev/articles/love-your-cache) — the two-bucket hashing strategy, explained by the Chrome team.
- [Jake Archibald — Caching best practices](https://jakearchibald.com/2016/caching-best-practices/) — still the clearest mental model of `max-age` vs revalidation on the web.
- [web.dev — bfcache](https://web.dev/articles/bfcache) — the cache most people forget exists, and how to stop disqualifying yourself from it.
