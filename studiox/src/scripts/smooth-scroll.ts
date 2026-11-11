import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

let lenis: Lenis | null = null;

export function initSmoothScroll() {
  lenis = new Lenis({ lerp: 0.16, wheelMultiplier: 1.1, smoothWheel: true, anchors: true, autoRaf: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
}

export function getLenis() {
  return lenis;
}

export const smoothing = (own: number) => (lenis ? 1 : own);

export function lockScroll(locked: boolean) {
  if (lenis) {
    if (locked) lenis.stop();
    else lenis.start();
  }
  document.documentElement.style.overflow = locked ? 'hidden' : '';
}

export function scrollToTop(immediate = false) {
  if (lenis) lenis.scrollTo(0, immediate ? { immediate: true } : { duration: 1.2 });
  else window.scrollTo({ top: 0, behavior: immediate ? 'auto' : 'smooth' });
}
