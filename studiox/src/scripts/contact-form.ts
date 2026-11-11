import gsap from 'gsap';
import { ease } from './lib/ease';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function initContactForms() {
  document.querySelectorAll<HTMLFormElement>('[data-contact-form]').forEach((form) => {
    const grid = form.querySelector<HTMLElement>('.cf-grid')!;
    const done = form.querySelector<HTMLElement>('[data-cf-done]')!;
    const textarea = form.querySelector('textarea')!;

    form.querySelectorAll<HTMLElement>('[data-chips]').forEach((group) => {
      const single = group.dataset.chips === 'single';
      group.querySelectorAll<HTMLButtonElement>('.cf-chip').forEach((chip) =>
        chip.addEventListener('click', () => {
          const on = chip.getAttribute('aria-pressed') !== 'true';
          if (single) group.querySelectorAll('.cf-chip').forEach((c) => c.setAttribute('aria-pressed', 'false'));
          chip.setAttribute('aria-pressed', String(on));
        }),
      );
    });

    textarea.addEventListener('input', () => {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(320, textarea.scrollHeight)}px`;
    });

    form.querySelectorAll('input').forEach((input) =>
      input.addEventListener('input', () => input.closest('.cf-field')?.classList.remove('err')),
    );

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const data = new FormData(form);
      const get = (k: string) => String(data.get(k) || '').trim();
      const name = get('name');
      const email = get('email');
      const badName = !name;
      const badEmail = !EMAIL_RE.test(email);
      form.querySelector('[data-field="name"]')?.classList.toggle('err', badName);
      form.querySelector('[data-field="email"]')?.classList.toggle('err', badEmail);
      if (badName || badEmail) return;
      const pressed = (kind: string) =>
        Array.from(form.querySelectorAll(`[data-chips="${kind}"] [aria-pressed="true"]`))
          .map((c) => c.textContent?.trim())
          .join(', ');
      const body = `Name: ${name}\nEmail: ${email}\nCompany: ${get('company')}\nServices: ${pressed('multi')}\nBudget: ${pressed('single')}\n${get('message')}`;
      window.location.href = `mailto:${form.dataset.email}?subject=${encodeURIComponent(`New enquiry — ${name}`)}&body=${encodeURIComponent(body)}`;
      grid.hidden = true;
      done.classList.replace('hidden', 'flex');
      gsap.from(done, { opacity: 0, y: 16, duration: 1, ease: ease.expo });
      gsap.to(done.querySelector('path'), { strokeDashoffset: 0, duration: 0.8, delay: 0.3, ease: ease.expo });
    });
  });
}
