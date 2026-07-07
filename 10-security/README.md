# 10 · Frontend Security

The threats you're expected to name and defend against. "How would you prevent XSS here?" is a near-guaranteed follow-up.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| XSS (stored/reflected/DOM) | 🔴 | 1.5h | `#xss` `#injection` | [OWASP: XSS ⭐](https://owasp.org/www-community/attacks/xss/) · [web.dev](https://web.dev/articles/trusted-types) |
| CSRF | 🔴 | 1h | `#csrf` | [OWASP: CSRF ⭐](https://owasp.org/www-community/attacks/csrf) |
| Content Security Policy (CSP) | 🔴 | 1h | `#csp` `#headers` | [MDN: CSP ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) |
| CORS (security view) | 🟡 | 45m | `#cors` | [MDN: CORS ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) |
| Clickjacking & frame protection | 🟡 | 45m | `#clickjacking` `#headers` | [OWASP: clickjacking ⭐](https://owasp.org/www-community/attacks/Clickjacking) |
| Cookies & session security (SameSite, HttpOnly) | 🟡 | 45m | `#cookies` `#session` | [MDN: SameSite ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) |
| Authentication patterns | 🔴 | 1.5h | `#auth` | [Auth0: auth ⭐](https://auth0.com/docs/get-started/authentication-and-authorization-flow) |
| Authorization (RBAC/ABAC) | 🟡 | 1h | `#authz` | [OWASP: access control ⭐](https://owasp.org/www-community/Access_Control) |
| JWT: usage & pitfalls | 🔴 | 1h | `#jwt` `#auth` | [jwt.io intro ⭐](https://jwt.io/introduction) |
| OAuth 2.0 & OIDC | 🔴 | 1.5h | `#oauth` `#auth` | [OAuth 2.0 simplified ⭐](https://aaronparecki.com/oauth-2-simplified/) |
| Token storage (cookie vs localStorage) | 🔴 | 45m | `#auth` `#storage` | [OWASP: JWT cheat sheet ⭐](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) |
| Subresource Integrity (SRI) | 🟡 | 30m | `#sri` `#headers` | [MDN: SRI ⭐](https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity) |
| Trusted Types | 🔴 | 45m | `#xss` `#modern` | [web.dev: Trusted Types ⭐](https://web.dev/articles/trusted-types) |
| Security headers (HSTS, X-Frame-Options…) | 🟡 | 45m | `#headers` | [OWASP: secure headers ⭐](https://owasp.org/www-project-secure-headers/) |
| Input validation & sanitization | 🟡 | 45m | `#injection` | [OWASP: input validation ⭐](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html) |
| Dependency & supply-chain security | 🟡 | 45m | `#supply-chain` | [OWASP: dependency check ⭐](https://owasp.org/www-project-dependency-check/) |

**Related:** [01-fundamentals](../01-fundamentals/) · [12-networking](../12-networking/) · [13-state-management](../13-state-management/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
