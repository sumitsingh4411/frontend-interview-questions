# 01 · Frontend Fundamentals

The bedrock. If any of these are shaky, everything above them wobbles in an interview. Master these first.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

## The platform

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| How the web works (request → render) | 🟢 | 30m | `#networking` `#basics` | [MDN: how the web works ⭐](https://developer.mozilla.org/en-US/docs/Learn/Getting_started_with_the_web/How_the_Web_works) |
| Semantic HTML | 🟢 | 30m | `#html` `#a11y` `#seo` | [web.dev: HTML ⭐](https://web.dev/learn/html) |
| The DOM | 🟢 | 45m | `#dom` `#basics` | [javascript.info: DOM ⭐](https://javascript.info/document) |
| DOM manipulation & traversal | 🟢 | 45m | `#dom` | [javascript.info ⭐](https://javascript.info/modifying-document) |
| Event handling, bubbling & delegation | 🟡 | 1h | `#dom` `#events` | [javascript.info: bubbling ⭐](https://javascript.info/bubbling-and-capturing) |
| Virtual DOM | 🟡 | 45m | `#dom` `#react` | [React: rendering ⭐](https://react.dev/learn/render-and-commit) |
| Shadow DOM & Web Components | 🟡 | 1h | `#dom` `#components` | [MDN: web components ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) |
| Forms & validation | 🟡 | 45m | `#forms` | [MDN: forms ⭐](https://developer.mozilla.org/en-US/docs/Learn/Forms) |

## Rendering & delivery

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Rendering strategies (CSR/SSR/SSG/ISR) | 🟡 | 1h | `#rendering` `#seo` | [web.dev: rendering on the web ⭐](https://web.dev/articles/rendering-on-the-web) |
| Critical Rendering Path | 🟡 | 1h | `#rendering` `#performance` | [web.dev: CRP ⭐](https://web.dev/articles/critical-rendering-path) |
| Event Loop | 🟡 | 1h | `#async` `#internals` | [javascript.info: event loop ⭐](https://javascript.info/event-loop) |
| SEO fundamentals | 🟡 | 1h | `#seo` | [Google Search Central ⭐](https://developers.google.com/search/docs) |
| Progressive Web Apps (PWA) | 🟡 | 1h | `#pwa` `#offline` | [web.dev: PWA ⭐](https://web.dev/explore/progressive-web-apps) |
| Progressive enhancement | 🟡 | 30m | `#basics` `#a11y` | [MDN ⭐](https://developer.mozilla.org/en-US/docs/Glossary/Progressive_Enhancement) |
| Responsive design | 🟢 | 1h | `#css` `#responsive` | [web.dev: responsive ⭐](https://web.dev/articles/responsive-web-design-basics) |

## Networking & storage

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| HTTP fundamentals | 🟢 | 45m | `#networking` `#http` | [MDN: HTTP overview ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) |
| HTTPS & TLS | 🟡 | 45m | `#networking` `#security` | [Cloudflare: HTTPS ⭐](https://www.cloudflare.com/learning/ssl/what-is-https/) |
| REST & JSON APIs | 🟢 | 45m | `#api` | [MDN: REST ⭐](https://developer.mozilla.org/en-US/docs/Glossary/REST) |
| Fetch & AJAX | 🟢 | 45m | `#fetch` `#api` | [MDN: Fetch ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) |
| CORS | 🟡 | 45m | `#networking` `#security` | [MDN: CORS ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) |
| Caching (HTTP + browser) | 🟡 | 1h | `#networking` `#performance` | [MDN: HTTP caching ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) |
| Browser storage (cookies/localStorage/IndexedDB) | 🟡 | 1h | `#storage` `#offline` | [web.dev: storage ⭐](https://web.dev/articles/storage-for-the-web) |
| Cookies (attributes, SameSite) | 🟡 | 45m | `#storage` `#security` | [MDN: cookies ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies) |
| Web APIs (Intersection/Resize/Mutation Observer) | 🟡 | 1h | `#web-api` | [MDN: Web APIs ⭐](https://developer.mozilla.org/en-US/docs/Web/API) |
| Geolocation, Notifications, Clipboard APIs | 🟢 | 45m | `#web-api` | [MDN: Web APIs ⭐](https://developer.mozilla.org/en-US/docs/Web/API) |

## Cross-cutting

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Accessibility basics | 🟡 | 1h | `#a11y` | [web.dev: accessibility ⭐](https://web.dev/learn/accessibility) |
| Performance basics (Core Web Vitals) | 🟡 | 1h | `#performance` | [web.dev: vitals ⭐](https://web.dev/articles/vitals) |
| Security basics (XSS/CSRF overview) | 🟡 | 1h | `#security` | [OWASP top 10 ⭐](https://owasp.org/www-project-top-ten/) |
| Internationalization (i18n) basics | 🟡 | 45m | `#i18n` | [MDN: Intl ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl) |
| Character encoding (UTF-8/Unicode) | 🟢 | 30m | `#basics` | [MDN: Unicode ⭐](https://developer.mozilla.org/en-US/docs/Glossary/Unicode) |

## ❓ Rapid-fire HTML & web fundamentals interview questions

Real HTML / web-fundamentals interview questions. Answer out loud, then verify above.

1. What is **semantic HTML** and why does it matter for SEO and a11y?
2. What happens **when you type a URL and press Enter** (end to end)?
3. What is the **DOM**? How does it differ from HTML?
4. **Event bubbling vs capturing** — explain event propagation.
5. What is **event delegation**?
6. **`localStorage` vs `sessionStorage` vs cookies vs IndexedDB**?
7. What are **cookie attributes** (`HttpOnly`, `Secure`, `SameSite`)?
8. What is **CORS** and how do you fix a CORS error?
9. **CSR vs SSR vs SSG vs ISR** — trade-offs for SEO and performance?
10. What is the **critical rendering path**?
11. How does **HTTP caching** work (`Cache-Control`, `ETag`)?
12. What is the difference between **`<script>`, `<script async>`, and `<script defer>`**?
13. What are **Web Components** and the Shadow DOM?
14. What is a **PWA** and what makes an app installable?
15. How do you make a site **responsive**? Mobile-first vs desktop-first?
16. What is **progressive enhancement** vs graceful degradation?
17. What is the difference between **`GET` and `POST`**?
18. What are **`data-*` attributes**?
19. What is the difference between **`id` and `class`**?
20. How does **lazy loading** of images/iframes work?

---

**Related:** [02-browser](../02-browser/) · [09-performance](../09-performance/) · [12-networking](../12-networking/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
