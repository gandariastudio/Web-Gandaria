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
  cover: img, cover_alt: 'Kitchen', published: 'on',
  'blocks.0.type': 'text', 'blocks.0.label': 'The challenge', 'blocks.0.text': 'Four venues, four looks.', 'blocks.0.size': 'statement',
  'blocks.1.type': 'results', 'blocks.1.label': 'Results',
  'blocks.1.items.0.value': '+52%', 'blocks.1.items.0.label': 'bookings', 'blocks.1.items.1.value': '4', 'blocks.1.items.1.label': 'venues',
  'blocks.2.type': 'gallery', 'blocks.2.images.0': img, 'blocks.2.images.0_alt': 'Menus', 'blocks.2.images.1': img, 'blocks.2.images.1_alt': 'Phone',
  'blocks.3.type': 'image', 'blocks.3.image': img, 'blocks.3.image_alt': 'Dining room', 'blocks.3.width': 'full', 'blocks.3.caption': 'The room',
  'blocks.4.type': 'video', 'blocks.4.source': 'embed', 'blocks.4.url': 'https://youtu.be/dQw4w9WgXcQ',
  'blocks.5.type': 'quote', 'blocks.5.quote': 'They got us.', 'blocks.5.name': 'Rina', 'blocks.5.role': 'Owner',
};

describe('project form', () => {
  it('accepts a complete project with blocks in order', () => {
    const r = validate(projectSchema, readers.project(fd(projectForm)));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.blocks.map((b) => b.type)).toEqual(['text', 'results', 'gallery', 'image', 'video', 'quote']);
      expect(r.data.blocks[1]).toMatchObject({ items: [{ value: '+52%' }, { value: '4' }] });
      expect(r.data.blocks[3]).toMatchObject({ width: 'full', caption: 'The room', image: { alt: 'Dining room' } });
      expect(r.data.cover).toMatchObject({ url: '/placeholders/x.jpg', width: 1200, alt: 'Kitchen' });
      expect(r.data.published).toBe(true);
    }
  });
  it('reports block errors by path', () => {
    const r = validate(
      projectSchema,
      readers.project(fd({ ...projectForm, 'blocks.0.text': '', 'blocks.2.images.1': '', 'blocks.4.url': 'https://example.com/x', 'blocks.1.items.1.label': '', cover_alt: '', slug: 'Bad Slug' })),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors['blocks.0.text']).toBe('Text is required');
      expect(r.errors['blocks.2.images']).toMatch(/two images/);
      expect(r.errors['blocks.4.url']).toMatch(/YouTube or Vimeo/);
      expect(r.errors['blocks.1.items.1.label']).toBe('Label is required');
      expect(r.errors['cover.alt']).toMatch(/screen readers/);
      expect(r.errors.slug).toMatch(/lowercase/);
    }
  });
  it('reads a Text block, sanitises its body and rejects an empty one', () => {
    const text = (body: string) => {
      const noBlocks = Object.fromEntries(Object.entries(projectForm).filter(([k]) => !k.startsWith('blocks.')));
      return validate(projectSchema, readers.project(fd({ ...noBlocks, 'blocks.0.type': 'richtext', 'blocks.0.body': body })));
    };
    const ok = text('<h2>What changed</h2><p>Now <strong>bold</strong>.</p><h4>Small</h4><h1>Up</h1><blockquote><p>Said</p></blockquote><hr><ul><li>One</li></ul><script>x</script><img src=x>');
    expect(ok.ok && ok.data.blocks[0]).toEqual({
      type: 'richtext',
      body: '<h2>What changed</h2><p>Now <strong>bold</strong>.</p><h4>Small</h4><h2>Up</h2><blockquote><p>Said</p></blockquote><hr /><ul><li>One</li></ul>',
    });
    const empty = text('<p></p><hr>');
    expect(!empty.ok && empty.errors['blocks.0.body']).toBe('Write something, or delete this block');
  });
  it('allows a project with no blocks and treats an unchecked published box as a draft', () => {
    const { published, ...rest } = projectForm;
    const noBlocks = Object.fromEntries(Object.entries(rest).filter(([k]) => !k.startsWith('blocks.')));
    const r = validate(projectSchema, readers.project(fd(noBlocks)));
    expect(r.ok && r.data.blocks).toEqual([]);
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
