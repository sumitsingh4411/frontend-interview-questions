<div align="center">

# The DOM

<sub>🧱 Fundamentals · 🟢 Easy · ⏱ 45m · `#dom` `#basics`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The DOM is a **live, in-memory object tree** the browser builds from your HTML, and the API through which JavaScript reads and mutates the page. It is *not* your HTML, it is *not* what you see on screen, and the gap between those three things is where most DOM interview questions live.

---

## 🧠 Mental model

Hold three distinct things in your head — interviewers probe the seams between them:

| | What it is | Gotcha |
|---|---|---|
| **HTML** | The source text you shipped | Immutable; the DOM can diverge from it instantly |
| **DOM** | A live object tree parsed from that text | Includes nodes the parser *invented* (`<tbody>`) and fixed |
| **Render tree** | Only the nodes that get painted | Excludes `display:none`; excludes `<head>` |

The single most important word is **live**. The DOM is not a snapshot. Some of its APIs return collections that keep updating themselves under you — which is a genuine source of infinite loops.

## ⚙️ How it actually works

The parser turns bytes → tokens → nodes → tree. Crucially it is **error-tolerant and will rewrite your markup**: it auto-closes tags, and it will insert a `<tbody>` you never wrote. So the DOM you query is frequently not the HTML you authored.

The tree is made of **Nodes**, and `Element` is only one kind. This distinction is the source of endless off-by-one bugs:

```
Node  ──┬── Element      (<div>)
        ├── Text         ("hello", and ALSO the whitespace between your tags)
        ├── Comment      (<!-- -->)
        └── Document
```

Whitespace between tags is a **real Text node**. That is why:

```js
el.childNodes    // NodeList  — includes text + comment nodes. Usually not what you want.
el.children      // HTMLCollection — elements only. Usually what you DO want.

el.firstChild        // often a whitespace Text node 😖
el.firstElementChild // the element you actually meant ✅
```

**Live vs static collections** — the classic trap:

```js
document.getElementsByTagName('div'); // HTMLCollection — LIVE, re-queries the document
document.querySelectorAll('div');     // NodeList       — STATIC snapshot
```

## 💻 Code

The infinite loop that this causes, and why:

```js
// ❌ Infinite loop. `divs` is LIVE — every appended div grows the collection.
const divs = document.getElementsByTagName('div');
for (let i = 0; i < divs.length; i++) {
  document.body.appendChild(document.createElement('div'));
}

// ✅ Static snapshot: length is fixed at query time.
const divs = document.querySelectorAll('div');
```

Reading the three "content" properties — they are not interchangeable:

```js
el.innerHTML   // parses HTML. XSS SINK. Never feed it untrusted input.
el.textContent // raw text of ALL nodes, incl. <script>/hidden. Fast, no reflow.
el.innerText   // "as rendered" text — respects display:none, text-transform.
               // ⚠️ Reading it FORCES A REFLOW because it depends on layout.
```

That last line is a real performance answer: `textContent` is cheap, `innerText` is not.

## ⚖️ Trade-offs

- **`innerHTML` is fast to write and dangerous to use.** It re-parses a string into nodes — convenient, destroys existing node identity (listeners on replaced children die), and is the canonical XSS vector. Prefer `textContent` for text, `createElement` for structure.
- **Live collections are cheap to obtain, expensive to iterate.** They re-query on access. In a hot loop, convert once: `[...el.children]`.
- **The DOM is a slow API, not a slow data structure.** Individual property reads are fast. What is slow is *interleaving* reads and writes, because reads force the browser to flush pending layout.

## 💣 Gotchas interviewers probe

- **"Is the DOM the same as your HTML?"** No — the parser corrects and invents nodes (`<tbody>`), and JS mutates it afterwards. View-source ≠ DevTools Elements panel.
- **`NodeList` is not an Array.** It has `forEach` but no `map`/`filter`. `HTMLCollection` has neither. Spread it: `[...nodes]`.
- **`childNodes` vs `children`** — the whitespace-Text-node trap. If someone's `firstChild` "randomly" returns text, this is why.
- **`innerText` forces reflow; `textContent` does not.** Knowing *why* (innerText is layout-dependent) is the senior signal.
- **`document.write` after load wipes the document.** It is not just deprecated, it is destructive — and it is why sync scripts must block the parser.
- **The DOM is a language-agnostic spec (WebIDL), not a JavaScript feature.** It is *host-provided*, which is why it doesn't exist in Node.

## 🎯 Say this in the interview

> "The DOM is a live object tree the browser builds from the HTML, and the API JS uses to read and mutate the page. Three things I keep separate: the HTML I shipped, the DOM — which can already differ, because the parser corrects markup and injects nodes like `tbody` — and the render tree, which is only the painted subset. The word that matters is *live*: `getElementsByTagName` returns a collection that keeps re-querying, so appending inside a loop over it never terminates, whereas `querySelectorAll` is a static snapshot. And I'm careful with `innerText` versus `textContent` — `innerText` is 'as rendered', so *reading it forces a layout flush*, while `textContent` is just the raw text and is cheap."

## 🔗 Go deeper

- [javascript.info — Document](https://javascript.info/document) — the clearest DOM walkthrough anywhere.
- [MDN — DOM introduction](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction) — the spec-accurate view.
- [MDN — Node vs Element](https://developer.mozilla.org/en-US/docs/Web/API/Node) — the type hierarchy the whitespace bug comes from.
