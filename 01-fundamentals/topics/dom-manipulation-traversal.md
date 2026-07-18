<div align="center">

# DOM manipulation & traversal

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#dom`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Manipulating the DOM is easy; manipulating it *fast* is about one thing: **never interleave reads and writes**. A read after a write forces the browser to synchronously recompute layout, and doing that in a loop is **layout thrashing** — the single most common self-inflicted frontend performance bug.

---

## 🧠 Mental model

The browser is **lazy on purpose**. When you write to the DOM, it does not immediately recompute layout — it marks the tree dirty and queues the work, hoping to batch all your writes into one layout pass before the next frame.

That optimisation collapses the instant you **read a layout property**. Because the browser must return a *correct* value, it is forced to flush every pending write and recompute layout **right now, synchronously**. This is called a **forced synchronous layout** (or "layout thrashing" when it happens repeatedly).

So the mental model is a simple state machine:

```
write, write, write  →  [browser batches, one layout at next frame]  ✅
write, read, write, read, write, read  →  [layout, layout, layout…]  ❌ O(n) layouts
```

**Batch your reads. Then batch your writes. Never alternate.**

## ⚙️ How it actually works

These properties are **layout-dependent** — reading any of them flushes pending style/layout:

`offsetTop/Left/Width/Height` · `clientTop/Left/Width/Height` · `scrollTop/Left/Width/Height` ·
`getBoundingClientRect()` · `getComputedStyle()` · `innerText` · `focus()` · `scrollIntoView()`

The killer is that this is invisible in the code. `el.offsetHeight` *looks* like a cheap property read. It can be one of the most expensive lines in your app.

**Traversal** — the two families, and the whitespace trap:

```js
// Node-level: includes Text (whitespace!) and Comment nodes
el.childNodes  el.firstChild  el.lastChild  el.nextSibling  el.previousSibling

// Element-level: skips text/comments — almost always what you want
el.children    el.firstElementChild  el.lastElementChild
el.nextElementSibling  el.previousElementSibling

el.closest('.card')  // ⬆️ walks UP the tree until it matches. Underused and excellent.
el.matches('.active')
```

`closest()` is the one to remember — it is what makes clean event delegation possible.

## 💻 Code

**Layout thrashing, and the fix.** This is the code interviewers want to see you spot:

```js
// ❌ Thrashing: read → write → read → write… one forced layout PER ELEMENT.
for (const box of boxes) {
  box.style.height = box.offsetHeight * 2 + 'px'; // read offsetHeight, then write
}

// ✅ Two phases: read everything, then write everything. ONE layout.
const heights = boxes.map((b) => b.offsetHeight); // all reads
boxes.forEach((b, i) => (b.style.height = heights[i] * 2 + 'px')); // all writes
```

**Batching insertions** — don't touch the live tree N times:

```js
// ❌ N reflow opportunities, N live-tree mutations
items.forEach((t) => list.appendChild(makeLi(t)));

// ✅ Build off-tree, insert once. The fragment's children are moved, not copied.
const frag = document.createDocumentFragment();
items.forEach((t) => frag.appendChild(makeLi(t)));
list.appendChild(frag); // one mutation
```

**Modern, safe insertion** (avoids `innerHTML`'s XSS and node-destruction):

```js
el.append('text', node);        // multiple nodes AND strings; strings are escaped
el.prepend(node);
el.before(node); el.after(node);
el.replaceChildren(...nodes);   // clears + inserts in one call
el.insertAdjacentHTML('beforeend', html); // parses, but does NOT destroy siblings
```

## ⚖️ Trade-offs

- **`innerHTML = '...'` destroys and recreates children.** Any event listeners, focus state, or scroll position on those children is lost, and it re-parses HTML (XSS risk). It is fast to *write* and expensive in every other sense.
- **`DocumentFragment` matters less than it used to.** Modern engines batch well, so a fragment's win is smaller than in 2010 — but it is still the right default, and it is *free*.
- **`requestAnimationFrame` is where writes belong**, not reads. Reading in rAF still forces layout; it just does so at a more predictable moment.

## 💣 Gotchas interviewers probe

- **"How would you make this loop faster?"** — if the loop reads `offsetHeight`/`getBoundingClientRect` and writes styles, the answer is *split the reads from the writes*. This is the question. Say "forced synchronous layout" out loud.
- **`getComputedStyle()` is a read** and flushes layout — people forget it isn't free.
- **`appendChild` on an existing node MOVES it**, it does not copy. Appending a node already in the tree removes it from its old parent. Use `cloneNode(true)` to duplicate.
- **`firstChild` is probably a whitespace Text node** — use `firstElementChild`.
- **`el.style.height` only reads *inline* styles**, not stylesheet-applied ones. For the real value you need `getComputedStyle()` — which costs a layout.
- **`closest()` searches self first**, then ancestors. It can return the element you called it on.

## 🎯 Say this in the interview

> "The correctness part is easy; the part that matters is layout thrashing. The browser batches DOM writes and defers layout to the next frame — but the moment I *read* a layout-dependent property like `offsetHeight` or `getBoundingClientRect`, it must flush all pending writes and recompute layout synchronously to give me a correct answer. So a loop that reads a dimension and then writes a style does one forced layout per iteration — O(n) layouts. The fix isn't a faster API, it's phase separation: read all the values into an array first, then do all the writes. Same for insertion — build into a `DocumentFragment` off-tree and append once rather than mutating the live tree N times."

## 🔗 Go deeper

- [javascript.info — Modifying the document](https://javascript.info/modifying-document) — the API surface, clearly.
- [Avoid large, complex layouts and layout thrashing](https://web.dev/articles/avoid-large-complex-layouts-and-layout-thrashing) — the performance half.
- [What forces layout / reflow](https://gist.github.com/paulirish/5d52fb081b3570c81e3a) — Paul Irish's canonical list of layout-flushing properties. Worth bookmarking for life.
