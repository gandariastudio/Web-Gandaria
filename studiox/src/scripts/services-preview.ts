import { canHover, prefersReducedMotion, visible } from './lib/dom';

const EASE = 'cubic-bezier(0.16,1,0.3,1)';

export function initServicesPreview() {
  const section = document.querySelector<HTMLElement>('[data-services]');
  const card = section?.querySelector<HTMLElement>('[data-services-preview]');
  const list = section?.querySelector<HTMLElement>('[data-services-list]');
  if (!section || !card || !list || !canHover()) return;
  const reduced = prefersReducedMotion();
  const rows = Array.from(list.querySelectorAll<HTMLElement>('[data-service-row]'));
  const srcOf = (row: HTMLElement) => row.dataset.preview ?? '';

  let slotLeft = -1;
  let slotWidth = 0;
  let listTop = 0;
  let listBottom = 0;
  let pointerX = -1;
  let pointerY = -1;
  let targetY = 0;
  let y = 0;
  let raf = 0;
  let active = false;
  let currentRow: HTMLElement | null = null;
  let hideTimer = 0;

  const size = () => (slotLeft >= 0 ? slotWidth : Math.min(380, Math.max(180, window.innerWidth * 0.24)));
  const height = () => (slotLeft >= 0 ? Math.round(slotWidth * 1.2) : size());

  const layout = () => {
    const slot = visible(section.querySelectorAll('[data-media-slot]'))[0];
    if (slot) {
      const r = slot.getBoundingClientRect();
      slotLeft = r.left;
      slotWidth = r.width;
    } else slotLeft = -1;
    const lr = list.getBoundingClientRect();
    listTop = lr.top;
    listBottom = lr.bottom;
    const s = size();
    const sr = section.getBoundingClientRect();
    card.style.width = `${s}px`;
    card.style.height = `${height()}px`;
    card.style.left = `${slotLeft >= 0 ? slotLeft : sr.right - sr.width * 0.14 - s}px`;
  };

  const tick = () => {
    raf = 0;
    const h = height();
    const t = Math.min(Math.max(targetY, listTop + h / 2), Math.max(listTop + h / 2, listBottom - h / 2));
    y += (t - y) * (reduced ? 1 : 0.18);
    card.style.transform = `translate3d(0, ${(y - h / 2).toFixed(2)}px, 0)`;
    if (active && Math.abs(t - y) > 0.2) raf = requestAnimationFrame(tick);
  };
  const run = () => {
    if (!raf) raf = requestAnimationFrame(tick);
  };

  const wipeIn = (src: string) => {
    const layer = document.createElement('div');
    const img = document.createElement('img');
    img.src = src;
    img.alt = '';
    Object.assign(layer.style, { position: 'absolute', inset: '0', overflow: 'hidden', clipPath: 'inset(100% 0% 0% 0%)' });
    Object.assign(img.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover', display: 'block', transform: 'scale(1.18)' });
    layer.append(img);
    card.append(layer);
    const opts: KeyframeAnimationOptions = { duration: reduced ? 1 : 750, easing: EASE, fill: 'forwards' };
    layer.animate([{ clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)' }], opts);
    img.animate([{ transform: 'scale(1.18)' }, { transform: 'scale(1)' }], { ...opts, duration: reduced ? 1 : 1000 });
    while (card.children.length > 20) card.children[0].remove();
  };

  const setActive = (on: boolean) => {
    if (on === active) return;
    active = on;
    document.documentElement.classList.toggle('k-preview-active', on);
    clearTimeout(hideTimer);
    card.style.transition = `clip-path .45s ${EASE}, opacity .3s ease`;
    if (on) {
      card.style.visibility = 'visible';
      card.style.clipPath = 'inset(0% 0% 0% 0% round 4px)';
      card.style.opacity = '1';
    } else {
      card.style.clipPath = 'inset(50% 0% 50% 0% round 4px)';
      card.style.opacity = '0';
      currentRow = null;
      hideTimer = window.setTimeout(() => {
        if (active) return;
        card.style.visibility = 'hidden';
        card.replaceChildren();
      }, 700);
    }
  };

  const check = () => {
    if (pointerX < 0) return;
    if (window.innerWidth < 810) return setActive(false);
    const lr = list.getBoundingClientRect();
    if (!(pointerX >= lr.left && pointerX <= lr.right && pointerY >= lr.top && pointerY <= lr.bottom)) return setActive(false);
    targetY = pointerY;
    if (!active) {
      y = targetY;
      layout();
    }
    setActive(true);
    const row = document
      .elementsFromPoint(pointerX, pointerY)
      .map((el) => el.closest<HTMLElement>('[data-service-row]'))
      .find(Boolean);
    if (row && row !== currentRow) {
      currentRow = row;
      const src = srcOf(row);
      if (src) wipeIn(src);
    }
    run();
  };

  const preload = () => rows.forEach((r) => {
    const src = srcOf(r);
    if (src) new Image().src = src;
  });
  preload();
  setTimeout(preload, 1500);

  window.addEventListener(
    'mousemove',
    (e) => {
      pointerX = e.clientX;
      pointerY = e.clientY;
      check();
    },
    { passive: true },
  );
  const onScroll = () => {
    if (pointerX < 0) return;
    const sr = section.getBoundingClientRect();
    if (!active && (pointerY < sr.top || pointerY > sr.bottom)) return;
    if (active) layout();
    check();
    run();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  document.addEventListener('mouseleave', () => setActive(false));
}
