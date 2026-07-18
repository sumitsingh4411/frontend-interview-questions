<div align="center">

# Authentication patterns

<sub>🔒 Security · 🔴 Hard · ⏱ 1.5h · `#auth`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — Authentication answers "**who are you and can you prove it?**", and every pattern is a different answer to one question: *where does the proof live and how does the browser attach it to each request?* The frontend's job is not to *decide* identity — it's to hold the credential safely and re-present it, which is why almost every auth bug is really a credential-storage or credential-transport bug.

---

## 🧠 Mental model

Authentication (**authn** — *who you are*) is not authorization (**authz** — *what you may do*). Login proves identity; access control decides permissions. Conflating them is the fastest way to fail the question, because the answers live in different layers and fail in different ways.

Every scheme reduces to a **credential lifecycle**: obtain a proof of identity, store it somewhere, attach it to each request, refresh it before it expires, and destroy it on logout. The patterns differ only in *what* the proof is and *where* it lives:

| Pattern | Proof carried per request | State lives | Ambient? |
|---|---|---|---|
| Session cookie | Opaque session ID | Server (session store) | Yes — auto-sent |
| JWT (bearer) | Signed, self-describing token | Client (nothing on server) | No — JS attaches it |
| OAuth/OIDC | Delegated token from an IdP | IdP + your server | Depends on storage |

**"Ambient"** is the word interviewers listen for: cookie credentials are attached by the browser automatically (so they're CSRF-exposed but XSS-resistant if `HttpOnly`); bearer tokens must be attached by *your JavaScript* (so they're CSRF-immune but XSS-exposed). You cannot escape this trade — you can only choose which attack surface you defend.

## ⚙️ How it actually works

**Stateful (server session).** On login the server creates a session record and hands back an opaque ID in an `HttpOnly; Secure; SameSite` cookie. Every subsequent request carries the cookie automatically; the server looks the ID up. Revocation is trivial — delete the row. The cost is a lookup per request and shared session storage (Redis) that must scale horizontally.

**Stateless (self-contained token).** The server signs a token containing the claims and holds *nothing*. Verification is a signature check, no lookup — which is why it scales beautifully across services. The catch is the mirror image of the benefit: **you can't un-issue a signature**, so revocation and "log out everywhere" require a short expiry plus a refresh mechanism or a denylist, which quietly re-introduces the state you were trying to avoid.

**The refresh split** is the pattern that separates seniors: issue a **short-lived access token** (minutes) for API calls and a **long-lived refresh token** (days) whose *only* job is to mint new access tokens. The access token limits the blast radius of theft; the refresh token, kept in an `HttpOnly` cookie scoped to the `/refresh` endpoint, is never exposed to app JS at all.

**MFA** layers a second factor (something you *have* — TOTP, WebAuthn/passkey) onto the password (something you *know*). **Passkeys** are the direction of travel: a phishing-resistant public-key credential bound to the origin, so there's no shared secret to steal or replay.

## 💻 Code

```js
// ✅ Session cookie: the browser stores and re-sends it; JS never touches it.
Set-Cookie: sid=opaque-random-id; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=1800

// Frontend just opts into sending credentials — no token handling at all:
await fetch("/api/me", { credentials: "include" });
```

```js
// The access/refresh split — the pattern interviewers want to hear.
// Access token in memory (dies on XSS-free reload), refresh token in an
// HttpOnly cookie the app JS literally cannot read.
let accessToken = null;

async function authedFetch(url, opts = {}) {
  let res = await fetch(url, withAuth(url, opts));
  if (res.status === 401) {
    // silently mint a new access token using the HttpOnly refresh cookie
    const r = await fetch("/auth/refresh", { method: "POST", credentials: "include" });
    if (!r.ok) return redirectToLogin();       // refresh expired → real logout
    accessToken = (await r.json()).accessToken;
    res = await fetch(url, withAuth(url, opts)); // retry once
  }
  return res;
}

const withAuth = (url, opts) => ({
  ...opts,
  headers: { ...opts.headers, Authorization: `Bearer ${accessToken}` },
});
```

## ⚖️ Trade-offs

- **Sessions vs tokens is not "old vs modern".** Sessions are simpler, instantly revocable, and the correct default for a classic first-party web app. Tokens win when you have *many* services or third-party API clients that can't share a session store. Reaching for JWT on a monolith is cargo-culting.
- **Statelessness is a benefit *and* a liability.** No lookup means fast, but also means "log out everywhere" and "ban this user now" are hard. If instant revocation matters (banking, admin), a stateful session or a short TTL + denylist is the honest answer.
- **Don't roll your own.** Password hashing (argon2/bcrypt), timing-safe comparison, MFA, account recovery, and rate-limiting are a minefield. Use a vetted library or IdP; the interview signal is knowing *why* you delegate, not reciting the crypto.

## 💣 Gotchas interviewers probe

- **"Where do you store the token?"** The trap answer is `localStorage`. It's readable by *any* script on the page, so one XSS = full account takeover with no expiry help. The senior answer: access token in memory, refresh token in an `HttpOnly` cookie. (See *Token storage* deep dive.)
- **authn vs authz.** A valid token proves *identity*, not *permission*. Checking "is this token valid?" and forgetting "may this user do this?" is the classic broken-access-control bug.
- **The frontend never enforces auth.** Hiding an admin button is UX, not security — the server must re-check every request. Client-side guards only decide what to *render*.
- **Logout must kill server state.** Deleting the cookie client-side while the session/token stays valid server-side is theatre; a stolen credential still works.
- **Token in URL / query string leaks** into logs, `Referer` headers, and browser history. Credentials belong in headers or `HttpOnly` cookies, never the URL.
- **Password reset is an auth flow too.** A guessable reset token or one that doesn't expire is a full bypass of everything above.

## 🎯 Say this in the interview

> "I start by separating authentication — proving who you are — from authorization, which is what you're allowed to do; they fail differently and live in different layers. Every pattern is really a credential lifecycle: obtain, store, attach, refresh, revoke. The key axis is *ambient authority*: cookie credentials are auto-attached by the browser, so they're CSRF-exposed but safe from XSS if they're `HttpOnly`; bearer tokens are attached by my JS, so they dodge CSRF but are XSS-exposed. My default for a first-party app is a stateful `HttpOnly; Secure; SameSite` session cookie because it's instantly revocable. When I need statelessness across services I use short-lived access tokens in memory plus a long-lived refresh token in an `HttpOnly` cookie, so app JS never touches the powerful credential. And I never trust the client — the server re-checks every request; hiding a button is UX, not a boundary."

## 🔗 Go deeper

- [Auth0 — Authentication and authorization flows](https://auth0.com/docs/get-started/authentication-and-authorization-flow) — the canonical map of which flow to pick.
- [OWASP — Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html) — the practical do/don't list for login systems.
- [MDN — HTTP authentication](https://developer.mozilla.org/en-US/docs/Web/HTTP/Authentication) — how `Authorization`, `WWW-Authenticate` and schemes actually work on the wire.
- [WebAuthn guide (webauthn.guide)](https://webauthn.guide/) — passkeys and phishing-resistant public-key auth, the direction of travel.
