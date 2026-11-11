// Sample content used to seed a fresh database (local PGlite on first run, Neon via `npm run db:seed`).
// Generated from the original Markdown and data files; edit content in /admin, not here.
import type { CmsImage, ProjectResult, SocialLink } from './schema';

export const seedProjects: {
  slug: string; title: string; sortOrder: number; sector: string; year: string; summary: string; services: string;
  client: string; role: string; cover: CmsImage; challenge: string; approach: string; results: ProjectResult[];
  gallery: CmsImage[]; published: boolean;
}[] = [
  {
    "slug": "rasakota",
    "title": "Rasakota",
    "sortOrder": 1,
    "sector": "Hospitality",
    "year": "2026",
    "summary": "A warmer, more local brand and website for a Semarang restaurant group that had outgrown its first logo.",
    "services": "Brand identity · Website",
    "client": "Rasakota Group",
    "role": "Brand strategy, identity, website",
    "cover": {
      "url": "/placeholders/work-rasakota.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "A busy open kitchen during dinner service"
    },
    "challenge": "Rasakota runs four restaurants across Semarang, each with its own logo, menu style and Instagram voice. Guests loved the food but rarely knew the places were connected.",
    "approach": "We built one umbrella brand around a single idea: the flavours of the city, served at one table. It comes with a shared type system, a family of venue marks and a website that takes bookings for all four places.",
    "results": [
      {
        "value": "+52%",
        "label": "online bookings"
      },
      {
        "value": "4",
        "label": "venues"
      },
      {
        "value": "3×",
        "label": "Instagram engagement"
      }
    ],
    "gallery": [
      {
        "url": "/placeholders/work-rasakota-gallery-1.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Rasakota menus and signage"
      },
      {
        "url": "/placeholders/work-rasakota-gallery-2.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Rasakota website on a phone"
      }
    ],
    "published": true
  },
  {
    "slug": "lunaria",
    "title": "Lunaria",
    "sortOrder": 2,
    "sector": "Beauty",
    "year": "2025",
    "summary": "Identity, packaging and e-commerce for a homegrown skincare line built on Indonesian botanicals.",
    "services": "Identity · Packaging · E-commerce",
    "client": "Lunaria Skincare",
    "role": "Identity, packaging, e-commerce",
    "cover": {
      "url": "/placeholders/work-lunaria.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "Skincare bottles on a stone surface"
    },
    "challenge": "A homegrown skincare line with honest formulas, lost on marketplace shelves full of look-alike pastel packaging. The founders wanted to look premium without looking imported.",
    "approach": "A precise, botanical identity: a colour code for every active ingredient, packaging that reads clearly as a marketplace thumbnail, and a store with ingredient-first product pages.",
    "results": [
      {
        "value": "3.1×",
        "label": "online revenue in year one"
      },
      {
        "value": "27%",
        "label": "repeat purchase rate"
      },
      {
        "value": "12",
        "label": "new retail partners"
      }
    ],
    "gallery": [
      {
        "url": "/placeholders/work-lunaria-gallery-1.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Lunaria packaging"
      },
      {
        "url": "/placeholders/work-lunaria-gallery-2.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Lunaria product detail"
      }
    ],
    "published": true
  },
  {
    "slug": "kopi-pelabuhan",
    "title": "Kopi Pelabuhan",
    "sortOrder": 3,
    "sector": "Food & beverage",
    "year": "2025",
    "summary": "Content design and a launch campaign for a coffee roastery opening its own cafés in Semarang.",
    "services": "Content design · Campaign",
    "client": "Kopi Pelabuhan",
    "role": "Content design, campaign",
    "cover": {
      "url": "/placeholders/work-kopi-pelabuhan.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "Hands holding a cup of coffee at dawn"
    },
    "challenge": "Kopi Pelabuhan roasted for half the cafés in town but had never spoken to coffee drinkers directly. Opening its own cafés meant building a voice and a feed from scratch.",
    "approach": "We designed a content system rooted in the port city, with harbour colours, shipping-label typography and templates the team can post from. The launch campaign was shot at dawn, when the first roast comes out.",
    "results": [
      {
        "value": "41%",
        "label": "of revenue from its own cafés"
      },
      {
        "value": "2.4×",
        "label": "average order value"
      },
      {
        "value": "180k",
        "label": "campaign views in week one"
      }
    ],
    "gallery": [
      {
        "url": "/placeholders/work-kopi-pelabuhan-gallery-1.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Kopi Pelabuhan campaign still"
      },
      {
        "url": "/placeholders/work-kopi-pelabuhan-gallery-2.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Kopi Pelabuhan social templates"
      }
    ],
    "published": true
  },
  {
    "slug": "gema-festival",
    "title": "Gema Festival",
    "sortOrder": 4,
    "sector": "Culture",
    "year": "2026",
    "summary": "Visual identity and festival website for a music festival, built around a living sound-wave system.",
    "services": "Visual identity · Festival website",
    "client": "Gema Festival",
    "role": "Visual identity, festival website",
    "cover": {
      "url": "/placeholders/work-gema-festival.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "A crowd in front of an illuminated stage"
    },
    "challenge": "A music festival with a loyal local following and a new, much bigger venue. The identity had to scale from posters to a 30-metre LED wall without losing its edge.",
    "approach": "A sound-wave system that reacts to each artist's tempo. It is generated in code and runs on posters, the stage screens and a website that announces the line-up one day at a time.",
    "results": [
      {
        "value": "Sold out",
        "label": "in 9 days"
      },
      {
        "value": "24k",
        "label": "tickets across three nights"
      },
      {
        "value": "1",
        "label": "system"
      }
    ],
    "gallery": [
      {
        "url": "/placeholders/work-gema-festival-gallery-1.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Gema Festival stage visuals"
      },
      {
        "url": "/placeholders/work-gema-festival-gallery-2.jpg",
        "width": 1600,
        "height": 1280,
        "alt": "Gema Festival crowd"
      }
    ],
    "published": true
  }
];

export const seedPosts: {
  slug: string; title: string; category: string; publishedAt: string; excerpt: string; cover: CmsImage; bodyHtml: string; published: boolean;
}[] = [
  {
    "slug": "why-most-rebrands-change-nothing",
    "title": "Why most rebrands change nothing",
    "category": "Brand",
    "publishedAt": "2026-09-18",
    "excerpt": "A new logo is the easy part. What actually moves a brand is the decision about what it stands for — and the discipline to say it everywhere.",
    "cover": {
      "url": "/placeholders/journal-rebrands.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "Close-up of dark green wool texture"
    },
    "bodyHtml": "<p>Most rebrands start with the visible things: a logo, a palette, a new typeface. They are the easiest parts to brief and the most satisfying to approve. They are also the parts that change the least on their own.</p>\n<h2>Start with the decision</h2>\n<p>A brand moves when the company decides what it wants to be known for — one sentence that a customer would recognise and a competitor could not say. Everything else is expression.</p>\n<p>We spend the first weeks of every brand project on that sentence. It is slower than sketching logos, but it means every later choice has something to answer to.</p>\n<h2>Then say it everywhere</h2>\n<p>The second half is discipline: the same idea, said the same way, on the website, in sales decks, in hiring posts. Consistency comes from a habit the whole team keeps, and the style guide only writes that habit down.</p>",
    "published": true
  },
  {
    "slug": "designing-websites-your-team-will-actually-update",
    "title": "Designing websites your team will actually update",
    "category": "Websites",
    "publishedAt": "2026-08-27",
    "excerpt": "The best marketing site is the one that stays alive. How we hand over CMS-driven sites that non-designers can edit without breaking the system.",
    "cover": {
      "url": "/placeholders/journal-websites.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "Orange and cream knitted wool side by side"
    },
    "bodyHtml": "<p>A website starts ageing the day it launches. The ones that stay good are the ones a marketing team can update on a Tuesday afternoon without calling a developer.</p>\n<h2>Design the parts first</h2>\n<p>We design every site as a small set of sections and components with clear rules. New pages get assembled from those parts, so they always look like they belong.</p>\n<p>A good CMS lets us hand that system over with real content controls (text, images, collections) while the layout stays locked.</p>\n<h2>Handover is part of the work</h2>\n<p>Every project ends with a recorded walkthrough and a one-page guide. By the end, your team should be able to publish without calling us.</p>",
    "published": true
  },
  {
    "slug": "weekly-reviews-over-big-reveals",
    "title": "Weekly reviews over big reveals",
    "category": "Process",
    "publishedAt": "2026-08-04",
    "excerpt": "We stopped presenting finished work. When clients see the messy middle every week, decisions get made earlier and nobody stays up the night before a presentation.",
    "cover": {
      "url": "/placeholders/journal-weekly-reviews.jpg",
      "width": 2400,
      "height": 1350,
      "alt": "Soft pale blue abstract shapes"
    },
    "bodyHtml": "<p>For years we worked towards a big reveal: weeks of work, one polished presentation, and a room full of people seeing everything for the first time. It rarely went the way we hoped.</p>\n<h2>Show the messy middle</h2>\n<p>Now we share work every week, unfinished. Clients see the thinking while it is still cheap to change, and small course corrections replace big, late rewrites.</p>\n<p>It also changes the mood of a project. There are fewer surprises and fewer late nights, and both sides of the table trust each other more.</p>\n<h2>What a weekly review looks like</h2>\n<p>Thirty minutes, one decision-maker, three questions: what changed, what we need from you, and what happens next. That is usually enough.</p>",
    "published": true
  }
];

export const seedServices: { slug: string; title: string; sortOrder: number; summary: string; deliverables: string; image: CmsImage }[] = [
  {
    "slug": "brand-strategy",
    "title": "Brand Strategy",
    "sortOrder": 1,
    "summary": "Positioning, naming and messaging that make it obvious why you, and why now.",
    "deliverables": "Research · Positioning · Naming · Messaging",
    "image": {
      "url": "/placeholders/service-brand-strategy.jpg",
      "width": 1600,
      "height": 1200,
      "alt": "Colourful sticky notes from a strategy workshop"
    }
  },
  {
    "slug": "visual-identity",
    "title": "Visual Identity",
    "sortOrder": 2,
    "summary": "Logos, typography, colour and motion systems that feel like you in every place you show up.",
    "deliverables": "Logo · Type · Colour · Guidelines",
    "image": {
      "url": "/placeholders/service-visual-identity.jpg",
      "width": 1600,
      "height": 1200,
      "alt": "Notebook and stationery on a bright desk"
    }
  },
  {
    "slug": "websites-digital",
    "title": "Websites & Digital",
    "sortOrder": 3,
    "summary": "Fast websites and digital products, designed and built in-house and easy for your team to update.",
    "deliverables": "UX · Web design · Development · CMS",
    "image": {
      "url": "/placeholders/service-websites.jpg",
      "width": 1600,
      "height": 1200,
      "alt": "A laptop on a pale desk"
    }
  },
  {
    "slug": "content-design",
    "title": "Content Design",
    "sortOrder": 4,
    "summary": "Social and campaign content designed as one system, so a post, a poster and a pitch deck all look like the same brand.",
    "deliverables": "Social content · Campaign visuals · Templates · Presentations",
    "image": {
      "url": "/placeholders/service-content.jpg",
      "width": 1600,
      "height": 1200,
      "alt": "A camera on a tripod in a studio"
    }
  }
];

export const seedTestimonials: { quote: string; name: string; role: string; sortOrder: number; published: boolean }[] = [
  {
    "quote": "Gandaria understood our business faster than agencies we had worked with for years. The new brand finally sounds like us.",
    "name": "Rina Kusuma",
    "role": "Marketing Director, Rasakota",
    "sortOrder": 1,
    "published": true
  },
  {
    "quote": "Our new website doubled online orders in the first quarter — and our team actually enjoys updating it.",
    "name": "Adi Prasetyo",
    "role": "Founder, Lunaria",
    "sortOrder": 2,
    "published": true
  },
  {
    "quote": "They stayed calm the whole way and were blunt when it counted. Twice they pushed back on us, and both times they were right.",
    "name": "Maya Halim",
    "role": "Head of Brand, Kopi Pelabuhan",
    "sortOrder": 3,
    "published": true
  },
  {
    "quote": "Six weeks from first call to launch, without a single late night on our side. That never happens.",
    "name": "Bayu Santoso",
    "role": "Festival Director, Gema Festival",
    "sortOrder": 4,
    "published": true
  },
  {
    "quote": "We asked for a logo and got a whole system. Two years on, every new post and page still looks like it belongs.",
    "name": "Sekar Wulandari",
    "role": "Creative Lead, Nusa Living",
    "sortOrder": 5,
    "published": true
  },
  {
    "quote": "The content templates changed how our whole team works. We publish twice as often and it still looks like us.",
    "name": "Hendra Wijaya",
    "role": "CMO, Arunika Batik",
    "sortOrder": 6,
    "published": true
  }
];

export const seedClients: { name: string; logo: CmsImage; displayWidth: number; displayHeight: number; sortOrder: number }[] = [
  {
    "name": "Client 1",
    "logo": {
      "url": "/placeholders/client-1.png",
      "width": 240,
      "height": 240,
      "alt": "Client 1"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 1
  },
  {
    "name": "Client 2",
    "logo": {
      "url": "/placeholders/client-2.png",
      "width": 240,
      "height": 96,
      "alt": "Client 2"
    },
    "displayWidth": 80,
    "displayHeight": 32,
    "sortOrder": 2
  },
  {
    "name": "Client 3",
    "logo": {
      "url": "/placeholders/client-3.png",
      "width": 240,
      "height": 240,
      "alt": "Client 3"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 3
  },
  {
    "name": "Client 4",
    "logo": {
      "url": "/placeholders/client-4.png",
      "width": 240,
      "height": 240,
      "alt": "Client 4"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 4
  },
  {
    "name": "Client 5",
    "logo": {
      "url": "/placeholders/client-5.png",
      "width": 312,
      "height": 312,
      "alt": "Client 5"
    },
    "displayWidth": 104,
    "displayHeight": 104,
    "sortOrder": 5
  },
  {
    "name": "Client 6",
    "logo": {
      "url": "/placeholders/client-6.png",
      "width": 240,
      "height": 240,
      "alt": "Client 6"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 6
  },
  {
    "name": "Client 7",
    "logo": {
      "url": "/placeholders/client-7.png",
      "width": 429,
      "height": 96,
      "alt": "Client 7"
    },
    "displayWidth": 143,
    "displayHeight": 32,
    "sortOrder": 7
  },
  {
    "name": "Client 8",
    "logo": {
      "url": "/placeholders/client-8.png",
      "width": 240,
      "height": 240,
      "alt": "Client 8"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 8
  },
  {
    "name": "Client 9",
    "logo": {
      "url": "/placeholders/client-9.png",
      "width": 312,
      "height": 312,
      "alt": "Client 9"
    },
    "displayWidth": 104,
    "displayHeight": 104,
    "sortOrder": 9
  },
  {
    "name": "Client 10",
    "logo": {
      "url": "/placeholders/client-10.png",
      "width": 240,
      "height": 240,
      "alt": "Client 10"
    },
    "displayWidth": 80,
    "displayHeight": 80,
    "sortOrder": 10
  }
];

export const seedFaqs: { question: string; answer: string; sortOrder: number }[] = [
  {
    "question": "How quickly can we start?",
    "answer": "Most projects begin within three to four weeks of a first call. We take on a small number of clients at a time so every project gets senior attention.",
    "sortOrder": 1
  },
  {
    "question": "What do you need from us?",
    "answer": "One person who can make decisions, honest feedback and about an hour a week. We take care of everything else, from research to launch.",
    "sortOrder": 2
  },
  {
    "question": "Do you only work with big companies?",
    "answer": "No. We work with start-ups, family businesses and festivals as well as larger companies. Most of them want to stop looking like everyone else in their category.",
    "sortOrder": 3
  },
  {
    "question": "Who owns the work?",
    "answer": "You do. All files, source code and brand assets are handed over at the end of every project, with guidelines so your team can use them well.",
    "sortOrder": 4
  },
  {
    "question": "Can you work with our in-house team?",
    "answer": "Yes, and it often works best that way. We can lead the whole project or join your team for one part of it.",
    "sortOrder": 5
  }
];

export const seedSettings: { email: string; socialLinks: SocialLink[]; bookingFrom: string } = {
  "email": "hello@gandariastudio.com",
  "socialLinks": [
    {
      "label": "LinkedIn",
      "href": "https://www.linkedin.com"
    },
    {
      "label": "Instagram",
      "href": "https://www.instagram.com"
    },
    {
      "label": "GitHub",
      "href": "https://github.com"
    }
  ],
  "bookingFrom": "Q1 2027"
};
