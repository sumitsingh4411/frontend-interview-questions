<div align="center">

# OAuth 2.0 & OIDC

<sub>🔒 Security · 🔴 Hard · ⏱ 1.5h · `#oauth` `#auth`</sub>

<a href="../README.md">⬅ Security</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — **OAuth 2.0 is delegated *authorization*** — it lets an app act on your behalf against an API *without* handing over your password, by exchanging a user consent for an **access token**. **OIDC is the thin identity layer on top** that adds an **ID token** so the app learns *who you are*. The one-liner that anchors it: **OAuth = "can this app do X for me?", OIDC = "who is this user?"** — and confusing them is the classic senior filter.

---

## 🧠 Mental model

OAuth solves one problem: *let App A use your data on Service B without App A ever seeing your Service B password.* The insight is **delegation via a token instead of credential sharing**. You authenticate directly with the service you trust (the Authorization Server), it asks *you* to consent to specific scopes, and it hands the app a scoped, expiring **access token** — a valet key, not the master key.

The four roles, which interviewers expect by name:

| Role | Who |
|---|---|
| **Resource Owner** | You, the user |
| **Client** | The app requesting access (your SPA/backend) |
| **Authorization Server** | Issues tokens after auth + consent (Google, Auth0, Okta) |
| **Resource Server** | The API that holds the data and honours the access token |

**OAuth was never an authentication protocol** — this is the crux. An access token proves the app was *authorized to call an API*; it says nothing reliable about *who logged in*. People bolted login onto OAuth by calling a "get profile" API and treating that as identity — which broke subtly (the confused-deputy/"token substitution" problem). **OIDC standardised the fix**: a signed **ID token** (a JWT) whose *audience is your client*, carrying verified identity claims. Use the access token to *call APIs*; use the ID token to *know who the user is*.

## ⚙️ How it actually works

The modern, correct flow is **Authorization Code + PKCE**. Forget the Implicit flow — it's deprecated because it returned tokens in the URL fragment where they leak.

```
1. Client → AuthServer:  redirect with response_type=code, scope,
                         state (CSRF), code_challenge (PKCE)
2. User authenticates + consents at the AuthServer directly
3. AuthServer → Client:  redirect back with a one-time ?code=… (&state)
4. Client → AuthServer:  POST code + code_verifier  (back channel)
5. AuthServer → Client:  { access_token, id_token, refresh_token }
6. Client → ResourceServer:  Authorization: Bearer <access_token>
```

**Why the two-step "get a code, then exchange it"?** The code travels through the browser (front channel, leak-prone); the actual *tokens* come back over a direct server call (back channel). The code alone is useless without the exchange.

**PKCE (Proof Key for Code Exchange)** closes the gap for public clients (SPAs, mobile) that can't hold a secret. The client generates a random `code_verifier`, sends its SHA-256 hash (`code_challenge`) in step 1, and reveals the raw verifier in step 4. An attacker who intercepts the `code` can't exchange it — they don't have the verifier. PKCE is now recommended for *every* client type, not just public ones.

**`state`** is the CSRF defense for the flow itself: a random value round-tripped and checked on return, so an attacker can't inject their own authorization code (login CSRF / code injection). **`nonce`** binds the ID token to the request to stop token replay.

## 💻 Code

```js
// ✅ Authorization Code + PKCE — start the flow (public SPA client)
const verifier  = base64url(crypto.getRandomValues(new Uint8Array(32)));
const challenge = base64url(await sha256(verifier));
sessionStorage.setItem("pkce_verifier", verifier);
const state = crypto.randomUUID();
sessionStorage.setItem("oauth_state", state);

location.assign("https://auth.example.com/authorize?" + new URLSearchParams({
  response_type: "code",              // ✅ code flow, NOT token (implicit is dead)
  client_id: CLIENT_ID,
  redirect_uri: REDIRECT_URI,
  scope: "openid profile email",      // 'openid' ⇒ this is an OIDC request
  state,                              // CSRF protection for the redirect
  code_challenge: challenge,          // PKCE
  code_challenge_method: "S256",
}));
```

```js
// ✅ On the callback: verify state, then exchange the code for tokens
const params = new URLSearchParams(location.search);
if (params.get("state") !== sessionStorage.getItem("oauth_state")) throw Error("CSRF");

const res = await fetch("https://auth.example.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    grant_type: "authorization_code",
    code: params.get("code"),
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: sessionStorage.getItem("pkce_verifier"), // PKCE proof
  }),
});
const { access_token, id_token } = await res.json();
// access_token → call APIs;  id_token → verify signature + nonce, then read identity
```

## ⚖️ Trade-offs

- **Grant types are a decision tree, not a menu.** Authorization Code + PKCE for anything user-facing (web, SPA, mobile). Client Credentials for machine-to-machine (no user). **Implicit and Resource-Owner Password grants are deprecated** — naming them as your choice is a red flag.
- **"Sign in with Google" is convenience *and* dependency.** You offload password storage, MFA, and breach risk to a hardened IdP — but you inherit their outages, their account-recovery policy, and a lock-in surface. For consumer apps it's usually the right trade; for regulated data, weigh the delegation carefully.
- **Where the SPA keeps tokens is the hard part.** Tokens in `localStorage` are XSS-exfiltratable. The current best practice is the **Backend-For-Frontend (BFF)** pattern: the server holds the tokens and the browser gets an `HttpOnly` session cookie — pushing you back toward sessions, which is telling.

## 💣 Gotchas interviewers probe

- **"Is OAuth authentication?"** No — it's *authorization*. Using an access token as proof of login is the classic mistake OIDC exists to fix. Identity comes from the **ID token**, whose audience is your client.
- **Access token vs ID token.** Access token = call APIs (audience: the resource server, opaque to the client). ID token = identity (audience: the client, a JWT you *verify and read*). Sending an ID token to an API, or trusting an access token's claims for identity, are both wrong.
- **Implicit flow is dead.** It returned tokens in the URL fragment (history, `Referer`, logs). Auth Code + PKCE replaced it everywhere.
- **Forgetting `state`** opens the flow to CSRF / authorization-code injection. It's not optional.
- **Not validating the ID token.** You must verify the signature (via JWKS), the `iss`, the `aud` (== your client_id), `exp`, and the `nonce`. An unvalidated ID token is just attacker-supplied JSON.
- **Scopes ≠ permissions in *your* system.** `scope: email` grants access to an IdP resource; it does not grant roles in your app. Map external scopes to internal authorization deliberately.

## 🎯 Say this in the interview

> "OAuth 2.0 is delegated authorization: it lets an app act on my behalf against an API using a scoped, expiring access token, so I never share my password with the app. Crucially it is *not* authentication — the access token proves the app may call an API, not who I am. OIDC is the identity layer on top: it adds an ID token, a JWT whose audience is my client, carrying verified identity claims — that's what I use to know who logged in. The flow I reach for is Authorization Code with PKCE for every user-facing client; Implicit is deprecated because it leaked tokens in the URL. PKCE stops a stolen authorization code being exchanged, and `state` protects the redirect from CSRF. The part I'm most careful about is validating the ID token — signature via JWKS, plus `iss`, `aud`, and `nonce` — and, in a browser, using a backend-for-frontend so tokens live in an `HttpOnly` cookie instead of `localStorage`."

## 🔗 Go deeper

- [Aaron Parecki — OAuth 2.0 Simplified](https://aaronparecki.com/oauth-2-simplified/) — the clearest end-to-end walkthrough of the roles and flows.
- [OAuth 2.0 for Browser-Based Apps (IETF BCP)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps) — why SPAs should use Auth Code + PKCE and the BFF pattern.
- [OpenID Connect Core](https://openid.net/specs/openid-connect-core-1_0.html) — the ID token, claims, and `nonce` semantics.
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700) — the modern do/don't, including deprecating Implicit.
