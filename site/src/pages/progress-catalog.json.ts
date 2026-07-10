import type { APIRoute } from 'astro';
import { getBanks } from '@lib/content.ts';
import { questionId } from '@lib/transform.ts';
import { url } from '@lib/url.ts';

/**
 * Everything the progress dashboard needs to turn a bag of saved question ids
 * into counts: for each category, the ids split by difficulty.
 * Fetched only by /progress/, so it costs nothing on other pages.
 */
export const GET: APIRoute = () => {
  const banks = getBanks().map((bank) => ({
    slug: bank.slug,
    title: bank.title,
    emoji: bank.emoji,
    href: url(`banks/${bank.slug}/`),
    cats: bank.categories.map((cat) => {
      const buckets: Record<string, string[]> = { e: [], m: [], h: [], n: [] };
      const key = { easy: 'e', medium: 'm', hard: 'h', none: 'n' } as const;
      for (const q of cat.questions) buckets[key[q.difficulty]].push(questionId(q.text));
      return {
        slug: cat.slug,
        title: cat.title,
        href: url(`banks/${bank.slug}/${cat.slug}/`),
        e: buckets.e,
        m: buckets.m,
        h: buckets.h,
        n: buckets.n,
      };
    }),
  }));

  return new Response(JSON.stringify({ banks }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
