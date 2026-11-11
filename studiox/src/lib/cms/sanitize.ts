import sanitizeHtml from 'sanitize-html';

/** Tags the article editor can produce. Anything else is stripped on save. */
export const ARTICLE_TAGS = ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote', 'br'];

export function sanitizeArticle(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ARTICLE_TAGS,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      b: 'strong',
      i: 'em',
      h1: 'h2',
      h4: 'h3',
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const out: Record<string, string> = /^https?:/i.test(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };
        return { tagName, attribs: out };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
  }).trim();
}
