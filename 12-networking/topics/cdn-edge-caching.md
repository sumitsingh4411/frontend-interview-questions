<div align="center">

# CDN & edge caching

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#cdn` `#caching`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A CDN is a fleet of caches placed physically **close to users**; requests hit the nearest edge (via anycast), get served in single-digit milliseconds on a hit, and only "miss" back to your origin occasionally. It cuts latency, offloads your origin, and absorbs traffic spikes — but only if you get **cache keys and invalidation** right.

---

## 🧠 Mental model

Latency is bounded by physics: a round-trip from Sydney to a Virginia origin is ~200ms *before* your server does anything. A CDN defeats this by **moving the response to the user**, not the user to the response. Thousands of edge PoPs (points of presence) each hold a copy; **anycast routing** sends each user to the topologically nearest one.

```
Without CDN:  User (Sydney) ───── 200ms+ ─────▶ Origin (Virginia)   every request

With CDN:     User (Sydney) ─ 5ms ─▶ Edge (Sydney)  ── HIT: done
                                        │
                                        └── MISS ── 200ms ──▶ Origin  (once, then cached)
```

The mental model: **the CDN is a shared HTTP cache you don't run, sitting in front of your origin.** It obeys the same `Cache-Control` rules as the browser — with its own shared-cache directives (`s-maxage`) and its own invalidation controls.

## ⚙️ How it actually works

**The cache key** is what makes two requests "the same object". By default it's method + host + path + query, and honours `Vary`. This is where correctness lives: if your key includes a `?utm_source=...` tracking param, every campaign link is a separate cache entry and your **hit rate collapses**. If it *ignores* a param that genuinely changes the response, you serve the wrong body. Tuning the cache key (strip tracking params, normalize) is the highest-leverage CDN knob.

**Freshness at the edge** uses `Cache-Control: s-maxage` (shared-cache TTL, overrides `max-age` for CDNs) and `public`. `private` or `no-store` tells the CDN *not* to cache — critical for per-user responses.

**Invalidation** is the hard part. Two tools: **purge** (actively evict an object now — slow-ish, rate-limited, use sparingly) and **versioned URLs** (change the path so the old object is simply never requested — instant, free, preferred). This is *exactly* why we ship content-hashed filenames.

**Modern CDNs cache dynamic content too**: `stale-while-revalidate` serves stale instantly while refreshing; **ESI/edge functions** and **edge compute** (Cloudflare Workers, Lambda@Edge) let you personalize or assemble responses *at the edge* without a full origin trip.

## 💻 Code

```http
# ✅ Static, content-hashed asset: cache hard at edge AND browser.
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable
# /static/app.7f3a9c.js

# ✅ Cacheable HTML with fast personalization window:
#   browsers revalidate; the CDN holds 60s and serves stale up to a day while refreshing.
Cache-Control: public, max-age=0, s-maxage=60, stale-while-revalidate=86400

# ✅ Per-user / secret: never let a SHARED cache store it.
Cache-Control: private, no-store
```

```js
// Cache-key hygiene at a CDN edge worker: strip tracking params so
// /page?utm_source=x and /page are ONE cache entry (huge hit-rate win).
export default {
  async fetch(request) {
    const url = new URL(request.url);
    for (const p of ['utm_source', 'utm_medium', 'fbclid', 'gclid']) {
      url.searchParams.delete(p);
    }
    const key = new Request(url, request);           // normalized cache key
    const cache = caches.default;
    let res = await cache.match(key);
    if (!res) {
      res = await fetch(request);                     // MISS → origin
      if (res.ok) await cache.put(key, res.clone());  // populate edge
    }
    return res;
  },
};
```

## ⚖️ Trade-offs

- **CDNs are near-mandatory for static assets and huge for cacheable HTML/APIs**, but they add a layer that can cache *wrong*. A bad cache key or a leaked `Set-Cookie` in a cached response can serve one user's data to another — a genuine security incident, not just a bug.
- **Invalidation is eventually consistent.** A purge propagates across PoPs over seconds; you cannot assume "purged" means "gone everywhere now". Versioned URLs sidestep this entirely — prefer them.
- **When NOT to lean on it:** highly personalized, per-request dynamic responses (a logged-in feed) get near-zero hit rate — caching them risks leaks for no gain. Cache the *shell*, fetch the personalized parts client-side or at the edge.
- **Cost and complexity.** Egress pricing, another config surface, and debugging "why is this stale in Tokyo but fresh in London" across PoPs. Worth it at scale; overkill for a tiny internal tool.

## 💣 Gotchas interviewers probe

- **Cache key + query params.** Tracking params exploding your cache into millions of unique entries (killing hit rate) is *the* classic CDN failure. Strip or normalize them.
- **Caching a `Set-Cookie` response.** If a per-user response with a session cookie gets cached publicly, the CDN hands that cookie to the next visitor. Ensure user responses are `private`/`no-store`, and strip `Set-Cookie` from cacheable ones.
- **`s-maxage` overrides `max-age` for shared caches only.** Interviewers check you know browsers use `max-age`, the CDN uses `s-maxage`, and they're set independently.
- **`Vary: Cookie` or `Vary: *` destroys cacheability.** Varying on a header that's unique per user means every request is a miss. Be surgical — usually only `Vary: Accept-Encoding`.
- **Cold cache / first hit is slow.** Right after a deploy or purge, everything's a miss and origin load spikes. **Cache stampede**: many concurrent misses for the same key all hit origin at once — mitigate with request coalescing / `stale-while-revalidate`.
- **Origin shielding.** Without a designated shield PoP, every edge misses to origin independently, multiplying origin load by the number of PoPs.

## 🎯 Say this in the interview

> "A CDN is a shared HTTP cache the provider runs for me, spread across edge PoPs close to users, with anycast routing each request to the nearest one — so a hit is single-digit milliseconds and origin only sees the occasional miss. It obeys the same `Cache-Control` semantics as the browser, with `s-maxage` as the shared-cache TTL. The two things I focus on are cache keys and invalidation. Cache keys decide correctness and hit rate: I strip tracking params like `utm_*` so campaign links don't shatter the cache into millions of entries, and I make sure per-user responses are `private`/`no-store` so a session cookie never gets served to the next visitor. For invalidation I strongly prefer versioned, content-hashed URLs over active purges, because a new URL is instant and global while a purge is eventually consistent across PoPs. For dynamic content I lean on `stale-while-revalidate` and edge compute to personalize without a full origin round-trip."

## 🔗 Go deeper

- [Cloudflare — What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) — PoPs, anycast, and the hit/miss model.
- [MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) — shared vs private caches and `s-maxage`.
- [web.dev — Love your cache](https://web.dev/articles/love-your-cache) — cache keys, hit rate, and practical CDN tuning.
