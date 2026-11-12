import type { APIRoute } from 'astro';
import { CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, CLOUDINARY_CLOUD_NAME } from 'astro:env/server';
import { signUploadParams } from '@/lib/cms/cloudinary';

/** Folders the admin may upload into (always under gandaria/). */
const FOLDERS = new Set(['projects', 'journal', 'services', 'clients', 'site']);

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return json({ error: 'Cloudinary is not configured. Add the CLOUDINARY_* keys to the environment.' }, 503);
  }
  const body = (await request.json().catch(() => ({}))) as { folder?: string };
  const name = String(body.folder ?? '');
  if (!FOLDERS.has(name)) return json({ error: 'Unknown upload folder' }, 400);

  const params = { folder: `gandaria/${name}`, timestamp: Math.floor(Date.now() / 1000) };
  const signature = signUploadParams(params, CLOUDINARY_API_SECRET);
  return json({ cloudName: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, signature, ...params });
};
