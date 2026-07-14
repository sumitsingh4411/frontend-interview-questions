import type { APIRoute } from 'astro';
import { getBanks, getDeepDives, getSections, getSubpages } from '@lib/content.ts';
import { url } from '@lib/url.ts';

const DIFF_KEY = { easy: 'e', medium: 'm', hard: 'h', none: 'n' } as const;

/**
 * Compact question-level search index.
 *   cats:  [bankSlug, catSlug, catTitle, bankTitle, href]
 *   q:     [text, catIndex, difficultyKey]
 *   pages: [title, href, kind]
 */
export const GET: APIRoute = () => {
  const cats: (string | number)[][] = [];
  const q: (string | number)[][] = [];

  for (const bank of getBanks()) {
    for (const cat of bank.categories) {
      const href = url(`banks/${bank.slug}/${cat.slug}/`);
      cats.push([bank.slug, cat.slug, cat.title, bank.title, href]);
      const ci = cats.length - 1;
      for (const question of cat.questions) {
        q.push([question.text, ci, DIFF_KEY[question.difficulty]]);
      }
    }
  }

  const pages: string[][] = [];
  for (const s of getSections()) {
    pages.push([s.title, url(`sections/${s.slug}/`), 'Section']);
    for (const sub of getSubpages(s.slug)) {
      pages.push([sub.title, url(`sections/${s.slug}/${sub.slug}/`), s.title]);
    }
    for (const topic of getDeepDives(s.slug)) {
      pages.push([topic.title, url(`sections/${s.slug}/topics/${topic.slug}/`), 'Deep dive']);
    }
  }
  pages.push(['Your progress', url('progress/'), 'Dashboard']);
  pages.push(['Roadmap', url('roadmap/'), 'Reference']);
  pages.push(['FAQ', url('faq/'), 'Reference']);

  return new Response(JSON.stringify({ cats, q, pages }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
