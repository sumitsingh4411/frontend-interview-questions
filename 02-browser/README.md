# 02 · Browser Internals

How the browser turns bytes into pixels — and why your app is slow. The "explain what happens when…" questions live here.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

## Architecture & engines

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Browser high-level architecture (multi-process) | 🟡 | 1h | `#internals` | [Inside a modern browser (part 1) ⭐](https://developer.chrome.com/blog/inside-browser-part1) |
| Process/thread model (renderer, GPU, network) | 🟡 | 45m | `#internals` | [Inside a modern browser (part 2) ⭐](https://developer.chrome.com/blog/inside-browser-part2) |
| Blink rendering engine | 🟡 | 30m | `#internals` | [Chromium: Blink ⭐](https://www.chromium.org/blink/) |
| V8 & JIT compilation | 🔴 | 1.5h | `#internals` `#v8` | [V8 blog ⭐](https://v8.dev/blog) |
| SpiderMonkey / JavaScriptCore (other engines) | 🟡 | 30m | `#internals` | [MDN: JS engines ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/JavaScript_technologies_overview) |
| Hidden classes & inline caches | 🔴 | 1h | `#v8` `#performance` | [V8: hidden classes ⭐](https://v8.dev/docs/hidden-classes) |

## The rendering pipeline

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Critical rendering path (overview) | 🔴 | 1.5h | `#rendering` | [web.dev: CRP ⭐](https://web.dev/articles/critical-rendering-path) |
| HTML parsing & the DOM tree | 🟡 | 45m | `#parsing` `#dom` | [MDN: how browsers work ⭐](https://developer.mozilla.org/en-US/docs/Web/Performance/How_browsers_work) |
| CSS parsing & the CSSOM | 🟡 | 45m | `#parsing` `#css` | [web.dev: CSSOM ⭐](https://web.dev/articles/critical-rendering-path-constructing-the-object-model) |
| Render tree, Layout & Reflow | 🔴 | 1h | `#rendering` `#performance` | [Inside a modern browser (part 3) ⭐](https://developer.chrome.com/blog/inside-browser-part3) |
| Paint & layers | 🟡 | 45m | `#rendering` | [web.dev: rendering perf ⭐](https://web.dev/articles/rendering-performance) |
| Compositing & the compositor thread | 🔴 | 1h | `#rendering` `#performance` | [Inside a modern browser (part 3) ⭐](https://developer.chrome.com/blog/inside-browser-part3) |
| Rasterization & the GPU | 🔴 | 45m | `#rendering` `#gpu` | [web.dev: animations guide ⭐](https://web.dev/articles/animations-guide) |
| Main thread vs compositor thread | 🔴 | 45m | `#performance` | [web.dev: long tasks ⭐](https://web.dev/articles/optimize-long-tasks) |
| Render-blocking resources | 🟡 | 45m | `#rendering` `#performance` | [web.dev ⭐](https://web.dev/articles/critical-rendering-path-render-blocking-css) |

## Event loop & scheduling

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Event loop (browser) | 🟡 | 1h | `#async` `#internals` | [Jake Archibald: in the loop ⭐](https://www.youtube.com/watch?v=cCOL7MC4Pl0) |
| Microtasks vs macrotasks | 🟡 | 45m | `#async` | [MDN: microtasks ⭐](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide) |
| `requestAnimationFrame` | 🟡 | 30m | `#rendering` `#async` | [MDN: rAF ⭐](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) |
| `requestIdleCallback` & scheduling | 🟡 | 30m | `#async` `#performance` | [MDN: rIC ⭐](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) |
| `scheduler.postTask` / yielding | 🔴 | 45m | `#async` `#modern` | [web.dev: optimize long tasks ⭐](https://web.dev/articles/optimize-long-tasks) |

## Memory & storage

| Topic | Difficulty | Time | Tags | Best Resources |
|-------|:----------:|:----:|------|----------------|
| Memory management | 🔴 | 1h | `#memory` | [MDN: memory management ⭐](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Memory_management) |
| Garbage collection (mark & sweep) | 🔴 | 45m | `#memory` `#v8` | [V8: trash talk ⭐](https://v8.dev/blog/trash-talk) |
| Memory leaks & detection | 🔴 | 1h | `#memory` `#performance` | [Chrome DevTools: memory ⭐](https://developer.chrome.com/docs/devtools/memory-problems) |
| Storage internals (cache/quota) | 🟡 | 45m | `#storage` | [web.dev: storage ⭐](https://web.dev/articles/storage-for-the-web) |

**Related:** [01-fundamentals](../01-fundamentals/) · [03-javascript](../03-javascript/) · [09-performance](../09-performance/)

_Missing something? [Add a row](../CONTRIBUTING.md)._
