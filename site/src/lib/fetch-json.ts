/**
 * Fetch one of the site's JSON endpoints from the browser.
 *
 * `trailingSlash: 'always'` makes the dev server insist on `/search-index.json/`, but a
 * production build emits a plain `search-index.json` file, which is served without the
 * slash. One URL cannot satisfy both, so try the file form and fall back to the slashed
 * form — that keeps the same code working in `astro dev` and on GitHub Pages.
 */
export async function fetchJson<T>(href: string): Promise<T> {
  const bare = href.replace(/\/$/, '');
  const slashed = bare + '/';
  // Ask for the form that should work first, so neither environment logs a stray 404,
  // but keep the other as a fallback rather than depending on that assumption holding.
  const candidates = import.meta.env.DEV ? [slashed, bare] : [bare, slashed];

  let status = 0;
  for (const candidate of candidates) {
    const res = await fetch(candidate);
    if (res.ok) return res.json() as Promise<T>;
    status = res.status;
  }
  throw new Error(`Failed to load ${bare} (${status})`);
}
