<div align="center">

# SSR & hydration

<sub>⚛️ React · 🔴 Hard · ⏱ 1h · `#ssr`</sub>

<a href="../README.md">⬅ React</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — SSR renders your React tree to an **HTML string on the server** so users see content before JS loads. **Hydration** (`hydrateRoot`) then *adopts* that existing DOM instead of rebuilding it — walking server HTML and the client vtree in lockstep to attach event listeners. The server and client render must **match**, or you get a hydration mismatch. Hydration is not free: it re-does the render work while the DOM already exists.

---

## 🧠 Mental model

SSR and hydration are two halves of one handoff:

1. **Server:** run the components, produce HTML, ship it. The user gets a **paintable, readable page fast** — but it's inert. Buttons don't work; there are no listeners yet.
2. **Client:** `hydrateRoot` boots React over that *same* HTML. It doesn't recreate nodes — it **adopts** them, building the fiber tree and wiring up handlers on top of the DOM the server sent.

The reason mismatches are fatal is this adoption step: React assumes the DOM already matches what it *would* have rendered. If it doesn't, React can't trust the tree. So the golden rule is **the first client render must produce byte-identical output to the server render.**

## ⚙️ How it actually works

`hydrateRoot(container, <App />)` walks the server HTML and the client element tree together, attaching listeners and constructing fibers **without creating DOM nodes**. React 18 hydration is **concurrent and selective**: it can hydrate boundaries independently, prioritize the one the user just interacted with, and **replay events** captured before hydration reached that subtree.

On a mismatch, React 18 logs an error; for **text** differences it patches to the client value, but a **structural** mismatch makes React discard that subtree's server HTML and re-render it on the client (silently degrading your SSR benefit). React 19 improves the diagnostics with a precise diff of what differed.

The performance truth: SSR improves **TTFB** and **FCP** (something on screen sooner), but **TTI** (interactivity) is gated on hydration — which repeats the render work. That's the **"uncanny valley"**: the page looks ready but doesn't respond. Streaming SSR + selective hydration + RSC exist specifically to shrink that gap.

## 💻 Code

```js
// Server: stream HTML (preferred over the buffering renderToString).
import { renderToPipeableStream } from 'react-dom/server';
const { pipe } = renderToPipeableStream(<App />, { onShellReady() { pipe(res); } });

// Client: adopt the server HTML — do NOT createRoot over it.
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);
// ❌ createRoot(...).render(<App/>) throws away server HTML and re-renders (CSR)
```

```jsx
// ❌ Mismatch: the server has no window; branching in render diverges the trees.
function Widget() {
  const wide = typeof window !== 'undefined' && window.innerWidth > 768; // differs!
  return <div>{wide ? 'desktop' : 'mobile'}</div>;
}

// ✅ Render the server-safe value first, then adjust AFTER hydration in an effect.
function Widget() {
  const [wide, setWide] = useState(false);      // matches server on first render
  useEffect(() => setWide(window.innerWidth > 768), []);
  return <div>{wide ? 'desktop' : 'mobile'}</div>;
}

// For intentionally-divergent content (timestamps), silence it explicitly:
<time suppressHydrationWarning>{new Date().toLocaleTimeString()}</time>
```

## ⚖️ Trade-offs

- **SSR helps perceived load and SEO, not time-to-interactive.** You paint sooner, but hydration re-runs the work; a heavy page can look ready and feel broken. Budget hydration cost, don't assume SSR is "faster" outright.
- **Hydration cost scales with tree size.** The whole tree (in non-streaming SSR) must hydrate before it's interactive. Streaming + selective hydration, or moving static parts to RSC (zero hydration), are the real fixes — not "add SSR and hope."
- **It constrains what render may do.** Anything non-deterministic across environments — `Date.now()`, `Math.random()`, locale/timezone formatting, reading `window`/`localStorage` — must be deferred to after hydration or it diverges.

## 💣 Gotchas interviewers probe

- **`createRoot` vs `hydrateRoot`.** Using `createRoot` on server HTML throws it away and does a full client render — losing the entire SSR benefit. `hydrateRoot` adopts it.
- **Branching on `window`/`localStorage` in render.** The server has neither, so the first client render must ignore them too. Read them in `useEffect` and update after mount (the two-pass pattern).
- **`Math.random()` / `Date.now()` / `useId` alternatives.** Non-deterministic IDs differ per environment — use `useId` for anything rendered into an attribute.
- **Invalid HTML nesting.** A `<div>` inside a `<p>`, or a `<td>` outside a `<tr>`, gets "fixed" by the browser parser, so the server DOM no longer matches React's tree → mismatch.
- **Hydration is not faster than CSR to interactive.** It's the same render work *plus* an existing DOM to reconcile against. The win is earlier paint, not earlier interactivity.
- **Third-party scripts mutating the DOM before hydration** (ad injectors, translators) shift nodes and break adoption.

## 🎯 Say this in the interview

> "SSR renders the tree to an HTML string on the server so the user sees content before any JS loads, and hydration is the client attaching React to that existing DOM — `hydrateRoot` walks the server HTML and the client tree together and wires up listeners without recreating nodes. The catch is the first client render has to match the server output exactly, because React adopts the DOM rather than rebuilding it; if they diverge you get a hydration mismatch and React re-renders that subtree client-side, losing the SSR benefit. So I keep render deterministic — no `window`, `localStorage`, `Date.now`, or random in the first pass — and I defer client-only values to a `useEffect` two-pass, or use `useId` for stable IDs. The perf nuance I'd stress: SSR improves first paint and SEO, but interactivity is gated on hydration, which repeats the render work — that's the uncanny valley, and streaming plus selective hydration and RSC are what actually close it."

## 🔗 Go deeper

- [react.dev — `hydrateRoot`](https://react.dev/reference/react-dom/client/hydrateRoot) — adoption semantics and mismatch handling.
- [react.dev — `renderToPipeableStream`](https://react.dev/reference/react-dom/server/renderToPipeableStream) — streaming SSR on Node.
- [web.dev — Rendering on the web](https://web.dev/articles/rendering-on-the-web) — SSR vs CSR vs hydration trade-offs and TTI.
- [web.dev — Interaction to Next Paint / TTI](https://web.dev/articles/tti) — why hydration gates interactivity.
