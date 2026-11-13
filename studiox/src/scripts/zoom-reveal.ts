import { clamp01, inOutCubic, prefersReducedMotion } from './lib/dom';
import { smoothing } from './smooth-scroll';

const START_SIZE = 300;
const HOLD = 0.06;
const END = 0.9;

/** Display size, and how far the photo's centre sits from the stage centre once full screen. */
type Geometry = { dw: number; dh: number; ox: number; oy: number };

/** "50.00% 0.52%" (object-position from the admin's Adjust dialog) → [0.5, 0.0052]. */
function position(img: HTMLImageElement): [number, number] {
  const [x = '50%', y = '50%'] = (img.style.objectPosition || '').split(/\s+/).filter(Boolean);
  const pct = (v: string) => (v.endsWith('%') ? Math.min(1, Math.max(0, parseFloat(v) / 100)) : 0.5);
  return [pct(x), pct(y)];
}

/**
 * Give each photo its own shape: the size at which it covers the w × h stage, placed by its
 * object-position. Clipping is left to the stage, so the photo is never cut by its own box (a
 * screen-sized box would crop wide photos on tall phone screens).
 */
function layout(img: HTMLImageElement, w: number, h: number): Geometry {
  const iw = Number(img.getAttribute('width')) || img.naturalWidth || w;
  const ih = Number(img.getAttribute('height')) || img.naturalHeight || h;
  const cover = Math.max(w / iw, h / ih);
  const dw = iw * cover;
  const dh = ih * cover;
  const [px, py] = position(img);
  const x = (w - dw) * px;
  const y = (h - dh) * py;
  Object.assign(img.style, {
    inset: 'auto',
    left: `${x}px`,
    top: `${y}px`,
    width: `${dw}px`,
    height: `${dh}px`,
    maxWidth: 'none',
    transformOrigin: '50% 50%',
  });
  // Let the browser pick a file wide enough for the real display width, not just the screen width.
  if (img.srcset) img.sizes = `${Math.ceil(dw)}px`;
  return { dw, dh, ox: x + dw / 2 - w / 2, oy: y + dh / 2 - h / 2 };
}

export function initZoomReveal() {
  const root = document.querySelector<HTMLElement>('[data-zoom]');
  if (!root) return;
  const stage = root.firstElementChild as HTMLElement;
  const clip = root.querySelector<HTMLElement>('[data-zoom-clip]')!;
  const imgs = Array.from(root.querySelectorAll<HTMLImageElement>('[data-zoom-img]'));
  const left = root.querySelector<HTMLElement>('[data-zoom-left]')!;
  const right = root.querySelector<HTMLElement>('[data-zoom-right]')!;
  const top = root.querySelector<HTMLElement>('[data-zoom-top]')!;
  const count = root.querySelector<HTMLElement>('[data-zoom-count]')!;
  const reduced = prefersReducedMotion();
  const n = imgs.length;
  const total = String(n).padStart(2, '0');

  let geometry: Geometry[] = [];
  let laidOut = '';
  let p = 0;
  let target = 0;
  let current = -1;
  let raf = 0;

  const show = (i: number) => {
    if (i === current) return;
    current = i;
    imgs.forEach((img, k) => img.classList.toggle('is-current', k === i));
    count.textContent = `${String(i + 1).padStart(2, '0')} / ${total}`;
  };

  const render = () => {
    const w = stage.offsetWidth;
    const h = stage.offsetHeight;
    const e = inOutCubic(p);
    const phone = w < 810;
    const s = Math.min(START_SIZE, w * (phone ? 0.5 : 0.24));
    const sh = s * 1.25;
    const iy = ((h - sh) / 2) * (1 - e);
    const ix = ((w - s) / 2) * (1 - e);
    clip.style.clipPath = `inset(${iy.toFixed(2)}px ${ix.toFixed(2)}px ${iy.toFixed(2)}px ${ix.toFixed(2)}px round ${(2 * (1 - e)).toFixed(2)}px)`;
    // The photo grows with the frame: while the frame is small, each image is scaled down so it
    // covers the small frame (most of the picture shows), and it ends at 1:1 when the frame fills
    // the screen, so it is never enlarged past its own resolution.
    if (laidOut !== `${w}x${h}`) {
      laidOut = `${w}x${h}`;
      geometry = imgs.map((img) => layout(img, w, h));
    }
    // Small: centred in the frame and just covering it. Full screen: 1:1 at its chosen position.
    imgs.forEach((img, i) => {
      const { dw, dh, ox, oy } = geometry[i];
      const k = Math.min(1, Math.max(s / dw, sh / dh));
      img.style.scale = (k + (1 - k) * e).toFixed(4);
      img.style.translate = `${(-ox * (1 - e)).toFixed(2)}px ${(-oy * (1 - e)).toFixed(2)}px`;
    });

    const wordOpacity = clamp01(1 - e * 1.8);
    const spread = (w / 2) * 0.55 * e;
    const gap = phone ? 44 : 36;
    const labelGap = phone ? 12 : 16;
    if (phone) {
      left.style.transform = `translate3d(${-s / 2}px, calc(-100% - ${sh / 2 + gap + spread * 0.4}px), 0)`;
      right.style.transform = `translate3d(calc(${s / 2}px - 100%), ${sh / 2 + gap + spread * 0.4}px, 0)`;
    } else {
      left.style.transform = `translate3d(calc(-100% - ${s / 2 + gap + spread}px), ${-sh / 2 - 4}px, 0)`;
      right.style.transform = `translate3d(${s / 2 + gap + spread}px, calc(${sh / 2 + 6}px - 100%), 0)`;
    }
    left.style.opacity = String(wordOpacity);
    right.style.opacity = String(wordOpacity);
    const labelOpacity = clamp01(1 - e * 2.2);
    top.style.transform = `translate3d(${-s / 2}px, calc(-100% - ${sh / 2 + labelGap + e * 50}px), 0)`;
    top.style.opacity = String(labelOpacity);
    count.style.transform = `translate3d(calc(${s / 2}px - 100%), ${sh / 2 + labelGap + e * 50}px, 0)`;
    count.style.opacity = String(labelOpacity);
  };

  const measure = () => {
    const r = root.getBoundingClientRect();
    const range = Math.max(1, r.height - window.innerHeight);
    const progress = clamp01(-r.top / range);
    target = reduced ? Number(progress > HOLD) : clamp01((progress - HOLD) / Math.max(0.01, END - HOLD));
  };
  const tick = () => {
    raf = 0;
    p += (target - p) * smoothing(0.14);
    if (Math.abs(target - p) < 4e-4) p = target;
    show(Math.min(n - 1, Math.floor(clamp01(p) * n * 0.9999)));
    render();
    if (p !== target) raf = requestAnimationFrame(tick);
  };
  const update = () => {
    const r = root.getBoundingClientRect();
    if (r.bottom < -100 || r.top > window.innerHeight + 100) return;
    measure();
    if (!raf) raf = requestAnimationFrame(tick);
  };

  measure();
  p = target;
  show(Math.min(n - 1, Math.floor(clamp01(p) * n * 0.9999)));
  render();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', () => {
    measure();
    render();
  });
}
