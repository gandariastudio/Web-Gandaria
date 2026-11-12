import type { APIRoute } from 'astro';
import { CONTACT_FROM_EMAIL, RESEND_API_KEY } from 'astro:env/server';
import { getDb } from '@/lib/db';
import { recentFromEmail, saveEnquiry } from '@/lib/db/enquiries';
import { enquirySchema, looksLikeSpam, RATE_LIMIT } from '@/lib/cms/enquiry';
import { fieldErrors } from '@/lib/cms/validation';
import { sendEnquiryEmail } from '@/lib/cms/notify';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/** The contact form posts JSON here; the message is saved first, then emailed if Resend is set up. */
export const POST: APIRoute = async ({ request, locals, url }) => {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body || typeof body !== 'object') return json({ ok: false, error: 'Something went wrong. Please try again.' }, 400);
  // Answer bots as if it worked so they do not retry; nothing is saved or sent.
  if (looksLikeSpam(body)) return json({ ok: true });

  const parsed = enquirySchema.safeParse(body);
  if (!parsed.success) return json({ ok: false, errors: fieldErrors(parsed.error) }, 422);
  const enquiry = parsed.data;

  try {
    const db = await getDb();
    if ((await recentFromEmail(db, enquiry.email, RATE_LIMIT.minutes)) >= RATE_LIMIT.count) {
      return json({ ok: false, error: 'You have sent several messages already. We will be in touch soon.' }, 429);
    }
    await saveEnquiry(db, enquiry);
  } catch (error) {
    console.error('[contact] could not save enquiry', error);
    return json({ ok: false, error: `Could not send right now. Please email ${locals.settings.email} instead.` }, 500);
  }

  await sendEnquiryEmail(enquiry, {
    apiKey: RESEND_API_KEY,
    from: CONTACT_FROM_EMAIL,
    to: locals.settings.email,
    inboxUrl: new URL('/admin/inbox', url).href,
  });
  return json({ ok: true });
};
