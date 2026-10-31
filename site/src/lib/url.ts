const RAW = import.meta.env.BASE_URL ?? '/';

/** Base path with exactly one trailing slash. */
export const BASE = RAW.endsWith('/') ? RAW : RAW + '/';

/** Build a site URL from a base-relative path. */
export function url(p = ''): string {
  return BASE + p.replace(/^\//, '');
}

export const GITHUB_URL = 'https://github.com/sumitsingh4411/frontend-interview-questions';

/** UIRound: the companion site with runnable, tested answers. `placement` tags the visit in its analytics. */
export function uiRoundUrl(placement: string): string {
  return `https://frontend.nextjoblist.com/?utm_source=handbook&utm_medium=site&utm_campaign=${encodeURIComponent(placement)}`;
}
