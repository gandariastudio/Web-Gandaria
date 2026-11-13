import { showToast } from './toast';
import { sign, upload } from './image-field';

const MAX_BYTES = 100 * 1024 * 1024;

export function initVideoFields(root: ParentNode = document) {
  root.querySelectorAll<HTMLElement>('[data-video-field]').forEach(initVideoField);
}

/** Video fields: upload a clip to Cloudinary (resource type "video") and keep {publicId,width,height}. */
export function initVideoField(field: HTMLElement) {
  if (field.dataset.ready) return;
  field.dataset.ready = '1';
  const drop = field.querySelector<HTMLElement>('[data-drop]')!;
  const fileInput = field.querySelector<HTMLInputElement>('[data-video-file]')!;
  const valueInput = field.querySelector<HTMLInputElement>('[data-video-value]')!;
  const text = field.querySelector<HTMLElement>('[data-drop-text]')!;
  const box = field.querySelector<HTMLElement>('[data-preview-box]')!;
  const bar = field.querySelector<HTMLElement>('[data-progress]')!;
  const form = field.closest('form');
  const save = form?.querySelector<HTMLButtonElement>('[data-save]');
  let busy = false;

  async function handle(file: File | undefined) {
    if (!file || busy || fileInput.disabled) return;
    if (!file.type.startsWith('video/')) return showToast('Choose a video file (MP4 or WebM).', { error: true });
    if (file.size > MAX_BYTES) return showToast('That video is larger than 100 MB. Export a shorter or smaller clip.', { error: true });
    busy = true;
    drop.classList.add('is-busy');
    save?.setAttribute('disabled', '');
    text.textContent = 'Uploading…';
    bar.style.width = '4%';
    try {
      const signature = await sign(field.dataset.folder ?? 'projects');
      const result = await upload(
        file,
        signature,
        (pct) => {
          bar.style.width = `${pct}%`;
          text.textContent = `Uploading ${pct}%`;
        },
        'video',
      );
      valueInput.value = JSON.stringify({ publicId: result.public_id, width: result.width, height: result.height });
      box.innerHTML = '';
      const video = document.createElement('video');
      Object.assign(video, { muted: true, loop: true, autoplay: true, playsInline: true });
      video.src = `https://res.cloudinary.com/${signature.cloudName}/video/upload/q_auto,c_limit,w_960/${result.public_id}.mp4`;
      box.append(video);
      drop.classList.add('has-image');
      text.textContent = 'Add a video';
      form?.dispatchEvent(new Event('change'));
    } catch (error) {
      text.textContent = 'Upload failed. Try again.';
      showToast(error instanceof Error ? error.message : 'Upload failed', { error: true });
    } finally {
      busy = false;
      drop.classList.remove('is-busy');
      bar.style.width = '0';
      save?.removeAttribute('disabled');
      fileInput.value = '';
    }
  }

  fileInput.addEventListener('change', () => handle(fileInput.files?.[0]));
  drop.addEventListener('dragover', (e) => {
    if (fileInput.disabled) return;
    e.preventDefault();
    drop.classList.add('is-over');
  });
  drop.addEventListener('dragleave', () => drop.classList.remove('is-over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('is-over');
    handle(e.dataTransfer?.files?.[0]);
  });
}
