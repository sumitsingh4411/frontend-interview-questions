<div align="center">

# Server vs Client Components

<sub>▲ Next.js · 🔴 Hard · ⏱ 1h · `#rsc` `#rendering`</sub>

<a href="../README.md">⬅ Next.js</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Server Components run **only on the server** and ship **zero JS** (great for data and secrets); Client Components run on the server for the initial HTML *and* hydrate in the browser (needed for state, effects, and event handlers). `'use client'` marks the **boundary** where the bundle begins — and everything below it becomes client code.

---

## 🧠 Mental model

The default is **Server Component**. You opt *into* the client with `'use client'`. The distinction is about *capabilities and cost*:

| | Server Component | Client Component |
|---|---|---|
| Runs where | server only | server (SSR) **+** browser (hydration) |
| Ships JS | **none** | yes — it's in the bundle |
| Can | `await` data, read secrets, hit the DB | `useState`, `useEffect`, `onClick`, browser APIs |
| Cannot | use hooks or event handlers | import server-only code, `await` in the body |

The mental model that unlocks it: `'use client'` is not "make this file client-side", it's **"this is where the client bundle starts."** Everything you import *below* that directive is pulled into the browser bundle too, whether or not it needs to be. So the goal is to **push `'use client'` down to the leaves** — a button, an input — and keep the expensive, data-heavy tree on the server.

## ⚙️ How it actually works

A Server Component renders to the **RSC payload** — a serialised description of the React tree — never to a JS bundle. Client Components appear in that payload as *holes* ("mount this client component here, with these props"). The browser downloads only the client components' JS and hydrates them into those holes. This is why RSC can dramatically shrink bundles: your layout, data fetching, and static content weigh nothing on the client.

The **composition rule** that confuses everyone: a Server Component can *render* a Client Component, but a Client Component **cannot import** a Server Component. It *can*, however, receive one as a **prop** (`children`). This is the key pattern — a client component like a `<Tabs>` wrapper can slot server-rendered content through `children` without dragging that content into the client bundle.

Props crossing the boundary must be **serializable** — strings, numbers, plain objects, arrays. You cannot pass a function, a class instance, or a Date... to a client component. (Server Action functions are the one special exception; they serialise to a reference.)

## 💻 Code

```tsx
// ❌ 'use client' at the top pulls the ENTIRE tree — including the data-heavy
//    <Feed/> and its dependencies — into the browser bundle.
'use client';
import { Feed } from './feed';
export default function Page() {
  const [open, setOpen] = useState(false);
  return <><button onClick={() => setOpen(true)}/><Feed /></>;
}
```

```tsx
// ✅ Keep the page a Server Component. Isolate interactivity in a leaf.
import { Feed } from './feed';            // stays on the server, ships 0 JS
import { Toggle } from './toggle';        // the ONLY client component
export default function Page() {
  return <><Toggle /><Feed /></>;
}
```

```tsx
// ✅ The children-as-prop pattern: a client shell wrapping server content
'use client';
export function Panel({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return open ? <div>{children}</div> : null;   // children can be a Server Component!
}
// Used from a server component: <Panel><ServerHeavyThing /></Panel>
```

## ⚖️ Trade-offs

- **Server Components win on bundle size, data locality, and security** — data fetching lives in the component, secrets never ship, and static content costs nothing on the client. This is the default for a reason.
- **Client Components are unavoidable for interactivity** — anything with state, effects, event handlers, or browser APIs (`window`, `localStorage`, `IntersectionObserver`). The skill is *scoping* them tightly.
- **When to just use a Client Component:** highly interactive widgets (a rich editor, a drag-and-drop canvas) are client top-to-bottom; forcing artificial server/client splits there is friction for no gain. RSC is about the *default*, not a mandate.

## 💣 Gotchas interviewers probe

- **`'use client'` is a boundary, not a per-file switch.** Everything imported below it joins the client bundle. Putting it at the top of a page is the single biggest bundle-bloat mistake.
- **Client Components can't import Server Components — but can take them as `children`/props.** Knowing the `children` workaround is the senior signal here.
- **Props across the boundary must be serializable.** Passing a function (other than a Server Action) or a class instance throws.
- **Server Components can't use hooks or `onClick`.** "Event handlers cannot be passed to Client Component props" errors mean you tried to hand a function from a server component to a client one incorrectly.
- **A component isn't "server" or "client" intrinsically** — the *import graph* decides. The same component imported under a `'use client'` boundary is a client component.
- **`useState` in a Server Component** is the classic beginner error; the fix is a client leaf, not `'use client'` on the whole page.
- **Environment variables:** only `NEXT_PUBLIC_*` reach client components; server-only secrets are safe in Server Components and will be `undefined` if you try to read them client-side.

## 🎯 Say this in the interview

> "Everything is a Server Component by default — it runs only on the server, ships zero JavaScript, and can await data and read secrets directly. I add `'use client'` only where I need state, effects, or event handlers. The key insight is that `'use client'` isn't a per-file switch, it's the boundary where the client bundle begins — everything imported below it gets bundled for the browser. So I push it down to the leaves, like a single button, and keep the data-heavy tree on the server. The composition rule I lean on: a client component can't import a server component, but it can receive one through `children`, so a client wrapper like a collapsible panel can render server content without pulling it into the bundle. And props crossing the boundary have to be serializable."

## 🔗 Go deeper

- [Next.js — Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components) — rendering strategies and the RSC payload.
- [Next.js — Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components) — when and how to opt in.
- [Next.js — Composition Patterns](https://nextjs.org/docs/app/building-your-application/rendering/composition-patterns) — the children-as-prop and interleaving rules.
- [React — `'use client'`](https://react.dev/reference/rsc/use-client) — the directive's exact semantics.
