// @ts-check
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { defineConfig, envField, fontProviders } from 'astro/config';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

// PGlite is only the local development database. It never loads in production, so keep its
// ~17 MB of files out of the Vercel function (the adapter excludes exact file paths only).
const localOnlyFiles = (() => {
  try {
    return readdirSync('node_modules/@electric-sql/pglite', { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => './' + relative('.', join(entry.parentPath, entry.name)));
  } catch {
    return [];
  }
})();

// sanitize-html is CommonJS but requires the ESM-only htmlparser2, and Vercel's runtime has no
// require(esm). Production builds therefore bundle sanitize-html with its whole dependency tree:
// bundling only part of it hides the rest from Vercel's file tracing and they are never deployed.
const sanitizeHtmlTree = (() => {
  const seen = new Set();
  const walk = (/** @type {string} */ name) => {
    if (seen.has(name)) return;
    seen.add(name);
    const pkg = JSON.parse(readFileSync(`node_modules/${name}/package.json`, 'utf8'));
    Object.keys(pkg.dependencies ?? {}).forEach(walk);
  };
  walk('sanitize-html');
  return [...seen];
})();

export default defineConfig({
  site: 'https://gandariastudio.com',

  // Pages render on demand so CMS edits show up without a rebuild. Public pages are cached
  // at the Vercel edge for about a minute (see src/middleware.ts).
  output: 'server',
  adapter: vercel({ excludeFiles: localOnlyFiles }),

  env: {
    schema: {
      DATABASE_URL: envField.string({ context: 'server', access: 'secret', optional: true }),
      CLOUDINARY_CLOUD_NAME: envField.string({ context: 'server', access: 'secret', optional: true }),
      CLOUDINARY_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CLOUDINARY_API_SECRET: envField.string({ context: 'server', access: 'secret', optional: true }),
    },
  },

  image: {
    responsiveStyles: false,
  },

  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Geist',
      cssVariable: '--font-geist-face',
      fallbacks: ['ui-sans-serif', 'system-ui', 'sans-serif'],
      options: {
        variants: [{ src: ['./src/assets/fonts/Geist-Variable.woff2'], weight: '100 900', style: 'normal' }],
      },
    },
  ],

  vite: {
    plugins: [
      tailwindcss(),
      // See sanitizeHtmlTree. Dev skips this: Vite's dev runner cannot run inlined CommonJS,
      // and local Node supports require(esm).
      {
        name: 'bundle-sanitize-html',
        config: (_, { command }) => (command === 'build' ? { ssr: { noExternal: sanitizeHtmlTree } } : undefined),
      },
    ],
    // PGlite is the local-only fallback database. Keep it out of the server bundle.
    ssr: { external: ['@electric-sql/pglite'] },
    optimizeDeps: { exclude: ['@electric-sql/pglite'] },
  },
});
