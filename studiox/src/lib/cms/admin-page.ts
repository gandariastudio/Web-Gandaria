import type { AstroGlobal } from 'astro';
import { CLOUDINARY_CLOUD_NAME } from 'astro:env/server';
import type { Db } from '../db/client';
import { move, removeRow, type OrderedResource, type Resource } from '../db/admin';
import type { CmsImage } from '../db/schema';
import { imageSrc } from './cloudinary';

/** Handles the delete / move-up / move-down buttons of an admin list, then redirects back (POST-redirect-GET). */
export async function handleListPost(Astro: AstroGlobal, db: Db, resource: Resource): Promise<Response | undefined> {
  if (Astro.request.method !== 'POST') return undefined;
  const form = await Astro.request.formData();
  const id = Number(form.get('id'));
  const intent = String(form.get('intent') ?? '');
  if (Number.isInteger(id) && id > 0) {
    if (intent === 'delete') await removeRow(db, resource, id);
    else if ((intent === 'up' || intent === 'down') && resource !== 'posts') {
      await move(db, resource as OrderedResource, id, intent === 'up' ? -1 : 1);
    }
  }
  return Astro.redirect(`${Astro.url.pathname}?done=${encodeURIComponent(intent)}`, 303);
}

/** "new" for the create form, a positive integer id, or null for anything else (404). */
export function parseId(param: string | undefined): number | 'new' | null {
  if (param === 'new') return 'new';
  const n = Number(param);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export function saveErrorMessage(error: unknown): string {
  console.error('[admin] save failed', error);
  return 'Could not save. Check the database connection and try again.';
}

export const thumb = (image: CmsImage | null | undefined) => (image ? imageSrc(image, CLOUDINARY_CLOUD_NAME, 160) : undefined);

export const toDateInput = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? ''));

export const excerpt = (text: string, max = 90) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);
