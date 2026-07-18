<div align="center">

# OWASP Top 10 overview

<sub>🔒 Security · 🟡 Medium · ⏱ 1h · `#overview`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — The OWASP Top 10 is a ranked *awareness* document of the ten most critical categories of web-app risk — not a checklist, not a compliance standard, and as of 2021 XSS no longer has its own slot: it lives inside **A03 Injection**.

---

## 🧠 Mental model

The Top 10 is a **heat map, not a test suite**. It ranks broad *categories* of risk, computed from breach and scan data contributed by dozens of organizations, plus two categories seeded from a practitioner survey to capture emerging threats the data lags behind. Its job is to focus attention and vocabulary — "are we thinking about access control at all?" — not to certify that an app is secure. The verification counterpart is **ASVS** (the Application Security Verification Standard); the Top 10 is the poster, ASVS is the exam.

When an interviewer says "walk me through the OWASP Top 10," they are not checking whether you memorised ten strings. They want to see you **map categories onto your own stack** and know which ones a frontend engineer actually owns versus which are backend's problem.

## ⚙️ How it actually works

The 2021 revision reorganised the list around **root cause** rather than symptom — which is why XSS (a symptom) got folded into Injection (the cause). The categories a frontend materially influences:

| Category | Frontend relevance |
|---|---|
| **A01 Broken Access Control** (#1) | Client-side route guards are UX, never enforcement — every request must be re-authorised server-side. |
| **A02 Cryptographic Failures** | HTTPS everywhere, secure contexts, never ship secrets or keys in the bundle. |
| **A03 Injection** | XSS lives here now. Untrusted data reaching an execution sink. |
| **A05 Security Misconfiguration** | Missing CSP, permissive CORS, absent security headers. |
| **A06 Vulnerable & Outdated Components** | Your `node_modules` supply chain. |
| **A07 Identification & Authentication Failures** | Token storage, session fixation, weak logout. |
| **A08 Software & Data Integrity Failures** | SRI on third-party scripts, CI/CD tampering, Magecart-style skimmers. |

Ordering is a computed score blending incidence rate, exploitability, detectability, and impact — which is why **Broken Access Control** rose to #1: it's both common and high-impact.

## 💻 Code

The single most tested frontend misconception — a client guard mistaken for access control:

```jsx
// ❌ A01 Broken Access Control: this hides the UI but protects nothing.
// The data still ships; anyone can call the API directly or edit state.
function AdminPanel() {
  const { user } = useAuth();
  if (user.role !== "admin") return <Redirect to="/" />;
  return <Secrets />; // <Secrets> already fetched /api/secrets on mount
}
```

```js
// ✅ The server is the authority. The client guard is only cosmetics.
app.get("/api/secrets", requireRole("admin"), (req, res) => { /* ... */ });
// The frontend redirect is fine for UX — it must never be the ONLY check.
```

## ⚖️ Trade-offs

- **Awareness vs. verification.** The Top 10 is a great conversation-starter and a terrible acceptance criterion. "We pass the OWASP Top 10" is a meaningless claim — there's nothing to pass. If you need a bar, cite **ASVS** or the corresponding **Cheat Sheets**.
- **Category, not vulnerability.** A03 Injection covers SQLi, XSS, command injection and more. Saying "we're protected from A03" without naming the concrete sink is hand-waving.
- **Don't over-index on the list order.** #1 for the internet at large isn't #1 for *your* app. A static marketing site's biggest risk is a compromised dependency (A06), not broken access control.

## 💣 Gotchas interviewers probe

- **"Where does XSS sit in the 2021 list?"** Under **A03 Injection**. Candidates who say "it's #7" are quoting the 2017 list and dating themselves.
- **Top 10 ≠ a standard.** It's awareness. The compliance/verification document is **ASVS**. Confusing the two is a senior red flag.
- **Two categories are survey-driven.** Eight come from contributed data; two (like Insecure Design in 2021) are chosen by community vote because breach data lags emerging risk. Knowing this shows you understand how the list is built.
- **"Insecure Design" (A04) is not a bug you patch.** It's a *category of missing controls* — you can't test your way out of it, you have to design threat-modelling in. This is the "shift-left" category.
- **Client-side anything is not a boundary.** Access control, validation, rate limiting — if the browser is the only enforcer, it's decoration. The frontend's job is to *reduce attack surface*, not to be the wall.

## 🎯 Say this in the interview

> "I treat the OWASP Top 10 as an awareness heat map, not a checklist — it ranks categories of risk from contributed data, and the real verification standard is ASVS. As a frontend engineer the ones I own most directly are Broken Access Control, which is #1 and reminds me that client-side route guards are UX not security; Injection, which is where XSS now lives after the 2021 reshuffle; Security Misconfiguration, meaning my CSP, CORS and headers; and Vulnerable Components, meaning my npm supply chain. The framing I keep coming back to is that the browser is never a trust boundary — anything the server doesn't re-check, an attacker can forge. So the frontend's job is to shrink attack surface, and the server's job is to enforce."

## 🔗 Go deeper

- [OWASP Top 10](https://owasp.org/www-project-top-ten/) — the canonical list, methodology, and per-category detail.
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) — the verification standard the Top 10 is *not*.
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/) — the practical "how do I actually fix this" companion.
