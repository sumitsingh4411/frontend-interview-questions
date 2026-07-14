<div align="center">

# Parallel & intercepting routes

<sub>▲ Next.js · 🔴 Hard · ⏱ 1h · `#routing` `#advanced`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **Parallel routes** (`@slot` folders) render *multiple pages into one layout at once*, each with its own loading/error state; **intercepting routes** (`(.)` / `(..)`) hijack a navigation to render a route *in the current layout* — the two combine to build the "photo opens in a modal on click, but is a full page on refresh/share" pattern.

---

## 🧠 Mental model

Normal routing renders **one page into one `children` hole**. These two features break that assumption.

**Parallel routes** give a layout *several* holes. A folder prefixed `@` is a **named slot** passed to the layout as a prop alongside `children`:

```
app/dashboard/
├─ layout.tsx        → receives { children, team, analytics }
├─ page.tsx          → the `children` slot
├─ @team/page.tsx    → the `team` slot
└─ @analytics/page.tsx → the `analytics` slot
```

Both slots render **simultaneously and independently** — each can have its own `loading.tsx` and `error.tsx`, so one section can stream in while another shows a spinner.

**Intercepting routes** answer a different question: *"can I show route B's content without leaving the layout I'm on?"* The `(.)`, `(..)`, `(...)` markers mean "match this route, but render it *here* instead of navigating away" — matching path segments like relative imports (`(.)` same level, `(..)` one up, `(...)` from root).

## ⚙️ How it actually works

The magic of the modal pattern is that **interception only happens on client navigation**. When you click a `<Link>` to `/photo/1`, the intercepting route `(.)photo/[id]` fires and renders the photo into a `@modal` parallel slot — you get an overlay without leaving the feed. When you **hard-load or refresh** `/photo/1`, there's no client navigation to intercept, so the *real* `photo/[id]/page.tsx` renders as a full page. One URL, two presentations, chosen by *how you arrived*.

Parallel slots need a **`default.tsx`** to define what renders when a slot has no match for the current URL (e.g. after a refresh, the `@modal` slot renders `default.tsx`, which typically returns `null`). Missing `default.tsx` is the #1 cause of a 404 on refresh.

## 💻 Code

```tsx
// app/layout.tsx — parallel slots arrive as named props
export default function Layout({
  children, modal,
}: { children: React.ReactNode; modal: React.ReactNode }) {
  return <>{children}{modal}</>;   // modal slot overlays the feed
}
```

```tsx
// app/@modal/(.)photo/[id]/page.tsx — INTERCEPTS clicks to /photo/[id]
import { Modal } from './modal';
export default async function PhotoModal({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <Modal><Photo id={id} /></Modal>;  // renders as overlay, feed stays behind
}
```

```tsx
// app/@modal/default.tsx — REQUIRED: what the slot shows when there's no match
export default function Default() { return null; }
```

```tsx
// app/photo/[id]/page.tsx — the real page (direct load / refresh / share)
export default async function PhotoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <FullPhoto id={id} />;
}
```

## ⚖️ Trade-offs

- **Parallel routes are the right tool for genuinely independent dashboard sections** — each streams and errors on its own, and you can conditionally render slots (e.g. `@login` vs `@dashboard` based on auth) without route juggling. The cost is conceptual overhead and mandatory `default.tsx` files.
- **Intercepting routes give you shareable, refresh-safe modals** — the killer feature over a plain client-state modal, which loses its content on reload and can't be linked. But the `(.)`/`(..)` matching is relative to *route* structure, not file structure, and getting the dots wrong is maddening to debug.
- **When NOT to use them:** a simple modal that never needs a URL is just `useState`. Reaching for intercepting routes there is over-engineering. Use these when the modal content must be *linkable and refresh-safe*.

## 💣 Gotchas interviewers probe

- **Forgetting `default.tsx` → 404 on refresh.** Every parallel slot needs one for URLs it doesn't match. This is the number-one gotcha.
- **Interception only fires on soft (client) navigation.** Refresh, direct visit, or opening in a new tab bypass it entirely — which is *by design*, and exactly what makes the full-page fallback work.
- **The `(.)` convention is relative to the route segment, not the folder on disk.** With route groups and slots in play, "one level up" can be counter-intuitive; you often need `(..)` from inside an `@slot`.
- **Slots affect navigation matching** — a slot that can't match the current sub-route falls back to `default.tsx` (or its previous active state during soft nav), which can surprise you when unrelated navigation blanks a slot.
- **These are advanced, niche features.** An interviewer probing them is testing depth; knowing *when they're overkill* is as much a signal as knowing the syntax.

## 🎯 Say this in the interview

> "Parallel routes let a layout render multiple pages at once — each `@slot` folder becomes a named prop with its own loading and error boundary, so dashboard sections stream independently. Intercepting routes, with the `(.)` and `(..)` markers, let me render another route inside the current layout instead of navigating away. Together they build the shareable-modal pattern: clicking a photo in a feed intercepts the navigation and renders it as an overlay in a `@modal` slot, but refreshing or sharing that URL bypasses interception and renders the real full page. The detail that catches everyone is `default.tsx` — every parallel slot needs one to define what shows when the slot doesn't match, otherwise you 404 on refresh. And interception only fires on client navigation, which is the whole trick behind the dual presentation."

## 🔗 Go deeper

- [Next.js — Parallel Routes](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes) — slots, `default.tsx`, conditional rendering.
- [Next.js — Intercepting Routes](https://nextjs.org/docs/app/building-your-application/routing/intercepting-routes) — the `(.)`/`(..)`/`(...)` conventions.
- [Next.js — Modal example](https://nextjs.org/docs/app/building-your-application/routing/parallel-routes#modals) — the canonical shareable-modal walkthrough.
