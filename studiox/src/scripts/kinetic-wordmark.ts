import { prefersReducedMotion } from './lib/dom';

const LETTER_SPACING = -0.065;
const REACH = 1.7;
const SOFTNESS = 0.9;

export function initKineticWordmarks() {
  document.querySelectorAll<HTMLElement>('[data-kinetic]').forEach((root) => {
    const measure = root.querySelector<HTMLElement>('[data-measure]')!;
    const measurePeak = root.querySelector<HTMLElement>('[data-measure-peak]')!;
    const word = root.querySelector<HTMLElement>('[data-word]')!;
    const slots = Array.from(word.children) as HTMLElement[];
    const glyphs = slots.map((s) => s.firstElementChild as HTMLElement);
    const base = 500;
    const peak = Number(root.dataset.peak ?? base);
    const hoverSpace = Number(root.dataset.space ?? 0);

    let fontSize = 160;
    let widths: number[] = [];
    let extra: number[] = [];

    const fit = () => {
      const rectW = root.getBoundingClientRect().width;
      const scale = root.offsetWidth > 0 && rectW > 0 ? rectW / root.offsetWidth : 1;
      const textW = measure.getBoundingClientRect().width / scale + Math.max(0, -LETTER_SPACING) * 100;
      const boxW = root.offsetWidth;
      if (!(textW > 0 && boxW > 0)) return;
      fontSize = (boxW / textW) * 100;
      const k = fontSize / 100;
      widths = Array.from(measure.children).map((c) => (c.getBoundingClientRect().width / scale) * k);
      const peaks = Array.from(measurePeak.children);
      extra = widths.map((w, i) => (peaks[i] ? Math.max(0, (peaks[i].getBoundingClientRect().width / scale) * k - w) : 0));
      word.style.setProperty('--kw-size', `${fontSize}px`);
      slots.forEach((s, i) => (s.style.width = `${widths[i]}px`));
    };
    fit();
    document.fonts?.ready.then(fit);
    new ResizeObserver(fit).observe(root);

    if (prefersReducedMotion() || (peak === base && hoverSpace === 0)) return;

    let centers: number[] = [];
    let pitch = 1;
    const measureCenters = () => {
      const r = root.getBoundingClientRect();
      centers = slots.map((s) => {
        const b = s.getBoundingClientRect();
        return b.left - r.left + b.width / 2;
      });
      pitch = centers.length > 1 ? (centers[centers.length - 1] - centers[0]) / (centers.length - 1) : r.width || 1;
    };

    const range = peak - base;
    const kPos = 9 / Math.max(0.15, SOFTNESS);
    const kAmp = 6 / Math.max(0.15, SOFTNESS);
    let targetX = 0;
    let x = 0;
    let vx = 0;
    let targetAmp = 0;
    let amp = 0;
    let va = 0;
    let raf = 0;
    let last = 0;
    let fresh = true;

    const render = () => {
      const sigma = pitch * REACH;
      const space = hoverSpace * fontSize;
      const n = slots.length;
      const weight = new Array(n);
      const grow = new Array(n);
      for (let i = 0; i < n; i++) {
        const t = (centers[i] - x) / sigma;
        weight[i] = Math.exp(-0.5 * t * t) * amp;
        grow[i] = (extra[i] || 0) * weight[i] + space * weight[i];
      }
      let before = 0;
      for (let i = 0; i < n; i++) {
        const half = (widths[i] || pitch) / 2;
        const p = Math.min(1, Math.max(0, (x - (centers[i] - half)) / (2 * half)));
        before += grow[i] * p;
      }
      let total = 0;
      for (let i = 0; i < n; i++) total += grow[i];
      const w = root.offsetWidth || 1;
      const s = w / (w + total);
      word.style.transform = total > 0.05 ? `translate3d(${(before * s).toFixed(2)}px,0,0) scale(${s.toFixed(5)})` : '';
      let acc = 0;
      for (let i = 0; i < n; i++) {
        const shift = acc + grow[i] / 2 - before;
        acc += grow[i];
        glyphs[i].style.fontVariationSettings = `"wght" ${(base + range * weight[i]).toFixed(1)}`;
        slots[i].style.transform = Math.abs(shift) > 0.01 ? `translate3d(${shift.toFixed(2)}px,0,0)` : '';
      }
    };

    const spring = (pos: number, vel: number, target: number, k: number, dt: number): [number, number] => {
      vel += (k * k * (target - pos) - 2 * k * vel) * dt;
      return [pos + vel * dt, vel];
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(1 / 30, (now - last) / 1000) : 1 / 60;
      last = now;
      [x, vx] = spring(x, vx, targetX, kPos, dt);
      [amp, va] = spring(amp, va, targetAmp, kAmp, dt);
      if (amp < 0) amp = 0;
      render();
      if (Math.abs(targetX - x) < 0.2 && Math.abs(vx) < 0.5 && Math.abs(targetAmp - amp) < 0.002 && Math.abs(va) < 0.01) {
        x = targetX;
        vx = 0;
        amp = targetAmp;
        va = 0;
        render();
        raf = 0;
        last = 0;
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    const run = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const move = (clientX: number) => {
      targetX = clientX - root.getBoundingClientRect().left;
      if (fresh) {
        measureCenters();
        x = targetX;
        vx = 0;
        fresh = false;
      }
      targetAmp = 1;
      run();
    };
    const leave = () => {
      targetAmp = 0;
      fresh = true;
      run();
    };

    measureCenters();
    root.addEventListener('pointermove', (e) => move(e.clientX), { passive: true });
    root.addEventListener('pointerleave', leave);
    root.addEventListener('touchmove', (e) => e.touches[0] && move(e.touches[0].clientX), { passive: true });
    root.addEventListener('touchend', leave);
    new ResizeObserver(() => amp < 0.01 && measureCenters()).observe(root);
  });
}
