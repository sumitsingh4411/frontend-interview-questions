<div align="center">

# CSRF

<sub>🔒 Security · 🔴 Hard · ⏱ 1h · `#csrf`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — CSRF abuses the browser's habit of **auto-attaching cookies to every request to your origin**, so a malicious site can make the victim's browser fire an authenticated state-changing request without ever reading the response. The fix is proving the request came from *your* app: `SameSite` cookies plus an anti-CSRF token the attacker can't guess.

---

## 🧠 Mental model

CSRF exists because of one browser behaviour: **ambient authority.** Cookies for `bank.com` are sent on *every* request to `bank.com` — including one triggered by a form on `evil.com`. The browser doesn't care who initiated it. So the attacker doesn't need to steal your session; they just need your browser to *use* it on their behalf.

The crucial asymmetry: CSRF is a **blind, write-only** attack. Thanks to the same-origin policy, `evil.com` cannot *read* the response. So CSRF is useless for stealing data — it's about **causing side effects**: transfer money, change email, delete account, add an admin. If a request only reads data, it isn't a CSRF target; if it changes state, it is.

This is the inverse of XSS. XSS runs *inside* your origin and can do anything. CSRF sits *outside* your origin and can only trigger requests blindly. Confusing the two is the fastest way to fail the question.

## ⚙️ How it actually works

The attack in three lines — the victim just has to visit `evil.com` while logged into `bank.com`:

```html
<!-- On evil.com. The browser attaches bank.com's cookies automatically. -->
<form action="https://bank.com/transfer" method="POST" id="f">
  <input name="to" value="attacker">
  <input name="amount" value="10000">
</form>
<script>document.getElementById("f").submit();</script>
```

No JavaScript on `bank.com` is involved; no token is stolen. The defenses all answer the same question — *"can I prove this request came from my own app, not a cross-site forgery?"*

1. **`SameSite` cookies** — the browser withholds the cookie on cross-site requests. `Lax` (the modern default) blocks it on cross-site POST/PUT/DELETE but allows it on top-level GET navigations; `Strict` blocks even those. This is now the *primary* structural defense.
2. **Anti-CSRF token** — the server embeds an unpredictable, per-session token in the page; the app echoes it back in a header or hidden field. `evil.com` can't read it (SOP), so it can't forge it. The **synchronizer token** (server-stored) and the **double-submit cookie** (stateless, token in a cookie *and* a header) are the two patterns.
3. **Origin/Referer check** — verify the `Origin` header matches your host. Cheap, effective, and a good belt-and-braces layer.

## 💻 Code

```js
// ✅ Cookie config: SameSite is the structural backstop
Set-Cookie: session=…; HttpOnly; Secure; SameSite=Lax

// ✅ Double-submit token: readable cookie + matching header.
//    evil.com can't READ the cookie value (SOP), so it can't set the header.
res.cookie("csrf", token, { sameSite: "lax", secure: true }); // NOT HttpOnly
fetch("/transfer", {
  method: "POST",
  headers: { "X-CSRF-Token": getCookie("csrf") }, // app copies cookie → header
  body: JSON.stringify({ to, amount }),
});
// Server rejects unless header === cookie AND cookie is valid.
```

```js
// ✅ Server-side Origin check — reject cross-site writes outright
app.post("/transfer", (req, res, next) => {
  const origin = req.get("Origin");
  if (origin && new URL(origin).host !== req.get("Host")) return res.sendStatus(403);
  next();
});
```

## ⚖️ Trade-offs

- **`SameSite=Strict` breaks legitimate cross-site navigation** — following a link from email or another site arrives *unauthenticated*, so the user looks logged out. `Lax` is the pragmatic default; use `Strict` only for the highest-value cookies (or pair a `Lax` session cookie with a `Strict` sentinel).
- **`SameSite` alone isn't enough.** It's browser-dependent, doesn't cover *same-site* subdomain attacks, and legacy browsers ignore it. Tokens remain the belt to `SameSite`'s braces.
- **Token in a JS-readable cookie is weaker.** If you also have XSS, the double-submit token is readable — which is why CSRF defenses assume you've already stopped XSS. CSRF tokens do *not* defend against XSS, and vice versa.
- **Custom-header APIs get partial protection for free.** A request with `Content-Type: application/json` or a custom header triggers CORS preflight, which a simple cross-site form can't send — but don't rely on this alone.

## 💣 Gotchas interviewers probe

- **"Does CSRF let the attacker read the response?"** No — it's blind and write-only. SOP blocks the read. This single fact separates people who understand CSRF from people who memorised it.
- **CSRF affects cookie/ambient auth, not `Authorization: Bearer` tokens.** If your API authenticates with a header token that JS must attach explicitly, there's no ambient authority to abuse — so pure token-in-header APIs are largely CSRF-immune (but then vulnerable to XSS token theft — pick your poison).
- **`GET` should never change state.** A CSRF via `<img src="/logout">` or `/delete?id=5` works precisely because someone made a GET mutate. RESTful verbs aren't just tidiness — they're a security boundary.
- **`HttpOnly` does nothing for CSRF.** It stops XSS from reading the cookie; the browser still *sends* it cross-site. People conflate the two constantly.
- **Login CSRF** is a real variant — forcing a victim into the *attacker's* account so their activity is logged there. Protect the login form too.
- **CORS is not a CSRF defense.** CORS governs *reading* cross-origin responses; the forged *write* still lands.

## 🎯 Say this in the interview

> "CSRF abuses ambient authority — the browser auto-attaches my cookies to any request to my origin, even one triggered by a form on a malicious site. The key insight is that it's blind and write-only: the same-origin policy stops the attacker reading the response, so CSRF is only ever about state-changing side effects, never data theft. My primary defense today is `SameSite=Lax` cookies, which stop the cookie riding along on cross-site POSTs, backed by an anti-CSRF token — synchronizer or double-submit — that the attacker can't read and therefore can't forge, plus an Origin-header check on writes. Two things I'm careful about: GETs must never mutate state, and I remember that token-in-header APIs sidestep CSRF entirely but reopen XSS token theft, so the defenses don't substitute for each other."

## 🔗 Go deeper

- [OWASP — Cross Site Request Forgery](https://owasp.org/www-community/attacks/csrf) — the canonical definition and attack scenarios.
- [OWASP — CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) — synchronizer vs double-submit, done right.
- [MDN — SameSite cookies](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite) — the exact `Lax`/`Strict`/`None` semantics and defaults.
