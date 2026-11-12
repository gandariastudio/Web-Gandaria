import type { EnquiryInput } from './enquiry';
import { enquiryEmailHtml, enquiryEmailText, enquirySubject, type EnquiryEmailContext } from './enquiry-email';

export type MailConfig = { apiKey?: string; from?: string; to: string } & EnquiryEmailContext;

/**
 * Email the studio about a new enquiry through Resend (https://resend.com). Does nothing without
 * an API key. Never throws: the enquiry is already saved, so a failed email only gets logged.
 */
export async function sendEnquiryEmail(e: EnquiryInput, config: MailConfig): Promise<boolean> {
  if (!config.apiKey) return false;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: config.from || 'Gandaria Website <onboarding@resend.dev>',
        to: [config.to],
        reply_to: `${e.name.replace(/[<>"]/g, '')} <${e.email}>`,
        subject: enquirySubject(e),
        html: enquiryEmailHtml(e, config),
        text: enquiryEmailText(e, config),
      }),
    });
    if (!res.ok) console.error('[contact] email failed', res.status, await res.text().catch(() => ''));
    return res.ok;
  } catch (error) {
    console.error('[contact] email failed', error);
    return false;
  }
}
