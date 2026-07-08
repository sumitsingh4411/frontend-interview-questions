<div align="center">

# React

<sub>🏗️ Frontend System Design · **30 questions**</sub>

<a href="README.md">⬅ Bank index</a> &nbsp;·&nbsp; <a href="../README.md">System Design</a> &nbsp;·&nbsp; <a href="../../README.md">Home</a>

</div>

> 🟢 Easy · 🟡 Medium · 🔴 Hard · prompts only — work the answers using the section guides.

---

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

---

_Part of the [🏗️ Frontend System Design question bank](README.md). Spot an error or duplicate? [Open a PR](../../CONTRIBUTING.md)._
