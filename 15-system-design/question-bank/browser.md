<div align="center">

# Browser

<sub>🏗️ Frontend System Design · **20 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">System Design</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

- 🟢 Walk through the full browser rendering pipeline from HTML parsing to pixels on screen.
- 🔴 Design a page-load sequence that minimizes blocking during the rendering pipeline.
- 🟢 Explain the Critical Rendering Path and how render-blocking resources affect it.
- 🔴 Optimize a page with render-blocking CSS and synchronous scripts in the head - what's your plan?
- 🟢 Explain the DOM tree structure and how the browser constructs it from HTML.
- 🔴 Debug a memory leak caused by detached DOM nodes still referenced in JavaScript.
- 🟢 Explain the CSSOM and why CSS is considered render-blocking.
- 🔴 Explain how the browser combines the DOM and CSSOM into the render tree.
- 🟢 Explain the difference between the style, layout, and paint stages.
- 🔴 Debug a page with unexpectedly high style recalculation cost.
- 🟢 Explain what triggers a reflow and why reflows are expensive.
- 🔴 Debug a script that reads offsetHeight in a loop and causes layout thrashing - how do you fix it?
- 🟢 Explain the difference between reflow and repaint, and which CSS properties trigger which.
- 🔴 Design an animation that avoids triggering repaint or reflow using only compositor-friendly properties.
- 🟢 Explain how the browser's compositor thread works independently of the main thread.
- 🔴 Explain why transform and opacity animations are cheaper than animating top/left.
- 🟢 Explain how the browser decides to promote an element to its own compositor layer.
- 🔴 Debug a page with excessive layer count causing memory bloat (layer explosion).
- 🟢 Explain how GPU acceleration works for compositing and when it can hurt performance.
- 🔴 Design a smooth 60fps drag-and-drop interaction leveraging GPU-accelerated properties.

---

_Part of the [🏗️ Frontend System Design question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
