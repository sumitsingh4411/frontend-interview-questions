<div align="center">

# HTTP caching (Cache-Control, ETag)

<sub>📡 Networking · 🟡 Medium · ⏱ 1h · `#caching`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — HTTP caching has two independent gears: **freshness** (`Cache-Control: max-age` — how long a response is served *without asking the server*) and **validation** (`ETag`/`Last-Modified` — a cheap `304 Not Modified` check *when* it's stale). Master the combo of **immutable hashed assets** for statics and **`no-cache` + `ETag`** for HTML/APIs, and you've solved 90% of web caching.

---

## 🧠 Mental model

A cached response lives in one of three states, and the whole game is controlling the transitions:

```
        max-age not expired            stale, ETag matches           stale, changed
FRESH ─────────────────────▶ serve   ─────────────▶ 304 (revalidate) ──────▶ 200 (full body)
 (0 network)                            (headers only, tiny)            (full download)
```

- **Freshness = "can I skip the network entirely?"** Governed by `Cache-Control: max-age` (or the legacy `Expires`). While fresh, the browser serves from disk/memory with **zero requests**.
- **Validation = "it's stale; did it actually change?"** The cache sends a conditional request with the stored `ETag`; if the server says `304`, you re-download *nothing* and just reset the freshness clock.

The two are orthogonal. `max-age` decides *whether you ask*; `ETag` decides *how cheap the ask is*. Great caching layers both.

## ⚙️ How it actually works

**`Cache-Control` directives that actually matter:**

| Directive | Meaning |
|---|---|
| `max-age=31536000` | Fresh for a year; serve without asking. |
| `no-cache` | **Store it, but revalidate every time** before use. *Not* "don't cache". |
| `no-store` | Never write to cache at all (auth tokens, PII). |
| `private` | Browser may cache; **shared caches (CDN) must not**. |
| `public` | Any cache may store it, even with auth. |
| `immutable` | Don't even revalidate on reload — the URL's content will never change. |
| `stale-while-revalidate=60` | Serve stale instantly, refresh in the background. |

**Validation flow.** The server sends `ETag: "abc123"` (a content fingerprint). On revalidation the browser sends `If-None-Match: "abc123"`. Match → `304 Not Modified`, empty body, ~200 bytes instead of 200KB. `Last-Modified`/`If-Modified-Since` is the weaker, timestamp-based fallback (1-second resolution, breaks on regenerated-but-identical files).

**The two canonical strategies:**

1. **Hashed static assets** (`app.a1b2c3.js`): the filename *is* the version, so cache **forever** — `Cache-Control: public, max-age=31536000, immutable`. A new deploy = a new URL. Zero revalidation, ever.
2. **HTML and API responses**: content at a stable URL that changes. Use `Cache-Control: no-cache` (revalidate every time) **plus a strong `ETag`**, so unchanged responses cost a cheap `304`.

## 💻 Code

```http
# ❌ The classic mistake: long max-age on a STABLE url (index.html).
# Users are now stuck on an old app for a year with no way to bust it.
Cache-Control: public, max-age=31536000
# GET /index.html

# ✅ HTML: always revalidate, pay only a 304 when unchanged.
Cache-Control: no-cache
ETag: "v9-8f3c1a"
# GET /index.html  →  If-None-Match: "v9-8f3c1a"  →  304 Not Modified

# ✅ Hashed asset: the URL changes on every deploy, so cache immutably.
Cache-Control: public, max-age=31536000, immutable
# GET /static/app.a1b2c3.js

# ✅ Serve-stale-while-refreshing: instant response, fresh next time.
Cache-Control: max-age=60, stale-while-revalidate=600
```

```js
// Server-side ETag revalidation in ~5 lines.
app.get('/api/profile', (req, res) => {
  const body = getProfile(req.userId);
  const etag = `"${hash(body)}"`;               // strong validator from content
  res.set('Cache-Control', 'private, no-cache'); // browser-only, always revalidate
  res.set('ETag', etag);
  if (req.headers['if-none-match'] === etag) return res.status(304).end(); // no body
  res.json(body);
});
```

## ⚖️ Trade-offs

- **Long `max-age` is the biggest performance win and the biggest footgun.** On content-hashed URLs it's pure upside. On a *stable* URL it strands users on stale content with no recall — you cannot invalidate a cache you already handed to a million browsers. **When NOT to use `immutable`/long max-age:** any URL whose content can change without the URL changing.
- **`no-cache` vs `no-store` is a real decision.** `no-cache` still stores (fast `304`s); `no-store` re-downloads every time. Use `no-store` only for genuinely secret/one-time data — it throws away all caching benefit.
- **`ETag` costs a round-trip.** A `304` is cheap in bytes but still a full network RTT. For assets that truly never change, `immutable` beats `ETag` by skipping the trip entirely.
- **CDNs cache with `s-maxage` and `public` separately** from the browser. Mismatched directives (e.g. `private` blocking the CDN) quietly kill your edge hit rate.

## 💣 Gotchas interviewers probe

- **`no-cache` does NOT mean "don't cache".** It means "cache, but revalidate before every use". "Don't cache at all" is `no-store`. Getting this backwards is the most common HTTP-caching error and interviewers wait for it.
- **You can't bust a cache already delivered.** A `max-age=31536000` on `index.html` is un-recallable — hence hashed filenames, which make invalidation automatic via a new URL.
- **Weak vs strong ETags.** `W/"abc"` (weak) means "semantically equivalent," strong means "byte-identical." Weak validators can't be used for range requests. Know the `W/` prefix.
- **Reload vs navigation.** A hard reload (`Ctrl+Shift+R`) forces revalidation *even on `immutable`*; normal navigation and back/forward honour freshness. Testing cache behaviour with devtools "Disable cache" ticked will mislead you.
- **`Vary` is easy to forget.** A response cached under one `Accept-Encoding` or `Accept-Language` can be served to the wrong client without `Vary: Accept-Encoding`. Missing `Vary` causes bizarre "wrong content" cache bugs.
- **`Expires` vs `Cache-Control: max-age`.** If both are present, `max-age` wins. `Expires` is an absolute date and breaks with clock skew — prefer `max-age`.

## 🎯 Say this in the interview

> "I think of HTTP caching as two independent levers. Freshness — `Cache-Control: max-age` — decides whether the browser hits the network at all; while fresh it serves from disk with zero requests. Validation — `ETag` with `If-None-Match` — decides how cheap it is to check when it's stale, giving me a tiny `304` instead of a full re-download. My default architecture is two-tier: content-hashed static assets get `max-age=31536000, immutable` because the filename is the version, so a deploy is a new URL and I never revalidate; HTML and API responses get `no-cache` plus a strong `ETag`, so they always revalidate but cost nothing when unchanged. The trap I'm careful about is that `no-cache` means 'store but always revalidate,' not 'don't store' — and that you can never invalidate a long `max-age` you've already shipped on a stable URL, which is exactly why hashed filenames exist."

## 🔗 Go deeper

- [MDN — HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) — the canonical reference for every directive and the freshness/validation model.
- [web.dev — HTTP cache](https://web.dev/articles/http-cache) — the practical "hashed assets + revalidated HTML" playbook.
- [MDN — `Cache-Control`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control) — every directive, precisely defined (including `stale-while-revalidate`).
- [MDN — `ETag`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/ETag) — strong vs weak validators and conditional requests.
