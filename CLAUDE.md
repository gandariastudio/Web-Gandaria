# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

This repo started as a distributable Astro theme ("Studiox") and is now the Gandaria Studio site (Semarang, Indonesia; English copy, WIB clock, IDR budgets) with its own admin CMS. The app lives in `studiox/`; the repo root holds `credits.txt`, `documentation/index.html` (the original theme's buyer docs, still describing Studiox and the pre-CMS content setup) and `docs/superpowers/specs/` (design records, including the CMS spec).

**All commands run from `studiox/`.** There is no root `package.json`.

## Commands

npm is the package manager (`package-lock.json`; the theme's old `bun.lock` is gitignored so Vercel uses npm). Node 22.12+ required; Vercel runs Node 24.

```bash
cd studiox
npm run dev          # dev server at http://localhost:4321 (site + /admin)
npm run build        # Vercel build to .vercel/output
npm run check        # astro check (type-checks .astro and .ts)
npm test             # vitest: unit tests + PGlite integration tests (src/**/*.test.ts)
npx vitest run src/lib/db/db.test.ts   # a single test file

npm run db:setup     # one-time Neon setup via neonctl (login, project, dev branch, .env, migrate, seed)
npm run db:migrate   # apply migrations in drizzle/ to DATABASE_URL (or local PGlite)
npm run db:seed      # add sample content if empty; `-- --reset` replaces all content
npm run db:generate  # after editing src/lib/db/schema.ts, generate a new SQL migration
```

`npm run preview` does not work with the Vercel adapter.

## Architecture

### Rendering and caching

`output: 'server'` with `@astrojs/vercel`: every page renders on demand. `src/middleware.ts` loads site settings into `Astro.locals.settings` for public pages and sets `Cache-Control: public, s-maxage=60, stale-while-revalidate=600`, so CMS edits reach visitors within about a minute without a rebuild. `/admin` and `/api/admin` get `no-store` + `noindex`. **`/admin` has no authentication by explicit decision of the owner**; the middleware's `AUTH:` comment is where a password check goes.

### Content: Neon Postgres via Drizzle

- `src/lib/db/schema.ts` — tables `projects`, `posts`, `services`, `testimonials`, `clients`, `faqs`, `enquiries` (contact form messages), and single-row `settings` (email, social links, "booking from", and `site_images`: optional uploads for the home zoom sequence, the Numbers background and the About photo, edited on `/admin/site-images`; an empty slot falls back to the built-in image listed in `src/data/site-images.ts` and rendered by `components/ui/SiteImage.astro`). Images are JSON `CmsImage` (`{ publicId?, url?, width, height, alt }`): uploaded images have a Cloudinary `publicId`; seeded sample content uses `url` pointing at `public/placeholders/`.
- `src/lib/db/client.ts` — `createDb(url, { allowLocal })`: Neon HTTP driver when `DATABASE_URL` is set; otherwise, in dev/tests only, embedded **PGlite** in `.data/pglite` (gitignored). PGlite is single-process: stop `npm run dev` before running `db:*` scripts against it. Neon HTTP has no interactive transactions, so writes are single statements.
- `src/lib/db/index.ts` — `getDb()` for app code (reads `astro:env`); local PGlite auto-migrates and seeds itself on first use. Scripts and tests import `client.ts` directly because they cannot resolve `astro:*`.
- `src/lib/db/queries.ts` — public reads (published rows only, display order) that return the shapes components render. `src/lib/db/admin.ts` — admin lists, `findById`, `save*` (id `null` creates), `removeRow`, `move` (swaps `sort_order`). `seed.ts` + `seed-data.ts` hold the sample content.
- Migrations live in `drizzle/`. Changing the schema means `npm run db:generate`, then `db:migrate` against each Neon branch.

Code-only copy (hero lines, section titles, process steps, principles, stats, zoom images) stays in `src/data/home.ts` and `src/data/pages.ts`; `src/data/site.ts` keeps nav/footer links and `MARK_PATHS` (the Gandaria logo mark: ring, smile and dot, drawn by `LogoMark.astro`, animated in `Loader.astro` and `scripts/site.ts#initMarkHover`; the favicons are generated from it by `scripts/make-icons.ts`).

### Admin (`/admin`)

Plain Astro pages under `src/pages/admin/` on `src/layouts/AdminLayout.astro` (no loader, Lenis or motion). The UI is written for a non-technical team: an icon rail on the left (a bottom bar below 810px), list pages with search and drag-to-reorder, edit pages with a sticky save bar. The admin is styled like the public website: the `--a-*` tokens repeat the site palette (ink, muted, line, fog, orange accent and gradient), corners are sharp, page titles are light and tight, section and card headings use the 7px-square tag, primary buttons use the orange gradient. The layout holds those tokens and all `a-*` classes as global CSS, not Tailwind, so new admin files need no dev-server restart. The dashboard (`pages/admin/index.astro`) uses the website's own utilities (`type-h2`, `tag`, `line-t`, `.btn`) directly; admin pages have no `html.js` class, so the website's hide-until-revealed rules do not apply there. Icons are inline SVGs in `components/admin/Icon.astro`.

Each resource has `index.astro` and `[id].astro` (`/new` creates).
- **List pages** use `ListPage.astro` (header, New button, search, empty states) around `ItemGrid.astro` (image cards) or `ItemRows.astro` (text rows), fed `ListItem`s from `components/admin/types.ts`. Each item has an `ItemMenu.astro` (Edit, View on site, Move up/down, Delete). Their POST goes to `lib/cms/admin-page.ts#handleListPost`: `intent=delete|up|down|reorder` (`ids=3,1,2`). A request with `Accept: application/json` gets `{ ok: true }`; a plain form gets a 303 to `?done=<intent>`.
- **Edit pages** POST to themselves: `readers.*` in `lib/cms/validation.ts` turn FormData into objects (nested names like `results.1.label`, `gallery.0`, images as hidden JSON + `<name>_alt`), Zod schemas validate, errors come back keyed by path and re-render with the submitted values (status 422), success redirects 303 with `?saved=1`. Pages are `EditHeader` + `FormCard`s + `SaveBar` (Published toggle, unsaved-changes state, Discard) + `DangerZone` (delete with a 3-second cancellable countdown, posting to the list page).

Browser behaviour lives in `src/scripts/admin/`: `toast.ts` (toasts, and `initFlash` turns `?saved`/`?done` into a toast then strips it from the URL), `ui.ts` (item menus, list search, countdown delete, slug autofill, dirty tracking with a leave warning), `sortable.ts` (pointer-event drag on `[data-sortable]` lists, posting `intent=reorder`; movement listeners sit on the document because moving the node drops pointer capture; sorting is off while a search filter is active), `image-field.ts` (click or drop, signed Cloudinary upload with progress) and `rich-text.ts` (TipTap).

Article bodies are HTML from a vanilla TipTap editor, sanitised on save by `lib/cms/sanitize.ts`; keep the editor's StarterKit options and the sanitiser allowlist in sync. Read time is derived from the body.

### Images: Cloudinary

The browser asks `POST /api/admin/cloudinary-signature` (folder must be one of projects, journal, services, clients, site) and uploads straight to Cloudinary, which avoids Vercel's 4.5 MB request limit. Public pages render CMS images with `components/ui/CmsImage.astro` (`f_auto,q_auto,c_limit,w_…` srcset; cropping is done by CSS `object-cover`). Image fields have an Adjust dialog (drag + zoom) that stores `crop: { x, y, zoom }` on the `CmsImage` without touching the original: `lib/cms/crop.ts` turns it into a Cloudinary `c_crop` region plus an `object-position` (placeholders only move, they cannot zoom), and `frameLayout` draws the same result in the admin previews, framed in the shape parsed from the field's `recommended` size. Without Cloudinary env vars, upload is disabled and placeholders keep working. Design images that are not CMS content (zoom sequence, about photo) still go through `astro:assets` from `src/assets/images/`.

Env vars (validated by `env.schema` in `astro.config.mjs`, all optional so the site builds without them): `DATABASE_URL`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `GOOGLE_SITE_VERIFICATION` (Search Console HTML-tag value, printed by `Seo.astro`), and `RESEND_API_KEY` + `CONTACT_FROM_EMAIL` (contact form email notifications). See `.env.example`. In production a missing `DATABASE_URL` throws.

PGlite's files are excluded from the Vercel function in `astro.config.mjs` (`localOnlyFiles`), so production must never import it.

### Page shell

`src/layouts/BaseLayout.astro` wraps every public page: SEO head (`utils/seo.ts` → `components/layout/Seo.astro`; canonicals, `robots.txt` and `sitemap.xml` use `site` in `astro.config.mjs`, which must stay the www domain Vercel serves; pages can pass schema.org `jsonLd`, built by `organizationLd`/`articleLd` in `utils/seo.ts`), the Geist font via Astro's Fonts API, `Loader`, `Header`, `Crosshair`, `<main id="top">`, `Footer`, and a single `<script>` importing `src/scripts/main.ts`. An inline head script sets `html.js` (so CSS can hide elements that JS will reveal) and reads `sessionStorage` (`gandaria-*` keys) to skip the loader on repeat visits and to drive the page-transition curtain label. Header, Footer, Faq, Contact and ContactForm read email/socials/booking from `Astro.locals.settings`.

The home page is a flat list of section components from `components/sections/home/`; inner pages share `sections/shared/PageHero.astro` and `NextStep.astro`. Detail pages (`work/[slug]`, `journal/[slug]`) look up the slug and `Astro.rewrite('/404')` when missing. The pricing page, team pages and the home Team / Recognition / Pricing sections were removed on purpose. `pages/500.astro` is the error page; `pages/sitemap.xml.ts` builds the sitemap from the database.

### Styling: Tailwind v4 with design tokens in CSS

`src/styles/global.css` imports Tailwind then three files:

- `variable.css` — the `@theme` block: colour tokens (`ink`, `muted`, `cobalt`, `cobalt-deep`, `cobalt-line`, `sky`, `line`, `bone`, `fog`, `paper`; `cobalt`/`sky` are historical names and hold the orange accent palette), the `--gradient-accent` / `--gradient-accent-deep` fills that `common.css` layers onto every `bg-cobalt` and `bg-cobalt-deep` surface and `.btn-cobalt`, breakpoints (`md` 810px, `lg` 1200px, `xl` 1440px, which follow the original Framer build, not Tailwind defaults), and easing curves.
- `typography.css` — the type scale as `@utility` classes: `type-display`, `type-h1`…`type-h4`, `type-body`, `type-small`, `type-label`, `type-caps`, `type-button`, `type-price`. Use these instead of ad-hoc `text-*` sizes.
- `common.css` — `container-x`, `tag`, hairline utilities (`line-t/b/l/y`, which use inset box-shadow rather than borders), `.btn` variants, `.text-link`, `hover-list`/`hover-row`, `.article-body`, and the `.js [data-…] { visibility: hidden }` rules that pre-hide reveal targets.

`utils/cn.ts` wraps `clsx` + `tailwind-merge` and is extended so the custom colour tokens merge correctly. Use `cn()` when composing class props in components. Admin styles are the `a-*` classes in `AdminLayout.astro`.

The accent colour is also hard-coded in `scripts/pixel-stat.ts` (`ACCENT`) and as the `uTint` uniform in `scripts/hero.ts`; change both if the palette changes. Tailwind only picks up classes in files that existed when the dev server started; restart `npm run dev` after adding new files if utilities seem missing.

### Motion: data-attribute driven, initialised from one entry point

`src/scripts/main.ts` registers GSAP plugins and calls one `init…()` per feature. Removing a call disables that feature. Everything that is purely decorative is gated behind `!prefersReducedMotion()`; the reduced-motion path skips the loader, Lenis smooth scroll, page transitions, reveals and the custom cursor, and sections must remain fully readable without them.

Components opt into behaviour with data attributes rather than importing scripts:

- `data-reveal` (fade/slide, with `data-reveal-amount`, `data-reveal-delay`), `data-text-reveal="line|char"` (SplitText, with `data-tr-*` tuning), `data-img-reveal` (clip-path wipe) — all in `scripts/reveals.ts`. Headings inside `<main>` get a line text-reveal automatically; opt out with `data-no-text-reveal`. Paragraphs, `.btn` and `.text-link` get a block reveal automatically unless inside an element listed in `OWN_MOTION`.
- The crosshair cursor (`scripts/crosshair.ts`) draws lines and a plus only; its text label was removed. `data-cursor-dark` on a section forces the light cursor variant. The leftover `data-cursor="Label"` / `data-cursor-zone` attributes on sections are inert.
- `data-logo`, `data-logo-mark`, `data-cta-slot`, `data-header`, `data-loader`, `data-curtain` are the hooks `scripts/site.ts` uses for the loader, page transition, adaptive header colour (it samples the background luminance under the logo and CTA via `lib/dom.ts#isDarkAt`), and back-to-top.

Shared helpers: `scripts/lib/ease.ts` (named `CustomEase` curves matching the CSS `--ease-*` tokens) and `scripts/lib/dom.ts` (reduced-motion/hover queries, `isDarkAt`, `visible`). Lenis (`scripts/smooth-scroll.ts`) is driven by the GSAP ticker; use `getLenis()`/`lockScroll()`/`scrollToTop()` rather than `window.scroll*`. The page transition intercepts same-origin link clicks at the document level. The hero blob is a WebGL fragment shader inline in `scripts/hero.ts`.

### Contact form

`ContactForm.astro` + `scripts/contact-form.ts` validate client-side, then POST JSON to `pages/api/contact.ts`, which validates with `lib/cms/enquiry.ts#enquirySchema`, drops spam silently (hidden `website` honeypot, or the form open under 3 s via the `elapsed` the browser sends), rate-limits to 5 messages per email per 10 minutes, saves to the `enquiries` table (`lib/db/enquiries.ts`) and then emails the settings address through Resend (`lib/cms/notify.ts`) when `RESEND_API_KEY` is set. Saving comes first and the email never fails the request. Messages are read in the admin Inbox (`/admin/inbox`, unread badge on the rail and a dashboard notice); opening one marks it read.

## Conventions

- Path alias `@/*` → `src/*` (tsconfig). Use it for app imports; `src/lib/db` and `src/lib/cms` use relative imports so scripts and tests can load them outside Astro.
- Placeholder images are labelled with the recommended upload size for their slot (main desktop frame at 2×); the admin image fields repeat those sizes as hints.
- Neon branches: `main` is production (Vercel's `DATABASE_URL`), `dev` is for local work (`.env`).
