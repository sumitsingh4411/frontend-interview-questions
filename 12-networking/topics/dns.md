<div align="center">

# DNS

<sub>📡 Networking · 🟢 Easy · ⏱ 30m · `#dns` `#basics`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — DNS is the internet's phone book: it turns `example.com` into an IP address through a hierarchy of caches and authoritative servers. It happens *before* the first byte of your request, it's cached aggressively at many layers, and a stale or slow lookup is a latency and outage source that front-end perf work routinely forgets.

---

## 🧠 Mental model

A browser can't connect to `example.com` — it needs an IP like `93.184.216.34`. **Resolution** is the process of getting from name to number, and it's a **hierarchical, cached lookup**, not a single server call. Read a domain right-to-left as a tree:

```
                    . (root)
                    │
            ┌───────┴───────┐
           com             org        ← TLD servers
            │
        example.com                   ← authoritative server (owns the records)
            │
   www / api / mail ...               ← subdomains / records
```

The key insight: **almost every lookup is answered from a cache**, not by walking the whole tree. Your OS caches, your **recursive resolver** (usually your ISP's, or `1.1.1.1`/`8.8.8.8`) caches, and each layer honours a **TTL** the record's owner set. The full root → TLD → authoritative walk only happens on a true cache miss.

## ⚙️ How it actually works

A cold resolution (nothing cached anywhere) walks the hierarchy via a **recursive resolver** that does the legwork on your behalf:

1. **Browser/OS cache** — checked first; hit → done.
2. **Recursive resolver** — if it has the answer cached, returns it. Otherwise it queries:
3. **Root servers** — "who handles `.com`?" → returns the TLD servers.
4. **TLD servers** — "who's authoritative for `example.com`?" → returns the authoritative name servers.
5. **Authoritative server** — owns the actual records, returns the IP.

The resolver caches the answer for its **TTL** and hands it back. Every subsequent request within the TTL skips the whole walk.

**Record types you should know:**

| Record | Maps to | Note |
|---|---|---|
| `A` / `AAAA` | IPv4 / IPv6 address | the actual endpoint |
| `CNAME` | another *name* | alias; costs an extra resolution; can't sit at the zone apex |
| `MX` | mail servers | email routing |
| `TXT` | arbitrary text | domain verification, SPF/DKIM |
| `NS` | name servers | who's authoritative |

**Transport & privacy.** Classic DNS runs over UDP port 53 in **plaintext** — anyone on the path can see and tamper with lookups. **DoH (DNS over HTTPS)** and **DoT (DNS over TLS)** encrypt it; browsers increasingly default to DoH.

**Why front-end perf cares.** DNS resolution is a serial prerequisite: **DNS → TCP → TLS → request**. On a cold connection to a new origin (a third-party CDN, an analytics host), the DNS lookup is pure latency before anything else can start — which is why `dns-prefetch` and `preconnect` exist.

## 💻 Code

You don't resolve DNS in JS, but you *hint* the browser to resolve early:

```html
<!-- Resolve the DNS for a third-party origin NOW, before it's needed.
     Cheap: just the name→IP lookup. -->
<link rel="dns-prefetch" href="https://cdn.example.com" />

<!-- Go further: DNS + TCP + TLS all warmed up ahead of time.
     Use for origins you KNOW you'll hit (fonts, critical API, hero image CDN). -->
<link rel="preconnect" href="https://cdn.example.com" crossorigin />
```

```bash
# Trace the resolution and see the TTL (the number before IN A)
dig example.com +noall +answer
# example.com.  86400  IN  A  93.184.216.34   ← 86400s = 24h TTL

# Watch the full recursive walk from the root down
dig example.com +trace

# See which resolver your machine is actually using
scutil --dns | grep nameserver   # macOS
```

## ⚖️ Trade-offs

- **TTL is a control/agility trade-off.** Long TTL (hours/days) = fewer lookups, faster, cheaper, but a change (failover, migration) takes that long to propagate. Short TTL = fast changes but more lookups and resolver load. **Lower the TTL *before* a planned migration**, then raise it after.
- **`CNAME` is convenient but costs a hop.** Each alias is another resolution in the chain. Flattening (`ALIAS`/`ANAME` at the apex) avoids the extra round trip.
- **`preconnect` isn't free** — it opens a real socket + TLS. Use it for a handful of *certain* origins; over-using it wastes connections. `dns-prefetch` is the cheap, liberal option.
- **DNS-based load balancing / GeoDNS** is coarse: it routes by resolver location and caches for the TTL, so it can't react instantly to a server going down — anycast and health-checked load balancers are finer-grained.

## 💣 Gotchas interviewers probe

- **"DNS propagation" is a misnomer.** Nothing is pushed. Old answers simply *expire* per their TTL and get re-fetched. Slow "propagation" is just long TTLs still cached downstream.
- **Resolution precedes everything** — DNS → TCP → TLS → HTTP. A slow DNS lookup delays the entire request and is invisible in most app metrics. Real outages have been "DNS was down", not "the app was down".
- **`CNAME` can't live at the zone apex** (`example.com` itself) — it would collide with the required `SOA`/`NS` records. That's why root domains need `A` records or provider-specific `ALIAS`.
- **Browser DNS cache is separate from OS cache**, with its own timeout — which is why an app can resolve to a stale IP after a change even when `dig` shows the new one.
- **Plaintext by default.** Standard DNS leaks every site you visit to the network. DoH/DoT fix it; SNI in TLS still leaks the hostname separately.

## 🎯 Say this in the interview

> "DNS resolves a hostname to an IP through a cached hierarchy — root, then TLD, then the authoritative server — but in practice almost every lookup is served from a cache: the OS, then the recursive resolver, each honouring the record's TTL. The full walk only happens on a cold miss. The thing I care about as a front-end engineer is that resolution is a serial prerequisite — DNS, then TCP, then TLS, then the request — so a cold lookup to a third-party origin is pure latency before anything starts, which is why I use `preconnect` for origins I'm certain about and `dns-prefetch` liberally for the rest. On operations, the detail people get wrong is 'DNS propagation' — nothing propagates; old answers just expire on their TTL, so I lower the TTL before a planned migration and raise it after."

## 🔗 Go deeper

- [Cloudflare — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/) — the hierarchy and recursive-resolver flow, clearly illustrated.
- [MDN — What is a domain name?](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/Web_mechanics/What_is_a_domain_name) — records and resolution for web developers.
- [web.dev — Establish network connections early](https://web.dev/articles/preconnect-and-dns-prefetch) — when to use `preconnect` vs `dns-prefetch`.
- [Cloudflare — DNS over HTTPS](https://developers.cloudflare.com/1.1.1.1/encryption/dns-over-https/) — the encrypted-DNS story.
