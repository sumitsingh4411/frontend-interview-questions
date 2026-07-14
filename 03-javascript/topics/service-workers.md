<div align="center">

# Service Workers

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 1.5h · `#workers` `#offline`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A service worker is a **programmable network proxy** that sits between your page and the network. It runs on its own thread, has no DOM, wakes on events (`fetch`, `push`, `sync`), and lets you intercept every request — which is what makes offline apps, custom caching, and push notifications possible.

---

## 🧠 Mental model

A regular Web Worker offloads CPU. A **service worker offloads the *network*.** Once registered and activated, the browser routes *every* network request from pages in its scope through the worker's `fetch` event handler — you decide whether to answer from a cache, hit the network, or synthesise a response. It is a proxy you write in JavaScript that lives on the client.

Two properties make it different from every other worker:

1. **It's event-driven and short-lived.** It is *not* always running. The browser starts it to handle an event, then kills it aggressively to save memory. **You cannot keep global state in it** — a variable set during one `fetch` is gone by the next. Persist to Cache Storage or IndexedDB.
2. **It outlives the page.** It can receive `push` and `periodicSync` events with no tab open, which is how web push notifications reach a closed app.

The invariant that trips people: **HTTPS only** (except `localhost`), because a network-interceptor over plaintext would be a catastrophic MITM tool.

## ⚙️ How it actually works

The lifecycle is the whole exam, and it exists to **guarantee you never run a half-updated app**:

```
register → install → (waiting) → activate → idle ⇄ fetch/push/sync events → terminated
```

- **`install`** — fires once per new SW version. This is where you `precache` your app shell (`caches.open().addAll([...])`). `event.waitUntil(promise)` keeps the worker alive until caching finishes.
- **Waiting** — a new SW **does not take over while old tabs are open**. It waits until every controlled client closes, so you never mix v1 pages with a v2 worker. `self.skipWaiting()` overrides this to activate immediately (pair with `clients.claim()`).
- **`activate`** — the moment to **delete stale caches** from prior versions. `clients.claim()` makes the new SW control existing pages without a reload.
- **`fetch`** — intercept requests. `event.respondWith(...)` supplies the response; return nothing and the browser does its normal fetch.

**Caching strategies** you must be able to name and choose between:

| Strategy | Behaviour | Use for |
|---|---|---|
| Cache-first | cache, fall back to network | static assets, app shell |
| Network-first | network, fall back to cache | HTML, frequently-changing APIs |
| Stale-while-revalidate | serve cache now, update cache in background | avatars, feeds — fast + fresh-ish |
| Network-only / Cache-only | no fallback | analytics beacons / immutable assets |

The **first load is never controlled** — the SW installs *during* it but only takes over subsequent navigations. This "second visit" behaviour surprises everyone testing offline the first time.

## 💻 Code

```js
// page.js — register (feature-detect, register after load to not compete for bandwidth)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () =>
    navigator.serviceWorker.register('/sw.js', { scope: '/' }));
}

// sw.js
const CACHE = 'app-v3';
const SHELL = ['/', '/app.css', '/app.js', '/offline.html'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL))); // precache app shell
  // self.skipWaiting(); // activate this version immediately (use with care)
});

self.addEventListener('activate', (e) => {
  e.waitUntil(                                    // purge old caches on version bump
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {            // network-first for HTML
    e.respondWith(fetch(e.request).catch(() => caches.match('/offline.html')));
    return;
  }
  e.respondWith(                                  // cache-first for assets
    caches.match(e.request).then((hit) => hit || fetch(e.request)));
});
```

## ⚖️ Trade-offs

- **Enables genuinely new capabilities:** offline, instant repeat loads, push notifications, background sync. Nothing else on the platform does this.
- **When NOT to hand-roll one:** almost always. Use **Workbox** — bespoke caching logic is a rich source of "users see a stale app forever" bugs. A wrong cache invalidation strategy is a support nightmare because you can't easily reach clients to fix it.
- **The update trap:** aggressive cache-first on your HTML/JS can trap users on an old version. Version your cache names, clean up on `activate`, and think hard about your update UX (prompt-to-reload vs. auto).
- **Debugging is painful:** the SW lifecycle, the waiting phase, and cache staleness make "why am I seeing old code" a recurring headache. Chrome DevTools → Application → "Update on reload" is essential.
- **Scope is path-based:** an SW at `/app/sw.js` only controls `/app/*` unless you send `Service-Worker-Allowed`.

## 💣 Gotchas interviewers probe

- **No persistent global state.** The SW is killed between events; a module-level variable won't survive. Persist to Cache Storage/IndexedDB. The most common misconception.
- **First visit isn't controlled.** The SW installs during the first load but only intercepts *subsequent* navigations. Testing offline on load one and seeing failures is expected.
- **The waiting phase.** A new SW won't activate while old tabs are open — by design, to avoid version mixing. `skipWaiting()` + `clients.claim()` bypasses it, with the risk of a page talking to a worse-matched worker.
- **Cache is not the HTTP cache.** Cache Storage is a *separate*, script-controlled cache you manage manually; it ignores HTTP cache headers unless you honour them yourself.
- **HTTPS-only** (bar `localhost`). Forgetting this when it "works locally but not deployed over HTTP".
- **`respondWith` must be called synchronously** in the `fetch` handler (you can pass it a promise), or the browser falls through to the network.

## 🎯 Say this in the interview

> "A service worker is a programmable network proxy on its own thread — once activated, every request in its scope flows through its `fetch` handler, so I decide whether to answer from cache, from the network, or synthesise a response. That's what enables offline, instant repeat loads, and push. The two things that define how you use it: it's event-driven and short-lived, so it's killed between events and I can't keep global state — I persist to Cache Storage or IndexedDB; and it has a deliberate lifecycle — install to precache the shell, a waiting phase so a new version never takes over open tabs and mixes v1 pages with a v2 worker, then activate to purge old caches. I pick a caching strategy per request type — cache-first for static assets, network-first or stale-while-revalidate for HTML and APIs — and I version my cache names so I never trap users on stale code. In production I use Workbox rather than hand-rolling, because a bad cache-invalidation bug ships to clients I can't easily reach."

## 🔗 Go deeper

- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — the lifecycle, events, and scope rules.
- [web.dev — Service worker lifecycle](https://web.dev/articles/service-worker-lifecycle) — Jake Archibald on install/waiting/activate, the part everyone gets wrong.
- [Workbox](https://developer.chrome.com/docs/workbox) — the library that turns the strategies above into a few lines and avoids the invalidation footguns.
