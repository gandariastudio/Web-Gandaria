import { canHover, prefersReducedMotion } from './lib/dom';

const STRENGTH = 28;
const ZOOM = 1.08;
const SMOOTHING = 0.1;

interface State {
  img: HTMLElement;
  x: number;
  y: number;
  s: number;
  tx: number;
  ty: number;
  ts: number;
}

export function initCardParallax() {
  if (!canHover() || prefersReducedMotion()) return;
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((scope) => {
    const states = new Map<HTMLElement, State>();
    let hovered: HTMLElement | null = null;
    let raf = 0;

    const stateOf = (card: HTMLElement) => {
      let st = states.get(card);
      if (!st) {
        const img = card.querySelector<HTMLElement>('[data-parallax-img]');
        if (!img) return null;
        img.style.willChange = 'transform';
        st = { img, x: 0, y: 0, s: 1, tx: 0, ty: 0, ts: 1 };
        states.set(card, st);
      }
      return st;
    };
    const tick = () => {
      raf = 0;
      let moving = false;
      states.forEach((t) => {
        t.x += (t.tx - t.x) * SMOOTHING;
        t.y += (t.ty - t.y) * SMOOTHING;
        t.s += (t.ts - t.s) * SMOOTHING;
        t.img.style.transform = `translate3d(${t.x.toFixed(2)}px, ${t.y.toFixed(2)}px, 0) scale(${t.s.toFixed(4)})`;
        if (Math.abs(t.tx - t.x) > 0.05 || Math.abs(t.ty - t.y) > 0.05 || Math.abs(t.ts - t.s) > 5e-4) moving = true;
      });
      if (moving) raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const release = (card: HTMLElement | null) => {
      const st = card && states.get(card);
      if (st) {
        st.tx = 0;
        st.ty = 0;
        st.ts = 1;
      }
    };
    const leave = () => {
      release(hovered);
      hovered = null;
      run();
    };

    window.addEventListener(
      'mousemove',
      (e) => {
        const r = scope.getBoundingClientRect();
        if (e.clientY < r.top || e.clientY > r.bottom) {
          if (hovered) leave();
          return;
        }
        const card = document
          .elementsFromPoint(e.clientX, e.clientY)
          .map((el) => el.closest<HTMLElement>('[data-project-card]'))
          .find((c) => c && scope.contains(c)) ?? null;
        if (card !== hovered) {
          release(hovered);
          hovered = card;
        }
        if (card) {
          const st = stateOf(card);
          if (st) {
            const b = card.getBoundingClientRect();
            const ox = (e.clientX - b.left) / b.width - 0.5;
            const oy = (e.clientY - b.top) / b.height - 0.5;
            st.tx = -ox * STRENGTH;
            st.ty = -oy * STRENGTH;
            st.ts = ZOOM;
          }
        }
        run();
      },
      { passive: true },
    );
    document.addEventListener('mouseleave', leave);
  });
}
