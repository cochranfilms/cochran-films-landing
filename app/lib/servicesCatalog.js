// Shared service catalog and base service metadata for the Services modal/cart

export const stripeServiceDatabase = {
  'video-production': {
    name: 'Video Production',
    price: 250,
    description: 'Professional video production including commercials, brand films, documentaries, and live event coverage.',
    icon: 'fas fa-video',
    features: [
      'Professional camera equipment',
      'High-quality audio recording',
      'Post-production editing',
      'Color grading & correction',
      'Final delivery in multiple formats',
      'Project consultation included'
    ],
    category: 'videography'
  },
  'photography': {
    name: 'Photography',
    price: 350,
    description: 'Live event printing, portraits, product photography, and event coverage with instant printing capabilities.',
    icon: 'fas fa-camera',
    features: [
      'Professional camera equipment',
      'Live event printing (4x6 & 5x7)',
      'Branded print templates',
      'Online gallery delivery',
      'Light photo editing included',
      'Unlimited digital photos'
    ],
    category: 'photography'
  },
  'web-development': {
    name: 'Web Development',
    price: 750,
    description: 'Custom website development and maintenance, from strategy and design to publishing and ongoing support.',
    icon: 'fas fa-code',
    features: [
      'Custom website design',
      'Mobile-responsive layout',
      'SEO optimization',
      'Content management system',
      'Contact form integration',
      '30-day post-launch support'
    ],
    category: 'website'
  },
  'brand-development': {
    name: 'Brand Development',
    price: 900,
    description: 'Complete brand identity development including logos, design systems, and strategic brand positioning.',
    icon: 'fas fa-palette',
    features: [
      'Custom logo design (2 concepts)',
      'Brand color palette',
      'Typography selection',
      'Brand guidelines document',
      'Social media templates',
      '1-page landing website'
    ],
    category: 'branding'
  },
  'white-label-services': {
    name: 'White-Label Services',
    price: 2000,
    description: 'Enterprise-ready sites and systems you can deploy under your brand.',
    icon: 'fas fa-users-gear',
    features: [
      'Custom-branded solutions',
      'Scalable architecture',
      'API integration',
      'Admin dashboard',
      'User management system',
      'Technical documentation'
    ],
    category: 'enterprise'
  },
  'workshops-training': {
    name: 'Web Development Workshop',
    price: 350,
    description: 'Build Your Website in Just 2 DAYS — With Expert Support Every Step of the Way.',
    icon: 'fas fa-graduation-cap',
    features: [
      '2-day intensive workshop',
      'Hands-on website building',
      'Expert guidance throughout',
      'Take-home project files',
      '30-day post-workshop support',
      'Certificate of completion'
    ],
    category: 'education'
  }
};

export const CF_SERVICES_CATALOG = {
  'web-development': {
    packages: [
      { id: 'starter-site', name: 'Starter Site', price: 750 },
      { id: 'business-pro-site', name: 'Business Pro Site', price: 1250 },
      { id: 'brand-builder-site', name: 'Brand Builder Site', price: 2500 },
    ],
    addOns: [
      { id: 'seo-boost', name: 'SEO Boost Package', price: 250 },
      { id: 'google-business', name: 'Google Business Profile Setup', price: 100 },
      { id: 'newsletter-integration', name: 'Newsletter Integration', price: 125 },
      { id: 'basic-maintenance', name: 'Basic Maintenance (Monthly)', price: 45 },
      { id: 'business-maintenance', name: 'Business Maintenance (Monthly)', price: 95 },
      { id: 'full-support', name: 'Full Support Plan (Monthly)', price: 195 },
    ],
  },
  'photography': {
    packages: [
      { id: 'flash-start', name: 'Flash Start', price: 350 },
      { id: 'prime-exposure', name: 'Prime Exposure', price: 600 },
      { id: 'legacy-capture', name: 'Legacy Capture', price: 900 },
    ],
    addOns: [
      { id: 'quick-print-4x6', name: 'Quick Print Booth (4x6)', price: 500 },
      { id: 'signature-snap-4x6', name: 'Signature Snap Station (4x6)', price: 800 },
      { id: 'legacy-lab-4x6', name: 'Legacy Lab Experience (4x6)', price: 1100 },
    ],
  },
  'video-production': {
    packages: [
      { id: 'hourly-video', name: 'Hourly Video Service (Per Hour)', price: 250 },
      { id: 'event-video-2hr', name: 'Event Video + 60 Sec Recap (2 Hours)', price: 500 },
      { id: 'event-video-3hr', name: 'Event Video + 60 Sec Recap (3 Hours)', price: 750 },
      { id: 'event-video-5hr', name: 'Event Video + 60-90 Sec Recap (5 Hours)', price: 1250 },
      { id: 'live-production-3hr', name: 'Live Production (Up to 3 Cameras) - 3 Hours + Edit', price: 2000 },
      { id: 'live-production-5hr', name: 'Live Production (Up to 3 Cameras) - 5 Hours + Edit', price: 3000 },
      { id: 'live-production-8hr', name: 'Live Production (Up to 3 Cameras) - 8 Hours + Edit', price: 4000 },
      { id: 'podcast-1hr', name: 'Podcast + Edits (2 Cameras) - 1 Hour', price: 750 },
      { id: 'podcast-2hr', name: 'Podcast + Edits (2 Cameras) - 2 Hours', price: 1000 },
      { id: 'podcast-3hr', name: 'Podcast + Edits (2 Cameras) - 3 Hours', price: 1500 },
      { id: 'commercial-basic', name: 'Basic Commercial Shoot (Single Camera, 3 Hours)', price: 750 },
      { id: 'commercial-edit', name: 'Commercial Shoot + Edit (3-5 hrs + Edit)', price: 1500 },
      { id: 'commercial-directed', name: 'Directed Commercial Shoot (Pre-Pro + 4-6 hrs + Edit)', price: 2500 },
      { id: 'commercial-full', name: 'Full Commercial Package (Full Creative Direction + Crew)', price: 5500 },
    ],
    addOns: [],
  },
  'brand-development': {
    packages: [
      { id: 'ignite-brand', name: 'Ignite Package', price: 900 },
      { id: 'collaborate-brand', name: 'Collaborate Package', price: 1800 },
      { id: 'transform-brand', name: 'Transform Package', price: 3500 },
      { id: 'logo-design', name: 'Logo Design', price: 250 },
    ],
    addOns: [],
  },
  'white-label-services': {
    packages: [ { id: 'white-label-base', name: 'White-Label Services (Base)', price: 2000 } ],
    addOns: [],
  },
  'workshops-training': {
    packages: [ { id: 'web-dev-workshop', name: 'Web Development Workshop (2-Day)', price: 350 } ],
    addOns: [],
  },
};

export function getCatalogForService(serviceType){
  return CF_SERVICES_CATALOG[serviceType] || { packages: [], addOns: [] };
}


