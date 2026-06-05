#!/usr/bin/env node
/**
 * Splits public/index.html into multi-page site + shared CSS/JS.
 * Run: node scripts/split-landing-site.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const INDEX = path.join(PUBLIC, 'index.html');
const MONOLITH = path.join(ROOT, 'scripts', 'index.monolith.backup.html');
const sourcePath = fs.existsSync(MONOLITH) ? MONOLITH : INDEX;

const lines = fs.readFileSync(sourcePath, 'utf8').split('\n');

function slice(start, end) {
  return lines.slice(start - 1, end).join('\n');
}

// --- Extract CSS ---
const styleStart = lines.findIndex((l) => l.trim() === '<style>') + 1;
const styleEnd = lines.findIndex((l) => l.trim() === '</style>');
const cssBody = lines.slice(styleStart, styleEnd).join('\n');
const checkoutCss = `
/* Checkout page */
.checkout-page {
  min-height: calc(100vh - 120px);
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) 4rem;
}
.checkout-shell {
  max-width: 720px;
  margin: 0 auto;
}
.checkout-card {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 20px;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35);
}
.checkout-kicker {
  color: var(--brand-gold);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin: 0 0 0.5rem;
}
.checkout-title {
  font-family: 'Poppins', sans-serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 800;
  margin: 0 0 0.75rem;
  color: #fff;
}
.checkout-lede {
  color: var(--text-muted, #94a3b8);
  margin: 0 0 1.5rem;
  line-height: 1.6;
}
.checkout-summary {
  background: rgba(2, 6, 23, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.15);
  border-radius: 14px;
  padding: 1.25rem;
  margin-bottom: 1.5rem;
}
.checkout-line {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  font-size: 0.95rem;
}
.checkout-line:last-child { border-bottom: none; }
.checkout-line-name { color: #e2e8f0; flex: 1; }
.checkout-line-price { color: var(--brand-gold); font-weight: 700; white-space: nowrap; }
.checkout-total-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(99, 102, 241, 0.35);
  font-size: 1.15rem;
  font-weight: 800;
}
.checkout-total-row span:last-child { color: var(--brand-gold); }
.checkout-meta {
  display: grid;
  gap: 0.65rem;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #cbd5e1;
}
.checkout-meta-item {
  display: flex;
  align-items: flex-start;
  gap: 0.65rem;
}
.checkout-meta-item i { color: var(--brand-indigo); margin-top: 2px; }
.checkout-actions {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.checkout-actions .btn-primary,
.checkout-actions .btn-secondary {
  width: 100%;
  justify-content: center;
  min-height: 52px;
  font-size: 1rem;
}
.checkout-empty {
  text-align: center;
  padding: 3rem 1rem;
}
.checkout-empty a { color: var(--brand-gold); font-weight: 700; }

/* Page opening hero — below nav, above main content */
.page-opening-hero {
  position: relative;
  z-index: 2;
  width: 100%;
}

.hero-banner--page .hero-title {
  font-size: clamp(28px, 5vw, 52px);
}

.page-opening-hero .marquee-logos {
  margin-top: 0;
}

/* Opening hero replaces duplicate in-page headers */
body.page-pricing .service-builder-section .spb-hero {
  display: none;
}
body.page-portfolio .lp-portfolio-hero {
  display: none;
}

/* Privacy policy — professional layout */
.legal-page {
  padding: clamp(2.5rem, 5vw, 4rem) clamp(1rem, 4vw, 2rem) 4rem;
}
.legal-shell {
  max-width: 1100px;
  margin: 0 auto;
}
.legal-layout {
  display: grid;
  grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
  gap: clamp(1.5rem, 4vw, 2.5rem);
  align-items: start;
}
.legal-toc {
  position: sticky;
  top: calc(var(--nav-height) + 20px);
}
.legal-toc nav {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.88));
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 16px;
  padding: 1.25rem 1rem;
}
.legal-toc-title {
  margin: 0 0 0.75rem;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--brand-gold);
}
.legal-toc ul {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}
.legal-toc a {
  display: block;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  color: #cbd5e1;
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 600;
  transition: background 0.15s ease, color 0.15s ease;
}
.legal-toc a:hover {
  background: rgba(99, 102, 241, 0.14);
  color: #fff;
}
.legal-card {
  background: linear-gradient(145deg, rgba(15, 23, 42, 0.94), rgba(30, 41, 59, 0.9));
  border: 1px solid rgba(99, 102, 241, 0.28);
  border-radius: 20px;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.28);
}
.legal-card-head {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.15);
}
.legal-updated {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-muted, #94a3b8);
  font-size: 0.88rem;
  margin: 0 0 1rem;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.1);
  border: 1px solid rgba(99, 102, 241, 0.22);
}
.legal-intro {
  color: #e2e8f0;
  line-height: 1.7;
  font-size: 1.05rem;
  margin: 0;
}
.legal-section {
  margin-bottom: 1.75rem;
  padding: 1.25rem 1.25rem 1.1rem;
  border-radius: 14px;
  background: rgba(2, 6, 23, 0.38);
  border: 1px solid rgba(148, 163, 184, 0.12);
  scroll-margin-top: calc(var(--nav-height) + 24px);
}
.legal-section-head {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}
.legal-section-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 178, 0, 0.12);
  border: 1px solid rgba(255, 178, 0, 0.28);
  color: var(--brand-gold);
  flex-shrink: 0;
}
.legal-section h2 {
  font-size: 1.1rem;
  margin: 0;
  color: #fff;
  font-weight: 800;
}
.legal-section p, .legal-section li {
  color: #cbd5e1;
  line-height: 1.65;
  font-size: 0.95rem;
}
.legal-section ul {
  padding-left: 1.25rem;
  margin: 0.5rem 0 0;
}
.legal-section a { color: #93c5fd; }
.legal-contact-card {
  margin-top: 2rem;
  padding: 1.5rem;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(99, 102, 241, 0.14), rgba(255, 178, 0, 0.08));
  border: 1px solid rgba(99, 102, 241, 0.32);
  text-align: center;
}
.legal-contact-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1.15rem;
  color: #fff;
}
.legal-contact-card p {
  margin: 0 0 1rem;
  color: #cbd5e1;
  font-size: 0.95rem;
}
.legal-contact-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: center;
}
.legal-contact-actions a {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.65rem 1.1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 0.9rem;
  text-decoration: none;
}
.legal-contact-actions .legal-btn-primary {
  background: linear-gradient(135deg, var(--brand-gold), #ffd166);
  color: #0a0a0a;
}
.legal-contact-actions .legal-btn-secondary {
  border: 1px solid rgba(255, 178, 0, 0.34);
  color: #fde68a;
  background: rgba(15, 23, 42, 0.72);
}
@media (max-width: 900px) {
  .legal-layout { grid-template-columns: 1fr; }
  .legal-toc { position: static; }
  .legal-toc nav { display: flex; flex-wrap: wrap; gap: 0.35rem; align-items: center; }
  .legal-toc-title { width: 100%; margin-bottom: 0.35rem; }
  .legal-toc ul { display: flex; flex-wrap: wrap; gap: 0.35rem; }
  .legal-toc a { padding: 0.35rem 0.6rem; font-size: 0.8rem; }
}
`;

fs.mkdirSync(path.join(PUBLIC, 'css'), { recursive: true });
fs.mkdirSync(path.join(PUBLIC, 'js'), { recursive: true });
fs.writeFileSync(path.join(PUBLIC, 'css', 'site.css'), cssBody + checkoutCss);

// --- Head (without inline style) ---
const headEndLine = lines.findIndex((l) => l.trim() === '</head>') + 1;
let headBase = slice(1, headEndLine);
headBase = headBase.replace(/<style>[\s\S]*?<\/style>\s*/m, '');
headBase = headBase.replace(
  '</head>',
  '  <link rel="stylesheet" href="/css/site.css" />\n</head>'
);

// --- Sections ---
const sections = {
  home: slice(8837, 9010),
  about: slice(9012, 9048),
  services: slice(9050, 9156),
  serviceBuilder: slice(9158, 9802),
  portfolio: slice(9804, 10506),
  book: slice(10509, 10585),
};

const LOGO_MARQUEE = `      <section class="marquee marquee-logos" aria-label="Brands and partners Cochran Films has worked with">
        <div class="tracks" aria-hidden="true">
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Andre-Dickens.webp" type="image/webp"><img src="assets/scrolling-banner/Andre-Dickens.png" alt="Andre Dickens for Atlanta" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/iHeartRadio.webp" type="image/webp"><img src="assets/scrolling-banner/iHeartRadio.png" alt="iHeartRadio" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Braves.webp" type="image/webp"><img src="assets/scrolling-banner/Braves.png" alt="Atlanta Braves" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Georgia-Power.webp" type="image/webp"><img src="assets/scrolling-banner/Georgia-Power.png" alt="Georgia Power" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Douglasville.webp" type="image/webp"><img src="assets/scrolling-banner/Douglasville.png" alt="Douglasville, Georgia" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/DCPR.webp" type="image/webp"><img src="assets/scrolling-banner/DCPR.png" alt="Douglas County Parks and Recreation" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/stagewing.webp" type="image/webp"><img src="assets/scrolling-banner/stagewing.png" alt="Stage Wing" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/bizzi-byte-logo.webp" type="image/webp"><img src="assets/scrolling-banner/bizzi-byte-logo.png" alt="Bizzi Byte" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/DJs-Logo.webp" type="image/webp"><img src="assets/scrolling-banner/DJs-Logo.png" alt="DJs Need Luv 2" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Andre-Dickens.webp" type="image/webp"><img src="assets/scrolling-banner/Andre-Dickens.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/iHeartRadio.webp" type="image/webp"><img src="assets/scrolling-banner/iHeartRadio.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Braves.webp" type="image/webp"><img src="assets/scrolling-banner/Braves.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Georgia-Power.webp" type="image/webp"><img src="assets/scrolling-banner/Georgia-Power.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/Douglasville.webp" type="image/webp"><img src="assets/scrolling-banner/Douglasville.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/DCPR.webp" type="image/webp"><img src="assets/scrolling-banner/DCPR.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/stagewing.webp" type="image/webp"><img src="assets/scrolling-banner/stagewing.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/bizzi-byte-logo.webp" type="image/webp"><img src="assets/scrolling-banner/bizzi-byte-logo.png" alt="" loading="lazy" decoding="async"></picture></span>
          <span class="logo-pill"><picture><source srcset="assets/scrolling-banner/DJs-Logo.webp" type="image/webp"><img src="assets/scrolling-banner/DJs-Logo.png" alt="" loading="lazy" decoding="async"></picture></span>
        </div>
      </section>`;

const PAGE_OPENING_HEROS = {
  home: null,
  services: {
    aria: 'Book Cochran Films services',
    kicker: 'What We Do',
    title: 'TURN OUR SERVICES INTO YOUR STACK',
    subtitle:
      'Video, photography, web development, and white-label platforms — pick what you need and we&apos;ll scope, price, and deliver as one studio.',
    primary: { href: '/pricing', label: 'Build Your Package', icon: 'fas fa-file-invoice-dollar' },
    secondary: { href: '/portfolio', label: 'See Our Work', icon: 'fa-solid fa-images' },
  },
  pricing: {
    aria: 'Service Package Builder',
    kicker: 'Book with Cochran Films',
    title: 'SERVICE PACKAGE BUILDER',
    subtitle:
      'Create your own invoice in minutes — pick services, see live pricing, and we&apos;ll email you a Stripe payment link.',
    primary: { href: '#serviceBuilder', label: 'Start Building', icon: 'fa-solid fa-hand-pointer' },
    secondary: { href: '/contact', label: 'Questions? Contact Us', icon: 'fa-solid fa-message' },
  },
  portfolio: {
    aria: 'Book production with Cochran Films',
    kicker: 'Portfolio Highlights',
    title: 'LET&apos;S CREATE YOUR NEXT SHOWCASE',
    subtitle:
      'Commercial video, civic events, SaaS platforms, and real estate media — bring us your vision and we&apos;ll deliver work worth putting in the portfolio.',
    primary: { href: '/pricing', label: 'Book Your Services', icon: 'fas fa-rocket' },
    secondary: { href: '/contact', label: 'Book a Strategy Session', icon: 'fa-solid fa-calendar-check' },
  },
  contact: {
    aria: 'Start a project with Cochran Films',
    kicker: 'Start Your Project',
    title: 'WE RESPOND WITHIN 24 HOURS',
    subtitle:
      'Prefer to skip the form? Build a custom package with live pricing or call us directly — Atlanta-based, serving clients nationwide.',
    primary: { href: '/pricing', label: 'Build Your Package', icon: 'fas fa-file-invoice-dollar' },
    secondary: { href: 'tel:+14704202169', label: 'Call (470) 420-2169', icon: 'fa-solid fa-phone' },
  },
  privacy: {
    aria: 'Cochran Films Privacy Policy',
    kicker: 'Legal &amp; Trust',
    title: 'PRIVACY POLICY',
    subtitle:
      'Transparent practices for how Cochran Films LLC collects, uses, and protects your information across our website, forms, and payment flows.',
    primary: { href: '#legal-content', label: 'Read Full Policy', icon: 'fa-solid fa-shield-halved' },
    secondary: { href: '/contact', label: 'Contact Us', icon: 'fa-solid fa-envelope' },
  },
  checkout: {
    aria: 'Continue with Cochran Films',
    kicker: 'Secure Checkout',
    title: 'TRUSTED BY ATLANTA BRANDS &amp; BEYOND',
    subtitle:
      'Your payment is processed securely through Stripe. Explore more services or start your next project with Cochran Films anytime.',
    primary: { href: '/pricing', label: 'Build Another Package', icon: 'fas fa-plus' },
    secondary: { href: '/portfolio', label: 'View Our Portfolio', icon: 'fa-solid fa-images' },
  },
};

function buildPageOpeningHero(pageKey) {
  const c = PAGE_OPENING_HEROS[pageKey];
  if (!c) return '';
  const headingTag = pageKey === 'home' ? 'h1' : 'h1';
  return `
  <section class="page-opening-hero" aria-label="${c.aria}">
    <div class="hero-banner hero-banner--page" aria-label="${c.aria}">
      <div class="hero-banner-media">
        <picture><source srcset="about-header.webp" type="image/webp"><img src="about-header.png" alt="Cody Cochran operating a cinema camera during a production" loading="eager" decoding="async" width="1600" height="1107"></picture>
      </div>
      <div class="hero-banner-overlay" aria-hidden="true"></div>
      <div class="hero-banner-content">
        <div class="hero-banner-kicker">${c.kicker}</div>
        <${headingTag} class="hero-title">${c.title}</${headingTag}>
        <p class="hero-subtitle">${c.subtitle}</p>
        <div class="hero-banner-actions">
          <a href="${c.primary.href}" class="hero-cta"><i class="${c.primary.icon}" aria-hidden="true"></i> ${c.primary.label}</a>
          <a href="${c.secondary.href}" class="hero-banner-btn-secondary"><i class="${c.secondary.icon}" aria-hidden="true"></i> ${c.secondary.label}</a>
        </div>
      </div>
    </div>
${LOGO_MARQUEE}
  </section>`;
}

// --- Footer template ---
function buildFooter() {
  return `  <!-- Footer -->
  <footer class="footer" role="contentinfo">
    <div class="footer-shell">
      <div class="footer-grid">
        <div class="footer-brand-col">
          <div class="footer-logo">
            <a href="/" aria-label="Cochran Films home">
              <picture><source srcset="Logo.webp" type="image/webp"><img src="Logo.png" alt="Cochran Films — cinematic production and full-stack creative agency" width="300" height="68" loading="eager" decoding="async"></picture>
            </a>
          </div>
          <p class="footer-tagline">Atlanta's full-stack creative agency — cinematic production, modern engineering, and creator-ready systems built as one stack.</p>
          <div class="footer-location"><i class="fa-solid fa-location-dot" aria-hidden="true"></i> Atlanta, Georgia · Serving Metro Atlanta &amp; Nationwide</div>
          <div class="footer-social-row">
            <a href="https://www.instagram.com/cochran.films" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Cochran Films on Instagram">
              <i class="fab fa-instagram" aria-hidden="true"></i> Instagram
            </a>
            <a href="https://www.youtube.com/@cochranfilmsllc" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Cochran Films on YouTube">
              <i class="fab fa-youtube" aria-hidden="true"></i> YouTube
            </a>
            <a href="https://github.com/cochranfilms" target="_blank" rel="noopener noreferrer" class="social-link" aria-label="Cochran Films on GitHub">
              <i class="fab fa-github" aria-hidden="true"></i> GitHub
            </a>
          </div>
        </div>

        <div>
          <h3 class="footer-col-title">Explore</h3>
          <ul class="footer-links">
            <li><a href="/">Home</a></li>
            <li><a href="/#about">About</a></li>
            <li><a href="/services">Services</a></li>
            <li><a href="/portfolio">Portfolio</a></li>
            <li><a href="/resume">Resume</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer-col-title">Services</h3>
          <ul class="footer-links">
            <li><a href="/services">Video Production</a></li>
            <li><a href="/services">Photography</a></li>
            <li><a href="/portfolio#portfolio-realestate">Real Estate Media</a></li>
            <li><a href="/services">Web Development</a></li>
            <li><a href="/portfolio#portfolio-web">Platforms &amp; SaaS</a></li>
            <li><a href="/pricing">Build a Package</a></li>
          </ul>
        </div>

        <div>
          <h3 class="footer-col-title">Contact</h3>
          <ul class="footer-contact-list">
            <li><i class="fa-solid fa-envelope" aria-hidden="true"></i><a href="mailto:info@cochranfilms.com">info@cochranfilms.com</a></li>
            <li><i class="fa-solid fa-phone" aria-hidden="true"></i><a href="tel:+14704202169">(470) 420-2169</a></li>
            <li><i class="fa-solid fa-globe" aria-hidden="true"></i><a href="https://cochranfilms.studio" target="_blank" rel="noopener noreferrer">cochranfilms.studio</a></li>
            <li><i class="fa-solid fa-file-lines" aria-hidden="true"></i><a href="/resume">Cody Cochran Resume</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p class="footer-copyright">© 2026 Cochran Films LLC. All rights reserved.</p>
        <div class="footer-legal">
          <a href="/">Home</a>
          <a href="/privacy-policy">Privacy Policy</a>
          <a href="https://collaborate.cochranfilms.com/">Creator Portal</a>
          <a href="/resume">Resume</a>
        </div>
      </div>
    </div>
  </footer>`;
}

function buildNav(activeKey) {
  const items = [
    { key: 'home', href: '/', label: 'Home' },
    { key: 'about', href: '/#about', label: 'About' },
    { key: 'services', href: '/services', label: 'Services' },
    { key: 'portfolio', href: '/portfolio', label: 'Portfolio' },
    { key: 'resume', href: '/resume', label: 'Resume' },
    { key: 'contact', href: '/contact', label: 'Contact' },
    { key: 'pricing', href: '/pricing', label: 'Book Services', cta: true },
  ];
  const lis = items
    .map((item) => {
      const cls = [
        item.cta ? 'nav-link nav-cta' : 'nav-link',
        item.key === activeKey ? 'active' : '',
      ]
        .filter(Boolean)
        .join(' ');
      return `        <li class="nav-item">
          <a href="${item.href}" class="${cls}">${item.label}</a>
        </li>`;
    })
    .join('\n');

  return `  <!-- Navigation -->
  <nav class="nav-wrapper" role="navigation" aria-label="Main navigation">
    <div class="nav-container">
      <a href="/" class="nav-logo" aria-label="Cochran Films home">
        <picture><source srcset="Logo.webp" type="image/webp"><img loading="eager" src="Logo.png" alt="Cochran Films" width="220" height="52" decoding="async"></picture>
      </a>
      
      <ul class="nav-menu" id="site-nav-menu">
${lis}
      </ul>

      <button class="mobile-menu-toggle" type="button" aria-label="Toggle mobile menu" aria-expanded="false" aria-controls="site-nav-menu">
        <i class="fas fa-bars" aria-hidden="true"></i>
      </button>
    </div>
  </nav>`;
}

function patchHead(head, meta) {
  let h = head;
  if (meta.title) {
    h = h.replace(/<title>[^<]*<\/title>/, `<title>${meta.title}</title>`);
    h = h.replace(
      /<meta name="title" content="[^"]*"/,
      `<meta name="title" content="${meta.title}"`
    );
  }
  if (meta.description) {
    h = h.replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${meta.description}"`
    );
    h = h.replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${meta.description}"`
    );
    h = h.replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${meta.description}"`
    );
  }
  if (meta.canonical) {
    h = h.replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${meta.canonical}"`
    );
    h = h.replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${meta.canonical}"`
    );
  }
  if (meta.ogTitle) {
    h = h.replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${meta.ogTitle}"`
    );
    h = h.replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${meta.ogTitle}"`
    );
  }
  return h;
}

const bodyOpen = `  <!-- AI Neural Network Background -->
  <div class="ai-background">
    <canvas id="neuralCanvas"></canvas>
  </div>

`;

const privacyBody = `  <main class="legal-page" id="privacy-policy-content">
    <div class="legal-shell">
      <div class="legal-layout">
        <aside class="legal-toc" aria-label="Table of contents">
          <nav>
            <p class="legal-toc-title">On this page</p>
            <ul>
              <li><a href="#legal-overview">Overview</a></li>
              <li><a href="#legal-collect">Information We Collect</a></li>
              <li><a href="#legal-use">How We Use Data</a></li>
              <li><a href="#legal-consent">Communications</a></li>
              <li><a href="#legal-payments">Payments</a></li>
              <li><a href="#legal-sharing">Data Sharing</a></li>
              <li><a href="#legal-security">Security</a></li>
              <li><a href="#legal-rights">Your Rights</a></li>
            </ul>
          </nav>
        </aside>
        <article class="legal-card" id="legal-content">
          <header class="legal-card-head" id="legal-overview">
            <p class="legal-updated"><i class="fa-regular fa-calendar" aria-hidden="true"></i> Last updated: June 4, 2026</p>
            <p class="legal-intro">Cochran Films LLC (&quot;Cochran Films,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) respects your privacy. This policy explains how we collect, use, and protect information when you visit <a href="https://www.cochranfilms.com/">cochranfilms.com</a>, submit inquiries, or purchase services.</p>
          </header>

          <section class="legal-section" id="legal-collect">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-database"></i></span>
              <h2>Information We Collect</h2>
            </div>
            <p>We may collect your name, email address, phone number, business details, project requirements, billing information processed through Stripe, and communications you send through our contact or service package forms.</p>
          </section>

          <section class="legal-section" id="legal-use">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-briefcase"></i></span>
              <h2>How We Use Your Information</h2>
            </div>
            <ul>
              <li>Respond to inquiries and deliver contracted creative, production, and technology services</li>
              <li>Send project updates, invoices, payment links, and service-related announcements</li>
              <li>Improve our website, client experience, and internal operations</li>
              <li>Comply with legal, tax, and accounting obligations</li>
            </ul>
          </section>

          <section class="legal-section" id="legal-consent">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-comments"></i></span>
              <h2>Communications &amp; Consent</h2>
            </div>
            <p>When you submit a form or start a project, you may receive email, phone, or text communications related to your request. Typical email frequency is 2–4 messages per month for active marketing updates; project communications are sent as needed.</p>
            <ul>
              <li><strong>Email opt-out:</strong> Reply &quot;UNSUBSCRIBE&quot; or use the unsubscribe link in any marketing email</li>
              <li><strong>Text opt-out:</strong> Reply &quot;STOP&quot; to any text message</li>
              <li><strong>Phone:</strong> Request removal by calling <a href="tel:+14704202169">(470) 420-2169</a></li>
            </ul>
          </section>

          <section class="legal-section" id="legal-payments">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-credit-card"></i></span>
              <h2>Payments</h2>
            </div>
            <p>Payments are processed by Stripe. We do not store full card numbers on our servers. Stripe&apos;s privacy practices are described at <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer">stripe.com/privacy</a>.</p>
          </section>

          <section class="legal-section" id="legal-sharing">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-share-nodes"></i></span>
              <h2>Data Sharing</h2>
            </div>
            <p>We do not sell your personal information. We share data only with trusted providers required to operate our business (for example: Stripe for payments, EmailJS or email delivery providers, hosting on Vercel, and analytics tools). Mobile opt-in data is never shared with third parties for their own marketing.</p>
          </section>

          <section class="legal-section" id="legal-security">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-lock"></i></span>
              <h2>Data Security &amp; Retention</h2>
            </div>
            <p>We use industry-standard safeguards to protect client data. We retain information as long as needed to fulfill services, meet legal requirements, and resolve disputes.</p>
          </section>

          <section class="legal-section" id="legal-rights">
            <div class="legal-section-head">
              <span class="legal-section-icon" aria-hidden="true"><i class="fa-solid fa-user-shield"></i></span>
              <h2>Your Rights</h2>
            </div>
            <p>You may request access, correction, or deletion of your personal information by contacting <a href="mailto:info@cochranfilms.com">info@cochranfilms.com</a>. California and other state privacy rights may apply depending on your location.</p>
          </section>

          <div class="legal-contact-card">
            <h3>Questions about this policy?</h3>
            <p>Cochran Films LLC · Atlanta, Georgia</p>
            <div class="legal-contact-actions">
              <a href="mailto:info@cochranfilms.com" class="legal-btn-primary"><i class="fa-solid fa-envelope" aria-hidden="true"></i> info@cochranfilms.com</a>
              <a href="tel:+14704202169" class="legal-btn-secondary"><i class="fa-solid fa-phone" aria-hidden="true"></i> (470) 420-2169</a>
            </div>
          </div>
        </article>
      </div>
    </div>
  </main>`;

const checkoutBody = `  <main class="checkout-page" id="checkout">
    <div class="checkout-shell">
      <div id="checkoutContent" class="checkout-card" aria-live="polite">
        <p class="checkout-kicker">Secure Checkout</p>
        <h1 class="checkout-title">Complete Your Payment</h1>
        <p class="checkout-lede">Your package summary and Stripe invoice link were also sent to your email. Pay instantly below or use the invoice link anytime.</p>
        <div id="checkoutSummary" class="checkout-summary" hidden></div>
        <div id="checkoutMeta" class="checkout-meta"></div>
        <div class="checkout-actions">
          <a id="checkoutPayBtn" class="btn-primary" href="#" rel="noopener noreferrer">
            <i class="fas fa-lock" aria-hidden="true"></i> Pay Now Securely
          </a>
          <a id="checkoutInvoiceLink" class="btn-secondary" href="#" target="_blank" rel="noopener noreferrer">
            <i class="fas fa-file-invoice-dollar" aria-hidden="true"></i> Open Stripe Invoice
          </a>
          <a href="/pricing" class="btn-secondary">
            <i class="fas fa-arrow-left" aria-hidden="true"></i> Back to Package Builder
          </a>
        </div>
      </div>
      <div id="checkoutEmpty" class="checkout-card checkout-empty" hidden>
        <h1 class="checkout-title">No checkout session found</h1>
        <p class="checkout-lede">Start by building a service package or open the payment link from your email.</p>
        <p><a href="/pricing">Go to Service Package Builder</a> · <a href="/contact">Contact us</a></p>
      </div>
    </div>
  </main>`;

// --- Extract & patch JS from index ---
let scriptStart = -1;
let scriptEnd = -1;
for (let i = 10500; i < lines.length; i++) {
  if (scriptStart < 0 && lines[i].trim() === '<script>') scriptStart = i + 1;
  if (scriptStart > 0 && lines[i].trim() === '</script>') {
    scriptEnd = i;
    break;
  }
}
if (scriptStart < 0 || scriptEnd < 0) {
  console.error('Could not locate main <script> block');
  process.exit(1);
}
let fullScript = lines.slice(scriptStart, scriptEnd).join('\n');

// Fix contact form guard
fullScript = fullScript.replace(
  "document.getElementById('bookingForm').addEventListener('submit', async function(e) {",
  "const bookingForm = document.getElementById('bookingForm');\n    if (bookingForm) bookingForm.addEventListener('submit', async function(e) {"
);

// Remove duplicate neural network init block
fullScript = fullScript.replace(
  /\n    \/\/ Initialize AI Neural Network when DOM is ready\n    if \(document\.readyState === 'loading'\) \{\n      document\.addEventListener\('DOMContentLoaded', \(\) => \{\n        new AINeuralNetwork\(\);\n      \}\);\n    \} else \{\n      new AINeuralNetwork\(\);\n    \}\n\n    \/\/ Initialize AI Neural Network when DOM is ready\n    if \(document\.readyState === 'loading'\) \{\n      document\.addEventListener\('DOMContentLoaded', \(\) => \{\n        new AINeuralNetwork\(\);\n      \}\);\n    \} else \{\n      new AINeuralNetwork\(\);\n    \}/,
  `\n    // Initialize AI Neural Network when canvas is present
    function bootNeuralCanvas() {
      if (!document.getElementById('neuralCanvas')) return;
      new AINeuralNetwork();
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootNeuralCanvas);
    } else {
      bootNeuralCanvas();
    }`
);

// Update scroll spy for multi-page
fullScript = fullScript.replace(
  `    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });

    // Active navigation highlighting
    const sections = document.querySelectorAll('.section, .book-section');
    const navLinks = document.querySelectorAll('.nav-link');

    window.addEventListener('scroll', () => {
      let current = '';
      sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollY >= (sectionTop - 200)) {
          current = section.getAttribute('id');
        }
      });

      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === \`#\${current}\`) {
          link.classList.add('active');
        }
      });
    });`,
  `    // Same-page smooth scrolling for hash links only
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const hash = this.getAttribute('href');
        if (!hash || hash === '#') return;
        const target = document.querySelector(hash);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });

    // Active nav for path-based pages
    (function highlightActiveNav() {
      const path = window.location.pathname.replace(/\\.html$/, '') || '/';
      document.querySelectorAll('.nav-link').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.startsWith('#')) return;
        const normalized = href.replace(/\\.html$/, '') || '/';
        const isHomeAbout = path === '/' && normalized === '/#about';
        const isMatch =
          normalized === path ||
          (path === '/' && normalized === '/') ||
          (normalized === '/pricing' && path === '/pricing');
        if (isMatch && !href.includes('#about')) {
          link.classList.add('active');
        } else if (href === '/#about' && window.location.hash === '#about') {
          link.classList.add('active');
        }
      });
    })();`
);

// Redirect to checkout after invoice instead of modal-only
fullScript = fullScript.replace(
  `          const emailNotes = [result.emailWarning, result.adminEmailWarning].filter(Boolean).join(' ');
          showSuccessModal(result.invoiceUrl, emailNotes || null, result.paymentDueDate, result);
          try {
            localStorage.removeItem(SPB_STORAGE_KEY);
          } catch (_) { /* ignore */ }
          clearPackage();`,
  `          const emailNotes = [result.emailWarning, result.adminEmailWarning].filter(Boolean).join(' ');
          const checkoutPayload = {
            invoiceUrl: result.invoiceUrl,
            emailWarning: emailNotes || null,
            paymentDueDate: result.paymentDueDate,
            result: {
              billingMode: result.billingMode,
              subscriptionModel: result.subscriptionModel,
              nextBillingDate: result.nextBillingDate,
              commitmentTerm: result.commitmentTerm,
            },
            customer: invoiceData.customer,
            services: invoiceData.services,
            total: invoiceData.total,
            subtotal: invoiceData.subtotal,
            invoiceNumber: invoiceData.invoiceNumber,
            ts: Date.now(),
          };
          try {
            sessionStorage.setItem('cfCheckout', JSON.stringify(checkoutPayload));
          } catch (_) { /* ignore */ }
          try {
            localStorage.removeItem(SPB_STORAGE_KEY);
          } catch (_) { /* ignore */ }
          clearPackage();
          window.location.href = '/checkout';`
);

// Split script into chunks by markers
const spbMarker = '    // Service Package Builder System';
const portfolioMarker = '    function initializeRealEstatePortfolio()';
const spbIdx = fullScript.indexOf(spbMarker);
const portfolioIdx = fullScript.indexOf(portfolioMarker);

const coreScript = fullScript.slice(0, spbIdx).trim();
let spbScript = fullScript.slice(spbIdx, portfolioIdx).trim();
spbScript += `

    if (document.querySelector('.service-builder-section')) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeServicePackageBuilder().catch(() => {});
        });
      } else {
        initializeServicePackageBuilder().catch(() => {});
      }
    }`;
let portfolioScript = fullScript.slice(portfolioIdx).trim();
portfolioScript = portfolioScript.replace(
  /if \(document\.readyState === 'loading'\) \{[\s\S]*initializeShowcaseReveal\(\);\s*\}/,
  `function bootPageModules() {
      if (document.querySelector('.real-estate-section, #portfolio-realestate')) {
        initializeRealEstatePortfolio();
      }
      initializeShowcaseReveal();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', bootPageModules);
    } else {
      bootPageModules();
    }`
);

const checkoutScript = `
    function formatUsd(amount) {
      const n = Number(amount);
      if (!Number.isFinite(n)) return '$0.00';
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
    }

    function renderCheckoutPage() {
      const content = document.getElementById('checkoutContent');
      const empty = document.getElementById('checkoutEmpty');
      let payload = null;
      try {
        const raw = sessionStorage.getItem('cfCheckout');
        payload = raw ? JSON.parse(raw) : null;
      } catch (_) { /* ignore */ }

      if (!payload || !payload.invoiceUrl) {
        if (content) content.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }

      const safeUrl = /^https:\\/\\/(invoice\\.stripe\\.com|pay\\.stripe\\.com)\\//i.test(payload.invoiceUrl)
        ? payload.invoiceUrl
        : '';
      if (!safeUrl) {
        if (content) content.hidden = true;
        if (empty) empty.hidden = false;
        return;
      }

      const payBtn = document.getElementById('checkoutPayBtn');
      const invoiceLink = document.getElementById('checkoutInvoiceLink');
      if (payBtn) payBtn.href = safeUrl;
      if (invoiceLink) invoiceLink.href = safeUrl;

      const summary = document.getElementById('checkoutSummary');
      const meta = document.getElementById('checkoutMeta');
      const services = Array.isArray(payload.services) ? payload.services : [];
      if (summary && services.length) {
        summary.hidden = false;
        summary.innerHTML = services
          .map((s) => {
            const price = s.price != null ? s.price : s.lineTotal;
            return '<div class="checkout-line"><span class="checkout-line-name">' +
              (s.name || s.title || 'Service') +
              '</span><span class="checkout-line-price">' + formatUsd(price) + '</span></div>';
          })
          .join('') +
          '<div class="checkout-total-row"><span>Total due now</span><span>' +
          formatUsd(payload.total) + '</span></div>';
      }

      const r = payload.result || {};
      const isWhiteLabel = r.subscriptionModel === 'setup_then_monthly';
      const isRetainer = r.billingMode === 'subscription' && !isWhiteLabel;
      const bits = [];
      if (payload.invoiceNumber) {
        bits.push('<div class="checkout-meta-item"><i class="fas fa-hashtag"></i><span>Reference: ' + payload.invoiceNumber + '</span></div>');
      }
      if (payload.paymentDueDate) {
        bits.push('<div class="checkout-meta-item"><i class="fas fa-calendar-check"></i><span>Payment due by ' + payload.paymentDueDate + '</span></div>');
      }
      if (isRetainer && r.nextBillingDate) {
        bits.push('<div class="checkout-meta-item"><i class="fas fa-repeat"></i><span>Next billing: ' + r.nextBillingDate + '</span></div>');
      }
      if (isRetainer && r.commitmentTerm) {
        bits.push('<div class="checkout-meta-item"><i class="fas fa-calendar-alt"></i><span>Commitment: ' + r.commitmentTerm + '</span></div>');
      }
      bits.push('<div class="checkout-meta-item"><i class="fas fa-envelope"></i><span>A copy of this invoice was emailed to you</span></div>');
      if (payload.emailWarning) {
        bits.push('<div class="checkout-meta-item"><i class="fas fa-circle-info"></i><span>' + payload.emailWarning + '</span></div>');
      }
      if (meta) meta.innerHTML = bits.join('');

      const title = document.querySelector('.checkout-title');
      const lede = document.querySelector('.checkout-lede');
      if (title) {
        title.textContent = isWhiteLabel
          ? 'Complete Your White-Label Setup'
          : isRetainer
            ? 'Complete Your Retainer Payment'
            : 'Complete Your Payment';
      }
      if (lede && payload.customer && payload.customer.email) {
        lede.textContent =
          'Invoice sent to ' + payload.customer.email + '. Pay instantly below or use the Stripe invoice link from your inbox anytime.';
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderCheckoutPage);
    } else {
      renderCheckoutPage();
    }
`;

fs.writeFileSync(path.join(PUBLIC, 'js', 'site-core.js'), coreScript);
fs.writeFileSync(path.join(PUBLIC, 'js', 'service-builder.js'), spbScript);
fs.writeFileSync(path.join(PUBLIC, 'js', 'portfolio.js'), portfolioScript);
fs.writeFileSync(path.join(PUBLIC, 'js', 'checkout.js'), checkoutScript.trim());

function buildPage({ file, activeNav, headMeta, mainContent, scripts, wrapper = true, pageKey, bodyClass = '' }) {
  const head = patchHead(headBase, headMeta);
  const scriptTags = scripts.map((s) => `  <script src="${s}" defer></script>`).join('\n');
  const main = wrapper ? `  <div class="wrapper">\n${mainContent}\n  </div>` : mainContent;
  const bodyAttr = bodyClass ? ` class="${bodyClass}"` : '';

  return `${head}
<body${bodyAttr}>
${bodyOpen}${buildNav(activeNav)}
${buildPageOpeningHero(pageKey)}
${main}
${buildFooter()}
${scriptTags}
</body>
</html>
`;
}

const pages = [
  {
    file: 'index.html',
    pageKey: 'home',
    activeNav: 'home',
    headMeta: {
      title: 'Cochran Films 2026 | Atlanta Video Production, Web Development & Creative Agency',
      description:
        "Cochran Films is Atlanta's full-stack creative agency for video production, photography, web development, real estate media, civic event coverage, and white-label services.",
      canonical: 'https://www.cochranfilms.com/',
      ogTitle: 'Cochran Films 2026 | Atlanta Video Production & Full-Stack Creative Agency',
    },
    mainContent: `${sections.home}\n\n    ${sections.about}`,
    scripts: ['/js/site-core.js', '/js/portfolio.js'],
    wrapper: true,
  },
  {
    file: 'services.html',
    pageKey: 'services',
    activeNav: 'services',
    headMeta: {
      title: 'Services | Cochran Films — Video, Photography & Web Development Atlanta',
      description:
        'Explore Cochran Films services: cinematic video production, photography, web development, brand development, white-label platforms, and workshops in Atlanta.',
      canonical: 'https://www.cochranfilms.com/services',
      ogTitle: 'Cochran Films Services | Atlanta Creative Agency',
    },
    mainContent: sections.services,
    scripts: ['/js/site-core.js', '/js/portfolio.js'],
    wrapper: true,
  },
  {
    file: 'pricing.html',
    pageKey: 'pricing',
    bodyClass: 'page-pricing',
    activeNav: 'pricing',
    headMeta: {
      title: 'Pricing & Package Builder | Cochran Films',
      description:
        'Build your custom service package and get an instant Stripe invoice. Video production, retainers, white-label plans, and project-based billing from Cochran Films.',
      canonical: 'https://www.cochranfilms.com/pricing',
      ogTitle: 'Cochran Films Pricing & Service Package Builder',
    },
    mainContent: sections.serviceBuilder,
    scripts: ['/js/site-core.js', '/js/service-builder.js', '/js/portfolio.js'],
    // portfolio.js provides showcase reveal + conditional SPB boot guard
    wrapper: true,
  },
  {
    file: 'portfolio.html',
    pageKey: 'portfolio',
    bodyClass: 'page-portfolio',
    activeNav: 'portfolio',
    headMeta: {
      title: 'Portfolio | Cochran Films — Production, Web & Real Estate Media',
      description:
        'Portfolio highlights from Cochran Films: commercial video, civic events, SaaS platforms, creator education, and real estate media across Atlanta and nationwide.',
      canonical: 'https://www.cochranfilms.com/portfolio',
      ogTitle: 'Cochran Films Portfolio',
    },
    mainContent: sections.portfolio.replace(/\n  <\/div>\s*$/, ''),
    scripts: ['/js/site-core.js', '/js/portfolio.js'],
    wrapper: true,
  },
  {
    file: 'contact.html',
    pageKey: 'contact',
    activeNav: 'contact',
    headMeta: {
      title: 'Contact | Cochran Films — Book Your Project',
      description:
        'Contact Cochran Films in Atlanta for video production, photography, web development, and white-label services. We respond within 24 hours.',
      canonical: 'https://www.cochranfilms.com/contact',
      ogTitle: 'Contact Cochran Films',
    },
    mainContent: sections.book,
    scripts: ['/js/site-core.js'],
    wrapper: false,
  },
  {
    file: 'privacy-policy.html',
    pageKey: 'privacy',
    activeNav: null,
    headMeta: {
      title: 'Privacy Policy | Cochran Films',
      description: 'Privacy policy for Cochran Films LLC — how we collect, use, and protect your information.',
      canonical: 'https://www.cochranfilms.com/privacy-policy',
      ogTitle: 'Cochran Films Privacy Policy',
    },
    mainContent: privacyBody,
    scripts: ['/js/site-core.js'],
    wrapper: false,
  },
  {
    file: 'checkout.html',
    pageKey: 'checkout',
    activeNav: 'pricing',
    headMeta: {
      title: 'Checkout | Cochran Films',
      description: 'Complete your Cochran Films service package payment securely via Stripe.',
      canonical: 'https://www.cochranfilms.com/checkout',
      ogTitle: 'Cochran Films Checkout',
    },
    mainContent: checkoutBody,
    scripts: ['/js/site-core.js', '/js/checkout.js'],
    wrapper: false,
  },
];

function fixInternalLinks(html) {
  let out = html
    .replace(/href="#services"/g, 'href="/services"')
    .replace(/href="#portfolio"/g, 'href="/portfolio"');
  // Hero primary CTA = package builder; other former #book links = contact page
  out = out.replace(
    /(<a href=")#book(" class="hero-cta">\s*\n\s*<i class="fas fa-rocket"><\/i>\s*\n\s*Book Your Services)/g,
    '$1/pricing$2'
  );
  out = out.replace(/href="#book"/g, 'href="/contact"');
  return out;
}

for (const page of pages) {
  const html = fixInternalLinks(buildPage(page));
  fs.writeFileSync(path.join(PUBLIC, page.file), html);
  console.log('Wrote', page.file);
}

// Update vercel.json
const vercelPath = path.join(PUBLIC, 'vercel.json');
const vercel = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
vercel.rewrites = [
  { source: '/resume', destination: '/resume.html' },
  { source: '/services', destination: '/services.html' },
  { source: '/pricing', destination: '/pricing.html' },
  { source: '/portfolio', destination: '/portfolio.html' },
  { source: '/contact', destination: '/contact.html' },
  { source: '/privacy-policy', destination: '/privacy-policy.html' },
  { source: '/checkout', destination: '/checkout.html' },
];
fs.writeFileSync(vercelPath, JSON.stringify(vercel, null, 2) + '\n');

// Update sitemap
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://www.cochranfilms.com/</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/services</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/pricing</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/portfolio</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/contact</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/privacy-policy</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.4</priority>
  </url>
  <url>
    <loc>https://www.cochranfilms.com/resume</loc>
    <lastmod>2026-06-04</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
fs.writeFileSync(path.join(PUBLIC, 'sitemap.xml'), sitemap);

console.log('Done. Shared assets: public/css/site.css, public/js/*.js');
