import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';

/** Formatting kept in sync with src/lib/cms/sanitize.ts (everything else is disabled). */
export function initRichText() {
  document.querySelectorAll<HTMLElement>('[data-rich-text]').forEach((root) => {
    const mount = root.querySelector<HTMLElement>('[data-editor]')!;
    const input = root.querySelector<HTMLInputElement>('[data-rich-value]')!;
    const buttons = root.querySelectorAll<HTMLButtonElement>('[data-cmd]');

    const editor = new Editor({
      element: mount,
      content: input.value,
      extensions: [
        StarterKit.configure({
          heading: { levels: [2, 3] },
          code: false,
          codeBlock: false,
          horizontalRule: false,
          strike: false,
          underline: false,
          link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
        }),
      ],
      onUpdate: ({ editor }) => {
        input.value = editor.isEmpty ? '' : editor.getHTML();
        input.dispatchEvent(new Event('input', { bubbles: true }));
        refresh();
      },
      onSelectionUpdate: () => refresh(),
    });

    const active: Record<string, () => boolean> = {
      h2: () => editor.isActive('heading', { level: 2 }),
      h3: () => editor.isActive('heading', { level: 3 }),
      bold: () => editor.isActive('bold'),
      italic: () => editor.isActive('italic'),
      link: () => editor.isActive('link'),
      bullet: () => editor.isActive('bulletList'),
      ordered: () => editor.isActive('orderedList'),
      quote: () => editor.isActive('blockquote'),
    };

    function refresh() {
      buttons.forEach((b) => b.classList.toggle('is-active', active[b.dataset.cmd!]?.() ?? false));
    }

    const run: Record<string, () => void> = {
      h2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      h3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      bold: () => editor.chain().focus().toggleBold().run(),
      italic: () => editor.chain().focus().toggleItalic().run(),
      bullet: () => editor.chain().focus().toggleBulletList().run(),
      ordered: () => editor.chain().focus().toggleOrderedList().run(),
      quote: () => editor.chain().focus().toggleBlockquote().run(),
      undo: () => editor.chain().focus().undo().run(),
      redo: () => editor.chain().focus().redo().run(),
      link: () => {
        const previous = editor.getAttributes('link').href as string | undefined;
        const href = window.prompt('Link URL (leave empty to remove)', previous ?? 'https://');
        if (href === null) return;
        if (href.trim() === '') editor.chain().focus().extendMarkRange('link').unsetLink().run();
        else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run();
      },
    };

    buttons.forEach((b) => b.addEventListener('click', () => run[b.dataset.cmd!]?.()));
    refresh();
  });
}
