function formatUsd(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function firstName(fullName) {
  if (!fullName || typeof fullName !== 'string') return '';
  return fullName.trim().split(/\s+/)[0] || '';
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
    summary.innerHTML =
      services
        .map((s) => {
          const price = s.price != null ? s.price : s.lineTotal;
          return (
            '<div class="checkout-line"><span class="checkout-line-name">' +
            escapeHtml(s.name || s.title || 'Service') +
            '</span><span class="checkout-line-price">' +
            formatUsd(price) +
            '</span></div>'
          );
        })
        .join('') +
      '<div class="checkout-total-row"><span>Total due now</span><span>' +
      formatUsd(payload.total) +
      '</span></div>';
  }

  const r = payload.result || {};
  const isWhiteLabel = r.subscriptionModel === 'setup_then_monthly';
  const isRetainer = r.billingMode === 'subscription' && !isWhiteLabel;
  const bits = [];
  if (payload.invoiceNumber) {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-hashtag"></i><span><strong>Reference</strong> ' +
        escapeHtml(payload.invoiceNumber) +
        '</span></div>'
    );
  }
  if (payload.paymentDueDate) {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-calendar-check"></i><span><strong>Payment due</strong> ' +
        escapeHtml(payload.paymentDueDate) +
        '</span></div>'
    );
  }
  if (isRetainer && r.nextBillingDate) {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-repeat"></i><span><strong>Next billing</strong> ' +
        escapeHtml(r.nextBillingDate) +
        '</span></div>'
    );
  }
  if (isRetainer && r.commitmentTerm) {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-calendar-alt"></i><span><strong>Commitment</strong> ' +
        escapeHtml(r.commitmentTerm) +
        '</span></div>'
    );
  }
  if (payload.customer && payload.customer.email) {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-envelope"></i><span><strong>Invoice sent to</strong> ' +
        escapeHtml(payload.customer.email) +
        '</span></div>'
    );
  } else {
    bits.push(
      '<div class="checkout-meta-item"><i class="fas fa-envelope"></i><span>A copy of this invoice was emailed to you</span></div>'
    );
  }
  if (payload.emailWarning) {
    bits.push(
      '<div class="checkout-meta-item checkout-meta-item--warn"><i class="fas fa-circle-info"></i><span>' +
        escapeHtml(payload.emailWarning) +
        '</span></div>'
    );
  }
  if (meta) meta.innerHTML = bits.join('');

  const kicker = document.querySelector('.checkout-kicker');
  const title = document.querySelector('.checkout-title');
  const lede = document.querySelector('.checkout-lede');
  const customerEl = document.getElementById('checkoutCustomer');
  const paymentHeading = document.getElementById('checkout-payment-heading');
  const nextList = document.getElementById('checkoutNextList');
  const customerName = payload.customer && payload.customer.name ? payload.customer.name.trim() : '';
  const greeting = firstName(customerName);

  if (kicker) kicker.textContent = 'Booking confirmed';

  if (title) {
    if (isWhiteLabel) {
      title.textContent = greeting
        ? 'Thank you, ' + greeting + ' — your white-label invoice is ready'
        : 'Your white-label invoice is ready';
    } else if (isRetainer) {
      title.textContent = greeting
        ? 'Thank you, ' + greeting + ' — your retainer invoice is ready'
        : 'Your retainer invoice is ready';
    } else {
      title.textContent = greeting
        ? 'Thank you, ' + greeting + ' — your invoice has been created'
        : 'Your invoice has been created';
    }
  }

  if (lede) {
    const email = payload.customer && payload.customer.email ? payload.customer.email : 'your email';
    lede.textContent =
      'You\u2019re one step away from locking in your project with Cochran Films. Your package is saved, your invoice is live, and we\u2019ve sent everything to ' +
      email +
      '. Complete payment below whenever you\u2019re ready.';
  }

  if (customerEl && customerName) {
    customerEl.hidden = false;
    customerEl.textContent = 'Booked by ' + customerName;
  }

  if (paymentHeading) {
    paymentHeading.textContent = isWhiteLabel || isRetainer
      ? 'Activate your plan with payment'
      : 'Complete your payment';
  }

  if (nextList) {
    const stepOne = isWhiteLabel
      ? '<strong>Pay your setup invoice</strong> — your white-label partnership activates once payment is received.'
      : isRetainer
        ? '<strong>Pay your first retainer invoice</strong> — your ongoing partnership begins once payment is received.'
        : '<strong>Pay via Stripe</strong> — your booking is confirmed once payment is received.';
    nextList.innerHTML =
      '<li>' +
      stepOne +
      '</li>' +
      '<li><strong>We reach out within 24 hours</strong> — our Atlanta team will connect to schedule kickoff and next steps.</li>' +
      '<li><strong>Production begins</strong> — we handle your scoped services as one full-stack creative partner.</li>';
  }

  document.title = greeting
    ? 'Thank You, ' + greeting + ' | Cochran Films'
    : 'Booking Confirmed | Cochran Films';
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', renderCheckoutPage);
} else {
  renderCheckoutPage();
}
