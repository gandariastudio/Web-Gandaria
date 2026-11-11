import { slugify } from '@/lib/cms/slugify';

/** Only one ⋯ menu open at a time; close on outside click or Escape. */
export function initMenus() {
  const menus = () => document.querySelectorAll<HTMLDetailsElement>('details[data-menu]');
  menus().forEach((menu) =>
    menu.addEventListener('toggle', () => {
      if (menu.open) menus().forEach((other) => other !== menu && (other.open = false));
    }),
  );
  document.addEventListener('click', (e) => {
    menus().forEach((menu) => {
      if (menu.open && !menu.contains(e.target as Node)) menu.open = false;
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    menus().forEach((menu) => {
      if (menu.open) {
        menu.open = false;
        menu.querySelector('summary')?.focus();
      }
    });
  });
}

/** Client-side search over [data-list] items using their data-search text. */
export function initSearch() {
  const input = document.querySelector<HTMLInputElement>('[data-list-search]');
  const list = document.querySelector<HTMLElement>('[data-list]');
  if (!input || !list) return;
  const items = [...list.querySelectorAll<HTMLElement>('[data-item]')];
  const empty = document.querySelector<HTMLElement>('[data-list-empty]');
  const count = document.querySelector<HTMLElement>('[data-list-count]');
  const original = count?.textContent ?? '';
  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    let shown = 0;
    items.forEach((item) => {
      const match = !q || (item.dataset.search ?? '').includes(q);
      item.hidden = !match;
      if (match) shown++;
    });
    list.classList.toggle('is-filtered', !!q);
    if (empty) empty.hidden = shown > 0;
    if (count) count.textContent = q ? `${shown} of ${items.length} shown` : original;
  });
}

/**
 * Two-step delete (Curater style): the first click arms a 3-second countdown, clicking again
 * (or Cancel) stops it, reaching zero submits the button's form.
 */
export function initCountdownDelete() {
  document.querySelectorAll<HTMLButtonElement>('[data-countdown-delete]').forEach((button) => {
    const form = button.closest('form')!;
    const text = button.querySelector<HTMLElement>('[data-countdown-text]') ?? button;
    const cancel = form.querySelector<HTMLButtonElement>('[data-countdown-cancel]');
    const label = button.dataset.label ?? text.textContent ?? 'Delete';
    let timer = 0;
    let left = 0;

    const reset = () => {
      window.clearInterval(timer);
      timer = 0;
      button.classList.remove('is-armed');
      text.textContent = label;
      if (cancel) cancel.hidden = true;
    };
    const tick = () => {
      left -= 1;
      if (left <= 0) {
        window.clearInterval(timer);
        text.textContent = 'Deleting…';
        button.disabled = true;
        form.submit();
        return;
      }
      text.textContent = `Deleting in ${left}… click to undo`;
    };

    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (timer) return reset();
      left = 3;
      button.classList.add('is-armed');
      text.textContent = `Deleting in ${left}… click to undo`;
      if (cancel) cancel.hidden = false;
      timer = window.setInterval(tick, 1000);
    });
    cancel?.addEventListener('click', reset);
  });
}

/** New items: the slug follows the title until it is edited by hand. */
export function initSlugAutofill() {
  const source = document.querySelector<HTMLInputElement>('[data-slug-source]');
  const target = document.querySelector<HTMLInputElement>('[data-slug-target]');
  if (!source || !target || target.dataset.autoslug !== 'true') return;
  let touched = target.value !== '';
  target.addEventListener('input', () => (touched = target.value !== ''));
  source.addEventListener('input', () => {
    if (!touched) target.value = slugify(source.value);
  });
}

/** Save bar state: "Unsaved changes", Discard, a warning before leaving, "Saving…" on submit. */
export function initDirtyTracking() {
  document.querySelectorAll<HTMLFormElement>('form[data-edit-form]').forEach((form) => {
    const label = form.querySelector<HTMLElement>('[data-dirty-label]');
    const discard = form.querySelector<HTMLElement>('[data-discard]');
    const save = form.querySelector<HTMLButtonElement>('[data-save]');
    let dirty = form.dataset.startDirty === 'true';
    let submitting = false;

    const render = () => {
      if (label) {
        label.textContent = dirty ? 'Unsaved changes' : label.dataset.clean ?? label.textContent;
        label.classList.toggle('is-dirty', dirty);
      }
      if (discard) discard.hidden = !dirty;
    };
    if (label) label.dataset.clean = label.textContent ?? '';
    const markDirty = () => {
      if (!dirty) {
        dirty = true;
        render();
      }
    };
    form.addEventListener('input', markDirty);
    form.addEventListener('change', markDirty);
    form.addEventListener('submit', () => {
      submitting = true;
      if (save) {
        save.textContent = 'Saving…';
        save.disabled = true;
      }
    });
    discard?.addEventListener('click', () => (submitting = true));
    window.addEventListener('beforeunload', (e) => {
      if (dirty && !submitting) e.preventDefault();
    });
    render();
  });
}
