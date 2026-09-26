const Stripe = require('stripe');
const {
  PACKAGE_SOURCE,
  formatUsdFromCents,
  sendEmailJs,
} = require('../../stripe/stripe-package-shared');

function stripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function dashboardBase() {
  const key = process.env.STRIPE_SECRET_KEY || '';
  return key.startsWith('sk_test')
    ? 'https://dashboard.stripe.com/test'
    : 'https://dashboard.stripe.com';
}

function isPackageMeta(meta) {
  return meta && meta.source === PACKAGE_SOURCE;
}

function isoFromUnix(seconds) {
  if (!seconds) return null;
  return new Date(seconds * 1000).toISOString();
}

function customerFields(record, meta) {
  const phone = meta.customer_phone && meta.customer_phone !== 'Not provided'
    ? meta.customer_phone
    : record.customer_phone || '';
  return {
    customerName: meta.customer_name || record.customer_name || 'Client',
    customerEmail: meta.customer_email || record.customer_email || '',
    customerPhone: phone || '',
  };
}

function invoiceDisplayStatus(invoice) {
  if (invoice.status === 'paid') return 'paid';
  if (invoice.status === 'void') return 'void';
  if (invoice.status === 'uncollectible') return 'uncollectible';
  if (invoice.status === 'draft') return 'draft';
  if (invoice.status === 'open' && invoice.due_date && invoice.due_date * 1000 < Date.now()) {
    return 'overdue';
  }
  if (invoice.status === 'open') return 'open';
  return invoice.status || 'open';
}

function normalizeInvoice(invoice) {
  const meta = invoice.metadata || {};
  const status = invoiceDisplayStatus(invoice);
  const amountCents = status === 'paid'
    ? (invoice.amount_paid || invoice.total || 0)
    : (invoice.amount_due || invoice.total || 0);
  const subscriptionId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id || meta.subscription_id || '';
  return {
    id: invoice.id,
    number: invoice.number || '',
    ref: meta.invoice_number || invoice.number || invoice.id,
    ...customerFields(invoice, meta),
    packageName: meta.subscription_name || 'Service package',
    servicesList: String(meta.services_list || '').replace(/^- /gm, '').trim(),
    amountCents,
    amountLabel: formatUsdFromCents(amountCents),
    status,
    stripeStatus: invoice.status,
    createdAt: isoFromUnix(invoice.created),
    dueAt: isoFromUnix(invoice.due_date),
    paidAt: isoFromUnix(invoice.status_transitions?.paid_at),
    hostedUrl: invoice.hosted_invoice_url || '',
    subscriptionId,
    model: meta.subscription_model || (subscriptionId ? 'retainer_monthly' : 'one_time'),
    dashboardUrl: `${dashboardBase()}/invoices/${invoice.id}`,
  };
}

function subscriptionModel(meta) {
  if (meta.subscription_model === 'setup_then_monthly') return 'setup_then_monthly';
  return 'retainer_monthly';
}

function normalizeSubscription(subscription) {
  const meta = subscription.metadata || {};
  const price = subscription.items?.data?.[0]?.price;
  const amountCents = price?.unit_amount || 0;
  const latest = subscription.latest_invoice && typeof subscription.latest_invoice === 'object'
    ? subscription.latest_invoice
    : null;
  const paused = Boolean(subscription.pause_collection);
  let displayStatus = subscription.status || 'active';
  if (subscription.status === 'canceled') displayStatus = 'ended';
  else if (paused) displayStatus = 'paused';
  else if (subscription.status === 'past_due' || subscription.status === 'unpaid') displayStatus = 'past_due';
  else if (subscription.status === 'trialing' || subscription.status === 'active') displayStatus = 'active';
  const latestInvoice = latest ? normalizeInvoice(latest) : null;
  const onTrial = subscription.trial_end && subscription.trial_end > Math.floor(Date.now() / 1000);
  return {
    id: subscription.id,
    ...customerFields(subscription, meta),
    packageName: meta.subscription_name || price?.nickname || 'Subscription',
    servicesList: String(meta.services_list || '').replace(/^- /gm, '').trim(),
    model: subscriptionModel(meta),
    modelLabel: subscriptionModel(meta) === 'setup_then_monthly' ? 'White-label' : 'Retainer',
    status: displayStatus,
    stripeStatus: subscription.status,
    paused,
    amountCents,
    amountLabel: formatUsdFromCents(amountCents),
    commitmentEnd: subscriptionModel(meta) === 'setup_then_monthly' ? null : isoFromUnix(subscription.cancel_at),
    nextBillAt: isoFromUnix(onTrial ? subscription.trial_end : subscription.current_period_end),
    createdAt: isoFromUnix(subscription.created),
    latestInvoice,
    dashboardUrl: `${dashboardBase()}/subscriptions/${subscription.id}`,
  };
}

async function collectSubscriptions(stripe) {
  const query = `metadata['source']:'${PACKAGE_SOURCE}'`;
  const [searched, recent] = await Promise.all([
    stripe.subscriptions.search({
      query,
      limit: 100,
      expand: ['data.latest_invoice'],
    }).catch(() => stripe.subscriptions.search({ query, limit: 100 })),
    stripe.subscriptions.list({
      status: 'all',
      limit: 100,
      expand: ['data.latest_invoice'],
    }).catch(() => stripe.subscriptions.list({ status: 'all', limit: 100 })),
  ]);
  const map = new Map();
  for (const sub of [...(searched.data || []), ...(recent.data || [])]) {
    if (isPackageMeta(sub.metadata)) map.set(sub.id, sub);
  }
  return [...map.values()].map(normalizeSubscription);
}

async function collectInvoices(stripe, subscriptionIds) {
  const query = `metadata['source']:'${PACKAGE_SOURCE}'`;
  const [searched, recent] = await Promise.all([
    stripe.invoices.search({ query, limit: 100 }).catch(() => ({ data: [] })),
    stripe.invoices.list({ limit: 100 }).catch(() => ({ data: [] })),
  ]);
  const map = new Map();
  for (const invoice of [...(searched.data || []), ...(recent.data || [])]) {
    const subId = typeof invoice.subscription === 'string'
      ? invoice.subscription
      : invoice.subscription?.id || invoice.metadata?.subscription_id || '';
    if (isPackageMeta(invoice.metadata) || (subId && subscriptionIds.has(subId))) {
      map.set(invoice.id, invoice);
    }
  }
  return [...map.values()].map(normalizeInvoice);
}

function sameMonth(iso, now) {
  if (!iso) return false;
  const date = new Date(iso);
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
}

function buildBoard({ inquiries, invoices, subscriptions, storageConfigured, stripeConfigured }) {
  const now = new Date();
  const paidThisMonth = invoices.filter((row) => row.status === 'paid' && sameMonth(row.paidAt, now));
  const paidCents = paidThisMonth.reduce((sum, row) => sum + (row.amountCents || 0), 0);
  const attention = [];
  inquiries.filter((row) => row.status === 'new').forEach((row) => {
    attention.push({
      kind: 'inquiry',
      id: row.id,
      tool: 'inquiries',
      title: row.name || 'New inquiry',
      detail: row.source === 'roster' ? 'Roster' : row.source === 'journal' ? 'Journal' : 'Contact',
      at: row.submittedAt,
    });
  });
  invoices.filter((row) => ['open', 'overdue', 'uncollectible'].includes(row.status)).forEach((row) => {
    attention.push({
      kind: 'invoice',
      id: row.id,
      tool: 'purchases',
      title: row.customerName,
      detail: `${row.amountLabel} · ${row.status}`,
      at: row.dueAt || row.createdAt,
    });
  });
  subscriptions.filter((row) => row.status === 'past_due' || row.stripeStatus === 'incomplete').forEach((row) => {
    attention.push({
      kind: 'subscription',
      id: row.id,
      tool: 'subscriptions',
      title: row.customerName,
      detail: `${row.packageName} · ${row.status === 'past_due' ? 'Past due' : 'Incomplete'}`,
      at: row.nextBillAt || row.createdAt,
    });
  });
  attention.sort((a, b) => String(b.at || '').localeCompare(String(a.at || '')));
  return {
    fetchedAt: new Date().toISOString(),
    storageConfigured,
    stripeConfigured,
    inquiries,
    invoices: invoices.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    subscriptions: subscriptions.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''))),
    metrics: {
      newInquiries: inquiries.filter((row) => row.status === 'new').length,
      unpaidInvoices: invoices.filter((row) => ['open', 'overdue', 'uncollectible'].includes(row.status)).length,
      paidThisMonthCents: paidCents,
      paidThisMonthLabel: formatUsdFromCents(paidCents),
      activeSubscriptions: subscriptions.filter((row) => row.status === 'active' || row.status === 'paused').length,
    },
    attention,
  };
}

async function loadBoard(inquiryState) {
  const stripe = stripeClient();
  if (!stripe) {
    return buildBoard({
      inquiries: inquiryState.items || [],
      invoices: [],
      subscriptions: [],
      storageConfigured: Boolean(inquiryState.configured),
      stripeConfigured: false,
    });
  }
  const subscriptions = await collectSubscriptions(stripe);
  const subscriptionIds = new Set(subscriptions.map((row) => row.id));
  const invoices = await collectInvoices(stripe, subscriptionIds);
  return buildBoard({
    inquiries: inquiryState.items || [],
    invoices,
    subscriptions,
    storageConfigured: Boolean(inquiryState.configured),
    stripeConfigured: true,
  });
}

function httpError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function ownedInvoice(stripe, id) {
  const invoice = await stripe.invoices.retrieve(id);
  if (isPackageMeta(invoice.metadata)) return invoice;
  const subId = typeof invoice.subscription === 'string'
    ? invoice.subscription
    : invoice.subscription?.id || invoice.metadata?.subscription_id;
  if (subId) {
    const subscription = await stripe.subscriptions.retrieve(subId);
    if (isPackageMeta(subscription.metadata)) return invoice;
  }
  throw httpError('That invoice is not a Cochran Films package.', 404);
}

async function ownedSubscription(stripe, id) {
  const subscription = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] });
  if (!isPackageMeta(subscription.metadata)) {
    throw httpError('That subscription is not a Cochran Films package.', 404);
  }
  return subscription;
}

async function resendInvoiceEmail(stripe, invoice) {
  const full = invoice.hosted_invoice_url
    ? invoice
    : await stripe.invoices.retrieve(invoice.id);
  if (!full.hosted_invoice_url) {
    throw httpError('This invoice does not have a payment link yet.', 400);
  }
  const meta = full.metadata || {};
  const person = customerFields(full, meta);
  if (!person.customerEmail) {
    throw httpError('This invoice has no client email.', 400);
  }
  const isSubscription = Boolean(full.subscription) || meta.billing_mode === 'subscription';
  const templateId = isSubscription
    ? (process.env.EMAILJS_PACKAGE_SUBSCRIPTION_CLIENT_TEMPLATE_ID || process.env.EMAILJS_PACKAGE_TEMPLATE_ID)
    : process.env.EMAILJS_PACKAGE_TEMPLATE_ID;
  if (!templateId) throw httpError('Invoice email is not configured.', 500);
  const amount = formatUsdFromCents(full.amount_due || full.total || 0);
  await sendEmailJs(templateId, {
    to_email: person.customerEmail,
    customer_name: person.customerName,
    customer_email: person.customerEmail,
    customer_phone: person.customerPhone || 'Not provided',
    invoice_number: meta.invoice_number || full.number || full.id,
    stripe_invoice_number: full.number || '',
    subscription_name: meta.subscription_name || 'Service package',
    total_amount: amount,
    invoice_url: full.hosted_invoice_url,
    services_list: meta.services_list || '',
    email_heading: 'Your Cochran Films invoice',
    email_intro: `Your invoice for ${amount} is ready whenever you want to pay.`,
    cta_label: 'View invoice & pay',
    cta_url: full.hosted_invoice_url,
    cta_subtext: 'Secure checkout · Stripe',
    reply_to: 'info@cochranfilms.com',
  });
  return normalizeInvoice(full);
}

async function markInvoicePaid(stripe, invoice) {
  if (!['open', 'uncollectible'].includes(invoice.status)) {
    throw httpError('Only an open invoice can be marked paid.', 400);
  }
  const paid = await stripe.invoices.pay(invoice.id, { paid_out_of_band: true });
  return normalizeInvoice(paid);
}

async function voidInvoice(stripe, invoice) {
  if (!['open', 'uncollectible'].includes(invoice.status)) {
    throw httpError('Only an unpaid invoice can be voided.', 400);
  }
  const next = await stripe.invoices.voidInvoice(invoice.id);
  return normalizeInvoice(next);
}

async function refundInvoice(stripe, invoice) {
  if (invoice.status !== 'paid') throw httpError('Only a paid invoice can be refunded.', 400);
  const full = await stripe.invoices.retrieve(invoice.id, { expand: ['charge'] });
  const chargeId = typeof full.charge === 'string' ? full.charge : full.charge?.id;
  if (!chargeId) {
    throw httpError('This payment was recorded outside Stripe, so it cannot be refunded from here.', 400);
  }
  await stripe.refunds.create({ charge: chargeId });
  const refreshed = await stripe.invoices.retrieve(invoice.id);
  return normalizeInvoice(refreshed);
}

module.exports = {
  stripeClient,
  formatUsdFromCents,
  normalizeInvoice,
  normalizeSubscription,
  loadBoard,
  ownedInvoice,
  ownedSubscription,
  resendInvoiceEmail,
  markInvoicePaid,
  voidInvoice,
  refundInvoice,
};
