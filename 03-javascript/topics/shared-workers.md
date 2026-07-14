<div align="center">

# Shared Workers

<sub>⚡ JavaScript · 🔴 Hard · ⏱ 45m · `#workers`</sub>

<a href="../README.md">⬅ JavaScript</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A Shared Worker is a **single** worker instance shared by every tab, iframe, and window from the same origin. They connect to it through `MessagePort`s, so it's the natural place for a shared connection or shared state — one WebSocket for the whole app instead of one per tab.

---

## 🧠 Mental model

A dedicated Web Worker belongs to *one* page — close the page, the worker dies, and a second tab gets its own separate copy. A **Shared Worker is a singleton for the origin**: the first page creates it, every subsequent page from the same origin gets a *port to the same instance*. It lives as long as *at least one* page is connected.

That makes it the "shared backroom" for a multi-tab app:

- **One WebSocket** feeding five open tabs, instead of five sockets hammering your server.
- **One source of truth** in memory that all tabs read and write.
- **Cross-tab coordination** — "another tab already has the editor open".

The key difference from a service worker: a service worker intercepts the *network*; a shared worker is a shared *compute + state* thread you talk to explicitly. It does not proxy requests.

## ⚙️ How it actually works

The mechanism is `MessagePort`s and one special event. Unlike a dedicated worker, a shared worker doesn't get `onmessage` directly — it gets a **`connect` event** each time a new page attaches, and the port to *that specific page* arrives in `event.ports[0]`.

```
Tab A ─┐
Tab B ─┼─► one SharedWorker  (each connection = a MessagePort)
Tab C ─┘        fires "connect" per new tab
```

On the page side you must call **`port.start()`** (or assign `port.onmessage`, which starts it implicitly) before messages flow — a notorious silent failure. The worker keeps a list of all connected ports and **fans out** messages by iterating them; there's no built-in broadcast.

Same rules as other workers apply: **no DOM**, separate global scope (`SharedWorkerGlobalScope`), `fetch`/`WebSocket`/`IndexedDB` available, structured-clone message passing. Same-origin only, and — the practical killer — **Chrome/Android and Safari support is limited/absent for years**, which is why many teams reach for alternatives.

## 💻 Code

```js
// page.js — every tab runs this; they all get a port to the SAME worker.
const worker = new SharedWorker(new URL('./shared.js', import.meta.url), { type: 'module' });
worker.port.start();                              // REQUIRED to begin receiving
worker.port.onmessage = (e) => render(e.data);    // (assigning onmessage also starts it)
worker.port.postMessage({ type: 'subscribe' });

// shared.js — one instance for the whole origin.
const ports = new Set();

self.onconnect = (e) => {
  const port = e.ports[0];                         // the port to the tab that just connected
  ports.add(port);
  port.start();

  port.onmessage = (msg) => {
    // fan out to EVERY connected tab — no built-in broadcast, iterate ports.
    for (const p of ports) p.postMessage({ from: 'worker', data: msg.data });
  };
};
// Note: there's no reliable "disconnect" event; stale ports must be cleaned defensively.
```

## ⚖️ Trade-offs

- **Use when tabs must share a live resource:** one real-time socket, a shared cache/store, a single expensive computation consumed by many tabs, or cross-tab presence.
- **When NOT to use it — and this is the honest senior take:** browser support is the dealbreaker. It's absent on Chrome for Android and had a long gap in Safari. For most cross-tab needs, **`BroadcastChannel`** (dead-simple pub/sub between same-origin contexts) or a **service worker** (which *is* broadly supported and can hold shared state + a socket) is the better bet today.
- **Lifecycle is fuzzy.** There's no reliable "tab closed" signal, so you accumulate dead ports and must clean up defensively (heartbeat/ping). Debugging is awkward — DevTools access is clumsier than for dedicated workers.
- **Still no DOM, still structured-clone messaging** — all the dedicated-worker costs, plus coordination complexity.

## 💣 Gotchas interviewers probe

- **`port.start()` is mandatory.** If you use `addEventListener('message', ...)` instead of `onmessage`, you must call `port.start()` explicitly, or messages silently never arrive. The #1 "why is nothing happening" bug.
- **`connect` event, not `message`.** The worker handles new tabs via `onconnect` and grabs `event.ports[0]`; it does not receive `onmessage` at the top level like a dedicated worker.
- **No automatic broadcast.** You maintain the set of ports and fan out yourself. Candidates assume `postMessage` reaches all tabs.
- **Scoped by URL *and* name.** Two `new SharedWorker` calls only share an instance if the script URL (and optional name) match exactly; a different URL spawns a *different* singleton.
- **Support is the real gotcha.** Not knowing it's unavailable on Chrome Android/absent in Safari for years — and that `BroadcastChannel`/service workers are the pragmatic alternatives — reads as no production experience.
- **No clean disconnect signal**, so leaked ports and stale state require your own cleanup.

## 🎯 Say this in the interview

> "A Shared Worker is a singleton per origin — the first tab creates it and every other same-origin tab gets a `MessagePort` to the same instance, and it stays alive while any tab is connected. That makes it ideal for sharing one live resource across tabs, like a single WebSocket feeding every tab instead of one socket each. Mechanically it's different from a dedicated worker: it fires a `connect` event per new tab and you grab the port from `event.ports[0]`, you have to call `port.start()` or messages silently never flow, and there's no built-in broadcast — you keep the set of ports and fan out yourself. The honest caveat I'd give is support: it's absent on Chrome for Android and was missing in Safari for a long time, so in practice I usually reach for `BroadcastChannel` for simple cross-tab messaging, or a service worker when I need shared state plus a shared connection, since those are broadly supported."

## 🔗 Go deeper

- [MDN — SharedWorker](https://developer.mozilla.org/en-US/docs/Web/API/SharedWorker) — the constructor, ports, and the `connect` event.
- [MDN — Using Web Workers (shared section)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) — the `port.start()` requirement and message flow.
- [MDN — BroadcastChannel](https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel_API) — the simpler, better-supported cross-tab alternative worth knowing.
