const serviceCatalog = require('../../data/services-catalog.json');

const PACKAGE_SOURCE = 'cochran-films-landing-service-builder';

const DEFAULT_ALLOWED_ORIGINS =
  'https://www.cochranfilms.com,https://cochranfilms.com,https://landing.cochranfilms.com,http://localhost:3000,http://127.0.0.1:3000';

function setCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS)
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Idempotency-Key');
}

function formatUsdFromCents(cents) {
  const dollars = (Number(cents) || 0) / 100;
  return dollars.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
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
    return '<tr><td colspan="3" style="padding:14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#6b7280;">No line items</td></tr>';
  }
  return services
    .map((service) => {
      const qty = Math.max(1, Number(service.quantity) || 1);
      const unitPrice = Number(service.price) || 0;
      const lineTotal = unitPrice * qty;
      const qtyLabel = qty > 1 ? ` &times; ${qty}` : '';
      return `<tr>
        <td width="42%" bgcolor="#ffffff" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background-color:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;line-height:1.4;">${escapeHtml(service.name)}${qtyLabel}</td>
        <td width="38%" bgcolor="#ffffff" style="padding:14px 12px;border-bottom:1px solid #e2e8f0;background-color:#ffffff;color:#6b7280;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.45;">${escapeHtml(service.duration || '')}</td>
        <td width="20%" align="right" bgcolor="#ffffff" style="padding:14px 16px;border-bottom:1px solid #e2e8f0;background-color:#ffffff;color:#111827;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;">$${lineTotal.toFixed(2)}</td>
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

function getServiceCatalog() {
  return serviceCatalog;
}

function formatLongDate(value) {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) {
    return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

function formatDateFromUnix(unixSeconds) {
  return formatLongDate(unixSeconds ? unixSeconds * 1000 : Date.now());
}

function formatCommitmentTerm(months) {
  const n = Number(months) || 1;
  return n === 1 ? '1 month' : `${n} months`;
}

function resolveStripePriceId(catalogDef) {
  const key = catalogDef?.billing?.envPriceKey;
  if (!key) return null;
  const priceId = process.env[key];
  if (!priceId || priceId.includes('price_xxx')) return null;
  return priceId;
}

function parseBillingAnchorUnix({ billingStartDate, eventDate, date } = {}) {
  const raw = billingStartDate || eventDate || date;
  const nowUnix = Math.floor(Date.now() / 1000);
  if (!raw) return nowUnix;

  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return nowUnix;

  d.setHours(12, 0, 0, 0);
  const anchor = Math.floor(d.getTime() / 1000);
  if (anchor < nowUnix - 86400) return nowUnix;
  return anchor;
}

function addMonthsUnix(unixSeconds, months) {
  const d = new Date(unixSeconds * 1000);
  d.setMonth(d.getMonth() + Number(months) || 0);
  return Math.floor(d.getTime() / 1000);
}

function analyzePackageServices(normalizedServices) {
  const catalog = getServiceCatalog();
  const subscriptionLines = [];
  const otherLines = [];

  for (const line of normalizedServices) {
    const def = catalog[line.id];
    if (def?.billing?.type === 'subscription') {
      subscriptionLines.push({ ...line, catalog: def });
    } else {
      otherLines.push(line);
    }
  }

  if (subscriptionLines.length === 0) {
    return { mode: 'one_time' };
  }

  if (otherLines.length > 0) {
    return {
      ok: false,
      error:
        'Monthly retainers must be checked out alone. Remove other services from your package, or choose one-time services only.',
    };
  }

  if (subscriptionLines.length > 1) {
    return {
      ok: false,
      error: 'Please select only one monthly retainer package per checkout.',
    };
  }

  const line = subscriptionLines[0];
  if (line.quantity !== 1) {
    return {
      ok: false,
      error: `${line.name} must be purchased as a single retainer package.`,
    };
  }

  const priceId = resolveStripePriceId(line.catalog);
  if (!priceId) {
    return {
      ok: false,
      error: 'Retainer billing is not configured on the server. Please contact Cochran Films.',
    };
  }

  return {
    mode: 'subscription',
    line,
    catalog: line.catalog,
    priceId,
    commitmentMonths: Number(line.catalog.billing.commitmentMonths) || 1,
  };
}

function buildRetainerBillingNote(commitmentMonths) {
  const term = formatCommitmentTerm(commitmentMonths);
  return `Billed monthly on the same date each month for your ${term} commitment. After that, your subscription ends automatically unless we renew together.`;
}

function validateServicesPayload(services) {
  if (!Array.isArray(services) || services.length === 0) {
    return { ok: false, error: 'At least one service is required.' };
  }

  const catalog = getServiceCatalog();
  let computedTotal = 0;
  const normalized = [];

  for (const line of services) {
    const id = line.id || line.serviceId;
    if (!id) {
      return { ok: false, error: 'Each service must include an id.' };
    }
    const def = catalog[id];
    if (!def) {
      return { ok: false, error: `Unknown service: ${id}` };
    }

    const qty = Math.max(1, Number(line.quantity) || 1);
    const unitPrice = Number(line.price) || 0;

    if (def.hourly) {
      const expectedRate = Number(def.hourlyRate ?? def.price);
      const maxHours = Number(def.maxHours) || 24;
      if (unitPrice !== expectedRate) {
        return { ok: false, error: `Invalid hourly rate for ${def.name}.` };
      }
      if (qty > maxHours) {
        return { ok: false, error: `Hours exceed maximum (${maxHours}) for ${def.name}.` };
      }
      computedTotal += expectedRate * qty;
      normalized.push({
        id,
        name: def.name,
        price: expectedRate,
        duration: line.duration || `${qty} hour${qty === 1 ? '' : 's'}`,
        quantity: qty,
      });
    } else {
      if (def.billing?.type === 'subscription' && qty !== 1) {
        return { ok: false, error: `${def.name} must be purchased as a single retainer package.` };
      }
      if (unitPrice !== Number(def.price)) {
        return { ok: false, error: `Invalid price for ${def.name}.` };
      }
      computedTotal += def.price * qty;
      normalized.push({
        id,
        name: def.name,
        price: def.price,
        duration: line.duration || def.duration,
        quantity: qty,
      });
    }
  }

  return { ok: true, computedTotal, services: normalized };
}

async function sendEmailJs(templateId, templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;

  if (!serviceId || !templateId || !publicKey) {
    console.warn('EmailJS not fully configured — skipping send', { templateId });
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

function buildAdminMailto(customerName, customerEmail, invoiceNumber) {
  const subject = encodeURIComponent(`Re: Cochran Films package ${invoiceNumber}`);
  const body = encodeURIComponent(
    `Hi ${customerName},\n\nThank you for your service package request (${invoiceNumber}).\n\n`
  );
  return `mailto:${customerEmail}?subject=${subject}&body=${body}`;
}

const memoryDedupe = new Set();
const DEDUPE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
const memoryDedupeExpiry = new Map();
const invoiceCreateResults = new Map();

function normalizeDedupeKey(key) {
  return key.startsWith('webhook:') || key.startsWith('invoice:') ? key : `dedupe:${key}`;
}

function pruneExpiredDedupeKeys() {
  const now = Date.now();
  for (const [fullKey, expiresAt] of memoryDedupeExpiry) {
    if (expiresAt <= now) {
      memoryDedupe.delete(fullKey);
      memoryDedupeExpiry.delete(fullKey);
      invoiceCreateResults.delete(fullKey);
    }
  }
}

function cacheInvoiceCreateResult(key, result) {
  const fullKey = normalizeDedupeKey(key);
  pruneExpiredDedupeKeys();
  invoiceCreateResults.set(fullKey, result);
}

function getCachedInvoiceCreateResult(key) {
  const fullKey = normalizeDedupeKey(key);
  pruneExpiredDedupeKeys();
  return invoiceCreateResults.get(fullKey) || null;
}

async function claimDedupeKey(key) {
  const fullKey = normalizeDedupeKey(key);
  pruneExpiredDedupeKeys();
  if (memoryDedupe.has(fullKey)) return false;
  memoryDedupe.add(fullKey);
  memoryDedupeExpiry.set(fullKey, Date.now() + DEDUPE_TTL_MS);
  return true;
}

async function releaseDedupeKey(key) {
  const fullKey = normalizeDedupeKey(key);
  memoryDedupe.delete(fullKey);
  memoryDedupeExpiry.delete(fullKey);
  invoiceCreateResults.delete(fullKey);
}

async function readRawBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = {
  PACKAGE_SOURCE,
  DEFAULT_ALLOWED_ORIGINS,
  setCors,
  formatUsdFromCents,
  formatLongDate,
  formatDateFromUnix,
  formatCommitmentTerm,
  buildServicesHtml,
  buildServicesText,
  analyzePackageServices,
  buildRetainerBillingNote,
  parseBillingAnchorUnix,
  addMonthsUnix,
  validateServicesPayload,
  sendEmailJs,
  buildAdminMailto,
  claimDedupeKey,
  releaseDedupeKey,
  cacheInvoiceCreateResult,
  getCachedInvoiceCreateResult,
  readRawBody,
};
