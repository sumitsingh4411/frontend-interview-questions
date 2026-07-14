<div align="center">

# Progressive Web Apps (PWA)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#pwa` `#offline`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A PWA is a normal website that adds three things: a **service worker** (a network proxy for offline/caching), a **web app manifest** (so it installs to the home screen), and **HTTPS** (mandatory). It's not a framework — it's a set of platform capabilities that make the web behave like an installed app.

---

## 🧠 Mental model

Think of a PWA as your site plus a **programmable proxy that lives between the page and the network**:

```
page  ──fetch──▶  [ Service Worker ]  ──▶  Cache Storage
                        │                      (offline assets)
                        └──────────────▶  Network
```

The service worker is a separate, event-driven worker thread with **no DOM access** that the browser keeps around even when your tab is closed. It intercepts every network request and *decides* whether to answer from cache, network, or both. That single capability is what unlocks offline, instant repeat loads, push, and background sync.

The manifest is the boring-but-required other half: it's the metadata (name, icons, `display: standalone`, theme colour) that lets the browser offer "Add to Home Screen" and launch without browser chrome.

## ⚙️ How it actually works

**Service worker lifecycle** — the part everyone gets wrong:

1. **register** → **install** (pre-cache the app shell) → **activate** (clean old caches) → **idle/terminated** (the browser kills it to save memory; it wakes on events).
2. A new SW **waits** until all tabs controlled by the old one are closed — by default it does *not* take over immediately. This is why "I deployed but users see the old version" happens; `skipWaiting()` + `clients.claim()` force an early takeover.
3. The SW controls only pages within its **scope** (its directory and below).

**Caching strategies** (the real design decisions):

| Strategy | Behaviour | Use for |
|---|---|---|
| Cache-first | Cache, fall back to network | Hashed static assets (immutable) |
| Network-first | Network, fall back to cache | HTML / API data you want fresh |
| Stale-while-revalidate | Serve cache, update it in bg | Avatars, semi-fresh content |

**Beyond offline:** Push API + Notifications (re-engagement), Background Sync (retry a failed POST when connectivity returns), and installability all ride on the service worker.

## 💻 Code

```js
// register.js — feature-detect; SW is progressive enhancement.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js'); // scope defaults to '/'
}
```

```js
// sw.js
const CACHE = 'shell-v3';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/app.css', '/app.js'])));
});

self.addEventListener('activate', (e) => {
  // Delete old cache versions so a deploy actually ships.
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
});

self.addEventListener('fetch', (e) => {
  // Network-first for HTML, cache-first for everything else.
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/')));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
  }
});
```

```json
// manifest.webmanifest — links via <link rel="manifest" href="...">
{ "name": "Acme", "short_name": "Acme", "start_url": "/?src=pwa",
  "display": "standalone", "theme_color": "#0b0b0b",
  "icons": [{ "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }] }
```

## ⚖️ Trade-offs

- **Cache-first is fast but can serve stale forever.** Only use it for content-hashed, immutable files, and *always* version + prune caches on activate — a bad SW can pin users to an old build indefinitely.
- **A buggy service worker is worse than none.** It sits in front of every request; a broken `fetch` handler can take your whole site offline for returning users. Ship kill-switches.
- **iOS support lags:** no Web Push until recently, limited storage, aggressive cache eviction. "Install once, works everywhere" is optimistic.
- **When NOT to bother:** a page users visit once (a one-off landing page) gains little from a service worker's complexity. PWAs pay off for repeat-use, app-like experiences.

## 💣 Gotchas interviewers probe

- **The waiting phase** — a new SW won't activate while old tabs are open. Not knowing this leads to "my update didn't ship" confusion. `skipWaiting()` opts out (carefully).
- **HTTPS is mandatory** (except `localhost`) — SWs are a huge attack surface, so they're secure-context only.
- **Scope** — a SW at `/js/sw.js` controls only `/js/…`, not the whole site. Register at the root.
- **Service workers can't touch the DOM** — they're a separate thread; communicate via `postMessage`.
- **"Add to Home Screen" ≠ app store.** No install prompt without a valid manifest, HTTPS, and (usually) a service worker.
- **Offline is opt-in per response** — nothing is cached unless *your* fetch handler caches it.

## 🎯 Say this in the interview

> "A PWA is just a website plus a service worker, a manifest, and HTTPS. The service worker is the heart of it — a separate worker thread with no DOM access that acts as a programmable proxy in front of the network, so I can implement caching strategies: cache-first for immutable hashed assets, network-first for HTML and API data, stale-while-revalidate for things like avatars. The manifest makes it installable to the home screen. The lifecycle is the part I'm careful with: a new service worker waits until old tabs close before activating, and I have to version and prune caches on activate or a deploy won't reach returning users. I'm also mindful that a broken service worker sits in front of every request, so it can take the whole site down — it needs a kill switch."

## 🔗 Go deeper

- [web.dev — Progressive Web Apps](https://web.dev/explore/progressive-web-apps) — the full capability set.
- [MDN — Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API) — lifecycle and events in depth.
- [web.dev — The service worker lifecycle](https://web.dev/articles/service-worker-lifecycle) — install/waiting/activate, the confusing part.
- [Workbox](https://developer.chrome.com/docs/workbox) — Google's library for production caching strategies.
