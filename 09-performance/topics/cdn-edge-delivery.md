<div align="center">

# CDN & edge delivery

<sub>🚀 Performance · 🟡 Medium · ⏱ 45m · `#cdn`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A CDN is primarily a **latency** play, not a bandwidth one: it puts your bytes in a PoP near the user so the round trips are short and TLS/TCP setup is cheap. The hard part isn't caching static files — it's caching *dynamic* responses and invalidating them without serving stale data.

---

## 🧠 Mental model

Physics sets the floor. Light in fibre travels ~200 km/ms, so a user in Sydney hitting an origin in Virginia pays ~160ms *one way* before a single byte of application logic runs — and TLS + TCP is multiple round trips. A CDN doesn't make your server faster; it **moves the server closer** so those round trips shrink to single-digit milliseconds.

```
Without CDN:  Sydney user ──── 320ms RTT ────▶ Virginia origin
With CDN:     Sydney user ─ 8ms ─▶ Sydney PoP ─(warm cache)─▶ 🡐 done
                                        └─(miss)─ 320ms ─▶ origin (once)
```

The mental shift: a CDN is a **tiered, geographically distributed cache** whose real job is amortising one slow origin fetch across thousands of nearby users. TTFB collapses, connection setup is terminated at the edge, and your origin sees a fraction of the traffic.

## ⚙️ How it actually works

**Anycast routing.** One IP is announced from hundreds of PoPs; BGP routes each user to the topologically nearest one. No DNS geo-trickery needed for the connection itself.

**Cache keys and hit ratio.** The CDN keys responses on (by default) the URL. Anything that fragments the key — query strings, `Vary: Cookie`, `Vary: User-Agent` — multiplies your cache entries and craters hit ratio. A single `Set-Cookie` on a static asset can make it uncacheable at the edge entirely. **Hit ratio is the metric that matters**: a 95% vs 80% hit ratio is a 4× difference in origin load.

**Connection termination.** The edge terminates TLS and speaks HTTP/2 or HTTP/3 to the user over a warm, nearby connection, then reuses long-lived pooled connections back to origin. So even a *cache miss* is faster than hitting origin directly, because the expensive handshakes happen over the short leg.

**Invalidation** is the genuinely hard part. Two levers:
- **Purge** — actively evict a URL/tag. Fast but eventually-consistent across PoPs, and rate-limited.
- **`stale-while-revalidate` / `stale-if-error`** — serve the stale copy instantly while refetching in the background, or when origin is down. This is how you get both freshness *and* resilience.

**Edge compute** (Workers, Lambda@Edge) moves logic — A/B splits, auth checks, personalization, HTML assembly — into the PoP, so dynamic responses can still be cached or generated without the origin round trip.

## 💻 Code

```
# Static, fingerprinted asset: cache everywhere, forever.
# s-maxage targets shared caches (CDN); max-age targets the browser.
Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable

# Dynamic-but-cacheable (product page): 60s edge freshness, then serve
# stale for up to a day while revalidating — origin barely gets touched.
Cache-Control: public, s-maxage=60, stale-while-revalidate=86400, stale-if-error=86400

# ❌ This silently disables edge caching — the cookie fragments the key
Set-Cookie: session=...;    # on a response you also want the CDN to cache
```

```js
// Cloudflare-style edge worker: cache an API response with a custom key,
// stripping the auth header so all users share one cached entry.
export default {
  async fetch(request, env, ctx) {
    const cache = caches.default;
    const key = new Request(new URL(request.url).toString(), { method: 'GET' });

    let res = await cache.match(key);
    if (res) return res; // edge hit — never touches origin

    res = await fetch(request);
    res = new Response(res.body, res);
    res.headers.set('Cache-Control', 's-maxage=300');
    ctx.waitUntil(cache.put(key, res.clone())); // populate without blocking
    return res;
  },
};
```

## ⚖️ Trade-offs

- **A CDN mostly helps latency and origin offload, not throughput** for a single user — their local bandwidth is unchanged. The win is round-trip count and connection reuse.
- **Cache key discipline vs correctness.** Aggressive caching maximises hit ratio but risks serving one user's personalized page to another. Normalize the key deliberately; never cache anything keyed on a session cookie.
- **When NOT to lean on it:** truly per-user, uncacheable, low-traffic dynamic responses gain little beyond connection termination — and you've added a system that can serve stale content and needs purge tooling.
- **Purge is eventually consistent.** If you need instant global correctness, prefer versioned URLs (which never need purging) over purge-on-deploy.
- **Multi-CDN** buys resilience and better regional coverage at the cost of real operational complexity — worth it above a certain scale, over-engineering below it.

## 💣 Gotchas interviewers probe

- **`s-maxage` vs `max-age`.** `s-maxage` targets *shared* caches (the CDN); `max-age` targets the browser. You almost always want different values — short at the edge (easy to purge), longer or immutable in the browser for fingerprinted assets.
- **A rogue `Set-Cookie` or `Vary` header kills edge caching.** The single most common reason "the CDN isn't caching my stuff." Interviewers love this one.
- **Cache hit ratio, not raw speed, is the health metric.** Cold PoPs, over-fragmented keys, and short TTLs all show up as a low ratio and high origin load.
- **The first request to each PoP is a miss.** Global launches can stampede origin — use tiered caching / origin shield so PoPs fill from a regional parent, not all from origin.
- **CDNs cache the *response*, including errors.** A misconfigured `Cache-Control` on a 500 can pin an outage across the edge. Set `stale-if-error`, and be careful caching non-200s.
- **`getBoundingClientRect`-style personalization at the edge** requires reading geo/headers the CDN injects (`CF-IPCountry`), not the origin — know where the data lives.

## 🎯 Say this in the interview

> "I frame a CDN as a latency and origin-offload tool, not a bandwidth one. It puts a distributed cache in a PoP near the user, so round trips drop from hundreds of milliseconds to single digits and TLS gets terminated on the short leg — even a cache miss is faster because the handshakes are local. The real engineering is cache-key hygiene and invalidation: I use `s-maxage` for the edge and `max-age`/`immutable` for the browser, I keep anything with a `Set-Cookie` or a session-keyed `Vary` off the shared cache because it destroys hit ratio, and for dynamic-but-cacheable content I lean on `stale-while-revalidate` plus `stale-if-error` so I get freshness and resilience without hammering origin. The metric I actually watch is cache hit ratio, and for correctness I prefer versioned URLs over purging, since purge is only eventually consistent across PoPs."

## 🔗 Go deeper

- [Cloudflare — What is a CDN?](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) — the canonical primer on PoPs, caching, and delivery.
- [MDN — Cache-Control](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) — `s-maxage`, `stale-while-revalidate`, and directive precedence.
- [web.dev — stale-while-revalidate](https://web.dev/articles/stale-while-revalidate) — the pattern that makes dynamic content cacheable.
- [Fastly — Cache freshness & invalidation](https://developer.fastly.com/learning/concepts/cache-freshness/) — how purge and TTLs behave at the edge.
