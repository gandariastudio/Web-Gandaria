import type { EnquiryInput } from './enquiry';

/** Links and context for the notification email. */
export type EnquiryEmailContext = {
  /** The message in the admin, e.g. https://www.gandariastudio.com/admin/inbox/12 */
  messageUrl: string;
  /** Absolute URL of the ink logo mark PNG, public/email-logo.png (email clients do not show SVG). */
  logoUrl: string;
  sentAt: Date;
};

// The website's tokens (src/styles/variable.css), written out because email has no CSS variables.
const ACCENT = '#f15822';
const GRADIENT = 'linear-gradient(90deg, #f68a1e 0%, #f15822 100%)';
const INK = '#252320';
const MUTED = '#6f6c67';
const LINE = '#dcdbd7';
const FOG = '#f6f6f6';
const FONT = "Geist, -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, Arial, sans-serif";

/** The website's tag: a 7px square, then a small label. */
const tag = (label: string, color: string) =>
  `<span style="display:inline-block;width:7px;height:7px;background:${color};vertical-align:middle;margin-right:10px;"></span><span style="vertical-align:middle;font-size:13px;line-height:1.3;color:${color};">${label}</span>`;

/** Everything the visitor typed goes through this before it is put in the HTML. */
export const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const firstName = (name: string) => name.trim().split(/\s+/)[0] || name;

/** "12 Nov 2026, 15:39 WIB" */
export const formatSentAt = (d: Date) =>
  `${d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Jakarta' })} WIB`;

export const enquirySubject = (e: EnquiryInput) => `New enquiry from ${e.name}${e.company ? ` · ${e.company}` : ''}`;

const replyHref = (e: EnquiryInput) =>
  `mailto:${encodeURIComponent(e.email)}?subject=${encodeURIComponent('Re: Your enquiry to Gandaria Studio')}&body=${encodeURIComponent(`Hi ${firstName(e.name)},\n\n`)}`;

const details = (e: EnquiryInput): [string, string][] =>
  (
    [
      ['Email', e.email],
      ['Company', e.company],
      ['Needs', e.services],
      ['Budget', e.budget],
    ] as [string, string][]
  ).filter(([, v]) => v);

/** Plain-text version, for clients that do not show HTML and for previews. */
export function enquiryEmailText(e: EnquiryInput, ctx: EnquiryEmailContext): string {
  const lines = [`${e.name} sent a message through the contact form.`, `${formatSentAt(ctx.sentAt)}${e.page ? ` · from ${e.page}` : ''}`, ''];
  lines.push(e.message || '(No message, only the details below.)', '');
  for (const [k, v] of details(e)) lines.push(`${k}: ${v}`);
  lines.push('', `Reply to this email to answer ${firstName(e.name)} directly.`, `Open in the admin: ${ctx.messageUrl}`);
  return `${lines.join('\n')}\n`;
}

/**
 * The HTML email, styled like the website rather than the admin: sharp corners, Geist (where the
 * client loads web fonts), tight light headings, tags, hairlines, a gradient button and the orange
 * footer band.
 */
export function enquiryEmailHtml(e: EnquiryInput, ctx: EnquiryEmailContext): string {
  const name = escapeHtml(e.name);
  const message = e.message ? escapeHtml(e.message).replace(/\r?\n/g, '<br>') : `<span style="color:${MUTED};">No message, only the details below.</span>`;
  const meta = `${escapeHtml(formatSentAt(ctx.sentAt))}${e.page ? ` &middot; from ${escapeHtml(e.page)}` : ''}`;
  const rows = details(e)
    .map(
      ([k, v]) => `
              <tr>
                <td style="padding:14px 0;border-top:1px solid ${LINE};width:110px;vertical-align:top;font-size:13px;line-height:1.5;color:${MUTED};">${k}</td>
                <td style="padding:14px 0;border-top:1px solid ${LINE};vertical-align:top;font-size:16px;line-height:1.4;letter-spacing:-0.01em;color:${INK};word-break:break-word;">${
                  k === 'Email' ? `<a href="mailto:${escapeHtml(v)}" style="color:${INK};text-decoration:underline;text-underline-offset:3px;">${escapeHtml(v)}</a>` : escapeHtml(v)
                }</td>
              </tr>`,
    )
    .join('');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(enquirySubject(e))}</title>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${FOG};font-family:${FONT};color:${INK};-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml((e.message || e.services || e.email).slice(0, 120))}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOG};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;">
          <tr>
            <td style="padding:22px 28px;border-bottom:1px solid ${LINE};">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;white-space:nowrap;">
                    <img src="${escapeHtml(ctx.logoUrl)}" width="20" height="24" alt="" style="display:inline-block;vertical-align:middle;border:0;">
                    <span style="display:inline-block;vertical-align:middle;margin-left:10px;font-size:20px;line-height:1;font-weight:500;letter-spacing:-0.04em;color:${INK};">Gandaria</span>
                  </td>
                  <td align="right" style="vertical-align:middle;white-space:nowrap;">${tag('New enquiry', ACCENT)}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 28px 8px;">
              <h1 style="margin:0;font-size:32px;line-height:1.1;font-weight:400;letter-spacing:-0.04em;color:${INK};">${name} sent you a message</h1>
              <p style="margin:12px 0 0;font-size:13px;line-height:1.3;color:${MUTED};">${meta}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 28px 0;">
              <p style="margin:0 0 12px;">${tag('Message', INK)}</p>
              <div style="background:${FOG};padding:20px 22px;font-size:18px;line-height:1.5;letter-spacing:-0.015em;color:${INK};">${message}</div>
            </td>
          </tr>
          ${
            rows
              ? `<tr>
            <td style="padding:28px 28px 0;">
              <p style="margin:0 0 4px;">${tag('Details', INK)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}
              </table>
            </td>
          </tr>`
              : ''
          }
          <tr>
            <td style="padding:32px 28px 36px;">
              <!-- Inline-block buttons: they wrap onto a new line on narrow screens instead of breaking their text. -->
              <div style="font-size:0;line-height:0;">
                <a href="${escapeHtml(replyHref(e))}" style="display:inline-block;margin:0 10px 10px 0;padding:16px 28px;background-color:${ACCENT};background-image:${GRADIENT};font-size:16px;line-height:1.2;font-weight:500;letter-spacing:-0.01em;color:#ffffff;text-decoration:none;white-space:nowrap;box-shadow:-10px 16px 28px 0 rgba(0,0,0,0.16);">Reply to ${escapeHtml(firstName(e.name))} &rarr;</a>
                <a href="${escapeHtml(ctx.messageUrl)}" style="display:inline-block;margin:0 0 10px;padding:15px 27px;border:1px solid ${INK};background:#ffffff;font-size:16px;line-height:1.2;font-weight:500;letter-spacing:-0.01em;color:${INK};text-decoration:none;white-space:nowrap;">Open in admin</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:22px 28px;background-color:${ACCENT};background-image:${GRADIENT};color:#ffffff;">
              <p style="margin:0;font-size:13px;line-height:1.5;color:#ffffff;">Sent by the contact form on gandariastudio.com.<br>Replying to this email goes straight to ${name}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
