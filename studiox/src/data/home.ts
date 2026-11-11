import type { ImageMetadata } from 'astro';
import zoom1 from '@/assets/images/zoom-1.jpg';
import zoom2 from '@/assets/images/zoom-2.jpg';
import zoom3 from '@/assets/images/zoom-3.jpg';
import zoom4 from '@/assets/images/zoom-4.jpg';
import zoom5 from '@/assets/images/zoom-5.jpg';
import zoom6 from '@/assets/images/zoom-6.jpg';

export const heroMeta = [
  'Independent creative studio',
  'Brand, digital and content in one studio',
  // the third line ("Semarang & remote — booking …") is built in Hero.astro from the CMS setting
];

export const zoomImages: { src: ImageMetadata; alt: string }[] = [
  { src: zoom1, alt: 'Chain-link fence against a blue wall' },
  { src: zoom2, alt: 'Two hands meeting in a handshake under a blue sky' },
  { src: zoom3, alt: 'Studio still life in deep blue light' },
  { src: zoom4, alt: 'Portrait study in shadow' },
  { src: zoom5, alt: 'Abstract architectural detail' },
  { src: zoom6, alt: 'Two hands meeting in a handshake' },
];

export const studioFacts = [
  ['Founded', '2020, Semarang'],
  ['Team', 'Strategists, designers & developers'],
  ['Clients', 'Hospitality, F&B, beauty, culture'],
  ['Delivered', '80+ brands and websites'],
];


export const steps = [
  {
    label: '01 — Weeks 1–2',
    title: 'Discover',
    text: 'We start with workshops and an audit of what you already have, until we can say in one sentence what you want to be known for.',
  },
  {
    label: '02 — Weeks 3–8',
    title: 'Design',
    text: 'Strategy turns into identity, language and interface, and you see it every week while it’s still easy to change.',
  },
  {
    label: '03 — Weeks 9–10',
    title: 'Launch',
    text: 'Build, test and go live, with guidelines and training so your team can keep the brand sharp long after we leave.',
  },
  {
    label: '04 — Ongoing',
    title: 'Evolve',
    text: 'We stay on after launch to check the numbers with your team and fix whatever isn’t pulling its weight.',
  },
];

export const principles = [
  {
    title: 'Ideas with a purpose',
    text: 'Every project starts with the goal it has to move. Beautiful work that changes nothing is not finished work.',
  },
  {
    title: 'Craft in every detail',
    text: 'Type, motion, copy and code get the same care, because the small things are what people notice first.',
  },
  {
    title: 'One team, end to end',
    text: 'Strategy, design and development sit at the same table, so nothing gets lost between the idea and the launch.',
  },
  {
    title: 'Built to last',
    text: 'We design systems that can stretch for years, long after the launch campaign has been forgotten.',
  },
];

export const capabilities = [
  ['Brand strategy', 'Positioning, naming and messaging', 'Strategy'],
  ['Visual identity', 'Logos, type, colour and guidelines', 'Design'],
  ['Websites', 'Design, development and CMS setup', 'Digital'],
  ['Content design', 'Social, campaign and editorial content', 'Content'],
  ['Templates & toolkits', 'Social, deck and document templates your team can reuse', 'Content'],
  ['Packaging & print', 'Packaging, menus, signage and editorial', 'Design'],
];

export const stats = [
  { index: '01', meta: 'Since 2020', value: 80, suffix: '+', filled: 80, label: 'brands and websites launched since 2020', delay: 0 },
  { index: '02', meta: 'Across Indonesia', value: 12, suffix: '', filled: 12, label: 'cities our clients call home', delay: 0.14 },
  { index: '03', meta: 'Retention', value: 90, suffix: '%', filled: 90, label: 'of clients come back for a second project', delay: 0.28 },
];


