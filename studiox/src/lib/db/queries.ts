import { asc, desc, eq, and } from 'drizzle-orm';
import type { Db } from './client';
import { clients, faqs, posts, projects, services, settings, testimonials, type PostRow, type SocialLink } from './schema';
import { readTime } from '../cms/read-time';

export type SiteSettings = { email: string; socialLinks: SocialLink[]; bookingFrom: string };

/** Used when the settings row is missing (fresh database) or the database is unreachable. */
export const DEFAULT_SETTINGS: SiteSettings = {
  email: 'hello@gandariastudio.com',
  socialLinks: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com' },
    { label: 'Instagram', href: 'https://www.instagram.com' },
  ],
  bookingFrom: 'Q1 2027',
};

export async function getSettings(db: Db): Promise<SiteSettings> {
  const [row] = await db.select().from(settings).where(eq(settings.id, 1)).limit(1);
  return row ? { email: row.email, socialLinks: row.socialLinks, bookingFrom: row.bookingFrom } : DEFAULT_SETTINGS;
}

export const listProjects = (db: Db) =>
  db.select().from(projects).where(eq(projects.published, true)).orderBy(asc(projects.sortOrder), asc(projects.id));

export async function getProject(db: Db, slug: string) {
  const [row] = await db.select().from(projects).where(and(eq(projects.slug, slug), eq(projects.published, true))).limit(1);
  return row ?? null;
}

export type Post = PostRow & { readTime: string };
const withReadTime = (p: PostRow): Post => ({ ...p, readTime: readTime(p.bodyHtml) });

export async function listPosts(db: Db): Promise<Post[]> {
  const rows = await db.select().from(posts).where(eq(posts.published, true)).orderBy(desc(posts.publishedAt), desc(posts.id));
  return rows.map(withReadTime);
}

export async function getPost(db: Db, slug: string): Promise<Post | null> {
  const [row] = await db.select().from(posts).where(and(eq(posts.slug, slug), eq(posts.published, true))).limit(1);
  return row ? withReadTime(row) : null;
}

export const listServices = (db: Db) => db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id));

export const listTestimonials = (db: Db) =>
  db.select().from(testimonials).where(eq(testimonials.published, true)).orderBy(asc(testimonials.sortOrder), asc(testimonials.id));

export const listClients = (db: Db) => db.select().from(clients).orderBy(asc(clients.sortOrder), asc(clients.id));

export const listFaqs = (db: Db) => db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id));
