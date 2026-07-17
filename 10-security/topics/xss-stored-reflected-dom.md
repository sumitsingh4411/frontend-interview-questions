<div align="center">

# XSS (stored/reflected/DOM)

<sub>🔒 Security · 🔴 Hard · ⏱ 1.5h · `#xss` `#injection`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — XSS is **attacker-controlled data reaching an execution sink** — `innerHTML`, `eval`, a `javascript:` URL — where the browser runs it as code with your origin's full privileges. Stored, reflected, and DOM-based are just three answers to *where the data enters*; the danger is always the sink.

---

## 🧠 Mental model

Stop thinking of XSS as "bad input" and start thinking in **sources and sinks**. A *source* is anywhere untrusted data enters — a query param, a form field, a database row, a `postMessage`, `location.hash`. A *sink* is any API that turns a string into markup or code: `innerHTML`, `document.write`, `eval`, `setTimeout(string)`, `element.setAttribute('href', 'javascript:...')`. **XSS happens the instant an unsanitised source flows into a sink.** Everything else — which of the three "types" it is — is just describing the plumbing between the two.

The three types classify by **where the source lives and who does the injecting**:

| Type | Where the payload lives | Who renders it |
|---|---|---|
| **Stored** | Persisted server-side (DB, comment, profile) | Server ships it to *every* viewer |
| **Reflected** | In the request itself (URL, form post) | Server echoes it back in the response |
| **DOM-based** | Never touches the server | Client-side JS reads a source and writes a sink |

Why it's catastrophic: injected script runs **in your origin**, so it can read cookies (unless `HttpOnly`), `localStorage`, the DOM, make same-origin requests with the user's credentials, and rewrite the page. It *is* the user, silently.

## ⚙️ How it actually works

**Reflected** — the payload is in the request and mirrored straight into the HTML response:

```
https://shop.com/search?q=<script>steal()</script>
→ server renders:  <h1>No results for <script>steal()</script></h1>
```
One click on a crafted link and it runs. Delivered via phishing, no persistence needed.

**Stored** — the payload is saved once and served to everyone. A comment containing `<img src=x onerror=steal()>` fires for every visitor who loads the thread. Higher severity because it's *wormable* and needs no per-victim delivery.

**DOM-based** — the server is innocent; the vulnerability is entirely in client JS. The classic:

```js
document.getElementById("out").innerHTML = location.hash.slice(1);
// visit  page#<img src=x onerror=alert(document.cookie)>
```
The malicious string may **never appear in the HTTP response**, so server-side filters and even a strict CSP that only checks server output can miss it. This is why DOM XSS is the hardest to catch — it's a data-flow bug in your own code.

Modern SPAs shifted the risk almost entirely to **DOM-based**, because rendering moved to the client. React/Vue/Angular escape by default — but they all ship an escape hatch (`dangerouslySetInnerHTML`, `v-html`, `[innerHTML]`) that reopens the exact sink.

## 💻 Code

```jsx
// ❌ Every one of these is a live sink for attacker-controlled `data`
el.innerHTML = data;                       // markup sink
el.outerHTML = data;
document.write(data);
eval(data);  setTimeout(data, 0);          // code sinks
a.href = data;                             // javascript: URL sink
<div dangerouslySetInnerHTML={{ __html: data }} />; // React's sink

// ✅ Use sinks that treat data as TEXT, not markup
el.textContent = data;                     // never parses HTML
a.href = data.startsWith("http") ? data : "#"; // allow-list the scheme

// ✅ If you truly must render HTML, sanitise at the sink with a real library
import DOMPurify from "dompurify";
el.innerHTML = DOMPurify.sanitize(data);   // strips <script>, onerror, javascript:
```

The senior tell: **the fix belongs at the sink, contextually.** The same string is safe in text, dangerous in an attribute, and lethal in a URL scheme.

## ⚖️ Trade-offs

- **Blocklists lose.** Filtering `<script>` is theatre — `<img onerror>`, `<svg onload>`, `javascript:`, SVG, and mutation-XSS all bypass it. Escape/sanitise by *context*, don't hunt for bad strings.
- **Sanitising on input is fragile.** Data is safe or not depending on *where you render it*, and you don't know that at input time. Store raw, encode at output. Sanitising twice also double-encodes and corrupts data.
- **Framework auto-escaping is not total.** It covers text interpolation. URLs, `style`, `dangerouslySetInnerHTML`, and `ref`-based direct DOM writes are outside it.

## 💣 Gotchas interviewers probe

- **"Which type doesn't hit the server?"** DOM-based — the payload can live entirely in `location.hash` and never appear in any response, so WAFs and server filters miss it.
- **`HttpOnly` does not stop XSS.** It stops the *cookie theft*, but injected script can still act as the user, keystroke-log, and pivot. People wildly overstate `HttpOnly` as an XSS fix.
- **`localStorage` tokens are an XSS amplifier.** Any XSS = full token exfiltration, because JS can read them. This is the core argument against storing JWTs there.
- **mXSS (mutation XSS).** The browser's HTML parser *rewrites* markup after you set `innerHTML`; a string that looks inert can mutate into a live payload. This is why you sanitise with a maintained library, not a regex.
- **`javascript:` and `data:` URLs are code sinks.** `href`, `src`, `formaction` can all execute. Allow-list schemes to `https:`/`mailto:`.
- **React is not immune.** `dangerouslySetInnerHTML`, an attacker-controlled `href`, or `ref.current.innerHTML = …` all bypass JSX escaping.

## 🎯 Say this in the interview

> "I reason about XSS as sources and sinks: untrusted data reaching an execution sink like `innerHTML`, `eval`, or a `javascript:` URL, where the browser runs it with my origin's privileges. Stored, reflected and DOM-based just describe where the data enters — persisted, in the request, or read client-side from something like `location.hash`. DOM-based is the one I watch hardest in SPAs because the payload may never touch the server, so server filters and WAFs miss it. My defense isn't a blocklist — those always lose to `onerror` and `svg` tricks. I encode at the output sink by context, and if I genuinely need to render HTML I run it through DOMPurify. And I never keep auth tokens in `localStorage`, because one XSS then means total token theft."

## 🔗 Go deeper

- [OWASP — Cross Site Scripting (XSS)](https://owasp.org/www-community/attacks/xss/) — the canonical taxonomy of all three types.
- [OWASP — Types of XSS](https://owasp.org/www-community/Types_of_Cross-Site_Scripting) — stored vs reflected vs DOM, precisely defined.
- [PortSwigger — Cross-site scripting](https://portswigger.net/web-security/cross-site-scripting) — the best hands-on labs, including DOM and mutation XSS.
- [DOMPurify](https://github.com/cure53/DOMPurify) — the sanitiser to actually use, by the people who break sanitisers for a living.
