(function () {
  const TIERS = [
    {
      id: 'starter-site',
      label: 'Starter Site',
      priceLabel: '$750',
      setup: 750,
      monthly: 0,
      blurb: '1-page scroll system with contact path and foundational SEO.',
    },
    {
      id: 'business-pro-site',
      label: 'Business Pro Site',
      priceLabel: '$1,250',
      setup: 1250,
      monthly: 0,
      blurb: '3–5 page conversion site built for local and brand growth.',
    },
    {
      id: 'brand-builder-site',
      label: 'Brand Builder Site',
      priceLabel: '$2,500',
      setup: 2500,
      monthly: 0,
      blurb: '6–10 page branded website with booking/CRM-ready integrations.',
    },
    {
      id: 'white-label-launch',
      label: 'White-Label Launch',
      priceLabel: '$2,500 + $199/mo',
      setup: 2500,
      monthly: 199,
      blurb: 'Agency-ready launch system with funnel, booking, and handoff kit.',
    },
    {
      id: 'white-label-growth',
      label: 'White-Label Growth',
      priceLabel: '$4,500 + $349/mo',
      setup: 4500,
      monthly: 349,
      blurb: 'Growth stack with member area, CRM pipeline, and reporting.',
    },
    {
      id: 'white-label-domination',
      label: 'White-Label Domination',
      priceLabel: '$8,500 + $699/mo',
      setup: 8500,
      monthly: 699,
      blurb: 'SaaS-lite features, custom dashboards, APIs, and priority SLA.',
    },
  ];

  function formatMoney(n) {
    return `$${Number(n || 0).toLocaleString()}`;
  }

  function initSystemsPricingBar() {
    const root = document.getElementById('systems-pricing-bar');
    if (!root) return;

    const slider = root.querySelector('#systemsPriceSlider');
    const labelEl = root.querySelector('[data-spb-label]');
    const priceEl = root.querySelector('[data-spb-price]');
    const blurbEl = root.querySelector('[data-spb-blurb]');
    const fillEl = root.querySelector('[data-spb-fill]');
    const cta = root.querySelector('[data-spb-cta]');
    const ticks = root.querySelectorAll('[data-spb-tick]');

    if (!slider || !labelEl || !priceEl || !blurbEl || !cta) return;

    function render() {
      const step = Math.min(Math.max(parseInt(slider.value, 10) || 0, 0), TIERS.length - 1);
      const tier = TIERS[step];
      const pct = (step / (TIERS.length - 1)) * 100;

      labelEl.textContent = tier.label;
      priceEl.textContent = tier.priceLabel;
      blurbEl.textContent = tier.blurb;
      if (fillEl) fillEl.style.width = `${pct}%`;
      slider.setAttribute('aria-valuetext', `${tier.label}, ${tier.priceLabel}`);
      cta.href = `/pricing?category=website&preselect=${encodeURIComponent(tier.id)}`;
      cta.setAttribute('data-sku', tier.id);

      ticks.forEach((tick) => {
        const tickStep = parseInt(tick.getAttribute('data-spb-tick'), 10);
        tick.classList.toggle('is-active', tickStep === step);
        tick.classList.toggle('is-passed', tickStep <= step);
      });

      root.style.setProperty('--spb-progress', `${pct}%`);
    }

    slider.addEventListener('input', render);
    slider.addEventListener('change', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystemsPricingBar);
  } else {
    initSystemsPricingBar();
  }
})();
