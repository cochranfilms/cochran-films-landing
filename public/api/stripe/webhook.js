const Stripe = require('stripe');
const {
  PACKAGE_SOURCE,
  buildRetainerBillingNote,
  buildServicesHtml,
  claimDedupeKey,
  formatCommitmentTerm,
  formatUsdFromCents,
  readRawBody,
  sendEmailJs,
} = require('./stripe-package-shared');

function formatDateFromUnix(unixSeconds) {
  const d = unixSeconds ? new Date(unixSeconds * 1000) : new Date();
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function parseServicesFromMetadata(invoice) {
  const list = invoice.metadata?.services_list;
  if (!list) return [];
  return list.split('\n').filter(Boolean).map((line) => {
    const match = line.match(/^- (.+?)(?: \(×(\d+)\))?: \$([\d.]+)$/);
    if (!match) return { name: line.replace(/^- /, ''), price: 0, quantity: 1, duration: '' };
    const qty = match[2] ? Number(match[2]) : 1;
    const total = Number(match[3]);
    return {
      name: match[1],
      price: total / qty,
      quantity: qty,
      duration: '',
    };
  });
}

async function resolveInvoiceContext(stripe, invoice) {
  let fullInvoice = invoice;
  try {
    fullInvoice = await stripe.invoices.retrieve(invoice.id, { expand: ['customer'] });
  } catch (err) {
    console.warn('Could not re-fetch invoice:', err.message);
  }

  let meta = { ...(fullInvoice.metadata || {}) };
  const subscriptionId =
    typeof fullInvoice.subscription === 'string'
      ? fullInvoice.subscription
      : fullInvoice.subscription?.id;
  if (subscriptionId && (!meta.source || !meta.invoice_number)) {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (subscription.metadata?.source === PACKAGE_SOURCE) {
        meta = { ...subscription.metadata, ...meta };
      }
    } catch (err) {
      console.warn('Could not load subscription metadata for invoice:', err.message);
    }
  }

  const customerEmail =
    meta.customer_email ||
    (typeof fullInvoice.customer === 'object' ? fullInvoice.customer?.email : null) ||
    fullInvoice.customer_email ||
    '';
  const customerName =
    meta.customer_name ||
    (typeof fullInvoice.customer === 'object' ? fullInvoice.customer?.name : null) ||
    'Customer';
  const customerPhone = meta.customer_phone || 'Not provided';
  const refNumber = meta.invoice_number || fullInvoice.id;
  const stripeInvoiceNumber = fullInvoice.number || '';
  const amountCents =
    fullInvoice.amount_due > 0
      ? fullInvoice.amount_due
      : fullInvoice.total > 0
        ? fullInvoice.total
        : fullInvoice.amount_remaining;
  const totalAmount = formatUsdFromCents(amountCents);
  const invoiceUrl = fullInvoice.hosted_invoice_url || fullInvoice.invoice_pdf || '';
  const dueDate = formatDateFromUnix(fullInvoice.due_date);
  const paymentDate = formatDateFromUnix(fullInvoice.status_transitions?.paid_at);
  const servicesList = meta.services_list || '';
  const services = parseServicesFromMetadata(fullInvoice);
  const servicesHtml = services.length ? buildServicesHtml(services) : '';
  const siteUrl = process.env.SITE_URL || 'https://www.cochranfilms.com';

  return {
    fullInvoice,
    customerEmail,
    customerName,
    customerPhone,
    refNumber,
    stripeInvoiceNumber,
    totalAmount,
    invoiceUrl,
    dueDate,
    paymentDate,
    servicesList,
    servicesHtml,
    siteUrl,
    baseParams: {
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      invoice_number: refNumber,
      stripe_invoice_number: stripeInvoiceNumber,
      total_amount: totalAmount,
      due_date: dueDate,
      payment_date: paymentDate,
      invoice_url: invoiceUrl,
      services_list: servicesList,
      services_html: servicesHtml,
      reply_to: 'info@cochranfilms.com',
    },
  };
}

async function handleInvoicePaid(stripe, invoice) {
  if (invoice.metadata?.source !== PACKAGE_SOURCE) {
    return { skipped: true, reason: 'source_mismatch' };
  }

  const dedupeKey = `webhook:invoice.paid:${invoice.id}`;
  const claimed = await claimDedupeKey(dedupeKey);
  if (!claimed) {
    return { skipped: true, reason: 'duplicate' };
  }

  const ctx = await resolveInvoiceContext(stripe, invoice);
  const paidCents = invoice.amount_paid > 0 ? invoice.amount_paid : ctx.fullInvoice.amount_paid;
  ctx.baseParams.total_amount = formatUsdFromCents(paidCents);

  const paidAdminTemplate = process.env.EMAILJS_PACKAGE_PAID_ADMIN_TEMPLATE_ID;
  const paidClientTemplate = process.env.EMAILJS_PACKAGE_PAID_CLIENT_TEMPLATE_ID;
  const adminEmail = process.env.EMAILJS_ADMIN_EMAIL;
  const results = [];

  if (adminEmail && paidAdminTemplate) {
    try {
      await sendEmailJs(paidAdminTemplate, {
        ...ctx.baseParams,
        to_email: adminEmail,
        email_heading: 'Payment Received — Service Package',
        email_intro: `${ctx.customerName} paid invoice ${ctx.refNumber} (${ctx.baseParams.total_amount}).`,
        cta_label: 'View hosted invoice',
        cta_url: ctx.invoiceUrl || ctx.siteUrl,
        cta_subtext: ctx.stripeInvoiceNumber ? `Stripe #${ctx.stripeInvoiceNumber}` : 'Payment confirmed via Stripe',
        reply_to: ctx.customerEmail || 'info@cochranfilms.com',
      });
      results.push('admin_paid');
    } catch (err) {
      console.error('Paid admin EmailJS error:', err);
      results.push('admin_paid_error');
    }
  }

  if (ctx.customerEmail && paidClientTemplate) {
    try {
      await sendEmailJs(paidClientTemplate, {
        ...ctx.baseParams,
        to_email: ctx.customerEmail,
        email_heading: 'Thank You — Payment Confirmed',
        email_intro: `We received your payment of ${ctx.baseParams.total_amount} for invoice #${ctx.refNumber}.`,
        cta_label: 'Visit Cochran Films',
        cta_url: ctx.siteUrl,
        cta_subtext: 'Questions? Reply to this email.',
      });
      results.push('client_paid');
    } catch (err) {
      console.error('Paid client EmailJS error:', err);
      results.push('client_paid_error');
    }
  }

  return { ok: true, results };
}

async function handleInvoicePaymentFailed(stripe, invoice) {
  if (invoice.metadata?.source !== PACKAGE_SOURCE) {
    return { skipped: true, reason: 'source_mismatch' };
  }

  const dedupeKey = `webhook:invoice.payment_failed:${invoice.id}`;
  const claimed = await claimDedupeKey(dedupeKey);
  if (!claimed) {
    return { skipped: true, reason: 'duplicate' };
  }

  const templateId = process.env.EMAILJS_PACKAGE_PAYMENT_FAILED_CLIENT_TEMPLATE_ID;
  if (!templateId) {
    return { ok: true, skipped: true, reason: 'template_not_configured' };
  }

  const ctx = await resolveInvoiceContext(stripe, invoice);
  if (!ctx.customerEmail) {
    return { ok: true, skipped: true, reason: 'no_customer_email' };
  }

  try {
    await sendEmailJs(templateId, {
      ...ctx.baseParams,
      to_email: ctx.customerEmail,
      email_heading: 'Payment Could Not Be Processed',
      email_intro: `We were unable to process your payment for invoice #${ctx.refNumber} (${ctx.totalAmount}).`,
      cta_label: 'Retry payment',
      cta_url: ctx.invoiceUrl || ctx.siteUrl,
      cta_subtext: 'Secure checkout · Stripe',
    });
    return { ok: true, results: ['client_payment_failed'] };
  } catch (err) {
    console.error('Payment failed client EmailJS error:', err);
    return { ok: false, error: 'email_send_failed' };
  }
}

async function handleSubscriptionRenewalFinalized(stripe, invoice) {
  if (invoice.billing_reason !== 'subscription_cycle') {
    return { skipped: true, reason: 'not_renewal' };
  }

  const subscriptionId =
    typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
  if (!subscriptionId) {
    return { skipped: true, reason: 'no_subscription' };
  }

  const dedupeKey = `webhook:invoice.finalized:${invoice.id}`;
  const claimed = await claimDedupeKey(dedupeKey);
  if (!claimed) {
    return { skipped: true, reason: 'duplicate' };
  }

  let subscription;
  try {
    subscription = await stripe.subscriptions.retrieve(subscriptionId);
  } catch (err) {
    console.warn('Could not load subscription for renewal email:', err.message);
    return { skipped: true, reason: 'subscription_lookup_failed' };
  }

  if (subscription.metadata?.source !== PACKAGE_SOURCE) {
    return { skipped: true, reason: 'source_mismatch' };
  }

  const templateId = process.env.EMAILJS_PACKAGE_SUBSCRIPTION_CLIENT_TEMPLATE_ID;
  if (!templateId) {
    return { ok: true, skipped: true, reason: 'template_not_configured' };
  }

  const ctx = await resolveInvoiceContext(stripe, invoice);
  if (!ctx.customerEmail) {
    return { ok: true, skipped: true, reason: 'no_customer_email' };
  }

  const commitmentMonths = Number(subscription.metadata?.commitment_months) || 1;
  const subscriptionName =
    subscription.metadata?.subscription_name || ctx.refNumber || 'Monthly retainer';
  const nextBillingDate = subscription.current_period_end
    ? formatDateFromUnix(subscription.current_period_end)
    : '';

  try {
    await sendEmailJs(templateId, {
      ...ctx.baseParams,
      to_email: ctx.customerEmail,
      subscription_id: subscription.id,
      subscription_name: subscriptionName,
      commitment_term: formatCommitmentTerm(commitmentMonths),
      next_billing_date: nextBillingDate,
      billing_note: buildRetainerBillingNote(commitmentMonths),
      payment_due_date: ctx.dueDate,
      email_heading: 'Your Retainer Invoice Is Ready',
      email_intro: `Your monthly retainer invoice for ${subscriptionName} is ready (${ctx.totalAmount}). Pay by ${ctx.dueDate} to keep your content package active.`,
      cta_label: 'View invoice & pay',
      cta_url: ctx.invoiceUrl || ctx.siteUrl,
      cta_subtext: 'Monthly retainer · Secure checkout via Stripe',
    });
    return { ok: true, results: ['client_subscription_renewal'] };
  } catch (err) {
    console.error('Subscription renewal EmailJS error:', err);
    return { ok: false, error: 'email_send_failed' };
  }
}

async function handleInvoiceOverdue(stripe, invoice) {
  if (invoice.metadata?.source !== PACKAGE_SOURCE) {
    return { skipped: true, reason: 'source_mismatch' };
  }

  const dedupeKey = `webhook:invoice.overdue:${invoice.id}`;
  const claimed = await claimDedupeKey(dedupeKey);
  if (!claimed) {
    return { skipped: true, reason: 'duplicate' };
  }

  const templateId = process.env.EMAILJS_PACKAGE_OVERDUE_CLIENT_TEMPLATE_ID;
  if (!templateId) {
    return { ok: true, skipped: true, reason: 'template_not_configured' };
  }

  const ctx = await resolveInvoiceContext(stripe, invoice);
  if (!ctx.customerEmail) {
    return { ok: true, skipped: true, reason: 'no_customer_email' };
  }

  try {
    await sendEmailJs(templateId, {
      ...ctx.baseParams,
      to_email: ctx.customerEmail,
      email_heading: 'Your Invoice Is Overdue',
      email_intro: `This is a friendly reminder that invoice #${ctx.refNumber} for ${ctx.totalAmount} is past due (due date: ${ctx.dueDate}).`,
      cta_label: 'Pay invoice now',
      cta_url: ctx.invoiceUrl || ctx.siteUrl,
      cta_subtext: 'Secure checkout · Stripe',
    });
    return { ok: true, results: ['client_overdue'] };
  } catch (err) {
    console.error('Overdue client EmailJS error:', err);
    return { ok: false, error: 'email_send_failed' };
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecret || !webhookSecret) {
    console.error('Stripe webhook secrets missing');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const stripe = new Stripe(stripeSecret);
  let event;

  try {
    const rawBody = await readRawBody(req);
    const signature = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'invoice.paid': {
        const outcome = await handleInvoicePaid(stripe, event.data.object);
        return res.status(200).json({ received: true, type: event.type, ...outcome });
      }
      case 'invoice.payment_failed': {
        const outcome = await handleInvoicePaymentFailed(stripe, event.data.object);
        return res.status(200).json({ received: true, type: event.type, ...outcome });
      }
      case 'invoice.overdue': {
        const outcome = await handleInvoiceOverdue(stripe, event.data.object);
        return res.status(200).json({ received: true, type: event.type, ...outcome });
      }
      case 'invoice.finalized': {
        const outcome = await handleSubscriptionRenewalFinalized(stripe, event.data.object);
        return res.status(200).json({ received: true, type: event.type, ...outcome });
      }
      default:
        return res.status(200).json({ received: true, ignored: true, type: event.type });
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
}
