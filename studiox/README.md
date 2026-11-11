# Gandaria Studio website

Astro 7 site with Tailwind CSS v4, GSAP and Lenis, plus an admin CMS at `/admin`.
Content lives in Neon Postgres, images in Cloudinary, and the site deploys to Vercel.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:4321 for the site and http://localhost:4321/admin for the CMS.
Without a `DATABASE_URL`, development uses a local database in `.data/pglite` that fills itself with sample content.

## Connect Neon (once)

```bash
npm run db:setup
```

This logs in to Neon in the browser if needed, creates the `gandaria-studio` project in Singapore, migrates and seeds the `main` branch (production), creates a `dev` branch from it, and writes the dev connection string to `.env`. Run it again any time; it reuses what exists.

## Connect Cloudinary

Copy the values from Cloudinary (Settings > API Keys) into `.env`, using `.env.example` as the template:

```
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Until these are set, image upload in `/admin` is switched off and the site keeps showing the placeholder images.

## Deploy to Vercel

Set these environment variables in the Vercel project:

| Variable | Value |
| --- | --- |
| `DATABASE_URL` | Connection string of the Neon `main` branch (`npm run db:setup` prints the command to get it) |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Same as `.env` |

Saved changes in `/admin` reach the public site within about a minute, without a redeploy.

> `/admin` has no password yet. Anyone who knows the address can edit content and upload images. Add a check in `src/middleware.ts` (look for `AUTH:`) before sharing the site widely.

## Commands

| Command | Action |
| --- | --- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Production build for Vercel |
| `npm run check` | Type-check `.astro` and `.ts` files |
| `npm test` | Unit and database tests |
| `npm run db:setup` | Create and connect the Neon database |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed` | Add sample content to an empty database (`-- --reset` replaces everything) |
| `npm run db:generate` | Create a migration after changing `src/lib/db/schema.ts` |

## Pages

`/`, `/about`, `/services`, `/work`, `/work/[slug]`, `/journal`, `/journal/[slug]`, `/contact`, `/privacy`, `/404`, plus `/admin`.

Breakpoints follow the original Framer build: phone below 810px, tablet 810–1439px, desktop from 1440px.
