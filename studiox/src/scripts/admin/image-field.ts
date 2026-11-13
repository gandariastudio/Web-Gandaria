import { showToast } from './toast';
import { DEFAULT_CROP, frameLayout, isDefaultCrop, normalizeCrop, type ImageCrop } from '../../lib/cms/crop';

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
    const adjust = field.querySelector<HTMLButtonElement>('[data-image-adjust]');
    const enabled = !fileInput.disabled;
    const [aspectW, aspectH] = (field.dataset.aspect ?? '').split('x').map(Number);
    let busy = false;

    type Stored = { publicId?: string | null; url?: string | null; width?: number; height?: number; crop?: ImageCrop | null };
    const readValue = (): Stored | null => {
      try {
        return valueInput.value ? (JSON.parse(valueInput.value) as Stored) : null;
      } catch {
        return null;
      }
    };
    const isZoomable = () => field.dataset.zoomable === 'true';
    /** The original laid out in the frame shape, as on the website (placeholders cannot zoom). */
    const place = (img: HTMLImageElement, value: Stored, crop: ImageCrop | null | undefined) => {
      if (!aspectW || !value.width || !value.height) return;
      const c = isZoomable() ? crop : crop && { ...crop, zoom: 1 };
      const l = frameLayout(value.width, value.height, c, aspectW, aspectH);
      Object.assign(img.style, { left: `${l.left}%`, top: `${l.top}%`, width: `${l.width}%`, height: `${l.height}%` });
      img.classList.add('is-placed');
    };

    const showPreview = (src: string, value?: Stored) => {
      box.innerHTML = '';
      const img = document.createElement('img');
      img.src = src;
      img.alt = '';
      if (value) place(img, value, value.crop);
      box.append(img);
      drop.classList.add('has-image');
    };

    // Adjust dialog: drag to move, slider to zoom. Only the crop point and zoom are stored.
    const dialog = field.querySelector<HTMLDialogElement>('[data-crop-dialog]');
    if (dialog && adjust) {
      const frame = dialog.querySelector<HTMLElement>('[data-crop-frame]')!;
      const img = dialog.querySelector<HTMLImageElement>('[data-crop-img]')!;
      const zoom = dialog.querySelector<HTMLInputElement>('[data-crop-zoom]')!;
      const zoomNote = dialog.querySelector<HTMLElement>('[data-crop-zoom-note]')!;
      let value: Stored | null = null;
      let crop: ImageCrop = { ...DEFAULT_CROP };
      const draw = () => value && place(img, value, crop);

      /**
       * Find the crop point whose layout puts the image edge at `target` (% of the frame). The
       * layout moves monotonically with the point, so a binary search is exact enough; when the
       * image cannot move along this axis the point is left alone.
       */
      const solve = (axis: 'x' | 'y', target: number) => {
        if (!value?.width || !value.height) return crop[axis];
        const c = isZoomable() ? crop : { ...crop, zoom: 1 };
        const edge = (p: number) => {
          const l = frameLayout(value!.width!, value!.height!, { ...c, [axis]: p }, aspectW, aspectH);
          return axis === 'x' ? l.left : l.top;
        };
        if (Math.abs(edge(0) - edge(1)) < 1e-6) return crop[axis];
        let lo = 0;
        let hi = 1;
        for (let i = 0; i < 32; i++) {
          const mid = (lo + hi) / 2;
          if (edge(mid) > target) lo = mid;
          else hi = mid;
        }
        return hi;
      };

      adjust.addEventListener('click', () => {
        value = readValue();
        if (!value) return;
        crop = normalizeCrop(value.crop);
        img.src = field.dataset.original ?? '';
        zoom.value = String(crop.zoom);
        zoom.disabled = !isZoomable();
        zoomNote.hidden = isZoomable();
        draw();
        dialog.showModal();
      });

      let last: { x: number; y: number } | null = null;
      frame.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        frame.setPointerCapture(e.pointerId);
        frame.classList.add('is-dragging');
        last = { x: e.clientX, y: e.clientY };
      });
      frame.addEventListener('pointermove', (e) => {
        if (!last || !value) return;
        const rect = frame.getBoundingClientRect();
        const now = img.style;
        const dx = ((e.clientX - last.x) / rect.width) * 100;
        const dy = ((e.clientY - last.y) / rect.height) * 100;
        last = { x: e.clientX, y: e.clientY };
        // Move from where the image is now, so dragging past an edge never builds up slack.
        crop = { ...crop, x: solve('x', parseFloat(now.left) + dx), y: solve('y', parseFloat(now.top) + dy) };
        draw();
      });
      const endDrag = () => {
        last = null;
        frame.classList.remove('is-dragging');
      };
      frame.addEventListener('pointerup', endDrag);
      frame.addEventListener('pointercancel', endDrag);

      zoom.addEventListener('input', () => {
        crop = { ...crop, zoom: Number(zoom.value) };
        draw();
      });
      // The dialog sits inside the edit form: keep its controls from marking the form as changed.
      dialog.addEventListener('input', (e) => e.stopPropagation());
      dialog.addEventListener('change', (e) => e.stopPropagation());

      dialog.querySelector('[data-crop-reset]')!.addEventListener('click', () => {
        crop = { ...DEFAULT_CROP };
        zoom.value = '1';
        draw();
      });
      dialog.querySelectorAll('[data-crop-cancel]').forEach((b) => b.addEventListener('click', () => dialog.close()));
      dialog.querySelector('[data-crop-apply]')!.addEventListener('click', () => {
        if (!value) return dialog.close();
        const round = (n: number) => Math.round(n * 10000) / 10000;
        const next = normalizeCrop({ x: round(crop.x), y: round(crop.y), zoom: round(crop.zoom) });
        const stored: Stored = { ...value, crop: isDefaultCrop(next) ? null : next };
        valueInput.value = JSON.stringify(stored);
        const preview = box.querySelector<HTMLImageElement>('img');
        if (preview) place(preview, stored, stored.crop);
        status.textContent = 'Framing changed. Save to apply.';
        dialog.close();
        form?.dispatchEvent(new Event('change'));
      });
    }

    // Optional slots (site images): go back to the built-in image by clearing the upload.
    reset?.addEventListener('click', () => {
      valueInput.value = '';
      if (alt) alt.value = '';
      if (field.dataset.fallback) showPreview(field.dataset.fallback);
      status.textContent = 'Using the built-in image. Save to apply.';
      reset.hidden = true;
      if (adjust) adjust.hidden = true;
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
        const stored = { publicId: result.public_id, url: null, width: result.width, height: result.height };
        valueInput.value = JSON.stringify(stored);
        // A smaller copy of the new original for the previews and the Adjust dialog.
        const original = `https://res.cloudinary.com/${signature.cloudName}/image/upload/f_auto,q_auto,c_limit,w_1600/${result.public_id}`;
        field.dataset.original = original;
        field.dataset.zoomable = 'true';
        showPreview(original, stored);
        if (reset) reset.hidden = false;
        if (adjust) adjust.hidden = !aspectW;
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
