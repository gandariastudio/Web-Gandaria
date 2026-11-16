import { describe, expect, it } from 'vitest';
import { projectsForService } from './service-work';

const projects = [
  { slug: 'pizzanova', services: 'Website Design UI/UX Design Brand Identity Packaging Design' },
  { slug: 'urbn', services: 'Brand Identity Design, Brand Guidelines, Graphic Design, Pitch Deck Design' },
  { slug: 'motioniq', services: 'UI/UX Design, Branding Design' },
  { slug: 'mayang', services: 'UI/UX Design, E-commerce Website Design, Visual Direction' },
];

describe('projects for a service', () => {
  it('matches the wording projects use, in order, up to the limit', () => {
    expect(projectsForService('UI/UX Design', projects).map((p) => p.slug)).toEqual(['pizzanova', 'motioniq', 'mayang']);
    expect(projectsForService('Web Development', projects).map((p) => p.slug)).toEqual(['pizzanova', 'mayang']);
    expect(projectsForService('Content Design', projects).map((p) => p.slug)).toEqual(['pizzanova', 'urbn']);
    expect(projectsForService('Brand Identity', projects, 2).map((p) => p.slug)).toEqual(['pizzanova', 'urbn']);
  });
  it('still matches when a service is renamed, as long as the title names the discipline', () => {
    expect(projectsForService('Visual Identity', projects).map((p) => p.slug)).toEqual(['pizzanova', 'urbn', 'motioniq']);
    expect(projectsForService('Websites & Digital', projects).map((p) => p.slug)).toEqual(['pizzanova', 'mayang']);
    expect(projectsForService('Brand Strategy', projects)).toEqual([]);
  });
  it('falls back to the service title for services it does not know', () => {
    expect(projectsForService('Packaging Design', projects).map((p) => p.slug)).toEqual(['pizzanova']);
  });
});
