import { createHash } from 'node:crypto';
import type { CmsImage } from '../db/schema';

/** Delivery URL: automatic format and quality, resized down to `width`, never cropped. */
export function cloudinaryUrl(cloudName: string, publicId: string, width?: number): string {
  const t = ['f_auto', 'q_auto', 'c_limit', width ? `w_${Math.round(width)}` : null].filter(Boolean).join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${t}/${publicId}`;
}

/**
 * Cloudinary signed-upload signature: params sorted by key, joined as k=v with &, then the
 * API secret appended, SHA-1 hex. `file`, `api_key`, `resource_type` and `cloud_name` are never signed.
 */
export function signUploadParams(params: Record<string, string | number>, apiSecret: string): string {
  const payload = Object.keys(params)
    .filter((k) => !['file', 'api_key', 'resource_type', 'cloud_name'].includes(k) && params[k] !== '' && params[k] != null)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return createHash('sha1').update(payload + apiSecret).digest('hex');
}

export function imageSrc(image: CmsImage, cloudName: string | undefined, width?: number): string {
  if (image.publicId && cloudName) return cloudinaryUrl(cloudName, image.publicId, width);
  return image.url ?? '';
}

/** srcset for the widths that do not exceed the original; placeholders get no srcset. */
export function imageSrcset(image: CmsImage, cloudName: string | undefined, widths: number[]): string | undefined {
  if (!image.publicId || !cloudName) return undefined;
  const usable = widths.filter((w) => w <= image.width);
  const list = usable.length ? usable : [image.width];
  return list.map((w) => `${cloudinaryUrl(cloudName, image.publicId!, w)} ${w}w`).join(', ');
}

export function hasImage(image: Partial<CmsImage> | null | undefined): image is CmsImage {
  return !!image && !!(image.publicId || image.url) && Number(image.width) > 0 && Number(image.height) > 0;
}
