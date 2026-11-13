import { describe, expect, it } from 'vitest';
import { clientSchema, postSchema, projectSchema, readers, settingsSchema, siteImagesSchema, validate } from './validation';

const fd = (entries: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(entries)) f.set(k, v);
  return f;
};
const img = JSON.stringify({ url: '/placeholders/x.jpg', width: 1200, height: 800 });

const projectForm = {
  slug: 'rasakota', title: 'Rasakota', sector: 'Hospitality', year: '2026', summary: 's', services: 'x', client: 'c', role: 'r',
  challenge: 'ch', approach: 'ap', cover: img, cover_alt: 'Kitchen',
  'results.0.value': '+52%', 'results.0.label': 'bookings', 'results.1.value': '4', 'results.1.label': 'venues', 'results.2.value': '3×', 'results.2.label': 'reach',
  'gallery.0': img, 'gallery.0_alt': 'Menus', 'gallery.1': img, 'gallery.1_alt': 'Phone', published: 'on',
};

describe('project form', () => {
  it('accepts a complete project', () => {
    const r = validate(projectSchema, readers.project(fd(projectForm)));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.results).toHaveLength(3);
      expect(r.data.cover).toMatchObject({ url: '/placeholders/x.jpg', width: 1200, alt: 'Kitchen' });
      expect(r.data.published).toBe(true);
    }
  });
  it('reports nested field errors by path', () => {
    const r = validate(projectSchema, readers.project(fd({ ...projectForm, 'results.1.label': '', 'gallery.1': '', cover_alt: '', slug: 'Bad Slug' })));
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors['results.1.label']).toBe('Label is required');
      expect(r.errors['gallery.1.width']).toMatch(/Upload/);
      expect(r.errors['cover.alt']).toMatch(/screen readers/);
      expect(r.errors.slug).toMatch(/lowercase/);
    }
  });
  it('treats an unchecked published box as a draft', () => {
    const { published, ...rest } = projectForm;
    const r = validate(projectSchema, readers.project(fd(rest)));
    expect(r.ok && r.data.published).toBe(false);
  });
});

describe('post form', () => {
  it('sanitises the body and rejects an empty one', () => {
    const base = { slug: 'a', title: 'A', category: 'Brand', publishedAt: '2026-09-18', excerpt: 'e', cover: img, cover_alt: 'c' };
    const ok = validate(postSchema, readers.post(fd({ ...base, bodyHtml: '<p>Hi<script>x</script></p>' })));
    expect(ok.ok && ok.data.bodyHtml).toBe('<p>Hi</p>');
    expect(ok.ok && ok.data.publishedAt instanceof Date).toBe(true);
    const empty = validate(postSchema, readers.post(fd({ ...base, bodyHtml: '<p></p>' })));
    expect(!empty.ok && empty.errors.bodyHtml).toBe('Write the article body');
  });
});

describe('client and settings forms', () => {
  it('bounds logo display size', () => {
    const r = validate(clientSchema, readers.client(fd({ name: 'A', logo: img, logo_alt: 'A', displayWidth: '900', displayHeight: '40' })));
    expect(!r.ok && r.errors.displayWidth).toBe('At most 400px');
  });
  it('drops empty social rows and validates URLs', () => {
    const r = validate(settingsSchema, readers.settings(fd({ email: 'hello@gandariastudio.com', bookingFrom: 'Q1 2027', 'social.0.label': 'Instagram', 'social.0.href': 'https://instagram.com/x', 'social.1.label': 'Bad', 'social.1.href': 'nope' })));
    expect(!r.ok && r.errors['socialLinks.1.href']).toMatch(/full URL/);
    const ok = validate(settingsSchema, readers.settings(fd({ email: 'hello@gandariastudio.com', bookingFrom: 'Q1 2027', 'social.0.label': 'Instagram', 'social.0.href': 'https://instagram.com/x' })));
    expect(ok.ok && ok.data.socialLinks).toEqual([{ label: 'Instagram', href: 'https://instagram.com/x' }]);
  });
});

describe('site images', () => {
  it('treats empty slots as "keep the built-in image" and requires alt text for uploads', () => {
    const empty = validate(siteImagesSchema, readers.siteImages(fd({})));
    expect(empty.ok && empty.data).toEqual({ zoom: [null, null, null, null, null, null], numbers: null, about: null });
    const missingAlt = validate(siteImagesSchema, readers.siteImages(fd({ 'zoom.2': img })));
    expect(!missingAlt.ok && missingAlt.errors['zoom.2.alt']).toMatch(/Describe/);
    const ok = validate(siteImagesSchema, readers.siteImages(fd({ about: img, about_alt: 'The studio' })));
    expect(ok.ok && ok.data.about).toMatchObject({ width: 1200, height: 800, alt: 'The studio' });
  });
});

describe('image crop in forms', () => {
  it('keeps a valid crop from the hidden field and rejects an out-of-range zoom', () => {
    const withCrop = JSON.stringify({ url: '/placeholders/x.jpg', width: 1200, height: 800, crop: { x: 0.3, y: 0.6, zoom: 1.5 } });
    const ok = validate(siteImagesSchema, readers.siteImages(fd({ about: withCrop, about_alt: 'Studio' })));
    expect(ok.ok && ok.data.about?.crop).toEqual({ x: 0.3, y: 0.6, zoom: 1.5 });
    const bad = JSON.stringify({ url: '/placeholders/x.jpg', width: 1200, height: 800, crop: { x: 0.3, y: 0.6, zoom: 12 } });
    expect(validate(siteImagesSchema, readers.siteImages(fd({ about: bad, about_alt: 'Studio' }))).ok).toBe(false);
  });
});
