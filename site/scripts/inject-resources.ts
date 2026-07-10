// Writes the curated "Learn & Practice" block into each bank's Markdown so the
// GitHub view is complete on its own. Single source of truth is src/lib/resources.ts —
// the website renders the same data on the bank index pages.
//
// Idempotent: the block lives between HTML-comment fences, so re-running replaces
// it in place. Run from the `site/` directory:  node scripts/inject-resources.ts
//
// Placement:
//   folder banks → after the category table's Total row in question-bank/README.md
//   single bank (react) → before the first "### " category heading in question-bank.md
// (Placed where the site's parsers never read prose bullets, so question text, the
//  search index, and the stable questionId hash are untouched.)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { BANKS } from '../src/lib/sections.ts';
import { RESOURCES, type Resource } from '../src/lib/resources.ts';

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '../../..');
const START = '<!-- resources:auto:start -->';
const END = '<!-- resources:auto:end -->';

const bullet = (r: Resource) => `- [${r.label}](${r.url})${r.note ? ` — ${r.note}` : ''}`;

function block(slug: string): string {
  const r = RESOURCES[slug as keyof typeof RESOURCES];
  const out: string[] = [
    START,
    '',
    '## 📚 Learn & Practice',
    '',
    '_Hand-picked, canonical places to actually learn and solve this — read the concept, then go deep._',
    '',
    '**📖 Read**',
    '',
    ...r.read.map(bullet),
  ];
  if (r.practice?.length) {
    out.push('', '**🛠️ Practice**', '', ...r.practice.map(bullet));
  }
  out.push('', END);
  return out.join('\n');
}

/** Replace an existing fenced block, else insert via `place`. */
function upsert(md: string, newBlock: string, place: (md: string, b: string) => string): string {
  const s = md.indexOf(START);
  const e = md.indexOf(END);
  if (s !== -1 && e !== -1) {
    return md.slice(0, s) + newBlock + md.slice(e + END.length);
  }
  return place(md, newBlock);
}

function insertFolder(md: string, b: string): string {
  const lines = md.split('\n');
  // After the table's Total row (falls back to before the last "---").
  let idx = lines.findIndex((l) => /^\|\s*\|\s*\*\*Total\*\*/.test(l));
  if (idx === -1) idx = lines.lastIndexOf('---') - 1;
  lines.splice(idx + 1, 0, '', b);
  return lines.join('\n');
}

function insertSingle(md: string, b: string): string {
  const lines = md.split('\n');
  const idx = lines.findIndex((l) => /^###\s+/.test(l)); // before first category
  if (idx === -1) return md.trimEnd() + '\n\n' + b + '\n';
  lines.splice(idx, 0, b, '');
  return lines.join('\n');
}

let touched = 0;
for (const bank of BANKS) {
  const rel =
    bank.kind === 'single'
      ? `${bank.sectionSlug}/question-bank.md`
      : `${bank.sectionSlug}/question-bank/README.md`;
  const file = path.join(REPO_ROOT, rel);
  if (!fs.existsSync(file)) {
    console.warn(`  skip (missing): ${rel}`);
    continue;
  }
  const before = fs.readFileSync(file, 'utf8');
  const after = upsert(before, block(bank.slug), bank.kind === 'single' ? insertSingle : insertFolder);
  if (after !== before) {
    fs.writeFileSync(file, after);
    touched++;
  }
  const n = RESOURCES[bank.slug as keyof typeof RESOURCES];
  const cnt = n.read.length + (n.practice?.length ?? 0);
  console.log(`  ${bank.slug.padEnd(18)} ${cnt} links → ${rel}`);
}
console.log(`Injected Learn & Practice into ${touched} bank file(s).`);
