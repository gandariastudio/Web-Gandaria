import { defineMiddleware } from 'astro:middleware';
import { getDb } from '@/lib/db';
import { DEFAULT_SETTINGS, getSettings } from '@/lib/db/queries';

export const isAdminPath = (pathname: string) => pathname === '/admin' || pathname.startsWith('/admin/') || pathname.startsWith('/api/admin/');

/** Public pages are cached at the Vercel edge for a minute, then served stale while they refresh. */
const PUBLIC_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=600';

function setHeader(response: Response, name: string, value: string) {
  try {
    response.headers.set(name, value);
  } catch {
    // immutable headers (e.g. some redirects): leave them as they are
  }
}

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  if (isAdminPath(pathname)) {
    // AUTH: /admin is intentionally open for now. Add the password check here, before next().
    // Admin pages do not use the settings, but the 500 page does if an admin page fails.
    context.locals.settings = DEFAULT_SETTINGS;
    const response = await next();
    setHeader(response, 'Cache-Control', 'no-store');
    setHeader(response, 'X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  try {
    context.locals.settings = await getSettings(await getDb());
  } catch (error) {
    console.error('[cms] could not load settings, using defaults', error);
    context.locals.settings = DEFAULT_SETTINGS;
  }

  const response = await next();
  if (response.status >= 500) setHeader(response, 'Cache-Control', 'no-store');
  else if (context.request.method === 'GET' && response.status === 200 && !response.headers.has('Cache-Control')) {
    setHeader(response, 'Cache-Control', PUBLIC_CACHE);
  }
  return response;
});
