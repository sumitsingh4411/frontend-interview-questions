<div align="center">

# TLS / handshake

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#tls` `#security`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — TLS turns a raw TCP pipe into an authenticated, encrypted channel. The handshake does three jobs at once: **agree on a cipher**, **prove the server's identity** with a certificate chain, and **derive a shared symmetric key** without ever sending it. TLS 1.3 does it in **one round trip** (0-RTT on resume) using ephemeral keys, so past traffic stays safe even if the server's private key later leaks.

---

## 🧠 Mental model

Every HTTPS request rides two nested channels. TCP gives you a reliable byte pipe; **TLS wraps that pipe** so nobody in the middle can read or tamper with it, and so you know you're really talking to `bank.com` and not an impostor. The handshake is the negotiation that sets this up *before* any HTTP flows.

The clever part is the **key exchange**: the client and server end up sharing a secret symmetric key, but that key is **never transmitted**. They use asymmetric crypto (slow, public/private keys) *only* to bootstrap a shared symmetric key, then switch to symmetric encryption (fast) for the actual data. Asymmetric for the handshake, symmetric for the bulk — that split is the whole design.

```
TCP handshake        TLS handshake                 Encrypted HTTP
──────────────       ──────────────────────        ──────────────
SYN →                ClientHello →                  GET / ... (all
    ← SYN-ACK            ← ServerHello + cert        encrypted with
ACK →                DONE (key derived)  →           the shared key)
(1 RTT)              (TLS 1.3: 1 RTT)
```

## ⚙️ How it actually works

**1. ClientHello.** Client sends supported TLS versions, a cipher-suite list, a random nonce, and — crucially in TLS 1.3 — its **key-share** (an ephemeral Diffie-Hellman public value) plus **SNI** (the hostname it wants, so a server hosting many sites picks the right cert) and **ALPN** (which app protocol: `h2`, `h3`, `http/1.1`).

**2. ServerHello + Certificate.** Server picks the cipher, sends its own key-share and nonce, and its **certificate chain**: the leaf cert for the domain, signed by an intermediate CA, chained up to a **root CA** the client already trusts (in the OS/browser trust store). The client verifies the signatures up the chain, checks the domain matches, checks expiry, and checks revocation (OCSP).

**3. Key derivation.** Both sides now have each other's ephemeral DH public value plus their own private one. Diffie-Hellman lets them independently compute the *same* shared secret **without it ever crossing the wire**. From it they derive the session keys. The certificate's role is *authentication* (proving the server owns that DH key), not encryption of the session key — a common misconception.

**4. Finished.** Both send a MAC over the whole handshake transcript, so any tampering (a downgrade attack) is detected. Then encrypted application data flows.

**Why ephemeral keys matter — forward secrecy.** Because the DH keys are generated fresh per session and thrown away, capturing today's traffic and stealing the server's private key *next year* still won't decrypt it — there's no long-term key that unlocks past sessions. TLS 1.3 makes ephemeral DH mandatory; the old RSA key-transport (where the client encrypted the session key with the server's public key) had *no* forward secrecy and is gone.

**TLS 1.3 speed.** It cut the handshake from 2 round trips to **1** by having the client guess the key-share upfront. **Session resumption** with a pre-shared key enables **0-RTT**: the client sends data in its very first flight. The catch: 0-RTT data is **replayable**, so it must only carry idempotent requests.

## 💻 Code

TLS is handled by the browser/OS; front-end engineers *observe* and *configure* it:

```bash
# Inspect the negotiated version, cipher, and cert chain
openssl s_client -connect example.com:443 -servername example.com -tls1_3 </dev/null
# Look for: "Protocol: TLSv1.3", "Cipher: TLS_AES_128_GCM_SHA256", the cert chain,
# and "Verify return code: 0 (ok)"

# Just the certificate's validity window
echo | openssl s_client -connect example.com:443 2>/dev/null \
  | openssl x509 -noout -dates -subject
```

```
# Header that opts a whole domain into HTTPS-only for a year, preventing
# SSL-strip downgrade attacks. Add to preload lists for first-visit protection.
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

## ⚖️ Trade-offs

- **Handshakes cost round trips** — the reason connection reuse (HTTP keep-alive, HTTP/2 multiplexing, connection pools) matters so much. Each new TLS connection on a high-latency link is ~1 RTT of pure setup before byte one.
- **0-RTT resumption trades safety for speed.** It's replay-able, so gate it to safe/idempotent requests only — never a `POST /transfer`.
- **Terminating TLS at the CDN/edge** offloads crypto and enables caching, but means traffic is (briefly) decrypted at the edge — a real consideration for sensitive data and compliance.
- **Certificate management is the operational tax.** Expiry causes hard outages; automate renewal (ACME/Let's Encrypt) rather than trusting a calendar reminder.

## 💣 Gotchas interviewers probe

- **"How is the symmetric key sent?"** *It isn't.* Diffie-Hellman lets both sides derive it independently; nothing secret crosses the wire. Candidates who say "encrypted with the public key" are describing the old, retired RSA key-transport.
- **The certificate authenticates; it doesn't encrypt the session.** Its job is proving identity so you're not key-exchanging with a MITM.
- **Forward secrecy** is the senior signal: ephemeral per-session keys mean a future private-key leak can't decrypt past captures.
- **SNI is sent in the clear** in standard TLS — the hostname is visible to the network (Encrypted Client Hello is the in-progress fix). A privacy gotcha people miss.
- **Expired/misconfigured chains** are the #1 real-world TLS failure — usually a missing *intermediate* cert, which works in browsers that cache it and fails elsewhere.
- **`https` ≠ trustworthy site.** TLS proves you're talking to *that domain* privately, not that the domain is honest. Phishing sites have valid certs.

## 🎯 Say this in the interview

> "The TLS handshake does three things before any HTTP flows: negotiate a cipher, authenticate the server via its certificate chain up to a trusted root CA, and establish a shared symmetric key. The key point is that the symmetric key is never sent — both sides run Diffie-Hellman and derive the same secret independently, using the certificate only to prove the server actually owns its key so you're not exchanging with a man in the middle. TLS 1.3 does this in one round trip, and zero on resumption, and it mandates ephemeral keys, which gives forward secrecy: even if the server's private key leaks later, past captured traffic stays safe because those session keys were thrown away. The trade-off with 0-RTT resumption is that early data is replayable, so I'd only allow idempotent requests over it. Operationally, the thing that actually breaks in production is certificate expiry and missing intermediates, so I automate renewal."

## 🔗 Go deeper

- [Cloudflare — What happens in a TLS handshake?](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) — step-by-step with clear diagrams.
- [Cloudflare — TLS 1.3 & 0-RTT](https://blog.cloudflare.com/introducing-0-rtt/) — why 1.3 is faster and the replay caveat.
- [MDN — Transport Layer Security](https://developer.mozilla.org/en-US/docs/Web/Security/Transport_Layer_Security) — the browser-side view, cipher suites, and config.
- [RFC 8446 — TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) — the spec, if you want the exact handshake state machine.
