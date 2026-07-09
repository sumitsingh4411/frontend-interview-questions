// Build-time loader: reads the repo's Markdown as the single source of truth.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BANKS,
  BANK_BY_SLUG,
  SECTIONS,
  SECTION_BY_SLUG,
  slugify,
  type BankSlug,
  type SectionMeta,
} from './sections.ts';
import {
  extractTitle,
  parseBankCategoryFile,
  parseReactBank,
  stripGithubChrome,
  type Difficulty,
} from './transform.ts';
import { renderMarkdown, type Heading } from './markdown.ts';

export const REPO_ROOT = fileURLToPath(new URL('../../../', import.meta.url));

const read = (p: string) => fs.readFileSync(path.join(REPO_ROOT, p), 'utf8');
const exists = (p: string) => fs.existsSync(path.join(REPO_ROOT, p));

export interface Question {
  difficulty: Difficulty;
  text: string;
}

export interface Counts {
  easy: number;
  medium: number;
  hard: number;
  none: number;
  total: number;
}

export function countDifficulties(questions: Question[]): Counts {
  const c: Counts = { easy: 0, medium: 0, hard: 0, none: 0, total: questions.length };
  for (const q of questions) c[q.difficulty]++;
  return c;
}

export interface BankCategory {
  slug: string;
  title: string;
  questions: Question[];
  counts: Counts;
}

export interface Bank {
  slug: BankSlug;
  title: string;
  emoji: string;
  blurb: string;
  sectionSlug: string;
  categories: BankCategory[];
  counts: Counts;
}

export interface Subpage {
  slug: string;
  title: string;
  repoPath: string;
}

/** Category order + titles come from the bank index table so DSA keeps pattern order. */
function bankIndexOrder(sectionSlug: string): { slug: string; title: string }[] {
  const indexPath = `${sectionSlug}/question-bank/README.md`;
  if (!exists(indexPath)) return [];
  const md = read(indexPath);
  const out: { slug: string; title: string }[] = [];
  const re = /\|\s*\d+\s*\|\s*\[([^\]]+)\]\(([^)]+?)\.md\)\s*\|/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) out.push({ title: m[1].trim(), slug: m[2].trim() });
  return out;
}

function loadBank(slug: BankSlug): Bank {
  const src = BANK_BY_SLUG.get(slug)!;
  let categories: BankCategory[] = [];

  if (src.kind === 'single') {
    const md = read(`${src.sectionSlug}/question-bank.md`);
    categories = parseReactBank(md).map((c) => ({
      slug: c.slug,
      title: c.title,
      questions: c.questions,
      counts: countDifficulties(c.questions),
    }));
  } else {
    const dir = `${src.sectionSlug}/question-bank`;
    const files = fs
      .readdirSync(path.join(REPO_ROOT, dir))
      .filter((f) => f.endsWith('.md') && f !== 'README.md')
      .map((f) => f.replace(/\.md$/, ''));

    const ordered = bankIndexOrder(src.sectionSlug).filter((o) => files.includes(o.slug));
    const missing = files.filter((f) => !ordered.some((o) => o.slug === f)).sort();
    const order = [...ordered, ...missing.map((slug) => ({ slug, title: '' }))];

    categories = order.map(({ slug: catSlug, title }) => {
      const md = read(`${dir}/${catSlug}.md`);
      const questions = parseBankCategoryFile(md);
      const h1 = extractTitle(md).title;
      return {
        slug: catSlug,
        title: title || h1 || catSlug,
        questions,
        counts: countDifficulties(questions),
      };
    });
  }

  categories = categories.filter((c) => c.questions.length > 0);
  const all = categories.flatMap((c) => c.questions);
  return {
    slug: src.slug,
    title: src.title,
    emoji: src.emoji,
    blurb: src.blurb,
    sectionSlug: src.sectionSlug,
    categories,
    counts: countDifficulties(all),
  };
}

let bankCache: Map<BankSlug, Bank> | null = null;
export function getBanks(): Bank[] {
  if (!bankCache) bankCache = new Map(BANKS.map((b) => [b.slug, loadBank(b.slug)]));
  return [...bankCache.values()];
}
export function getBank(slug: BankSlug): Bank {
  getBanks();
  return bankCache!.get(slug)!;
}

/** Extra .md pages inside a section folder (flagships, company guides, output-based sets). */
export function getSubpages(sectionSlug: string): Subpage[] {
  const dir = path.join(REPO_ROOT, sectionSlug);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md') && f !== 'README.md' && f !== 'question-bank.md')
    .sort()
    .map((f) => {
      const repoPath = `${sectionSlug}/${f}`;
      const title = extractTitle(read(repoPath)).title ?? slugify(f.replace(/\.md$/, ''));
      return { slug: f.replace(/\.md$/, ''), title, repoPath };
    });
}

export interface ProseDoc {
  title: string;
  html: string;
  headings: Heading[];
}

/** Render any repo Markdown file as a styled prose page. */
export async function getProseDoc(
  repoPath: string,
  base: string,
  opts: { title?: string; dropH1?: boolean } = {},
): Promise<ProseDoc> {
  const raw = read(repoPath);
  const cleaned = stripGithubChrome(raw);
  const { title: h1, body } = opts.dropH1 === false ? { title: null, body: cleaned } : extractTitle(cleaned);
  const { html, headings } = await renderMarkdown(body, repoPath, base);
  return { title: opts.title ?? h1 ?? repoPath, html, headings };
}

export function getSections(): SectionMeta[] {
  return SECTIONS;
}
export function getSection(slug: string): SectionMeta | undefined {
  return SECTION_BY_SLUG.get(slug);
}

export interface SiteStats {
  questions: number;
  sections: number;
  banks: number;
  categories: number;
  deepDives: number;
  companyGuides: number;
  counts: Counts;
}

let statsCache: SiteStats | null = null;
export function getStats(): SiteStats {
  if (statsCache) return statsCache;
  const banks = getBanks();
  const all = banks.flatMap((b) => b.categories.flatMap((c) => c.questions));
  const deepDives = SECTIONS.filter((s) => s.slug !== '20-company-guides').reduce(
    (n, s) => n + getSubpages(s.slug).length,
    0,
  );
  statsCache = {
    questions: all.length,
    sections: SECTIONS.length,
    banks: banks.length,
    categories: banks.reduce((n, b) => n + b.categories.length, 0),
    deepDives,
    companyGuides: getSubpages('20-company-guides').length,
    counts: countDifficulties(all),
  };
  return statsCache;
}
