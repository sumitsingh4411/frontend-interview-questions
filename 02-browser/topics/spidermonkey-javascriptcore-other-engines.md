<div align="center">

# SpiderMonkey / JavaScriptCore (other engines)

<sub>🌐 Browser · 🟡 Medium · ⏱ 30m · `#internals`</sub>

<a href="../README.md">⬅ Browser</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> ⚡ **TL;DR** — V8 isn't the only game: **SpiderMonkey** (Firefox) and **JavaScriptCore** (Safari) implement the *same* ECMAScript spec with the *same* tiered-JIT shape, but differ in GC timing, tier thresholds, and platform reach — and because **iOS forces every browser onto JavaScriptCore**, "works in Chrome" is never proof it works on iPhone.

---

## 🧠 Mental model

There are three JS engines that matter, all converging on the same architecture because they solve the same problem:

| Engine | Browser | Owner | Notable |
|---|---|---|---|
| **V8** | Chrome/Edge, Node, Deno | Google | Ignition + TurboFan/Maglev; Node's runtime |
| **SpiderMonkey** | Firefox | Mozilla | The *original* JS engine (1995); Warp/IonMonkey |
| **JavaScriptCore (JSC)** | Safari, iOS *everything*, Bun | Apple | LLInt + Baseline + DFG + FTL tiers |

The insight: **they all do the same thing** — interpret first for fast startup, JIT hot code using runtime type feedback, deoptimize on assumption violation. If you understand V8's tiered model, you understand all three; the differences are in *tuning and reach*, not in kind. What actually bites web devs isn't the JIT — it's **which engine your users are on**, because DOM/CSS/API behaviour is tied to the *rendering* engine that ships with each.

## ⚙️ How it actually works

**Same spec, different tier ladders.** Every engine implements ECMAScript (TC39) and passes Test262, so language semantics match. Their pipelines rhyme:

- **V8:** Ignition (interpreter) → Sparkplug → Maglev → TurboFan.
- **SpiderMonkey:** interpreter → Baseline Interpreter → Baseline JIT → **WarpMonkey/Ion** (optimizing).
- **JSC:** **LLInt** (low-level interpreter) → Baseline JIT → **DFG** (mid) → **FTL** (top, built on B3/Air).

They differ in *when* they promote code, how aggressively they inline, and their **garbage collectors** (V8's Orinoco, SpiderMonkey's generational GC, JSC's Riptide) — which is why GC pause characteristics and memory profiles vary between browsers for the identical script.

**The part that actually breaks your app: rendering engines, not JS engines.** JS semantics are highly interoperable; DOM, CSS, and platform APIs are where browsers diverge. And engines are paired:

- V8 ↔ **Blink** (Chrome)
- SpiderMonkey ↔ **Gecko** (Firefox)
- JSC ↔ **WebKit** (Safari)

**The iOS clincher.** Apple's App Store rules historically require every iOS browser to use **WebKit + JavaScriptCore**. "Chrome for iOS" and "Firefox for iOS" are UI shells over Apple's engine. So your Blink/V8 assumptions — a CSS feature, an API, a timing quirk — can silently fail on *every* iPhone regardless of the browser icon. (The EU's DMA is beginning to loosen this, but assume WebKit-on-iOS unless you've verified otherwise.)

## 💻 Code

You don't pick an engine; you *detect capabilities* and test across them.

```js
// ❌ Engine/browser sniffing via userAgent — brittle, lies (esp. iOS Chrome = WebKit).
if (navigator.userAgent.includes('Chrome')) enableFeature(); // WRONG on iPhone

// ✅ Feature detection — asks the engine what it can actually do, engine-agnostic.
if ('structuredClone' in globalThis) useStructuredClone();
if (CSS.supports('selector(:has(*))')) useHas();
if ('scheduler' in globalThis && 'postTask' in scheduler) usePostTask();
```

```js
// Same code, different engine internals you may observe:
// - GC pause timing differs (don't rely on WeakRef/FinalizationRegistry timing anywhere)
// - Optimization thresholds differ (a micro-benchmark "winner" in V8 can lose in JSC)
// - Number/date/locale edge cases: run Test262-covered paths, verify Intl output per engine
```

## ⚖️ Trade-offs

- **Cross-engine testing is non-negotiable for production**, but it's real cost. At minimum, test Blink + WebKit (WebKit ≈ your entire iOS audience). Firefox/Gecko catches spec-correctness bugs the Chromium-monoculture hides.
- **Don't optimize for one engine's JIT.** A hot-path trick tuned to TurboFan may do nothing (or hurt) on DFG/FTL. Write clean, type-stable code and let each engine optimize it.
- **Node/Bun/Deno runtime differences are engine-rooted:** Node & Deno use V8, Bun uses JSC. APIs and perf profiles differ because the engine underneath differs — relevant when a script behaves differently across runtimes.

## 💣 Gotchas interviewers probe

- **"iOS Chrome uses V8" — false.** It's JavaScriptCore + WebKit. The single most impactful cross-engine fact for a frontend dev.
- **JS engine vs rendering engine confusion.** SpiderMonkey is JS; Gecko is rendering. Interop problems are almost always the *rendering* engine (CSS/DOM/API), not the JS engine.
- **SpiderMonkey is the oldest**, written by Brendan Eich at Netscape — a nice signal you know the history, and that "V8 invented JS engines" is wrong.
- **GC-timing-dependent code is a trap across engines.** `WeakRef`/`FinalizationRegistry` callbacks fire on each engine's own schedule; never build correctness on them.
- **Bun runs on JSC, not V8**, so Node code can behave subtly differently there — an increasingly common gotcha.

## 🎯 Say this in the interview

> "There are three engines that matter — V8 in Chrome and Node, SpiderMonkey in Firefox, and JavaScriptCore in Safari. They all implement the same ECMAScript spec and all use the same shape of pipeline: interpret for fast startup, JIT the hot code with runtime type feedback, deoptimize when assumptions break. The differences are tuning — tier thresholds, inlining, and especially garbage collectors — not language semantics, so JS is highly interoperable. What actually breaks apps is the *rendering* engine paired with each: Blink, Gecko, WebKit. The one fact I never forget is that on iOS every browser is forced onto WebKit and JavaScriptCore — so 'Chrome on iPhone' is really Safari's engine, and I have to test WebKit because it's effectively my entire mobile-Safari and iOS audience. That's why I rely on feature detection, never UA sniffing."

## 🔗 Go deeper

- [MDN — JavaScript technologies overview](https://developer.mozilla.org/en-US/docs/Web/JavaScript/JavaScript_technologies_overview) — where engines sit relative to the spec.
- [SpiderMonkey docs](https://spidermonkey.dev/) — Mozilla's engine, including the Warp/Ion pipeline.
- [WebKit — JavaScriptCore](https://webkit.org/blog/category/javascript/) — Apple's engine and its LLInt/DFG/FTL tiers.
