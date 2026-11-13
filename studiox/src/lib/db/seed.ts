import { sql } from 'drizzle-orm';
import type { Db } from './client';
import { clients, faqs, posts, projects, services, settings, testimonials } from './schema';
import { legacyBlocks } from '../cms/blocks';
import { seedClients, seedFaqs, seedPosts, seedProjects, seedServices, seedSettings, seedTestimonials } from './seed-data';

export async function isEmpty(db: Db): Promise<boolean> {
  const rows = await db.select({ n: sql<number>`count(*)::int` }).from(settings);
  return Number(rows[0]?.n ?? 0) === 0;
}

/** Inserts the sample content. Callers decide whether the database is empty or should be reset. */
export async function seed(db: Db) {
  await db.insert(settings).values({ id: 1, ...seedSettings });
  await db.insert(projects).values(seedProjects.map((p) => ({ ...p, blocks: legacyBlocks(p) })));
  await db.insert(posts).values(seedPosts.map((p) => ({ ...p, publishedAt: new Date(`${p.publishedAt}T00:00:00Z`) })));
  await db.insert(services).values(seedServices);
  await db.insert(testimonials).values(seedTestimonials);
  await db.insert(clients).values(seedClients);
  await db.insert(faqs).values(seedFaqs);
}

export async function seedIfEmpty(db: Db): Promise<boolean> {
  if (!(await isEmpty(db))) return false;
  await seed(db);
  return true;
}

export async function resetContent(db: Db) {
  await db.execute(sql`truncate table projects, posts, services, testimonials, clients, faqs, settings restart identity`);
}
