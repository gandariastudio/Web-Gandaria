export const SITE_URL = import.meta.env.SITE ?? 'https://www.gandariastudio.com';
export const SITE_NAME = 'Gandaria Studio';
export const DEFAULT_TITLE = 'Gandaria Studio — Independent Creative Studio in Semarang';
export const DEFAULT_DESCRIPTION =
  'Gandaria Studio is an independent creative studio in Semarang, Indonesia. We build brands, websites and content for businesses that have outgrown how they look.';
export const DEFAULT_IMAGE = '/og-image.jpg';

export interface PageMeta {
  title: string;
  description: string;
  canonical: string;
  image: string;
  noindex: boolean;
}

const absolute = (path: string) => new URL(path, SITE_URL).href;

export function pageMeta(
  options: { title?: string; description?: string; path?: string; image?: string; noindex?: boolean } = {},
): PageMeta {
  return {
    title: options.title ? `${options.title} | ${SITE_NAME}` : DEFAULT_TITLE,
    description: options.description ?? DEFAULT_DESCRIPTION,
    canonical: absolute(options.path ?? '/'),
    image: absolute(options.image ?? DEFAULT_IMAGE),
    noindex: options.noindex ?? false,
  };
}

/* ---------- structured data (JSON-LD) ---------- */

type JsonLd = Record<string, unknown>;

/** Social links that point at a real profile (not a bare placeholder like https://www.instagram.com). */
const realProfiles = (links: { href: string }[]) =>
  links.map((l) => l.href).filter((href) => {
    try {
      return new URL(href).pathname.replace(/\/+$/, '') !== '';
    } catch {
      return false;
    }
  });

/** The studio as a business: shown on the home page so Google can build a knowledge panel. */
export function organizationLd(settings: { email: string; socialLinks: { href: string }[] }): JsonLd {
  const sameAs = realProfiles(settings.socialLinks);
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': absolute('/#organization'),
    name: SITE_NAME,
    url: absolute('/'),
    logo: absolute('/web-app-manifest-512x512.png'),
    image: absolute(DEFAULT_IMAGE),
    description: DEFAULT_DESCRIPTION,
    email: settings.email,
    address: { '@type': 'PostalAddress', addressLocality: 'Semarang', addressRegion: 'Central Java', addressCountry: 'ID' },
    areaServed: 'Worldwide',
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** A journal article. */
export function articleLd(post: { title: string; excerpt: string; slug: string; publishedAt: Date; updatedAt: Date; image?: string }): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    url: absolute(`/journal/${post.slug}`),
    mainEntityOfPage: absolute(`/journal/${post.slug}`),
    datePublished: post.publishedAt.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    ...(post.image ? { image: absolute(post.image) } : {}),
    author: { '@type': 'Organization', name: SITE_NAME, url: absolute('/') },
    publisher: { '@id': absolute('/#organization'), '@type': 'Organization', name: SITE_NAME, logo: absolute('/web-app-manifest-512x512.png') },
  };
}
