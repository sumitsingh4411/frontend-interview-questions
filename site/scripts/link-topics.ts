// Links a section README's Topic cells to their deep dives, for every row whose
// <section>/topics/<slug>.md actually exists. Rows without a deep dive are left as
// plain text, so the tables never contain a dead link.
//
// Idempotent — already-linked rows are skipped. Re-run whenever new deep dives land:
//   cd site && node scripts/link-topics.ts

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SECTIONS, slugify } from '../src/lib/sections.ts';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');

const splitRow = (line: string): string[] =>
  line.replace(/^\|/, '').replace(/\|$/, '').split('|');

let linked = 0;

for (const section of SECTIONS) {
  const readmePath = path.join(REPO_ROOT, section.slug, 'README.md');
  const topicsDir = path.join(REPO_ROOT, section.slug, 'topics');
  if (!fs.existsSync(readmePath) || !fs.existsSync(topicsDir)) continue;

  const has = new Set(
    fs.readdirSync(topicsDir).filter((f) => f.endsWith('.md')).map((f) => f.replace(/\.md$/, '')),
  );

  const lines = fs.readFileSync(readmePath, 'utf8').split('\n');
  let inTopicTable = false;

  const out = lines.map((line) => {
    if (/^#{2,3}\s+/.test(line)) {
      inTopicTable = false;
      return line;
    }
    const t = line.trim();
    if (!t.startsWith('|')) {
      inTopicTable = false;
      return line;
    }

    const cells = splitRow(t);
    const first = (cells[0] ?? '').trim();

    if (/^topic$/i.test(first)) {
      inTopicTable = cells.some((c) => /^difficulty$/i.test(c.trim()));
      return line;
    }
    if (!inTopicTable) return line;
    if (/^:?-{2,}:?$/.test(first)) return line;
    if (/^\[.+\]\(.+\)$/.test(first)) return line; // already linked

    const slug = slugify(first);
    if (!first || !has.has(slug)) return line;

    cells[0] = ` [${first}](topics/${slug}.md) `;
    linked++;
    return `|${cells.join('|')}|`;
  });

  fs.writeFileSync(readmePath, out.join('\n'));
}

console.log(`Linked ${linked} topic row(s) to their deep dives.`);
