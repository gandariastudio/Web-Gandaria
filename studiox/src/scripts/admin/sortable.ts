import { showToast } from './toast';

/**
 * Drag-to-reorder for [data-sortable] lists, built on pointer events so it works with a mouse,
 * a trackpad and touch screens. Dragging starts from the grip; the new order is posted to the
 * list page (intent=reorder) and confirmed with a toast. Move up / Move down in each item's
 * menu remain for keyboard users.
 */
export function initSortable() {
  document.querySelectorAll<HTMLElement>('[data-sortable]').forEach((list) => {
    const endpoint = list.dataset.sortable!;
    const items = () => [...list.querySelectorAll<HTMLElement>(':scope > [data-item]')];
    const order = () => items().map((el) => el.dataset.id!);
    const isGrid = () => getComputedStyle(list).display === 'grid';

    let dragged: HTMLElement | null = null;
    let before: string[] = [];

    async function persist() {
      const after = order();
      if (after.join() === before.join()) return;
      const body = new FormData();
      body.set('intent', 'reorder');
      body.set('ids', after.join(','));
      try {
        const res = await fetch(endpoint, { method: 'POST', body, headers: { Accept: 'application/json' } });
        if (!res.ok) throw new Error();
        showToast('Order saved');
      } catch {
        showToast('Could not save the new order. Reloading…', { error: true });
        window.setTimeout(() => location.reload(), 1200);
      }
    }

    // Moving the dragged node in the DOM releases pointer capture, so movement and release are
    // tracked on the document for the duration of the drag.
    const onMove = (e: PointerEvent) => {
      if (!dragged) return;
      const target = document.elementFromPoint(e.clientX, e.clientY)?.closest<HTMLElement>('[data-item]');
      if (!target || target === dragged || !list.contains(target)) return;
      const rect = target.getBoundingClientRect();
      const after = isGrid() ? e.clientX > rect.left + rect.width / 2 : e.clientY > rect.top + rect.height / 2;
      target[after ? 'after' : 'before'](dragged);
    };
    const onEnd = () => {
      if (!dragged) return;
      dragged.classList.remove('is-dragging');
      dragged = null;
      list.classList.remove('is-sorting');
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onEnd);
      document.removeEventListener('pointercancel', onEnd);
      void persist();
    };

    list.querySelectorAll<HTMLElement>('[data-grip]').forEach((grip) => {
      grip.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || list.classList.contains('is-filtered')) return;
        e.preventDefault();
        dragged = grip.closest<HTMLElement>('[data-item]');
        if (!dragged) return;
        before = order();
        dragged.classList.add('is-dragging');
        list.classList.add('is-sorting');
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onEnd);
        document.addEventListener('pointercancel', onEnd);
      });
    });
  });
}
