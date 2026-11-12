import { describe, expect, it } from 'vitest';
import { enquirySchema, looksLikeSpam, MIN_FILL_MS } from './enquiry';
import { enquiryEmailHtml, enquiryEmailText, enquirySubject, formatSentAt } from './enquiry-email';

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
  const ctx = { messageUrl: 'https://x/admin/inbox/7', logoUrl: 'https://x/logo.png', sentAt: new Date('2026-11-12T08:39:00Z') };
  it('writes the notification email as text and HTML', () => {
    const e = enquirySchema.parse({ name: 'Rina Kusuma', email: 'rina@example.com', budget: 'Rp150 jt+', message: 'Hello\nthere', page: '/contact' });
    expect(enquirySubject(e)).toBe('New enquiry from Rina Kusuma');
    expect(formatSentAt(ctx.sentAt)).toBe('12 Nov 2026, 15:39 WIB');
    const text = enquiryEmailText(e, ctx);
    expect(text).toContain('Budget: Rp150 jt+');
    expect(text).not.toContain('Company:');
    expect(text).toContain('https://x/admin/inbox/7');
    const html = enquiryEmailHtml(e, ctx);
    expect(html).toContain('Rina Kusuma sent you a message');
    expect(html).toContain('Hello<br>there');
    expect(html).toContain('Reply to Rina');
    expect(html).not.toContain('>Company<');
  });
  it('escapes everything the visitor typed', () => {
    const e = enquirySchema.parse({ name: '<b>Eve</b>', email: 'eve@example.com', company: '"Evil" & Co', message: '<script>alert(1)</script>' });
    const html = enquiryEmailHtml(e, ctx);
    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<b>Eve</b>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('&quot;Evil&quot; &amp; Co');
  });
});
