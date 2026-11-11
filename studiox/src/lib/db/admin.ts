import { and, asc, desc, eq, gt, inArray, lt, ne, sql } from 'drizzle-orm';
import type { Db } from './client';
import { clients, faqs, posts, projects, services, settings, testimonials, type CmsImage } from './schema';
import type { ClientInput, FaqInput, PostInput, ProjectInput, ServiceInput, SettingsInput, TestimonialInput } from '../cms/validation';

/** Content types the admin manages as lists. */
export const tables = { projects, posts, services, testimonials, clients, faqs };
export type Resource = keyof typeof tables;
const ordered = { projects, services, testimonials, clients, faqs } as const;
export type OrderedResource = keyof typeof ordered;

const now = () => new Date();

export async function counts(db: Db) {
  const entries = await Promise.all(
    (Object.keys(tables) as Resource[]).map(async (k) => {
      const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(tables[k]);
      return [k, Number(r?.n ?? 0)] as const;
    }),
  );
  return Object.fromEntries(entries) as Record<Resource, number>;
}

/* ---------- lists ---------- */

export const adminListProjects = (db: Db) => db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id));
export const adminListPosts = (db: Db) => db.select().from(posts).orderBy(desc(posts.publishedAt), desc(posts.id));
export const adminListServices = (db: Db) => db.select().from(services).orderBy(asc(services.sortOrder), asc(services.id));
export const adminListTestimonials = (db: Db) => db.select().from(testimonials).orderBy(asc(testimonials.sortOrder), asc(testimonials.id));
export const adminListClients = (db: Db) => db.select().from(clients).orderBy(asc(clients.sortOrder), asc(clients.id));
export const adminListFaqs = (db: Db) => db.select().from(faqs).orderBy(asc(faqs.sortOrder), asc(faqs.id));

/* ---------- single rows ---------- */

export async function findById<R extends Resource>(db: Db, resource: R, id: number): Promise<(typeof tables)[R]['$inferSelect'] | null> {
  // Every table has an integer id; narrow the union so select().from() type-checks.
  const t = tables[resource] as unknown as typeof projects;
  const [row] = await db.select().from(t).where(eq(t.id, id)).limit(1);
  return (row ?? null) as never;
}

/** True when another row of the resource already uses this slug. */
export async function slugTaken(db: Db, resource: 'projects' | 'posts' | 'services', slug: string, exceptId?: number) {
  const t = tables[resource];
  const where = exceptId ? and(eq(t.slug, slug), ne(t.id, exceptId)) : eq(t.slug, slug);
  const [row] = await db.select({ id: t.id }).from(t).where(where).limit(1);
  return !!row;
}

async function nextOrder(db: Db, resource: OrderedResource) {
  const t = ordered[resource];
  const [r] = await db.select({ max: sql<number>`coalesce(max(${t.sortOrder}), 0)::int` }).from(t);
  return Number(r?.max ?? 0) + 1;
}

/* ---------- writes (id = null creates) ---------- */

export async function saveProject(db: Db, id: number | null, input: ProjectInput) {
  if (id) {
    await db.update(projects).set({ ...input, updatedAt: now() }).where(eq(projects.id, id));
    return id;
  }
  const [row] = await db.insert(projects).values({ ...input, sortOrder: await nextOrder(db, 'projects') }).returning({ id: projects.id });
  return row.id;
}

export async function savePost(db: Db, id: number | null, input: PostInput) {
  if (id) {
    await db.update(posts).set({ ...input, updatedAt: now() }).where(eq(posts.id, id));
    return id;
  }
  const [row] = await db.insert(posts).values(input).returning({ id: posts.id });
  return row.id;
}

export async function saveService(db: Db, id: number | null, input: ServiceInput) {
  if (id) {
    await db.update(services).set({ ...input, updatedAt: now() }).where(eq(services.id, id));
    return id;
  }
  const [row] = await db.insert(services).values({ ...input, sortOrder: await nextOrder(db, 'services') }).returning({ id: services.id });
  return row.id;
}

export async function saveTestimonial(db: Db, id: number | null, input: TestimonialInput) {
  if (id) {
    await db.update(testimonials).set({ ...input, updatedAt: now() }).where(eq(testimonials.id, id));
    return id;
  }
  const [row] = await db.insert(testimonials).values({ ...input, sortOrder: await nextOrder(db, 'testimonials') }).returning({ id: testimonials.id });
  return row.id;
}

export async function saveClient(db: Db, id: number | null, input: ClientInput) {
  if (id) {
    await db.update(clients).set({ ...input, updatedAt: now() }).where(eq(clients.id, id));
    return id;
  }
  const [row] = await db.insert(clients).values({ ...input, sortOrder: await nextOrder(db, 'clients') }).returning({ id: clients.id });
  return row.id;
}

export async function saveFaq(db: Db, id: number | null, input: FaqInput) {
  if (id) {
    await db.update(faqs).set({ ...input, updatedAt: now() }).where(eq(faqs.id, id));
    return id;
  }
  const [row] = await db.insert(faqs).values({ ...input, sortOrder: await nextOrder(db, 'faqs') }).returning({ id: faqs.id });
  return row.id;
}

export async function saveSettings(db: Db, input: SettingsInput) {
  await db
    .insert(settings)
    .values({ id: 1, ...input })
    .onConflictDoUpdate({ target: settings.id, set: { ...input, updatedAt: now() } });
}

export async function removeRow(db: Db, resource: Resource, id: number) {
  const t = tables[resource];
  await db.delete(t).where(eq(t.id, id));
}

/** Swap sort order with the neighbour above (-1) or below (+1). No-op at the ends. */
export async function move(db: Db, resource: OrderedResource, id: number, direction: -1 | 1) {
  const t = ordered[resource];
  const [current] = await db.select({ id: t.id, sortOrder: t.sortOrder }).from(t).where(eq(t.id, id)).limit(1);
  if (!current) return;
  const [neighbour] = await db
    .select({ id: t.id, sortOrder: t.sortOrder })
    .from(t)
    .where(direction < 0 ? lt(t.sortOrder, current.sortOrder) : gt(t.sortOrder, current.sortOrder))
    .orderBy(direction < 0 ? desc(t.sortOrder) : asc(t.sortOrder))
    .limit(1);
  if (!neighbour) return;
  await db.update(t).set({ sortOrder: neighbour.sortOrder }).where(eq(t.id, current.id));
  await db.update(t).set({ sortOrder: current.sortOrder }).where(eq(t.id, neighbour.id));
}

/**
 * Persist a drag-and-drop order: each id gets its 1-based position. One UPDATE with a CASE,
 * so it costs a single round trip on Neon. Ids that are not in the table are ignored.
 */
export async function reorder(db: Db, resource: OrderedResource, ids: number[]) {
  const unique = [...new Set(ids.filter((id) => Number.isInteger(id) && id > 0))];
  if (!unique.length) return;
  const t = ordered[resource];
  const cases = sql.join(
    unique.map((id, i) => sql`when ${t.id} = ${id} then ${i + 1}`),
    sql` `,
  );
  await db.update(t).set({ sortOrder: sql`case ${cases} else ${t.sortOrder} end` }).where(inArray(t.id, unique));
}

export type RecentItem = { kind: string; title: string; href: string; updatedAt: Date; image: CmsImage | null };

/** The most recently edited content across every type, newest first (dashboard). */
export async function recentlyEdited(db: Db, limit = 6): Promise<RecentItem[]> {
  const take = <T>(q: Promise<T[]>) => q;
  const [p, po, s, t, c, f] = await Promise.all([
    take(db.select({ id: projects.id, title: projects.title, updatedAt: projects.updatedAt, image: projects.cover }).from(projects).orderBy(desc(projects.updatedAt)).limit(limit)),
    take(db.select({ id: posts.id, title: posts.title, updatedAt: posts.updatedAt, image: posts.cover }).from(posts).orderBy(desc(posts.updatedAt)).limit(limit)),
    take(db.select({ id: services.id, title: services.title, updatedAt: services.updatedAt, image: services.image }).from(services).orderBy(desc(services.updatedAt)).limit(limit)),
    take(db.select({ id: testimonials.id, title: testimonials.name, updatedAt: testimonials.updatedAt }).from(testimonials).orderBy(desc(testimonials.updatedAt)).limit(limit)),
    take(db.select({ id: clients.id, title: clients.name, updatedAt: clients.updatedAt, image: clients.logo }).from(clients).orderBy(desc(clients.updatedAt)).limit(limit)),
    take(db.select({ id: faqs.id, title: faqs.question, updatedAt: faqs.updatedAt }).from(faqs).orderBy(desc(faqs.updatedAt)).limit(limit)),
  ]);
  const tag = (kind: string, base: string, rows: { id: number; title: string; updatedAt: Date; image?: CmsImage }[]): RecentItem[] =>
    rows.map((r) => ({ kind, title: r.title, href: `${base}/${r.id}`, updatedAt: r.updatedAt, image: r.image ?? null }));
  return [
    ...tag('Project', '/admin/projects', p),
    ...tag('Article', '/admin/journal', po),
    ...tag('Service', '/admin/services', s),
    ...tag('Testimonial', '/admin/testimonials', t),
    ...tag('Client', '/admin/clients', c),
    ...tag('FAQ', '/admin/faqs', f),
  ]
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, limit);
}
