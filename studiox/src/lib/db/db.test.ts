import { beforeAll, describe, expect, it } from 'vitest';
import { createDb, migrateDb, type Db } from './client';
import { isEmpty, seedIfEmpty } from './seed';
import { getPost, getProject, getSettings, listClients, listFaqs, listPosts, listProjects, listServices, listTestimonials } from './queries';
import { adminListFaqs, counts, move, removeRow, saveFaq, saveProject, saveSettings, slugTaken, findById } from './admin';
import { seedProjects } from './seed-data';

let db: Db;

beforeAll(async () => {
  const h = await createDb(undefined, { allowLocal: true, localDir: 'memory://' });
  await migrateDb(h);
  db = h.db;
  expect(await isEmpty(db)).toBe(true);
  expect(await seedIfEmpty(db)).toBe(true);
  expect(await seedIfEmpty(db)).toBe(false);
});

describe('public queries on seeded data', () => {
  it('returns every content type in display order', async () => {
    expect((await listProjects(db)).map((p) => p.slug)).toEqual(['rasakota', 'lunaria', 'kopi-pelabuhan', 'gema-festival']);
    expect((await listPosts(db)).map((p) => p.slug)[0]).toBe('why-most-rebrands-change-nothing');
    expect(await listServices(db)).toHaveLength(4);
    expect(await listTestimonials(db)).toHaveLength(6);
    expect(await listClients(db)).toHaveLength(10);
    expect(await listFaqs(db)).toHaveLength(5);
    expect(await getSettings(db)).toMatchObject({ email: 'hello@gandariastudio.com', bookingFrom: 'Q1 2027' });
  });
  it('loads single items with derived fields', async () => {
    const project = await getProject(db, 'rasakota');
    expect(project?.results).toHaveLength(3);
    expect(project?.cover.url).toBe('/placeholders/work-rasakota.jpg');
    const post = await getPost(db, 'weekly-reviews-over-big-reveals');
    expect(post?.readTime).toMatch(/^\d+ min read$/);
    expect(post?.bodyHtml).toContain('<h2>');
    expect(await getProject(db, 'nope')).toBeNull();
  });
});

describe('admin writes', () => {
  it('hides drafts from the public site', async () => {
    const id = await saveProject(db, null, { ...seedProjects[0], slug: 'draft-one', title: 'Draft', published: false });
    expect(await slugTaken(db, 'projects', 'draft-one')).toBe(true);
    expect(await slugTaken(db, 'projects', 'draft-one', id)).toBe(false);
    expect((await listProjects(db)).some((p) => p.slug === 'draft-one')).toBe(false);
    expect((await findById(db, 'projects', id))?.title).toBe('Draft');
    await removeRow(db, 'projects', id);
    expect(await findById(db, 'projects', id)).toBeNull();
  });
  it('reorders with move and ignores moves past the ends', async () => {
    const before = (await adminListFaqs(db)).map((f) => f.id);
    await move(db, 'faqs', before[1], -1);
    expect((await adminListFaqs(db)).map((f) => f.id)).toEqual([before[1], before[0], ...before.slice(2)]);
    await move(db, 'faqs', before[1], -1);
    expect((await adminListFaqs(db)).map((f) => f.id)[0]).toBe(before[1]);
  });
  it('appends new rows at the end and upserts settings', async () => {
    const id = await saveFaq(db, null, { question: 'New?', answer: 'Yes.' });
    expect((await adminListFaqs(db)).at(-1)?.id).toBe(id);
    await saveSettings(db, { email: 'studio@gandariastudio.com', bookingFrom: 'Q2 2027', socialLinks: [] });
    expect(await getSettings(db)).toEqual({ email: 'studio@gandariastudio.com', bookingFrom: 'Q2 2027', socialLinks: [] });
    expect((await counts(db)).faqs).toBe(6);
  });
});
