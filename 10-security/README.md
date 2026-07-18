<div align="center">

<img src="banner.svg" alt="10 · Frontend Security" width="100%" />

</div>

The threats you're expected to name and defend against. "How would you prevent XSS here?" is a near-guaranteed follow-up.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

> 📚 **[Full question bank — 27 Security questions across 5 categories →](question-bank/README.md)**

## Attacks & defenses

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [OWASP Top 10 overview](topics/owasp-top-10-overview.md) | 🟡 | 1h | `#overview` | [OWASP Top 10 ⭐](https://owasp.org/www-project-top-ten/) |
| [XSS (stored/reflected/DOM)](topics/xss-stored-reflected-dom.md) | 🔴 | 1.5h | `#xss` `#injection` | [OWASP: XSS ⭐](https://owasp.org/www-community/attacks/xss/) |
| [XSS defenses (escaping, sanitization)](topics/xss-defenses-escaping-sanitization.md) | 🔴 | 1h | `#xss` | [OWASP: XSS prevention ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) |
| [CSRF](topics/csrf.md) | 🔴 | 1h | `#csrf` | [OWASP: CSRF ⭐](https://owasp.org/www-community/attacks/csrf) |
| [Clickjacking & frame protection](topics/clickjacking-frame-protection.md) | 🟡 | 45m | `#clickjacking` | [OWASP: clickjacking ⭐](https://owasp.org/www-community/attacks/Clickjacking) |
| [Injection & input validation](topics/injection-input-validation.md) | 🟡 | 45m | `#injection` | [OWASP: input validation ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) |
| [Prototype pollution](topics/prototype-pollution.md) | 🔴 | 45m | `#injection` `#advanced` | [OWASP ⭐](https://learn.snyk.io/lesson/prototype-pollution/) |
| [Dependency & supply-chain security](topics/dependency-supply-chain-security.md) | 🟡 | 45m | `#supply-chain` | [OWASP: dependency check ⭐](https://owasp.org/www-project-dependency-check/) |

## Headers & policies

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Content Security Policy (CSP)](topics/content-security-policy-csp.md) | 🔴 | 1h | `#csp` `#headers` | [MDN: CSP ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) |
| [CORS (security view)](topics/cors-security-view.md) | 🟡 | 45m | `#cors` | [MDN: CORS ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) |
| [Security headers (HSTS, X-Frame-Options…)](topics/security-headers-hsts-x-frame-options.md) | 🟡 | 45m | `#headers` | [OWASP: secure headers ⭐](https://owasp.org/www-project-secure-headers/) |
| [Subresource Integrity (SRI)](topics/subresource-integrity-sri.md) | 🟡 | 30m | `#sri` `#headers` | [MDN: SRI ⭐](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) |
| [Trusted Types](topics/trusted-types.md) | 🔴 | 45m | `#xss` `#modern` | [web.dev: Trusted Types ⭐](https://web.dev/articles/trusted-types) |
| [Permissions-Policy](topics/permissions-policy.md) | 🟡 | 30m | `#headers` | [MDN ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) |

## Auth & sessions

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| [Authentication patterns](topics/authentication-patterns.md) | 🔴 | 1.5h | `#auth` | [Auth0: auth flows ⭐](https://auth0.com/docs/get-started/authentication-and-authorization-flow) |
| [Authorization (RBAC/ABAC)](topics/authorization-rbac-abac.md) | 🟡 | 1h | `#authz` | [OWASP: access control ⭐](https://owasp.org/www-community/Access_Control) |
| [JWT: usage & pitfalls](topics/jwt-usage-pitfalls.md) | 🔴 | 1h | `#jwt` `#auth` | [jwt.io intro ⭐](https://jwt.io/introduction) |
| [OAuth 2.0 & OIDC](topics/oauth-2-0-oidc.md) | 🔴 | 1.5h | `#oauth` `#auth` | [OAuth 2.0 simplified ⭐](https://aaronparecki.com/oauth-2-simplified/) |
| Session management | 🟡 | 45m | `#session` | [OWASP: session cheat sheet ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) |
| Token storage (cookie vs localStorage) | 🔴 | 45m | `#auth` `#storage` | [OWASP: JWT cheat sheet ⭐](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) |
| Cookies & session security (SameSite, HttpOnly) | 🟡 | 45m | `#cookies` | [MDN: SameSite ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) |

## ❓ Rapid-fire security interview questions

Real frontend security questions asked at the SDE-2 / senior level. Answer out loud, then verify above.

1. What is **XSS** and how do you prevent it (all three types)?
2. What is **CSRF** and how do you prevent it?
3. What is a **Content Security Policy (CSP)**?
4. Where should you store **auth tokens** — cookie vs localStorage?
5. **Authentication vs authorization** — what's the difference?
6. How does **OAuth 2.0** work at a high level?
7. What do **HttpOnly, Secure, and SameSite** cookie flags do?
8. What is **CORS** and how do you configure it safely?
9. What is **clickjacking** and how do you prevent it?
10. What is **Subresource Integrity (SRI)**?
11. How do you safely render **user/markdown/AI-generated** content (avoid XSS)?
12. What is a **JWT** and what are its pitfalls?
13. Which **security headers** should every app set?
14. What is **prototype pollution**?
15. How do you keep **API keys/secrets** out of the frontend?

---

## 🎯 Scenario, advanced & real-incident questions (Senior / Staff)

These go beyond definitions into judgment, design, and real-world incidents — the differentiators in senior loops.

**🧩 Scenarios**
1. A login page redirects to `?redirect=<url>` after login. What vulnerability does this risk (open redirect) and how do you fix it?
2. Your SPA stores a JWT in `localStorage` "because cookies are complicated." A pentest finds a stored-XSS bug and the tokens were exfiltrated. What would you change?
3. Your API sets `Access-Control-Allow-Origin: *` **and** `Access-Control-Allow-Credentials: true` — what's wrong?
4. A design-system `<RichText>` renders raw HTML via `dangerouslySetInnerHTML`; someone wants a `rawHtml` prop that trusts all callers. Do you approve the API? Why not?
5. How would you implement **"log out of all devices"** with a stateless JWT architecture?

**🔬 Advanced**
6. Session fixation vs session hijacking — how do they differ?
7. How does **refresh-token rotation** work and what problem does it solve?
8. What is **prototype pollution** and how can a deep-merge utility introduce it?
9. What is **dependency confusion** and how can a frontend build pipeline be vulnerable?
10. What is a **"secure context"** and why do Service Workers / geolocation / clipboard require HTTPS?
11. Why isn't a CSRF token sufficient if it's also stored in a JS-readable cookie?
12. How do **Trusted Types** prevent DOM XSS at the platform level?
13. What is **OpenID Connect** and how does it differ from plain OAuth 2.0?

**🚨 Real incidents**
14. An app embedded an OAuth **client secret in a mobile binary**, later reverse-engineered. What went wrong, and what's the correct pattern for public clients (PKCE)?
15. A team trusted a client-side `isEmployee` flag to unlock admin routes. What principle did this violate?
16. The **British Airways 2018 (Magecart)** breach injected a form-skimming script. What frontend architecture (CSP, SRI, script isolation) would have mitigated it?

**🐛 Debugging / ops**
17. Users are logged out randomly after ~15 min despite being active — likely causes and how you'd investigate?
18. Your CSP `report-uri` is suddenly flooded with `script-src` violations — attack or false positive, and how do you tell?
19. How would you roll out a **strict CSP** to a legacy app with hundreds of inline scripts without breaking it overnight?
20. How would you migrate a **session-cookie legacy app to JWT auth** without a breaking "flag day"?

**⚖️ Trade-offs**
21. Where should **least privilege** apply on the frontend, given it can't fully enforce anything the server doesn't?
22. How do you balance instant client-side validation UX with the rule that client validation isn't a security boundary?

---

**Related:** [01-fundamentals](../01-fundamentals/) · [12-networking](../12-networking/) · [13-state-management](../13-state-management/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
