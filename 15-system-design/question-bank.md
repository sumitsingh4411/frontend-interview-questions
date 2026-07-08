<div align="center">

# 🏗️ Frontend System Design — Full Question Bank

**353 questions**, curated from real interview prep sheets. Prompts only — work the answers using the linked sections.

<a href="README.md">⬅ Back to System Design</a> &nbsp;·&nbsp; <a href="../README.md">Home</a>

</div>

Scenario and design questions by area. Learn the shape from the [flagship solutions](README.md#-flagship-solutions-fully-worked) first.

> 🟢 Easy · 🟡 Medium · 🔴 Hard. This is the exhaustive bank; the section [README](README.md) has the curated highlights with resources.

**Jump to:** [Rendering](#rendering) · [React](#react) · [Next.js](#next-js) · [JavaScript](#javascript) · [Browser](#browser) · [Performance](#performance) · [Caching](#caching) · [API](#api) · [Security](#security) · [Accessibility](#accessibility) · [CSS](#css) · [State Management](#state-management) · [Frontend Architecture](#frontend-architecture) · [Testing](#testing) · [Monitoring](#monitoring) · [SEO](#seo) · [Core Web Vitals](#core-web-vitals) · [Offline](#offline) · [System Design](#system-design)

---

### Rendering  
<sub>22 questions</sub>

- 🟡 What is Client-Side Rendering and when should you avoid it for a content-heavy marketing site?
- 🔴 Design a CSR architecture for an internal analytics dashboard with 50k rows of data - what are the tradeoffs vs SSR?
- 🟡 Explain how Server-Side Rendering works end-to-end from request to hydrated DOM.
- 🔴 Your SSR page has a 3s TTFB under load. Walk through how you would diagnose and fix it.
- 🟡 When would you choose Static Site Generation over SSR for a 10,000-page e-commerce catalog?
- 🔴 Design a build pipeline for SSG that scales to 100k pages without exceeding build-time budgets.
- 🟡 Explain Incremental Static Regeneration and how stale-while-revalidate applies to it.
- 🔴 Design an ISR strategy for a news site where articles update every few minutes but traffic spikes unpredictably.
- 🟡 How does streaming SSR with React 18 differ from traditional SSR in terms of TTFB and FCP?
- 🔴 Design a streaming SSR architecture for a page with a slow third-party data dependency in the middle of the layout.
- 🟡 Explain the difference between Server Components and traditional SSR.
- 🔴 Design a component boundary strategy mixing Server and Client Components for a dashboard with interactive charts.
- 🟡 Explain what hydration is and why hydration mismatches occur.
- 🔴 Debug a production hydration mismatch caused by locale-dependent date formatting - how do you fix it?
- 🟡 What is Partial Hydration and how does it reduce JavaScript payload compared to full hydration?
- 🔴 Design a partial hydration strategy for a content page with one interactive comment widget.
- 🟡 Explain Progressive Hydration and how it differs from Partial Hydration.
- 🔴 Design a progressive hydration priority order for an e-commerce product page (header, cart, reviews, recommendations).
- 🟡 Explain Islands Architecture and how frameworks like Astro implement it.
- 🔴 Would you migrate a marketing site from a React SPA to Islands Architecture? Justify the tradeoffs.
- 🟡 Explain Edge Rendering and how it differs from traditional origin-server SSR.
- 🔴 Design an edge rendering strategy for a personalized homepage that varies by geolocation with sub-100ms TTFB.

### React  
<sub>30 questions</sub>

- 🟡 Explain React's overall architecture: reconciler, renderer, and scheduler.
- 🔴 Design the component architecture for a large-scale design system used across 20 product teams.
- 🟡 Explain the React Fiber architecture and why it replaced the old stack reconciler.
- 🔴 Walk through how Fiber enables interruptible rendering - what data structure powers it?
- 🟡 Explain how React's Scheduler prioritizes work using lanes.
- 🔴 Debug a scenario where a low-priority update is starving high-priority user input updates.
- 🟡 Explain Concurrent Rendering and how it differs from the legacy synchronous rendering mode.
- 🔴 Design a UI that uses useTransition to keep a search input responsive while filtering 10,000 items.
- 🟡 Explain how Suspense works for data fetching versus code splitting.
- 🔴 Design a Suspense-based loading strategy for a page with three independent, differently-latent data sources.
- 🟡 Explain how Error Boundaries work and their limitations (e.g., event handlers, async code).
- 🔴 Design an error boundary strategy for a dashboard with multiple independent widgets so one failure doesn't crash the page.
- 🟡 Explain how React hooks maintain state between renders internally (the linked-list model).
- 🔴 Why must hooks be called in the same order every render? Explain with an internals-level answer.
- 🟡 Explain React's reconciliation algorithm and the role of keys in list rendering.
- 🔴 Debug a performance issue caused by using array index as key in a reorderable list.
- 🟡 Walk through the full rendering lifecycle from state update to committed DOM change.
- 🔴 Explain the difference between the render phase and commit phase, and why render must be pure.
- 🟡 When should state live in a component versus be lifted versus go into a global store?
- 🔴 Design the state architecture for a multi-step checkout form with client and server validation.
- 🟡 Explain how React.memo works and when it can make performance worse.
- 🔴 Debug a component tree where React.memo isn't preventing re-renders as expected.
- 🟡 Explain when useMemo actually improves performance versus adding overhead.
- 🔴 Design a memoization strategy for an expensive derived data table with 50k rows.
- 🟡 Explain how useCallback interacts with React.memo and when it's necessary.
- 🔴 Debug a case where useCallback is used everywhere but the app is still slow - what's the likely mistake?
- 🟡 Explain what the React Compiler (React Forget) automates and how it changes the need for manual memoization.
- 🔴 What tradeoffs should a team weigh before adopting the React Compiler in a large legacy codebase?
- 🟡 Explain how Server Components serialize data to the client and the constraints this places on props.
- 🔴 Design a data-fetching strategy using Server Components that avoids waterfalls across nested components.

### Next.js  
<sub>20 questions</sub>

- 🟡 Explain the App Router's file-based conventions and how nested layouts compose.
- 🔴 Migrate a large Pages Router app to App Router - what's your phased strategy?
- 🟡 Explain getStaticProps vs getServerSideProps vs getInitialProps.
- 🔴 Why might a team stay on Pages Router instead of migrating to App Router?
- 🟡 Explain how dynamic and catch-all routes work in Next.js.
- 🔴 Design the routing structure for a multi-tenant SaaS app with custom domains per tenant.
- 🟡 Explain the Metadata API and how it differs from manually managing head tags.
- 🔴 Design dynamic metadata generation for a product page pulling from a CMS.
- 🟡 Explain how nested layouts avoid re-rendering shared UI on navigation.
- 🔴 Design a layout structure for an app with a persistent sidebar and independently loading content panes.
- 🟡 Explain Next.js Middleware and its execution constraints under the Edge runtime.
- 🔴 Design an authentication and A/B testing strategy using Middleware.
- 🟡 Explain how Server Actions work and their security implications.
- 🔴 Design a form submission flow using Server Actions with optimistic UI updates.
- 🟡 Explain the four caching layers in the Next.js App Router: request memoization, data cache, full route cache, router cache.
- 🔴 Debug a page that's serving stale data despite calling revalidatePath.
- 🟡 Explain the difference between time-based and on-demand revalidation.
- 🔴 Design a revalidation strategy for a live sports score page updated every 10 seconds.
- 🟡 Explain how next/image optimizes images and handles responsive sizing.
- 🔴 Debug a Largest Contentful Paint regression caused by a misconfigured next/image priority prop.

### JavaScript  
<sub>20 questions</sub>

- 🟢 Explain the JavaScript event loop, including microtasks vs macrotasks.
- 🔴 Predict the output order of a script mixing setTimeout, Promise.then, and synchronous code.
- 🟢 Explain closures with a practical example of a private counter.
- 🔴 Debug a classic closure-in-loop bug using var inside a setTimeout.
- 🟢 Explain the prototype chain and how it differs from classical inheritance.
- 🔴 Explain how Object.create and class syntax relate to prototypal inheritance under the hood.
- 🟢 Explain how Promises work internally, including states and the microtask queue.
- 🔴 Design error handling for a chain of dependent Promise.all calls where one branch is optional.
- 🟢 Explain how async/await desugars to Promises and generators.
- 🔴 Debug a case where awaiting inside a forEach loop doesn't work as expected.
- 🟢 Explain how the JavaScript engine allocates and manages memory.
- 🔴 Debug a growing heap size in a long-running SPA - what tools and steps do you use?
- 🟢 Explain the mark-and-sweep garbage collection algorithm.
- 🔴 Explain common causes of memory leaks in React apps (event listeners, closures, detached DOM nodes).
- 🟢 Explain WeakMap and why it helps prevent memory leaks compared to Map.
- 🔴 Design a caching layer using WeakMap keyed by DOM elements.
- 🟢 Explain WeakSet and a practical use case for tracking object state without leaks.
- 🔴 When would you choose WeakSet over a regular Set for tracking visited nodes?
- 🟢 Explain event delegation and why it's more performant for large lists.
- 🔴 Design an event delegation strategy for a virtualized list with 10,000 rows.

### Browser  
<sub>20 questions</sub>

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

### Performance  
<sub>24 questions</sub>

- 🟡 Explain route-based vs component-based code splitting.
- 🔴 Design a bundle-splitting strategy for a large app to keep the initial JS payload under 150KB.
- 🟡 Explain lazy loading for components, images, and routes.
- 🔴 Design a lazy-loading strategy for a below-the-fold, image-heavy product gallery.
- 🟡 Explain how tree shaking works and what prevents it (e.g., side effects, CommonJS).
- 🔴 Debug a bundle where tree shaking isn't eliminating unused exports from a third-party library.
- 🟡 Explain list virtualization and how libraries like react-window implement it.
- 🔴 Design a virtualized grid for a spreadsheet-like UI with both row and column virtualization.
- 🟡 Explain responsive images using srcset and sizes.
- 🔴 Design an image-loading strategy for a Pinterest-style masonry grid balancing LCP and bandwidth.
- 🟡 Explain font-display strategies and their impact on CLS and FOIT/FOUT.
- 🔴 Design a web font loading strategy for a page using three custom font weights.
- 🟡 Explain how a CDN reduces latency and improves TTFB.
- 🔴 Design a CDN caching strategy for a mix of static assets and personalized API responses.
- 🟡 Explain the tradeoffs between compression ratio and CPU cost for text assets.
- 🔴 Design a compression strategy for a server serving both static assets and dynamic JSON APIs.
- 🟡 Explain HTTP/2 multiplexing and how it changes bundling strategy compared to HTTP/1.1.
- 🔴 Should you still bundle aggressively under HTTP/2? Justify your answer.
- 🟡 Explain how HTTP/3 and QUIC improve on HTTP/2, particularly around head-of-line blocking.
- 🔴 What migration considerations exist when adopting HTTP/3 for a global user base?
- 🟡 Explain how Brotli compression compares to Gzip in ratio and compatibility.
- 🔴 When would you choose Brotli over Gzip, and what's your fallback strategy for unsupported clients?
- 🟡 Explain how Gzip compression works at a high level.
- 🔴 Debug a server misconfiguration where Gzip isn't being applied to JS/CSS responses.

### Caching  
<sub>16 questions</sub>

- 🟡 Explain Cache-Control headers and the difference between max-age, no-cache, and no-store.
- 🔴 Design an HTTP caching strategy for a mix of static assets, API responses, and user-specific data.
- 🟡 Explain how the browser's HTTP cache decides between using a cached response and revalidating.
- 🔴 Debug a scenario where users see stale content after a deploy despite correct cache headers.
- 🟡 Explain in-memory caching tradeoffs: speed vs persistence vs memory pressure.
- 🔴 Design an in-memory LRU cache for API responses in a single-page app.
- 🟡 Explain how browsers use disk cache versus memory cache for different resource types.
- 🔴 Explain the tradeoffs of Service Worker cache storage compared to the browser's native HTTP cache.
- 🟡 Explain cache keys and how query parameters affect CDN cache hit rates.
- 🔴 Design a CDN cache invalidation strategy for a news site publishing breaking updates.
- 🟡 Explain how TanStack Query's stale-while-revalidate caching model works.
- 🔴 Design a React Query caching strategy for a paginated list with optimistic mutations.
- 🟡 Explain the SWR (stale-while-revalidate) pattern and how the SWR library implements it.
- 🔴 Compare SWR and React Query for a dashboard with frequent background refetching.
- 🟡 Explain strategies for cache invalidation and why it's considered a hard problem.
- 🔴 Design a cache invalidation flow across CDN, server, and client caches after a content update.

### API  
<sub>14 questions</sub>

- 🟡 Explain REST constraints and common anti-patterns in REST API design.
- 🔴 Design a REST API for a paginated, filterable product catalog.
- 🟡 Explain how GraphQL solves over-fetching and under-fetching compared to REST.
- 🔴 Design a GraphQL schema and resolver strategy for a nested comments feature, avoiding the N+1 problem.
- 🟡 Explain gRPC and when it's a better fit than REST or GraphQL for frontend-backend communication.
- 🔴 What are the tradeoffs of using gRPC-Web in a browser-based frontend?
- 🟡 Explain how WebSocket connections work and their tradeoffs versus HTTP polling.
- 🔴 Design a real-time notification system using WebSockets with reconnection and backoff handling.
- 🟡 Explain Server-Sent Events and when they're preferable to WebSockets.
- 🔴 Design a live-updating dashboard using SSE for one-directional data streams.
- 🟡 Explain short polling and its tradeoffs for real-time-ish features.
- 🔴 Design a polling strategy for a job-status page that balances freshness and server load.
- 🟡 Explain long polling and how it differs from short polling and WebSockets.
- 🔴 Compare long polling, SSE, and WebSockets for a chat application - which would you choose and why?

### Security  
<sub>18 questions</sub>

- 🟡 Explain the difference between stored, reflected, and DOM-based XSS.
- 🔴 Design safeguards to prevent XSS in a rich text editor that renders user-generated HTML.
- 🟡 Explain how CSRF attacks work and how tokens prevent them.
- 🔴 Design CSRF protection for a SPA that uses cookie-based authentication.
- 🟡 Explain Content Security Policy and how it mitigates XSS.
- 🔴 Design a CSP for an app that uses inline scripts from a third-party analytics tool.
- 🟡 Explain how CORS preflight requests work.
- 🔴 Debug a CORS error where credentials aren't being sent despite a correct Access-Control-Allow-Origin.
- 🟡 Explain how JWTs work and their tradeoffs versus server-side sessions.
- 🔴 Design a token refresh strategy for a SPA using short-lived JWTs and refresh tokens.
- 🟡 Explain the OAuth 2.0 Authorization Code flow with PKCE for a frontend app.
- 🔴 Design a login flow for a SPA integrating with a third-party OAuth provider.
- 🟡 Explain the HttpOnly, Secure, and SameSite cookie attributes.
- 🔴 Design an authentication cookie strategy resistant to XSS and CSRF.
- 🟡 Explain the difference between SameSite=Strict, Lax, and None.
- 🔴 Debug a third-party embedded widget that stopped working after browsers changed default SameSite behavior.
- 🟡 Explain clickjacking and how X-Frame-Options or CSP frame-ancestors prevent it.
- 🔴 Design frame-busting protections for a payment confirmation page.

### Accessibility  
<sub>10 questions</sub>

- 🟢 Explain the WCAG POUR principles with examples.
- 🔴 Audit a modal component against WCAG 2.1 AA - what issues would you look for?
- 🟢 Explain when to use ARIA roles versus native HTML semantics.
- 🔴 Design accessible markup for a custom dropdown/combobox component using ARIA.
- 🟢 Explain how to implement roving tabindex for a toolbar component.
- 🔴 Design keyboard navigation for a drag-and-drop Kanban board.
- 🟢 Explain how screen readers interpret live regions (aria-live).
- 🔴 Design accessible loading and error states for an async form so screen reader users get proper feedback.
- 🟢 Explain focus trapping and why it matters for modals.
- 🔴 Design focus management for a single-page app's client-side route transitions.

### CSS  
<sub>18 questions</sub>

- 🟢 Explain how you'd structure CSS architecture for a large multi-team codebase to avoid specificity wars.
- 🔴 Design a design-token-driven CSS architecture for a component library.
- 🟢 Explain the tradeoffs of utility-first CSS (Tailwind) versus traditional CSS methodologies.
- 🔴 Design a strategy for enforcing design consistency in a large codebase using Tailwind.
- 🟢 Explain how CSS Modules achieve local scoping and avoid class name collisions.
- 🔴 Compare CSS Modules and CSS-in-JS for a component library shipped to external consumers.
- 🟢 Explain the runtime performance tradeoffs of CSS-in-JS libraries versus static CSS.
- 🔴 Design a strategy to migrate a CSS-in-JS codebase to zero-runtime CSS for better performance.
- 🟢 Explain the BEM naming convention and the problems it solves.
- 🔴 When does BEM become insufficient, and what would you adopt instead at scale?
- 🟢 Explain mobile-first responsive design and its performance benefits.
- 🔴 Design a responsive layout strategy for a dashboard with data tables that must work on mobile.
- 🟢 Explain the difference between flex-grow, flex-shrink, and flex-basis.
- 🔴 Debug a Flexbox layout where items aren't wrapping as expected.
- 🟢 Explain CSS Grid's implicit vs explicit grid and when to use grid-template-areas.
- 🔴 Design a complex dashboard layout using CSS Grid with responsive breakpoints.
- 🟢 Explain container queries and how they solve problems media queries can't.
- 🔴 Design a reusable card component that adapts its layout using container queries instead of viewport queries.

### State Management  
<sub>12 questions</sub>

- 🟡 Explain Redux's core principles and how middleware like thunk/saga fit in.
- 🔴 Design a Redux store structure for a large e-commerce app with normalized entities.
- 🟡 Explain how Zustand achieves state management without providers or reducer boilerplate.
- 🔴 Compare Zustand and Redux Toolkit for a mid-sized app - which would you pick and why?
- 🟡 Explain atomic state management in Jotai and how it differs from a single global store.
- 🔴 Design a Jotai-based state architecture for a form with deeply interdependent fields.
- 🟡 Explain how MobX's reactivity model differs from Redux's explicit dispatch model.
- 🔴 What are the tradeoffs of MobX's implicit reactivity in a large team codebase?
- 🟡 Explain the performance pitfalls of React Context for frequently-changing state.
- 🔴 Design a Context-based theming system that avoids unnecessary re-renders.
- 🟡 Explain how signals (as in Preact Signals/SolidJS) achieve fine-grained reactivity.
- 🔴 Compare signals-based reactivity to React's re-render model - what problems do signals solve?

### Frontend Architecture  
<sub>14 questions</sub>

- 🟡 Explain the tradeoffs of micro frontends versus a single monolithic SPA.
- 🔴 Design a micro frontend architecture for a large e-commerce site with independently deployable teams.
- 🟡 Explain how Webpack Module Federation enables runtime code sharing between apps.
- 🔴 Design a shared-dependency strategy using Module Federation to avoid duplicate React instances.
- 🟡 Explain how to version and roll out breaking changes in a company-wide design system.
- 🔴 Design the architecture of a design system supporting both web and React Native consumers.
- 🟡 Explain how to design a component library API for extensibility (compound components, render props, slots).
- 🔴 Design an accessible, themeable Button component API for a public component library.
- 🟡 Explain the benefits and challenges of a monorepo for frontend teams.
- 🔴 Design a monorepo structure and CI strategy for 10 frontend apps sharing common packages.
- 🟡 Explain how Nx's dependency graph and caching speed up CI in a monorepo.
- 🔴 Design an Nx workspace structure for a monorepo with 5 apps and 15 shared libraries.
- 🟡 Explain how Turborepo's remote caching reduces CI build times.
- 🔴 Compare Nx and Turborepo for a growing monorepo - what factors would drive your choice?

### Testing  
<sub>14 questions</sub>

- 🟡 Explain what makes a good unit test for a React component versus testing implementation details.
- 🔴 Design a unit testing strategy for a custom hook with complex async logic.
- 🟡 Explain the difference between integration and unit tests in a frontend context.
- 🔴 Design an integration test suite for a multi-step checkout flow.
- 🟡 Explain the tradeoffs of E2E tests: coverage vs speed vs flakiness.
- 🔴 Design an E2E testing strategy for a CI pipeline to minimize flaky test failures.
- 🟡 Explain RTL's philosophy of testing behavior over implementation.
- 🔴 Debug a flaky RTL test involving async data fetching and act() warnings.
- 🟡 Explain how Playwright's auto-waiting reduces flakiness compared to older tools.
- 🔴 Design a Playwright test suite covering cross-browser regression for a critical checkout flow.
- 🟡 Explain Cypress's architecture and its historical limitations with multi-tab/multi-origin testing.
- 🔴 Compare Cypress and Playwright for a large frontend team choosing an E2E framework.
- 🟡 Explain how Jest's module mocking and snapshot testing work.
- 🔴 Design a testing strategy using Jest for a utility library with 200+ pure functions.

### Monitoring  
<sub>12 questions</sub>

- 🟡 Explain best practices for structured client-side logging without leaking sensitive data.
- 🔴 Design a client-side logging pipeline that batches and reliably delivers logs even on page unload.
- 🟡 Explain the tradeoffs between client-side and server-side analytics tracking.
- 🔴 Design an analytics instrumentation plan for a checkout funnel to identify drop-off points.
- 🟡 Explain how source maps enable readable stack traces for minified production errors.
- 🔴 Design an error-tracking strategy that groups related errors and reduces alert noise.
- 🟡 Explain Real User Monitoring (RUM) versus synthetic monitoring.
- 🔴 Design a performance monitoring dashboard tracking Core Web Vitals across a multi-region user base.
- 🟡 Explain how Sentry's error grouping and release tracking work.
- 🔴 Design a Sentry setup that correlates frontend errors with backend request IDs for faster debugging.
- 🟡 Explain how Datadog RUM correlates frontend performance data with backend traces.
- 🔴 Design an observability strategy combining Datadog RUM and APM for a full-stack incident response.

### SEO  
<sub>14 questions</sub>

- 🟡 Explain which meta tags matter most for SEO and how they're rendered for crawlers in a CSR app.
- 🔴 Design an SEO-friendly rendering strategy for a JavaScript-heavy SPA.
- 🟡 Explain Open Graph tags and how they affect social sharing previews.
- 🔴 Design dynamic Open Graph image generation for a blog with hundreds of posts.
- 🟡 Explain JSON-LD structured data and its impact on rich search results.
- 🔴 Design structured data markup for a product page to enable rich snippets (price, rating, availability).
- 🟡 Explain robots.txt directives and common mistakes that accidentally block crawlers.
- 🔴 Debug a site where a critical page isn't being indexed despite no obvious robots.txt block.
- 🟡 Explain how XML sitemaps help search engines discover and prioritize content.
- 🔴 Design a dynamic sitemap generation strategy for a marketplace with millions of listings.
- 🟡 Explain canonical tags and how they prevent duplicate content penalties.
- 🔴 Design a canonicalization strategy for a site with both www/non-www and paginated list pages.
- 🟡 Explain how to generate per-route dynamic metadata in a modern framework like Next.js.
- 🔴 Design a metadata strategy for a multi-locale site to avoid duplicate-content SEO issues.

### Core Web Vitals  
<sub>10 questions</sub>

- 🟡 Explain what counts as the LCP element and common causes of poor LCP.
- 🔴 Debug a page with LCP of 4.5s - walk through your diagnostic and optimization steps.
- 🟡 Explain the difference between FCP and LCP.
- 🔴 Design a loading strategy to minimize FCP for a content-heavy blog.
- 🟡 Explain how INP replaced FID as a Core Web Vital and what it measures.
- 🔴 Debug a page with poor INP caused by a heavy event handler - how do you fix it?
- 🟡 Explain what causes Cumulative Layout Shift and how to prevent it for images and ads.
- 🔴 Design a page layout strategy that guarantees zero CLS for dynamically loaded content.
- 🟡 Explain what factors contribute to Time to First Byte.
- 🔴 Debug a high TTFB on an SSR page - what server and infrastructure factors would you investigate?

### Offline  
<sub>10 questions</sub>

- 🟡 Explain the Service Worker lifecycle: install, activate, fetch.
- 🔴 Design a Service Worker caching strategy (cache-first vs network-first) for a news app.
- 🟡 Explain the core requirements for an installable Progressive Web App.
- 🔴 Design an offline-first PWA architecture for a field-service app used with unreliable connectivity.
- 🟡 Explain the Background Sync API and its use cases for offline form submission.
- 🔴 Design a background sync strategy for queuing failed API writes while offline.
- 🟡 Explain how web push notifications work end-to-end: subscription, payload, service worker.
- 🔴 Design a push notification opt-in flow that maximizes permission grant rates without being intrusive.
- 🟡 Explain IndexedDB and when it's preferable to localStorage.
- 🔴 Design an offline data sync layer using IndexedDB with conflict resolution for a note-taking app.

### System Design  
<sub>55 questions</sub>

- 🟡 Design the frontend architecture for an Instagram-style infinite-scrolling, algorithmically-ranked feed with optimistic likes.
- 🟡 Design the frontend for the Facebook News Feed, covering ranking updates, ads insertion, and real-time comment counts.
- 🟡 Design the frontend for a Twitter-style timeline supporting a 'new tweets' banner and reverse-chronological/algorithmic toggle.
- 🟡 Design the frontend for a LinkedIn-style professional feed with mixed content types (posts, jobs, ads) and read-tracking.
- 🟡 Design the frontend architecture for Reddit, including nested comment threads with collapse/expand and vote state.
- 🟡 Design the frontend for the YouTube homepage: video thumbnails, hover-preview, and personalized recommendation rows.
- 🟡 Design the frontend for the Netflix homepage: horizontally-scrolling rows, prefetching, and low-end device performance.
- 🟡 Design the frontend architecture for the Spotify Web Player, including persistent playback state across route navigation.
- 🟡 Design the frontend architecture for a Google Docs-style real-time collaborative document editor.
- 🟡 Design the frontend architecture for a Figma-style canvas editor with real-time multiplayer cursors and vector rendering.
- 🟡 Design the frontend for a Miro-style infinite collaborative whiteboard with pan/zoom and real-time object sync.
- 🟡 Design the frontend architecture for a Slack-style chat app with channels, threads, and real-time message delivery.
- 🟡 Design the frontend for WhatsApp Web, including QR-code session linking and offline message queuing.
- 🟡 Design the frontend architecture for a Discord-style app with voice channel presence and real-time text chat.
- 🟡 Design the frontend for a Trello-style Kanban board with drag-and-drop cards and optimistic reordering.
- 🟡 Design the frontend architecture for a Jira-style sprint board with filters, swimlanes, and bulk editing.
- 🟡 Design the frontend for a Gmail-style inbox with virtualized email lists and offline-capable drafting.
- 🔴 Design the frontend architecture for a Google Drive-style file browser with nested folders and drag-and-drop upload.
- 🔴 Design the frontend for a Dropbox-style file sync client UI showing real-time sync status per file.
- 🔴 Design the frontend architecture for a Notion-style block-based document editor with nested, draggable blocks.
- 🔴 Design the frontend for a Google Calendar-style app with drag-to-resize events and overlapping event layout.
- 🔴 Design the frontend architecture for a Google Maps-style app with tile-based rendering and clustered markers.
- 🔴 Design the frontend for the Uber rider app: real-time driver location updates and dynamic ETA rendering on a map.
- 🔴 Design the frontend for Airbnb search results with a synchronized map and virtualized listing list.
- 🔴 Design the frontend architecture for the Amazon product detail page: image gallery, reviews, and dynamic pricing.
- 🔴 Design the frontend for a Flipkart-style e-commerce category page with faceted filtering and infinite scroll.
- 🔴 Design the frontend architecture for a shopping cart shared across tabs with real-time inventory validation.
- 🔴 Design the frontend for a multi-step checkout flow with client+server validation and resilient payment submission.
- 🔴 Design the frontend architecture for an embedded payment flow (e.g., Stripe Elements) covering PCI-safe input handling.
- 🔴 Design the frontend for a real-time analytics dashboard rendering thousands of data points without jank.
- 🔴 Design the frontend architecture for an internal admin dashboard with role-based UI and audit logging.
- 🔴 Design the frontend for a crypto dashboard with sub-second price ticker updates across hundreds of assets.
- 🔴 Design the frontend architecture for a stock market dashboard with live candlestick charts and watchlists.
- 🔴 Design the frontend for a trading platform requiring sub-100ms order-book UI updates.
- 🔴 Design the frontend architecture for a personalized news feed with read/unread state and offline caching.
- 🔴 Design a generic, reusable infinite scroll component that handles bidirectional loading and scroll-position restoration.
- 🔴 Design a pagination system that supports both offset-based and cursor-based pagination for a large dataset.
- 🔴 Design the frontend for a search autocomplete component with debouncing, request cancellation, and keyboard navigation.
- 🔴 Design the frontend architecture for an in-app notification system combining WebSocket push and a notification center.
- 🔴 Design the frontend for a nested comments system with lazy-loaded replies and optimistic posting.
- 🔴 Design the frontend architecture for a rich text editor (like a simplified Google Docs) supporting undo/redo and collaborative cursors.
- 🔴 Design the frontend for a collaborative whiteboard supporting freehand drawing synced in real time across clients.
- 🔴 Design the frontend architecture for a Kanban board with virtualized columns for boards containing 10,000+ cards.
- 🔴 Design the frontend for a resumable, chunked file upload system supporting large files and network interruptions.
- 🔴 Design the frontend architecture for an image gallery with lazy loading, lightbox, and responsive grid layout.
- 🔴 Design the frontend for a video streaming player supporting adaptive bitrate playback and buffering UX.
- 🔴 Design the frontend architecture for a live streaming UI with low-latency playback and real-time chat overlay.
- 🔴 Design the frontend for a music streaming app supporting gapless playback and offline downloads.
- 🔴 Design the frontend architecture for a real-time chat app with typing indicators, read receipts, and message ordering.
- 🔴 Design the frontend for a collaborative text editor resolving concurrent edits using CRDTs or OT.
- 🔴 Design the frontend architecture for a drag-and-drop form builder with a live preview pane.
- 🔴 Design the frontend for a resume builder with live WYSIWYG preview and export-to-PDF.
- 🔴 Design the frontend architecture for a node-based workflow automation builder (like Zapier) with a connectable canvas.
- 🔴 Design the frontend for a visual website page builder supporting drag-and-drop sections and responsive preview modes.
- 🔴 Design the frontend architecture for a customizable dashboard builder where users arrange draggable, resizable widgets.

---

_Sourced & de-duplicated from interview-prep sheets. Found a duplicate or error? [Open a PR](../CONTRIBUTING.md)._
