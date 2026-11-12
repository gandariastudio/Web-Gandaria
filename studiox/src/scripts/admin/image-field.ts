import { showToast } from './toast';

type Signature = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };
type UploadResult = { public_id: string; width: number; height: number; secure_url: string };

const MAX_BYTES = 20 * 1024 * 1024;

async function sign(folder: string): Promise<Signature> {
  const res = await fetch('/api/admin/cloudinary-signature', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? 'Could not prepare the upload');
  return res.json();
}

function upload(file: File, s: Signature, onProgress: (pct: number) => void): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const body = new FormData();
    body.append('file', file);
    body.append('api_key', s.apiKey);
    body.append('timestamp', String(s.timestamp));
    body.append('folder', s.folder);
    body.append('signature', s.signature);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`);
    xhr.upload.addEventListener('progress', (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100)));
    xhr.addEventListener('load', () => {
      const data = JSON.parse(xhr.responseText || '{}');
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data?.error?.message ?? `Upload failed (${xhr.status})`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.send(body);
  });
}

/** Image fields: click or drop a file, upload straight to Cloudinary, preview it, store the result in the hidden input. */
export function initImageFields() {
  document.querySelectorAll<HTMLElement>('[data-image-field]').forEach((field) => {
    const drop = field.querySelector<HTMLElement>('[data-drop]')!;
    const fileInput = field.querySelector<HTMLInputElement>('[data-image-file]')!;
    const valueInput = field.querySelector<HTMLInputElement>('[data-image-value]')!;
    const status = field.querySelector<HTMLElement>('[data-image-status]')!;
    const text = field.querySelector<HTMLElement>('[data-drop-text]')!;
    const box = field.querySelector<HTMLElement>('[data-preview-box]')!;
    const bar = field.querySelector<HTMLElement>('[data-progress]')!;
    const form = field.closest('form');
    const save = form?.querySelector<HTMLButtonElement>('[data-save]');
    const reset = field.querySelector<HTMLButtonElement>('[data-image-reset]');
    const alt = field.querySelector<HTMLInputElement>('[data-image-alt]');
    const enabled = !fileInput.disabled;
    let busy = false;

    const showPreview = (src: string) => {
      box.innerHTML = '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      box.append(img);
      drop.classList.add('has-image');
    };

    // Optional slots (site images): go back to the built-in image by clearing the upload.
    reset?.addEventListener('click', () => {
      valueInput.value = '';
      if (alt) alt.value = '';
      if (field.dataset.fallback) showPreview(field.dataset.fallback);
      status.textContent = 'Using the built-in image. Save to apply.';
      reset.hidden = true;
      form?.dispatchEvent(new Event('change'));
    });

    async function handle(file: File | undefined) {
      if (!file || busy || !enabled) return;
      if (!file.type.startsWith('image/')) return showToast('Choose an image file (JPG, PNG, WebP or SVG).', { error: true });
      if (file.size > MAX_BYTES) return showToast('That image is larger than 20 MB. Export a smaller version first.', { error: true });
      busy = true;
      save?.setAttribute('disabled', '');
      text.textContent = 'Uploading…';
      bar.style.width = '4%';
      try {
        const signature = await sign(field.dataset.folder ?? 'misc');
        const result = await upload(file, signature, (pct) => {
          bar.style.width = `${pct}%`;
          text.textContent = `Uploading ${pct}%`;
        });
        valueInput.value = JSON.stringify({ publicId: result.public_id, url: null, width: result.width, height: result.height });
        showPreview(result.secure_url);
        if (reset) reset.hidden = false;
        text.textContent = 'Drop a new image or click to replace';
        status.textContent = `Uploaded ${result.width} × ${result.height}. Save to apply.`;
        form?.dispatchEvent(new Event('change'));
      } catch (error) {
        text.textContent = 'Upload failed. Try again.';
        showToast(error instanceof Error ? error.message : 'Upload failed', { error: true });
      } finally {
        busy = false;
        bar.style.width = '0';
        save?.removeAttribute('disabled');
        fileInput.value = '';
      }
    }

    fileInput.addEventListener('change', () => handle(fileInput.files?.[0]));
    ['dragenter', 'dragover'].forEach((type) =>
      drop.addEventListener(type, (e) => {
        if (!enabled) return;
        e.preventDefault();
        drop.classList.add('is-over');
      }),
    );
    ['dragleave', 'drop'].forEach((type) => drop.addEventListener(type, () => drop.classList.remove('is-over')));
    drop.addEventListener('drop', (e) => {
      e.preventDefault();
      handle((e as DragEvent).dataTransfer?.files?.[0]);
    });
  });
}
