// Static metadata for the 21 repo sections: human titles, emoji, and the group
// each belongs to in the sidebar. Order follows the numeric folder prefix.

export type Group = 'Core' | 'Frameworks & State' | 'Engineering craft' | 'Interview prep';

export interface SectionMeta {
  slug: string; // folder name, e.g. "03-javascript"
  num: string; // "03"
  title: string; // human title
  emoji: string;
  group: Group;
  blurb: string;
  /** bank slug if this section has a question bank, else undefined */
  bank?: BankSlug;
}

export type BankSlug = 'machine-coding' | 'javascript' | 'system-design' | 'dsa' | 'react';

export const GROUP_ORDER: Group[] = [
  'Core',
  'Frameworks & State',
  'Engineering craft',
  'Interview prep',
];

export const SECTIONS: SectionMeta[] = [
  { slug: '01-fundamentals', num: '01', title: 'Fundamentals', emoji: '🧱', group: 'Core', blurb: 'How the web actually works — the base layer every interview assumes.' },
  { slug: '02-browser', num: '02', title: 'Browser', emoji: '🌐', group: 'Core', blurb: 'Rendering, the event loop, storage, and the runtime your code lives in.' },
  { slug: '03-javascript', num: '03', title: 'JavaScript', emoji: '⚡', group: 'Core', blurb: 'The language, deeply — the questions asked in every frontend loop.', bank: 'javascript' },
  { slug: '04-typescript', num: '04', title: 'TypeScript', emoji: '🔷', group: 'Core', blurb: 'Types that scale — generics, narrowing, and the tricky inference questions.' },
  { slug: '05-css', num: '05', title: 'CSS', emoji: '🎨', group: 'Core', blurb: 'Layout, the cascade, and the visual questions people underestimate.' },
  { slug: '06-react', num: '06', title: 'React', emoji: '⚛️', group: 'Frameworks & State', blurb: 'Hooks, reconciliation, performance — the framework interviews center on.', bank: 'react' },
  { slug: '07-nextjs', num: '07', title: 'Next.js', emoji: '▲', group: 'Frameworks & State', blurb: 'Rendering strategies, the app router, and server components.' },
  { slug: '13-state-management', num: '13', title: 'State management', emoji: '🗃️', group: 'Frameworks & State', blurb: 'Local, global, server state — and choosing the right tool.' },
  { slug: '08-architecture', num: '08', title: 'Architecture', emoji: '🏛️', group: 'Engineering craft', blurb: 'Structuring frontends that survive scale and many engineers.' },
  { slug: '09-performance', num: '09', title: 'Performance', emoji: '🚀', group: 'Engineering craft', blurb: 'Core Web Vitals, loading strategy, and the measurable wins.' },
  { slug: '10-security', num: '10', title: 'Security', emoji: '🔒', group: 'Engineering craft', blurb: 'XSS, CSRF, CSP, and the client-side threats you must name.' },
  { slug: '11-accessibility', num: '11', title: 'Accessibility', emoji: '♿', group: 'Engineering craft', blurb: 'Semantics, ARIA, and keyboard-first interfaces.' },
  { slug: '12-networking', num: '12', title: 'Networking', emoji: '📡', group: 'Engineering craft', blurb: 'HTTP, caching, WebSockets, and everything above the socket.' },
  { slug: '14-testing', num: '14', title: 'Testing', emoji: '🧪', group: 'Engineering craft', blurb: 'Unit, integration, e2e — and what to test at each layer.' },
  { slug: '18-design-patterns', num: '18', title: 'Design patterns', emoji: '🧩', group: 'Engineering craft', blurb: 'The reusable patterns that show up in machine-coding rounds.' },
  { slug: '19-build-your-own', num: '19', title: 'Build your own', emoji: '🔧', group: 'Engineering craft', blurb: 'Reimplement the tools — Promise, router, bundler, virtual DOM.' },
  { slug: '15-system-design', num: '15', title: 'System design', emoji: '🏗️', group: 'Interview prep', blurb: 'Design real frontend systems — the senior/staff differentiator.', bank: 'system-design' },
  { slug: '16-machine-coding', num: '16', title: 'Machine coding', emoji: '🧑‍💻', group: 'Interview prep', blurb: 'Build a working UI under time pressure — the SDE-2 sweet spot.', bank: 'machine-coding' },
  { slug: '17-interview-patterns', num: '17', title: 'Interview patterns', emoji: '🎯', group: 'Interview prep', blurb: 'How rounds are scored, and the templates that pass them.' },
  { slug: '20-company-guides', num: '20', title: 'Company guides', emoji: '🏢', group: 'Interview prep', blurb: 'What Google, Meta, Amazon, Netflix, Stripe and more actually ask.' },
  { slug: '21-dsa-for-frontend', num: '21', title: 'DSA for frontend', emoji: '🧠', group: 'Interview prep', blurb: 'The specific algorithmic slice frontend loops care about.', bank: 'dsa' },
];

export const SECTION_BY_SLUG = new Map(SECTIONS.map((s) => [s.slug, s]));

// Bank slug -> the section folder that owns it, and how the source lives.
export interface BankSource {
  slug: BankSlug;
  title: string;
  emoji: string;
  sectionSlug: string;
  /** 'folder' = question-bank/ dir of category files; 'single' = one .md file */
  kind: 'folder' | 'single';
  blurb: string;
}

export const BANKS: BankSource[] = [
  { slug: 'machine-coding', title: 'Machine Coding', emoji: '🧑‍💻', sectionSlug: '16-machine-coding', kind: 'folder', blurb: 'UI-build challenges, grouped by what you build.' },
  { slug: 'javascript', title: 'JavaScript', emoji: '⚡', sectionSlug: '03-javascript', kind: 'folder', blurb: 'Language questions by concept, from closures to event loop.' },
  { slug: 'system-design', title: 'System Design', emoji: '🏗️', sectionSlug: '15-system-design', kind: 'folder', blurb: 'Frontend systems to design, grouped by problem area.' },
  { slug: 'dsa', title: 'DSA for Frontend', emoji: '🧠', sectionSlug: '21-dsa-for-frontend', kind: 'folder', blurb: 'Algorithms bucketed into the classic NeetCode patterns.' },
  { slug: 'react', title: 'React', emoji: '⚛️', sectionSlug: '06-react', kind: 'single', blurb: 'React topics to master, by area.' },
];

export const BANK_BY_SLUG = new Map(BANKS.map((b) => [b.slug, b]));

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
