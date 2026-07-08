# 10 · Frontend Security

The threats you're expected to name and defend against. "How would you prevent XSS here?" is a near-guaranteed follow-up.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

## Attacks & defenses

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| OWASP Top 10 overview | 🟡 | 1h | `#overview` | [OWASP Top 10 ⭐](https://owasp.org/www-project-top-ten/) |
| XSS (stored/reflected/DOM) | 🔴 | 1.5h | `#xss` `#injection` | [OWASP: XSS ⭐](https://owasp.org/www-community/attacks/xss/) |
| XSS defenses (escaping, sanitization) | 🔴 | 1h | `#xss` | [OWASP: XSS prevention ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html) |
| CSRF | 🔴 | 1h | `#csrf` | [OWASP: CSRF ⭐](https://owasp.org/www-community/attacks/csrf) |
| Clickjacking & frame protection | 🟡 | 45m | `#clickjacking` | [OWASP: clickjacking ⭐](https://owasp.org/www-community/attacks/Clickjacking) |
| Injection & input validation | 🟡 | 45m | `#injection` | [OWASP: input validation ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) |
| Prototype pollution | 🔴 | 45m | `#injection` `#advanced` | [OWASP ⭐](https://learn.snyk.io/lesson/prototype-pollution/) |
| Dependency & supply-chain security | 🟡 | 45m | `#supply-chain` | [OWASP: dependency check ⭐](https://owasp.org/www-project-dependency-check/) |

## Headers & policies

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Content Security Policy (CSP) | 🔴 | 1h | `#csp` `#headers` | [MDN: CSP ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) |
| CORS (security view) | 🟡 | 45m | `#cors` | [MDN: CORS ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) |
| Security headers (HSTS, X-Frame-Options…) | 🟡 | 45m | `#headers` | [OWASP: secure headers ⭐](https://owasp.org/www-project-secure-headers/) |
| Subresource Integrity (SRI) | 🟡 | 30m | `#sri` `#headers` | [MDN: SRI ⭐](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) |
| Trusted Types | 🔴 | 45m | `#xss` `#modern` | [web.dev: Trusted Types ⭐](https://web.dev/articles/trusted-types) |
| Permissions-Policy | 🟡 | 30m | `#headers` | [MDN ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy) |

## Auth & sessions

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Authentication patterns | 🔴 | 1.5h | `#auth` | [Auth0: auth flows ⭐](https://auth0.com/docs/get-started/authentication-and-authorization-flow) |
| Authorization (RBAC/ABAC) | 🟡 | 1h | `#authz` | [OWASP: access control ⭐](https://owasp.org/www-community/Access_Control) |
| JWT: usage & pitfalls | 🔴 | 1h | `#jwt` `#auth` | [jwt.io intro ⭐](https://jwt.io/introduction) |
| OAuth 2.0 & OIDC | 🔴 | 1.5h | `#oauth` `#auth` | [OAuth 2.0 simplified ⭐](https://aaronparecki.com/oauth-2-simplified/) |
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

**Related:** [01-fundamentals](../01-fundamentals/) · [12-networking](../12-networking/) · [13-state-management](../13-state-management/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
