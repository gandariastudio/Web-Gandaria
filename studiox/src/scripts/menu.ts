import gsap from 'gsap';
import { ease } from './lib/ease';

export function initMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = menu?.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  if (!menu || !toggle) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const label = menu.querySelector<HTMLElement>('[data-menu-label]');
  const top = menu.querySelector<HTMLElement>('[data-line-top]');
  const bottom = menu.querySelector<HTMLElement>('[data-line-bottom]');
  let closing = false;

  const open = () => {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
  };

  const close = () => {
    if (closing || !menu.classList.contains('is-open')) return;
    toggle.setAttribute('aria-expanded', 'false');
    if (reduced) {
      menu.classList.remove('is-open');
      return;
    }
    closing = true;
    const items = Array.from(menu.querySelectorAll<HTMLElement>('[data-menu-links] > li, [data-menu-contact]')).reverse();
    const h = menu.getBoundingClientRect().height;
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(menu, { clearProps: 'clipPath' });
        menu.classList.remove('is-open');
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            gsap.set([...items, menu, top, bottom], { clearProps: 'all' });
            if (label) gsap.fromTo(label, { opacity: 0 }, { opacity: 1, duration: 0.26, ease: 'power1.out', clearProps: 'opacity' });
            closing = false;
          }),
        );
      },
    });
    tl.to(items, { opacity: 0, y: -10, duration: 0.3, stagger: 0.028, ease: ease.standard }, 0)
      .to(top, { top: 0, rotate: 0, duration: 0.52, ease: ease.quart }, 0.08)
      .to(bottom, { bottom: 0, rotate: 0, duration: 0.52, ease: ease.quart }, 0.08)
      .to(label, { opacity: 0, duration: 0.22, ease: 'power1.inOut' }, 0.38)
      .fromTo(
        menu,
        { clipPath: 'inset(0px 0px 0px 0px round 4px)' },
        { clipPath: `inset(0px 0px ${Math.max(0, h - 52)}px 0px round 4px)`, duration: 0.62, ease: ease.quart },
        0.12,
      )
      .to({}, { duration: 0.01 }, 0.75);
  };

  toggle.addEventListener('click', () => (menu.classList.contains('is-open') ? close() : open()));
  document.addEventListener('keydown', (e) => e.key === 'Escape' && close());
  document.addEventListener('pointerdown', (e) => {
    if (menu.classList.contains('is-open') && !menu.contains(e.target as Node)) close();
  });
}
