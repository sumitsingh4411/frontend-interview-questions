<div align="center">

# HTML parsing & the DOM tree

<sub>🌐 Browser · 🟡 Medium · ⏱ 45m · `#parsing` `#dom`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The HTML parser is a **streaming, error-tolerant state machine** that turns bytes into tokens into a DOM tree *as they arrive* — it never throws on bad markup (it repairs it per a strict spec algorithm), it stops dead for synchronous `<script>`, and it uses a **preload scanner** to fetch resources ahead of where it's blocked.

---

## 🧠 Mental model

Parsing HTML is nothing like parsing a programming language. There is **no such thing as a syntax error** — the spec defines exactly how to recover from every malformed input, so two conformant browsers build the *same* DOM from the same broken HTML. And it's **incremental**: the parser doesn't wait for the whole document; it builds the DOM tree node by node as bytes stream off the network, which is why you see content appear progressively.

```
bytes ─► [decode] ─► characters ─► [tokenizer] ─► tokens ─► [tree construction] ─► DOM
                                        ▲                            │
                                        └── ⛔ blocks on sync <script>┘
```

The two facts that carry every interview answer: **the parser is a state machine that repairs errors deterministically**, and **synchronous scripts block it** because a script can call `document.write` and change the very bytes being parsed.

## ⚙️ How it actually works

**Tokenization → tree construction.** The tokenizer is a state machine (data state, tag-open state, attribute-name state, …) emitting tokens: start tags, end tags, text, comments, doctype. The tree builder consumes tokens and maintains a **stack of open elements**, inserting nodes and implicitly closing tags per the rules. This is where "error recovery" lives: an unclosed `<p>`, a `<td>` outside a `<table>`, mis-nested tags — all handled by well-defined algorithms (foster parenting, the "adoption agency algorithm" for misnested formatting tags, etc.).

**Encoding matters and comes first.** The parser must know the character encoding before it can decode bytes. It sniffs the BOM / `Content-Type` / `<meta charset>` — and `<meta charset>` should be in the first 1024 bytes, or the parser may have to *restart* after guessing wrong.

**The blocking rule — the core of the topic:**

- A `<script>` **without** `async`/`defer`/`type=module` is **parser-blocking**: tokenization pauses, the script is fetched (if external) and executed, *then* parsing resumes. Reason: it might `document.write` into the stream.
- A `<link rel=stylesheet>` doesn't block parsing, but a script *after* it waits for the CSSOM (scripts can read styles). So a stylesheet indirectly stalls a following script, which stalls the parser.

**The preload scanner — the senior detail.** While the main parser is blocked on a script, a **secondary, lightweight scanner** races ahead through the raw bytes looking for `src`/`href` on `<img>`, `<script>`, `<link>`, and kicks off those fetches early. It doesn't build DOM; it just warms the network. This is why blindly moving all scripts to the bottom isn't a pure win, and why `<link rel=preload>` exists — to feed resources the scanner can't discover (e.g. fonts referenced from CSS, or dynamically imported chunks).

**`DOMContentLoaded` vs `load`.** `DOMContentLoaded` fires when the DOM is fully parsed *and* deferred scripts have run — it does **not** wait for images/stylesheets/subframes. `load` waits for all of those. `defer` scripts run right before `DOMContentLoaded`, in document order.

## 💻 Code

```html
<!-- ✅ charset first, so the parser never has to restart decoding -->
<meta charset="utf-8" />

<!-- ❌ Parser-blocking: DOM construction stops here until fetched + run -->
<script src="app.js"></script>

<!-- ✅ Fetched in parallel by the preload scanner; execution deferred to after parse -->
<script src="app.js" defer></script>

<!-- ✅ Modules are deferred by default (no need for `defer`) -->
<script type="module" src="app.mjs"></script>

<!-- ✅ Feed the preload scanner resources it can't see (font referenced by CSS) -->
<link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossorigin />
```

```js
// Error recovery is real and deterministic — the parser NEVER rejects this:
document.body.innerHTML = '<p><b>bold <i>both</p> italic</b>'; // mis-nested
// The DOM is repaired per spec (adoption agency algorithm), identically in every browser.

// DOMContentLoaded: DOM parsed + deferred scripts done — NOT images/CSS.
document.addEventListener('DOMContentLoaded', () => { /* safe to touch the DOM */ });
window.addEventListener('load', () => { /* everything, incl. images, loaded */ });
```

## ⚖️ Trade-offs

- **Streaming parsing is why SSR/progressive HTML feels fast** — content paints before the document finishes. But it means the DOM is *incomplete* mid-parse; querying for a node that hasn't been parsed yet returns `null`. Scripts must run at the right time (`defer`, or place at end).
- **`innerHTML` re-invokes the parser** on a string and replaces a whole subtree — convenient but it destroys existing nodes (and their listeners/state) and can't stream. For large or incremental updates, build nodes or use templates.
- **Error tolerance is a double-edged sword.** It means broken HTML "works," so bugs hide until a browser's recovery differs from your mental model. Validate; don't rely on recovery.

## 💣 Gotchas interviewers probe

- **HTML parsing never fails.** There are no syntax errors — only spec-defined recovery. Candidates who expect exceptions on bad markup reveal a shallow model.
- **Synchronous `<script>` blocks the parser; `defer`/`async`/modules don't.** And the *why* is `document.write`. Know it.
- **The preload scanner exists**, and it's why "just move scripts to the bottom" is dated advice — mentioning it is a strong senior signal.
- **`DOMContentLoaded` doesn't wait for images or stylesheets.** People routinely conflate it with `load`.
- **`<meta charset>` must be early (first 1024 bytes).** Late/omitted encoding info can force a re-parse or produce mojibake.
- **`document.write` after load wipes the page.** During parsing it injects into the stream; after load it opens a fresh document and blows away everything — a genuine footgun.

## 🎯 Say this in the interview

> "The HTML parser is a streaming, error-tolerant state machine. It tokenizes bytes and builds the DOM incrementally as they arrive, and crucially there are no syntax errors — the spec defines deterministic recovery for malformed markup, so every browser builds the same DOM from the same broken HTML. The performance-critical rule is that a synchronous script blocks the parser: tokenization stops, the script fetches and runs, then parsing resumes, because the script could `document.write`. That's why we use `defer` or `async`, and why modules are deferred by default. The detail I'd add is the preload scanner — a lightweight second pass that races ahead while the main parser is blocked and starts fetching discoverable resources early, which is why `rel=preload` matters for things it can't see, like fonts referenced from CSS. And `DOMContentLoaded` fires when the DOM and deferred scripts are done, not when images load — that's `load`."

## 🔗 Go deeper

- [MDN — How browsers work (parsing)](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) — tokenization, tree construction, error handling.
- [HTML spec — Parsing HTML documents](https://html.spec.whatwg.org/multipage/parsing.html) — the actual state machine and recovery algorithms.
- [web.dev — Preload scanner](https://web.dev/articles/preload-scanner) — how the scanner discovers resources and how not to defeat it.
