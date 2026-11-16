/**
 * /llms.txt (https://llmstxt.org): a plain Markdown summary of the studio for AI search engines,
 * built from the same database rows the site renders, so it stays current with the admin.
 */
type Input = {
  base: string;
  email: string;
  bookingFrom: string;
  services: { title: string; summary: string; deliverables: string }[];
  projects: { slug: string; title: string; summary: string; sector: string; year: string; services: string }[];
  posts: { slug: string; title: string; excerpt: string }[];
  faqs: { question: string; answer: string }[];
};

const line = (s: string) => s.replace(/\s+/g, ' ').trim();

export function buildLlmsTxt({ base, email, bookingFrom, services, projects, posts, faqs }: Input): string {
  const url = (path: string) => new URL(path, base).href;
  const out: string[] = [
    '# Gandaria Studio',
    '',
    '> Independent brand and website design studio based in Semarang, Indonesia, working with clients in Indonesia and abroad. Brand identity, UI/UX design, web development and content design from one senior team.',
    '',
    `- Website: ${url('/')}`,
    '- Founded: 2020, Semarang, Indonesia',
    `- Contact: ${email} or ${url('/contact')}`,
    `- Booking new projects from: ${bookingFrom}`,
    '- Project budgets are quoted in US dollars',
    '',
  ];
  if (services.length) {
    out.push('## Services', '');
    for (const s of services) out.push(`- [${line(s.title)}](${url('/services')}): ${line(s.summary)} Deliverables: ${line(s.deliverables)}.`);
    out.push('');
  }
  if (projects.length) {
    out.push('## Case studies', '');
    for (const p of projects) out.push(`- [${line(p.title)}](${url(`/work/${p.slug}`)}): ${line(p.summary)} (${line(p.sector)}, ${p.year}; ${line(p.services)})`);
    out.push('');
  }
  if (posts.length) {
    out.push('## Journal', '');
    for (const p of posts) out.push(`- [${line(p.title)}](${url(`/journal/${p.slug}`)}): ${line(p.excerpt)}`);
    out.push('');
  }
  if (faqs.length) {
    out.push('## Questions clients ask', '');
    for (const f of faqs) out.push(`### ${line(f.question)}`, '', line(f.answer), '');
  }
  out.push(
    '## Pages',
    '',
    `- [About the studio](${url('/about')})`,
    `- [Services](${url('/services')})`,
    `- [Work](${url('/work')})`,
    `- [Journal](${url('/journal')})`,
    `- [Contact](${url('/contact')})`,
    '',
  );
  return out.join('\n');
}
