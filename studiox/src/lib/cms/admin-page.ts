import type { AstroGlobal } from 'astro';
import { CLOUDINARY_CLOUD_NAME } from 'astro:env/server';
import type { Db } from '../db/client';
import { move, removeRow, reorder, type OrderedResource, type Resource } from '../db/admin';
import type { CmsImage } from '../db/schema';
import { imageSrc } from './cloudinary';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

/**
 * List actions, posted by the list page itself (POST-redirect-GET) or by the drag-and-drop
 * script (Accept: application/json, answered with JSON instead of a redirect):
 *   intent=delete&id=…   intent=up|down&id=…   intent=reorder&ids=3,1,2
 * `back` (optional) is where to redirect afterwards, e.g. the list after deleting from an edit page.
 */
export async function handleListPost(Astro: AstroGlobal, db: Db, resource: Resource): Promise<Response | undefined> {
  if (Astro.request.method !== 'POST') return undefined;
  const wantsJson = (Astro.request.headers.get('accept') ?? '').includes('application/json');
  const form = await Astro.request.formData();
  const intent = String(form.get('intent') ?? '');
  const id = Number(form.get('id'));
  const ordered = resource !== 'posts' && resource !== 'enquiries';
  try {
    if (intent === 'reorder' && ordered) {
      const ids = String(form.get('ids') ?? '').split(',').map(Number);
      await reorder(db, resource as OrderedResource, ids);
    } else if (Number.isInteger(id) && id > 0) {
      if (intent === 'delete') await removeRow(db, resource, id);
      else if ((intent === 'up' || intent === 'down') && ordered) await move(db, resource as OrderedResource, id, intent === 'up' ? -1 : 1);
    }
  } catch (error) {
    console.error('[admin] list action failed', error);
    if (wantsJson) return json({ ok: false, error: 'Could not save. Try again.' }, 500);
    throw error;
  }
  if (wantsJson) return json({ ok: true });
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
  return 'Could not save. Check the connection and try again.';
}

export const thumb = (image: CmsImage | null | undefined, width = 480) => (image ? imageSrc(image, CLOUDINARY_CLOUD_NAME, width) : undefined);

export const toDateInput = (value: unknown) => (value instanceof Date ? value.toISOString().slice(0, 10) : String(value ?? ''));

export const excerpt = (text: string, max = 110) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text);

/** "3 min ago", "Yesterday", "12 Nov" */
export function relativeTime(date: Date, now = new Date()): string {
  const s = Math.round((now.getTime() - date.getTime()) / 1000);
  if (s < 60) return 'Just now';
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  if (s < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: date.getFullYear() === now.getFullYear() ? undefined : 'numeric' });
}
