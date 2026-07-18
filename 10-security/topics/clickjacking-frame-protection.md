<div align="center">

# Clickjacking & frame protection

<sub>🔒 Security · 🟡 Medium · ⏱ 45m · `#clickjacking`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Clickjacking loads your real, logged-in page inside a **transparent iframe** on an attacker's site and tricks the user into clicking something they can't see. You defend by refusing to be framed: `Content-Security-Policy: frame-ancestors` (modern) or `X-Frame-Options` (legacy).

---

## 🧠 Mental model

Clickjacking is a **UI redressing** attack, not a code-injection attack. The attacker doesn't break into your app — they *borrow* it. Your genuine page, with the victim's real session, is layered invisibly on top of a decoy ("Click to win!"). The user clicks the decoy; the click actually lands on your hidden "Delete account" or "Transfer" button. Every request is legitimate, from the real user, with real cookies — which is exactly why server-side auth can't detect it. **The user is authenticated; they just didn't mean to click that.**

The mental key: this is the one major web attack that has *nothing* to do with data reaching a sink. It's a **rendering/trust-boundary** problem. The defense therefore isn't sanitisation — it's telling the browser *"never render me inside someone else's frame."*

## ⚙️ How it actually works

The attack stacks two layers with CSS:

```html
<!-- evil.com -->
<button>Click here to win a prize!</button>       <!-- decoy, visible -->
<iframe src="https://bank.com/settings"           <!-- your real page -->
        style="position:absolute; top:0; opacity:0.0001; width:600px; height:400px;">
</iframe>
<!-- The invisible "Delete account" button is positioned right over the decoy. -->
```

The defense is a **response header the browser enforces before rendering the frame**:

| Mechanism | Directive | Notes |
|---|---|---|
| **CSP (modern)** | `Content-Security-Policy: frame-ancestors 'none'` | The standard. Supports multiple allowed origins. |
| | `frame-ancestors 'self' https://trusted.com` | Allow specific parents only. |
| **X-Frame-Options (legacy)** | `X-Frame-Options: DENY` | No framing at all. |
| | `X-Frame-Options: SAMEORIGIN` | Only your own origin may frame you. |

`frame-ancestors` supersedes `X-Frame-Options` and is strictly more capable — it allows an *allow-list* of origins, whereas `X-Frame-Options: ALLOW-FROM` was buggy and is dead. Ship `frame-ancestors` as the real control and keep `X-Frame-Options: DENY` only as a fallback for ancient browsers.

Variants worth naming: **likejacking** (hijacking a social "like"), **cursorjacking** (faking the pointer position), and **drag-and-drop / keystroke** redressing.

## 💻 Code

```http
# ✅ The modern, authoritative defense (CSP). frame-ancestors wins if both are present.
Content-Security-Policy: frame-ancestors 'none';

# ✅ Legacy fallback for old browsers. Belt-and-braces.
X-Frame-Options: DENY

# ✅ To allow embedding by specific partners only:
Content-Security-Policy: frame-ancestors 'self' https://partner.example;
```

```js
// ❌ Frame-busting JS — the old hack, trivially defeated by iframe `sandbox`
if (top !== self) top.location = self.location; // sandboxed frames block navigation

// ✅ Set the header at the edge/server for EVERY response, not per-page
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "frame-ancestors 'none'");
  res.setHeader("X-Frame-Options", "DENY"); // legacy fallback
  next();
});
```

## ⚖️ Trade-offs

- **`DENY` vs `SAMEORIGIN`.** `DENY` is safest but breaks your *own* legitimate embeds (a dashboard iframing a settings page). Use `frame-ancestors 'self'` when you need same-origin framing, and enumerate partners explicitly rather than opening it up.
- **JS frame-busting is not a defense.** `<iframe sandbox>` disables the framed page's scripts and navigation, neutering any `top.location` trick. Header-based protection is the only reliable control — it's enforced by the browser, not by code that can be sandboxed away.
- **Sensitive actions still deserve friction.** Even framed, a re-authentication prompt, a confirmation modal, or a CAPTCHA on destructive actions blunts clickjacking's payoff. Defense in depth, not either/or.

## 💣 Gotchas interviewers probe

- **"`X-Frame-Options` or CSP?"** Both, but know that **`frame-ancestors` supersedes** `X-Frame-Options`, and if both are set, browsers honour `frame-ancestors`. Naming `frame-ancestors` first is the senior signal.
- **`X-Frame-Options: ALLOW-FROM` is dead.** It was never reliably implemented and is removed — if you need an allow-list, that's *only* possible via CSP `frame-ancestors`.
- **Frame-busting JavaScript is defeated** by the `sandbox` attribute. Candidates who propose `if (top !== self)` as *the* fix are dated.
- **Meta tags don't work.** `frame-ancestors` and `X-Frame-Options` must be **HTTP response headers** — a `<meta http-equiv>` is ignored for framing control.
- **This bypasses SameSite/CSRF defenses.** The click is a genuine same-site interaction from the real user — CSRF tokens and `SameSite` cookies don't help because it isn't a forged cross-site *request*.
- **`Cross-Origin-Opener-Policy` / `Cross-Origin-Embedder-Policy` are different.** They isolate windows/resources for Spectre-era protections, not framing — don't confuse them with `frame-ancestors`.

## 🎯 Say this in the interview

> "Clickjacking is UI redressing: the attacker loads my real, logged-in page in an invisible iframe over a decoy, so the victim's click lands on a hidden button in my app. Every request is legitimate and authenticated, which is why the server can't detect it — the user genuinely clicked, they just couldn't see what. So the defense is telling the browser never to frame me: `Content-Security-Policy: frame-ancestors 'none'` as the modern control, with `X-Frame-Options: DENY` as a legacy fallback, both set as response headers at the edge for every response. I wouldn't rely on JavaScript frame-busting because a sandboxed iframe defeats it. And for genuinely destructive actions I'd still add a confirmation or re-auth step as defense in depth."

## 🔗 Go deeper

- [OWASP — Clickjacking](https://owasp.org/www-community/attacks/Clickjacking) — the attack, variants, and defense-in-depth guidance.
- [MDN — CSP `frame-ancestors`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors) — the authoritative modern directive.
- [MDN — X-Frame-Options](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options) — the legacy header and why `ALLOW-FROM` is gone.
