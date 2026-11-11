import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ease } from './lib/ease';

gsap.registerPlugin(ScrollTrigger, SplitText);

const inView = (el: HTMLElement, amount: number) => () =>
  `top+=${Math.min(el.offsetHeight * amount, window.innerHeight * amount)} bottom`;

export function initReveals() {
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    const d = el.dataset;
    const amount = Number(d.revealAmount ?? 0.15);
    gsap.set(el, { autoAlpha: 0, y: Number(d.reveal || 48) });
    const show = () => gsap.to(el, { autoAlpha: 1, y: 0, duration: 1.2, delay: Number(d.revealDelay ?? 0), ease: ease.expo, overwrite: true });
    const hide = () => gsap.to(el, { autoAlpha: 0, y: Number(d.reveal || 48), duration: 1.2, ease: ease.expo, overwrite: true });
    ScrollTrigger.create({
      trigger: el,
      start: inView(el, amount),
      end: () => `bottom-=${Math.min(el.offsetHeight * amount, window.innerHeight * amount)} top`,
      onEnter: show,
      onEnterBack: show,
      onLeave: hide,
      onLeaveBack: hide,
    });
  });
}

const HEADINGS = 'main :is(h1, h2, h3)';
const SKIP = '[data-no-text-reveal], [data-zoom-left], [data-zoom-right]';

export function initTextReveals() {
  const targets = gsap.utils
    .toArray<HTMLElement>(`${HEADINGS}, [data-text-reveal]`)
    .filter((el) => !el.matches(SKIP) && !el.querySelector('[data-text-reveal]') && !el.parentElement?.closest('[data-text-reveal]'));
  document.querySelectorAll<HTMLElement>(HEADINGS).forEach((h) => (h.style.visibility = 'visible'));

  targets.forEach((el) => {
    const d = el.dataset;
    const stagger = Number(d.trStagger ?? 0);
    const start = inView(el, Number(d.trAmount ?? 0.2));

    if (d.textReveal === 'char') {
      const split = SplitText.create(el, { type: 'words,chars' });
      gsap.set(split.chars, { autoAlpha: 0.001, y: Number(d.trY ?? 12), filter: `blur(${Number(d.trBlur ?? 8)}px)` });
      gsap.set(el, { visibility: 'visible' });
      ScrollTrigger.create({
        trigger: el,
        start,
        once: true,
        onEnter: () =>
          gsap.to(split.chars, { autoAlpha: 1, y: 0, filter: 'blur(0px)', duration: Number(d.trDuration ?? 0.9), ease: ease.expo, stagger: stagger || 0.05 }),
      });
      return;
    }

    const split = SplitText.create(el, { type: 'lines,words', linesClass: 'tr-line' });
    const lineWords = split.lines.map((line) => split.words.filter((w) => line.contains(w)));
    gsap.set(split.words, { yPercent: 140, autoAlpha: 0, filter: 'blur(6px)' });
    gsap.set(el, { visibility: 'visible' });
    ScrollTrigger.create({
      trigger: el,
      start,
      once: true,
      onEnter: () => {
        const tl = gsap.timeline({ delay: stagger, onComplete: () => split.revert() });
        lineWords.forEach((words, i) =>
          tl.to(words, { yPercent: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 1.2, ease: ease.expo }, i * 0.12),
        );
      },
    });
  });
}

const BLOCKS = 'main :is(p, .btn, .text-link)';
const OWN_MOTION =
  '[data-reveal], [data-text-reveal], [data-no-reveal], [data-hero-meta], [data-zoom], [data-pixel-stat], [data-deck], [data-project-card], .cf, .fq-list, h1, h2, h3';

export function initBlockReveals() {
  const all = gsap.utils.toArray<HTMLElement>(BLOCKS).filter((el) => !el.closest(OWN_MOTION));
  gsap.set(all, { visibility: 'visible' });
  const blocks = all.filter((el) => !all.some((other) => other !== el && other.contains(el)));
  gsap.set(blocks, { autoAlpha: 0, y: 24 });
  ScrollTrigger.batch(blocks, {
    start: 'top 92%',
    once: true,
    onEnter: (batch) =>
      gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, ease: ease.expo, stagger: 0.08, delay: 0.1, overwrite: true }),
  });
}

export function initImageReveals() {
  let lastEnter = 0;
  let queued = 0;
  gsap.utils.toArray<HTMLElement>('[data-img-reveal]').forEach((el) => {
    const media = el.querySelector<HTMLElement>('img, video');
    gsap.set(el, { clipPath: 'inset(100% 0% 0% 0%)' });
    if (media) gsap.set(media, { scale: 1.18, transition: 'none' });
    ScrollTrigger.create({
      trigger: el,
      start: 'top 88%',
      once: true,
      onEnter: () => {
        const now = performance.now();
        queued = now - lastEnter < 60 ? queued + 1 : 0;
        lastEnter = now;
        const delay = Number(el.dataset.imgRevealDelay ?? 0) + queued * 0.12;
        gsap.to(el, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, delay, ease: ease.quart });
        if (media) gsap.to(media, { scale: 1, duration: 1.6, delay, ease: ease.expo, clearProps: 'transform,transition' });
      },
    });
  });
}
