const Stripe = require('stripe');
const {
  PACKAGE_SOURCE,
  addMonthsUnix,
  analyzePackageServices,
  buildAdminMailto,
  buildRetainerBillingNote,
  buildServicesHtml,
  buildServicesText,
  createRetainerFirstInvoice,
  ensureSubscriptionInvoiceReady,
  cacheInvoiceCreateResult,
  claimDedupeKey,
  formatCommitmentTerm,
  formatDateFromUnix,
  formatLongDate,
  getCachedInvoiceCreateResult,
  parseBillingAnchorUnix,
  releaseDedupeKey,
  sendEmailJs,
  setCors,
  validateServicesPayload,
} = require('./stripe-package-shared');

const DEFAULT_DAYS_UNTIL_DUE = 30;

async function ensureStripeCustomer(stripe, customer) {
  const existingCustomers = await stripe.customers.list({
    email: customer.email.trim().toLowerCase(),
    limit: 1,
  });

  let stripeCustomer = existingCustomers.data[0];
  if (!stripeCustomer) {
    stripeCustomer = await stripe.customers.create({
      email: customer.email.trim(),
      name: customer.name.trim(),
      phone: customer.phone?.trim() || undefined,
      metadata: { source: 'service-package-builder' },
    });
  } else if (customer.name || customer.phone) {
    stripeCustomer = await stripe.customers.update(stripeCustomer.id, {
      name: customer.name?.trim() || stripeCustomer.name,
      phone: customer.phone?.trim() || stripeCustomer.phone,
    });
  }

  return stripeCustomer;
}

async function sendPackageEmails({
  clientTemplateId,
  adminTemplateId,
  clientEmailParams,
  customer,
  refNumber,
  isSubscription,
}) {
  let emailWarning = null;
  try {
    await sendEmailJs(clientTemplateId, clientEmailParams);
  } catch (emailError) {
    console.error('Client EmailJS error:', emailError);
    emailWarning = isSubscription
      ? 'Subscription created; branded summary email could not be sent.'
      : 'Invoice created; branded summary email could not be sent.';
  }

  let adminEmailWarning = null;
  const adminEmail = process.env.EMAILJS_ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('EMAILJS_ADMIN_EMAIL is not configured — admin notification skipped');
    adminEmailWarning = 'Admin notification email is not configured on the server.';
  } else {
    try {
      const adminResult = await sendEmailJs(adminTemplateId, {
        ...clientEmailParams,
        to_email: adminEmail,
        reply_to: customer.email.trim(),
        email_heading: isSubscription ? 'New Retainer Subscription' : 'New Service Package Request',
        email_intro: isSubscription
          ? `New retainer from ${customer.name.trim()} — first invoice pending.`
          : `New package from ${customer.name.trim()} — payment pending.`,
        cta_label: `Reply to ${customer.name.trim()}`,
        cta_url: buildAdminMailto(customer.name.trim(), customer.email.trim(), refNumber),
        cta_subtext: isSubscription ? 'Subscription created — first invoice pending' : 'Invoice created — payment pending',
        dashboard_hint: isSubscription
          ? 'View in Stripe Dashboard → Subscriptions'
          : 'View in Stripe Dashboard → Invoices',
      });
      if (adminResult?.skipped) {
        adminEmailWarning = 'Admin notification could not be sent (EmailJS not fully configured).';
      }
    } catch (adminError) {
      console.error('Admin EmailJS error:', adminError);
      adminEmailWarning = isSubscription
        ? 'Subscription created; admin notification email could not be sent.'
        : 'Invoice created; admin notification email could not be sent.';
    }
  }

  return { emailWarning, adminEmailWarning };
}

async function createOneTimeInvoice(stripe, {
  customer,
  normalizedServices,
  refNumber,
  invoiceTotal,
  daysUntilDue,
  projectType,
  eventDate,
  date,
}) {
  const stripeCustomer = await ensureStripeCustomer(stripe, customer);
  const servicesText = buildServicesText(normalizedServices);
  const servicesTextTruncated =
    servicesText.length > 450 ? `${servicesText.slice(0, 447)}...` : servicesText;

  const draftInvoice = await stripe.invoices.create({
    customer: stripeCustomer.id,
    collection_method: 'send_invoice',
    days_until_due: daysUntilDue,
    auto_advance: false,
    metadata: {
      invoice_number: refNumber,
      source: PACKAGE_SOURCE,
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone?.trim() || 'Not provided',
      services_list: servicesTextTruncated,
      project_type: projectType?.trim() || '',
      event_date: eventDate?.trim() || '',
    },
    description: `Cochran Films service package — ${refNumber}`,
  });

  for (const service of normalizedServices) {
    const qty = Math.max(1, Number(service.quantity) || 1);
    const unitPrice = Number(service.price) || 0;
    const amountCents = Math.round(unitPrice * 100);

    await stripe.invoiceItems.create({
      customer: stripeCustomer.id,
      invoice: draftInvoice.id,
      description: service.duration ? `${service.name} — ${service.duration}` : service.name,
      quantity: qty,
      unit_amount: amountCents,
      currency: 'usd',
    });
  }

  const finalized = await stripe.invoices.finalizeInvoice(draftInvoice.id, {
    auto_advance: false,
  });

  const invoiceUrl = finalized.hosted_invoice_url;
  if (!invoiceUrl) {
    return { error: 'Invoice was created but no payment link is available. Check Stripe Dashboard.' };
  }

  const projectDate = formatLongDate(date);
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + daysUntilDue);
  const paymentDueDate = formatLongDate(dueDate);
  const servicesHtml = buildServicesHtml(normalizedServices);
  const stripeInvoiceNumber = finalized.number || '';

  const clientTemplateId = process.env.EMAILJS_PACKAGE_TEMPLATE_ID;
  const adminTemplateId =
    process.env.EMAILJS_PACKAGE_ADMIN_TEMPLATE_ID || process.env.EMAILJS_PACKAGE_TEMPLATE_ID;

  const clientEmailParams = {
    to_email: customer.email.trim(),
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone?.trim() || 'Not provided',
    invoice_number: refNumber,
    stripe_invoice_number: stripeInvoiceNumber,
    total_amount: `$${invoiceTotal.toFixed(2)}`,
    invoice_url: invoiceUrl,
    services_html: servicesHtml,
    services_list: servicesText,
    project_date: projectDate,
    payment_due_date: paymentDueDate,
    email_heading: 'Your Project Package Is Ready',
    email_intro:
      'Thank you for choosing Cochran Films. Your custom service package is summarized below. When you are ready, use the button to open your secure invoice and complete payment.',
    reply_to: customer.email.trim(),
    cta_label: 'View invoice & pay',
    cta_url: invoiceUrl,
    cta_subtext: 'Secure checkout · Stripe',
  };

  const { emailWarning, adminEmailWarning } = await sendPackageEmails({
    clientTemplateId,
    adminTemplateId,
    clientEmailParams,
    customer,
    refNumber,
    isSubscription: false,
  });

  return {
    success: true,
    billingMode: 'one_time',
    invoiceId: finalized.id,
    invoiceNumber: refNumber,
    invoiceUrl,
    stripeInvoiceNumber,
    total: invoiceTotal,
    paymentDueDate,
    emailWarning,
    adminEmailWarning,
  };
}

async function createRetainerSubscription(stripe, {
  customer,
  normalizedServices,
  refNumber,
  invoiceTotal,
  daysUntilDue,
  projectType,
  eventDate,
  date,
  billingStartDate,
  packageAnalysis,
}) {
  const stripeCustomer = await ensureStripeCustomer(stripe, customer);
  const { catalog, priceId, commitmentMonths, line } = packageAnalysis;

  const servicesText = buildServicesText(normalizedServices);
  const servicesTextTruncated =
    servicesText.length > 450 ? `${servicesText.slice(0, 447)}...` : servicesText;

  const nowUnix = Math.floor(Date.now() / 1000);
  const billingAnchorUnix = parseBillingAnchorUnix({ billingStartDate, eventDate, date });
  const useFutureAnchor = billingAnchorUnix > nowUnix + 3600;
  const billingStartLabel = useFutureAnchor
    ? formatLongDate(billingStartDate || eventDate || date)
    : null;
  const cancelAt = addMonthsUnix(useFutureAnchor ? billingAnchorUnix : nowUnix, commitmentMonths);

  const subscriptionMetadata = {
    invoice_number: refNumber,
    source: PACKAGE_SOURCE,
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone?.trim() || 'Not provided',
    services_list: servicesTextTruncated,
    project_type: projectType?.trim() || '',
    event_date: eventDate?.trim() || '',
    catalog_id: line.id,
    subscription_name: catalog.name,
    commitment_months: String(commitmentMonths),
    billing_mode: 'subscription',
    ...(billingStartLabel ? { billing_start_date: billingStartLabel } : {}),
  };

  const subscriptionParams = {
    customer: stripeCustomer.id,
    items: [{ price: priceId }],
    collection_method: 'send_invoice',
    days_until_due: daysUntilDue,
    proration_behavior: 'none',
    cancel_at: cancelAt,
    metadata: subscriptionMetadata,
  };

  if (useFutureAnchor) {
    // First renewal one month after the chosen start date (first invoice is created manually below).
    subscriptionParams.billing_cycle_anchor = addMonthsUnix(billingAnchorUnix, 1);
  } else {
    subscriptionParams.expand = ['latest_invoice'];
  }

  const subscription = await stripe.subscriptions.create(subscriptionParams);

  const invoiceMetadata = {
    ...subscriptionMetadata,
    subscription_id: subscription.id,
    invoice_role: useFutureAnchor ? 'retainer_first_period' : 'subscription_initial',
  };

  let invoice;
  let invoiceError = null;

  if (useFutureAnchor) {
    const daysUntilFirstDue = Math.max(1, Math.ceil((billingAnchorUnix - nowUnix) / 86400));
    try {
      invoice = await createRetainerFirstInvoice(stripe, {
        customerId: stripeCustomer.id,
        priceId,
        catalogName: catalog.name,
        refNumber,
        daysUntilDue: daysUntilFirstDue,
        metadata: invoiceMetadata,
      });
    } catch (err) {
      invoiceError = err.message || 'Could not create the first retainer invoice.';
    }
  } else {
    const result = await ensureSubscriptionInvoiceReady(stripe, subscription, invoiceMetadata);
    invoice = result.invoice;
    invoiceError = result.error;
  }

  const invoiceUrl = invoice?.hosted_invoice_url;
  if (!invoiceUrl) {
    return {
      error:
        invoiceError ||
        'Subscription was created but no payment link is available. Check Stripe Dashboard → Invoices for a draft invoice.',
      subscriptionId: subscription.id,
    };
  }

  const projectDate = formatLongDate(billingStartDate || eventDate || date);
  const paymentDueDate = invoice.due_date
    ? formatDateFromUnix(invoice.due_date)
    : formatLongDate(new Date(Date.now() + daysUntilDue * 86400000));
  const nextBillingDate = subscription.current_period_end
    ? formatDateFromUnix(subscription.current_period_end)
    : '';
  const servicesHtml = buildServicesHtml(normalizedServices);
  const stripeInvoiceNumber = invoice.number || '';
  const commitmentTerm = formatCommitmentTerm(commitmentMonths);
  const billingNote = buildRetainerBillingNote(commitmentMonths, billingStartLabel);

  const clientTemplateId =
    process.env.EMAILJS_PACKAGE_SUBSCRIPTION_CLIENT_TEMPLATE_ID ||
    process.env.EMAILJS_PACKAGE_TEMPLATE_ID;
  const adminTemplateId =
    process.env.EMAILJS_PACKAGE_SUBSCRIPTION_ADMIN_TEMPLATE_ID ||
    process.env.EMAILJS_PACKAGE_ADMIN_TEMPLATE_ID ||
    clientTemplateId;

  const clientEmailParams = {
    to_email: customer.email.trim(),
    customer_name: customer.name.trim(),
    customer_email: customer.email.trim(),
    customer_phone: customer.phone?.trim() || 'Not provided',
    invoice_number: refNumber,
    stripe_invoice_number: stripeInvoiceNumber,
    subscription_id: subscription.id,
    subscription_name: catalog.name,
    commitment_term: commitmentTerm,
    next_billing_date: nextBillingDate,
    billing_note: billingNote,
    total_amount: `$${invoiceTotal.toFixed(2)}`,
    invoice_url: invoiceUrl,
    services_html: servicesHtml,
    services_list: servicesText,
    project_date: projectDate,
    payment_due_date: paymentDueDate,
    email_heading: useFutureAnchor ? 'Your Retainer Is Scheduled' : 'Your Monthly Retainer Is Ready',
    email_intro: useFutureAnchor
      ? `Thank you for choosing Cochran Films. Your retainer begins ${billingStartLabel}. Your first monthly invoice is below — pay by ${paymentDueDate} to secure your package. Renewals will bill on the same date each month through your commitment term.`
      : 'Thank you for choosing Cochran Films. Your monthly content retainer is summarized below. Open your secure invoice to activate your package — you will be billed on the same date each month through your commitment term.',
    reply_to: customer.email.trim(),
    cta_label: 'View invoice & pay',
    cta_url: invoiceUrl,
    cta_subtext: 'Monthly retainer · Secure checkout via Stripe',
  };

  const { emailWarning, adminEmailWarning } = await sendPackageEmails({
    clientTemplateId,
    adminTemplateId,
    clientEmailParams,
    customer,
    refNumber,
    isSubscription: true,
  });

  return {
    success: true,
    billingMode: 'subscription',
    subscriptionId: subscription.id,
    invoiceId: invoice.id,
    invoiceNumber: refNumber,
    invoiceUrl,
    stripeInvoiceNumber,
    total: invoiceTotal,
    paymentDueDate,
    nextBillingDate,
    commitmentTerm,
    emailWarning,
    adminEmailWarning,
  };
}

export default async function handler(req, res) {
  setCors(req, res);

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecret) {
    console.error('STRIPE_SECRET_KEY is not configured');
    return res.status(500).json({ error: 'Payment system is not configured. Please contact Cochran Films.' });
  }

  try {
    const { customer, services, invoiceNumber, total, date, projectType, eventDate, billingStartDate } =
      req.body || {};

    if (!customer?.email || !customer?.name) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const validation = validateServicesPayload(services);
    if (!validation.ok) {
      return res.status(400).json({ error: validation.error });
    }

    const normalizedServices = validation.services;
    const computedTotal = validation.computedTotal;
    const clientTotal = Number(total);
    if (clientTotal > 0 && Math.abs(clientTotal - computedTotal) > 0.02) {
      return res.status(400).json({ error: 'Package total does not match catalog pricing. Please refresh and try again.' });
    }
    const invoiceTotal = computedTotal;

    const packageAnalysis = analyzePackageServices(normalizedServices);
    if (packageAnalysis.ok === false) {
      return res.status(400).json({ error: packageAnalysis.error });
    }

    const refNumber = invoiceNumber || `CF-${Date.now()}`;
    const idempotencyKey = req.headers['x-idempotency-key'] || refNumber;
    const dedupeKey = `invoice:create:${idempotencyKey}`;
    const claimed = await claimDedupeKey(dedupeKey);
    if (!claimed) {
      const cached = getCachedInvoiceCreateResult(dedupeKey);
      if (cached?.invoiceUrl) {
        return res.status(200).json({ ...cached, duplicate: true });
      }
      return res.status(409).json({
        error: 'This invoice request is already being processed. Please wait a moment and check your email.',
        retryable: true,
      });
    }

    let stripe;
    try {
      stripe = new Stripe(stripeSecret);
      const daysUntilDue = Number(process.env.STRIPE_INVOICE_DAYS_UNTIL_DUE) || DEFAULT_DAYS_UNTIL_DUE;

      const successPayload =
        packageAnalysis.mode === 'subscription'
          ? await createRetainerSubscription(stripe, {
              customer,
              normalizedServices,
              refNumber,
              invoiceTotal,
              daysUntilDue,
              projectType,
              eventDate,
              date,
              billingStartDate,
              packageAnalysis,
            })
          : await createOneTimeInvoice(stripe, {
              customer,
              normalizedServices,
              refNumber,
              invoiceTotal,
              daysUntilDue,
              projectType,
              eventDate,
              date,
            });

      if (successPayload.error) {
        await releaseDedupeKey(dedupeKey);
        return res.status(500).json({ error: successPayload.error });
      }

      cacheInvoiceCreateResult(dedupeKey, successPayload);
      return res.status(200).json(successPayload);
    } catch (innerError) {
      await releaseDedupeKey(dedupeKey);
      throw innerError;
    }
  } catch (error) {
    console.error('Stripe invoice error:', error);
    const message =
      error?.type === 'StripeInvalidRequestError'
        ? error.message
        : 'Failed to create invoice. Please try again or contact us directly.';
    return res.status(500).json({ error: message });
  }
}
