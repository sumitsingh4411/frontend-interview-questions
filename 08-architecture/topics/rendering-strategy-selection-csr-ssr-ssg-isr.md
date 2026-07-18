<div align="center">

# Rendering strategy selection (CSR/SSR/SSG/ISR)

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 1h · `#rendering`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The choice is a function of two questions: **where does the HTML get built** (browser, request-time server, or build server) and **how fresh must it be** — and the entire spectrum from CSR to SSG exists to trade *time-to-content* against *data freshness* against *server cost*.

---

## 🧠 Mental model

Every strategy is one answer to: **when do we turn data into HTML?**

```
CSR  → in the browser, after JS loads      (build once, render per-user, per-device)
SSR  → on the server, per request          (render fresh every hit)
SSG  → on the build server, once           (render at deploy, serve static)
ISR  → SSG + background re-render on a TTL  (static, but self-healing to fresh)
```

Read that as a timeline sliding earlier and earlier. CSR renders as late as possible (worst first paint, cheapest server, most dynamic). SSG renders as early as possible (best first paint, cheapest serve, stalest data). SSR and ISR sit in between. **There is no "best" — there's only "fresh enough, fast enough, cheap enough" for a given route.** And crucially the unit of decision is the *route*, not the app: a marketing page wants SSG, a personalised dashboard wants CSR-with-SSR-shell, a product page wants ISR.

The trap in interviews is treating this as one global switch. Staff-level answers are per-route and mention that modern frameworks (Next.js App Router, Remix, Astro) let you mix them in one app, and that **streaming SSR + islands** has quietly made the old CSR-vs-SSR binary obsolete.

## ⚙️ How it actually works

The mechanics that actually differ:

| | CSR | SSR | SSG | ISR |
|---|---|---|---|---|
| HTML built | in browser | per request | at build | at build, refreshed on TTL |
| TTFB | fast (empty shell) | slow (waits on data) | fastest (CDN) | fastest (CDN) |
| First contentful paint | slow | fast | fastest | fastest |
| Data freshness | real-time | per-request | build-time | up to TTL stale |
| Server cost per hit | ~zero | high | zero | near-zero |
| Personalisation | trivial | per-request | none | none (page-level) |

**Hydration is the tax nobody sees on the diagram.** SSR/SSG send HTML the user can see immediately — but it's inert until the JS downloads, parses, and *hydrates* (re-attaches event listeners by re-running your components on the client). Between paint and hydration the page looks ready but doesn't respond. That gap — poor **INP/TTI** despite great **FCP** — is the dirty secret of SSR, and why "SSR is faster" is only half true. It's faster to *see*, not always faster to *use*.

**ISR's cleverness** is `stale-while-revalidate` at the page level: serve the cached static page instantly, and if it's older than the `revalidate` window, kick off a background regeneration so the *next* visitor gets fresh HTML. The current visitor never waits. You get static performance with eventual freshness — at the cost of some users seeing stale data for one TTL window.

**Streaming SSR** (React `renderToPipeableStream`, Suspense) flushes HTML in chunks as data resolves, so the shell paints before slow data is ready. This is what makes SSR viable for pages with a slow API call — you don't block the whole document on the slowest query.

## 💻 Code

Same page, three strategies in Next.js App Router — the config *is* the decision:

```tsx
// SSG — rendered at build, served from CDN forever (until next deploy)
export const dynamic = 'force-static';
async function Page() {
  const posts = await getPosts(); // runs at build time
  return <List posts={posts} />;
}

// ISR — static, but self-heal every 60s
export const revalidate = 60; // serve cached, regenerate in background after 60s

// SSR — fresh on every request (opt out of all caching)
export const dynamic = 'force-dynamic';
async function Page() {
  const data = await getPersonalisedFeed(cookies()); // needs the request → per-request
  return <Feed data={data} />;
}
```

Streaming the slow part so the shell paints immediately:

```tsx
// Shell + fast content render now; the slow widget streams in when ready.
export default function Page() {
  return (
    <>
      <Header />                          {/* paints immediately */}
      <Suspense fallback={<Skeleton />}>
        <SlowRevenueChart />              {/* streamed when its data resolves */}
      </Suspense>
    </>
  );
}
```

## ⚖️ Trade-offs

- **SSG is unbeatable until you have too many pages or too-fresh data.** 50k product pages take forever to build and go stale the moment a price changes — that's the exact gap ISR fills. But ISR means *some* users see stale prices for one TTL; if that's unacceptable (checkout, inventory), you need SSR.
- **SSR buys you first paint and SEO but you now own a server that renders on every hit** — real compute cost, cold starts on serverless, and a new failure mode (your render server is now on the critical path for *every* page, not just an API). CSR fails gracefully to a spinner; SSR failing means a blank 500.
- **CSR is the right call for app-shell products behind a login** (dashboards, editors) where SEO is irrelevant, data is per-user, and the first load can afford a skeleton. Don't SSR a Figma.
- **Don't SSR for SEO if SSG works** — you're paying per-request compute for content that's identical for everyone. That's just an uncached SSG.

## 💣 Gotchas interviewers probe

- **"SSR is faster" — faster at what?** Faster FCP, not faster TTI. The hydration gap can make an SSR page *feel slower to interact with* than a CSR one. Naming INP/hydration here is a strong senior signal.
- **Hydration mismatch.** If server HTML and client render disagree (e.g. rendering `Date.now()` or `window`-dependent output), React throws it away and re-renders — you paid for SSR and got CSR performance. Deterministic render between server and client is non-negotiable.
- **ISR staleness window is a correctness decision, not a perf tuning knob.** A 60s `revalidate` on a stock-availability page means overselling. Pick TTL by *how wrong is acceptable*, not by feel.
- **The waterfall.** SSR that awaits data sequentially blocks TTFB on the slowest query. Streaming/Suspense exists precisely to break that; not using it wastes SSR's whole advantage.
- **"Static" personalised content is a contradiction.** SSG/ISR can't vary per-user at the page level — personalisation has to come from client-side fetch or edge middleware. Candidates who "SSG the logged-in dashboard" miss this.

## 🎯 Say this in the interview

> "I decide per route, not per app, and I'm really answering two questions: where does the HTML get built, and how fresh does it need to be. A marketing page is SSG — build once, serve from the CDN, near-zero cost. A product catalogue with 50k pages and changing prices is ISR — static speed but it self-heals on a TTL, though I pick that TTL by how much staleness is *correct*, because on inventory that window is oversell risk. A personalised dashboard behind a login is CSR with maybe an SSR shell — SEO is irrelevant and the data is per-user. I reach for SSR when I need both fresh per-request data and first-paint SEO, and then I stream with Suspense so the shell isn't blocked on the slowest query. The nuance I always raise is hydration: SSR improves first paint but there's a window where the page looks ready and isn't interactive, so 'SSR is faster' is only true for FCP, not INP."

## 🔗 Go deeper

- [web.dev — Rendering on the web](https://web.dev/articles/rendering-on-the-web) — the canonical taxonomy of the whole spectrum and its trade-offs.
- [Next.js — Rendering](https://nextjs.org/docs/app/building-your-application/rendering) — how static, dynamic, and streaming map to real config.
- [Next.js — Incremental Static Regeneration](https://nextjs.org/docs/app/building-your-application/data-fetching/incremental-static-regeneration) — the stale-while-revalidate page model in detail.
- [React — `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) — streaming SSR and how Suspense flushes chunks.
