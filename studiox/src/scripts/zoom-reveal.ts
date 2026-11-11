import { clamp01, inOutCubic, prefersReducedMotion } from './lib/dom';
import { smoothing } from './smooth-scroll';

const START_SIZE = 300;
const HOLD = 0.06;
const END = 0.9;

export function initZoomReveal() {
  const root = document.querySelector<HTMLElement>('[data-zoom]');
  if (!root) return;
  const stage = root.firstElementChild as HTMLElement;
  const clip = root.querySelector<HTMLElement>('[data-zoom-clip]')!;
  const scaler = root.querySelector<HTMLElement>('[data-zoom-scale]')!;
  const imgs = Array.from(root.querySelectorAll<HTMLElement>('[data-zoom-img]'));
  const left = root.querySelector<HTMLElement>('[data-zoom-left]')!;
  const right = root.querySelector<HTMLElement>('[data-zoom-right]')!;
  const top = root.querySelector<HTMLElement>('[data-zoom-top]')!;
  const count = root.querySelector<HTMLElement>('[data-zoom-count]')!;
  const reduced = prefersReducedMotion();
  const n = imgs.length;
  const total = String(n).padStart(2, '0');

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
    scaler.style.transform = `scale(${(1.35 - 0.35 * e).toFixed(4)})`;

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
