<div align="center">

# Browser storage (cookies/localStorage/IndexedDB)

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#storage` `#offline`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Pick by **access pattern, not by habit.** Cookies travel to the server on every request (auth). `localStorage` is a tiny **synchronous** key/value store that blocks the main thread (small prefs only). IndexedDB is the real database — **async**, large, structured — for anything you'd actually call "app data" or "offline".

---

## 🧠 Mental model

The mistake is treating these as three sizes of the same thing. They're three *different tools*:

| | Capacity | API | Sent to server? | Blocks main thread? |
|---|---|---|---|---|
| **Cookie** | ~4KB/cookie | string | **Yes, every request** | no |
| **localStorage** | ~5–10MB | sync string K/V | no | **Yes** |
| **sessionStorage** | ~5–10MB | sync, per-tab | no | **Yes** |
| **IndexedDB** | 100s of MB–GBs | async, transactional | no | no |
| **Cache Storage** | large (quota) | async, `Request`/`Response` | no | no |

Two axes decide everything: **does the server need it** (→ cookie) and **is it more than a few keys** (→ IndexedDB). `localStorage` is the narrow middle: small, non-sensitive, and you can tolerate a synchronous read.

## ⚙️ How it actually works

**`localStorage` is synchronous — that's the whole problem.** Every `getItem`/`setItem` blocks the main thread, including disk I/O and, in some engines, JSON parsing you do around it. Read 2MB of stringified JSON on startup and you've just added jank to your FCP. It's also **string-only** (`JSON.stringify` everything) and **origin-scoped** (shared across all tabs of that origin, which is why the `storage` event exists for cross-tab sync).

**IndexedDB is a transactional, indexed, structured store.** It's asynchronous (never blocks paint), stores real objects via the *structured clone* algorithm — so `Blob`, `ArrayBuffer`, `Date`, `Map` survive, but functions and DOM nodes don't. You get object stores, indexes, cursors, and versioned schema migrations. The raw API is famously hostile (event-based, verbose), so in practice everyone wraps it with **`idb`** or **Dexie**.

**Cookies are a networking primitive, not really "storage".** Their cost is that a 3KB cookie is re-uploaded on *every* request to that domain — including images and API calls — inflating request size. That's why you set `HttpOnly` (invisible to JS, mitigates XSS token theft) and scope them tightly. (Details in the dedicated cookies deep dive.)

**Quota and eviction** — the part people never mention. Origins share a per-origin quota (often ~10% of disk). Under storage pressure the browser evicts *best-effort* origins. `navigator.storage.persist()` requests durability; `estimate()` tells you how close you are:

```js
const { usage, quota } = await navigator.storage.estimate();
// usage/quota → how full you are before eviction risk
```

## 💻 Code

`localStorage` done safely — it throws, and it's not always there:

```js
// ❌ Naïve: throws in private mode / when full / when disabled.
localStorage.setItem('prefs', JSON.stringify(prefs));

// ✅ Guarded: storage can be absent, full (QuotaExceededError), or blocked.
function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Safari private mode historically threw here; quota is finite.
    console.warn('storage unavailable, running ephemeral', e);
  }
}
```

IndexedDB via `idb` — what real offline data looks like:

```js
import { openDB } from 'idb';

const db = await openDB('app', 2, {
  upgrade(db, oldVersion) {          // versioned migration, runs once per bump
    if (oldVersion < 1) {
      const store = db.createObjectStore('docs', { keyPath: 'id' });
      store.createIndex('byUpdated', 'updatedAt'); // query without scanning
    }
    if (oldVersion < 2) { /* v1 → v2 schema change */ }
  },
});

await db.put('docs', { id: 'a1', body: 'hi', updatedAt: Date.now() });
const recent = await db.getAllFromIndex('docs', 'byUpdated'); // uses the index
```

## ⚖️ Trade-offs

- **`localStorage` is fine for a theme toggle and a feature flag. It is wrong for app state.** Synchronous + string-only + ~5MB + no indexing means it collapses the moment data grows. Reaching for it to cache API responses is the classic junior move.
- **Don't put auth tokens in `localStorage`.** Any XSS can read it instantly. An `HttpOnly` cookie is unreadable from JS. This is a security answer interviewers wait for.
- **IndexedDB's power is also its cost.** The ergonomics are bad enough that shipping raw IDB is a mistake — budget for a wrapper. But nothing else gives you large, async, queryable client storage.
- **All of it is best-effort and evictable** unless you call `persist()`. Never treat the browser as a durable source of truth — it's a *cache of* the server's truth.

## 💣 Gotchas interviewers probe

- **"localStorage is async" — no, it's synchronous and blocks the main thread.** This is the single most common wrong belief in this topic.
- **`sessionStorage` is per-tab**, not per-origin — a new tab of the same site gets a *fresh, empty* store. Great for a wizard flow, useless for cross-tab state.
- **Quota is shared and eviction is silent.** Your carefully cached data can vanish under disk pressure. Handle the cache-miss path.
- **`storage` events fire in *other* tabs, not the one that made the change** — the mechanism people forget when building cross-tab sync (or reach for `BroadcastChannel`).
- **Structured clone ≠ JSON.** IndexedDB keeps `Date`/`Blob`/`Map`; it *cannot* store functions or DOM nodes, and it'll throw. Different rules than `JSON.stringify`.
- **Cookies count against request size on every call** — a fat cookie silently taxes your TTFB for every asset on the domain.

## 🎯 Say this in the interview

> "I choose by access pattern. If the server needs it on every request — session, auth — it's a cookie, ideally `HttpOnly` so XSS can't read it. If it's a handful of small, non-sensitive preferences and I can tolerate a synchronous read, `localStorage` — but I'm clear-eyed that it's synchronous and blocks the main thread, it's string-only, and it caps around 5MB. Anything I'd actually call app data or offline data goes in IndexedDB, because it's async, transactional, indexed, and stores structured objects — I'll wrap it with `idb` because the raw API is brutal. The two things I never do: put tokens in `localStorage`, and treat any of it as durable — it's all evictable under quota pressure unless I explicitly request persistence, so it's a cache of the server's truth, not the truth."

## 🔗 Go deeper

- [web.dev — Storage for the web](https://web.dev/articles/storage-for-the-web) — the definitive "which one and how much" guide, including quota and eviction.
- [MDN — IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) — the real database, transactions and cursors.
- [MDN — Web Storage API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API) — `localStorage`/`sessionStorage` semantics and the `storage` event.
- [Jake Archibald — `idb` library](https://github.com/jakearchibald/idb) — the tiny promise wrapper that makes IndexedDB usable in practice.
