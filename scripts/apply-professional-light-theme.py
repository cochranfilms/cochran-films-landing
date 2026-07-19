#!/usr/bin/env python3
"""Transform Cochran Films landing CSS to professional Apple-inspired light theme."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SITE_CSS = ROOT / "public" / "css" / "site.css"
RESUME_HTML = ROOT / "public" / "resume.html"

NEW_ROOT = """:root {
      --brand-indigo: #1d1d1f;
      --brand-emerald: #1d1d1f;
      --brand-amber: #1d1d1f;
      --brand-gold: #1d1d1f;
      --brand-blue: #0066CC;
      --brand-red: #d70015;
      --surface: #ffffff;
      --surface-muted: #f5f5f7;
      --surface-elevated: #ffffff;
      --dark-900: #f5f5f7;
      --dark-950: #ffffff;
      --text-primary: #1d1d1f;
      --text-secondary: #6e6e73;
      --text-muted: #86868b;
      --border-subtle: rgba(0, 0, 0, 0.08);
      --border-strong: rgba(0, 0, 0, 0.14);
      --card-bg: #ffffff;
      --card-border: 1px solid rgba(0, 0, 0, 0.08);
      --backdrop: none;
      --radius-lg: 18px;
      --radius-md: 12px;
      --radius-sm: 10px;
      --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 4px 18px rgba(0, 0, 0, 0.05);
      --shadow-sm: 0 2px 10px rgba(0, 0, 0, 0.04);
      --glow-indigo: none;
      --glow-gold: none;
      --transition: all 300ms cubic-bezier(.4,0,.2,1);
      --transition-fast: all 180ms cubic-bezier(.4,0,.2,1);
      --nav-height: 72px;
      --section-gap: 44px;
      --section-pad-y: 32px;
      --hero-banner-height: clamp(420px, 62vh, 680px);
      --btn-primary-bg: #1d1d1f;
      --btn-primary-text: #ffffff;
      --btn-secondary-bg: #ffffff;
      --btn-secondary-text: #1d1d1f;
      --btn-secondary-border: rgba(0, 0, 0, 0.14);
    }"""

LIGHT_OVERRIDES = """
/* ==========================================================================
   Professional Light Theme — Cochran Films (Apple / editorial aesthetic)
   ========================================================================== */

.ai-background,
#neuralCanvas {
  display: none !important;
}

html,
body {
  background: #ffffff !important;
  color: var(--text-primary) !important;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, "Inter", sans-serif !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body::before {
  display: none !important;
}

/* Navigation */
.nav-wrapper {
  background: rgba(255, 255, 255, 0.92) !important;
  backdrop-filter: saturate(180%) blur(20px) !important;
  -webkit-backdrop-filter: saturate(180%) blur(20px) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
  box-shadow: none !important;
}

.nav-link {
  color: var(--text-secondary) !important;
  font-weight: 500 !important;
  border-color: transparent !important;
}

.nav-link:hover {
  color: var(--text-primary) !important;
  background: rgba(0, 0, 0, 0.04) !important;
  border-color: transparent !important;
}

.nav-link.active {
  color: var(--text-primary) !important;
  background: rgba(0, 0, 0, 0.06) !important;
  border-color: rgba(0, 0, 0, 0.08) !important;
}

.nav-cta,
.hero-cta,
.spb-cta-band-actions .hero-cta,
.cf-about-founder-actions .hero-cta,
.footer-spb-cta,
.checkout-btn-primary,
.book-submit-btn,
.service-builder-submit,
.spb-cta-floating-link {
  background: var(--btn-primary-bg) !important;
  color: var(--btn-primary-text) !important;
  border: 1px solid var(--btn-primary-bg) !important;
  box-shadow: none !important;
  font-weight: 600 !important;
  letter-spacing: -0.01em !important;
}

.nav-cta:hover,
.hero-cta:hover,
.spb-cta-band-actions .hero-cta:hover,
.cf-about-founder-actions .hero-cta:hover,
.footer-spb-cta:hover,
.checkout-btn-primary:hover,
.book-submit-btn:hover,
.service-builder-submit:hover,
.spb-cta-floating-link:hover {
  background: #000000 !important;
  border-color: #000000 !important;
  transform: none !important;
  filter: none !important;
}

.hero-banner-btn-secondary,
.spb-cta-band-actions .hero-banner-btn-secondary,
.spb-cta-band .hero-banner-btn-secondary,
.spb-cta-inline .hero-banner-btn-secondary,
.cf-about-founder-actions .hero-banner-btn-secondary {
  background: var(--btn-secondary-bg) !important;
  color: var(--btn-secondary-text) !important;
  border: 1px solid var(--btn-secondary-border) !important;
  backdrop-filter: none !important;
  box-shadow: none !important;
  font-weight: 600 !important;
}

.hero-banner-btn-secondary:hover,
.spb-cta-band-actions .hero-banner-btn-secondary:hover,
.spb-cta-band .hero-banner-btn-secondary:hover,
.spb-cta-inline .hero-banner-btn-secondary:hover {
  background: var(--surface-muted) !important;
  border-color: rgba(0, 0, 0, 0.2) !important;
  transform: none !important;
}

.hero-banner .hero-banner-btn-secondary {
  background: rgba(255, 255, 255, 0.12) !important;
  color: #ffffff !important;
  border-color: rgba(255, 255, 255, 0.35) !important;
}

.hero-banner .hero-banner-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.2) !important;
}

.hero-banner .hero-cta {
  background: #ffffff !important;
  color: #1d1d1f !important;
  border-color: #ffffff !important;
}

.hero-banner .hero-cta:hover {
  background: #f5f5f7 !important;
}

.mobile-menu-toggle {
  color: var(--text-primary) !important;
}

/* Gradient text → solid typography */
.section-title,
.hero-title:not(.hero-banner .hero-title),
.services-showcase-title,
.services-showcase-kicker,
.hero-value-title,
.hero-value-kicker,
.book-section-title,
.book-kicker,
.cf-about-kicker,
.lp-portfolio-title span,
.resume-name-title span,
.page-title span,
.checkout-card h1,
.pricing-hero-title span,
.services-page-title span,
.portfolio-page-title span {
  background: none !important;
  -webkit-background-clip: unset !important;
  background-clip: unset !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  color: var(--text-primary) !important;
}

.hero-banner .hero-title {
  background: none !important;
  -webkit-background-clip: unset !important;
  background-clip: unset !important;
  -webkit-text-fill-color: #ffffff !important;
  color: #ffffff !important;
}

.hero-banner-kicker,
.hero-banner .hero-banner-kicker {
  color: rgba(255, 255, 255, 0.88) !important;
}

.hero-banner-kicker::before,
.hero-value-kicker::before,
.services-showcase-kicker::before,
.book-kicker::before {
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: none !important;
}

.hero-value-kicker::before,
.services-showcase-kicker::before,
.book-kicker::before,
.cf-about-kicker::before {
  background: var(--text-primary) !important;
}

.hero-value-kicker,
.services-showcase-kicker,
.book-kicker,
.cf-about-kicker,
.hero-value-tag {
  background: var(--surface-muted) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-secondary) !important;
  box-shadow: none !important;
}

.cf-about-title {
  color: var(--text-primary) !important;
}

.cf-about-title span {
  background: none !important;
  -webkit-text-fill-color: var(--text-primary) !important;
  color: var(--text-primary) !important;
}

/* Full-bleed sections — plain white / light gray */
.services-showcase-section,
.cf-about-section,
.book-section,
.footer,
.mayor-highlight-section--fullbleed,
.google-reviews-section,
.hero-social-proof,
.pricing-shell-section,
.services-catalog-section,
.portfolio-filter-bar-wrap,
.checkout-page,
.legal-page,
.page-hero-band {
  background: #ffffff !important;
  border-color: var(--border-subtle) !important;
}

.services-showcase-section::before,
.cf-about-section::before,
.book-section::before,
.spb-cta-band::before {
  display: none !important;
}

.hero-social-proof {
  background: var(--surface-muted) !important;
  border-top: 1px solid var(--border-subtle) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
}

.hero-social-proof-value {
  color: var(--text-primary) !important;
}

/* Cards & tiles */
.svc-tile,
.hero-value-card,
.about-card,
.lp-feature-card,
.lp-platform-card,
.lp-web-showcase,
.lp-portfolio-hero,
.book-section-grid,
.content-card,
.hero-card,
.side-card,
.portfolio-section,
.checkout-card,
.pricing-tier-card,
.service-card,
.google-review-card,
.re-deliverable,
.cf-about-pillar,
.cf-about-closer,
.cf-about-quote,
.seo-context-card {
  background: #ffffff !important;
  border: 1px solid var(--border-subtle) !important;
  box-shadow: var(--shadow-sm) !important;
  backdrop-filter: none !important;
}

.svc-tile::after,
.hero-value-card::before,
.hero-value-card::after,
.hero-value-icon-wrap::after,
.lp-portfolio-hero::after,
.hero-card::after,
.cf-about-visual-glow,
.checkout-card::before {
  display: none !important;
}

.svc-tile:hover,
.hero-value-card:hover,
.about-card:hover,
.lp-web-showcase:hover,
.lp-platform-card:hover {
  transform: translateY(-2px) !important;
  box-shadow: var(--shadow-md) !important;
  border-color: var(--border-strong) !important;
}

.svc-tile--photo,
.svc-tile--web,
.svc-tile--brand,
.svc-tile--whitelabel,
.svc-tile--workshops,
.hero-value-card--production,
.hero-value-card--dev,
.hero-value-card--platform {
  --svc-accent: #1d1d1f !important;
  --svc-accent-soft: rgba(0, 0, 0, 0.04) !important;
  --svc-accent-border: rgba(0, 0, 0, 0.1) !important;
  --card-accent: #1d1d1f !important;
  --card-glow: transparent !important;
}

.svc-tile-label,
.svc-tile-icon,
.hero-value-icon-wrap,
.hero-value-tag,
.about-icon {
  color: var(--text-primary) !important;
  background: var(--surface-muted) !important;
  border-color: var(--border-subtle) !important;
  box-shadow: none !important;
}

.hero-value-icon-wrap {
  border: 1px solid var(--border-subtle) !important;
}

/* SPB CTA band — clean editorial block */
.spb-cta-band,
.spb-cta-inline {
  background: var(--surface-muted) !important;
  border-top: 1px solid var(--border-subtle) !important;
  border-bottom: 1px solid var(--border-subtle) !important;
  box-shadow: none !important;
  color: var(--text-primary) !important;
}

.spb-cta-band-kicker {
  color: var(--text-secondary) !important;
}

.spb-cta-band-copy h2,
.spb-cta-inline h3 {
  color: var(--text-primary) !important;
}

.spb-cta-band-copy > p,
.spb-cta-inline > p {
  color: var(--text-secondary) !important;
}

.spb-cta-band-steps li {
  background: #ffffff !important;
  border-color: var(--border-subtle) !important;
  box-shadow: none !important;
}

/* Footer */
.footer-links a:hover {
  color: var(--text-primary) !important;
  transform: none !important;
}

.footer-location,
.footer-contact-list i,
.book-trust-list i,
.about-icon {
  color: var(--text-secondary) !important;
}

.social-link {
  background: var(--surface-muted) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;
}

.social-link:hover {
  background: #ffffff !important;
  border-color: var(--border-strong) !important;
}

/* Forms */
input,
textarea,
select,
.book-form input,
.book-form textarea,
.book-form select,
.checkout-form input,
.checkout-form textarea,
.service-builder-panel input,
.service-builder-panel select,
.service-builder-panel textarea {
  background: #ffffff !important;
  color: var(--text-primary) !important;
  border: 1px solid var(--border-strong) !important;
  box-shadow: none !important;
}

input:focus,
textarea:focus,
select:focus {
  border-color: #1d1d1f !important;
  outline: none !important;
  box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.06) !important;
}

input::placeholder,
textarea::placeholder {
  color: var(--text-muted) !important;
}

/* Modals & notices */
.cf-notice-panel,
.cf-notice-overlay .cf-notice-panel {
  background: #ffffff !important;
  border: 1px solid var(--border-subtle) !important;
  box-shadow: var(--shadow-lg) !important;
  color: var(--text-primary) !important;
}

.cf-notice-icon {
  background: var(--surface-muted) !important;
  color: var(--text-primary) !important;
  box-shadow: none !important;
}

.cf-notice-btn {
  background: var(--btn-primary-bg) !important;
  color: var(--btn-primary-text) !important;
  box-shadow: none !important;
}

/* Service builder / pricing */
.service-builder-sidebar,
.service-builder-main,
.pricing-summary-card,
.checkout-summary,
.builder-category-nav,
.builder-line-item {
  background: #ffffff !important;
  border-color: var(--border-subtle) !important;
  box-shadow: none !important;
}

.builder-category-nav button.is-active,
.pricing-tab.is-active,
.portfolio-filter-btn.is-active {
  background: var(--text-primary) !important;
  color: #ffffff !important;
  border-color: var(--text-primary) !important;
}

.builder-category-nav button,
.pricing-tab,
.portfolio-filter-btn {
  background: #ffffff !important;
  color: var(--text-secondary) !important;
  border: 1px solid var(--border-subtle) !important;
}

/* Floating SPB CTA */
.spb-cta-floating {
  background: #ffffff !important;
  border: 1px solid var(--border-subtle) !important;
  box-shadow: var(--shadow-md) !important;
}

.spb-cta-floating-dismiss {
  color: var(--text-secondary) !important;
  border-color: var(--border-subtle) !important;
}

.spb-cta-floating-dismiss:hover {
  color: var(--text-primary) !important;
  border-color: var(--border-strong) !important;
}

/* Hero banner — keep cinematic photo, soften overlay */
.hero-banner {
  box-shadow: none !important;
  border-bottom: 1px solid var(--border-subtle) !important;
}

.hero-banner-overlay {
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.25) 45%, rgba(0, 0, 0, 0.55) 100%) !important;
}

.hero-banner .hero-subtitle {
  color: rgba(255, 255, 255, 0.92) !important;
}

/* Pills / tags */
.marquee:not(.marquee-logos) .pill,
.marquee-services .pill,
.tag,
.chip {
  background: var(--surface-muted) !important;
  border: 1px solid var(--border-subtle) !important;
  color: var(--text-secondary) !important;
  box-shadow: none !important;
}

/* Remove neon accent colors in deliverables */
.re-deliverable strong {
  color: var(--text-primary) !important;
}

/* Resume page shared chrome */
body.resume-page .top-banner {
  background: #ffffff !important;
  border-color: var(--border-subtle) !important;
  box-shadow: none !important;
}

body.resume-page .eyebrow {
  color: var(--text-secondary) !important;
}

body.resume-page .eyebrow::before {
  background: var(--text-primary) !important;
  box-shadow: none !important;
}

body.resume-page .hero-title {
  color: var(--text-secondary) !important;
}

/* Accessibility: ensure contrast on colored badges */
.badge,
.status-badge,
.checkout-success-badge {
  box-shadow: none !important;
}
"""


def replace_root_block(content: str) -> str:
    return re.sub(
        r":root\s*\{[^}]*\}",
        NEW_ROOT.strip(),
        content,
        count=1,
        flags=re.DOTALL,
    )


def patch_base_styles(content: str) -> str:
    content = re.sub(
        r"html, body\s*\{[^}]*\}",
        """html, body {
      margin: 0;
      height: 100%;
      background: #ffffff;
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, "Inter", sans-serif;
      overflow-x: hidden;
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }""",
        content,
        count=1,
        flags=re.DOTALL,
    )

    content = content.replace(
        """    .ai-background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
    }""",
        """    .ai-background {
      display: none;
    }""",
    )

    content = content.replace(
        """    .nav-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(15, 23, 42, 0.95);
      backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(99,102,241,0.2);
      transition: var(--transition);
    }""",
        """    .nav-wrapper {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(255, 255, 255, 0.92);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      transition: var(--transition);
    }""",
    )

    return content


def append_overrides(content: str) -> str:
    marker = "/* ==========================================================================\n   Professional Light Theme"
    if marker in content:
        return content
    return content.rstrip() + "\n" + LIGHT_OVERRIDES + "\n"


def transform_css(path: Path) -> None:
    content = path.read_text(encoding="utf-8")
    content = replace_root_block(content)
    content = patch_base_styles(content)
    content = append_overrides(content)
    path.write_text(content, encoding="utf-8")
    print(f"Updated {path}")


def transform_resume_inline_styles(content: str) -> str:
    content = replace_root_block(content)

    content = re.sub(
        r"html,\s*body\s*\{[^}]*\}",
        """html,
    body {
      margin: 0;
      min-height: 100%;
      background: #ffffff;
      color: var(--text-primary);
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", Helvetica, Arial, "Inter", sans-serif;
      overflow-x: hidden;
      scroll-behavior: smooth;
      -webkit-font-smoothing: antialiased;
    }""",
        content,
        count=1,
        flags=re.DOTALL,
    )

    content = content.replace(
        """    .ai-background {
      position: fixed;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }""",
        """    .ai-background {
      display: none;
    }""",
    )

    content = re.sub(
        r"body::before\s*\{[^}]*\}",
        "body::before { display: none; }",
        content,
        count=1,
        flags=re.DOTALL,
    )

    content = content.replace(
        'content="#0f172a"',
        'content="#ffffff"',
    )

    if "Professional Light Theme — resume inline" not in content:
        resume_overrides = """
    /* Professional Light Theme — resume inline */
    .hero-card, .logo-strip, .content-card, .side-card, .portfolio-section {
      backdrop-filter: none !important;
      box-shadow: var(--shadow-sm) !important;
    }
    .resume-name-title span {
      background: none !important;
      -webkit-text-fill-color: var(--text-primary) !important;
      color: var(--text-primary) !important;
    }
    .cta-primary {
      background: #1d1d1f !important;
      color: #ffffff !important;
      border: 1px solid #1d1d1f !important;
      box-shadow: none !important;
    }
    .cta-secondary {
      background: #ffffff !important;
      color: #1d1d1f !important;
      border: 1px solid rgba(0, 0, 0, 0.14) !important;
      box-shadow: none !important;
    }
"""
        content = content.replace("  </style>", resume_overrides + "  </style>", 1)

    return content


def update_html_theme_colors() -> None:
    html_dir = ROOT / "public"
    for path in html_dir.glob("*.html"):
        text = path.read_text(encoding="utf-8")
        new_text = text.replace('content="#0f172a"', 'content="#ffffff"')
        if new_text != text:
            path.write_text(new_text, encoding="utf-8")
            print(f"Updated theme-color in {path.name}")


def main() -> None:
    transform_css(SITE_CSS)
    resume = RESUME_HTML.read_text(encoding="utf-8")
    resume = transform_resume_inline_styles(resume)
    RESUME_HTML.write_text(resume, encoding="utf-8")
    print(f"Updated {RESUME_HTML}")
    update_html_theme_colors()


if __name__ == "__main__":
    main()
