import sanitizeHtml from 'sanitize-html';

/** Tags the article editor can produce. Anything else is stripped on save. */
export const ARTICLE_TAGS = ['p', 'h2', 'h3', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote', 'br'];

/**
 * Tags a case-study Text block can produce. Its "Heading 1/2/3" are stored as h2/h3/h4 so the
 * project title stays the page's only h1.
 */
export const BLOCK_TEXT_TAGS = ['p', 'h2', 'h3', 'h4', 'strong', 'em', 'a', 'ul', 'ol', 'li', 'blockquote', 'br'];

export const sanitizeArticle = (html: string) => clean(html, ARTICLE_TAGS, { h4: 'h3' });
export const sanitizeBlockText = (html: string) => clean(html, BLOCK_TEXT_TAGS, { h5: 'h4', h6: 'h4' });

function clean(html: string, allowedTags: string[], headings: Record<string, string>): string {
  return sanitizeHtml(html, {
    allowedTags,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    transformTags: {
      b: 'strong',
      i: 'em',
      h1: 'h2',
      ...headings,
      a: (tagName, attribs) => {
        const href = attribs.href ?? '';
        const out: Record<string, string> = /^https?:/i.test(href) ? { href, target: '_blank', rel: 'noopener noreferrer' } : { href };
        return { tagName, attribs: out };
      },
    },
    exclusiveFilter: (frame) => frame.tag === 'p' && !frame.text.trim() && !frame.mediaChildren.length,
  }).trim();
}
