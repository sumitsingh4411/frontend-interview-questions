<div align="center">

# Storage internals (cache/quota)

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#storage`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — All modern client storage (IndexedDB, Cache API, Service Worker) shares one **per-origin quota** governed by the Storage Standard, and it's **best-effort by default** — the browser can silently evict your whole origin under disk pressure unless you become **`persistent`**.

---

## 🧠 Mental model

Stop thinking about storage APIs as separate boxes with separate limits. The Storage Standard defines a single **storage bucket per origin** that IndexedDB, the Cache API, Service Worker registrations, and File System Access all draw from. That bucket has:

- A **quota** — a browser-computed cap, typically a *fraction of free disk* (Chrome allows up to ~60% of total disk per origin), not a fixed number. It's dynamic and you don't control it.
- A **usage** — how much you've stored across all APIs combined.
- A **mode**: `best-effort` (default) or `persistent`.

The single most important fact: in `best-effort` mode, the browser will **evict your entire origin's storage** when the disk runs low — atomically, all-or-nothing, silently, without asking. `localStorage` is the exception that proves the rule: it's a small (~5MB), synchronous, string-only legacy API that lives slightly apart and shouldn't be used for anything real.

## ⚙️ How it actually works

**Quota is estimated, not exact.** `navigator.storage.estimate()` returns `{ usage, quota }`, but both are deliberately **fuzzed** to prevent cross-site fingerprinting and are *padded* (opaque Cache responses count as a fixed large size regardless of real bytes). Treat them as guidance, not accounting.

**Eviction policy is LRU-by-origin.** Under pressure the browser evicts **least-recently-used origins** first, and it evicts a whole origin at once — you never lose "just the old rows". Persistent origins are exempt from automatic eviction; they're only cleared by explicit user action.

**Becoming persistent** requires `navigator.storage.persist()`. Whether it's granted depends on engagement signals — installed PWA, bookmarked, high site-engagement, or notification permission. You can't demand it; you request and check.

**The two-tier durability model:**

| Mode | Evicted under disk pressure? | How to get it |
|---|---|---|
| `best-effort` (default) | **Yes**, LRU, whole origin, silent | nothing — it's the default |
| `persistent` | No — only user clears it | `persist()` granted via engagement |

**Storage is partitioned.** Modern browsers **partition by top-level site** (the embedding site), so the same third-party origin embedded in two different sites gets *separate* storage. This kills cross-site tracking via shared IndexedDB/Cache and is why "it worked in a first-party tab but not in an iframe" happens.

**The Cache API is not the HTTP cache.** The Cache API is a programmable, origin-owned key→`Response` store you populate explicitly (usually from a Service Worker) — it ignores `Cache-Control` and never evicts entries on its own. The HTTP cache is heuristic, header-driven, and browser-managed. Confusing them is a classic error.

## 💻 Code

```js
// Check your budget before caching something large.
const { usage, quota } = await navigator.storage.estimate();
console.log(`Using ${(usage / 1e6).toFixed(1)}MB of ~${(quota / 1e6).toFixed(0)}MB`);
// Note: numbers are fuzzed/padded — use as a guardrail, not exact accounting.

// Request durability so the browser won't silently evict you.
if (navigator.storage?.persist) {
  const persisted = await navigator.storage.persisted(); // already durable?
  if (!persisted) {
    const granted = await navigator.storage.persist();    // ask
    console.log(granted ? 'safe from eviction' : 'still best-effort');
  }
}
```

```js
// Cache API: an explicit, versioned store you control — nothing auto-evicts.
const cache = await caches.open('assets-v3');
await cache.addAll(['/app.js', '/app.css']);

// You own the lifecycle: prune old versions yourself (usually in SW 'activate').
for (const key of await caches.keys()) {
  if (key !== 'assets-v3') await caches.delete(key); // manual eviction
}
```

## ⚖️ Trade-offs

- **`persistent` isn't a free upgrade.** It removes the browser's safety valve — if every site claimed it, disks would fill and users would be stuck manually clearing sites. Request it only for genuinely offline-critical data (offline docs, queued writes), not for a rebuildable cache.
- **Pick the API by shape.** `IndexedDB` for structured/queryable data, `Cache API` for `Request`→`Response` (offline assets), `localStorage` only for tiny synchronous flags. Never `localStorage` for anything large — it's synchronous and blocks the main thread.
- **When NOT to store at all:** if data is cheap to refetch and not needed offline, storing it just risks eviction surprises and quota pressure. Client storage is for *offline capability and latency*, not a database you can trust to be there.

## 💣 Gotchas interviewers probe

- **"How much can I store?" — there's no fixed number.** It's a dynamic fraction of free disk, per origin, shared across all APIs, and reported *fuzzed*. Anyone quoting "50MB for IndexedDB" is repeating an obsolete myth.
- **Eviction is all-or-nothing per origin.** You don't lose old entries gracefully; best-effort origins can be wiped entirely. This shocks people building "offline-first" apps who never called `persist()`.
- **Cache API ≠ HTTP cache.** The Cache API never respects `Cache-Control` and never auto-evicts — *you* manage its lifecycle, typically via SW version keys.
- **Storage partitioning** means third-party embeds get isolated storage per top-level site; shared cross-site state is gone by design.
- **`localStorage` pitfalls:** synchronous (janks the main thread), ~5MB cap, strings only (so you `JSON.stringify` and lose types), and it blocks across tabs. Not for real data.
- **Private/incognito mode** grants tiny quotas and clears on session end — feature-detect and degrade, don't assume.
- **Safari's 7-day cap:** script-writable storage can be deleted after 7 days of no interaction under ITP — a real cross-browser gotcha for "offline" data.

## 🎯 Say this in the interview

> "The key insight is that there isn't a separate limit per API — IndexedDB, the Cache API, and Service Workers all share one per-origin quota defined by the Storage Standard, and that quota is a dynamic fraction of free disk, reported through `navigator.storage.estimate()` with the numbers deliberately fuzzed. The part that bites people is durability: by default storage is *best-effort*, so under disk pressure the browser evicts least-recently-used origins entirely and silently. If I'm building something genuinely offline-critical I call `navigator.storage.persist()` to opt into persistent mode, which is exempt from automatic eviction. I also keep the Cache API and the HTTP cache separate in my head — the Cache API is an explicit store I version and prune myself, it doesn't honour `Cache-Control`. And I remember storage is now partitioned by top-level site, so a third-party embed can't share state across the sites that embed it."

## 🔗 Go deeper

- [web.dev — Storage for the web](https://web.dev/articles/storage-for-the-web) — the definitive overview: quotas, eviction, which API to pick.
- [web.dev — Persistent storage](https://web.dev/articles/persistent-storage) — how `persist()` works and what earns the grant.
- [MDN — Storage quotas and eviction criteria](https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria) — best-effort vs persistent, and the LRU eviction rules.
- [MDN — Cache API](https://developer.mozilla.org/en-US/docs/Web/API/Cache) — the programmable store, and why it's not the HTTP cache.
