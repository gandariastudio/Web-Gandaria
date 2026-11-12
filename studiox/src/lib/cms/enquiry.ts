import { z } from 'astro/zod';

/** What the contact form sends (JSON body of POST /api/contact). */
export const enquirySchema = z.object({
  name: z.string().trim().min(1, 'Required').max(120, 'Keep it under 120 characters'),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email('Add a valid email')),
  company: z.string().trim().max(200).default(''),
  services: z.string().trim().max(200).default(''),
  budget: z.string().trim().max(60).default(''),
  message: z.string().trim().max(5000, 'Keep the message under 5,000 characters').default(''),
  page: z.string().trim().max(200).default(''),
});

export type EnquiryInput = z.infer<typeof enquirySchema>;

/** A person needs at least this long to fill in the form; bots post instantly. */
export const MIN_FILL_MS = 3000;
/** At most this many messages from one email address per window. */
export const RATE_LIMIT = { count: 5, minutes: 10 };

/**
 * Spam signals the form sends along: `website` is a hidden field only bots fill in, and `elapsed`
 * is how long the form was open (measured in the browser, so clock differences do not matter).
 */
export function looksLikeSpam(body: { website?: unknown; elapsed?: unknown }): boolean {
  if (typeof body.website === 'string' && body.website.trim() !== '') return true;
  const elapsed = Number(body.elapsed);
  return !Number.isFinite(elapsed) || elapsed < MIN_FILL_MS;
}

/** Plain-text email sent to the studio for a new enquiry. */
export function enquiryEmailText(e: EnquiryInput, inboxUrl: string): string {
  const rows: [string, string][] = [
    ['Name', e.name],
    ['Email', e.email],
    ['Company', e.company],
    ['Needs', e.services],
    ['Budget', e.budget],
    ['Sent from', e.page],
  ];
  const lines = rows.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  return `${lines.join('\n')}\n\n${e.message || '(no message)'}\n\n—\nReply to this email to answer ${e.name}. All messages: ${inboxUrl}\n`;
}
