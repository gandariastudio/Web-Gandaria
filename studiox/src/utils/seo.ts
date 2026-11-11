export const SITE_URL = import.meta.env.SITE ?? 'https://gandariastudio.com';
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
