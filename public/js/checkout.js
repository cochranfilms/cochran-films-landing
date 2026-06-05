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

      const safeUrl = /^https:\/\/(invoice\.stripe\.com|pay\.stripe\.com)\//i.test(payload.invoiceUrl)
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