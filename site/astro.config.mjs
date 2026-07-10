import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// GitHub Pages project site: https://sumitsingh4411.github.io/frontend-interview-questions/
export default defineConfig({
  site: 'https://sumitsingh4411.github.io',
  base: '/frontend-interview-questions',
  trailingSlash: 'always',
  output: 'static',
  build: {
    format: 'directory',
  },
  integrations: [
    sitemap({
      // The JSON endpoints aren't pages.
      filter: (page) => !page.endsWith('.json'),
    }),
  ],
  markdown: {
    // We render Markdown ourselves via markdown-it in src/lib, so Astro's
    // own Markdown pipeline is unused for repo content.
  },
});
