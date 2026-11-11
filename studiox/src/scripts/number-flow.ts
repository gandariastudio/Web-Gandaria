import 'number-flow';
import type NumberFlow from 'number-flow';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function initNumberFlows(animate = true) {
  document.querySelectorAll<NumberFlow>('[data-number-flow]').forEach((flow) => {
    const d = flow.dataset;
    const value = Number(d.value);
    const durationMs = Number(d.duration ?? 1.8) * 1000;
    flow.textContent = '';
    flow.numberPrefix = d.prefix ?? '';
    flow.numberSuffix = d.suffix ?? '';
    flow.format = { useGrouping: true };
    flow.trend = 0;
    flow.transformTiming = { duration: durationMs, easing: 'ease-out' };
    flow.spinTiming = { duration: durationMs, easing: 'ease-out' };
    flow.opacityTiming = { duration: Math.max(250, durationMs * 0.45), easing: 'ease-out' };

    if (!animate) {
      flow.update(value);
      return;
    }
    flow.animated = false;
    flow.update(Number(d.from ?? 0));
    flow.animated = true;
    const play = () => gsap.delayedCall(Number(d.delay ?? 0), () => flow.update(value));
    if (d.trigger === 'load') play();
    else ScrollTrigger.create({ trigger: flow, start: 'top 90%', once: true, onEnter: play });
  });
}
