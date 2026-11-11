import { canHover, isDarkAt } from './lib/dom';

const SMOOTHING = 0.16;

export function initCrosshair() {
  const root = document.querySelector<HTMLElement>('[data-crosshair]');
  if (!root || !canHover()) return;
  const v = root.querySelector<HTMLElement>('[data-ch-v]')!;
  const h = root.querySelector<HTMLElement>('[data-ch-h]')!;
  const plus = root.querySelector<HTMLElement>('[data-ch-plus]')!;
  const html = document.documentElement;

  let px = 0;
  let py = 0;
  let x = 0;
  let y = 0;
  let active = false;
  let raf = 0;

  const tick = () => {
    raf = 0;
    x += (px - x) * SMOOTHING;
    y += (py - y) * SMOOTHING;
    v.style.transform = `translate3d(${x}px,0,0)`;
    h.style.transform = `translate3d(0,${y}px,0)`;
    plus.style.transform = `translate3d(${x - 7}px,${y - 7}px,0)`;
    if (active || Math.abs(px - x) > 0.3 || Math.abs(py - y) > 0.3) raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const inside = () => px >= 0 && py >= 0 && px <= window.innerWidth && py <= window.innerHeight;
  const loaderVisible = () => {
    const l = document.querySelector<HTMLElement>('[data-loader]');
    return !!l && l.style.display !== 'none' && getComputedStyle(l).display !== 'none';
  };

  const refresh = (target: Element | null) => {
    const on = inside() && !loaderVisible();
    if (on && !active) {
      x = px;
      y = py;
    }
    active = on;
    root.style.opacity = on ? '1' : '0';
    plus.style.display = on ? 'block' : 'none';
    html.classList.toggle('kc-hide-cursor', on);

    const el = target ?? document.elementFromPoint(px, py);
    root.classList.toggle('is-dark', isDarkAt(px, py, '[data-crosshair],[data-header]') || !!el?.closest('[data-cursor-dark]'));
    run();
  };

  let lastMove = 0;
  window.addEventListener(
    'mousemove',
    (e) => {
      px = e.clientX;
      py = e.clientY;
      const now = performance.now();
      if (active && inside() && now - lastMove < 60) return run();
      lastMove = now;
      refresh(e.target as Element);
    },
    { passive: true },
  );
  let lastScroll = 0;
  window.addEventListener(
    'scroll',
    () => {
      if (!active) return;
      const now = performance.now();
      if (now - lastScroll < 120) return;
      lastScroll = now;
      refresh(null);
    },
    { passive: true },
  );
  document.addEventListener('mouseleave', () => {
    active = false;
    root.style.opacity = '0';
    html.classList.remove('kc-hide-cursor');
  });
}
