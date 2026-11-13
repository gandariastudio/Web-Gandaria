import { boolean, date, integer, jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * An image stored by the CMS. Uploaded images carry a Cloudinary `publicId`; the seeded
 * sample content points at local placeholders through `url` until real photos are uploaded.
 */
export type CmsImage = {
  publicId?: string | null;
  url?: string | null;
  width: number;
  height: number;
  alt: string;
  /** Framing from the admin's Adjust dialog (see src/lib/cms/crop.ts); absent means centred, no zoom. */
  crop?: ImageCrop | null;
};

/** A point of the original to keep in view (0–1 across and down) and a zoom level (1–4). */
export type ImageCrop = { x: number; y: number; zoom: number };

export type ProjectResult = { value: string; label: string };

/** A video uploaded to Cloudinary (resource type "video"). */
export type CmsVideo = { publicId: string; width: number; height: number };

/** Contained = inside the page margins; full = edge to edge. */
export type BlockWidth = 'contained' | 'full';

/**
 * The case study below the cover is a list of blocks, arranged in the admin like Dribbble's shot
 * editor. Rendered by components/sections/project/ProjectBlocks.astro.
 */
export type ProjectBlock =
  /** "Label & text": a small label beside a statement or a paragraph. */
  | { type: 'text'; label: string; text: string; size: 'statement' | 'paragraph' }
  /** Notion-style text: headings, paragraphs, lists, quotes, dividers. Sanitised HTML (lib/cms/sanitize.ts#sanitizeBlockText). */
  | { type: 'richtext'; body: string }
  | { type: 'image'; image: CmsImage; width: BlockWidth; caption: string }
  | { type: 'gallery'; images: CmsImage[] }
  | { type: 'video'; source: 'upload' | 'embed'; video: CmsVideo | null; url: string; width: BlockWidth; caption: string }
  | { type: 'results'; label: string; items: ProjectResult[] }
  | { type: 'quote'; quote: string; name: string; role: string };

export type ProjectBlockType = ProjectBlock['type'];
export type SocialLink = { label: string; href: string };

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
};

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  sector: text('sector').notNull(),
  year: text('year').notNull(),
  summary: text('summary').notNull(),
  services: text('services').notNull(),
  client: text('client').notNull(),
  role: text('role').notNull(),
  cover: jsonb('cover').$type<CmsImage>().notNull(),
  /** The case study below the cover. */
  blocks: jsonb('blocks').$type<ProjectBlock[]>().notNull().default([]),
  // Before blocks, the case study had these fixed fields. Migration 0003 copied them into
  // `blocks`; they are kept (no longer edited) so older deployments keep working.
  challenge: text('challenge').notNull().default(''),
  approach: text('approach').notNull().default(''),
  results: jsonb('results').$type<ProjectResult[]>().notNull().default([]),
  gallery: jsonb('gallery').$type<CmsImage[]>().notNull().default([]),
  published: boolean('published').notNull().default(true),
  ...timestamps,
});

export const posts = pgTable('posts', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  category: text('category').notNull(),
  publishedAt: date('published_at', { mode: 'date' }).notNull(),
  excerpt: text('excerpt').notNull(),
  cover: jsonb('cover').$type<CmsImage>().notNull(),
  bodyHtml: text('body_html').notNull(),
  published: boolean('published').notNull().default(true),
  ...timestamps,
});

export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  summary: text('summary').notNull(),
  deliverables: text('deliverables').notNull(),
  image: jsonb('image').$type<CmsImage>().notNull(),
  ...timestamps,
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  quote: text('quote').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  published: boolean('published').notNull().default(true),
  ...timestamps,
});

export const clients = pgTable('clients', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  logo: jsonb('logo').$type<CmsImage>().notNull(),
  displayWidth: integer('display_width').notNull(),
  displayHeight: integer('display_height').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

export const faqs = pgTable('faqs', {
  id: serial('id').primaryKey(),
  question: text('question').notNull(),
  answer: text('answer').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps,
});

/** Messages sent through the website's contact form (read in the admin Inbox). */
export const enquiries = pgTable('enquiries', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  company: text('company').notNull().default(''),
  services: text('services').notNull().default(''),
  budget: text('budget').notNull().default(''),
  message: text('message').notNull().default(''),
  /** The page the form was sent from, e.g. "/contact". */
  page: text('page').notNull().default(''),
  read: boolean('read').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Single-row table (id is always 1). */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  email: text('email').notNull(),
  socialLinks: jsonb('social_links').$type<SocialLink[]>().notNull(),
  bookingFrom: text('booking_from').notNull(),
  /** Optional replacements for the built-in design images; an empty slot keeps the built-in one. */
  siteImages: jsonb('site_images').$type<SiteImages>().notNull().default({}),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

/** Image slots on the home and About pages that the admin can replace (see src/data/site-images.ts). */
export type SiteImages = {
  zoom?: (CmsImage | null)[];
  numbers?: CmsImage | null;
  about?: CmsImage | null;
};

export type ProjectRow = typeof projects.$inferSelect;
export type EnquiryRow = typeof enquiries.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type ClientRow = typeof clients.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
