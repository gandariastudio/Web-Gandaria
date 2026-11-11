import { prefersReducedMotion, visible } from './lib/dom';
import { smoothing } from './smooth-scroll';

export function initPixelEdges() {
  document.querySelectorAll<HTMLElement>('[data-pixel-edge]').forEach((root) => {
    const CELL = 32;
    const SMOOTH = 0.36;
    const color = getComputedStyle(root).getPropertyValue('--pixel-color').trim() || 'var(--color-fog)';
    let cells: HTMLElement[] = [];
    let thresholds: number[] = [];

    const build = () => {
      const cols = Math.max(1, Math.ceil(root.offsetWidth / CELL));
      const rows = Math.max(1, Math.ceil(root.offsetHeight / CELL));
      if (cells.length === cols * rows) return;
      let seed = 7;
      const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      thresholds = Array.from({ length: cols * rows }, (_, n) => {
        const r = (Math.floor(n / cols) + 1) / rows;
        return Math.min(0.98, (1 - r) * 0.75 + rand() * 0.35);
      });
      Object.assign(root.style, {
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${CELL}px)`,
        gridAutoRows: `${CELL}px`,
        alignContent: 'end',
        overflow: 'hidden',
      });
      root.replaceChildren(
        ...thresholds.map(() => {
          const c = document.createElement('div');
          Object.assign(c.style, {
            width: `${CELL + 0.5}px`,
            height: `${CELL + 0.5}px`,
            background: color,
            opacity: '0',
            transition: 'opacity .35s cubic-bezier(0.87,0,0.13,1)',
          });
          return c;
        }),
      );
      cells = Array.from(root.children) as HTMLElement[];
    };

    let target = 0;
    let p = 0;
    let raf = 0;
    const measure = () => {
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      target = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.55 + r.height)));
    };
    const paint = () => {
      for (let i = 0; i < cells.length; i++) {
        const on = p > thresholds[i];
        const c = cells[i];
        if ((c.dataset.on === '1') !== on) {
          c.dataset.on = on ? '1' : '0';
          c.style.opacity = on ? '1' : '0';
        }
      }
    };
    const tick = () => {
      raf = 0;
      p += (target - p) * smoothing(SMOOTH);
      if (Math.abs(target - p) < 0.001) p = target;
      paint();
      if (p !== target) raf = requestAnimationFrame(tick);
    };
    const update = () => {
      const r = root.getBoundingClientRect();
      if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
      measure();
      if (!raf) raf = requestAnimationFrame(tick);
    };
    build();
    measure();
    p = target;
    paint();
    new ResizeObserver(() => {
      build();
      measure();
      paint();
    }).observe(root);
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  });
}

export function initProcessLines() {
  const host = document.querySelector<HTMLElement>('[data-process-lines]');
  const steps = host?.parentElement;
  if (!host || !steps) return;
  const RADIUS = 28;
  const OFFSET = 10;
  const COLOR = 'rgba(255,255,255,0.28)';
  const reduced = prefersReducedMotion();
  let paths: SVGPathElement[] = [];
  let lengths: number[] = [];
  let target = 0;
  let p = 0;
  let raf = 0;

  const build = () => {
    const w = host.offsetWidth;
    const h = host.offsetHeight;
    if (w < 405 || window.innerWidth < 810) {
      host.replaceChildren();
      paths = [];
      return;
    }
    const box = host.getBoundingClientRect();
    const pts = visible(steps.querySelectorAll('[data-step-item]')).map((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const ty = new DOMMatrixReadOnly(getComputedStyle(el).transform).m42 || 0;
      return { x: r.left - box.left - 18, y: r.top - ty + 40 - box.top + 4 };
    });
    if (!pts.length) return;
    const d: string[] = [];
    const first = pts[0];
    const top = Math.max(0, first.y - 72);
    d.push(`M 0 ${top}`, `H ${first.x - RADIUS}`, `Q ${first.x} ${top} ${first.x} ${top + RADIUS}`, `V ${first.y}`);
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const turnY = b.y - 64;
      const dir = b.x >= a.x ? 1 : -1;
      const r = Math.max(0, Math.min(RADIUS, Math.abs(b.x - a.x) / 2, (turnY - a.y) / 2));
      d.push(`V ${turnY - r}`, `Q ${a.x} ${turnY} ${a.x + dir * r} ${turnY}`, `H ${b.x - dir * r}`, `Q ${b.x} ${turnY} ${b.x} ${turnY + r}`, `V ${b.y}`);
    }
    d.push(`V ${Math.min(h, pts[pts.length - 1].y + 220)}`);
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.style.cssText = 'position:absolute;inset:0;overflow:visible';
    paths = [0, 1].map((k) => {
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', d.join(' '));
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', COLOR);
      path.setAttribute('stroke-width', '1');
      if (k) {
        path.setAttribute('transform', `translate(${OFFSET} ${-OFFSET * 0.6})`);
        path.setAttribute('opacity', '0.6');
      }
      svg.append(path);
      return path;
    });
    host.replaceChildren(svg);
    lengths = paths.map((path) => path.getTotalLength());
    paths.forEach((path, k) => {
      path.style.strokeDasharray = `${lengths[k]}`;
    });
    paint();
  };

  const paint = () => paths.forEach((path, k) => (path.style.strokeDashoffset = `${lengths[k] * (1 - p)}`));
  const measure = () => {
    const r = host.getBoundingClientRect();
    target = reduced ? 1 : Math.min(1, Math.max(0, (window.innerHeight * 0.75 - r.top) / (r.height * 0.9)));
  };
  const tick = () => {
    raf = 0;
    p += (target - p) * smoothing(0.1);
    if (Math.abs(target - p) < 5e-4) p = target;
    paint();
    if (p !== target) raf = requestAnimationFrame(tick);
  };
  const update = () => {
    const r = host.getBoundingClientRect();
    if (r.bottom < -200 || r.top > window.innerHeight + 200) return;
    measure();
    if (!raf) raf = requestAnimationFrame(tick);
  };

  measure();
  p = target;
  build();
  new ResizeObserver(build).observe(host);
  window.addEventListener('resize', build);
  setTimeout(build, 800);
  window.addEventListener('scroll', update, { passive: true });
}
