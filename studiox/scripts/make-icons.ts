/**
 * Regenerate the favicons in public/ from the logo mark in src/data/site.ts:
 * a white Gandaria mark on the orange accent gradient.
 * Run with `npm run icons` after changing the mark or the accent colours.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { MARK_PATHS } from '../src/data/site';

const PUBLIC = fileURLToPath(new URL('../public/', import.meta.url));
const [FROM, TO] = ['#f68a1e', '#f15822']; // --gradient-accent in src/styles/variable.css
const MARK_W = 829;
const MARK_H = 1005;

/** Square icon; `markHeight` is the mark's share of the tile height, `radius` its corner rounding. */
function iconSvg(size: number, markHeight: number, radius = 0) {
  const h = size * markHeight;
  const scale = h / MARK_H;
  const x = (size - MARK_W * scale) / 2;
  const y = (size - h) / 2;
  const { ring, smile, dot } = MARK_PATHS;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${FROM}"/><stop offset="1" stop-color="${TO}"/></linearGradient></defs>
<rect width="${size}" height="${size}" rx="${radius}" fill="url(#g)"/>
<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(5)})" fill="#fff">
<path fill-rule="evenodd" d="${ring}"/><path d="${smile}"/><circle cx="${dot.cx}" cy="${dot.cy}" r="${dot.r}"/>
</g></svg>`;
}

const png = (svg: string) => sharp(Buffer.from(svg)).png().toBuffer();

/** An .ico that wraps PNG images (supported by every current browser). */
function ico(images: { size: number; data: Buffer }[]) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const e = 6 + i * 16;
    header.writeUInt8(size >= 256 ? 0 : size, e);
    header.writeUInt8(size >= 256 ? 0 : size, e + 1);
    header.writeUInt16LE(1, e + 4);
    header.writeUInt16LE(32, e + 6);
    header.writeUInt32LE(data.length, e + 8);
    header.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((i) => i.data)]);
}

// Browser tab icons: square tile with sharp corners, mark large enough to read at 16px.
writeFileSync(`${PUBLIC}favicon.svg`, iconSvg(64, 0.7));
writeFileSync(`${PUBLIC}favicon-96x96.png`, await png(iconSvg(96, 0.7)));
const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await png(iconSvg(size, 0.7)) })));
writeFileSync(`${PUBLIC}favicon.ico`, ico(icoImages));
// Home screen icons: square (the OS rounds them); the mark stays inside the maskable safe zone.
writeFileSync(`${PUBLIC}apple-touch-icon.png`, await png(iconSvg(180, 0.56)));
writeFileSync(`${PUBLIC}web-app-manifest-192x192.png`, await png(iconSvg(192, 0.5)));
writeFileSync(`${PUBLIC}web-app-manifest-512x512.png`, await png(iconSvg(512, 0.5)));
console.log('Icons written to public/');
