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
ok('tile: remaining', (await txt('[data-tile-left]')) === '3,144', await txt('[data-tile-left]'));
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

await browser.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
