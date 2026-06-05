import Stripe from 'stripe';
import {
  PACKAGE_SOURCE,
  buildAdminMailto,
  buildServicesHtml,
  buildServicesText,
  claimDedupeKey,
  releaseDedupeKey,
  sendEmailJs,
  setCors,
  validateServicesPayload,
} from './stripe-package-shared.js';

const DEFAULT_DAYS_UNTIL_DUE = 30;

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
    const { customer, services, invoiceNumber, total, date, projectType, eventDate } = req.body || {};

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

    const refNumber = invoiceNumber || `CF-${Date.now()}`;
    const idempotencyKey = req.headers['x-idempotency-key'] || refNumber;
    const dedupeKey = `invoice:create:${idempotencyKey}`;
    const claimed = await claimDedupeKey(dedupeKey);
    if (!claimed) {
      return res.status(409).json({
        error: 'This invoice request was already submitted. Check your email for the payment link.',
      });
    }

    let stripe;
    try {
      stripe = new Stripe(stripeSecret);
    const daysUntilDue = Number(process.env.STRIPE_INVOICE_DAYS_UNTIL_DUE) || DEFAULT_DAYS_UNTIL_DUE;

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
        description: service.duration
          ? `${service.name} — ${service.duration}`
          : service.name,
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
      await releaseDedupeKey(dedupeKey);
      return res.status(500).json({
        error: 'Invoice was created but no payment link is available. Check Stripe Dashboard.',
      });
    }

    const projectDate = date
      ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysUntilDue);
    const paymentDueDate = dueDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

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
      reply_to: customer.email.trim(),
    };

    let emailWarning = null;
    try {
      await sendEmailJs(clientTemplateId, clientEmailParams);
    } catch (emailError) {
      console.error('Client EmailJS error:', emailError);
      emailWarning = 'Invoice created; branded summary email could not be sent.';
    }

    const adminEmail = process.env.EMAILJS_ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendEmailJs(adminTemplateId, {
          ...clientEmailParams,
          to_email: adminEmail,
          email_heading: 'New Service Package Request',
          email_intro: `New package from ${customer.name.trim()} — payment pending.`,
          cta_label: `Reply to ${customer.name.trim()}`,
          cta_url: buildAdminMailto(customer.name.trim(), customer.email.trim(), refNumber),
          cta_subtext: 'Invoice created — payment pending',
          dashboard_hint: 'View in Stripe Dashboard → Invoices',
        });
      } catch (adminError) {
        console.error('Admin EmailJS error:', adminError);
      }
    }

      return res.status(200).json({
        success: true,
        invoiceId: finalized.id,
        invoiceNumber: refNumber,
        invoiceUrl,
        stripeInvoiceNumber,
        total: invoiceTotal,
        paymentDueDate,
        emailWarning,
      });
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
