export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const canHover = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
export const clamp01 = (v: number) => clamp(v, 0, 1);
export const inOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

export const visible = <T extends Element>(list: Iterable<T>) =>
  Array.from(list).filter((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  });

function luminance(color: string) {
  const t = color.match(/[\d.]+/g);
  if (!t || (t.length > 3 ? +t[3] : 1) < 0.5) return null;
  const n = (v: number) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * n(+t[0]) + 0.7152 * n(+t[1]) + 0.0722 * n(+t[2]);
}

export function isDarkAt(x: number, y: number, skip = '', mediaIsLight = false) {
  for (const el of document.elementsFromPoint(x, y)) {
    if (skip && el.closest(skip)) continue;
    if (el.tagName === 'IMG' || el.tagName === 'VIDEO') return !mediaIsLight;
    const cs = getComputedStyle(el);
    if (cs.backgroundImage && cs.backgroundImage.includes('url(')) return !mediaIsLight;
    const l = luminance(cs.backgroundColor);
    if (l !== null) return l < 0.35;
  }
  return false;
}

