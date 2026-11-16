import { describe, expect, it } from 'vitest';
import { buildLlmsTxt } from './llms';

describe('llms.txt', () => {
  it('lists services, case studies, posts and FAQs with absolute links', () => {
    const txt = buildLlmsTxt({
      base: 'https://www.gandariastudio.com/',
      email: 'hello@gandariastudio.com',
      bookingFrom: 'Q1 2027',
      services: [{ title: 'Brand Identity', summary: 'Logos and type.', deliverables: 'Logo · Type' }],
      projects: [{ slug: 'pizzanova', title: 'PizzaNova', summary: 'A pizza brand.', sector: 'Food & Beverage', year: '2026', services: 'Brand Identity' }],
      posts: [{ slug: 'rebrands', title: 'Why most rebrands change nothing', excerpt: 'A new logo is the easy part.' }],
      faqs: [{ question: 'Who owns the files?', answer: 'You do.\nAll of them.' }],
    });
    expect(txt.startsWith('# Gandaria Studio\n\n> ')).toBe(true);
    expect(txt).toContain('- [Brand Identity](https://www.gandariastudio.com/services): Logos and type. Deliverables: Logo · Type.');
    expect(txt).toContain('- [PizzaNova](https://www.gandariastudio.com/work/pizzanova): A pizza brand. (Food & Beverage, 2026; Brand Identity)');
    expect(txt).toContain('- [Why most rebrands change nothing](https://www.gandariastudio.com/journal/rebrands)');
    expect(txt).toContain('### Who owns the files?\n\nYou do. All of them.');
    expect(txt).not.toContain('—');
  });
});
