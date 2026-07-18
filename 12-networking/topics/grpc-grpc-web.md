<div align="center">

# gRPC / gRPC-Web

<sub>📡 Networking · 🔴 Hard · ⏱ 45m · `#grpc` `#api`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — gRPC is a contract-first RPC framework: you define services in Protocol Buffers, generate typed clients/servers, and calls travel as **binary Protobuf over HTTP/2** with first-class streaming. Browsers can't speak raw gRPC (no low-level control over HTTP/2 frames), so the web uses **gRPC-Web** through a proxy — which loses full bidirectional streaming.

---

## 🧠 Mental model

REST and GraphQL are *data-centric* — you think in resources or graphs. gRPC is **method-centric**: you call a function on a remote server as if it were local. `userService.GetUser({ id: 7 })` — it looks like a method call, but it's a network round trip. The contract is a **`.proto` file** that both sides compile into typed code, so the client and server can't drift out of sync.

```protobuf
// user.proto — the single source of truth for BOTH client and server
service UserService {
  rpc GetUser(GetUserRequest) returns (User);            // unary
  rpc ListUsers(ListReq) returns (stream User);          // server streaming
  rpc Chat(stream Msg) returns (stream Msg);             // bidirectional streaming
}
message User { int32 id = 1; string name = 2; }          // field NUMBERS are the contract
```

Two things make gRPC fast and safe: **Protobuf** (a compact *binary* format — no field names on the wire, just tag numbers, so payloads are far smaller than JSON and parse faster) and **HTTP/2** (multiplexing + streaming as a native transport). It's built for **service-to-service** traffic in a microservices backend, where those bytes and that type safety add up.

## ⚙️ How it actually works

**Contract-first codegen.** `protoc` compiles the `.proto` into a client stub and server interface in any supported language. Change the contract, regenerate, and the compiler flags every mismatch — this is gRPC's headline advantage over hand-written REST clients.

**Protobuf wire format.** Fields are encoded by their **number**, not their name (`name = 2` means "field 2"). That's why the numbers are the real contract and must never be reused — it also gives painless backward compatibility: old code simply ignores unknown field numbers, new fields are optional. Binary + no field names ≈ 30–60% smaller than equivalent JSON, and much cheaper to parse.

**Four call types**, all riding HTTP/2 streams: **unary** (1 req → 1 res), **server streaming** (1 → many, e.g. a live feed), **client streaming** (many → 1, e.g. chunked upload), and **bidirectional** (many ↔ many, e.g. chat). Streaming is native because HTTP/2 streams are native — no WebSocket bolt-on needed.

**Why browsers can't do raw gRPC.** gRPC needs precise control over HTTP/2 frames and trailers. The browser `fetch`/XHR APIs don't expose that — you can't read HTTP/2 trailers or manage frames from JS. So **gRPC-Web** defines a browser-compatible framing that works over `fetch`, and a **proxy** (Envoy, or a built-in server filter) translates between gRPC-Web and real gRPC.

**gRPC-Web's limitation:** because it's constrained by browser capabilities, it supports unary and **server streaming**, but **not client streaming or full bidirectional streaming**. If you need the browser to stream *up* continuously, gRPC-Web isn't your tool — WebSocket is.

## 💻 Code

```protobuf
// Reserve retired field numbers so they can never be reused — a real backward-compat trap
message User {
  int32 id = 1;
  string name = 2;
  reserved 3;              // field 3 was 'ssn' — removed; never reuse the NUMBER
  string email = 4;        // new fields are additive & optional
}
```

```ts
// Browser side (gRPC-Web) — generated, typed client. No hand-written fetch/JSON.
import { UserServiceClient } from './gen/user_grpc_web_pb';
const client = new UserServiceClient('https://api.example.com'); // points at the proxy

// unary — works in the browser
const user = await client.getUser({ id: 7 });

// server streaming — works: server pushes many, browser reads
const stream = client.listUsers({ team: 'core' });
stream.on('data', (u) => render(u));
stream.on('end', () => done());

// ❌ client streaming / bidirectional — NOT supported in gRPC-Web.
//    For continuous client→server push from the browser, use a WebSocket.
```

## ⚖️ Trade-offs

- **gRPC dominates internal service-to-service** traffic: binary Protobuf is smaller and faster than JSON, HTTP/2 multiplexes, streaming is native, and codegen kills a whole class of client/server drift bugs. Polyglot backends love the one shared contract.
- **When NOT to use it (browser-facing):** it needs a proxy, the payloads are binary (hard to eyeball in DevTools), there's no HTTP caching, and gRPC-Web can't do full streaming. For a public web API, REST or GraphQL is almost always the right call.
- **Tooling tax.** You need the `protoc` toolchain, generated code checked in or built, and a proxy deployment. That's real setup versus curling a JSON endpoint.
- **Debuggability.** Binary frames mean you can't just read the Network tab — you need gRPC-aware tooling (grpcurl, Buf, reflection). A genuine day-to-day cost.
- **Contract discipline is mandatory.** Reusing or renumbering fields silently corrupts data across versions.

## 💣 Gotchas interviewers probe

- **"Why can't the browser use gRPC directly?"** Because gRPC needs low-level HTTP/2 frame and trailer control the browser doesn't expose to JS. Hence gRPC-Web + a translating proxy. This is *the* question.
- **gRPC-Web ≠ gRPC.** It drops client streaming and bidirectional streaming — only unary and server streaming survive in the browser.
- **Protobuf field numbers are the contract, not names.** Reusing a number after removing a field corrupts data; `reserved` prevents it. Renaming a field is *free* (names aren't on the wire); renumbering is catastrophic.
- **No HTTP caching.** Like GraphQL, it's opaque POST-style traffic — CDNs and browser caches don't help.
- **HTTP/2 required.** gRPC is defined over HTTP/2; that's non-negotiable, and part of why it needs the proxy for browsers.
- **Binary means observability tooling changes** — no eyeballing JSON in the Network tab.

## 🎯 Say this in the interview

> "gRPC is method-centric RPC: you define services in a `.proto` file, generate typed clients and servers, and calls go as binary Protobuf over HTTP/2. The wins are that Protobuf is compact — fields are encoded by number, not name, so it's much smaller and faster to parse than JSON — HTTP/2 gives native multiplexing and streaming, and codegen eliminates client/server drift. It's built for service-to-service traffic. The browser catch is important: gRPC needs low-level control of HTTP/2 frames and trailers that `fetch` doesn't expose, so browsers use gRPC-Web through a proxy like Envoy, and gRPC-Web only supports unary and server streaming — no client or bidirectional streaming, for which I'd use a WebSocket. So for internal microservices I reach for gRPC, but for a browser-facing public API I'd default to REST or GraphQL, because gRPC-Web needs a proxy, has no HTTP caching, and its binary frames are harder to debug."

## 🔗 Go deeper

- [grpc.io — Introduction to gRPC](https://grpc.io/docs/what-is-grpc/introduction/) — the official concepts and the four call types.
- [grpc.io — Core concepts](https://grpc.io/docs/what-is-grpc/core-concepts/) — streaming semantics and RPC lifecycle.
- [Protocol Buffers — Encoding](https://protobuf.dev/programming-guides/encoding/) — why field numbers matter and how the wire format is so compact.
- [gRPC-Web — GitHub](https://github.com/grpc/grpc-web) — the browser story and the proxy requirement, with limitations spelled out.
