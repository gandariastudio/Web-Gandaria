import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './lib/dom';
import { initSmoothScroll } from './smooth-scroll';
import { initAdaptiveHeader, initBackToTop, initMarkHover, initPageTransition, runLoader } from './site';
import { initMenu } from './menu';
import { initCrosshair } from './crosshair';
import { initKineticWordmarks } from './kinetic-wordmark';
import { initBlockReveals, initImageReveals, initReveals, initTextReveals } from './reveals';
import { initChromeBlob, initExpandMedia, initHeroMeta } from './hero';
import { initZoomReveal } from './zoom-reveal';
import { initServicesPreview } from './services-preview';
import { initCardParallax } from './card-parallax';
import { initPixelEdges, initProcessLines } from './process';
import { initPixelStats } from './pixel-stat';
import { initQuoteDeck } from './quote-deck';
import { initContactForms } from './contact-form';
import { initNumberFlows } from './number-flow';

gsap.registerPlugin(ScrollTrigger);

initMenu();
initContactForms();
initKineticWordmarks();
initNumberFlows(!prefersReducedMotion());
initAdaptiveHeader();
initBackToTop();

if (!prefersReducedMotion()) {
  initSmoothScroll();
  initPageTransition();
  runLoader();
  initMarkHover();
  initCrosshair();
  initHeroMeta();
  initReveals();
  initBlockReveals();
  initImageReveals();
  document.fonts.ready.then(initTextReveals);
  initServicesPreview();
  initCardParallax();
  initPixelStats();
  initQuoteDeck();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener('load', () => ScrollTrigger.refresh());
}
initChromeBlob();
initExpandMedia();
initZoomReveal();
initPixelEdges();
initProcessLines();
