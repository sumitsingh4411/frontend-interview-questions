# 16 · Machine Coding

"Build this component in 45 minutes." Clean code, correct edge cases, accessibility, and a clear component API — that's what's scored. Start with the ⭐ **flagships**, then drill the categories.

> Difficulty: 🟢 Easy · 🟡 Medium · 🔴 Hard · [⬆ Back to all sections](../README.md)

### ⏱️ How to nail a machine-coding round
- **Clarify** the spec + edge cases first (empty, loading, error, long text, keyboard).
- **Sketch the component API** (props/events) before coding.
- **Build incrementally** — get a working skeleton, then layer features.
- **Handle a11y & keyboard** — it's a differentiator, not optional.
- **Talk while you type**; leave time to test.

📖 Practice platforms: [GreatFrontEnd ⭐](https://www.greatfrontend.com/questions/js) · [BFE.dev](https://bigfrontend.dev/) · [Frontend Interview Handbook](https://www.frontendinterviewhandbook.com/) · [JS Interview by Sadanand](https://github.com/sadanandpai/frontend-mini-challenges)

---

## ⭐ Flagship solutions (fully worked)

| Component | Difficulty | Time | Tags |
|-----------|:----------:|:----:|------|
| [Autocomplete component](autocomplete-component.md) | 🟡 | 45m | `#input` `#async` `#a11y` |
| [Nested Comments (tree)](nested-comments.md) | 🟡 | 45m | `#recursion` `#tree` |
| [Kanban board (drag & drop)](kanban-drag-and-drop.md) | 🔴 | 1h | `#dnd` `#state` |
| [Star Rating widget](star-rating.md) | 🟢 | 30m | `#input` `#a11y` |

---

## ⌨️ Inputs & Forms

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Autocomplete / Typeahead | 🟡 | 45m | [Flagship ⭐](autocomplete-component.md) |
| Star Rating | 🟢 | 30m | [Flagship ⭐](star-rating.md) |
| Date Picker | 🔴 | 1h | [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) |
| Date Range Picker | 🔴 | 1h | [ARIA APG](https://www.w3.org/WAI/ARIA/apg/patterns/) |
| Time Picker | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Multi-select / Tags input | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Combobox / Select with search | 🟡 | 45m | [ARIA combobox](https://www.w3.org/WAI/ARIA/apg/patterns/combobox/) |
| OTP / PIN input | 🟢 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Password strength meter | 🟢 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Form with validation | 🟡 | 45m | [Constraint validation](https://developer.mozilla.org/en-US/docs/Web/HTML/Constraint_validation) |
| Dynamic form (add/remove fields) | 🟡 | 45m | [State](../13-state-management/) |
| Range / Dual slider | 🟡 | 45m | [ARIA slider](https://www.w3.org/WAI/ARIA/apg/patterns/slider/) |
| Color picker | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Toggle / Switch | 🟢 | 20m | [ARIA switch](https://www.w3.org/WAI/ARIA/apg/patterns/switch/) |
| Emoji / Mention picker | 🟡 | 45m | [Autocomplete flagship](autocomplete-component.md) |
| Rich contenteditable input | 🔴 | 1h | [contenteditable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable) |
| Input mask (phone/card) | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |

## 📋 Lists & Data

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Infinite Scroll list | 🟡 | 45m | [System design flagship](../15-system-design/design-news-feed.md) |
| Virtualized List | 🔴 | 1h | [React flagship ⭐](../06-react/build-a-virtualized-list.md) |
| Pagination | 🟢 | 30m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Sortable / filterable Data Grid | 🔴 | 1h | [TanStack Table](https://tanstack.com/table) |
| Editable spreadsheet grid | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Nested Comments (tree) | 🟡 | 45m | [Flagship ⭐](nested-comments.md) |
| Nested Checkboxes (tri-state) | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| File Explorer / Tree View | 🟡 | 45m | [Recursion pattern](nested-comments.md) |
| Transfer list (dual list box) | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Sortable table (multi-column) | 🟡 | 45m | [ARIA table](https://www.w3.org/WAI/ARIA/apg/patterns/table/) |
| Filterable product list | 🟡 | 45m | [Pattern](../17-interview-patterns/) |
| Todo list (CRUD + filters) | 🟢 | 30m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Grouped / sectioned list | 🟢 | 30m | [react.dev](https://react.dev/learn/rendering-lists) |
| Masonry / Pinterest grid | 🔴 | 1h | [Virtualization](../06-react/build-a-virtualized-list.md) |

## 🪟 Overlays & Feedback

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Modal / Dialog | 🟡 | 45m | [ARIA dialog](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) |
| Toast / Snackbar system | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Tooltip | 🟡 | 45m | [ARIA tooltip](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) |
| Popover / Dropdown menu | 🟡 | 45m | [ARIA menu](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) |
| Context menu (right-click) | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Accordion | 🟢 | 30m | [ARIA accordion](https://www.w3.org/WAI/ARIA/apg/patterns/accordion/) |
| Command palette (⌘K) | 🔴 | 1h | [BFE.dev](https://bigfrontend.dev/) |
| Progress bar / Spinner | 🟢 | 20m | [ARIA progressbar](https://www.w3.org/WAI/ARIA/apg/patterns/meter/) |
| Skeleton loader | 🟢 | 20m | [web.dev](https://web.dev/) |
| Confirmation dialog (promise-based) | 🟡 | 45m | [Patterns](../18-design-patterns/) |
| Notification center / inbox | 🟡 | 45m | [Real-time](../17-interview-patterns/) |

## 🧭 Navigation & Layout

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Tabs | 🟢 | 30m | [ARIA tabs](https://www.w3.org/WAI/ARIA/apg/patterns/tabs/) |
| Carousel / Image slider | 🟡 | 45m | [System design flagship](../15-system-design/design-image-carousel.md) |
| Breadcrumbs | 🟢 | 20m | [ARIA breadcrumb](https://www.w3.org/WAI/ARIA/apg/patterns/breadcrumb/) |
| Stepper / Wizard | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Kanban board (drag & drop) | 🔴 | 1h | [Flagship ⭐](kanban-drag-and-drop.md) |
| Drag & Drop reorderable list | 🟡 | 45m | [HTML DnD](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API) |
| Sidebar / collapsible nav | 🟢 | 30m | [ARIA](https://www.w3.org/WAI/ARIA/apg/) |
| Mega menu | 🟡 | 45m | [ARIA menu](https://www.w3.org/WAI/ARIA/apg/patterns/menubar/) |
| Sticky header on scroll | 🟢 | 30m | [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |
| Scroll-spy nav | 🟡 | 45m | [IntersectionObserver](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) |
| Split pane (resizable) | 🟡 | 45m | [Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) |
| Bottom sheet (mobile) | 🟡 | 45m | [Pointer events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) |

## 🎨 Editors, Canvas & Media

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Markdown editor + preview | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Rich text editor (contenteditable) | 🔴 | 1h | [contenteditable](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/contenteditable) |
| Image viewer / lightbox | 🟡 | 45m | [Carousel flagship](../15-system-design/design-image-carousel.md) |
| Image crop / zoom | 🔴 | 1h | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| JSON viewer / tree | 🟡 | 45m | [Recursion pattern](nested-comments.md) |
| Whiteboard / drawing (canvas) | 🔴 | 1.5h | [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API) |
| Spreadsheet (editable grid) | 🔴 | 1.5h | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Video player controls | 🔴 | 1h | [MDN media](https://developer.mozilla.org/en-US/docs/Web/Media) |
| Audio waveform player | 🔴 | 1h | [Web Audio](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API) |
| Gantt chart | 🔴 | 1.5h | [SVG](https://developer.mozilla.org/en-US/docs/Web/SVG) |

## 🕹️ Games & Interactive

| Component | Difficulty | Time | Resource |
|-----------|:----------:|:----:|----------|
| Tic-Tac-Toe | 🟢 | 30m | [react.dev tutorial](https://react.dev/learn/tutorial-tic-tac-toe) |
| Whack-a-mole | 🟢 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Memory / matching game | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Snake | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Connect Four | 🟡 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Minesweeper | 🔴 | 1h | [BFE.dev](https://bigfrontend.dev/) |
| Sudoku | 🔴 | 1h | [BFE.dev](https://bigfrontend.dev/) |
| 2048 | 🔴 | 1h | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Wordle | 🟡 | 45m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Countdown timer / Stopwatch | 🟢 | 30m | [GreatFrontEnd](https://www.greatfrontend.com/questions/js) |
| Pomodoro timer | 🟢 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Traffic light | 🟢 | 20m | [state machine](../17-interview-patterns/) |
| Analog clock | 🟢 | 30m | [BFE.dev](https://bigfrontend.dev/) |

## 🧮 JS Utilities (implement these)

| Utility | Difficulty | Time | Resource |
|---------|:----------:|:----:|----------|
| `debounce` / `throttle` | 🟡 | 30m | [JS flagship ⭐](../03-javascript/promise-polyfills-and-throttle-debounce.md) |
| `Promise.all` / `allSettled` / `race` / `any` | 🟡 | 45m | [JS flagship ⭐](../03-javascript/promise-polyfills-and-throttle-debounce.md) |
| `Array.prototype.map/filter/reduce` polyfills | 🟡 | 30m | [JS section](../03-javascript/) |
| `Function.prototype.call/apply/bind` polyfill | 🟡 | 30m | [MDN bind](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind) |
| `deepClone` | 🟡 | 30m | [structuredClone](https://developer.mozilla.org/en-US/docs/Web/API/Window/structuredClone) |
| `deepEqual` | 🟡 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Event Emitter / pub-sub | 🟡 | 30m | [Patterns flagship ⭐](../18-design-patterns/observer-event-bus.md) |
| `curry` / `pipe` / `compose` | 🟡 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| `retry` with backoff | 🟡 | 30m | [Networking](../12-networking/) |
| `memoize` | 🟡 | 30m | [BFE.dev](https://bigfrontend.dev/) |
| Promise pool / concurrency limiter | 🔴 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| `flatten` nested array | 🟢 | 20m | [MDN flat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) |
| `getIn` / `setIn` (lodash `get`) | 🟢 | 20m | [BFE.dev](https://bigfrontend.dev/) |
| `classNames` (clsx) | 🟢 | 20m | [BFE.dev](https://bigfrontend.dev/) |
| LRU cache | 🔴 | 45m | [BFE.dev](https://bigfrontend.dev/) |
| Virtual DOM diff / `createElement` | 🔴 | 1h | [Build your own](../19-build-your-own/) |
| `useState`/`useEffect` (mini React) | 🔴 | 1h | [Build your own](../19-build-your-own/) |

**Related:** [15-system-design](../15-system-design/) · [11-accessibility](../11-accessibility/) · [14-testing](../14-testing/)

_This list grows with the community — [add a component](../CONTRIBUTING.md) or turn one into a full flagship._
