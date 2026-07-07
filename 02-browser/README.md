# 02 · Browser Internals

How the browser turns bytes into pixels — and why your app is slow. The "explain what happens when…" questions live here.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Browser high-level architecture (multi-process) | 🟡 | 1h | `#internals` | [web.dev: inside look at modern web browser ⭐](https://developer.chrome.com/blog/inside-browser-part1) |
| The rendering pipeline (parse→layout→paint→composite) | 🔴 | 1.5h | `#rendering` `#performance` | [web.dev: how rendering works ⭐](https://developer.chrome.com/blog/inside-browser-part3) |
| HTML parsing & the DOM tree | 🟡 | 45m | `#parsing` `#dom` | [html.spec / MDN: parsing ⭐](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) |
| CSS parsing & the CSSOM | 🟡 | 45m | `#parsing` `#css` | [web.dev: CRP ⭐](https://web.dev/articles/critical-rendering-path-constructing-the-object-model) |
| Render tree, Layout & Reflow | 🔴 | 1h | `#rendering` `#performance` | [web.dev: layout/reflow ⭐](https://developer.chrome.com/docs/devtools/performance/reference) |
| Paint & Layers | 🟡 | 45m | `#rendering` | [web.dev: paint ⭐](https://web.dev/articles/critical-rendering-path-render-blocking-css) |
| Compositing & the compositor thread | 🔴 | 1h | `#rendering` `#performance` | [web.dev: compositing ⭐](https://developer.chrome.com/blog/inside-browser-part3) |
| Rasterization & the GPU | 🔴 | 45m | `#rendering` `#gpu` | [web.dev: GPU/animations ⭐](https://web.dev/articles/animations-guide) |
| Main thread vs compositor thread | 🔴 | 45m | `#performance` `#internals` | [web.dev: main thread ⭐](https://web.dev/articles/optimize-long-tasks) |
| V8 & JS engine internals | 🔴 | 1.5h | `#internals` `#v8` | [V8 blog ⭐](https://v8.dev/blog) |
| Blink rendering engine | 🟡 | 30m | `#internals` | [Chromium: Blink ⭐](https://www.chromium.org/blink/) |
| Event loop (browser) | 🟡 | 1h | `#async` `#internals` | [Jake Archibald: in the loop ⭐](https://www.youtube.com/watch?v=cCOL7MC4Pl0) · [javascript.info](https://javascript.info/event-loop) |
| Microtasks vs macrotasks | 🟡 | 45m | `#async` | [MDN: microtasks ⭐](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) |
| requestAnimationFrame | 🟡 | 30m | `#rendering` `#async` | [MDN: rAF ⭐](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) |
| requestIdleCallback & scheduling | 🟡 | 30m | `#async` `#performance` | [MDN: rIC ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) |
| Memory management | 🔴 | 1h | `#memory` `#internals` | [MDN: memory management ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) |
| Garbage collection | 🔴 | 45m | `#memory` `#v8` | [V8: trash talk / GC ⭐](https://v8.dev/blog/trash-talk) |
| Memory leaks in the browser | 🔴 | 1h | `#memory` `#performance` | [web.dev: fix memory problems ⭐](https://developer.chrome.com/docs/devtools/memory-problems) |
| Web Workers threading model | 🟡 | 45m | `#workers` `#performance` | [MDN: Web Workers ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) |

**Related:** [01-fundamentals](../01-fundamentals/) · [03-javascript](../03-javascript/) · [09-performance](../09-performance/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
