import { createHash } from 'node:crypto';
import type { CmsImage } from '../db/schema';
import { cropRegion, isDefaultCrop } from './crop';

type Region = { left: number; top: number; width: number; height: number };

/**
 * Delivery URL: automatic format and quality, resized down to `width`. With a `region` (the
 * zoomed part chosen in the admin) Cloudinary cuts that out first; the original stays untouched.
 */
export function cloudinaryUrl(cloudName: string, publicId: string, width?: number, region?: Region): string {
  const cut = region ? `c_crop,x_${region.left},y_${region.top},w_${region.width},h_${region.height}/` : '';
  const t = ['f_auto', 'q_auto', 'c_limit', width ? `w_${Math.round(width)}` : null].filter(Boolean).join(',');
  return `https://res.cloudinary.com/${cloudName}/image/upload/${cut}${t}/${publicId}`;
}

/** The zoomed region to request from Cloudinary, or undefined when the image is not zoomed. */
export function zoomRegion(image: CmsImage): Region | undefined {
  if (!image.crop || isDefaultCrop(image.crop) || image.crop.zoom <= 1) return undefined;
  const r = cropRegion(image.width, image.height, image.crop);
  return { left: r.left, top: r.top, width: r.width, height: r.height };
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

/** Image URL, zoomed as set in the admin (zoom needs Cloudinary; placeholders only move). */
export function imageSrc(image: CmsImage, cloudName: string | undefined, width?: number): string {
  if (image.publicId && cloudName) return cloudinaryUrl(cloudName, image.publicId, width, zoomRegion(image));
  return image.url ?? '';
}

/** srcset for the widths that do not exceed the (zoomed) source; placeholders get no srcset. */
export function imageSrcset(image: CmsImage, cloudName: string | undefined, widths: number[]): string | undefined {
  if (!image.publicId || !cloudName) return undefined;
  const region = zoomRegion(image);
  const max = region ? region.width : image.width;
  const usable = widths.filter((w) => w <= max);
  const list = usable.length ? usable : [max];
  return list.map((w) => `${cloudinaryUrl(cloudName, image.publicId!, w, region)} ${w}w`).join(', ');
}

/** CSS object-position that keeps the chosen point in view, or undefined when centred. */
export function imagePosition(image: CmsImage): string | undefined {
  if (!image.crop || isDefaultCrop(image.crop)) return undefined;
  // Placeholders cannot be zoomed, so only their point is used.
  const crop = image.publicId ? image.crop : { ...image.crop, zoom: 1 };
  const r = cropRegion(image.width, image.height, crop);
  return `${(r.fx * 100).toFixed(2)}% ${(r.fy * 100).toFixed(2)}%`;
}

export function hasImage(image: Partial<CmsImage> | null | undefined): image is CmsImage {
  return !!image && !!(image.publicId || image.url) && Number(image.width) > 0 && Number(image.height) > 0;
}
