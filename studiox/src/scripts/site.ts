import gsap from 'gsap';
import { MARK_RECTS } from '@/data/site';
import { ease } from './lib/ease';
import { isDarkAt, prefersReducedMotion, visible } from './lib/dom';
import { getLenis, lockScroll, scrollToTop } from './smooth-scroll';

const PT_KEY = 'gandaria-pt';
const LOADER_KEY = 'gandaria-loader';
const ORIGIN: Record<string, string> = { right: '100% 50%', left: '0% 50%', top: '50% 0%' };

const prepMark = (root: ParentNode) =>
  root.querySelectorAll('rect').forEach((rect, i) => gsap.set(rect, { transformOrigin: ORIGIN[MARK_RECTS[i][4]] }));

export function initAdaptiveHeader() {
  const html = document.documentElement;
  let queued = false;
  let lastCheck = 0;
  let lastY = -9999;
  const update = () => {
    queued = false;
    const y = window.scrollY;
    html.classList.toggle('is-scrolled', y > 80);
    const now = performance.now();
    if ((Math.abs(y - lastY) > 24 || now - lastCheck > 600) && now - lastCheck > 140) {
      lastCheck = now;
      lastY = y;
      const mark = visible(document.querySelectorAll('[data-logo-mark]'))[0];
      if (mark) {
        const r = mark.getBoundingClientRect();
        html.classList.toggle('logo-dark', isDarkAt(r.left + r.width / 2, r.top + r.height / 2, '[data-header],[data-loader]', true));
      }
      const cta = visible(document.querySelectorAll('[data-cta-slot] a'))[0];
      if (cta) {
        const r = cta.getBoundingClientRect();
        html.classList.toggle('cta-dark', isDarkAt(r.left + r.width / 2, r.top + r.height / 2, '[data-header],[data-loader]', true));
      }
    }
  };
  const queue = () => {
    if (!queued) {
      queued = true;
      requestAnimationFrame(update);
    }
  };
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  queue();
  setTimeout(queue, 600);
  setTimeout(queue, 2000);
}

export function initMarkHover() {
  document.querySelectorAll<HTMLElement>('[data-logo]').forEach((link) => {
    let busy = false;
    prepMark(link);
    link.addEventListener('mouseenter', () => {
      if (busy) return;
      busy = true;
      link.querySelectorAll('[data-mark] rect').forEach((rect, i) => {
        const [, , , , , axis, step] = MARK_RECTS[i];
        if (step === 0) return;
        const prop = axis === 'scaleX' ? 'scaleX' : 'scaleY';
        gsap
          .timeline({ delay: ((2 - step) * 150) / 1000 })
          .to(rect, { [prop]: 0, duration: 0.15, ease: ease.mark })
          .to(rect, { [prop]: 1, duration: 0.15, ease: ease.mark }, `+=${((step - 1) * 150) / 1000}`);
      });
      gsap.delayedCall(0.7, () => (busy = false));
    });
  });
}

export function runLoader(): Promise<boolean> {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  const mark = document.querySelector<HTMLElement>('[data-loader-mark]');
  const html = document.documentElement;
  if (!loader || !mark || html.classList.contains('no-loader') || prefersReducedMotion()) {
    loader?.style.setProperty('display', 'none');
    return Promise.resolve(false);
  }
  sessionStorage.setItem(LOADER_KEY, '1');
  loader.style.animation = 'none';
  lockScroll(true);
  const built = mark.querySelector('rect')?.getAnimations()[0]?.currentTime;
  const elapsed = Math.min(0.9, typeof built === 'number' ? built / 1000 : 0);
  return new Promise((resolve) => {
    gsap
      .timeline()
      .add(() => {
        const target = visible(document.querySelectorAll('[data-logo-mark]'))[0];
        const r = target ? target.getBoundingClientRect() : { left: 40, top: 30, width: 24, height: 24 };
        gsap.set(mark, { left: r.left, top: r.top, width: r.width, height: r.height, x: 0, y: 0, xPercent: 0, yPercent: 0, scale: 1 });
        gsap.from(mark, {
          x: window.innerWidth / 2 - (r.left + r.width / 2),
          y: window.innerHeight / 2 - (r.top + r.height / 2),
          scale: 48 / r.width,
          duration: 0.8,
          ease: ease.mark,
        });
      }, 0.9 - elapsed)
      .add(() => {
        const word = document.querySelector('.logo-word');
        gsap.to(mark, { color: word ? getComputedStyle(word).color : '#252320', duration: 0.35, delay: 0.28, ease: ease.standard });
      }, 1.2 - elapsed)
      .fromTo(loader, { clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: ease.mark }, 1.2 - elapsed)
      .add(() => {
        loader.style.display = 'none';
        lockScroll(false);
        getLenis()?.resize();
        resolve(true);
      }, 1.82 - elapsed);
  });
}

export function initPageTransition() {
  const curtain = document.querySelector<HTMLElement>('[data-curtain]');
  const label = document.querySelector<HTMLElement>('[data-curtain-label]');
  if (!curtain || !label) return;
  const html = document.documentElement;

  if (html.classList.contains('pt-arriving')) {
    sessionStorage.removeItem(PT_KEY);
    label.textContent = html.dataset.ptLabel || 'Gandaria';
    gsap.set(curtain, { y: 0, yPercent: 0 });
    curtain.classList.add('on');
    html.classList.remove('pt-arriving');
    requestAnimationFrame(() => {
      curtain.classList.remove('on');
      gsap.to(curtain, { yPercent: -100, duration: 0.6, ease: ease.swift, onComplete: () => gsap.set(curtain, { yPercent: 100 }) });
    });
  } else gsap.set(curtain, { y: 0, yPercent: 100 });

  let busy = false;
  document.addEventListener(
    'click',
    (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element)?.closest?.('a');
      if (!a || !a.href || busy || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
      let url: URL;
      try {
        url = new URL(a.href, location.href);
      } catch {
        return;
      }
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname) {
        const target = url.hash && document.querySelector<HTMLElement>(url.hash);
        if (target) {
          e.preventDefault();
          const lenis = getLenis();
          if (lenis) lenis.scrollTo(target);
          else target.scrollIntoView({ behavior: 'smooth' });
        }
        return;
      }
      e.preventDefault();
      busy = true;
      const text = (a.querySelector('.btn__label')?.textContent || a.textContent || '').replace(/[→↗←↑]/g, '').trim().slice(0, 32) || 'Gandaria';
      label.textContent = text;
      curtain.style.pointerEvents = 'auto';
      curtain.classList.add('on');
      gsap.to(curtain, {
        yPercent: 0,
        duration: 0.38,
        ease: ease.swift,
        onComplete: () => {
          sessionStorage.setItem(PT_KEY, text);
          location.href = url.href;
        },
      });
    },
    true,
  );

  window.addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    busy = false;
    gsap.set(curtain, { yPercent: 100 });
    curtain.classList.remove('on');
    curtain.style.pointerEvents = 'none';
  });
}

export function initBackToTop() {
  document.addEventListener(
    'click',
    (e) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element)?.closest?.('a');
      if (!a) return;
      const href = a.getAttribute('href') || '';
      if (!/#top$/.test(href)) return;
      e.preventDefault();
      e.stopPropagation();
      scrollToTop();
    },
    true,
  );
}
