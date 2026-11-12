import { describe, expect, it } from 'vitest';
import { enquiryEmailText, enquirySchema, looksLikeSpam, MIN_FILL_MS } from './enquiry';

describe('enquiry', () => {
  it('requires a name and a valid email, lowercases the email and fills defaults', () => {
    expect(enquirySchema.safeParse({ name: '', email: 'x' }).success).toBe(false);
    const ok = enquirySchema.parse({ name: ' Rina ', email: 'Rina@Example.COM ' });
    expect(ok).toEqual({ name: 'Rina', email: 'rina@example.com', company: '', services: '', budget: '', message: '', page: '' });
  });
  it('flags the honeypot and forms sent too quickly', () => {
    expect(looksLikeSpam({ website: 'http://spam', elapsed: 9000 })).toBe(true);
    expect(looksLikeSpam({ elapsed: MIN_FILL_MS - 1 })).toBe(true);
    expect(looksLikeSpam({})).toBe(true);
    expect(looksLikeSpam({ website: '', elapsed: MIN_FILL_MS + 1 })).toBe(false);
  });
  it('writes a readable notification email', () => {
    const text = enquiryEmailText(enquirySchema.parse({ name: 'Rina', email: 'rina@example.com', budget: 'Rp150 jt+', message: 'Hello' }), 'https://x/admin/inbox');
    expect(text).toContain('Budget: Rp150 jt+');
    expect(text).not.toContain('Company:');
    expect(text).toContain('Hello');
  });
});
