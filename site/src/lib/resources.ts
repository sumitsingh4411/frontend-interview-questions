// Curated "Learn & Practice" resources, one hand-picked set per bank.
//
// Single source of truth for BOTH surfaces:
//   • the website renders these on each bank index page;
//   • scripts/inject-resources.ts writes them into each bank's README.md
//     (and React's single-file bank) so the GitHub markdown is complete on its own.
//
// Context-aware per the design: concept banks lean on `read` (docs & guides),
// hands-on banks (dsa, machine-coding, build-your-own) add a `practice` list of
// places to actually solve/build. Keep links canonical and stable — this list is
// meant to age well, not chase the newest blog post.

import type { BankSlug } from './sections.ts';

export interface Resource {
  label: string;
  url: string;
  /** short reason this link earns its place */
  note?: string;
}

export interface BankResources {
  /** places to read & understand */
  read: Resource[];
  /** places to actually solve / build (hands-on banks) */
  practice?: Resource[];
}

export const RESOURCES: Record<BankSlug, BankResources> = {
  fundamentals: {
    read: [
      { label: 'MDN — Learn web development', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development', note: 'The canonical, free curriculum for the whole platform.' },
      { label: 'web.dev — Learn HTML', url: 'https://web.dev/learn/html', note: "Modern, semantic HTML from Google's team." },
      { label: 'MDN — HTML element reference', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element', note: 'Every element, when to use it, and its semantics.' },
      { label: 'HTML Living Standard', url: 'https://html.spec.whatwg.org/multipage/', note: 'The source of truth when a guide is ambiguous.' },
      { label: 'web.dev — Learn Forms', url: 'https://web.dev/learn/forms', note: 'Accessible, well-validated forms end to end.' },
    ],
  },

  browser: {
    read: [
      { label: 'MDN — The event loop', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/EventLoop', note: 'How tasks, microtasks, and rendering interleave.' },
      { label: 'Inside look at a modern web browser', url: 'https://developer.chrome.com/blog/inside-browser-part1', note: "Chrome team's 4-part deep dive on navigation → paint." },
      { label: 'MDN — Critical rendering path', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance/Guides/Critical_rendering_path', note: 'From HTML/CSS to pixels on screen.' },
      { label: 'javascript.info — Browser: Document, Events, Interfaces', url: 'https://javascript.info/document', note: 'DOM, events, and browser APIs explained clearly.' },
      { label: 'MDN — Web Storage API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API', note: 'localStorage, sessionStorage, and their limits.' },
    ],
  },

  javascript: {
    read: [
      { label: 'javascript.info', url: 'https://javascript.info/', note: 'The best free, deep, modern JavaScript course.' },
      { label: 'MDN — JavaScript reference', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', note: 'The authoritative language reference.' },
      { label: "You Don't Know JS Yet", url: 'https://github.com/getify/You-Dont-Know-JS', note: "Kyle Simpson's deep series on the tricky bits." },
      { label: 'MDN — Closures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Closures', note: 'The concept behind half of JS interview questions.' },
      { label: 'MDN — Equality comparisons', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Equality_comparisons_and_sameness', note: '==, ===, Object.is — and when each bites.' },
    ],
    practice: [
      { label: 'BigFrontEnd.dev — JS coding', url: 'https://bigfrontend.dev/', note: 'Implement-the-primitive JS challenges with tests.' },
    ],
  },

  typescript: {
    read: [
      { label: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', note: 'The official, complete reference.' },
      { label: 'Total TypeScript — free tutorials', url: 'https://www.totaltypescript.com/tutorials', note: "Matt Pocock's exercises on inference & generics." },
      { label: 'Type-Level TypeScript', url: 'https://type-level-typescript.com/', note: 'Conditional & mapped types, taught as a language.' },
      { label: 'TypeScript Deep Dive', url: 'https://basarat.gitbook.io/typescript/', note: 'A thorough community book, free online.' },
    ],
    practice: [
      { label: 'type-challenges', url: 'https://github.com/type-challenges/type-challenges', note: 'Type-level puzzles from easy to fiendish.' },
      { label: 'TypeScript Playground', url: 'https://www.typescriptlang.org/play', note: 'Prototype types and see inference live.' },
    ],
  },

  css: {
    read: [
      { label: 'web.dev — Learn CSS', url: 'https://web.dev/learn/css', note: 'A modern, complete CSS course.' },
      { label: 'MDN — CSS reference', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', note: 'Every property and how it behaves.' },
      { label: 'CSS-Tricks — Flexbox & Grid guides', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', note: 'The go-to visual references for layout.' },
      { label: 'Josh W. Comeau — CSS articles', url: 'https://www.joshwcomeau.com/', note: 'Deep, intuition-building posts on tricky CSS.' },
      { label: 'defensivecss.dev', url: 'https://defensivecss.dev/', note: 'Patterns that keep layouts from breaking.' },
    ],
    practice: [
      { label: 'Flexbox Froggy', url: 'https://flexboxfroggy.com/', note: 'Learn flexbox as a game.' },
      { label: 'CSS Grid Garden', url: 'https://cssgridgarden.com/', note: 'Learn grid as a game.' },
    ],
  },

  react: {
    read: [
      { label: 'react.dev — Learn', url: 'https://react.dev/learn', note: 'The official docs, rebuilt around hooks & mental models.' },
      { label: 'react.dev — Reference', url: 'https://react.dev/reference/react', note: 'Every hook and API, precisely.' },
      { label: 'Overreacted — Dan Abramov', url: 'https://overreacted.io/', note: 'Deep intuition on rendering, effects, and closures.' },
      { label: 'A Complete Guide to useEffect', url: 'https://overreacted.io/a-complete-guide-to-useeffect/', note: 'The article that finally makes effects click.' },
      { label: 'patterns.dev — React patterns', url: 'https://www.patterns.dev/react', note: 'Component & rendering patterns with examples.' },
    ],
  },

  nextjs: {
    read: [
      { label: 'Next.js — Documentation', url: 'https://nextjs.org/docs', note: 'App router, caching, and rendering, authoritative.' },
      { label: 'Next.js — Learn course', url: 'https://nextjs.org/learn', note: 'Build a real app, official & free.' },
      { label: 'React — Server Components', url: 'https://react.dev/reference/rsc/server-components', note: "The model Next.js's app router is built on." },
      { label: 'Caching in Next.js', url: 'https://nextjs.org/docs/app/deep-dive/caching', note: 'The four caching layers, explained by the source.' },
    ],
  },

  architecture: {
    read: [
      { label: 'patterns.dev', url: 'https://www.patterns.dev/', note: 'Rendering, performance, and design patterns for the web.' },
      { label: 'Micro Frontends — Martin Fowler', url: 'https://martinfowler.com/articles/micro-frontends.html', note: 'The reference write-up on the approach & trade-offs.' },
      { label: 'Feature-Sliced Design', url: 'https://feature-sliced.design/', note: 'A pragmatic methodology for structuring large apps.' },
      { label: 'Frontend at Scale', url: 'https://frontendatscale.com/', note: 'Essays on architecture for growing frontends.' },
      { label: 'Module Federation', url: 'https://module-federation.io/', note: 'Runtime integration for micro-frontends.' },
    ],
  },

  'state-management': {
    read: [
      { label: 'Redux — Essentials', url: 'https://redux.js.org/tutorials/essentials/part-1-overview-concepts', note: 'The canonical model: actions → reducers → store.' },
      { label: 'TanStack Query', url: 'https://tanstack.com/query/latest/docs/framework/react/overview', note: 'The server-cache library and the ideas behind it.' },
      { label: 'Zustand', url: 'https://zustand.docs.pmnd.rs/', note: 'A minimal global store; great for contrast with Redux.' },
      { label: 'Jotai', url: 'https://jotai.org/', note: 'Atom-based state — the other mental model.' },
      { label: 'Kent C. Dodds — Application State Management', url: 'https://kentcdodds.com/blog/application-state-management-with-react', note: "When you do (and don't) need a global store." },
    ],
  },

  performance: {
    read: [
      { label: 'web.dev — Learn Core Web Vitals', url: 'https://web.dev/explore/learn-core-web-vitals', note: 'LCP, INP, CLS and how to move them.' },
      { label: 'web.dev — Fast load times', url: 'https://web.dev/explore/fast', note: 'A structured path through loading performance.' },
      { label: 'MDN — Web performance', url: 'https://developer.mozilla.org/en-US/docs/Web/Performance', note: 'Reference for the performance APIs & concepts.' },
      { label: 'Chrome DevTools — Performance', url: 'https://developer.chrome.com/docs/devtools/performance', note: 'How to actually profile and read a flame chart.' },
    ],
  },

  security: {
    read: [
      { label: 'OWASP — Top Ten', url: 'https://owasp.org/www-project-top-ten/', note: 'The canonical list of web risks to name & defend.' },
      { label: 'OWASP Cheat Sheet Series', url: 'https://cheatsheetseries.owasp.org/', note: 'Practical, per-threat guidance (XSS, CSRF, auth…).' },
      { label: 'web.dev — Content Security Policy', url: 'https://web.dev/articles/strict-csp', note: 'How CSP actually mitigates XSS.' },
      { label: 'MDN — Web security', url: 'https://developer.mozilla.org/en-US/docs/Web/Security', note: 'CORS, CSP, HTTPS, and same-origin, explained.' },
    ],
  },

  accessibility: {
    read: [
      { label: 'MDN — Accessibility', url: 'https://developer.mozilla.org/en-US/docs/Web/Accessibility', note: 'Semantics, ARIA, and how AT consumes your markup.' },
      { label: 'ARIA Authoring Practices Guide', url: 'https://www.w3.org/WAI/ARIA/apg/', note: 'The reference patterns for accessible widgets.' },
      { label: 'The A11y Project — Checklist', url: 'https://www.a11yproject.com/checklist/', note: 'A practical checklist you can actually ship against.' },
      { label: 'web.dev — Learn Accessibility', url: 'https://web.dev/learn/accessibility', note: 'A structured course from the basics up.' },
    ],
  },

  networking: {
    read: [
      { label: 'MDN — HTTP', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP', note: 'Methods, status codes, headers, caching — the reference.' },
      { label: 'High Performance Browser Networking', url: 'https://hpbn.co/', note: "Ilya Grigorik's free book — TCP to HTTP/2 to WebRTC." },
      { label: 'MDN — HTTP caching', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Caching', note: 'The header semantics people get wrong in interviews.' },
      { label: 'MDN — WebSockets API', url: 'https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API', note: 'Real-time transport, and when to reach for it.' },
    ],
  },

  testing: {
    read: [
      { label: 'Testing Library — Docs', url: 'https://testing-library.com/docs/', note: 'Test behavior, not implementation.' },
      { label: 'Kent C. Dodds — Testing Trophy', url: 'https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications', note: 'What to test at each layer, and why.' },
      { label: 'Playwright — Docs', url: 'https://playwright.dev/docs/intro', note: 'The modern end-to-end testing reference.' },
      { label: 'Vitest — Guide', url: 'https://vitest.dev/guide/', note: 'Fast unit testing for the Vite ecosystem.' },
    ],
    practice: [
      { label: 'Testing JavaScript (free lessons)', url: 'https://testingjavascript.com/', note: "Kent C. Dodds' hands-on testing course." },
    ],
  },

  'design-patterns': {
    read: [
      { label: 'Refactoring Guru — Design Patterns', url: 'https://refactoring.guru/design-patterns', note: 'Every GoF pattern with diagrams & code.' },
      { label: 'patterns.dev', url: 'https://www.patterns.dev/', note: 'Design & rendering patterns, framed for the web.' },
      { label: 'Learning JavaScript Design Patterns', url: 'https://www.patterns.dev/vanilla', note: "Addy Osmani's book, updated & free online." },
      { label: 'Refactoring Guru — Refactoring', url: 'https://refactoring.guru/refactoring', note: 'Code smells and the patterns that fix them.' },
    ],
  },

  'interview-patterns': {
    read: [
      { label: 'Tech Interview Handbook', url: 'https://www.techinterviewhandbook.org/', note: 'Battle-tested advice for the whole loop.' },
      { label: 'Front End Interview Handbook', url: 'https://www.frontendinterviewhandbook.com/', note: 'Frontend-specific questions & strategy.' },
      { label: 'GreatFrontEnd — Interview guides', url: 'https://www.greatfrontend.com/interviews/guidebook', note: 'Round-by-round playbooks for frontend loops.' },
      { label: 'STAR method', url: 'https://www.themuse.com/advice/star-interview-method', note: 'Structure behavioral answers that land.' },
    ],
  },

  'system-design': {
    read: [
      { label: 'GreatFrontEnd — Front End System Design', url: 'https://www.greatfrontend.com/front-end-system-design-playbook', note: 'A framework built specifically for FE design rounds.' },
      { label: 'patterns.dev', url: 'https://www.patterns.dev/', note: "Rendering & performance patterns you'll cite in designs." },
      { label: 'web.dev — Architecture & PRPL', url: 'https://web.dev/articles/apply-instant-loading-with-prpl', note: 'A delivery pattern worth naming in a design.' },
      { label: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', note: 'Backend-leaning, but the fundamentals transfer.' },
    ],
    practice: [
      { label: 'GreatFrontEnd — System design questions', url: 'https://www.greatfrontend.com/questions/system-design', note: 'Real FE design prompts with sample solutions.' },
    ],
  },

  'machine-coding': {
    read: [
      { label: 'patterns.dev', url: 'https://www.patterns.dev/', note: 'The component patterns machine-coding rounds reward.' },
      { label: 'MDN — Web APIs', url: 'https://developer.mozilla.org/en-US/docs/Web/API', note: "The platform APIs you'll wire up under time pressure." },
    ],
    practice: [
      { label: 'GreatFrontEnd — Coding questions', url: 'https://www.greatfrontend.com/questions/js', note: 'UI & JS build challenges with solutions.' },
      { label: 'BigFrontEnd.dev', url: 'https://bigfrontend.dev/', note: 'Build-the-component challenges with a test runner.' },
      { label: 'Frontend Mentor', url: 'https://www.frontendmentor.io/challenges', note: 'Real design files to build pixel-accurate UIs.' },
      { label: 'CodeSandbox', url: 'https://codesandbox.io/', note: 'A fast scratchpad to practice building in.' },
    ],
  },

  dsa: {
    read: [
      { label: 'NeetCode — Roadmap', url: 'https://neetcode.io/roadmap', note: 'The pattern-first path through the classic problems.' },
      { label: 'MDN — Data structures', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects', note: "Map, Set, arrays — the tools you'll actually use in JS." },
      { label: 'Tech Interview Handbook — Algorithms', url: 'https://www.techinterviewhandbook.org/algorithms/study-cheatsheet/', note: 'Per-pattern cheat sheets and tips.' },
    ],
    practice: [
      { label: 'LeetCode', url: 'https://leetcode.com/', note: 'The standard problem set; filter by tag & difficulty.' },
      { label: 'NeetCode — Practice', url: 'https://neetcode.io/practice', note: 'Curated lists (NeetCode 150) grouped by pattern.' },
      { label: 'BigFrontEnd.dev', url: 'https://bigfrontend.dev/', note: 'DSA & JS problems framed for frontend interviews.' },
    ],
  },

  'build-your-own': {
    read: [
      { label: 'javascript.info', url: 'https://javascript.info/', note: "The internals you're reimplementing, explained first." },
      { label: 'MDN — Promise', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise', note: 'The spec behavior to match when you rebuild it.' },
      { label: "Tania Rascia — Understanding 'this' & prototypes", url: 'https://www.taniarascia.com/this-bind-call-apply-javascript/', note: 'The mechanics behind bind/call/apply.' },
    ],
    practice: [
      { label: 'BigFrontEnd.dev', url: 'https://bigfrontend.dev/', note: 'Implement debounce, Promise.all, etc. against tests.' },
      { label: 'GreatFrontEnd — JS utilities', url: 'https://www.greatfrontend.com/questions/js', note: 'Reimplement lodash/DOM utilities with solutions.' },
      { label: 'CodeSandbox', url: 'https://codesandbox.io/', note: 'A quick playground to build and test your versions.' },
    ],
  },
};
