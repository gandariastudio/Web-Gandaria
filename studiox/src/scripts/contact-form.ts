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

    // How long the form has been open: the server treats very fast submissions as bots.
    const openedAt = performance.now();
    const error = form.querySelector<HTMLElement>('[data-cf-error]')!;
    const submit = form.querySelector<HTMLButtonElement>('[data-cf-submit]')!;
    const label = form.querySelector<HTMLElement>('[data-cf-label]')!;
    let sending = false;

    const showError = (message: string) => {
      error.textContent = message;
      error.hidden = false;
    };
    const setSending = (on: boolean) => {
      sending = on;
      submit.setAttribute('aria-busy', String(on));
      label.textContent = on ? 'Sending…' : 'Send enquiry';
    };

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (sending) return;
      error.hidden = true;
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

      setSending(true);
      try {
        const res = await fetch(form.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            name,
            email,
            company: get('company'),
            services: pressed('multi'),
            budget: pressed('single'),
            message: get('message'),
            page: location.pathname,
            website: get('website'),
            elapsed: Math.round(performance.now() - openedAt),
          }),
        });
        const result = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string; errors?: Record<string, string> };
        if (!res.ok || !result.ok) {
          for (const field of ['name', 'email']) form.querySelector(`[data-field="${field}"]`)?.classList.toggle('err', !!result.errors?.[field]);
          const other = Object.entries(result.errors ?? {}).find(([k]) => k !== 'name' && k !== 'email');
          showError(result.error ?? (other ? other[1] : result.errors ? 'Check the highlighted fields.' : `Could not send right now. Please email ${form.dataset.email} instead.`));
          return;
        }
      } catch {
        showError(`Could not send. Check your connection and try again, or email ${form.dataset.email}.`);
        return;
      } finally {
        setSending(false);
      }

      grid.hidden = true;
      done.classList.replace('hidden', 'flex');
      gsap.from(done, { opacity: 0, y: 16, duration: 1, ease: ease.expo });
      gsap.to(done.querySelector('path'), { strokeDashoffset: 0, duration: 0.8, delay: 0.3, ease: ease.expo });
    });
  });
}
