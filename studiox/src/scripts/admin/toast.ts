const CHECK = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>';

/** Dark toast at the bottom of the screen; appears and disappears without animation. */
export function showToast(message: string, { error = false, duration = 3200 } = {}) {
  const host = document.querySelector<HTMLElement>('[data-toasts]');
  if (!host) return;
  const toast = document.createElement('div');
  toast.className = `a-toast${error ? ' is-error' : ''}`;
  toast.setAttribute('role', error ? 'alert' : 'status');
  toast.innerHTML = error ? '' : CHECK;
  toast.append(document.createTextNode(message));
  host.append(toast);
  window.setTimeout(() => toast.remove(), duration);
}

/** Server-side flash (?saved=1, ?done=…) becomes a toast, and the query is removed from the URL. */
export function initFlash() {
  const flash = document.querySelector<HTMLElement>('[data-flash]');
  if (!flash?.dataset.flash) return;
  showToast(flash.dataset.flash);
  const url = new URL(location.href);
  url.searchParams.delete('saved');
  url.searchParams.delete('done');
  history.replaceState(null, '', url.pathname + (url.search || '') + url.hash);
}
