import { slugify } from '@/lib/cms/slugify';
import { initImageFields } from './image-field';
import { initRichText } from './rich-text';

/** Confirm destructive submits: <form data-confirm="Delete …?"> */
document.querySelectorAll<HTMLFormElement>('form[data-confirm]').forEach((form) => {
  form.addEventListener('submit', (e) => {
    if (!window.confirm(form.dataset.confirm ?? 'Are you sure?')) e.preventDefault();
  });
});

/** New items: fill the slug from the title until the slug is edited by hand. */
const source = document.querySelector<HTMLInputElement>('[data-slug-source]');
const target = document.querySelector<HTMLInputElement>('[data-slug-target]');
if (source && target && target.dataset.autoslug === 'true') {
  let touched = target.value !== '';
  target.addEventListener('input', () => (touched = target.value !== ''));
  source.addEventListener('input', () => {
    if (!touched) target.value = slugify(source.value);
  });
}

/** Warn before leaving a form with unsaved edits. */
document.querySelectorAll<HTMLFormElement>('form[data-edit-form]').forEach((form) => {
  let dirty = false;
  form.addEventListener('input', () => (dirty = true));
  form.addEventListener('change', () => (dirty = true));
  form.addEventListener('submit', () => (dirty = false));
  window.addEventListener('beforeunload', (e) => {
    if (dirty) e.preventDefault();
  });
});

initImageFields();
initRichText();
