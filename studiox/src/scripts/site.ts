import gsap from 'gsap';
import { ease } from './lib/ease';
import { isDarkAt, prefersReducedMotion, visible } from './lib/dom';
import { getLenis, lockScroll, scrollToTop } from './smooth-scroll';

const PT_KEY = 'gandaria-pt';
const LOADER_KEY = 'gandaria-loader';

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

/** Hovering the logo makes the dot hop and the smile stretch. */
export function initMarkHover() {
  document.querySelectorAll<HTMLElement>('[data-logo]').forEach((link) => {
    const dot = link.querySelector('[data-mark] .mark-dot');
    const smile = link.querySelector('[data-mark] .mark-smile');
    if (!dot || !smile) return;
    let busy = false;
    link.addEventListener('mouseenter', () => {
      if (busy) return;
      busy = true;
      gsap
        .timeline({ onComplete: () => (busy = false) })
        .to(dot, { y: -150, duration: 0.22, ease: 'power2.out' })
        .to(smile, { scaleX: 1.12, duration: 0.22, ease: 'power2.out' }, 0)
        .to(dot, { y: 0, duration: 0.45, ease: 'bounce.out' })
        .to(smile, { scaleX: 1, duration: 0.45, ease: 'elastic.out(1, 0.5)' }, '<');
    });
  });
}

/**
 * The loader's intro (mark build, letters, progress) runs in CSS from first paint; see Loader.astro.
 * This times the exit from how far that intro got: the lockup flies into the header logo while the
 * two orange layers lift away.
 */
export function runLoader(): Promise<boolean> {
  const loader = document.querySelector<HTMLElement>('[data-loader]');
  const lockup = document.querySelector<HTMLElement>('[data-loader-lockup]');
  const mark = document.querySelector<HTMLElement>('[data-loader-mark]');
  const html = document.documentElement;
  if (!loader || !lockup || !mark || html.classList.contains('no-loader') || prefersReducedMotion()) {
    loader?.style.setProperty('display', 'none');
    return Promise.resolve(false);
  }
  sessionStorage.setItem(LOADER_KEY, '1');
  loader.style.animation = 'none';
  lockScroll(true);
  const [under, panel] = loader.querySelectorAll<HTMLElement>('[data-loader-panel]');
  const foot = loader.querySelector('[data-loader-foot]');
  const EXIT_AT = 1.25;
  const built = mark.querySelector('.mark-ring')?.getAnimations()[0]?.currentTime;
  const elapsed = Math.min(EXIT_AT, typeof built === 'number' ? built / 1000 : 0);

  return new Promise((resolve) => {
    gsap
      .timeline({ delay: EXIT_AT - elapsed })
      .add(() => {
        // Pin the lockup at its current spot in px, then move it so its mark lands on the header's.
        const box = lockup.getBoundingClientRect();
        const from = mark.getBoundingClientRect();
        const target = visible(document.querySelectorAll('[data-logo-mark]'))[0];
        const to = target ? target.getBoundingClientRect() : { left: 16, top: 28, width: 24 };
        const scale = to.width / from.width;
        gsap.set(lockup, { left: box.left, top: box.top, xPercent: 0, yPercent: 0, x: 0, y: 0 });
        gsap.to(lockup, {
          x: to.left - (box.left + (from.left - box.left) * scale),
          y: to.top - (box.top + (from.top - box.top) * scale),
          scale,
          duration: 0.85,
          ease: ease.swift,
        });
        const word = document.querySelector('.logo-word');
        gsap.to(lockup, { color: word ? getComputedStyle(word).color : '#252320', duration: 0.35, delay: 0.4, ease: ease.standard });
      }, 0)
      .to(foot, { opacity: 0, y: 8, duration: 0.3, ease: ease.standard }, 0)
      .to(panel, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: ease.swift }, 0.08)
      .to(under, { clipPath: 'inset(0 0 100% 0)', duration: 0.75, ease: ease.swift }, 0.18)
      .add(() => {
        loader.style.display = 'none';
        lockScroll(false);
        getLenis()?.resize();
        resolve(true);
      }, 0.95);
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
