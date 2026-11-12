import type { ImageMetadata } from 'astro';
import { zoomImages } from './home';
import numbers from '@/assets/images/zoom-2.jpg';
import about from '@/assets/images/about-studio.jpg';

export type BuiltInImage = { src: ImageMetadata; alt: string };

/**
 * Design images the admin can replace on the Site images page. Each slot falls back to its
 * built-in image here until something is uploaded (settings.site_images).
 */
export const SITE_IMAGE_SLOTS = {
  zoom: { builtIn: zoomImages, recommended: '2400 × 1500' },
  numbers: { builtIn: { src: numbers, alt: 'An empty stadium pool in black and white' }, recommended: '2400 × 1500' },
  about: { builtIn: { src: about, alt: 'The Gandaria Studio space in Semarang' }, recommended: '2400 × 1260' },
} as const;
