type Signature = { cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string };
type UploadResult = { public_id: string; width: number; height: number; secure_url: string };

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

export function initImageFields() {
  document.querySelectorAll<HTMLElement>('[data-image-field]').forEach((field) => {
    const fileInput = field.querySelector<HTMLInputElement>('[data-image-file]')!;
    const valueInput = field.querySelector<HTMLInputElement>('[data-image-value]')!;
    const status = field.querySelector<HTMLElement>('[data-image-status]')!;
    const box = field.querySelector<HTMLElement>('[data-preview-box]')!;
    const form = field.closest('form');
    const submit = form?.querySelector<HTMLButtonElement>('[type="submit"]');

    fileInput.addEventListener('change', async () => {
      const file = fileInput.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        status.textContent = 'Choose an image file.';
        return;
      }
      submit?.setAttribute('disabled', '');
      status.textContent = 'Preparing…';
      try {
        const signature = await sign(field.dataset.folder ?? 'misc');
        const result = await upload(file, signature, (pct) => (status.textContent = `Uploading ${pct}%`));
        valueInput.value = JSON.stringify({ publicId: result.public_id, url: null, width: result.width, height: result.height });
        box.innerHTML = '';
        const img = document.createElement('img');
        img.src = result.secure_url;
        img.alt = '';
        box.append(img);
        status.textContent = `${result.width} × ${result.height}, uploaded. Save to apply.`;
        form?.dispatchEvent(new Event('change'));
      } catch (error) {
        status.textContent = error instanceof Error ? error.message : 'Upload failed';
      } finally {
        submit?.removeAttribute('disabled');
        fileInput.value = '';
      }
    });
  });
}
