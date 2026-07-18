<div align="center">

# SEO fundamentals

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 1h · `#seo`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — SEO for frontend engineers is three jobs: make the page **crawlable** (the bot can reach it), **renderable** (it can read the content without running your app for 10 seconds), and **understandable** (semantic HTML, metadata, structured data). Most SEO bugs are actually *rendering* and *routing* bugs.

---

## 🧠 Mental model

A search engine does three separable things, and you can break any one:

```
CRAWL  → INDEX (render + parse) → RANK
  ↑            ↑                    ↑
robots,     JS execution,       content quality,
sitemap,    server HTML,        Core Web Vitals,
links       metadata            links, intent
```

As a frontend engineer you own **crawl** and **index**, and you *influence* rank via performance and semantics. You do not control ranking. So the interview-worthy framing is: *don't hide content behind client-side rendering, and give the bot clean, semantic HTML with correct metadata.*

## ⚙️ How it actually works

Googlebot fetches your HTML, then queues the page for **rendering** in a headless Chromium — but that render happens *later*, on a deferred queue, and only for Google. Bing and social scrapers (Twitter/X, Slack, LinkedIn) are far weaker at JS. So a pure CSR page can be indexed by Google eventually, unreliably, and by others barely at all. **Serving real HTML (SSR/SSG) removes this entire class of risk.**

The primitives you control:

- **`robots.txt`** — crawl *permission* (which paths the bot may fetch). It does **not** deindex a page; a blocked-but-linked URL can still appear in results.
- **`<meta name="robots" content="noindex">`** — index *control*. This is how you actually keep a page out of the index — but the bot must be *allowed to crawl* it to see the tag.
- **`<link rel="canonical">`** — dedupes: tells Google which URL is authoritative when the same content lives at many URLs (`?utm=`, trailing slash, http/https).
- **Sitemaps** — a hint listing your URLs and their `lastmod`; speeds discovery, doesn't guarantee indexing.
- **Semantic HTML + one `<h1>`, a title, and a meta description** — the machine-readable outline of the page.
- **Structured data (JSON-LD, schema.org)** — earns rich results (stars, breadcrumbs, FAQ).

## 💻 Code

```html
<head>
  <title>Running shoes — Acme (55–60 chars, unique per page)</title>
  <meta name="description" content="~155 chars; the SERP snippet." />

  <!-- The authoritative URL for this content. Kills duplicate-content splits. -->
  <link rel="canonical" href="https://acme.com/shoes/running" />

  <!-- Keep THIS page out of the index (bot must be allowed to crawl it first). -->
  <meta name="robots" content="noindex, follow" />

  <!-- Social cards: OG for most, Twitter for X. Scrapers don't run JS. -->
  <meta property="og:title" content="Running shoes — Acme" />
  <meta property="og:image" content="https://acme.com/og/shoes.png" />
</head>

<!-- Structured data = eligibility for rich results. -->
<script type="application/ld+json">
{ "@context":"https://schema.org", "@type":"Product",
  "name":"Trail Runner", "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.6","reviewCount":"215"} }
</script>
```

```html
<!-- ❌ SPA link: bot may not follow a div click; no href to crawl. -->
<div onclick="navigate('/shoes')">Shoes</div>
<!-- ✅ A real anchor with a real URL is crawlable and works without JS. -->
<a href="/shoes">Shoes</a>
```

## ⚖️ Trade-offs

- **CSR vs SSR/SSG for SEO:** SSR/SSG removes rendering risk and improves LCP (a ranking factor), at server cost. For content you want ranked, it's worth it; for a logged-in app, SEO is irrelevant — don't pay for it.
- **`robots.txt` disallow vs `noindex`:** disallow saves crawl budget but can't remove an already-indexed URL; `noindex` removes it but requires the page to remain crawlable. Using both on the same URL is a classic self-own — the bot never sees the `noindex`.
- **Structured data** is high-leverage for rich results but must match visible content or it's a manual-action risk.

## 💣 Gotchas interviewers probe

- **"Google runs JS, so CSR is fine."** Half-true and the top trap: rendering is deferred and best-effort, and *other* engines are weak. Real HTML is safer.
- **`robots.txt` does not deindex.** To remove a page you need `noindex` (and the page must be crawlable). Blocking in robots.txt can *strand* an indexed URL.
- **SPA routing without real `<a href>`** — bots crawl links, not JS click handlers. Use anchors and the History API, not hash routing for content.
- **Duplicate content from query params / http+https / trailing slash** silently splits ranking signals. Fix with canonical + redirects.
- **Soft 404s:** a client-rendered "not found" that returns HTTP 200 confuses crawlers — return a real 404 status.
- **Core Web Vitals are a ranking signal** (page experience) — performance *is* SEO now.

## 🎯 Say this in the interview

> "I think of SEO in three layers I actually control as a frontend dev: crawlability, renderability, and understandability. Crawlability means real anchor tags with hrefs, a sitemap, and a robots.txt that permits the right paths. Renderability is the big one — I don't hide primary content behind pure client-side rendering, because Google renders JS on a deferred, best-effort queue and other crawlers barely do, so I serve real HTML via SSR or SSG. Understandability is semantic markup, a unique title and description per page, canonical tags to avoid duplicate-content splits, and JSON-LD structured data for rich results. And I remember robots.txt is permission to crawl, not a way to deindex — for that I need a `noindex` meta tag on a page that's still crawlable. Core Web Vitals also feed ranking, so performance is part of SEO."

## 🔗 Go deeper

- [Google Search Central — Documentation](https://developers.google.com/search/docs) — the authoritative source for everything here.
- [Google — JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) — exactly how the bot renders JS.
- [Google — Robots.txt vs noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing) — why they're not interchangeable.
- [schema.org](https://schema.org/) — structured data vocabulary for rich results.
