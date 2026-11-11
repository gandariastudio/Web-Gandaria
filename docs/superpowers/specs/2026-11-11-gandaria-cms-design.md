# Gandaria Studio CMS — design

Date: 2026-11-11. Status: approved in chat (sections 1–3 explicitly; the user then asked to proceed without further reviews).

## Goal

Let the studio edit projects, journal posts, services, testimonials, clients, FAQs and site settings from `/admin` without touching code, with changes live on the public site within about a minute.

## Decisions

| Topic | Decision |
|---|---|
| Hosting | Vercel, `@astrojs/vercel` adapter, `output: 'server'` |
| Database | Neon Postgres, created with the `neonctl` CLI (not MCP). Drizzle ORM with the Neon HTTP driver. Branch `main` for production, `dev` for local |
| Local fallback | When `DATABASE_URL` is unset in development, an embedded PGlite database in `.data/pglite` is used so the CMS runs without Neon. Never used in production |
| Images | Cloudinary. Browser uploads directly with a server-signed request (avoids Vercel's 4.5 MB body limit). DB stores `{ publicId, width, height, alt }`. Seed content points at local placeholders `{ url, width, height, alt }` until real images are uploaded |
| Publishing | Public pages render on demand with `Cache-Control: s-maxage=60, stale-while-revalidate=600` |
| Admin access | `/admin` is public and has no password, by explicit user decision. `src/middleware.ts` marks admin responses `noindex` + `no-store` and is the single place to add auth later |
| Admin writes | Implemented as plain form POSTs handled by each admin page (not Astro Actions): nested form fields and per-field error re-rendering were simpler that way |
| Article editor | TipTap (vanilla, no React). HTML is sanitised server-side to p, h2, h3, strong, em, a, ul, ol, li, blockquote, br |
| Scope | Projects, posts, services, testimonials, clients, FAQs, site settings (email, social links, "booking from"). Design copy and stats stay in code |

## Data model

- `projects`: slug (unique), title, sort_order, sector, year, summary, services, client, role, cover (image), challenge, approach, results (exactly 3 `{value,label}`), gallery (exactly 2 images), published, timestamps
- `posts`: slug (unique), title, category, published_at, excerpt, cover, body_html, published, timestamps. Read time is computed from the body
- `services`: slug (unique), title, sort_order, summary, deliverables, image, timestamps
- `testimonials`: quote, name, role, sort_order, published
- `clients`: name, logo, display_width, display_height, sort_order
- `faqs`: question, answer, sort_order
- `settings`: single row (id = 1): email, social_links (`{label,href}[]`), booking_from

## Architecture

- `src/lib/db/`: client (driver selection), schema, queries (public reads returning the shapes components already use), mutations used by admin actions
- `src/lib/cms/`: validation schemas, slugify, read time, sanitiser, Cloudinary URL builder and signer
- `src/components/ui/CmsImage.astro`: renders Cloudinary or placeholder images with `srcset`
- `src/lib/cms/admin-page.ts`: list actions (delete, reorder) and helpers for the self-posting admin forms
- `src/pages/admin/**`: admin pages on a separate `AdminLayout`
- `src/pages/api/admin/cloudinary-signature.ts`: upload signature endpoint
- `src/pages/sitemap.xml.ts`: dynamic sitemap (replaces `@astrojs/sitemap`, which only sees static routes)
- `scripts/`: migrate, seed (from the current sample content), and `setup-neon` (neonctl: create project + dev branch, write `.env`, migrate, seed)

## Errors

Missing env vars fail fast with a message naming them. Public DB failures render an uncached error page. Upload failures show inline and keep the previous image. Validation errors re-render the form with per-field messages and the submitted values.

## Testing

Vitest unit tests for validation, slugify, read time, sanitiser, Cloudinary URL/signature, and row-to-shape mapping. Integration against PGlite (migrate + seed + queries). Browser walkthrough of every admin flow. `astro check` and a production build.

## Out of scope

Auth, version history, multiple users, deleting Cloudinary assets, editing stats or design copy, the Vercel deploy itself.
