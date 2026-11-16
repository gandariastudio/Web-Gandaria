/**
 * `seo` is the search-result title (" | Gandaria Studio" is added) and meta description, kept apart
 * from the on-page copy so each can be the right length: titles 50-60 characters with the suffix,
 * descriptions 140-160.
 */
export const about = {
  seo: {
    title: 'About Our Independent Design Studio',
    description: 'A small senior team of strategists, designers and developers based in Semarang, Indonesia. The people on your kickoff call are the people who do the work.',
  },
  hero: {
    tag: 'Studio',
    meta: '(Est. 2020, Semarang)',
    lines: ['Small studio,', 'senior hands.'] as [string, string],
    intro:
      'Gandaria Studio is a small team of strategists, designers and developers in Semarang who care more about what we make than how big we look. The people in your kickoff are the people who make it.',
  },
  story: {
    title: 'A few friends with one stubborn idea: a small studio in Semarang can make work that holds up anywhere.',
    paragraphs: [
      'Gandaria Studio began in 2020 around a shared desk in Semarang. We had worked for agencies and clients in Jakarta and abroad, and kept seeing the same thing: great businesses with brands that undersold them, and good ideas lost between the pitch and the launch.',
      'So we kept the studio small on purpose. The same senior people run every project from the first workshop to launch day, and we take on only a handful of clients at a time.',
      'Today we work with founders, family businesses and growing brands in Indonesia and abroad. The desk is bigger, but the idea hasn’t changed.',
    ],
  },
  values: [
    { title: 'Seniority, always', text: 'The people who pitch are the people who do the work.' },
    { title: 'Progress every week', text: 'You see the messy middle, so decisions stay cheap.' },
    { title: 'Clarity over noise', text: 'If it doesn’t help someone choose you, it goes.' },
    { title: 'Built to last', text: 'Systems your team can run long after we leave.' },
  ],
};

export const servicesPage = {
  seo: {
    title: 'Brand Identity, Web Design & Development',
    description: 'Brand identity, UI/UX design, web development and content design for growing companies, run by one senior team from the first call to launch day.',
  },
  hero: {
    tag: 'Services',
    meta: '(4 disciplines, 1 team)',
    lines: ['What we', 'do best.'] as [string, string],
    intro: 'Four disciplines under one senior team, so the people who shape the idea also design the identity and build the website.',
  },
  steps: [
    { label: '01', title: 'Discover', text: 'Workshops, research and audits to understand your audience and what you want to be known for.' },
    { label: '02', title: 'Design', text: 'Strategy turns into identity, language and interface, and you see it every week while it’s still easy to change.' },
    { label: '03', title: 'Launch', text: 'Build, test and go live, with guidelines and training so your team can run it.' },
    { label: '04', title: 'Evolve', text: 'We stay on after launch to check the numbers with you and fix what needs fixing.' },
  ],
};

export const workPage = {
  seo: {
    title: 'Brand & Website Case Studies',
    description: 'Case studies from Gandaria Studio: brand identities, e-commerce sites and web apps for restaurants, fashion labels, fitness and outdoor brands.',
  },
  tag: 'Work',
  meta: '(Selected, 2020–2026)',
  lines: ['Selected', 'work.'] as [string, string],
  intro: 'Brands, websites and content for founders and growing businesses, in Indonesia and abroad.',
};

export const journalPage = {
  seo: {
    title: 'Notes on Branding & Web Design',
    description: 'Short reads on brand identity, website design and how we run client projects, written by the designers and developers who do the work at Gandaria Studio.',
  },
  tag: 'Journal',
  meta: '(Notes, 2026)',
  lines: ['Notes from', 'the studio.'] as [string, string],
  intro: 'Short reads on brand, websites and how we work, written by the people doing it.',
};

export const privacy = {
  tag: 'Legal',
  meta: '(Updated 11 November 2026)',
  lines: ['Privacy', 'policy.'] as [string, string],
  intro: 'How Gandaria Studio collects, uses and protects the information you share with us through this website.',
  clauses: [
    {
      title: 'What we collect',
      text: 'When you contact us we collect your name, email, company and anything you choose to tell us about your project. We also collect anonymous usage data (pages visited, device type and rough location) to see how the site is used.',
    },
    {
      title: 'How we use it',
      text: 'We use your details only to reply to your enquiry and, if we work together, to run the project. We never sell your data and we do not send newsletters unless you ask for them.',
    },
    {
      title: 'Cookies',
      text: 'This site uses essential cookies to work and privacy-friendly analytics without cross-site tracking. You can block cookies in your browser at any time.',
    },
    {
      title: 'Keeping it safe',
      text: 'We handle your information in line with Indonesia’s Personal Data Protection Law (UU PDP), store it with trusted providers and keep it only as long as needed for the purpose it was collected.',
    },
    {
      title: 'Your rights',
      text: 'You can ask to see, correct or delete the information we hold about you at any time by writing to hello@gandariastudio.com. We will respond within 30 days.',
    },
  ],
};
