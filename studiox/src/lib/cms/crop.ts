/**
 * Image framing chosen in the admin's Adjust dialog: a point of the original to keep in view and
 * a zoom level. The original upload is never changed. Public pages ask Cloudinary for the zoomed
 * region (`c_crop`) and place it with CSS `object-position`; the admin preview draws the same
 * result with `frameLayout`. Pure functions, shared by the server and the admin script.
 */
import type { ImageCrop } from '../db/schema';

export type { ImageCrop };

export const MAX_ZOOM = 4;
export const DEFAULT_CROP: ImageCrop = { x: 0.5, y: 0.5, zoom: 1 };

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const finite = (n: unknown, fallback: number) => (typeof n === 'number' && Number.isFinite(n) ? n : fallback);

export function normalizeCrop(crop: Partial<ImageCrop> | null | undefined): ImageCrop {
  return {
    x: clamp(finite(crop?.x, 0.5), 0, 1),
    y: clamp(finite(crop?.y, 0.5), 0, 1),
    zoom: clamp(finite(crop?.zoom, 1), 1, MAX_ZOOM),
  };
}

export const isDefaultCrop = (crop: Partial<ImageCrop> | null | undefined) => {
  const c = normalizeCrop(crop);
  return c.zoom === 1 && c.x === 0.5 && c.y === 0.5;
};

/**
 * The part of the original to show, in original pixels, plus where the chosen point sits inside
 * it (0–1). That position is used as the CSS `object-position`, so the point stays in view in any
 * frame shape.
 */
export function cropRegion(width: number, height: number, crop: Partial<ImageCrop> | null | undefined) {
  const c = normalizeCrop(crop);
  const w = Math.max(1, Math.round(width / c.zoom));
  const h = Math.max(1, Math.round(height / c.zoom));
  const left = Math.round(clamp(c.x * width - w / 2, 0, width - w));
  const top = Math.round(clamp(c.y * height - h / 2, 0, height - h));
  return {
    left,
    top,
    width: w,
    height: h,
    fx: clamp((c.x * width - left) / w, 0, 1),
    fy: clamp((c.y * height - top) / h, 0, 1),
  };
}

/**
 * Where the whole original lands inside a frame of the given shape, as percentages of the frame,
 * reproducing "crop region + object-fit: cover + object-position". Used for the admin previews.
 */
export function frameLayout(width: number, height: number, crop: Partial<ImageCrop> | null | undefined, frameW: number, frameH: number) {
  const r = cropRegion(width, height, crop);
  const s = Math.max(frameW / r.width, frameH / r.height);
  const regionX = (frameW - r.width * s) * r.fx;
  const regionY = (frameH - r.height * s) * r.fy;
  return {
    left: ((regionX - r.left * s) / frameW) * 100,
    top: ((regionY - r.top * s) / frameH) * 100,
    width: ((width * s) / frameW) * 100,
    height: ((height * s) / frameH) * 100,
    /** Frame pixels per original pixel, for turning a drag into a change of the crop point. */
    scale: s,
  };
}

/** "2400 × 1350 (16:9)" → [2400, 1350]; anything unreadable → 16:10. */
export function parseAspect(recommended: string | undefined): [number, number] {
  const m = recommended?.match(/(\d+)\s*[×x]\s*(\d+)/);
  return m ? [Number(m[1]), Number(m[2])] : [16, 10];
}
