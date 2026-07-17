<div align="center">

# Micro-frontends

<sub>🏛️ Architecture · 🔴 Hard · ⏱ 2h · `#micro-frontends` `#scale`</sub>

<a href="../README.md">⬅ Architecture</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Micro-frontends split a single app into independently-built, independently-deployed pieces owned by different teams. They are an **organisational** solution, not a technical one: you take on real runtime cost — duplicated dependencies, styling isolation, cross-app communication — to buy **team autonomy and independent deploys**. If you don't have the team problem, you're paying the tax for nothing.

---

## 🧠 Mental model

The reference frame that clarifies everything: **micro-frontends are microservices' pain moved to the browser.** On the backend, microservices trade a monolith's simplicity for the ability to let 30 teams ship on their own cadence. Micro-frontends make the exact same trade in the UI layer — and the browser makes it *harder*, because unlike servers, all the pieces have to coexist in **one DOM, one set of globals, one CSS cascade, one main thread**.

So the real question is never "is this modern?" It's **"do I have Conway's-law pressure?"** If one team owns the whole frontend, a micro-frontend architecture is almost pure downside. The technology exists to answer an *org chart* problem: many teams, wanting to own and deploy their slice of one product without a shared release train.

## ⚙️ How it actually works

There are three integration seams, and picking the seam is 80% of the design:

**1. Build-time (packages).** Each team publishes an npm package; the container app installs and bundles them. Simple, great type-safety — but **not really micro-frontends**, because shipping a fix means the container re-installs, re-builds and re-deploys. You lost independent deployment, the whole point.

**2. Run-time via routing (per-route apps).** The reverse proxy or an app shell hands off whole routes to separately-deployed SPAs (`/checkout` → checkout app, `/account` → account app). Hard isolation, dead simple, and the browser does a full document load on hand-off. This is the boring, robust default and often the right answer.

**3. Run-time in the same page (composition).** Multiple apps render *simultaneously* on one screen. This is the hard mode, done via **Module Federation** (share code at runtime), **Web Components** (each MFE is a custom element), or **iframes** (bulletproof isolation, painful UX). Now you must solve, for real:

- **Dependency duplication.** Three MFEs each bundling React = three Reacts downloaded. You share singletons (via Module Federation `shared`) — but mismatched React versions across teams break hooks at runtime.
- **Style isolation.** One team's `.button { … }` bleeds into another's. You need Shadow DOM, CSS Modules, scoped prefixes, or a shared design system — global CSS is a landmine.
- **Cross-app communication.** No shared import graph, so teams talk via custom DOM events, a tiny shared event bus, or the URL. Shared *runtime state* across MFEs is where architectures go to die — keep it to a minimum.

The senior tell: **the integration is the product.** The app shell, shared dependency contract, and communication protocol are the actual engineering; the individual apps are the easy part.

## 💻 Code

```js
// A framework-agnostic contract: every MFE exports mount/unmount.
// The shell owns routing and lifecycle; the MFE owns its render.
export function mount(el, { onNavigate, authToken }) {
  const root = createRoot(el);
  root.render(<CheckoutApp token={authToken} onNavigate={onNavigate} />);
  return () => root.unmount();   // shell calls this on route change → no leaks
}
```

```js
// Cross-MFE communication: a decoupled event bus, NOT a shared store.
// Teams agree on event *names* (a contract), not on each other's code.
window.dispatchEvent(
  new CustomEvent('cart:item-added', { detail: { sku, qty } })
);
// Another MFE, deployed by another team, listens — zero build coupling:
window.addEventListener('cart:item-added', (e) => updateBadge(e.detail));
```

## ⚖️ Trade-offs

- **What you buy:** independent deploys, team autonomy, tech-stack freedom per team, fault isolation (one MFE crashing needn't take the page down), and the ability to strangle a legacy app incrementally.
- **What you pay:** larger total bundle (duplicated deps), a harder performance story (multiple frameworks, more JS), styling and global-scope collisions, cross-app state complexity, and a *distributed-systems debugging problem* in the browser — "who owns this bug?" across deploy boundaries.
- **When it's WRONG:** a single team; an app under, say, a handful of teams; a startup optimising for speed of iteration; or any team choosing it "to be modern." For most products a **modular monolith with clear module boundaries** delivers the maintainability people *think* they need from MFEs, at a fraction of the cost. Reach for micro-frontends when the *deploy coupling between teams* is the measured bottleneck — not before.
- **The honest test:** if you can't name the specific teams and the specific release-train pain, you don't need them yet.

## 💣 Gotchas interviewers probe

- **"What problem do micro-frontends solve?"** The senior answer is **team/deploy autonomy**, not performance or code quality. If a candidate pitches them as a perf win, that's a red flag — they usually make performance *worse*.
- **Shared dependency versioning.** Two MFEs on incompatible React versions and a shared singleton = runtime explosion (`Invalid hook call`). You need a governance policy on shared versions; "everyone picks their own stack" is a lie the moment you share React.
- **The bundle-size lie.** "Each app is small" ignores that the *user* downloads all of them. Total payload usually grows. Measure the whole page, not one MFE.
- **CSS leakage.** Global styles from one team restyling another's UI is the #1 production incident. Shadow DOM isolates but then your design system can't reach in either — pick your poison deliberately.
- **Shared auth/session.** Every MFE needs the token and needs to react to logout. Passing it via the shell contract is clean; each MFE fetching it independently is chaos.
- **Build-time "micro-frontends".** If shipping a change requires the container to rebuild, you have a modular monolith wearing a costume — which may be fine, but call it what it is.

## 🎯 Say this in the interview

> "I treat micro-frontends as an organisational tool, not a technical one — they're microservices' trade-off moved into the browser. You give up a simple, single build and take on duplicated dependencies, style isolation and cross-app communication, and in return you buy independent deployment and team autonomy. So the first thing I'd establish is whether there's actually a team-scaling problem — multiple teams blocked on a shared release train. If it's one team, I'd push back hard, because a modular monolith gives you the maintainability without the runtime tax. If we do adopt them, I'd design around the seams: a thin app shell owning routing and lifecycle, an explicit shared-dependency contract so we don't ship three Reacts, hard style isolation, and communication via events or the URL rather than shared runtime state — because shared state across deploy boundaries is where these architectures fail."

## 🔗 Go deeper

- [Martin Fowler — Micro Frontends](https://martinfowler.com/articles/micro-frontends.html) — the canonical write-up of the styles and their trade-offs.
- [micro-frontends.org](https://micro-frontends.org/) — patterns, integration techniques, and the composition approaches compared.
- [Module Federation](https://module-federation.io/) — the runtime code-sharing mechanism that makes same-page composition viable.
- [single-spa](https://single-spa.js.org/) — a mature meta-framework for the mount/unmount lifecycle contract.
