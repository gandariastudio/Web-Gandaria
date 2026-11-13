/**
 * Case-study blocks (projects.blocks): the shapes, what the admin's "Insert block" menu offers,
 * and helpers shared by the public page, the admin and the seed. Pure functions only, so the
 * admin script can import this too.
 */
import type { CmsImage, CmsVideo, ProjectBlock, ProjectBlockType, ProjectResult } from '../db/schema';

export type { ProjectBlock, ProjectBlockType };

/** The "Insert block" menu, in Dribbble's groups. Icon names are from components/admin/Icon.astro. */
export const BLOCK_TYPES: { type: ProjectBlockType; label: string; description: string; group: 'Basic' | 'Rich media'; icon: string }[] = [
  { type: 'richtext', label: 'Text', description: 'Headings, paragraphs, lists and quotes. Type / for options', group: 'Basic', icon: 'text' },
  { type: 'text', label: 'Label & text', description: 'A small label beside a statement or a paragraph', group: 'Basic', icon: 'heading' },
  { type: 'image', label: 'Image', description: 'One image, in the column or full width', group: 'Basic', icon: 'image' },
  { type: 'video', label: 'Video', description: 'Upload a clip or paste a YouTube or Vimeo link', group: 'Basic', icon: 'video' },
  { type: 'gallery', label: 'Gallery', description: 'Two or three images side by side', group: 'Rich media', icon: 'gallery' },
  { type: 'results', label: 'Results', description: 'Up to four numbers with a short line each', group: 'Rich media', icon: 'results' },
  { type: 'quote', label: 'Quote', description: 'A line from the client, with their name', group: 'Rich media', icon: 'quote' },
];

export const blockLabel = (type: ProjectBlockType) => BLOCK_TYPES.find((b) => b.type === type)?.label ?? type;

/** A fresh block of each type, as the admin inserts it. */
export function emptyBlock(type: ProjectBlockType): ProjectBlock {
  switch (type) {
    case 'text':
      return { type, label: '', text: '', size: 'statement' };
    case 'richtext':
      return { type, body: '' };
    case 'image':
      return { type, image: null as unknown as CmsImage, width: 'contained', caption: '' };
    case 'gallery':
      return { type, images: [] };
    case 'video':
      return { type, source: 'upload', video: null, url: '', width: 'contained', caption: '' };
    case 'results':
      return { type, label: 'Results', items: [] };
    case 'quote':
      return { type, quote: '', name: '', role: '' };
  }
}

/** The fixed case study the site had before blocks, as blocks (the seed uses this; migration 0003 does the same in SQL). */
export function legacyBlocks(p: { challenge: string; approach: string; results: ProjectResult[]; gallery: CmsImage[] }): ProjectBlock[] {
  return [
    { type: 'text', label: 'The challenge', text: p.challenge, size: 'statement' },
    { type: 'text', label: 'Our approach', text: p.approach, size: 'statement' },
    { type: 'results', label: 'Results', items: p.results },
    { type: 'gallery', images: p.gallery },
  ];
}

/** A YouTube or Vimeo link → its privacy-friendly embed URL, or null when it is neither. */
export function videoEmbed(url: string): { provider: 'youtube' | 'vimeo'; src: string } | null {
  let u: URL;
  try {
    u = new URL(url.trim());
  } catch {
    return null;
  }
  const host = u.hostname.replace(/^www\.|^m\./, '');
  let id: string | null = null;
  if (host === 'youtu.be') id = u.pathname.slice(1);
  else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    id = u.searchParams.get('v') ?? u.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]+)/)?.[1] ?? null;
  }
  if (id && /^[\w-]{6,}$/.test(id)) return { provider: 'youtube', src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const vid = u.pathname.match(/(\d{5,})/)?.[1];
    if (vid) return { provider: 'vimeo', src: `https://player.vimeo.com/video/${vid}?dnt=1` };
  }
  return null;
}

/** MP4 delivery of an uploaded clip, resized down to `width`, and a poster frame from its first second. */
export function cloudinaryVideo(cloudName: string, video: CmsVideo, width = 1600) {
  const t = `q_auto,c_limit,w_${Math.round(Math.min(width, video.width))}`;
  return {
    src: `https://res.cloudinary.com/${cloudName}/video/upload/${t}/${video.publicId}.mp4`,
    poster: `https://res.cloudinary.com/${cloudName}/video/upload/so_0,${t}/${video.publicId}.jpg`,
  };
}
