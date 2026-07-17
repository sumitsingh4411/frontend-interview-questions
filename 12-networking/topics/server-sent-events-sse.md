<div align="center">

# Server-Sent Events (SSE)

<sub>📡 Networking · 🟡 Medium · ⏱ 45m · `#realtime` `#sse`</sub>

<a href="../README.md">⬅ Networking</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — SSE is a **one-way, UTF-8-text stream** over a single HTTP response the server never closes. The browser's built-in `EventSource` parses the wire format, **auto-reconnects**, and **resumes from the last event ID** for you. Reach for it when the server does the talking and the client mostly listens.

---

## 🧠 Mental model

SSE is not a new protocol — that's the whole insight. It's an ordinary `GET` whose response has `Content-Type: text/event-stream` and a **body that never ends**. The server keeps flushing little text frames down the same connection; the client reads them as they arrive.

Everything premium about it lives in one small package: a trivial line-based wire format, plus a native client (`EventSource`) that already knows how to reconnect when the socket drops and how to tell the server "resume from where I was". WebSocket gives you a raw duplex pipe and makes *you* build all of that. SSE hands you the 80% case with ~5 lines.

```
Client ──GET /stream (Accept: text/event-stream)──▶ Server
Client ◀───────────── data: {...}\n\n ─────────────  (kept open,
Client ◀───────────── data: {...}\n\n ─────────────   server pushes
Client ◀───────────── data: {...}\n\n ─────────────   whenever it likes)
```

## ⚙️ How it actually works

**The wire format** is four optional fields, one per line, and a **blank line dispatches the event**:

```
id: 42            ← becomes Last-Event-ID on the next reconnect
event: price      ← named event; defaults to "message"
data: {"usd":93}  ← multiple data: lines are joined with \n
retry: 5000       ← client's reconnect delay, in ms
                  ← blank line = "dispatch now"
```

**Reconnection is the killer feature.** When the connection drops, `EventSource` waits `retry` ms and re-issues the same `GET`, automatically sending a `Last-Event-ID:` header with the last `id:` it saw. If your server honours that header and replays missed events, you get **at-least-once delivery across network blips for free** — no client bookkeeping.

**It rides on HTTP**, which is a double-edged detail. Over **HTTP/2/3 it's multiplexed** — many streams share one connection, no problem. Over **HTTP/1.1 each open SSE stream permanently consumes one of the ~6 connections-per-origin** the browser allows; open six dashboards in six tabs and the seventh tab's normal `fetch`es hang. This is the single most common production surprise.

## 💻 Code

```js
// server (Node/Express) — a stream that never returns
app.get('/prices', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no', // tell nginx NOT to buffer the stream
  });
  const since = req.headers['last-event-id']; // resume support
  const timer = setInterval(() => {
    res.write(`id: ${nextId()}\n`);
    res.write(`event: price\n`);
    res.write(`data: ${JSON.stringify(getPrice())}\n\n`); // blank line!
  }, 1000);
  const beat = setInterval(() => res.write(': ping\n\n'), 15000); // comment = heartbeat
  req.on('close', () => { clearInterval(timer); clearInterval(beat); });
});
```

```js
// client — the browser handles reconnect + Last-Event-ID for you
const es = new EventSource('/prices'); // add { withCredentials: true } for cookies
es.addEventListener('price', (e) => render(JSON.parse(e.data)));
es.onerror = () => {
  // fired on every drop; EventSource is ALREADY retrying. Don't recreate it.
  if (es.readyState === EventSource.CLOSED) reallyGiveUp();
};
```

## ⚖️ Trade-offs

- **Server → client only.** The client still needs a normal `POST`/`fetch` to send anything up. If you need true bidirectional chat with tight latency in both directions, that's WebSocket's job, not SSE's.
- **Text only, no binary.** Ship JSON or base64; you cannot stream raw bytes. For binary or very high-frequency (>100 msg/s) feeds, WebSocket or WebTransport win.
- **The HTTP/1.1 six-connection cap** makes SSE quietly dangerous at scale unless you're on HTTP/2. Confirm your CDN and load balancer terminate h2 to the browser.
- **When NOT to use it:** collaborative editing, gaming, voice — anything where the *client* is a chatty, low-latency sender. SSE's simplicity comes from being one-directional; fighting that is a mistake.

## 💣 Gotchas interviewers probe

- **`EventSource` can't set custom headers.** No `Authorization: Bearer …`. You authenticate with **cookies** (`withCredentials: true`) or a token in the query string, or you drop `EventSource` and stream via `fetch()` + `ReadableStream` yourself. This trips up SPA/JWT setups constantly.
- **Proxies and buffers silently break it.** nginx buffers responses by default, so events arrive in a clump or not at all until the buffer fills. You need `X-Accel-Buffering: no` (or `proxy_buffering off`). A regular heartbeat comment (`: ping\n\n`) also stops idle intermediaries from killing the connection.
- **`onerror` doesn't mean "dead".** It fires on every transient drop while `EventSource` is *already* reconnecting. Recreating the object in `onerror` gives you a reconnect storm.
- **The blank line is load-bearing.** Forget the double `\n` and the event never dispatches — the client waits forever for the terminator.
- **`Last-Event-ID` only resumes if the server implements it.** Out of the box you get reconnect but not replay; missed-during-outage events are simply gone unless you back the stream with a durable log.

## 🎯 Say this in the interview

> "SSE is just a long-lived HTTP response with `Content-Type: text/event-stream` — the server keeps writing tiny `data:` frames and the connection stays open. What makes it worth choosing over rolling my own WebSocket is the native `EventSource` client: it auto-reconnects on drop and re-sends a `Last-Event-ID` header, so if the server replays from that ID I get gap-free delivery across network blips with basically no client code. The constraints are that it's server-to-client only and text-only, so it's perfect for notifications, live feeds, and progress streams, but wrong for chat or gaming. Two things I always check in production: that we're on HTTP/2 so I'm not burning the six-connection-per-origin budget, and that the proxy isn't buffering the stream — plus a periodic heartbeat comment to keep intermediaries from closing an idle connection."

## 🔗 Go deeper

- [MDN — Using server-sent events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events) — the wire format, `EventSource`, and reconnection.
- [WHATWG HTML spec — Server-sent events](https://html.spec.whatwg.org/multipage/server-sent-events.html) — the exact parsing rules and `Last-Event-ID` semantics.
- [MDN — `EventSource`](https://developer.mozilla.org/en-US/docs/Web/API/EventSource) — the client API, `readyState`, and `withCredentials`.
