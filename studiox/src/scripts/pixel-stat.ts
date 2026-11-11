import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { canHover, prefersReducedMotion } from './lib/dom';
import { ease } from './lib/ease';

gsap.registerPlugin(ScrollTrigger);

const INK = '#252320';
const ACCENT = '#f15822';
const EMPTY = '#dcdbd7';

export function initPixelStats() {
  document.querySelectorAll<HTMLElement>('[data-pixel-stat]').forEach((root) => {
    const base = Number(root.dataset.delay ?? 0);
    const cells = Array.from(root.querySelectorAll<HTMLElement>('[data-ps-cell]'));
    const [head, label] = Array.from(root.querySelectorAll<HTMLElement>('[data-ps-fade]'));
    const suffix = root.querySelector<HTMLElement>('[data-ps-suffix]');
    const filled = (c: HTMLElement) => c.dataset.psCell === '1';
    const stagger = (c: HTMLElement) => (Number(c.dataset.col) + Number(c.dataset.row) * 1.6) * 0.022;
    const rows = Math.ceil(cells.length / 20);

    const finalState = () => {
      cells.forEach((c) => gsap.set(c, { backgroundColor: filled(c) ? INK : EMPTY }));
    };

    const r = root.getBoundingClientRect();
    if (prefersReducedMotion() || (r.top < window.innerHeight * 0.85 && r.bottom > 0)) {
      finalState();
    } else {
      gsap.set([head, label], { opacity: 0, y: 14 });
      gsap.set(cells, { opacity: 0, scale: 0.3 });
      if (suffix) gsap.set(suffix, { opacity: 0, y: '0.5em', rotate: -12 });
      ScrollTrigger.create({
        trigger: root,
        start: () => `top+=${root.offsetHeight * 0.35} bottom`,
        once: true,
        onEnter: () => {
          gsap.to(head, { opacity: 1, y: 0, duration: 1.1, delay: base, ease: ease.expo });
          if (suffix) {
            const at = base + 0.12 + 3 * 0.09 + 0.55;
            gsap.to(suffix, { opacity: 1, y: 0, rotate: 0, duration: 1, delay: at, ease: ease.expo });
          }
          cells.forEach((c) => {
            const s = stagger(c);
            gsap.to(c, { opacity: 1, scale: 1, duration: 0.7, delay: base + 0.3 + s, ease: ease.expo });
            if (filled(c)) gsap.to(c, { backgroundColor: INK, duration: 0.5, delay: base + 0.35 + s + 0.25, ease: 'power1.inOut' });
          });
          gsap.to(label, { opacity: 1, y: 0, duration: 1.1, delay: base + 0.55 + rows * 0.03, ease: ease.expo });
        },
      });
    }

    if (canHover()) {
      root.addEventListener('mouseenter', () => {
        cells.filter(filled).forEach((c) => {
          const d = (Number(c.dataset.col) + Number(c.dataset.row)) * 0.018;
          gsap
            .timeline({ delay: d })
            .set(c, { backgroundColor: ACCENT })
            .to(c, { scale: 0.72, duration: 0.36, ease: ease.expo })
            .to(c, { scale: 1, duration: 0.54, ease: ease.expo })
            .set(c, { backgroundColor: INK });
        });
      });
    }
  });
}
