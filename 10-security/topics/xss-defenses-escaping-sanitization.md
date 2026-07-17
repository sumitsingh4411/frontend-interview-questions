<div align="center">

# XSS defenses (escaping, sanitization)

<sub>🔒 Security · 🔴 Hard · ⏱ 1h · `#xss`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — There are two distinct defenses and they are not interchangeable: **contextual output encoding** (turn data into inert text — the default, use it for 95% of cases) and **sanitization** (parse untrusted HTML and strip dangerous parts — only when you *must* render markup). Encode by context, sanitize with a library, and layer CSP as the backstop.

---

## 🧠 Mental model

The winning idea is **"data is data, code is code, and the browser must never confuse the two."** Every XSS fix is one of three moves:

1. **Encode** — convert data so the browser renders it as *text*, not markup. `<` becomes `&lt;`. This is the default and it's cheap.
2. **Sanitize** — when you genuinely need to render HTML (a rich-text comment, rendered Markdown), *parse* it and remove executable pieces (`<script>`, `on*` handlers, `javascript:` URLs).
3. **Defense in depth** — CSP, `HttpOnly` cookies, Trusted Types — so that a *bypass* of (1) or (2) doesn't become a full compromise.

The critical, senior-level nuance: **encoding is contextual.** The same untrusted string needs different treatment depending on *where* it lands — HTML body, an attribute, a URL, inside `<script>`, inside CSS. There is no single "escape function" that's correct everywhere.

## ⚙️ How it actually works

**Encoding depends on the sink's parsing context:**

| Context | Encode | Why |
|---|---|---|
| HTML text | `& < > ` → entities | stops tag injection |
| HTML attribute | also `"` `'`, quote the attr | stops attribute breakout |
| URL (`href`/`src`) | `encodeURIComponent` + scheme allow-list | stops `javascript:` |
| `<script>` / inline JS | don't. Move data to `dataset`/JSON | almost impossible to escape safely |
| CSS value | strict allow-list | `expression()`, `url()` tricks |

This is why modern frameworks won that they escape **at interpolation time knowing the context** — React escapes text nodes, Angular tracks a security context per binding. You almost never hand-encode anymore; you *stay inside* the framework's escaping and treat every escape hatch as a code review flag.

**Sanitization** is a different machine. You cannot regex your way to safe HTML — the browser's parser is too weird (mutation XSS, namespace confusion in SVG/MathML). A real sanitizer like **DOMPurify** parses the input into a DOM, walks it against an allow-list of tags/attributes, drops everything else, and re-serializes. Allow-list, never block-list: you enumerate what's *safe*, because you can't enumerate everything dangerous.

## 💻 Code

```js
// ❌ Home-grown "escaping" — misses attributes, URLs, mXSS, unicode tricks
const clean = (s) => s.replace(/<script>/gi, ""); // trivially bypassed

// ✅ Default: don't render HTML at all. Text sink escapes for free.
el.textContent = userInput;

// ✅ When you MUST render HTML, sanitize with a maintained library
import DOMPurify from "dompurify";
el.innerHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ["b", "i", "em", "a", "p"],
  ALLOWED_ATTR: ["href"],
});

// ✅ URL context: allow-list the scheme, never trust the string
function safeHref(url) {
  try {
    const u = new URL(url, location.origin);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.href : "#";
  } catch { return "#"; }
}
```

```jsx
// ✅ React: sanitize BEFORE it reaches the dangerous sink
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(md) }} />
```

## ⚖️ Trade-offs

- **Encode at output, not input.** Whether a string is dangerous depends on where you render it — unknowable at input time. Store raw; encode when you emit. Encoding on input also breaks legitimate data (`O'Brien`, `5 < 6`) and double-encodes.
- **Sanitization is lossy and heavier.** It strips content and costs parse time; only reach for it when rich HTML is a genuine product requirement. For "show the user's name," `textContent` wins every time.
- **CSP is a backstop, not a primary defense.** It reduces the *impact* of a bypass; it does not excuse unescaped output. Treat "we have CSP" as a seatbelt, not a reason to skip the brakes.
- **Trust boundaries.** Sanitizing on the server *and* the client is fine (defense in depth); relying on the client alone is not, since JS can be bypassed on DOM-sourced data.

## 💣 Gotchas interviewers probe

- **"One escape function for everything?"** No — the tell is whether you know encoding is *contextual*. HTML-escaping a value that lands in a `javascript:` URL does nothing.
- **Sanitizing on input is the classic mistake.** It couples data to a rendering context it may outlive, and double-sanitizing corrupts data. Output encoding is the correct layer.
- **Block-lists are broken by design.** `<img onerror>`, SVG, `<iframe srcdoc>`, unicode/entity encoding, and mXSS all defeat "strip `<script>`". Allow-list only.
- **`innerText` vs `textContent`.** Both avoid HTML parsing, but `innerText` triggers reflow and respects CSS visibility; `textContent` is faster and the safer default.
- **Sanitizer config drift.** Adding `ALLOWED_ATTR: ["style"]` or allowing `target` without `rel="noopener"` quietly reopens holes. Keep the allow-list minimal.
- **Trusted Types** move this from "remember to sanitize" to "the browser *refuses* raw strings at DOM sinks" — the platform-level endgame for DOM XSS.

## 🎯 Say this in the interview

> "My default XSS defense is contextual output encoding — render untrusted data as text, not markup, and let the framework escape it at interpolation time knowing the context. I only reach for sanitization when the product genuinely needs to render user HTML, like Markdown or a rich comment, and then I use DOMPurify with a strict allow-list of tags and attributes, never a regex and never a block-list, because the HTML parser is too weird to filter by hand. I encode at output, not input, because whether a string is dangerous depends on where it lands, and that's unknowable when it arrives. Then I layer CSP and HttpOnly cookies as defense in depth so a single bypass isn't game over — and where I can, Trusted Types to make raw strings at DOM sinks impossible in the first place."

## 🔗 Go deeper

- [OWASP — XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) — the context-by-context encoding rules, verbatim.
- [OWASP — DOM-based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html) — the client-side sink rules.
- [DOMPurify](https://github.com/cure53/DOMPurify) — the sanitizer to use, plus its threat model and config.
- [web.dev — Trusted Types](https://web.dev/articles/trusted-types) — how to make DOM sinks refuse unsafe strings platform-wide.
