// Pure transforms that turn GitHub-flavored repo Markdown into site content.
// No filesystem access here so these stay unit-testable.

import { slugify } from './sections.ts';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'none';

const DIFF_EMOJI: Record<string, Difficulty> = {
  '🟢': 'easy',
  '🟡': 'medium',
  '🔴': 'hard',
};

/**
 * Stable id for a question, derived from its text so saved progress survives
 * reordering. Shared by the checkbox list and the progress dashboard — both
 * must produce identical ids or progress silently stops counting.
 */
export function questionId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

/** Parse a question bullet like "🟡 **Debounce**" into difficulty + clean text. */
export function parseQuestion(raw: string): { difficulty: Difficulty; text: string } {
  let text = raw.trim();
  let difficulty: Difficulty = 'none';
  // Leading difficulty emoji (optionally repeated / spaced).
  const first = [...text][0];
  if (first && DIFF_EMOJI[first]) {
    difficulty = DIFF_EMOJI[first];
    text = text.slice(first.length).trim();
  }
  // Unescape table pipes and strip wrapping bold.
  text = text.replace(/\\\|/g, '|').trim();
  text = text.replace(/^\*\*(.+)\*\*$/, '$1').trim();
  return { difficulty, text };
}

/**
 * Map a repo-relative path (already normalized, no leading "./") to a site route,
 * or null if we don't publish that path (caller falls back to the GitHub URL).
 */
export function repoPathToRoute(repoPath: string, base: string): string | null {
  const b = base.endsWith('/') ? base : base + '/';
  let p = repoPath.replace(/^\.?\//, '').replace(/\/$/, '');
  if (p === '' || p === 'README.md') return b;
  if (p === 'FAQ.md') return `${b}faq/`;
  if (p === 'ROADMAP.md') return `${b}roadmap/`;

  const m = p.match(/^(\d{2}-[a-z0-9-]+)(?:\/(.*))?$/);
  if (!m) return null;
  const section = m[1];
  const rest = m[2] ?? '';

  // React's single-file bank.
  if (section === '06-react' && rest === 'question-bank.md') return `${b}banks/react/`;

  // Question-bank folder (index or a category page).
  const qb = rest.match(/^question-bank\/(.*)$/);
  if (qb) {
    const bank = BANK_FOR_SECTION[section];
    if (!bank) return null;
    const file = qb[1];
    if (file === '' || file === 'README.md') return `${b}banks/${bank}/`;
    return `${b}banks/${bank}/${file.replace(/\.md$/, '')}/`;
  }

  if (rest === '' || rest === 'README.md') return `${b}sections/${section}/`;
  if (rest.endsWith('.md')) return `${b}sections/${section}/${rest.replace(/\.md$/, '')}/`;
  return `${b}sections/${section}/`;
}

const BANK_FOR_SECTION: Record<string, string> = {
  '01-fundamentals': 'fundamentals',
  '02-browser': 'browser',
  '03-javascript': 'javascript',
  '04-typescript': 'typescript',
  '05-css': 'css',
  '06-react': 'react',
  '07-nextjs': 'nextjs',
  '08-architecture': 'architecture',
  '09-performance': 'performance',
  '10-security': 'security',
  '11-accessibility': 'accessibility',
  '12-networking': 'networking',
  '13-state-management': 'state-management',
  '14-testing': 'testing',
  '17-interview-patterns': 'interview-patterns',
  '18-design-patterns': 'design-patterns',
  '19-build-your-own': 'build-your-own',
  '15-system-design': 'system-design',
  '16-machine-coding': 'machine-coding',
  '21-dsa-for-frontend': 'dsa',
};

/** Resolve an href against the file's repo path. Returns {kind, value}. */
export function resolveHref(
  currentRepoPath: string,
  href: string,
): { kind: 'external' | 'anchor' | 'repo'; value: string } {
  if (/^[a-z]+:/i.test(href) || href.startsWith('//') || href.startsWith('mailto:')) {
    return { kind: 'external', value: href };
  }
  if (href.startsWith('#')) return { kind: 'anchor', value: href };

  const [pathPart, hash = ''] = href.split('#');
  const dir = currentRepoPath.includes('/')
    ? currentRepoPath.slice(0, currentRepoPath.lastIndexOf('/'))
    : '';
  const segments = (dir ? dir.split('/') : []).concat(pathPart.split('/'));
  const out: string[] = [];
  for (const seg of segments) {
    if (seg === '' || seg === '.') continue;
    if (seg === '..') out.pop();
    else out.push(seg);
  }
  return { kind: 'repo', value: out.join('/') + (hash ? '#' + hash : '') };
}

/**
 * Strip GitHub-only chrome from a prose page: centered banner/badge/nav blocks,
 * shields.io badges, the difficulty legend, and "back to…" nav lines.
 */
export function stripGithubChrome(md: string): string {
  let s = md;
  // Centered blocks (banners, badges, nav) — non-greedy to first closing div.
  s = s.replace(/<div align="center">[\s\S]*?<\/div>/g, '');
  s = s.replace(/<picture>[\s\S]*?<\/picture>/g, '');
  s = s.replace(/<img\b[^>]*>/g, '');

  const lines = s.split('\n');
  const kept = lines.filter((line) => {
    const t = line.trim();
    if (t.includes('img.shields.io')) return false;
    // The three-emoji difficulty legend (not per-problem metadata).
    if (t.startsWith('>') && t.includes('🟢') && t.includes('🟡') && t.includes('🔴')) return false;
    // Repo-nav callout to the bank; the site has first-class bank navigation.
    if (t.startsWith('>') && /full question bank/i.test(t)) return false;
    if (/(⬆|⬅|↩)\s*Back to/i.test(t)) return false;
    if (/^<br\s*\/?>$/.test(t)) return false;
    return true;
  });
  // Collapse 3+ blank lines.
  return kept.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}

/** Pull the first H1 as a title and return the body without it. */
export function extractTitle(md: string): { title: string | null; body: string } {
  const lines = md.split('\n');
  const idx = lines.findIndex((l) => /^#\s+/.test(l.trim()));
  if (idx === -1) return { title: null, body: md };
  const title = lines[idx].trim().replace(/^#\s+/, '').trim();
  lines.splice(idx, 1);
  return { title, body: lines.join('\n').replace(/^\n+/, '') };
}

/** Split the single-file React bank into category buckets by "### Heading". */
export function parseReactBank(md: string): { title: string; slug: string; questions: ReturnType<typeof parseQuestion>[] }[] {
  const out: { title: string; slug: string; questions: ReturnType<typeof parseQuestion>[] }[] = [];
  const lines = md.split('\n');
  let current: (typeof out)[number] | null = null;
  for (const line of lines) {
    const h = line.match(/^###\s+(.+?)\s*$/);
    if (h) {
      current = { title: h[1].trim(), slug: slugify(h[1]), questions: [] };
      out.push(current);
      continue;
    }
    const bullet = line.match(/^-\s+(.*\S)\s*$/);
    if (bullet && current) {
      // skip "<sub>N questions</sub>" style helper lines
      if (/^<sub>/.test(bullet[1])) continue;
      current.questions.push(parseQuestion(bullet[1]));
    }
  }
  return out.filter((c) => c.questions.length > 0);
}

export interface TopicRow {
  title: string;
  /** slug of the deep-dive file: <section>/topics/<slug>.md */
  slug: string;
  /** the "## " heading the table sits under, e.g. "The platform" */
  group: string;
  difficulty: Difficulty;
  time: string;
  tags: string[];
  /** the outbound "Best Resources" link */
  resource?: { label: string; url: string };
  /** set when the Topic cell is already linked to a deep dive */
  href?: string;
}

const splitRow = (line: string): string[] =>
  line
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());

/**
 * Parse the "| Topic | Difficulty | Time | Tags | Best Resources |" tables out of a
 * section README. Other table shapes (Problem/Component/Pattern/…) are ignored.
 *
 * The Topic cell may be plain text or already linked to its deep dive — rows get
 * linked progressively as deep dives are written, so both must parse identically.
 */
export function parseTopicTables(md: string): TopicRow[] {
  const rows: TopicRow[] = [];
  let group = '';
  let inTopicTable = false;

  for (const line of md.split('\n')) {
    const heading = line.match(/^#{2,3}\s+(.+?)\s*$/);
    if (heading) {
      group = heading[1].trim();
      inTopicTable = false;
      continue;
    }

    const t = line.trim();
    if (!t.startsWith('|')) {
      inTopicTable = false;
      continue;
    }

    const cells = splitRow(t);
    // Header row: only tables whose first column is "Topic" and that carry a Difficulty.
    if (/^topic$/i.test(cells[0] ?? '')) {
      inTopicTable = cells.some((c) => /^difficulty$/i.test(c));
      continue;
    }
    if (!inTopicTable) continue;
    if (/^:?-{2,}:?$/.test(cells[0] ?? '')) continue; // separator
    if (cells.length < 4) continue;

    const [topicCell, diffCell, timeCell, tagsCell, resCell] = cells;
    const link = topicCell.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    const title = (link ? link[1] : topicCell).trim();
    if (!title) continue;

    const diffEmoji = [...diffCell].find((ch) => DIFF_EMOJI[ch]);
    const resMatch = resCell?.match(/\[([^\]]+)\]\(([^)]+)\)/);

    rows.push({
      title,
      slug: slugify(title),
      group,
      difficulty: diffEmoji ? DIFF_EMOJI[diffEmoji] : 'none',
      time: (timeCell ?? '').trim(),
      tags: [...(tagsCell ?? '').matchAll(/`#([^`]+)`/g)].map((m) => m[1].trim()),
      ...(resMatch
        ? { resource: { label: resMatch[1].replace(/⭐/g, '').trim(), url: resMatch[2].trim() } }
        : {}),
      ...(link ? { href: link[2].trim() } : {}),
    });
  }
  return rows;
}

/** Extract question bullets from a folder bank category file. */
export function parseBankCategoryFile(md: string): ReturnType<typeof parseQuestion>[] {
  const questions: ReturnType<typeof parseQuestion>[] = [];
  for (const line of md.split('\n')) {
    const bullet = line.match(/^-\s+(.*\S)\s*$/);
    if (!bullet) continue;
    const body = bullet[1];
    if (/^<sub>/.test(body) || /^(⬅|⬆)/.test(body)) continue;
    questions.push(parseQuestion(body));
  }
  return questions;
}
