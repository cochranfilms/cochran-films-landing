(function () {
  const ALTS = {
    hire: {
      frame: 'In-house path: $150k+ first-year leverage at stake',
      blurb: 'A senior hire alone rarely ships the full stack. Factor salary, tools, ramp time, and the product gaps that still remain.',
    },
    enterprise: {
      frame: 'Enterprise path: six-figure build before you earn',
      blurb: 'Custom software and enterprise SaaS commitments stack fast. In-house builds often run 40–60% above an equivalent partner engagement.',
    },
    nothing: {
      frame: 'Do-nothing path: delay is the most expensive option',
      blurb: 'Missed bookings, manual ops, and broken handoffs compound every quarter you wait. The opportunity cost usually clears $150k+ in leverage.',
    },
  };

  const TIER_ORDER = ['Launch', 'Growth', 'Domination'];

  function recommendTier(needs) {
    const weight = needs.length;
    const heavy = needs.some((n) => ['marketplace', 'whitelabel', 'ai', 'portal'].includes(n));
    if (weight >= 4 || (heavy && weight >= 3)) return 'Domination';
    if (weight >= 2 || heavy) return 'Growth';
    return 'Launch';
  }

  function initSystemsScope() {
    const root = document.getElementById('systems-scope-tool');
    if (!root) return;

    const frameEl = root.querySelector('[data-scope-frame]');
    const blurbEl = root.querySelector('[data-scope-blurb]');
    const tierEl = root.querySelector('[data-scope-tier]');
    const cta = root.querySelector('[data-scope-cta]');
    if (!frameEl || !blurbEl || !tierEl || !cta) return;

    function selectedAlt() {
      return root.querySelector('input[name="sys-alt"]:checked')?.value || 'hire';
    }

    function selectedNeeds() {
      return Array.from(root.querySelectorAll('input[name="sys-need"]:checked')).map((el) => el.value);
    }

    function render() {
      const alt = selectedAlt();
      const needs = selectedNeeds();
      const altCopy = ALTS[alt] || ALTS.hire;
      const tier = recommendTier(needs);

      frameEl.textContent = altCopy.frame;
      blurbEl.textContent = altCopy.blurb;
      tierEl.textContent = tier;
      tierEl.setAttribute('data-tier', tier.toLowerCase());

      const params = new URLSearchParams({
        type: 'systems-consult',
        alt,
        needs: needs.join(',') || 'general',
        tier: tier.toLowerCase(),
      });
      cta.href = `/contact?${params.toString()}`;
    }

    // Custom click handling avoids native focus-scroll jumps from visually hidden inputs.
    root.addEventListener('click', (event) => {
      const label = event.target.closest('label');
      if (!label || !root.contains(label)) return;
      const input = label.querySelector('input');
      if (!input) return;
      event.preventDefault();
      if (input.type === 'radio') {
        input.checked = true;
      } else if (input.type === 'checkbox') {
        input.checked = !input.checked;
      }
      render();
    });

    root.addEventListener('change', render);
    render();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSystemsScope);
  } else {
    initSystemsScope();
  }
})();
