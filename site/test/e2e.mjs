// End-to-end checks against the built site. Drives the installed Chrome.
// Usage: node test/e2e.mjs   (requires the dist server on :4321)

import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORIGIN = 'http://127.0.0.1:4321/frontend-interview-questions';

let pass = 0;
let fail = 0;
const ok = (name, cond, extra = '') => {
  if (cond) {
    pass++;
    console.log(`  ok   ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name} ${extra}`);
  }
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
const page = await browser.newPage();
await page.setViewport({ width: 1440, height: 900 });

// ---------------------------------------------------------------- progress
console.log('\nprogress tracking (banks/dsa/two-pointers)');
await page.goto(`${ORIGIN}/banks/dsa/two-pointers/`, { waitUntil: 'networkidle0' });

ok('starts at 0 done', (await page.$eval('[data-done-count]', (e) => e.textContent)) === '0');

// Tick questions 1 (medium) and 2 (easy).
await page.click('#dsa-two-pointers-0');
await page.click('#dsa-two-pointers-1');
await new Promise((r) => setTimeout(r, 200));

ok('count updates to 2', (await page.$eval('[data-done-count]', (e) => e.textContent)) === '2');
ok(
  'first row marked done',
  await page.$eval('.q', (e) => e.classList.contains('done')),
);

// The signature: each spectrum segment fills by that difficulty's completion.
const segs = await page.$$eval('[data-done-for]', (els) =>
  Object.fromEntries(els.map((e) => [e.dataset.doneFor, e.style.width])),
);
// 1 of 7 easy = 14.28%, 1 of 7 medium = 14.28%, 0 of 2 hard = 0%
ok('easy segment filled ~14%', segs.easy.startsWith('14.2'), JSON.stringify(segs));
ok('medium segment filled ~14%', segs.medium.startsWith('14.2'), JSON.stringify(segs));
ok('hard segment still 0%', segs.hard === '0%', JSON.stringify(segs));

const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fip:done:dsa:two-pointers') ?? '[]'));
ok('persisted 2 hashes to localStorage', stored.length === 2, JSON.stringify(stored));

// Survives reload.
await page.reload({ waitUntil: 'networkidle0' });
ok('progress survives reload', (await page.$eval('[data-done-count]', (e) => e.textContent)) === '2');

// ---------------------------------------------------------------- filters
console.log('\nfilters');
const visible = () => page.$$eval('.q', (els) => els.filter((e) => !e.hidden).length);

await page.click('[data-filter="hard"]');
await new Promise((r) => setTimeout(r, 150));
ok('hard filter shows 2', (await visible()) === 2);

await page.click('[data-filter="easy"]');
await new Promise((r) => setTimeout(r, 150));
ok('easy filter shows 7', (await visible()) === 7);

await page.click('[data-filter="all"]');
await page.type('[data-filter-text]', 'sorted');
await new Promise((r) => setTimeout(r, 250));
const n = await visible();
ok('text filter narrows results', n > 0 && n < 16, `visible=${n}`);

await page.$eval('[data-filter-text]', (e) => (e.value = ''));
await page.type('[data-filter-text]', 'x');
await page.keyboard.press('Backspace');
await new Promise((r) => setTimeout(r, 250));

await page.click('[data-hide-done]');
await new Promise((r) => setTimeout(r, 200));
ok('hide-done hides the 2 completed', (await visible()) === 14, `visible=${await visible()}`);

// ---------------------------------------------------------------- bank index rollup
console.log('\nbank index reflects saved progress');
await page.goto(`${ORIGIN}/banks/dsa/`, { waitUntil: 'networkidle0' });
const label = await page.$eval('[data-cat="two-pointers"] [data-cat-progress]', (e) => e.textContent.trim());
ok('two-pointers card shows "2 / 16 done"', /2\s*\/\s*16 done/.test(label), `got "${label}"`);

// ---------------------------------------------------------------- progress dashboard
// The two questions ticked above (1 easy, 1 medium) must surface here. This is the
// integration that breaks silently if the dashboard's ids drift from the checkboxes'.
console.log('\nprogress dashboard');
await page.goto(`${ORIGIN}/progress/`, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 900));

const txt = (sel) => page.$eval(sel, (e) => e.textContent.trim());
ok('counts the 2 ticked questions', (await txt('[data-done]')) === '2', await txt('[data-done]'));
ok('tile: done', (await txt('[data-tile-done]')) === '2');
// Derive expected "remaining" from the live total so it never goes stale.
const remaining = await page.$eval('[data-tile-left]', (e) => e.textContent.trim());
const totalFromIndex = await page.evaluate(
  async (url) => (await fetch(url).then((r) => r.json())).q.length,
  `${ORIGIN}/search-index.json`,
);
ok('tile: remaining = total − 2 done', remaining === (totalFromIndex - 2).toLocaleString(), `${remaining} vs ${totalFromIndex - 2}`);
ok('easy row shows 1', (await txt('[data-row-done="e"]')) === '1');
ok('medium row shows 1', (await txt('[data-row-done="m"]')) === '1');
ok('hard row shows 0', (await txt('[data-row-done="h"]')) === '0');
ok('dsa bank shows 2', (await txt('[data-bank-done="dsa"]')) === '2');
ok('empty state hidden once tracking', await page.$eval('[data-empty]', (e) => e.hidden));

const ringOffset = await page.$eval('[data-ring]', (e) => parseFloat(e.style.strokeDashoffset));
ok('ring is partially filled', ringOffset > 0 && ringOffset < 2 * Math.PI * 52, `offset=${ringOffset}`);

// The partially-done category should be offered to resume.
const resume = await page.$$eval('[data-active-list] a', (els) => els.map((e) => e.textContent));
ok('offers to resume Two Pointers', resume.some((r) => /Two Pointers/.test(r)), JSON.stringify(resume));

// The resume rows are injected with innerHTML, so Astro's scoped CSS can't reach
// them — guard that their global styles are actually applied and laid out.
const resumeStyled = await page.$eval('[data-active-list] li', (li) => {
  const bar = li.querySelector('.r-bar');
  const fill = li.querySelector('.fill');
  return {
    grid: getComputedStyle(li).display,
    barW: Math.round(bar.getBoundingClientRect().width),
    fillW: Math.round(fill.getBoundingClientRect().width),
    fillBg: getComputedStyle(fill).backgroundColor,
  };
});
ok('resume row is a laid-out grid', resumeStyled.grid === 'grid', resumeStyled.grid);
ok('resume row renders a progress bar', resumeStyled.barW > 40, `barW=${resumeStyled.barW}`);
ok('resume bar has a coloured fill', resumeStyled.fillW > 0 && resumeStyled.fillBg !== 'rgba(0, 0, 0, 0)', JSON.stringify(resumeStyled));

// Difficulty bars fill proportionally, not to 100%.
const easyW = await page.$eval('[data-row-fill="e"]', (e) => parseFloat(e.style.width));
ok('easy bar fills 1/628 of the way', easyW > 0 && easyW < 1, `${easyW}%`);

// ---------------------------------------------------------------- search palette
console.log('\ncommand palette');
await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle0' });
ok('palette closed initially', !(await page.$eval('[data-palette]', (e) => e.open)));

await page.keyboard.down('Meta');
await page.keyboard.press('k');
await page.keyboard.up('Meta');
await new Promise((r) => setTimeout(r, 400));
ok('cmd+K opens palette', await page.$eval('[data-palette]', (e) => e.open));

await page.type('[data-palette-input]', 'trapping rain');
await new Promise((r) => setTimeout(r, 500));
const hits = await page.$$eval('.p-item', (els) => els.map((e) => e.textContent.trim()));
ok('finds "Trapping Rain Water"', hits.some((h) => /Trapping Rain Water/i.test(h)), `hits=${hits.length}`);
ok('first hit is selected', await page.$eval('.p-item', (e) => e.getAttribute('aria-selected') === 'true'));

const href = await page.$eval('.p-item', (e) => e.getAttribute('href'));
ok('hit links to its category page', href.includes('/banks/dsa/'), href);

// The group heading must report the true match count, not the rendered slice.
// "component" matches 68 questions but we only render 30 rows.
await page.$eval('[data-palette-input]', (e) => (e.value = ''));
await page.type('[data-palette-input]', 'component');
await new Promise((r) => setTimeout(r, 500));
const shown = await page.$$eval('.p-group', (els) => els[0].textContent.trim());
const claimed = Number(shown.match(/(\d+)/)?.[1] ?? 0);
ok('question count is the true total, not the 30-row cap', claimed > 30, `"${shown}"`);

await page.keyboard.press('Escape');
await new Promise((r) => setTimeout(r, 200));
ok('escape closes palette', !(await page.$eval('[data-palette]', (e) => e.open)));

// ---------------------------------------------------------------- theme
console.log('\ntheme toggle');
ok('defaults to dark', (await page.$eval('html', (e) => e.dataset.theme)) === 'dark');
await page.click('[data-theme-toggle]');
await new Promise((r) => setTimeout(r, 150));
ok('toggles to light', (await page.$eval('html', (e) => e.dataset.theme)) === 'light');
ok(
  'light theme persisted',
  (await page.evaluate(() => localStorage.getItem('fip-theme'))) === 'light',
);
await page.reload({ waitUntil: 'networkidle0' });
ok('light survives reload (no flash)', (await page.$eval('html', (e) => e.dataset.theme)) === 'light');

// ---------------------------------------------------------------- mobile nav
console.log('\nmobile');
const m = await browser.newPage();
await m.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
await m.goto(`${ORIGIN}/banks/dsa/two-pointers/`, { waitUntil: 'networkidle0' });

const drawerX = () => m.$eval('#sidebar', (e) => e.getBoundingClientRect().x);
ok('sidebar starts off-screen', (await drawerX()) < 0);
await m.click('[data-menu-toggle]');
await new Promise((r) => setTimeout(r, 400));
ok('hamburger opens the drawer', (await drawerX()) >= 0);
ok('menu button reports expanded', (await m.$eval('[data-menu-toggle]', (e) => e.getAttribute('aria-expanded'))) === 'true');
// Tap the scrim to the RIGHT of the drawer; its centre is covered by the drawer itself.
await m.mouse.click(350, 500);
await new Promise((r) => setTimeout(r, 400));
ok('scrim closes the drawer', (await drawerX()) < 0);
ok('scrim tap did not navigate', m.url().endsWith('/banks/dsa/two-pointers/'), m.url());

// No horizontal overflow on a small screen.
const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
ok('no horizontal page overflow', overflow <= 0, `overflow=${overflow}px`);

// The question row puts text above its tag.
const rowOrder = await m.$eval('.q label', (l) => {
  const t = l.querySelector('.q-text').getBoundingClientRect();
  const g = l.querySelector('.tag').getBoundingClientRect();
  return t.top < g.top;
});
ok('question text sits above its difficulty tag', rowOrder);
await m.close();

// ---------------------------------------------------------------- a11y-ish
console.log('\nbasics');
await page.goto(`${ORIGIN}/sections/16-machine-coding/nested-comments/`, { waitUntil: 'networkidle0' });
ok('flagship has real checkboxes', (await page.$$('.task-list-item-checkbox')).length > 0);
ok('exactly one h1', (await page.$$('h1')).length === 1);
const noMd = await page.$$eval('a[href$=".md"]', (els) => els.filter((e) => !e.href.includes('github.com')).length);
ok('no dead .md links', noMd === 0);

// summary_large_image renders blank without an absolute og:image.
const meta = await page.evaluate(() => ({
  card: document.querySelector('meta[name="twitter:card"]')?.content,
  ogImage: document.querySelector('meta[property="og:image"]')?.content,
  twImage: document.querySelector('meta[name="twitter:image"]')?.content,
  ogUrl: document.querySelector('meta[property="og:url"]')?.content,
}));
ok('og:image is set and absolute', /^https:\/\/.+\/og\.png$/.test(meta.ogImage ?? ''), meta.ogImage);
ok('twitter:image matches og:image', meta.twImage === meta.ogImage);
ok('og:url is set', /^https:\/\//.test(meta.ogUrl ?? ''), meta.ogUrl);
ok('large-image card has an image', meta.card !== 'summary_large_image' || !!meta.ogImage);

// ---------------------------------------------------------------- learn & practice resources
console.log('\nlearn & practice resources');
await page.goto(`${ORIGIN}/banks/css/`, { waitUntil: 'networkidle0' });
const resHeading = await page.$eval('#learn-practice', (e) => e.textContent).catch(() => null);
ok('bank page has a Learn & practice section', /Learn & practice/.test(resHeading ?? ''), String(resHeading));
const extLinks = await page.$$eval('.resources a[target="_blank"]', (els) =>
  els.map((e) => e.href).filter((h) => /^https:\/\//.test(h)),
);
ok('resources render external https links', extLinks.length >= 4, `n=${extLinks.length}`);
ok(
  'resources open safely (rel=noopener)',
  await page.$$eval('.resources a[target="_blank"]', (els) => els.length > 0 && els.every((e) => /noopener/.test(e.rel))),
);
// DSA is a hands-on bank → it should surface a Practice group.
await page.goto(`${ORIGIN}/banks/dsa/`, { waitUntil: 'networkidle0' });
const groupLabels = await page.$$eval('.resources .r-group h3', (els) => els.map((e) => e.textContent.trim()));
ok('hands-on bank shows a Practice group', groupLabels.some((t) => /Practice/.test(t)), JSON.stringify(groupLabels));

// ---------------------------------------------------------------- topic deep dives
console.log('\ntopic deep dives');
// The section table row must navigate to the on-site deep dive (not a raw .md file).
await page.goto(`${ORIGIN}/sections/01-fundamentals/`, { waitUntil: 'networkidle0' });
const topicHref = await page.$eval('.prose table a[href*="/topics/"]', (a) => a.getAttribute('href'));
ok('section table links topics to on-site deep dives', /\/topics\/[a-z-]+\/$/.test(topicHref ?? ''), String(topicHref));

await page.goto(`${ORIGIN}/sections/01-fundamentals/topics/event-handling-bubbling-delegation/`, {
  waitUntil: 'networkidle0',
});
ok('deep dive renders', (await page.$$('h1')).length === 1);

// The full staff-level anatomy must be present.
const h2s = await page.$$eval('.prose h2', (els) => els.map((e) => e.textContent.trim()));
for (const want of ['Mental model', 'How it actually works', 'Trade-offs', 'Gotchas', 'Say this in the interview']) {
  ok(`has "${want}" section`, h2s.some((h) => h.includes(want)), JSON.stringify(h2s));
}
ok('has a TL;DR callout', await page.$eval('.prose blockquote', (e) => /TL;DR/.test(e.textContent)));

// Metadata badges come from the README table row, not the markdown file.
const badges = await page.evaluate(() => ({
  diff: document.querySelector('.pill[class*="diff-"]')?.textContent.trim(),
  time: [...document.querySelectorAll('.pill')].map((e) => e.textContent).join(' '),
  tags: [...document.querySelectorAll('.tag')].map((e) => e.textContent.trim()),
}));
ok('shows difficulty from the table row', badges.diff === 'Medium', JSON.stringify(badges));
ok('shows time estimate', /1h/.test(badges.time), badges.time);
ok('shows tags', badges.tags.includes('#events'), JSON.stringify(badges.tags));

// Prev/next paging within the section.
const pager = await page.$$eval('.pager .pg', (els) => els.map((e) => e.getAttribute('href')));
ok('has prev and next links', pager.length === 2, JSON.stringify(pager));
// The router swaps pages in place, so this is a same-document navigation —
// waitForNavigation resolves before the URL updates. Wait on the URL itself.
await page.click('.pager .pg.next');
await page
  .waitForFunction(() => location.pathname.endsWith('/topics/virtual-dom/'), { timeout: 5000 })
  .catch(() => {});
ok(
  'next goes to the following topic',
  page.url().endsWith('/topics/virtual-dom/'),
  page.url(),
);

// Deep dives are searchable.
const inIndex = await page.evaluate(async (origin) => {
  const r = await fetch(`${origin}/search-index.json`);
  const j = await r.json();
  return j.pages.filter((p) => p[2] === 'Deep dive').length;
}, ORIGIN);
ok('deep dives are in the search index', inIndex >= 8, `n=${inIndex}`);

// ---------------------------------------------------------------- sidebar orientation
console.log('\nsidebar: where am I');
await page.goto(`${ORIGIN}/sections/01-fundamentals/topics/event-handling-bubbling-delegation/`, {
  waitUntil: 'networkidle0',
});
// Every section's dives are in the markup so the chevron can expand any of them without
// a page load — so what matters is how many are *revealed*, not how many exist.
const expanded = () => page.$$eval('#sidebar .dives', (els) => els.filter((e) => !e.hidden).length);
ok('open section reveals its deep dives', (await page.$$('#sidebar .dives:not([hidden]) .dive')).length >= 8);
ok('only the active section is expanded', (await expanded()) === 1);
const here = await page.$$eval('#sidebar .dive.here', (els) => els.map((e) => e.textContent.trim()));
ok('exactly one topic is marked "you are here"', here.length === 1, JSON.stringify(here));
ok('it is the topic being read', here[0]?.includes('Event handling'), String(here[0]));
ok(
  'current topic is announced to assistive tech',
  (await page.$eval('#sidebar .dive.here', (e) => e.getAttribute('aria-current'))) === 'page',
);
// Every listed dive must be a real link — we only list written ones. Slugs carry digits
// (v8-jit-compilation, this-binding-4-rules), so the pattern has to allow them.
const diveHrefs = await page.$$eval('#sidebar .dive', (els) => els.map((e) => e.getAttribute('href')));
ok(
  'every listed dive links somewhere',
  diveHrefs.length > 0 && diveHrefs.every((h) => /\/topics\/[a-z0-9-]+\/$/.test(h ?? '')),
  JSON.stringify(diveHrefs.filter((h) => !/\/topics\/[a-z0-9-]+\/$/.test(h ?? '')).slice(0, 3)),
);

// A chevron expands its section in place, with no navigation.
const beforeUrl = page.url();
await page.click('#sidebar .sec .dives[hidden] ~ .row [data-chev], #sidebar .row [data-chev][aria-expanded="false"]');
await new Promise((r) => setTimeout(r, 150));
ok('chevron expands a second section without navigating', (await expanded()) === 2 && page.url() === beforeUrl);

// When no section is active (e.g. a bank page), nothing is revealed — no stray rails.
await page.goto(`${ORIGIN}/banks/css/`, { waitUntil: 'networkidle0' });
await page.evaluate(() => sessionStorage.clear());
await page.reload({ waitUntil: 'networkidle0' });
ok('nothing expands when no section is active', (await expanded()) === 0);

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
