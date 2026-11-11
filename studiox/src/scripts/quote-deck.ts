import gsap from 'gsap';
import { canHover, prefersReducedMotion } from './lib/dom';

const DRIFT = 0.5;
const LAG = [0.09, 0.1, 0.11];

export function initQuoteDeck() {
  const root = document.querySelector<HTMLElement>('[data-deck]');
  if (!root) return;
  const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-qd-card]'));
  if (!cards.length) return;
  const reduced = prefersReducedMotion();
  const mouse = canHover();
  const n = cards.length;
  const tilts = cards.map((c) => Number(c.dataset.tilt));

  let width = 0;
  let step = 0;
  let loop = 0;
  let origin = 0;
  let target = 0;
  const pos = [0, 0, 0];
  let inView = false;
  let dragging = false;
  let axis = '';
  let sx = 0;
  let sy = 0;
  let start = 0;

  const measure = () => {
    width = cards[0].offsetWidth;
    step = width * 0.75;
    loop = step * n;
    origin = (root.offsetWidth - width) / 2 - step * 2;
  };
  const wrap = (v: number) => {
    const min = -step * 2;
    return ((((v - min) % loop) + loop) % loop) + min;
  };
  const render = () => {
    const v = (pos[0] - target) * 0.03;
    const lean = Math.sign(v) * 10 * (1 - Math.exp(-Math.abs(v) / 10));
    for (let i = 0; i < n; i++) {
      const x = origin + wrap(i * step - pos[i % 3]);
      cards[i].style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) rotate(${(tilts[i] + lean).toFixed(3)}deg)`;
    }
  };
  const tick = (_t: number, dtMs: number) => {
    if (!inView) return;
    const k = Math.min(3, dtMs / 16.667);
    if (!dragging && !reduced) target += DRIFT * k;
    for (let i = 0; i < 3; i++) pos[i] += (target - pos[i]) * Math.min(1, LAG[i] * k);
    render();
  };

  cards.forEach((c) => (c.style.left = '0px'));
  measure();
  render();
  root.dataset.ready = '1';
  new IntersectionObserver(
    ([e]) => {
      inView = e.isIntersecting;
      if (inView) root.dataset.seen = '1';
    },
    { rootMargin: '100px 0px' },
  ).observe(root);
  gsap.ticker.add(tick);
  window.addEventListener('resize', () => {
    measure();
    render();
  });
  window.addEventListener('wheel', (e) => inView && (target += e.deltaY * 0.5), { passive: true });

  root.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    axis = '';
    sx = e.clientX;
    sy = e.clientY;
    start = target;
    root.dataset.dragging = '1';
  });
  window.addEventListener(
    'pointermove',
    (e) => {
      if (!dragging) return;
      const dx = e.clientX - sx;
      const dy = e.clientY - sy;
      if (!axis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      if (axis === 'y' && e.pointerType !== 'mouse') {
        dragging = false;
        delete root.dataset.dragging;
        return;
      }
      if (axis === 'x') target = start - dx * (e.pointerType === 'mouse' ? 2 : 1.6);
    },
    { passive: true },
  );
  const release = () => {
    if (!dragging) return;
    dragging = false;
    delete root.dataset.dragging;
    target = Math.round(target / step) * step;
  };
  window.addEventListener('pointerup', release);
  window.addEventListener('pointercancel', release);
  if (mouse) root.addEventListener('pointerleave', release);
}
