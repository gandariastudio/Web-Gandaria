import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db';
import { listPosts, listProjects } from '@/lib/db/queries';

const STATIC_PAGES = ['/', '/about', '/services', '/work', '/journal', '/contact', '/privacy'];

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

export const GET: APIRoute = async ({ site }) => {
  const base = site ?? new URL('https://gandariastudio.com');
  const db = await getDb();
  const [projects, posts] = await Promise.all([listProjects(db), listPosts(db)]);
  const entries: { loc: string; lastmod?: Date }[] = [
    ...STATIC_PAGES.map((path) => ({ loc: new URL(path, base).href })),
    ...projects.map((p) => ({ loc: new URL(`/work/${p.slug}`, base).href, lastmod: p.updatedAt })),
    ...posts.map((p) => ({ loc: new URL(`/journal/${p.slug}`, base).href, lastmod: p.updatedAt })),
  ];
  const body = entries
    .map((e) => `  <url><loc>${escape(e.loc)}</loc>${e.lastmod ? `<lastmod>${e.lastmod.toISOString()}</lastmod>` : ''}</url>`)
    .join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
