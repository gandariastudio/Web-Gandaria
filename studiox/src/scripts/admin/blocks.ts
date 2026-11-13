import { initImageFields } from './image-field';
import { initVideoFields } from './video-field';
import { initRichText } from './rich-text';
import { videoEmbed } from '../../lib/cms/blocks';

/**
 * Case-study block editor (components/admin/blocks/BlockEditor.astro): insert from the menu,
 * move up/down, duplicate, delete. Fields are named `blocks.<i>.<field>` and renumbered after every
 * change, so the server reads them in page order. Nothing is saved until the form's Save.
 */
export function initBlocks() {
  const root = document.querySelector<HTMLElement>('[data-blocks]');
  if (!root) return;
  const list = root.querySelector<HTMLElement>('[data-blocks-list]')!;
  const menu = root.querySelector<HTMLElement>('[data-insert-menu]')!;
  const empty = root.querySelector<HTMLElement>('[data-blocks-empty]')!;
  const form = root.closest('form');
  const blocks = () => Array.from(list.querySelectorAll<HTMLElement>(':scope > [data-block]'));

  const NAME = /^blocks\.(\d+|__i__|__new__)\./;
  const ID = /blocks-(\d+|i|new)-/g;
  const setIndex = (block: HTMLElement, n: number | 'new') => {
    const prefix = `blocks.${n === 'new' ? '__new__' : n}.`;
    block.querySelectorAll<HTMLInputElement>('[name]').forEach((el) => (el.name = el.name.replace(NAME, prefix)));
    for (const attr of ['id', 'for', 'aria-describedby', 'aria-labelledby']) {
      block.querySelectorAll(`[${attr}]`).forEach((el) => el.setAttribute(attr, el.getAttribute(attr)!.replace(ID, `blocks-${n}-`)));
    }
  };

  const renumber = () => {
    const all = blocks();
    all.forEach((block, n) => {
      setIndex(block, n);
      block.querySelector<HTMLButtonElement>('[data-block-up]')!.disabled = n === 0;
      block.querySelector<HTMLButtonElement>('[data-block-down]')!.disabled = n === all.length - 1;
    });
    empty.hidden = all.length > 0;
  };

  const changed = () => {
    renumber();
    form?.dispatchEvent(new Event('change'));
  };

  /** Show the upload or the link field to match the video block's Source choice. */
  const syncSource = (block: HTMLElement) => {
    const checked = block.querySelector<HTMLInputElement>('[data-video-source]:checked');
    if (!checked) return;
    block.querySelectorAll<HTMLElement>('[data-when-source]').forEach((el) => (el.hidden = el.dataset.whenSource !== checked.value));
  };

  /** Text areas grow with their content, like lines in a document. */
  const grow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  /** Show the YouTube/Vimeo player as soon as a link is valid. */
  const syncEmbed = (input: HTMLInputElement) => {
    const box = input.closest('[data-block]')?.querySelector<HTMLElement>('[data-embed-preview]');
    if (!box) return;
    const embed = videoEmbed(input.value);
    if (!embed) {
      box.hidden = true;
      box.innerHTML = '';
      return;
    }
    const current = box.querySelector('iframe');
    if (current?.src === embed.src) return;
    box.innerHTML = '';
    const frame = document.createElement('iframe');
    Object.assign(frame, { src: embed.src, title: 'Video preview', loading: 'lazy', allowFullscreen: true });
    frame.allow = 'autoplay; fullscreen; picture-in-picture';
    box.append(frame);
    box.hidden = false;
  };

  const wire = (block: HTMLElement) => {
    initImageFields(block);
    initVideoFields(block);
    initRichText(block);
    syncSource(block);
    block.querySelectorAll<HTMLTextAreaElement>('textarea[data-autogrow]').forEach(grow);
  };

  // ---- insert menu ----
  let anchor: HTMLElement | null = null;
  const closeMenu = () => {
    menu.hidden = true;
    anchor?.setAttribute('aria-expanded', 'false');
    anchor = null;
  };
  const openMenu = (button: HTMLElement) => {
    if (anchor === button) return closeMenu();
    closeMenu();
    anchor = button;
    button.setAttribute('aria-expanded', 'true');
    const r = button.getBoundingClientRect();
    const base = root.getBoundingClientRect();
    menu.style.top = `${r.bottom - base.top + 6}px`;
    menu.hidden = false;
    menu.querySelector<HTMLElement>('[data-insert-type]')?.focus();
  };

  const insert = (type: string) => {
    const template = root.querySelector<HTMLTemplateElement>(`template[data-block-template="${type}"]`);
    const node = template?.content.firstElementChild?.cloneNode(true) as HTMLElement | undefined;
    if (!node || !anchor) return;
    const after = anchor.closest<HTMLElement>('[data-block]');
    if (after) after.after(node);
    else if (anchor.hasAttribute('data-insert-end')) list.append(node);
    else list.prepend(node);
    closeMenu();
    changed();
    wire(node);
    node.scrollIntoView({ block: 'nearest' });
    node.querySelector<HTMLElement>('.a-doc-content textarea, .a-doc-content input.a-doc-input')?.focus();
  };

  root.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const insertButton = target.closest<HTMLElement>('[data-insert]');
    if (insertButton) return openMenu(insertButton);
    const typeButton = target.closest<HTMLElement>('[data-insert-type]');
    if (typeButton) return insert(typeButton.dataset.insertType!);

    const block = target.closest<HTMLElement>('[data-block]');
    if (!block) return;
    if (target.closest('[data-block-up]')) {
      const prev = block.previousElementSibling;
      if (prev) prev.before(block);
      changed();
    } else if (target.closest('[data-block-down]')) {
      const next = block.nextElementSibling;
      if (next) next.after(block);
      changed();
    } else if (target.closest('[data-block-copy]')) {
      const copy = block.cloneNode(true) as HTMLElement;
      // Live values are not attributes, so copy them over; give the copy its own names before it
      // joins the form, or its radio buttons would steal the original's choice.
      const from = block.querySelectorAll<HTMLInputElement>('input, textarea, select');
      const to = copy.querySelectorAll<HTMLInputElement>('input, textarea, select');
      from.forEach((el, k) => {
        if (el.type === 'radio' || el.type === 'checkbox') to[k].checked = el.checked;
        else if (el.type !== 'file') to[k].value = el.value;
      });
      copy.querySelectorAll('[data-ready]').forEach((el) => el.removeAttribute('data-ready'));
      copy.removeAttribute('data-rich-ready');
      copy.querySelectorAll('dialog[open]').forEach((d) => d.removeAttribute('open'));
      setIndex(copy, 'new');
      block.after(copy);
      changed();
      wire(copy);
    } else if (target.closest('[data-block-delete]')) {
      block.remove();
      changed();
    }
  });

  root.addEventListener('change', (e) => {
    const input = e.target as HTMLElement;
    if (input.matches('[data-video-source]')) syncSource(input.closest<HTMLElement>('[data-block]')!);
  });
  root.addEventListener('input', (e) => {
    const input = e.target as HTMLElement;
    if (input.matches('[data-embed-url]')) syncEmbed(input as HTMLInputElement);
  });
  // Growing text areas are also used outside the editor (the title and summary above it).
  document.addEventListener('input', (e) => {
    const input = e.target as HTMLElement;
    if (input.matches('textarea[data-autogrow]')) grow(input as HTMLTextAreaElement);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).matches('textarea[data-single-line]')) e.preventDefault();
  });

  document.addEventListener('click', (e) => {
    if (!menu.hidden && !(e.target as HTMLElement).closest('[data-insert-menu], [data-insert]')) closeMenu();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !menu.hidden) {
      const back = anchor;
      closeMenu();
      back?.focus();
    }
  });

  // Names are renumbered after every change already; once more before saving, to be safe.
  form?.addEventListener('submit', renumber, { capture: true });
  renumber();
  blocks().forEach(syncSource);
  document.querySelectorAll<HTMLTextAreaElement>('textarea[data-autogrow]').forEach(grow);
}
