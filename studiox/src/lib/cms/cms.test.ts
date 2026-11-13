import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';
import { countWords, readTime } from './read-time';
import { sanitizeArticle } from './sanitize';
import { cloudinaryUrl, hasImage, imagePosition, imageSrc, imageSrcset, signUploadParams } from './cloudinary';
import { cropRegion, frameLayout, MAX_ZOOM, normalizeCrop, parseAspect } from './crop';

describe('slugify', () => {
  it('lowercases, strips accents and joins with hyphens', () => {
    expect(slugify('Kopi Pelabuhan')).toBe('kopi-pelabuhan');
    expect(slugify('  Café Gema — 2026!  ')).toBe('cafe-gema-2026');
    expect(slugify('Rasa & Kota')).toBe('rasa-and-kota');
  });
  it('caps length at 80 without a trailing hyphen', () => {
    const s = slugify('word '.repeat(40));
    expect(s.length).toBeLessThanOrEqual(80);
    expect(s.endsWith('-')).toBe(false);
  });
});

describe('readTime', () => {
  it('counts words in HTML and rounds to minutes, minimum one', () => {
    expect(countWords('<p>Hello <strong>big</strong> world</p>')).toBe(3);
    expect(readTime('<p>short</p>')).toBe('1 min read');
    expect(readTime(`<p>${'word '.repeat(1000)}</p>`)).toBe('5 min read');
  });
});

describe('sanitizeArticle', () => {
  it('keeps editor tags and drops scripts, styles and unknown attributes', () => {
    const html = sanitizeArticle('<h1>T</h1><p style="color:red" onclick="x()">Hi <b>there</b><script>alert(1)</script></p><img src=x>');
    expect(html).toBe('<h2>T</h2><p>Hi <strong>there</strong></p>');
  });
  it('opens external links in a new tab and blocks javascript: links', () => {
    expect(sanitizeArticle('<p><a href="https://example.com">x</a></p>')).toBe('<p><a href="https://example.com" target="_blank" rel="noopener noreferrer">x</a></p>');
    expect(sanitizeArticle('<p><a href="javascript:alert(1)">x</a></p>')).toBe('<p><a>x</a></p>');
  });
  it('removes empty paragraphs left by the editor', () => {
    expect(sanitizeArticle('<p>One</p><p></p><p> </p>')).toBe('<p>One</p>');
  });
});

describe('cloudinary', () => {
  it('signs upload params the way Cloudinary documents it', () => {
    // Example from the Cloudinary "Generating authentication signatures" docs.
    const sig = signUploadParams({ eager: 'w_400,h_300,c_pad|w_260,h_200,c_crop', public_id: 'sample_image', timestamp: 1315060510 }, 'abcd');
    expect(sig).toBe('bfd09f95f331f558cbd1320e67aa8d488770583e');
  });
  it('never signs file, api_key, resource_type or cloud_name', () => {
    const a = signUploadParams({ timestamp: 1, folder: 'x' }, 's');
    const b = signUploadParams({ timestamp: 1, folder: 'x', api_key: 'k', file: 'f', resource_type: 'image', cloud_name: 'c' }, 's');
    expect(a).toBe(b);
  });
  it('builds delivery URLs and srcsets capped at the original width', () => {
    expect(cloudinaryUrl('demo', 'gandaria/projects/a', 800)).toBe('https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_800/gandaria/projects/a');
    const img = { publicId: 'p', width: 1000, height: 500, alt: 'a' };
    expect(imageSrcset(img, 'demo', [480, 900, 1500])).toBe(
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_480/p 480w, https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,c_limit,w_900/p 900w',
    );
  });
  it('falls back to the placeholder URL when there is no Cloudinary image or cloud name', () => {
    const placeholder = { url: '/placeholders/a.jpg', width: 10, height: 10, alt: 'a' };
    expect(imageSrc(placeholder, 'demo', 400)).toBe('/placeholders/a.jpg');
    expect(imageSrcset(placeholder, 'demo', [400])).toBeUndefined();
    expect(imageSrc({ publicId: 'p', width: 10, height: 10, alt: 'a' }, undefined)).toBe('');
  });
  it('hasImage needs a source and positive dimensions', () => {
    expect(hasImage({ url: '/a.jpg', width: 1, height: 1, alt: '' })).toBe(true);
    expect(hasImage({ width: 1, height: 1, alt: '' })).toBe(false);
    expect(hasImage(null)).toBe(false);
  });
});

describe('image crop', () => {
  it('keeps the chosen point in view and clamps the region to the image', () => {
    expect(cropRegion(2400, 1600, { x: 0.5, y: 0.5, zoom: 2 })).toEqual({ left: 600, top: 400, width: 1200, height: 800, fx: 0.5, fy: 0.5 });
    const corner = cropRegion(2400, 1600, { x: 0.95, y: 0.05, zoom: 2 });
    expect([corner.left, corner.top]).toEqual([1200, 0]);
    expect(corner.fx).toBeCloseTo(0.9);
    expect(normalizeCrop({ x: 3, y: -1, zoom: 9 })).toEqual({ x: 1, y: 0, zoom: MAX_ZOOM });
  });
  it('lays the original out in a frame like object-fit: cover', () => {
    // A 2:1 image in a square frame, centred, no zoom: twice as wide as the frame, centred.
    expect(frameLayout(2000, 1000, null, 100, 100)).toMatchObject({ left: -50, top: 0, width: 200, height: 100 });
    // Moved to the left edge.
    expect(frameLayout(2000, 1000, { x: 0, y: 0.5, zoom: 1 }, 100, 100).left).toBeCloseTo(0);
    expect(parseAspect('2400 × 1350 (16:9)')).toEqual([2400, 1350]);
    expect(parseAspect(undefined)).toEqual([16, 10]);
  });
  it('asks Cloudinary for the zoomed region and positions it', () => {
    const img = { publicId: 'p', width: 2400, height: 1600, alt: '', crop: { x: 0.25, y: 0.5, zoom: 2 } };
    expect(imageSrc(img, 'demo', 800)).toBe('https://res.cloudinary.com/demo/image/upload/c_crop,x_0,y_400,w_1200,h_800/f_auto,q_auto,c_limit,w_800/p');
    expect(imageSrcset(img, 'demo', [800, 1600])).toContain('w_800/p 800w');
    expect(imageSrcset(img, 'demo', [800, 1600])).not.toContain('1600w');
    expect(imagePosition(img)).toBe('50.00% 50.00%');
    expect(imagePosition({ ...img, crop: null })).toBeUndefined();
    // Placeholders cannot be zoomed: only the point is used.
    expect(imagePosition({ url: '/x.jpg', width: 2400, height: 1600, alt: '', crop: { x: 0.25, y: 0.5, zoom: 2 } })).toBe('25.00% 50.00%');
  });
});
