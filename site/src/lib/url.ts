const RAW = import.meta.env.BASE_URL ?? '/';

/** Base path with exactly one trailing slash. */
export const BASE = RAW.endsWith('/') ? RAW : RAW + '/';

/** Build a site URL from a base-relative path. */
export function url(p = ''): string {
  return BASE + p.replace(/^\//, '');
}

export const GITHUB_URL = 'https://github.com/sumitsingh4411/frontend-interview-questions';
