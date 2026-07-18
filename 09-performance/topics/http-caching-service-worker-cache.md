<div align="center">

# HTTP caching & service worker cache

<sub>🚀 Performance · 🟡 Medium · ⏱ 1h · `#caching`</sub>

<a href="../README.md">⬅ Performance</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The HTTP cache is a passive contract you negotiate with headers (`Cache-Control`, `ETag`); the service worker cache is imperative code *you* run in the network path. Use HTTP caching for versioned static assets, and a service worker only when you need offline, custom routing, or a cache the browser can't evict from under you.

---

## 🧠 Mental model

There are two completely different caches, and conflating them is a red flag.

The **HTTP cache** is built into the browser. You don't call an API — you send response headers and the browser decides whether the next request even leaves the machine. It's declarative: you describe *policy*, the browser enforces it.

The **service worker Cache API** is a programmable key/value store of `Request → Response` pairs. A service worker sits between the page and the network as a client-side proxy; its `fetch` handler runs on every request and you decide, in JavaScript, whether to answer from cache, the network, or both.

```
page ──fetch──▶ [ Service Worker fetch handler ]  ← your code, runs first
                        │
                        ├─▶ Cache API (you manage)
                        └─▶ [ HTTP cache ] ──▶ network  ← browser manages
```

Key insight: they stack. A request the SW passes to `fetch()` still hits the HTTP cache. You are not choosing one *or* the other — the SW is upstream of the HTTP cache.

## ⚙️ How it actually works

**HTTP cache freshness.** `Cache-Control` is the modern control surface. `max-age=31536000` means "reuse for a year without asking." When the entry goes stale, the browser **revalidates**: it sends the stored `ETag` back as `If-None-Match`, and the server replies `304 Not Modified` (empty body) if nothing changed. That 304 still costs a round trip — cheap on bytes, not on latency.

The two patterns that matter:

- **Immutable, fingerprinted assets** (`app.4f9a1c.js`): `Cache-Control: public, max-age=31536000, immutable`. The hash changes when content changes, so the URL *is* the version. `immutable` tells the browser not to even revalidate on reload.
- **HTML / API responses**: `Cache-Control: no-cache` — counterintuitively this means "store it, but revalidate every time," giving you instant 304s while never serving stale HTML. `no-store` is the real "never cache."

**Service worker lifecycle** is where people fall down. A new SW **installs**, then **waits** until every tab controlled by the old one closes before it **activates** — so a deploy doesn't take effect until the user fully leaves. `self.skipWaiting()` + `clients.claim()` forces immediate takeover, but then you must handle version skew between already-loaded pages and the new SW.

Cache invalidation is manual: you name caches (`static-v3`) and delete old ones in `activate`. There is no `max-age` — a stale-while-revalidate strategy is *you* returning the cached response and kicking off a background fetch to update it.

## 💻 Code

```js
// Service worker: cache-first for hashed assets, network-first for HTML.
const CACHE = 'static-v3';

self.addEventListener('activate', (e) => {
  // ✅ Purge old versions — the SW's only "invalidation".
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Fingerprinted assets never change → cache-first is safe and instant.
  if (/\.[0-9a-f]{8}\.(js|css)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then((hit) => hit || fetchAndStore(e.request))
    );
    return;
  }

  // HTML: network-first so users never get stuck on a stale shell,
  // falling back to cache only when offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/offline.html'))
    );
  }
});

async function fetchAndStore(req) {
  const res = await fetch(req);
  const cache = await caches.open(CACHE);
  cache.put(req, res.clone()); // clone: a Response body is a one-time stream
  return res;
}
```

```
# ❌ Fingerprinted bundle with a short TTL — you pay a round trip on every load
Cache-Control: max-age=600

# ✅ The URL is the version; cache forever, skip revalidation
Cache-Control: public, max-age=31536000, immutable
```

## ⚖️ Trade-offs

- **Reach for HTTP caching first.** It's zero JavaScript, works before any SW installs, and covers 90% of asset delivery. A service worker is a *distributed system on the client* — versioning, race conditions, and "why is my deploy not showing up" bugs are real costs.
- **Service workers earn their keep** for genuine offline, App Shell architectures, precaching a route the user hasn't visited, or overriding cache behaviour the server won't set for you (third-party assets).
- **When NOT to use a SW:** a content site with no offline requirement. You inherit a lifecycle you now have to reason about on every deploy, and a broken SW can cache a broken app to every returning user.
- **`stale-while-revalidate`** (as an HTTP header *or* a SW strategy) is the sweet spot for near-static data: instant response, background freshness.

## 💣 Gotchas interviewers probe

- **`no-cache` does not mean "don't cache."** It means store-and-revalidate. `no-store` is the one that skips the cache entirely. Getting these backwards is the classic tell.
- **A cached Response body is a stream — you can only read it once.** Forgetting `res.clone()` before `cache.put()` throws or serves an empty body. Senior signal.
- **The SW `waiting` state means your deploy is invisible until tabs close.** Candidates who don't know this ship a fix and swear it didn't work.
- **A service worker can't intercept its own registration or requests before it activates** — the very first visit is always uncontrolled. Precaching happens on *install*, benefits the *second* load.
- **Cache size isn't infinite.** The browser evicts SW caches under storage pressure (LRU-ish, origin-wide). Never treat the Cache API as durable storage.
- **HTTPS only** (except `localhost`) — service workers are a same-origin MITM, so the platform mandates a secure context.

## 🎯 Say this in the interview

> "I separate the two caches cleanly. The HTTP cache is declarative — I fingerprint static assets and serve them `max-age=31536000, immutable` so the URL is the version and they never revalidate, while HTML goes out `no-cache` so it's stored but always revalidated with an ETag, giving cheap 304s without ever serving a stale shell. I only add a service worker when I actually need offline or custom routing, because it's a client-side proxy I have to version myself — no `max-age`, invalidation is deleting named caches in the activate event. My default SW strategy is cache-first for hashed assets and network-first for navigations. The two things I watch: the waiting state means a deploy is invisible until tabs close unless I `skipWaiting`, and a Response body is a one-shot stream so I always `clone()` before putting it in the cache."

## 🔗 Go deeper

- [web.dev — HTTP cache](https://web.dev/articles/http-cache) — the canonical guide to `Cache-Control`, ETags, and revalidation.
- [web.dev — Service worker caching strategies](https://web.dev/articles/service-worker-caching-and-http-caching) — how the two caches interact, with the exact strategies.
- [MDN — Using Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers) — lifecycle, install/activate, and the Cache API.
- [Jake Archibald — The offline cookbook](https://web.dev/articles/offline-cookbook) — the definitive taxonomy of caching strategies.
