import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { attachBlockMenus } from './slash-menu';

/**
 * TipTap editors on `[data-rich-text]`.
 * - The journal article editor (default) has a toolbar and allows sanitize.ts#ARTICLE_TAGS.
 * - `data-rich-mode="block"` is the case-study Text block, Notion style: "/" opens a menu of
 *   headings, lists, quote and divider, and selecting text shows a bold/italic/link toolbar
 *   (slash-menu.ts). Its "Heading 1/2/3" are h1/h2/h3 in the editor (so Markdown's "# " works) and
 *   are stored one level down, as h2/h3/h4 (sanitize.ts#BLOCK_TEXT_TAGS).
 * Keep the extensions here in sync with the sanitiser.
 */
export function initRichText(root: ParentNode = document) {
  if (root instanceof HTMLElement && root.matches('[data-rich-text]')) initRichTextField(root);
  root.querySelectorAll<HTMLElement>('[data-rich-text]').forEach(initRichTextField);
}

/** Stored h2/h3/h4 → editor h1/h2/h3, and back. */
const headingsDown = (html: string) => html.replace(/<(\/?)h([1-3])(?=[\s>])/g, (_, slash, n) => `<${slash}h${Number(n) + 1}`);
const headingsUp = (html: string) => html.replace(/<(\/?)h([2-4])(?=[\s>])/g, (_, slash, n) => `<${slash}h${Number(n) - 1}`);

export function initRichTextField(root: HTMLElement) {
  if (root.dataset.richReady) return;
  root.dataset.richReady = '1';
  const mount = root.querySelector<HTMLElement>('[data-editor]')!;
  const input = root.querySelector<HTMLInputElement>('[data-rich-value]')!;
  const buttons = root.querySelectorAll<HTMLButtonElement>('[data-cmd]');
  const block = root.dataset.richMode === 'block';
  // A duplicated block arrives with the original's editor markup; start from its value instead.
  mount.innerHTML = '';
  const markEmpty = () => (mount.dataset.empty = String(editor.isEmpty));
  let menuKeys: ((e: KeyboardEvent) => boolean) | null = null;

  const editor = new Editor({
    element: mount,
    content: block ? headingsUp(input.value) : input.value,
    extensions: [
      StarterKit.configure({
        heading: { levels: block ? [1, 2, 3] : [2, 3] },
        horizontalRule: block ? undefined : false,
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
    ],
    editorProps: {
      handleKeyDown: (_view, event) => menuKeys?.(event) ?? false,
    },
    onUpdate: ({ editor }) => {
      const html = editor.isEmpty ? '' : editor.getHTML();
      input.value = block ? headingsDown(html) : html;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      markEmpty();
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

  buttons.forEach((b) => {
    // Keep the text selection when a toolbar button is pressed.
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => run[b.dataset.cmd!]?.());
  });
  if (block) menuKeys = attachBlockMenus(editor, root);
  markEmpty();
  refresh();
}
