# 12 · Networking

The pipe between your app and the data. Real-time, protocols, and caching decisions dominate system-design rounds.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

## HTTP & protocols

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| HTTP methods, status codes, headers | 🟢 | 45m | `#http` `#basics` | [MDN: HTTP ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP) |
| HTTP/1.1 vs HTTP/2 | 🟡 | 45m | `#http` `#performance` | [web.dev: HTTP/2 ⭐](https://web.dev/articles/performance-http2) |
| HTTP/3 & QUIC | 🔴 | 45m | `#http` `#performance` | [Cloudflare: HTTP/3 ⭐](https://blog.cloudflare.com/http3-the-past-present-and-future/) |
| TLS / handshake | 🟡 | 45m | `#tls` `#security` | [Cloudflare: TLS handshake ⭐](https://www.cloudflare.com/learning/ssl/what-happens-in-a-tls-handshake/) |
| DNS | 🟢 | 30m | `#dns` `#basics` | [Cloudflare: DNS ⭐](https://www.cloudflare.com/learning/dns/what-is-dns/) |
| Fetch, XHR & request cancellation | 🟢 | 45m | `#fetch` `#api` | [MDN: Fetch ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch) |

## API styles

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| REST API design | 🟡 | 1h | `#rest` `#api` | [MDN: REST ⭐](https://developer.mozilla.org/en-US/docs/Glossary/REST) |
| GraphQL | 🟡 | 1.5h | `#graphql` `#api` | [graphql.org: learn ⭐](https://graphql.org/learn/) |
| gRPC / gRPC-Web | 🔴 | 45m | `#grpc` `#api` | [grpc.io ⭐](https://grpc.io/docs/what-is-grpc/introduction/) |
| Pagination (cursor vs offset) | 🟡 | 45m | `#api` `#large-data` | [Flagship ⭐](../15-system-design/design-news-feed.md) |

## Real-time

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| WebSocket | 🔴 | 1h | `#realtime` `#websocket` | [MDN: WebSocket ⭐](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) |
| Server-Sent Events (SSE) | 🟡 | 45m | `#realtime` `#sse` | [MDN: SSE ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) |
| Polling vs long-polling vs push | 🟡 | 45m | `#realtime` `#patterns` | [Ably: long-polling ⭐](https://ably.com/topic/long-polling) |
| WebRTC (P2P) | 🔴 | 1h | `#realtime` `#webrtc` | [WebRTC ⭐](https://webrtc.org/getting-started/overview) |
| WebTransport | 🔴 | 45m | `#realtime` `#modern` | [web.dev: WebTransport ⭐](https://web.dev/articles/webtransport) |

## Caching, CDN & reliability

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| HTTP caching (Cache-Control, ETag) | 🟡 | 1h | `#caching` | [MDN: HTTP caching ⭐](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching) |
| CDN & edge caching | 🟡 | 45m | `#cdn` `#caching` | [Cloudflare: CDN ⭐](https://www.cloudflare.com/learning/cdn/what-is-a-cdn/) |
| Compression (gzip/brotli) | 🟢 | 30m | `#performance` | [web.dev ⭐](https://web.dev/articles/reduce-network-payloads-using-text-compression) |
| Load balancing (client view) | 🟡 | 45m | `#scale` | [Cloudflare ⭐](https://www.cloudflare.com/learning/performance/what-is-load-balancing/) |
| Rate limiting & retries/backoff | 🟡 | 45m | `#reliability` | [AWS: backoff & jitter ⭐](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/) |
| Idempotency & request dedupe | 🟡 | 45m | `#reliability` | [Stripe: idempotency ⭐](https://docs.stripe.com/api/idempotent_requests) |

## ❓ Rapid-fire networking interview questions

Real networking questions asked at the SDE-2 / senior level. Answer out loud, then verify above.

1. **HTTP/1.1 vs HTTP/2 vs HTTP/3** — what improved?
2. **WebSocket vs SSE vs polling** — when do you use each?
3. How does **HTTP caching** work (`Cache-Control`, `ETag`, `304`)?
4. What is **CORS** and what triggers a **preflight** request?
5. **REST vs GraphQL** — trade-offs?
6. What is a **CDN** and how does it speed things up?
7. What happens during a **TLS handshake**?
8. What are **idempotent** HTTP methods?
9. How do you **cancel an in-flight request** (AbortController)?
10. **Cursor vs offset pagination** — why does it matter?
11. How do you implement **retries with exponential backoff**?
12. What is **DNS** and how does resolution work?
13. What is **gzip/brotli compression**?
14. How does **content negotiation** work?
15. What is **request idempotency** and why does checkout need it?

---

**Related:** [09-performance](../09-performance/) · [13-state-management](../13-state-management/) · [17-interview-patterns](../17-interview-patterns/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
