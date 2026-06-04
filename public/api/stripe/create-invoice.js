import Stripe from 'stripe';

const DEFAULT_DAYS_UNTIL_DUE = 30;

function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || 'https://landing.cochranfilms.com,https://www.cochranfilms.com,https://cochranfilms.com,http://localhost:3000,http://127.0.0.1:3000')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  const origin = req.headers.origin;
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    res.setHeader('Access-Control-Allow-Origin', allowed[0] || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildServicesHtml(services) {
  if (!Array.isArray(services) || services.length === 0) {
    return '<tr><td colspan="3" style="padding:12px;color:#94a3b8;">No line items</td></tr>';
  }
  return services
    .map((service) => {
      const qty = Math.max(1, Number(service.quantity) || 1);
      const unitPrice = Number(service.price) || 0;
      const lineTotal = unitPrice * qty;
      const qtyLabel = qty > 1 ? ` &times; ${qty}` : '';
      return `<tr>
        <td style="padding:14px 12px;border-bottom:1px solid rgba(148,163,184,0.15);color:#f8fafc;font-size:15px;font-weight:600;">${escapeHtml(service.name)}${qtyLabel}</td>
        <td style="padding:14px 12px;border-bottom:1px solid rgba(148,163,184,0.15);color:#94a3b8;font-size:13px;">${escapeHtml(service.duration || '')}</td>
        <td style="padding:14px 12px;border-bottom:1px solid rgba(148,163,184,0.15);color:#FFB200;font-size:15px;font-weight:700;text-align:right;white-space:nowrap;">$${lineTotal.toFixed(2)}</td>
      </tr>`;
    })
    .join('');
}

function buildServicesText(services) {
  return services
    .map((service) => {
      const qty = Math.max(1, Number(service.quantity) || 1);
      const unitPrice = Number(service.price) || 0;
      const lineTotal = unitPrice * qty;
      const qtyLabel = qty > 1 ? ` (×${qty})` : '';
      return `- ${service.name}${qtyLabel}: $${lineTotal.toFixed(2)}`;
    })
    .join('\n');
}

async function sendPackageEmail(templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const templateId = process.env.EMAILJS_PACKAGE_TEMPLATE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS package template not configured — skipping branded email');
    return { skipped: true };
  }

  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };

  if (privateKey) {
    body.accessToken = privateKey;
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS failed (${response.status}): ${text}`);
  }

  return { ok: true };
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
    const { customer, services, invoiceNumber, total, date } = req.body || {};

    if (!customer?.email || !customer?.name) {
      return res.status(400).json({ error: 'Customer name and email are required.' });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'At least one service is required.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const stripe = new Stripe(stripeSecret);
    const daysUntilDue = Number(process.env.STRIPE_INVOICE_DAYS_UNTIL_DUE) || DEFAULT_DAYS_UNTIL_DUE;
    const refNumber = invoiceNumber || `CF-${Date.now()}`;
    const computedTotal = services.reduce((sum, s) => {
      const qty = Math.max(1, Number(s.quantity) || 1);
      return sum + (Number(s.price) || 0) * qty;
    }, 0);
    const invoiceTotal = Number(total) > 0 ? Number(total) : computedTotal;

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

    const draftInvoice = await stripe.invoices.create({
      customer: stripeCustomer.id,
      collection_method: 'send_invoice',
      days_until_due: daysUntilDue,
      auto_advance: false,
      metadata: {
        invoice_number: refNumber,
        source: 'cochran-films-landing-service-builder',
      },
      description: `Cochran Films service package — ${refNumber}`,
    });

    for (const service of services) {
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

    const finalized = await stripe.invoices.finalizeInvoice(draftInvoice.id);
    const sent = await stripe.invoices.sendInvoice(finalized.id);

    const invoiceUrl = sent.hosted_invoice_url || finalized.hosted_invoice_url;
    const projectDate = date
      ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const servicesHtml = buildServicesHtml(services);
    const servicesText = buildServicesText(services);

    const clientEmailParams = {
      to_email: customer.email.trim(),
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone?.trim() || 'Not provided',
      invoice_number: refNumber,
      total_amount: `$${invoiceTotal.toFixed(2)}`,
      invoice_url: invoiceUrl,
      services_html: servicesHtml,
      services_list: servicesText,
      project_date: projectDate,
      email_heading: 'Your Project Package Is Ready',
      reply_to: customer.email.trim(),
    };

    let emailWarning = null;
    try {
      await sendPackageEmail(clientEmailParams);
    } catch (emailError) {
      console.error('Client EmailJS error:', emailError);
      emailWarning = 'Invoice created; branded summary email could not be sent.';
    }

    const adminEmail = process.env.EMAILJS_ADMIN_EMAIL;
    if (adminEmail) {
      try {
        await sendPackageEmail({
          ...clientEmailParams,
          to_email: adminEmail,
          email_heading: 'New Service Package Request',
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
      stripeInvoiceNumber: finalized.number,
      total: invoiceTotal,
      emailWarning,
    });
  } catch (error) {
    console.error('Stripe invoice error:', error);
    const message =
      error?.type === 'StripeInvalidRequestError'
        ? error.message
        : 'Failed to create invoice. Please try again or contact us directly.';
    return res.status(500).json({ error: message });
  }
}
