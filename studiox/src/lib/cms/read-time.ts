const WORDS_PER_MINUTE = 200;

export function countWords(html: string): number {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

/** "4 min read", never less than one minute. */
export function readTime(html: string): string {
  const minutes = Math.max(1, Math.round(countWords(html) / WORDS_PER_MINUTE));
  return `${minutes} min read`;
}
