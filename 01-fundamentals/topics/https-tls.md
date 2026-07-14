<div align="center">

# HTTPS & TLS

<sub>🧱 Fundamentals · 🟡 Medium · ⏱ 45m · `#networking` `#security`</sub>

<a href="../README.md">⬅ Fundamentals</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — HTTPS is just HTTP inside a **TLS** tunnel. TLS gives you three things: **encryption** (nobody can read it), **integrity** (nobody can tamper with it), and **authentication** (you're really talking to the site you think). The handshake uses slow asymmetric crypto once to agree a fast symmetric key for the session.

---

## 🧠 Mental model

TLS solves a chicken-and-egg problem: how do two strangers agree on a secret key over a wire an attacker is already reading? The trick is **use expensive public-key crypto briefly to bootstrap a cheap shared key**:

```
1. Client Hello  → supported ciphers, random
2. Server Hello  ← chosen cipher, random, CERTIFICATE (public key)
3. Key exchange  → both derive the SAME session key (ECDHE), never sent on the wire
4. Finished      → switch to fast SYMMETRIC encryption for all app data
```

Two ideas do the heavy lifting: **the certificate proves identity** (a CA vouches for it), and **the session key is derived, never transmitted**, so recording the traffic doesn't reveal it — that's *forward secrecy*.

## ⚙️ How it actually works

**The certificate** is a public key + domain name, signed by a **Certificate Authority** your OS/browser already trusts. Your browser verifies the chain (leaf → intermediate → trusted root) and that the domain matches. That's the *authentication* leg — encryption without it is useless, because you'd have a secure channel to an attacker.

**The handshake** (TLS 1.3, the modern default): **1 round trip** to establish the connection, and **0-RTT resumption** for repeat visits. TLS 1.2 needed 2 RTT — this latency reduction is why TLS 1.3 is a real performance win, not just security.

**Key exchange** uses **ECDHE** (ephemeral Diffie-Hellman): both sides compute the same secret from public exchanges, and because the key is ephemeral, compromising the server's private key *later* can't decrypt *past* sessions — **forward secrecy**.

**After the handshake**, everything (headers, URLs' path/query, cookies, body) is encrypted with fast symmetric crypto (AES-GCM/ChaCha20). What leaks: the **destination IP** and, historically, the **SNI** (which hostname you asked for) — ECH is closing that gap.

**HSTS** (`Strict-Transport-Security`) tells the browser "only ever use HTTPS for this domain," eliminating the initial `http://` redirect that a man-in-the-middle could hijack (SSL stripping).

## 💻 Code

```http
# Force HTTPS for a year, including subdomains; eligible for browser preload list.
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

```js
// Secure contexts: powerful APIs are HTTPS-only (and only work on localhost otherwise).
if (window.isSecureContext) {
  navigator.serviceWorker.register('/sw.js'); // SW, geolocation, crypto.subtle, etc.
}
```

```js
// Mixed content: an https page loading http subresources is blocked/upgraded.
// ❌ <script src="http://cdn.example.com/a.js"> → blocked on an https page
// ✅ Always use https:// or protocol-relative-free absolute https URLs.
```

## ⚖️ Trade-offs

- **TLS adds a handshake round trip** — real cost on high-latency links, but TLS 1.3 (1-RTT, 0-RTT resume) plus connection reuse makes it negligible in practice. The security is non-negotiable now.
- **0-RTT resumption is fast but replayable** — early data can be replayed by an attacker, so it must only carry *idempotent* requests (GET), never a "transfer money" POST.
- **Certificate management is operational overhead** — expiry causes outages. Automate with ACME/Let's Encrypt; expired certs are a top cause of preventable downtime.
- **Encryption ≠ trust:** a phishing site can have a valid cert (it proves *domain control*, not that the site is honest). The padlock means "encrypted to *this* domain," not "safe."

## 💣 Gotchas interviewers probe

- **"What does HTTPS actually protect?"** Encryption, integrity, *and* authentication. Candidates forget authentication — without it you'd encrypt to an impostor.
- **The padlock doesn't mean safe** — it means encrypted + domain-verified. Phishing sites use HTTPS too.
- **The URL path/query and cookies are encrypted; the IP and SNI are not** (SNI leaks the hostname; ECH fixes it). "Is the URL visible?" — the *hostname* is (via DNS/SNI), the path is not.
- **Symmetric vs asymmetric** — asymmetric is used only to bootstrap; the bulk data uses fast symmetric crypto. Saying "all traffic is public-key encrypted" is wrong and slow.
- **Mixed content** — an HTTPS page loading HTTP scripts/images is blocked or upgraded, breaking the page. Common migration bug.
- **Forward secrecy** — ephemeral keys mean a future private-key leak can't decrypt recorded past sessions. A strong senior signal.

## 🎯 Say this in the interview

> "HTTPS is HTTP wrapped in TLS, and TLS gives three guarantees people often shorten to just 'encryption' — it's encryption, integrity, and authentication. Authentication is the one candidates drop, and it's essential, because without verifying the certificate you'd have a perfectly secure channel to an attacker. Mechanically, the handshake uses expensive asymmetric crypto once, via ephemeral Diffie-Hellman, to derive a symmetric session key that's never sent on the wire — which also gives forward secrecy, so a later private-key leak can't decrypt past recorded traffic. Then all the actual data uses fast symmetric encryption. TLS 1.3 got this down to one round trip with zero-RTT resumption, so it's a performance win too. Two things I flag: the padlock only means encrypted-and-domain-verified, not trustworthy, and the hostname still leaks via SNI even though the path and body don't."

## 🔗 Go deeper

- [Cloudflare — What is HTTPS?](https://www.cloudflare.com/learning/ssl/what-is-https/) — clear, accurate overview.
- [Cloudflare — How TLS handshakes work](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) — the round-trip detail.
- [MDN — Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security) — versions and cipher context.
- [MDN — Strict-Transport-Security (HSTS)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security) — the SSL-stripping defence.
