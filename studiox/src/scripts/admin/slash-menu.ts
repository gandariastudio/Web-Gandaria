import type { Editor } from '@tiptap/core';

/**
 * Notion-style menus for the case-study Text block (BlockCard.astro):
 * - typing "/" at the start of a line or after a space opens `[data-slash]`, filtered by what
 *   follows the slash; arrows + Enter (or a click) turn the line into the chosen kind;
 * - selecting text shows `[data-bubble]` (bold, italic, link; wired by rich-text.ts).
 * Both are `position: fixed` and follow the caret or selection.
 */
type Range = { from: number; to: number };
type Item = { label: string; hint: string; glyph: string; keys: string; run: (editor: Editor, range: Range) => void };

const ITEMS: Item[] = [
  { label: 'Text', hint: 'A plain paragraph', glyph: 'Aa', keys: 'text paragraph plain body', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().run() },
  { label: 'Heading 1', hint: 'Big section heading', glyph: 'H1', keys: 'h1 heading title large big', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().setHeading({ level: 1 }).run() },
  { label: 'Heading 2', hint: 'Medium heading', glyph: 'H2', keys: 'h2 heading subtitle medium', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().setHeading({ level: 2 }).run() },
  { label: 'Heading 3', hint: 'Small heading', glyph: 'H3', keys: 'h3 heading small', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().setHeading({ level: 3 }).run() },
  { label: 'Bulleted list', hint: 'A simple list', glyph: '•', keys: 'bulleted list bullet unordered ul', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().toggleBulletList().run() },
  { label: 'Numbered list', hint: 'A list with numbers', glyph: '1.', keys: 'numbered list ordered ol number', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().toggleOrderedList().run() },
  { label: 'Quote', hint: 'Set a line apart', glyph: '“', keys: 'quote blockquote citation', run: (e, r) => e.chain().focus().deleteRange(r).clearNodes().toggleBlockquote().run() },
];

const SLASH = /(?:^|\s)\/([^\s/]{0,24})$/;
const GAP = 8;

export function attachBlockMenus(editor: Editor, root: HTMLElement): (e: KeyboardEvent) => boolean {
  const menu = root.querySelector<HTMLElement>('[data-slash]')!;
  const bubble = root.querySelector<HTMLElement>('[data-bubble]')!;

  // ---- slash menu ----
  let open = false;
  let start = 0; // position of the "/"
  let query = '';
  let active = 0;
  let items: Item[] = [];
  let dismissed = -1; // a "/" closed with Escape stays closed until it is typed again

  const range = (): Range => ({ from: start, to: editor.state.selection.from });

  const render = () => {
    menu.innerHTML =
      `<p class="a-rt-slash-head">${query ? 'Results' : 'Turn into'}</p>` +
      items
        .map(
          (it, i) =>
            `<button type="button" class="a-rt-slash-item${i === active ? ' is-active' : ''}" role="option" aria-selected="${i === active}" data-i="${i}">` +
            `<span class="a-rt-slash-glyph">${it.glyph}</span><span><span class="a-rt-slash-label">${it.label}</span><span class="a-rt-slash-hint">${it.hint}</span></span></button>`,
        )
        .join('');
    menu.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' });
  };

  const placeMenu = () => {
    const at = editor.view.coordsAtPos(start);
    const h = menu.offsetHeight;
    const below = at.bottom + GAP + h <= window.innerHeight;
    menu.style.top = `${below ? at.bottom + GAP : Math.max(GAP, at.top - GAP - h)}px`;
    menu.style.left = `${Math.min(at.left, window.innerWidth - menu.offsetWidth - GAP)}px`;
  };

  const close = () => {
    if (!open) return;
    open = false;
    menu.hidden = true;
  };

  const check = () => {
    const sel = editor.state.selection;
    if (!sel.empty || !editor.isFocused) return close();
    const { $from } = sel;
    const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '￼');
    const m = SLASH.exec(before);
    if (!m) {
      dismissed = -1;
      return close();
    }
    const at = $from.pos - m[1].length - 1;
    if (at === dismissed) return close();
    const q = m[1].toLowerCase();
    const found = ITEMS.filter((it) => `${it.label} ${it.keys}`.toLowerCase().includes(q));
    if (!found.length) return close();
    if (!open || q !== query || at !== start) active = 0;
    start = at;
    query = q;
    items = found;
    open = true;
    menu.hidden = false;
    hideBubble();
    render();
    placeMenu();
  };

  const choose = (i: number) => {
    const item = items[i];
    if (!item) return;
    const r = range();
    close();
    item.run(editor, r);
  };

  menu.addEventListener('mousedown', (e) => e.preventDefault());
  menu.addEventListener('click', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (button) choose(Number(button.dataset.i));
  });
  menu.addEventListener('pointermove', (e) => {
    const button = (e.target as HTMLElement).closest<HTMLElement>('[data-i]');
    if (!button || Number(button.dataset.i) === active) return;
    active = Number(button.dataset.i);
    menu.querySelectorAll('[data-i]').forEach((b, i) => {
      b.classList.toggle('is-active', i === active);
      b.setAttribute('aria-selected', String(i === active));
    });
  });

  // ---- selection toolbar ----
  const hideBubble = () => {
    bubble.hidden = true;
  };
  const updateBubble = () => {
    const { from, to, empty } = editor.state.selection;
    if (open || empty || !editor.isFocused || !editor.state.doc.textBetween(from, to).trim()) return hideBubble();
    bubble.hidden = false;
    const a = editor.view.coordsAtPos(from);
    const b = editor.view.coordsAtPos(to, -1);
    const sameLine = Math.abs(a.top - b.top) < 4;
    const center = sameLine ? (a.left + b.right) / 2 : a.left + bubble.offsetWidth / 2;
    const top = a.top - GAP - bubble.offsetHeight;
    bubble.style.top = `${top >= GAP ? top : Math.max(a.bottom, b.bottom) + GAP}px`;
    bubble.style.left = `${Math.min(Math.max(GAP, center - bubble.offsetWidth / 2), window.innerWidth - bubble.offsetWidth - GAP)}px`;
  };

  editor.on('update', check);
  editor.on('selectionUpdate', () => {
    check();
    updateBubble();
  });
  editor.on('focus', updateBubble);
  editor.on('blur', () => {
    close();
    hideBubble();
  });
  window.addEventListener(
    'scroll',
    () => {
      if (open) placeMenu();
      if (!bubble.hidden) updateBubble();
    },
    { passive: true, capture: true },
  );

  return (e) => {
    if (!open) return false;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      active = (active + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length;
      render();
      return true;
    }
    if (e.key === 'Enter' || e.key === 'Tab') {
      choose(active);
      return true;
    }
    if (e.key === 'Escape') {
      dismissed = start;
      close();
      return true;
    }
    return false;
  };
}
