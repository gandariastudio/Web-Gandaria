/**
 * Which case studies show each service. A service's title picks one or more topics ("UI/UX Design"
 * → interface, "Websites & Digital" → web), and a project matches when its free-text `services`
 * field mentions one of that topic's terms. The terms cover the wording projects actually use
 * ("Website Design", "E-commerce", "Pitch Deck"), so renaming a service in the admin keeps working
 * as long as its title still names the discipline; a title with no known topic matches on itself.
 */
const TOPICS: { when: RegExp; terms: string[] }[] = [
  { when: /ui|ux|interface|product design/, terms: ['ui/ux', 'ux design', 'interface', 'dashboard', 'app design'] },
  { when: /web|digital|development|e-?commerce/, terms: ['web development', 'development', 'website', 'web app', 'e-commerce', 'ecommerce', 'responsive'] },
  { when: /identity|brand(?!.*strategy)|logo/, terms: ['brand identity', 'branding', 'logo', 'brand guidelines', 'visual direction'] },
  { when: /strategy|positioning/, terms: ['strategy', 'positioning', 'naming', 'messaging'] },
  { when: /content|social|campaign/, terms: ['content', 'social', 'campaign', 'pitch deck', 'presentation', 'packaging', 'graphic design'] },
];

export function projectsForService<P extends { services: string }>(serviceTitle: string, projects: P[], limit = 3): P[] {
  const title = serviceTitle.trim().toLowerCase();
  const topics = TOPICS.filter((t) => t.when.test(title));
  const terms = topics.length ? topics.flatMap((t) => t.terms) : [title];
  return projects.filter((p) => terms.some((t) => p.services.toLowerCase().includes(t))).slice(0, limit);
}
