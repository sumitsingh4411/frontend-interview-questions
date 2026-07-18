<div align="center">

# JWT: usage & pitfalls

<sub>🔒 Security · 🔴 Hard · ⏱ 1h · `#jwt` `#auth`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A JWT is a **signed, self-describing claim** — `header.payload.signature`, base64url-encoded — that lets a server trust data it didn't store, verified by a signature check with no database lookup. The catch is everything that flows from "no lookup": **you can't un-issue it**, the payload is *readable by anyone*, and the single most dangerous field is the one that decides how it's verified — the `alg` header.

---

## 🧠 Mental model

A JWT is not encryption and it's not a session. It's a **tamper-evident envelope**: the payload is plainly visible to anyone who base64-decodes it, and the signature only proves *nobody changed it since the issuer signed it*. If you remember one thing: **signed ≠ secret.** Never put anything in a JWT you wouldn't print on a postcard.

The entire value proposition is *stateless verification*: the server re-derives trust from the signature alone, no session store, no lookup. That's why JWTs scale across services. But statelessness is a Faustian bargain — the same property that removes the lookup removes your ability to **revoke**. A JWT is valid until it expires, full stop, because there's no server-side record to delete. Every JWT pitfall is a consequence of one of these two facts: *the payload is visible*, or *you can't take it back*.

```
eyJhbGciOiJIUzI1NiJ9  .  eyJzdWIiOiIxMiIsImV4cCI6MTk5OX0  .  3vLq…signature
     header (alg, typ)         payload (claims — READABLE)          HMAC/RSA over the first two
```

## ⚙️ How it actually works

Verification is: recompute the signature over `base64(header) + "." + base64(payload)` using the expected key and algorithm, then compare. If it matches, the claims are trusted. Two algorithm families:

- **HS256** — symmetric HMAC. One shared secret signs *and* verifies. Simple, but everyone who can verify can also *forge*.
- **RS256/ES256** — asymmetric. A private key signs; a public key verifies. The issuer alone can mint tokens; anyone can check them. This is what OIDC uses, with the public keys published at a **JWKS** endpoint.

**The standard claims carry the security semantics**, and skipping any of them is a real bug: `exp` (expiry — without it the token is eternal), `iat` (issued-at), `nbf` (not-before), `iss` (issuer — verify it's *your* IdP), `aud` (audience — verify the token was minted *for your API*, not another service that shares the key), `sub` (subject), and `jti` (a unique ID, the hook for a revocation denylist).

**The `alg` header is attacker-controlled input, and that's the whole problem.** A naive library reads `alg` from the token to decide how to verify — so an attacker can rewrite it. Two classic exploits: **`alg: none`** (claim the token is unsigned; a lazy verifier accepts an empty signature) and **RS256 → HS256 confusion** (the server *publishes* its RSA public key; the attacker signs a forged token with HS256 using that public key *as the HMAC secret* — and a verifier that trusts the header's `alg` uses the public key to verify, and it passes). The fix is to **pin the expected algorithm server-side** and never let the token choose.

## 💻 Code

```js
// ❌ Catastrophic: lets the TOKEN pick the algorithm. Enables alg:none and
//    RS256→HS256 key-confusion forgery.
jwt.verify(token, key);                       // algorithm inferred from header — NO
jwt.verify(token, key, { algorithms: [] });   // empty allowlist — NO

// ✅ Pin the algorithm and the audience/issuer. The server decides, not the token.
jwt.verify(token, PUBLIC_KEY, {
  algorithms: ["RS256"],      // reject anything that isn't exactly this
  issuer: "https://auth.example.com",
  audience: "https://api.example.com",   // this token was minted FOR me
});
```

```js
// ❌ Signed ≠ secret. Anyone can read this. No PII, no permissions you rely on
//    the user not seeing, and NEVER a password.
const payload = { sub: userId, email, ssn, isAdmin }; // ssn is now on a postcard

// ✅ Minimal, non-sensitive claims + short expiry. Revocation via jti denylist.
const payload = { sub: userId, roles: ["editor"], jti: crypto.randomUUID() };
const token = jwt.sign(payload, PRIVATE_KEY, { algorithm: "RS256", expiresIn: "10m" });
```

## ⚖️ Trade-offs

- **Stateless is a feature *and* the core weakness.** No lookup means fast, cross-service verification — and no instant logout, no "ban this user now", no "revoke this device". If you need real revocation you add a `jti` denylist or short TTLs + refresh, which re-introduces state and quietly undoes the reason you chose JWT.
- **Short expiry is the pragmatic revocation story.** A 5–15 minute access token bounds the theft window; a long-lived refresh token (in an `HttpOnly` cookie) does the re-minting. Long-lived access tokens are the anti-pattern.
- **Don't use JWTs for browser sessions by default.** For a classic first-party app, a plain server session cookie is smaller, instantly revocable, and `HttpOnly`. JWT earns its place with *many services* or *third-party clients*, not on a monolith.

## 💣 Gotchas interviewers probe

- **`alg: none` and RS256/HS256 confusion.** The headline JWT vulnerabilities. The fix is one line: pin `algorithms` server-side; never trust the header's `alg`.
- **"Can you revoke a JWT?"** Not natively — it's valid until `exp`. You need short TTLs, a `jti` denylist, or rotating the signing key (which nukes *all* tokens). Saying "just delete it" fails the question.
- **The payload is readable.** `atob(token.split('.')[1])` reveals every claim. Putting a password, SSN, or a secret in there is a data leak, not a vulnerability that "requires the secret to exploit".
- **Not verifying `aud`/`iss`.** A token minted for service A, if it shares a key or IdP, is replayable against service B unless B checks the audience. Very commonly forgotten.
- **Storing JWTs in `localStorage`.** XSS-readable, so one injected script exfiltrates the token — and unlike a cookie it can't be `HttpOnly`. (See *Token storage*.)
- **Clock skew.** `exp`/`nbf` checks fail intermittently across servers with drifting clocks; allow a small leeway (~30–60s), not zero.
- **JWT ≠ encrypted.** That's **JWE**. A plain **JWS** (what everyone calls "JWT") is signed only.

## 🎯 Say this in the interview

> "A JWT is a signed, self-describing token — header, payload, signature — that lets a server trust claims from the signature alone, with no lookup. That statelessness is the whole point and the whole problem: it scales across services, but you can't revoke it, because there's no server record to delete — so I lean on short expiry plus a refresh token, or a `jti` denylist when I truly need instant revocation. Two things I never get wrong. First, signed isn't secret — the payload is base64, readable by anyone, so no PII or passwords go in it. Second, I pin the algorithm server-side and validate `aud` and `iss`, because the `alg` header is attacker-controlled and that's exactly what `alg:none` and the RS256-to-HS256 key-confusion attacks abuse. And I don't reach for JWTs on a first-party monolith where a revocable session cookie is simpler and safer."

## 🔗 Go deeper

- [jwt.io — Introduction to JSON Web Tokens](https://jwt.io/introduction) — structure, claims, and a live decoder to see the payload is plaintext.
- [OWASP — JSON Web Token Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) — algorithm pinning, `alg:none`, and validation musts.
- [RFC 7519 — JSON Web Token](https://www.rfc-editor.org/rfc/rfc7519) — the authoritative spec for the registered claims.
- [Auth0 — Critical vulnerabilities in JWT libraries](https://auth0.com/blog/critical-vulnerabilities-in-json-web-token-libraries/) — the RS256/HS256 confusion attack, explained with the exploit.
