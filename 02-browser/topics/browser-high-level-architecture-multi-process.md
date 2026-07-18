<div align="center">

# Browser high-level architecture (multi-process)

<sub>🌐 Browser · 🟡 Medium · ⏱ 1h · `#internals`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — A modern browser is not one program but a **fleet of sandboxed processes** — a privileged browser process orchestrating renderer processes (one-ish per site), plus GPU, network, and utility processes — so a crash or exploit in one tab can't take down the others or reach into your OS.

---

## 🧠 Mental model

Think of the browser as a **small operating system**, not an app. There's a "kernel" (the browser process, which owns the UI chrome, the address bar, and the actual OS-level privileges) and a set of "user-space" workers it spawns and supervises. The workers do the dangerous stuff — parsing untrusted HTML, running untrusted JS, decoding untrusted images — and they do it in a **sandbox** with almost no direct access to the disk, network, or screen.

The single insight interviewers want: **the code from a random website runs in a process that literally cannot open your files.** When it needs something privileged, it has to *ask* the browser process over IPC, which can say no.

```
┌───────────────────────────── Browser process (privileged) ─────────────────────────────┐
│  UI, address bar, tabs, bookmarks · owns network/storage/permissions · supervises kids  │
└───┬───────────────┬────────────────────┬────────────────────────┬──────────────────────┘
    │ IPC           │ IPC                │ IPC                    │ IPC
┌───▼──────┐  ┌─────▼──────┐      ┌──────▼──────┐         ┌───────▼────────┐
│ Renderer │  │ Renderer   │ ...  │ GPU process │         │ Network / other│
│ (site A) │  │ (site B)   │      │ (compositing│         │ utility procs  │
│ sandboxed│  │ sandboxed  │      │  + raster)  │         │ (audio, etc.)  │
└──────────┘  └────────────┘      └─────────────┘         └────────────────┘
```

## ⚙️ How it actually works

**Why multiple processes at all?** Three reasons, in priority order:

1. **Stability.** A renderer crash (`Aw, Snap!`) kills one tab, not the browser. Pre-Chrome, one bad page froze everything.
2. **Security.** Each renderer is sandboxed — it can't touch the filesystem or make arbitrary network calls; it brokers everything through the browser process. This is the core of defence-in-depth.
3. **Site Isolation.** After Spectre/Meltdown showed that *any* JS could potentially read same-process memory via timing side-channels, Chrome moved to **one renderer process per site** (per eTLD+1, not per tab). Two tabs on the same site may share a renderer; cross-site iframes are hoisted into their *own* process (out-of-process iframes, OOPIF). This means a malicious site's JS and a victim site's data are never in the same address space.

**The cost — and the nuance.** Processes aren't free: each has its own memory (V8 heap, its own copy of Blink). Chrome's answer is adaptive: on **low-memory devices it consolidates** processes (process-per-site-instance relaxes toward a shared model), and it de-duplicates via copy-on-write where the OS allows. So "one process per tab" is a simplification — the real policy is "as much isolation as the device can afford."

**IPC and the trust boundary.** Renderer → browser messages cross a **privilege boundary**, so the browser process treats every message as hostile input and validates it. A compromised renderer that lies over IPC is the classic sandbox-escape attack surface; this is why the browser process is small and audited.

## 💻 Code

You can observe the architecture, not configure it — that's the point.

```js
// Each renderer has its OWN JS heap. This limit is per-process, not per-machine:
console.log(performance.memory?.jsHeapSizeLimit); // Chrome-only, ~2–4GB per renderer

// crossOriginIsolated tells you the page earned a stronger isolation guarantee
// (via COOP+COEP headers) — required to unlock SharedArrayBuffer & high-res timers:
console.log(crossOriginIsolated); // true only with the right headers
```

```
chrome://process-internals   → live map of processes, sites, and isolation
chrome://discards            → which tabs got frozen/discarded under memory pressure
Task Manager (Shift+Esc)     → per-process CPU/memory, one row per renderer/GPU/etc.
```

## ⚖️ Trade-offs

- **Isolation vs memory.** Site Isolation can add 10–13% memory overhead. On desktop that's an easy trade; on a 2GB Android phone it's the reason Chrome collapses processes and aggressively discards background tabs.
- **When *not* to reason about it:** for most app code, the process model is invisible and you shouldn't design around it. It becomes load-bearing only when you hit `SharedArrayBuffer`, cross-origin isolation, iframe performance (OOPIFs have real IPC latency), or you're debugging a whole-tab crash vs a JS exception.
- **Cross-origin iframes are genuinely more expensive now.** An OOPIF means every scroll/resize/hit-test involving it crosses a process boundary. Great for security, a real cost for heavy embedded content.

## 💣 Gotchas interviewers probe

- **"One process per tab" is wrong.** It's roughly **one renderer per *site* (eTLD+1)**, with cross-site iframes split out. Same-site tabs can share; a single tab with cross-site frames can span multiple processes.
- **The renderer cannot access the filesystem or network directly.** It asks the browser process. Candidates who think `fetch` "just opens a socket" from the renderer miss the broker model.
- **Site Isolation exists because of Spectre**, a *hardware* side-channel — software sandboxing alone couldn't prevent same-process memory reads, so the fix was to never co-locate cross-site data.
- **`SharedArrayBuffer` was disabled globally after Spectre** and only comes back when the page is `crossOriginIsolated` (COOP + COEP), because sharing memory across threads reopens the timing-attack surface.
- **The GPU process is shared across tabs**, so a GPU crash can blank *all* tabs at once — the one place where the "isolation" story has a common failure point.

## 🎯 Say this in the interview

> "I think of a browser as a mini-OS. There's a privileged browser process that owns the UI, network, and storage, and it spawns sandboxed renderer processes to do the dangerous work — parsing HTML and running JS from untrusted sites. The renderer can't touch my disk or open sockets directly; it brokers everything through the browser process over IPC, which validates every message across that trust boundary. The model isn't one-process-per-tab — it's roughly one renderer per site, with cross-site iframes pushed into their own processes. That's Site Isolation, and it exists specifically because Spectre showed any JS could read same-process memory via timing, so the fix was to guarantee a malicious site and a victim's data are never in the same address space. The trade-off is memory, which is why on low-end devices Chrome consolidates processes and discards background tabs."

## 🔗 Go deeper

- [Inside look at modern web browser (part 1)](https://developer.chrome.com/blog/inside-browser-part1) — the canonical multi-process overview from the Chrome team.
- [Site Isolation](https://www.chromium.org/Home/chromium-security/site-isolation/) — why per-site processes, and the Spectre motivation.
- [MDN — Browser sandbox & process model](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) — a vendor-neutral framing of the same ideas.
