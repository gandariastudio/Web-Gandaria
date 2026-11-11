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
};

export type ProjectResult = { value: string; label: string };
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
  challenge: text('challenge').notNull(),
  approach: text('approach').notNull(),
  results: jsonb('results').$type<ProjectResult[]>().notNull(),
  gallery: jsonb('gallery').$type<CmsImage[]>().notNull(),
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

/** Single-row table (id is always 1). */
export const settings = pgTable('settings', {
  id: integer('id').primaryKey().default(1),
  email: text('email').notNull(),
  socialLinks: jsonb('social_links').$type<SocialLink[]>().notNull(),
  bookingFrom: text('booking_from').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type ProjectRow = typeof projects.$inferSelect;
export type PostRow = typeof posts.$inferSelect;
export type ServiceRow = typeof services.$inferSelect;
export type TestimonialRow = typeof testimonials.$inferSelect;
export type ClientRow = typeof clients.$inferSelect;
export type FaqRow = typeof faqs.$inferSelect;
export type SettingsRow = typeof settings.$inferSelect;
