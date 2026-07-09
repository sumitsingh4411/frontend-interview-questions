// Markdown -> HTML with Shiki highlighting, heading anchors, and repo-link rewriting.

import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
// @ts-expect-error - no bundled types
import taskLists from 'markdown-it-task-lists';
import Shiki from '@shikijs/markdown-it';
import { repoPathToRoute, resolveHref } from './transform.ts';
import { slugify } from './sections.ts';

export const GITHUB_BASE = 'https://github.com/sumitsingh4411/frontend-interview-questions';

export interface Heading {
  depth: number;
  id: string;
  text: string;
}

interface RenderEnv {
  repoPath: string;
  base: string;
}

let mdPromise: Promise<MarkdownIt> | null = null;

async function getMd(): Promise<MarkdownIt> {
  if (mdPromise) return mdPromise;
  mdPromise = (async () => {
    const md = MarkdownIt({ html: true, linkify: true, breaks: false });

    md.use(
      await Shiki({
        themes: { light: 'github-light', dark: 'github-dark-dimmed' },
        defaultColor: false, // emit --shiki-light / --shiki-dark vars for the theme toggle
      }),
    );

    // Flagship pages use "- [ ]" requirement checklists; make them real, tickable boxes.
    md.use(taskLists, { enabled: true, label: true });

    md.use(anchor, {
      slugify,
      permalink: anchor.permalink.linkInsideHeader({
        symbol: '#',
        placement: 'after',
        class: 'heading-anchor',
        ariaHidden: true,
      }),
    });

    // Rewrite every link: repo .md -> site route, unknown repo path -> GitHub, external -> new tab.
    md.renderer.rules.link_open = (tokens, idx, options, env: RenderEnv, self) => {
      const token = tokens[idx];
      const href = token.attrGet('href');
      if (href) {
        const r = resolveHref(env.repoPath, href);
        if (r.kind === 'repo') {
          const [p, hash] = r.value.split('#');
          const route = repoPathToRoute(p, env.base);
          token.attrSet('href', route ? route + (hash ? '#' + hash : '') : `${GITHUB_BASE}/blob/main/${r.value}`);
          if (!route) {
            token.attrSet('target', '_blank');
            token.attrSet('rel', 'noopener noreferrer');
          }
        } else if (r.kind === 'external') {
          token.attrSet('target', '_blank');
          token.attrSet('rel', 'noopener noreferrer');
        }
      }
      return self.renderToken(tokens, idx, options);
    };

    return md;
  })();
  return mdPromise;
}

export async function renderMarkdown(
  src: string,
  repoPath: string,
  base: string,
): Promise<{ html: string; headings: Heading[] }> {
  const md = await getMd();
  const env: RenderEnv = { repoPath, base };
  const tokens = md.parse(src, env);

  const headings: Heading[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type !== 'heading_open') continue;
    const depth = Number(t.tag.slice(1));
    if (depth < 2 || depth > 3) continue;
    const inline = tokens[i + 1];
    const text = (inline?.content ?? '').replace(/[*`_]/g, '').trim();
    const id = t.attrGet('id') ?? slugify(text);
    if (text) headings.push({ depth, id, text });
  }

  const html = md.renderer.render(tokens, md.options, env);
  return { html, headings };
}
