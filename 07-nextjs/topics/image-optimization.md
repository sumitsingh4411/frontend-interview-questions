<div align="center">

# Image optimization

<sub>▲ Next.js · 🟡 Medium · ⏱ 45m · `#performance` `#images`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `next/image` isn't "a fancy `<img>"` — it's an on-demand image CDN plus a layout contract. It reserves space to kill CLS, serves the right size per device via `srcset`, transcodes to AVIF/WebP on the fly, and lazy-loads by default. The one rule that makes or breaks it: **you must tell it the aspect ratio** (via `width`/`height`, `fill`, or a static import) or you lose the layout-stability win.

---

## 🧠 Mental model

Three problems ship together in every image, and `next/image` solves all three:

1. **Layout shift (CLS)** — an `<img>` with no dimensions has height 0 until it loads, then jolts the page. `next/image` reserves the box *before* the pixels arrive.
2. **Overserving bytes** — a 4000px hero sent to a 375px phone wastes ~90% of the download. `next/image` generates a `srcset` and lets the browser pick.
3. **Wrong format** — you ship JPEG; the browser supports AVIF (30–50% smaller). Next transcodes at request time based on the `Accept` header.

The framing: **`next/image` is an image pipeline masquerading as a component.** The JSX is the easy part; the value is the optimizer sitting behind the `/_next/image` URL, resizing and caching on demand.

## ⚙️ How it actually works

When you use `<Image src="/hero.jpg" width={1200} height={600}>`, Next doesn't serve `/hero.jpg`. It rewrites to `/_next/image?url=/hero.jpg&w=640&q=75` (and siblings for each `deviceSize`), builds a `srcset`, and the **optimizer** — an Edge/serverless function or your configured loader — fetches the source, resizes, transcodes to AVIF/WebP, and caches the result (keyed by URL + width + quality). First request is a cache miss (slow-ish); subsequent ones are CDN-fast.

**Dimensions are mandatory** because they set the `aspect-ratio`, letting the browser reserve space. Three ways to supply them:

- **Static import** — `import hero from './hero.jpg'`; Next reads intrinsic size at build *and* generates a blur placeholder automatically. Best DX.
- **Explicit `width`/`height`** — required for remote/string `src`.
- **`fill`** — the image absolutely-positions to fill a `position: relative` parent; you control size with CSS and **must** set `sizes`.

**`sizes` is the most misunderstood prop.** It tells the browser how wide the image will *render* at each breakpoint so it can pick the right `srcset` entry *before* layout. Without it, a `fill` image defaults to `100vw` and downloads the largest candidate on every screen — silently overserving.

**`priority`** disables lazy-loading and emits a `<link rel="preload">` — you set it on the LCP image (usually the hero) and *only* that one.

**Remote images** must be allow-listed in `next.config.js` `images.remotePatterns` (an SSRF guard — otherwise your optimizer becomes an open proxy).

## 💻 Code

```tsx
import Image from 'next/image';
import hero from '@/public/hero.jpg'; // static import → auto dimensions + blur

// ✅ LCP hero: static import, priority, blur placeholder, responsive sizes
export function Hero() {
  return (
    <Image
      src={hero}
      alt="Product on a desk"
      priority                      // preload; no lazy-load for the LCP element
      placeholder="blur"            // auto blurDataURL from the static import
      sizes="100vw"                 // hero spans the viewport
      className="w-full h-auto"
    />
  );
}

// ✅ Grid thumbnail with fill — note the required `sizes`
export function Thumb({ src }: { src: string }) {
  return (
    <div className="relative aspect-square">
      <Image
        src={src}
        alt=""
        fill
        // "on ≥768px it's a 3-col grid (33vw), else full width" → right srcset pick
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover"
      />
    </div>
  );
}
```

```js
// next.config.js — remote sources must be explicitly allow-listed
module.exports = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.acme.com', pathname: '/media/**' },
    ],
    formats: ['image/avif', 'image/webp'], // AVIF first, WebP fallback
  },
};
```

## ⚖️ Trade-offs

- **When NOT to use the optimizer:** tiny inline icons (ship SVG), or when you already have a mature image CDN (Cloudinary/imgix). In the latter case use a **custom `loader`** so `next/image` handles layout/lazy-loading while *your* CDN does the resizing — don't pay for two optimizers.
- **The optimizer costs compute and cache.** On serverless, cache misses are billable transformations and the first hit is slow. For very high-traffic sites, a dedicated image CDN or `unoptimized` + pre-generated variants can be cheaper.
- **AVIF is smaller but slower to encode.** First-request latency for AVIF is real; you're trading encode CPU for bytes on the wire. Often worth it, not always.
- **`fill` without `sizes` is a footgun** — it works, looks fine, and silently overserves the largest image everywhere, quietly hurting the exact metric you adopted the component for.

## 💣 Gotchas interviewers probe

- **"Why does `next/image` need width and height?"** To reserve space and prevent CLS by setting the aspect ratio — not for the download size. Static imports supply them automatically.
- **Missing `sizes` on `fill`/responsive images** defaults to `100vw` → overserving. This is the #1 real-world mistake.
- **`priority` on everything** defeats lazy-loading and floods the preload scanner. Exactly one image (the LCP) should get it.
- **Remote images 400 without `remotePatterns`.** By design — it prevents your endpoint being abused as an open image proxy.
- **`unoptimized`** bypasses the whole pipeline (useful for GIFs/already-optimized assets or fully static export) — but you lose resizing and format conversion.
- **The blur placeholder** is automatic for static imports; for remote `src` you must supply `blurDataURL` yourself.
- **`quality` defaults to 75.** Cranking to 100 balloons bytes for imperceptible gain; dropping to ~60 is often invisible and much smaller.

## 🎯 Say this in the interview

> "`next/image` is really an on-demand image CDN with a layout contract. It solves three things at once: it reserves the box from the aspect ratio so there's no CLS, it emits a `srcset` so a phone doesn't download a desktop-sized file, and it transcodes to AVIF or WebP based on the `Accept` header. The two props I never skip: `sizes`, because without it a responsive or `fill` image assumes `100vw` and silently overserves the biggest candidate everywhere; and `priority` on exactly the LCP image to preload it and opt it out of lazy-loading. I prefer static imports so dimensions and the blur placeholder come for free. If the team already runs Cloudinary, I wire a custom loader so Next still owns lazy-loading and layout while their CDN does the resizing — you don't want to pay for two optimizers. And remote hosts have to be allow-listed in `remotePatterns`, which is really an SSRF guard."

## 🔗 Go deeper

- [Next.js — Image optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images) — the component, loaders, and config.
- [Next.js — `next/image` API](https://nextjs.org/docs/app/api-reference/components/image) — every prop, including `sizes`, `fill`, `priority`.
- [web.dev — Optimize Cumulative Layout Shift](https://web.dev/articles/optimize-cls) — why reserving image space matters for the metric.
- [MDN — Responsive images (`srcset`/`sizes`)](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images) — the browser mechanism Next automates.
