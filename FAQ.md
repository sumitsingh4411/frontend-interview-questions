# Frontend Interview Questions & Answers (FAQ)

The most **frequently searched** frontend interview questions — the exact ones people type into Google or ask ChatGPT — with short, correct answers and links to go deeper. Great for a quick refresh the night before an interview.

> Looking for full practice sets? See the [Roadmap](ROADMAP.md), [System Design](15-system-design/), [Machine Coding](16-machine-coding/), and [DSA for Frontend](21-dsa-for-frontend/).

**Jump to:** [General](#-general) · [HTML](#-html) · [CSS](#-css) · [JavaScript](#-javascript) · [React](#-react) · [TypeScript](#-typescript) · [Performance](#-performance) · [Security & Networking](#-security--networking) · [System Design](#-system-design--interview) · [AI + Frontend](#-ai--frontend)

---

## 🧭 General

**What is frontend development?**
Building the part of a website or app that users see and interact with — the UI — using HTML, CSS, and JavaScript (often with frameworks like React). See [Fundamentals](01-fundamentals/).

**What's the difference between frontend and backend?**
Frontend runs in the browser (UI, interaction); backend runs on a server (data, business logic, databases). They talk over HTTP APIs.

**What's the difference between a library and a framework?**
A **library** you call (you're in control, e.g. React); a **framework** calls you (it controls the flow, e.g. Angular/Next.js). "Inversion of control" is the key distinction.

**What skills do you need to become a frontend developer?**
HTML, CSS, JavaScript, one framework (React), Git, browser dev tools, accessibility, performance basics, and testing. Follow the [Roadmap](ROADMAP.md).

**How do I prepare for a frontend interview?**
Master fundamentals → practice [machine coding](16-machine-coding/) → learn [system design](15-system-design/) → review [company guides](20-company-guides/). Do timed mocks.

---

## 📄 HTML

**What is semantic HTML?**
HTML that describes meaning (`<header>`, `<nav>`, `<article>`) rather than just appearance (`<div>`). It improves accessibility and SEO. → [Fundamentals](01-fundamentals/)

**What's the difference between `<div>` and `<span>`?**
`<div>` is a block-level container (starts on a new line); `<span>` is inline (flows within text).

**What's the difference between `id` and `class`?**
`id` is unique per page (one element); `class` can be reused on many elements. `id` also has higher CSS specificity.

**What is the difference between `<script>`, `async`, and `defer`?**
Plain `<script>` blocks parsing; `async` downloads in parallel and runs as soon as ready (order not guaranteed); `defer` downloads in parallel and runs after HTML parsing, in order.

**What are `data-*` attributes?**
Custom attributes (`data-id="5"`) to store extra info on elements, readable via `element.dataset`.

---

## 🎨 CSS

**How do you center a div?**
Flexbox: `display:flex; justify-content:center; align-items:center;` on the parent. Or `display:grid; place-items:center;`. → [CSS](05-css/)

**What is the difference between Flexbox and Grid?**
Flexbox is **1-dimensional** (a row *or* a column); Grid is **2-dimensional** (rows *and* columns). Use Flexbox for components, Grid for page layouts.

**What is the CSS box model?**
Every element is a box: content → padding → border → margin. `box-sizing: border-box` makes width include padding and border.

**What's the difference between `em` and `rem`?**
`em` is relative to the **parent's** font size; `rem` is relative to the **root** (`html`) font size. `rem` is more predictable.

**What is CSS specificity?**
The weight that decides which conflicting rule wins: inline > id > class/attribute/pseudo-class > element. → [CSS: specificity](05-css/)

**What's the difference between `position: relative`, `absolute`, `fixed`, and `sticky`?**
`relative` offsets from its normal spot; `absolute` positions relative to the nearest positioned ancestor; `fixed` relative to the viewport; `sticky` toggles between relative and fixed on scroll.

**What is z-index and a stacking context?**
`z-index` controls overlap order, but only within the same **stacking context** — created by things like `position` + `z-index`, `opacity < 1`, or `transform`. → [CSS](05-css/)

**How do you make a website responsive?**
Fluid layouts (%, `fr`, flex/grid), `max-width: 100%` media, media/container queries, and a `<meta name="viewport">` tag. Mobile-first is recommended.

**What's the difference between `display:none`, `visibility:hidden`, and `opacity:0`?**
`display:none` removes it from layout (no space, not clickable); `visibility:hidden` hides it but keeps its space; `opacity:0` is invisible but still takes space and is clickable.

---

## ⚡ JavaScript

**What is a closure in JavaScript?**
A function that "remembers" variables from the scope where it was created, even after that scope has returned. Used for data privacy and factories. → [JavaScript](03-javascript/)

**What is hoisting?**
JS moves declarations to the top of their scope. `var` is hoisted as `undefined`; `let`/`const` are hoisted but unusable until declared (the Temporal Dead Zone).

**What's the difference between `let`, `const`, and `var`?**
`var` is function-scoped and hoisted; `let` and `const` are block-scoped. `const` can't be reassigned (but objects it holds can still mutate).

**What is the event loop?**
The mechanism that lets single-threaded JS handle async: it runs the call stack, then drains all **microtasks** (promises), then one **macrotask** (setTimeout), and repeats. → [Browser](02-browser/)

**What's the difference between `==` and `===`?**
`==` compares with type coercion (`1 == '1'` is true); `===` compares value **and** type (`1 === '1'` is false). Prefer `===`.

**What's the difference between `null` and `undefined`?**
`undefined` means a variable was declared but not assigned; `null` is an intentional "no value" you set yourself.

**What is `this` in JavaScript?**
The object a function is called on — determined at **call time**, not where it's defined. Arrow functions don't have their own `this` (they inherit it).

**What is a Promise?**
An object representing a future value from an async operation — `pending`, then `fulfilled` or `rejected`. Chain with `.then`/`.catch` or use `async/await`. → [Promise flagship](03-javascript/promise-polyfills-and-throttle-debounce.md)

**What is a callback function?**
A function passed to another function to be called later, e.g. in `arr.map(cb)` or after an async task.

**What's the difference between `map` and `forEach`?**
`map` returns a **new array** of results; `forEach` just iterates and returns `undefined`.

**What are debounce and throttle?**
**Debounce** waits until activity stops before running (search boxes); **throttle** runs at most once per interval (scroll handlers). → [Flagship](03-javascript/promise-polyfills-and-throttle-debounce.md)

**What is event bubbling and event delegation?**
Bubbling: an event travels from the target up through its ancestors. Delegation: attach one listener to a parent and handle events from many children via `event.target`.

**What are arrow functions?**
Shorter function syntax that has no own `this`, `arguments`, or `prototype` — great for callbacks, not for object methods.

**What is the spread operator?**
`...` expands an iterable: copy/merge arrays (`[...a, ...b]`) or objects (`{...a, ...b}`), or pass array items as args.

**What's the difference between `call`, `apply`, and `bind`?**
All set `this`. `call(this, a, b)` invokes now with args; `apply(this, [a,b])` invokes now with an array; `bind(this)` returns a new function to call later.

**What is a higher-order function?**
A function that takes a function as an argument or returns one — e.g. `map`, `filter`, `debounce`.

**What is the difference between synchronous and asynchronous code?**
Synchronous runs line-by-line, blocking; asynchronous starts work and continues, handling the result later via callbacks/promises.

**What is the prototype in JavaScript?**
Objects inherit properties from their prototype via the prototype chain — the basis of JS inheritance. → [JavaScript](03-javascript/)

**Predict-the-output questions?**
See the full worked set → [Output-based questions (with answers)](03-javascript/output-based-questions.md).

---

## ⚛️ React

**What is React?**
A JavaScript library for building UIs from reusable components, using a virtual DOM and declarative rendering. → [React](06-react/)

**What is the virtual DOM?**
An in-memory copy of the UI. React diffs the new virtual DOM against the old one (reconciliation) and updates only what changed in the real DOM.

**What's the difference between props and state?**
**Props** are passed in from a parent (read-only); **state** is managed inside a component and can change over time, triggering re-renders.

**What are React hooks?**
Functions that let function components use state and lifecycle features — `useState`, `useEffect`, `useMemo`, etc. → [React hooks](06-react/)

**What is `useState`?**
A hook that adds local state: `const [count, setCount] = useState(0)`. Calling the setter re-renders the component.

**What is `useEffect`?**
A hook for side effects (data fetching, subscriptions) that runs after render; its dependency array controls when it re-runs, and it can return a cleanup function.

**What's the difference between `useMemo` and `useCallback`?**
`useMemo` memoizes a computed **value**; `useCallback` memoizes a **function** identity. Both help avoid unnecessary work/re-renders.

**What is JSX?**
A syntax that lets you write HTML-like markup in JavaScript; it compiles to `React.createElement` calls.

**Why are keys important in React lists?**
Keys give elements a stable identity so React can match items across renders. Using the array index as a key can cause bugs when the list reorders.

**What is prop drilling and how do you avoid it?**
Passing props through many intermediate components. Avoid it with Context, composition, or a state library (Zustand/Redux). → [State management](13-state-management/)

**What is the Context API?**
React's built-in way to share values (theme, user) across the tree without prop drilling — but overusing it can cause extra re-renders.

**What is Redux?**
A predictable state container using a single store, actions, and reducers (unidirectional data flow). Use Redux Toolkit today. → [State management](13-state-management/)

**What's the difference between controlled and uncontrolled components?**
Controlled: React state is the source of truth (`value` + `onChange`). Uncontrolled: the DOM holds the value, read via a ref.

**What's the difference between CSR, SSR, SSG, and ISR?**
CSR renders in the browser; SSR renders per-request on the server; SSG pre-renders at build time; ISR re-generates static pages on a schedule. → [Rendering](01-fundamentals/)

**What is Next.js?**
A React framework adding routing, server-side rendering, API routes, and optimizations out of the box. → [Next.js](07-nextjs/)

**What are functional vs class components?**
Both render UI; function components with hooks are the modern standard (simpler, less boilerplate). Class components use lifecycle methods.

---

## 🟦 TypeScript

**What is TypeScript?**
JavaScript with static types that catch errors at compile time and improve tooling. It compiles to plain JS. → [TypeScript](04-typescript/)

**What's the difference between TypeScript and JavaScript?**
TS adds optional static typing, interfaces, generics, and enums; browsers run only the compiled JS.

**What's the difference between `interface` and `type`?**
Both describe object shapes. `interface` can be extended/merged and is idiomatic for objects; `type` also handles unions, tuples, and mapped types.

**What are generics?**
Type parameters that make code reusable across types while staying type-safe, e.g. `function identity<T>(x: T): T`. → [TypeScript](04-typescript/)

**What's the difference between `any`, `unknown`, and `never`?**
`any` disables type checking; `unknown` is a safe "any" you must narrow before use; `never` represents values that never occur.

---

## 🚀 Performance

**What are Core Web Vitals?**
Google's UX metrics: **LCP** (loading), **CLS** (visual stability), **INP** (responsiveness). → [Performance](09-performance/)

**How do you optimize website performance?**
Code splitting, lazy loading, image optimization, caching, compression, minimizing JS, and virtualizing long lists. → [Performance](09-performance/)

**What is lazy loading?**
Deferring loading of resources (images, routes, components) until they're needed, reducing initial load.

**What is code splitting?**
Breaking a bundle into smaller chunks loaded on demand (e.g. per route) so users download less upfront.

**What is a CDN?**
A Content Delivery Network caches your assets on servers near users for faster delivery. → [Networking](12-networking/)

**What is list virtualization?**
Rendering only the rows visible in the viewport instead of thousands of DOM nodes. → [Virtualized List flagship](06-react/build-a-virtualized-list.md)

---

## 🔐 Security & Networking

**What is CORS?**
Cross-Origin Resource Sharing — a browser security rule that controls which origins can call an API. Fixed with proper server headers. → [Security](10-security/)

**What is XSS?**
Cross-Site Scripting — injecting malicious scripts into a page. Prevent by escaping output, sanitizing input, and using a CSP. → [Security](10-security/)

**What is CSRF?**
Cross-Site Request Forgery — tricking a logged-in user's browser into making unwanted requests. Prevent with tokens and `SameSite` cookies.

**What's the difference between cookies, localStorage, and sessionStorage?**
Cookies are sent to the server and can expire; `localStorage` persists in the browser until cleared; `sessionStorage` lasts only for the tab session. → [Fundamentals](01-fundamentals/)

**What is a REST API?**
An API style using HTTP methods (GET/POST/PUT/DELETE) on resources with URLs, typically returning JSON. → [Networking](12-networking/)

**What is GraphQL?**
A query language where the client requests exactly the data it needs from a single endpoint. → [Networking](12-networking/)

**What is the difference between WebSocket and HTTP?**
HTTP is request/response; WebSocket is a persistent, two-way connection for real-time data. → [Chat flagship](15-system-design/design-chat-whatsapp-web.md)

**What is a PWA?**
A Progressive Web App — a website that's installable, works offline (service workers), and feels app-like.

**What is accessibility (a11y)?**
Making apps usable by everyone, including people using screen readers or keyboards — via semantic HTML, ARIA, and focus management. → [Accessibility](11-accessibility/)

---

## 🏗️ System Design & Interview

**What is frontend system design?**
Designing the architecture of a UI feature/app: requirements, components, data flow, state, caching, performance, and trade-offs. → [System Design](15-system-design/)

**What is a machine coding round?**
Building a working UI component (e.g. autocomplete, carousel) in ~45 minutes, judged on code quality, edge cases, and accessibility. → [Machine Coding](16-machine-coding/)

**How would you design an infinite scroll?**
Cursor-based pagination + an IntersectionObserver to fetch the next page + list virtualization to keep the DOM small. → [News Feed flagship](15-system-design/design-news-feed.md)

**How would you build an autocomplete?**
Debounced input, cancel stale requests (AbortController), cache results, and follow the ARIA combobox pattern. → [Autocomplete flagship](15-system-design/design-autocomplete.md)

**Does frontend need DSA?**
Yes, a focused slice — arrays, strings, hashmaps, recursion, and trees (the DOM is a tree). → [DSA for Frontend](21-dsa-for-frontend/)

---

## 🤖 AI + Frontend

The newest wave of frontend questions — building AI-powered UIs.

**How do you build a chat UI like ChatGPT?**
A message list (virtualized for long chats), an input box, and streaming responses appended token-by-token. Handle loading, errors, and auto-scroll. → [Chat flagship](15-system-design/design-chat-whatsapp-web.md)

**How do you stream AI / LLM responses in the frontend?**
Read the response as a stream — **Server-Sent Events (SSE)** or a `fetch` `ReadableStream` — and append chunks to state as they arrive so text appears progressively. → [Networking](12-networking/)

**How do you integrate an AI API (Claude/OpenAI) in a React app?**
Call the model from a **backend/edge route** (never expose API keys in the browser), stream the response back, and render it in your chat UI. → [Security](10-security/)

**How do you render an AI's markdown response safely?**
Parse the markdown, then **sanitize** the HTML (e.g. DOMPurify) before injecting it to prevent XSS. Never use raw `innerHTML`. → [Security: XSS](10-security/)

**How do you create a typing / streaming text effect?**
Append characters/tokens over time (from the stream, or a timer for a fake effect) and keep the view scrolled to the bottom.

**How do you handle rate limits and tokens in an AI frontend?**
Debounce requests, show optimistic/loading states, handle 429s with backoff, and stream to reduce perceived latency. → [Interview Patterns](17-interview-patterns/)

**What is RAG and how does it affect the frontend?**
Retrieval-Augmented Generation feeds relevant documents to the model. On the frontend you often show sources/citations and a search UI. → [Autocomplete flagship](15-system-design/design-autocomplete.md)

**How do you build an AI-powered autocomplete/search?**
Debounced input, cancel stale requests, stream suggestions, and handle async races — same core as classic [autocomplete](15-system-design/design-autocomplete.md), with an LLM/vector backend.

---

> ❓ **Have a question people search that's missing?** [Add it](CONTRIBUTING.md) — this FAQ grows with the community.

**Explore next:** [Roadmap](ROADMAP.md) · [JavaScript](03-javascript/) · [React](06-react/) · [System Design](15-system-design/) · [DSA for Frontend](21-dsa-for-frontend/)
