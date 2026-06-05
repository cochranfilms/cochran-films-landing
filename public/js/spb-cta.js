/**
 * Service Package Builder CTAs — floating pill + pre-footer band + footer button.
 * Loaded on all marketing pages so users can always reach /pricing.
 */
(function initSpbCtas() {
  const path = (window.location.pathname || '').replace(/\.html$/, '') || '/';
  const onPricing = path === '/pricing';
  const onCheckout = path === '/checkout';

  const builderHref = onPricing ? '#serviceBuilder' : '/pricing';
  const floatLabel = onPricing
    ? 'Start Building'
    : onCheckout
      ? 'Build Another Package'
      : 'Build Your Package';

  function injectFloatingCta() {
    if (document.getElementById('cfSpbCtaFloating') || sessionStorage.getItem('cfSpbCtaDismissed')) {
      return;
    }

    const floating = document.createElement('aside');
    floating.id = 'cfSpbCtaFloating';
    floating.className = 'spb-cta-floating';
    floating.setAttribute('aria-label', 'Service Package Builder quick action');
    floating.innerHTML = `
      <a href="${builderHref}" class="spb-cta-floating-link">
        <i class="fas fa-file-invoice-dollar" aria-hidden="true"></i>
        <span>${floatLabel}</span>
      </a>
      <button type="button" class="spb-cta-floating-dismiss" aria-label="Dismiss quick action">
        <i class="fa-solid fa-xmark" aria-hidden="true"></i>
      </button>
    `;
    document.body.appendChild(floating);

    floating.querySelector('.spb-cta-floating-dismiss').addEventListener('click', () => {
      floating.remove();
      sessionStorage.setItem('cfSpbCtaDismissed', '1');
    });

    const toggleVisible = () => {
      floating.classList.toggle('is-visible', window.scrollY > 280);
    };
    toggleVisible();
    window.addEventListener('scroll', toggleVisible, { passive: true });
  }

  function injectPreFooterBand() {
    if (onPricing) return;

    const footer = document.querySelector('footer.footer');
    if (!footer || document.getElementById('cfSpbCtaBand')) return;

    const band = document.createElement('section');
    band.id = 'cfSpbCtaBand';
    band.className = 'spb-cta-band';
    band.setAttribute('aria-labelledby', 'cf-spb-cta-band-title');
    band.innerHTML = `
      <div class="spb-cta-band-inner">
        <div class="spb-cta-band-copy">
          <p class="spb-cta-band-kicker"><i class="fas fa-file-invoice-dollar" aria-hidden="true"></i> Service Package Builder</p>
          <h2 id="cf-spb-cta-band-title">Build your custom package in minutes</h2>
          <p>Pick services, see live pricing, and get a Stripe invoice emailed instantly — the fastest way to book production with Cochran Films.</p>
          <ul class="spb-cta-band-steps" aria-label="How it works">
            <li><span>1</span> Select services</li>
            <li><span>2</span> Review live total</li>
            <li><span>3</span> Pay via Stripe</li>
          </ul>
        </div>
        <div class="spb-cta-band-actions">
          <a href="/pricing" class="hero-cta"><i class="fas fa-rocket" aria-hidden="true"></i> Open Package Builder</a>
          <a href="/contact" class="hero-banner-btn-secondary"><i class="fa-solid fa-message" aria-hidden="true"></i> Questions? Contact us</a>
        </div>
      </div>
    `;
    footer.parentNode.insertBefore(band, footer);
  }

  function injectFooterCta() {
    if (onPricing) return;

    const brandCol = document.querySelector('.footer-brand-col');
    if (!brandCol || brandCol.querySelector('.footer-spb-cta')) return;

    const cta = document.createElement('a');
    cta.href = '/pricing';
    cta.className = 'footer-spb-cta hero-cta';
    cta.innerHTML = '<i class="fas fa-file-invoice-dollar" aria-hidden="true"></i> Build Your Package';
    const socialRow = brandCol.querySelector('.footer-social-row');
    if (socialRow) {
      brandCol.insertBefore(cta, socialRow);
    } else {
      brandCol.appendChild(cta);
    }
  }

  function boot() {
    injectFloatingCta();
    injectPreFooterBand();
    injectFooterCta();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
