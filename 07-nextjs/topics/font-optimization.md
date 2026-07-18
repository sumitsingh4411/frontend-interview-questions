<div align="center">

# Font optimization

<sub>▲ Next.js · 🟢 Easy · ⏱ 30m · `#performance` `#fonts`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — `next/font` does two things a `<link>` to Google Fonts can't: it **self-hosts the font files at build time** (zero requests to a third-party origin, no privacy/consent problem) and it **auto-generates a metric-matched fallback** so text doesn't reflow when the web font swaps in — eliminating font-driven CLS. It's a build-time optimizer, not a runtime loader.

---

## 🧠 Mental model

The old way — `<link href="fonts.googleapis.com/...">` — has three hidden costs: an extra DNS + TLS handshake to Google, a render-blocking CSS request, and layout shift when the real font replaces the fallback (different metrics → text reflows). Plus, in the EU, that request is a GDPR liability (a court literally ruled on it).

`next/font` moves all of it to **build time**:

```
build: download font → subset → self-host under /_next → compute fallback metrics
runtime: preload the file from YOUR origin, apply size-adjust fallback → no reflow
```

The framing: **`next/font` turns a network-dependent runtime concern into a static asset baked into your deploy.** There is no request to a font provider in production. The font is just another file you serve.

## ⚙️ How it actually works

**Two entry points:**

- `next/font/google` — pick any Google font by name; Next downloads and **self-hosts** it at build. Nothing hits Google at runtime.
- `next/font/local` — point at `.woff2` files in your repo for custom/licensed fonts.

**The CLS-killer: `size-adjust` fallback.** When you call `Inter({...})`, Next reads the font's real metrics (ascent, descent, x-height, average char width) and emits an `@font-face` for a *local fallback* (e.g. Arial) tweaked with `size-adjust`, `ascent-override`, and `descent-override` so the fallback occupies **the same space** as Inter. When the web font swaps in, glyph boxes don't change → no reflow. This is the part hand-rolled font loading almost never gets right.

**`display: 'swap'`** (the default) shows the fallback immediately, then swaps — no invisible text (FOIT). Combined with the metric override, the "swap" is nearly imperceptible.

**Subsetting** ships only the glyphs you need. Declaring `subsets: ['latin']` drops the Cyrillic/Greek ranges — often cutting file size by more than half.

**No layout shift from preload:** Next emits `<link rel="preload">` for the self-hosted file so it's fetched early with high priority.

**Variable fonts** are preferred — one file covers all weights. If you use a non-variable font you must enumerate `weight: ['400','700']`.

Everything is scoped through a generated `className` (or CSS variable), so there's no global leakage and it composes with Tailwind.

## 💻 Code

```tsx
// app/layout.tsx — self-hosted Google font, applied to the whole app
import { Inter } from 'next/font/google';

// Runs at BUILD time. `Inter` is a variable font → no weight array needed.
const inter = Inter({
  subsets: ['latin'],       // ship only Latin glyphs
  display: 'swap',          // show fallback immediately, then swap (no FOIT)
  variable: '--font-inter', // expose as a CSS var for Tailwind/others
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      {/* apply the class, or reference var(--font-inter) in CSS */}
      <body className={inter.className}>{children}</body>
    </html>
  );
}
```

```tsx
// Local / licensed font — same benefits, files live in your repo
import localFont from 'next/font/local';

const brand = localFont({
  src: [
    { path: './Brand-Regular.woff2', weight: '400', style: 'normal' },
    { path: './Brand-Bold.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  variable: '--font-brand',
});
```

```js
// tailwind.config.js — wire the CSS variable in
module.exports = {
  theme: { extend: { fontFamily: { sans: ['var(--font-inter)', 'sans-serif'] } } },
};
```

## ⚖️ Trade-offs

- **When it's overkill:** if you're using a pure system font stack (`system-ui, -apple-system, ...`), you need no web font at all — that's the fastest possible option and `next/font` adds nothing.
- **Build-time coupling.** Fonts are resolved during `next build`, so a font must be importable at build. Fully dynamic, user-chosen fonts at runtime don't fit the model.
- **Self-hosting means you own the bytes.** You lose Google's shared cross-site cache — but that cache was mostly killed by browser cache partitioning years ago, so it's rarely a real loss, and you gain privacy + one fewer origin.
- **Non-variable fonts multiply files.** Each declared weight/style is a separate file to preload; prefer a variable font to collapse them into one.

## 💣 Gotchas interviewers probe

- **"How does Next avoid font layout shift?"** The metric-matched `size-adjust` fallback `@font-face`, not just `display: swap`. Naming only `swap` is a partial answer — swap prevents FOIT but a plain fallback with different metrics still reflows.
- **`next/font/google` makes zero runtime requests to Google.** Candidates often think it just proxies the `<link>`. It self-hosts at build — which is also the GDPR fix.
- **Forgetting `subsets`** ships every language's glyphs — a needlessly huge file. Always subset.
- **Calling the font loader inside a component** instead of at module scope re-triggers work and breaks the optimization — declare it at the top level of a module.
- **Non-variable fonts need explicit `weight`.** Omitting it (or expecting all weights free) is a common miss.
- **`preload` only covers fonts used on the current route.** A font declared but referenced only deep in a rarely-hit component won't be preloaded on unrelated pages — usually what you want.

## 🎯 Say this in the interview

> "`next/font` does the two things a plain Google Fonts `<link>` can't. First, it self-hosts the font at build time, so production makes zero requests to a third-party font origin — which is both a performance win, one fewer handshake and no render-blocking request, and the GDPR fix in the EU. Second, and this is the part people miss, it generates a metric-matched fallback `@font-face` using `size-adjust` and ascent/descent overrides so the fallback font takes up exactly the same space as the real one. That's what actually kills font CLS — `display: swap` alone still reflows because the fallback has different metrics. I always set `subsets` to ship only the glyphs I need, prefer a variable font so one file covers every weight, and expose it as a CSS variable so Tailwind can reference it. If the design allows a system font stack, I use that and skip web fonts entirely."

## 🔗 Go deeper

- [Next.js — Font optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) — self-hosting, `local` fonts, variables.
- [Next.js — `next/font` API](https://nextjs.org/docs/app/api-reference/components/font) — every option, including `display` and `subsets`.
- [web.dev — Prevent layout shift with `size-adjust`](https://web.dev/articles/css-size-adjust) — the metric-override mechanism Next automates.
- [MDN — `font-display`](https://developer.mozilla.org/en-US/docs/Web/CSS/@font-face/font-display) — FOIT vs FOUT and the `swap` behaviour.
