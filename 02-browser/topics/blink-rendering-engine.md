<div align="center">

# Blink rendering engine

<sub>🌐 Browser · 🟡 Medium · ⏱ 30m · `#internals`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Blink is the **rendering engine** inside Chromium — it turns HTML + CSS into the DOM, computes style and layout, and paints — while **V8** is the separate JavaScript engine bolted alongside it; the "browser engine" you hear about is really this pair plus the compositor.

---

## 🧠 Mental model

People say "browser engine" as if it's one thing. It's cleanly two responsibilities:

| Component | Owns | Chromium | Firefox | Safari |
|---|---|---|---|---|
| **Rendering engine** | HTML/CSS → DOM, style, layout, paint | **Blink** | Gecko | WebKit |
| **JS engine** | Parse & execute JavaScript | V8 | SpiderMonkey | JavaScriptCore |

Blink is a **fork of WebKit** (2013), which was itself a fork of KHTML. So Chrome and Safari share deep ancestry, which is why their rendering quirks often rhyme. Blink is the part that builds the DOM tree, resolves the cascade into a computed style for every node, does layout, and records paint operations. It hands JS execution *out* to V8 and pixel compositing *out* to the compositor — Blink is the middle of the pipeline, not the whole thing.

## ⚙️ How it actually works

**Where Blink sits.** In a renderer process, Blink and V8 live in the *same* main thread and are tightly coupled through **bindings**: the DOM you touch from JS (`document.querySelector`, `el.style`) is a set of C++ objects in Blink, exposed to V8 via generated binding code (Web IDL). Every `el.classList.add(...)` is a JS→C++ hop across that boundary — cheap individually, but a source of overhead in tight loops.

**What Blink actually does, in order:**

1. **Parsing** — tokenizes HTML into the DOM tree (a tree of C++ `Node` objects), and CSS into the CSSOM.
2. **Style** — resolves the cascade + inheritance into a single *computed style* per element (Blink's `ComputedStyle`), the input to layout.
3. **Layout** — computes geometry (box positions and sizes). Modern Blink uses **LayoutNG**, a rewrite of the layout engine for correctness and better fragmentation (multicol, print).
4. **Paint** — records *what* to draw as a display list of paint ops (not pixels yet).
5. **Layerize + commit** — splits content into compositor layers and hands them to the compositor thread.

**The DOM is not JavaScript.** This is the load-bearing insight. The DOM is a language-agnostic C++ data structure living in Blink; JS just gets a *view* of it through bindings. That's why DOM operations are "slow" relative to pure JS math — you're crossing into another subsystem and potentially invalidating style/layout — and why frameworks batch DOM writes.

**Blink is standards-driven.** Features ship behind flags, go through an "Intent to Ship" process, and are gated on interop. When you read a caniuse note like "Chrome 111," that's a Blink release.

## 💻 Code

Blink is C++; you interact with it through the DOM/CSSOM APIs it exposes.

```js
// Every one of these calls crosses the V8 ↔ Blink binding boundary:
const el = document.getElementById('app'); // returns a Blink Node, wrapped for JS
el.textContent = 'hi';                      // Blink mutates the DOM tree
getComputedStyle(el).color;                 // asks Blink's style system for computed value

// ❌ Thrashing the boundary + forcing style/layout inside a loop:
for (const item of items) {
  container.innerHTML += `<li>${item}</li>`; // reparse + relayout every iteration
}

// ✅ Build detached, cross the boundary once:
const frag = document.createDocumentFragment();
for (const item of items) {
  const li = document.createElement('li');
  li.textContent = item;
  frag.append(li);
}
container.append(frag); // one attach → one style/layout pass
```

## ⚖️ Trade-offs

- **Blink + V8 sharing a thread** keeps DOM access synchronous and simple (no cross-thread locking on the DOM), but it means heavy JS and heavy layout compete for the same thread — the root cause of most jank.
- **The fork from WebKit** let Chrome move fast (drop legacy ports, adopt Oilpan GC, LayoutNG) but split the web into "Blink behaviour" vs "WebKit behaviour," which matters because **iOS forces every browser onto WebKit** — your Blink assumptions can break on iPhone.
- **You never choose an engine as a web dev**, but you *do* need to know which behaviours are engine-specific (scrollbar styling, some CSS features, GC timing) vs standardized.

## 💣 Gotchas interviewers probe

- **Blink ≠ V8.** Blink renders; V8 runs JS. Conflating them is a common miss. They're separate projects that cooperate inside one process.
- **The DOM is a C++ structure, not JS objects.** DOM "slowness" is the binding cross + style/layout invalidation, not slow property access.
- **Chrome and Safari are cousins, not clones.** Both descend from WebKit, but Blink forked in 2013 and has diverged substantially (layout engine, GC, features).
- **On iOS, "Chrome" is Blink in name only** — Apple's rules force WebKit under the hood, so `caniuse "Chrome"` can lie on iPhone.
- **`getComputedStyle` and geometry reads can force synchronous layout** ("forced reflow") because they must ask Blink for an up-to-date answer — a classic performance trap.

## 🎯 Say this in the interview

> "Blink is Chromium's rendering engine — it builds the DOM and CSSOM, resolves style, does layout with LayoutNG, and records paint. It's distinct from V8, which is the JavaScript engine; they share the renderer's main thread and talk through Web IDL bindings. The mental model I lean on is that the DOM isn't JavaScript — it's a C++ tree inside Blink that V8 gets a wrapped view of, so every DOM call is a boundary cross that can also invalidate style and layout. That's the real reason DOM manipulation is 'expensive' and why we batch writes. Blink is a 2013 fork of WebKit, so Chrome and Safari share ancestry but have diverged — and it's worth remembering that on iOS every browser is still WebKit, so Blink-specific behaviour won't hold there."

## 🔗 Go deeper

- [Chromium — Blink](https://www.chromium.org/blink/) — the engine's own home page and design docs.
- [LayoutNG](https://developer.chrome.com/docs/chromium/layoutng) — the modern layout engine inside Blink and why it was rewritten.
- [MDN — How browsers work](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) — a vendor-neutral map of where the rendering engine fits.
