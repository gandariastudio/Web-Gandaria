import type { APIRoute } from 'astro';
import { getDb } from '@/lib/db';
import { listFaqs, listPosts, listProjects, listServices } from '@/lib/db/queries';
import { buildLlmsTxt } from '@/lib/cms/llms';

/** /llms.txt for AI search engines; see lib/cms/llms.ts. */
export const GET: APIRoute = async ({ site, locals }) => {
  const db = await getDb();
  const [services, projects, posts, faqs] = await Promise.all([listServices(db), listProjects(db), listPosts(db), listFaqs(db)]);
  const body = buildLlmsTxt({
    base: (site ?? new URL('https://www.gandariastudio.com')).href,
    email: locals.settings.email,
    bookingFrom: locals.settings.bookingFrom,
    services,
    projects,
    posts,
    faqs,
  });
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
