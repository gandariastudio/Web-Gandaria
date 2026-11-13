import { z } from 'astro/zod';
import type { CmsImage } from '../db/schema';
import { sanitizeArticle, sanitizeBlockText } from './sanitize';
import { countWords } from './read-time';
import { SLUG_PATTERN } from './slugify';
import { MAX_ZOOM } from './crop';
import { videoEmbed } from './blocks';

const required = (label: string) => z.string().trim().min(1, `${label} is required`);
const slug = z.string().trim().min(1, 'Slug is required').max(80).regex(SLUG_PATTERN, 'Use lowercase letters, numbers and hyphens only');

const image = (label: string) =>
  z
    .object({
      publicId: z.string().nullish(),
      url: z.string().nullish(),
      width: z.coerce.number({ error: `Upload ${label}` }).int().positive(`Upload ${label}`),
      height: z.coerce.number({ error: `Upload ${label}` }).int().positive(`Upload ${label}`),
      alt: z.string().trim().min(1, 'Describe the image for screen readers'),
      crop: z
        .object({ x: z.coerce.number().min(0).max(1), y: z.coerce.number().min(0).max(1), zoom: z.coerce.number().min(1).max(MAX_ZOOM) })
        .nullish(),
    })
    .refine((i) => !!(i.publicId || i.url), { message: `Upload ${label}`, path: ['width'] });

const result = z.object({ value: required('Value'), label: required('Label') });

/** One case-study block; see ProjectBlock in db/schema.ts. */
const blockSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    label: z.string().trim().max(80).default(''),
    text: required('Text'),
    size: z.enum(['statement', 'paragraph']).default('statement'),
  }),
  z.object({
    type: z.literal('richtext'),
    body: z
      .string()
      .default('')
      .transform(sanitizeBlockText)
      .refine((html) => countWords(html) > 0, 'Write something, or delete this block'),
  }),
  z.object({
    type: z.literal('image'),
    image: image('an image'),
    width: z.enum(['contained', 'full']).default('contained'),
    caption: z.string().trim().max(200).default(''),
  }),
  z.object({
    type: z.literal('gallery'),
    images: z.array(image('an image')).min(2, 'Add at least two images').max(3, 'Use at most three images'),
  }),
  z
    .object({
      type: z.literal('video'),
      source: z.enum(['upload', 'embed']),
      video: z
        .object({ publicId: z.string().min(1), width: z.coerce.number().int().positive(), height: z.coerce.number().int().positive() })
        .nullish()
        .transform((v) => v ?? null),
      url: z.string().trim().default(''),
      width: z.enum(['contained', 'full']).default('contained'),
      caption: z.string().trim().max(200).default(''),
    })
    .superRefine((b, ctx) => {
      if (b.source === 'upload' && !b.video) ctx.addIssue({ code: 'custom', path: ['video'], message: 'Upload a video' });
      if (b.source === 'embed' && !videoEmbed(b.url)) ctx.addIssue({ code: 'custom', path: ['url'], message: 'Paste a YouTube or Vimeo link' });
    }),
  z.object({
    type: z.literal('results'),
    label: z.string().trim().max(80).default(''),
    items: z.array(result).min(1, 'Add at least one result').max(4, 'Use at most four results'),
  }),
  z.object({
    type: z.literal('quote'),
    quote: required('Quote'),
    name: required('Name'),
    role: z.string().trim().max(120).default(''),
  }),
  z.object({ type: z.literal('divider') }),
]);

export const projectSchema = z.object({
  slug,
  title: required('Title'),
  sector: required('Sector'),
  year: z.string().trim().regex(/^\d{4}$/, 'Use a four-digit year'),
  summary: required('Summary'),
  services: required('Services'),
  client: required('Client'),
  role: required('Role'),
  cover: image('a cover image'),
  blocks: z.array(blockSchema).max(40, 'Use at most 40 blocks'),
  published: z.boolean(),
});

export const postSchema = z.object({
  slug,
  title: required('Title'),
  category: required('Category'),
  publishedAt: z.coerce.date({ error: 'Pick a publish date' }),
  excerpt: required('Excerpt'),
  cover: image('a cover image'),
  bodyHtml: z
    .string()
    .transform(sanitizeArticle)
    .refine((html) => countWords(html) > 0, 'Write the article body'),
  published: z.boolean(),
});

export const serviceSchema = z.object({
  slug,
  title: required('Title'),
  summary: required('Summary'),
  deliverables: required('Deliverables'),
  image: image('an image'),
});

export const testimonialSchema = z.object({
  quote: required('Quote'),
  name: required('Name'),
  role: required('Role'),
  published: z.boolean(),
});

export const clientSchema = z.object({
  name: required('Name'),
  logo: image('a logo'),
  displayWidth: z.coerce.number().int().min(16, 'At least 16px').max(400, 'At most 400px'),
  displayHeight: z.coerce.number().int().min(16, 'At least 16px').max(400, 'At most 400px'),
});

export const faqSchema = z.object({
  question: required('Question'),
  answer: required('Answer'),
});

export const settingsSchema = z.object({
  email: z.email('Enter a valid email address'),
  bookingFrom: required('Booking from'),
  socialLinks: z.array(z.object({ label: required('Label'), href: z.url('Enter a full URL starting with https://') })),
});

/** A replaceable image: empty means "keep the built-in image", so it becomes null. */
const optionalImage = z.preprocess(
  (v) => (v && typeof v === 'object' && ((v as Partial<CmsImage>).publicId || (v as Partial<CmsImage>).url) ? v : null),
  image('an image').nullable(),
);

export const siteImagesSchema = z.object({
  zoom: z.array(optionalImage).length(6),
  numbers: optionalImage,
  about: optionalImage,
});

export type ProjectInput = z.infer<typeof projectSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type ServiceInput = z.infer<typeof serviceSchema>;
export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type SiteImagesInput = z.infer<typeof siteImagesSchema>;

/* ---------- FormData -> plain objects ---------- */

const str = (form: FormData, name: string) => String(form.get(name) ?? '').trim();
const bool = (form: FormData, name: string) => form.get(name) === 'on' || form.get(name) === 'true';

/** Image fields post a hidden JSON value `{publicId,url,width,height,crop}` plus `<name>_alt`. */
export function readImage(form: FormData, name: string): Partial<CmsImage> {
  let base: Partial<CmsImage> = {};
  try {
    const raw = str(form, name);
    if (raw) base = JSON.parse(raw);
  } catch {
    base = {};
  }
  return { ...base, alt: str(form, `${name}_alt`) };
}

const hasUpload = (img: Partial<CmsImage>) => !!(img.publicId || img.url);

/**
 * Blocks post as `blocks.<i>.<field>`, numbered 0, 1, 2… in page order (the admin script renumbers
 * them before submitting). Empty image slots and empty result rows are dropped.
 */
export function readBlocks(f: FormData) {
  const blocks: Record<string, unknown>[] = [];
  for (let i = 0; i < 100; i++) {
    const at = (field: string) => `blocks.${i}.${field}`;
    const type = str(f, at('type'));
    if (!type) break;
    switch (type) {
      case 'text':
        blocks.push({ type, label: str(f, at('label')), text: str(f, at('text')), size: str(f, at('size')) || 'statement' });
        break;
      case 'richtext':
        blocks.push({ type, body: str(f, at('body')) });
        break;
      case 'image':
        blocks.push({ type, image: readImage(f, at('image')), width: str(f, at('width')) || 'contained', caption: str(f, at('caption')) });
        break;
      case 'gallery':
        blocks.push({ type, images: [0, 1, 2].map((j) => readImage(f, at(`images.${j}`))).filter(hasUpload) });
        break;
      case 'video': {
        let video: unknown = null;
        try {
          const raw = str(f, at('video'));
          if (raw) video = JSON.parse(raw);
        } catch {
          video = null;
        }
        blocks.push({ type, source: str(f, at('source')) || 'upload', video, url: str(f, at('url')), width: str(f, at('width')) || 'contained', caption: str(f, at('caption')) });
        break;
      }
      case 'results':
        blocks.push({
          type,
          label: str(f, at('label')),
          items: [0, 1, 2, 3].map((j) => ({ value: str(f, at(`items.${j}.value`)), label: str(f, at(`items.${j}.label`)) })).filter((r) => r.value || r.label),
        });
        break;
      case 'quote':
        blocks.push({ type, quote: str(f, at('quote')), name: str(f, at('name')), role: str(f, at('role')) });
        break;
      default:
        blocks.push({ type });
    }
  }
  return blocks;
}

export const readers = {
  project: (f: FormData) => ({
    slug: str(f, 'slug'),
    title: str(f, 'title'),
    sector: str(f, 'sector'),
    year: str(f, 'year'),
    summary: str(f, 'summary'),
    services: str(f, 'services'),
    client: str(f, 'client'),
    role: str(f, 'role'),
    cover: readImage(f, 'cover'),
    blocks: readBlocks(f),
    published: bool(f, 'published'),
  }),
  post: (f: FormData) => ({
    slug: str(f, 'slug'),
    title: str(f, 'title'),
    category: str(f, 'category'),
    publishedAt: str(f, 'publishedAt'),
    excerpt: str(f, 'excerpt'),
    cover: readImage(f, 'cover'),
    bodyHtml: String(f.get('bodyHtml') ?? ''),
    published: bool(f, 'published'),
  }),
  service: (f: FormData) => ({
    slug: str(f, 'slug'),
    title: str(f, 'title'),
    summary: str(f, 'summary'),
    deliverables: str(f, 'deliverables'),
    image: readImage(f, 'image'),
  }),
  testimonial: (f: FormData) => ({ quote: str(f, 'quote'), name: str(f, 'name'), role: str(f, 'role'), published: bool(f, 'published') }),
  client: (f: FormData) => ({
    name: str(f, 'name'),
    logo: readImage(f, 'logo'),
    displayWidth: str(f, 'displayWidth'),
    displayHeight: str(f, 'displayHeight'),
  }),
  faq: (f: FormData) => ({ question: str(f, 'question'), answer: str(f, 'answer') }),
  siteImages: (f: FormData) => ({
    zoom: [0, 1, 2, 3, 4, 5].map((i) => readImage(f, `zoom.${i}`)),
    numbers: readImage(f, 'numbers'),
    about: readImage(f, 'about'),
  }),
  settings: (f: FormData) => ({
    email: str(f, 'email'),
    bookingFrom: str(f, 'bookingFrom'),
    socialLinks: [0, 1, 2, 3, 4, 5]
      .map((i) => ({ label: str(f, `social.${i}.label`), href: str(f, `social.${i}.href`) }))
      .filter((l) => l.label || l.href),
  }),
};

export type FieldErrors = Record<string, string>;

/** First message per field path, e.g. { "results.1.label": "Label is required", "cover.alt": "..." }. */
export function fieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join('.') || '_form';
    out[key] ??= issue.message;
  }
  return out;
}

export function validate<S extends z.ZodType>(schema: S, values: unknown): { ok: true; data: z.infer<S> } | { ok: false; errors: FieldErrors } {
  const result = schema.safeParse(values);
  return result.success ? { ok: true, data: result.data } : { ok: false, errors: fieldErrors(result.error) };
}
