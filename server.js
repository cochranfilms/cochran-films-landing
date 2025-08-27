const express = require('express');
const path = require('path');
const cors = require('cors');
const fetch = require('node-fetch');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY_HERE');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
// IMPORTANT: Stripe webhook must receive the raw body for signature verification.
// Define the webhook route BEFORE express.json() so the raw parser runs.
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here';
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      console.log('Customer email:', session.customer_details?.email);
      console.log('Amount total:', session.amount_total);
      console.log('Metadata:', session.metadata);
      break;
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
    }
    case 'payment_intent.payment_failed': {
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
    }
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// Parse JSON for all non-webhook routes
app.use(express.json());
app.use(express.static('.'));

// ======================================
// Airtable Proxy API (used by index2.html)
// ======================================
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_PORTFOLIO = process.env.AIRTABLE_BASE_PORTFOLIO || 'appjQxcRoClnZzghj';
const AIRTABLE_BASE_WEB = process.env.AIRTABLE_BASE_WEB || 'appV5l9kZ5vAxcz4e';
const AIRTABLE_BASE_PHOTOGRAPHY = process.env.AIRTABLE_BASE_PHOTOGRAPHY || 'appP1uFoRWjxPkQ5b';
const AIRTABLE_BASE_BRAND = process.env.AIRTABLE_BASE_BRAND || 'appk9HCj1kWzK1JzQ';

// ================================
// Airtable helpers and caching
// ================================
const MEMORY_CACHE = new Map();
function getCache(key) {
  const hit = MEMORY_CACHE.get(key);
  if (!hit) return null;
  const now = Date.now();
  if (hit.expiresAt && hit.expiresAt > now) return hit.value;
  MEMORY_CACHE.delete(key);
  return null;
}
function setCache(key, value, ttlMs = 60_000) {
  MEMORY_CACHE.set(key, { value, expiresAt: Date.now() + ttlMs });
}

function sanitizeUrl(value) {
  if (!value) return null;
  try {
    const u = new URL(String(value));
    return u.href;
  } catch (_) {
    return null;
  }
}

function firstAttachmentUrl(value, predicate) {
  if (!value) return null;
  if (Array.isArray(value) && value.length) {
    const file = predicate ? value.find(predicate) : value[0];
    if (file && file.url) return file.url;
  }
  if (value && value.url) return value.url;
  return null;
}

function markdownToHtml(md) {
  if (!md) return '';
  // Minimal safe conversion: paragraphs + line breaks; avoid heavy deps
  const escaped = String(md)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const withBreaks = escaped.replace(/\n\n+/g, '</p><p>').replace(/\n/g, '<br/>');
  return `<p>${withBreaks}</p>`;
}

function parseBoolean(value) {
  return value === true || String(value).toLowerCase() === 'true';
}

function applyCommonQuery(records, { page = 1, pageSize = 24, search = '', category = '', featured = '' }, { searchableFields = [], categoryField = '', featuredField = '' }) {
  let items = Array.isArray(records) ? records.slice() : [];
  const trimmedSearch = String(search || '').trim().toLowerCase();
  const trimmedCategory = String(category || '').trim();
  const filterFeatured = String(featured || '').toLowerCase() === 'true';

  if (trimmedSearch) {
    items = items.filter((it) =>
      searchableFields.some((f) => String(it[f] || '').toLowerCase().includes(trimmedSearch))
    );
  }
  if (trimmedCategory && categoryField) {
    items = items.filter((it) => String(it[categoryField] || '') === trimmedCategory);
  }
  if (filterFeatured && featuredField) {
    items = items.filter((it) => it[featuredField] === true);
  }

  const total = items.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(pageSize, 10) || 24));
  const start = (p - 1) * ps;
  const end = start + ps;
  const pageItems = items.slice(start, end);

  return { items: pageItems, page: p, pageSize: ps, total, totalPages: Math.max(1, Math.ceil(total / ps)) };
}

async function fetchAirtableAll(baseId, tableName) {
  if (!AIRTABLE_TOKEN) {
    throw new Error('Missing AIRTABLE_TOKEN (or AIRTABLE_API_KEY) environment variable');
  }
  const cacheKey = `airtable:${baseId}:${tableName}`;
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const headers = {
    Authorization: `Bearer ${AIRTABLE_TOKEN}`,
    'Content-Type': 'application/json'
  };
  let all = [];
  let offset = undefined;
  do {
    const url = new URL(baseUrl);
    url.searchParams.set('pageSize', '100');
    if (offset) url.searchParams.set('offset', offset);
    const resp = await fetch(url.href, { headers });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Airtable ${resp.status} ${resp.statusText}: ${text}`);
    }
    const data = await resp.json();
    const records = Array.isArray(data.records) ? data.records : [];
    all = all.concat(records);
    offset = data.offset;
  } while (offset);
  setCache(cacheKey, all, 60_000); // 60s TTL
  return all;
}

// ================================
// Normalizers (strict DTOs)
// ================================
function normalizePortfolio(record) {
  const f = record?.fields || {};
  const title = f['Title'] || 'Untitled';
  const descriptionHtml = markdownToHtml(f['Description'] || '');
  const category = f['Category'] || '';
  const thumb = firstAttachmentUrl(f['Thumbnail Image']) || sanitizeUrl(f['Thumbnail URL']);
  const isFeatured = parseBoolean(f['Is Featured']);
  const ownerName = f['Owner Name'] || 'Cochran Films';
  const playbackUrl = sanitizeUrl(
    f['Playback URL'] ||
    (firstAttachmentUrl(f['Video'], (a) => (a.type || '').includes('mp4')))
  );
  // video source preference per rule
  let video = null;
  if (f['Playback URL']) {
    video = { src: sanitizeUrl(f['Playback URL']), type: 'url' };
  } else {
    const mp4 = firstAttachmentUrl(f['Video'], (a) => (a.type || '').includes('mp4'));
    if (mp4) video = { src: sanitizeUrl(mp4), type: 'mp4' };
  }
  return {
    id: record.id,
    title,
    descriptionHtml,
    category,
    thumbnail: thumb ? { src: thumb, alt: title } : null,
    featured: isFeatured,
    ownerName,
    video, // { src, type: 'mp4'|'url' } or null
  };
}

function normalizeBrand(record) {
  const f = record?.fields || {};
  const title = f['Title'] || 'Untitled';
  return {
    id: record.id,
    title,
    category: f['Category'] || '',
    descriptionHtml: markdownToHtml(f['Description'] || ''),
    videoUrl: sanitizeUrl(f['Video URL']),
    logoUrl: sanitizeUrl(f['Logo URL']),
    thumbnail: sanitizeUrl(f['Thumbnail URL']) ? { src: sanitizeUrl(f['Thumbnail URL']), alt: title } : null,
    clientName: f['Client / Brand Name'] || '',
    services: f['Services'] || '',
    deliverables: f['Deliverables'] || '',
    industry: f['Industry'] || '',
    timeline: f['Timeline'] || '',
    resultsHtml: markdownToHtml(f['Results / Impact'] || ''),
    projectUrl: sanitizeUrl(f['Project URL'])
  };
}

function normalizeWeb(record) {
  const f = record?.fields || {};
  const title = f['Title'] || 'Untitled';
  return {
    id: record.id,
    title,
    descriptionHtml: markdownToHtml(f['Description'] || ''),
    category: f['Category'] || '',
    thumbnail: sanitizeUrl(f['Thumbnail Image URL']) ? { src: sanitizeUrl(f['Thumbnail Image URL']), alt: title } : null,
    featured: parseBoolean(f['Is Featured']),
    url: sanitizeUrl(f['URL']),
    techStack: f['Tech Stack'] || '',
    role: f['Role'] || '',
    clientCompany: f['Client / Company'] || '',
    timeline: f['Timeline'] || '',
    challengesHtml: markdownToHtml(f['Challenges'] || ''),
    resultsHtml: markdownToHtml(f['Results'] || '')
  };
}

function normalizePhoto(record) {
  const f = record?.fields || {};
  const url = sanitizeUrl(f['Image URL']);
  return {
    id: record.id,
    image: url ? { src: url, alt: 'Gallery image' } : null
  };
}

// ================================
// Normalized endpoints
// ================================
app.get('/api/portfolio', async (req, res) => {
  try {
    const records = await fetchAirtableAll(AIRTABLE_BASE_PORTFOLIO, 'Portfolio');
    const normalized = records.map(normalizePortfolio);
    const result = applyCommonQuery(normalized, req.query, { searchableFields: ['title', 'descriptionHtml'], categoryField: 'category', featuredField: 'featured' });
    res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    console.error('portfolio error', err);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

app.get('/api/brand', async (req, res) => {
  try {
    const records = await fetchAirtableAll(AIRTABLE_BASE_BRAND, 'Imported table');
    const normalized = records.map(normalizeBrand);
    const result = applyCommonQuery(normalized, req.query, { searchableFields: ['title', 'descriptionHtml', 'resultsHtml'], categoryField: 'category' });
    res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    console.error('brand error', err);
    res.status(500).json({ error: 'Failed to fetch brand' });
  }
});

app.get('/api/web', async (req, res) => {
  try {
    const records = await fetchAirtableAll(AIRTABLE_BASE_WEB, 'Web');
    const normalized = records.map(normalizeWeb);
    const result = applyCommonQuery(normalized, req.query, { searchableFields: ['title', 'descriptionHtml', 'techStack'], categoryField: 'category', featuredField: 'featured' });
    res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    console.error('web error', err);
    res.status(500).json({ error: 'Failed to fetch web' });
  }
});

app.get('/api/photos', async (req, res) => {
  try {
    const records = await fetchAirtableAll(AIRTABLE_BASE_PHOTOGRAPHY, 'Photos');
    const normalized = records.map(normalizePhoto);
    const result = applyCommonQuery(normalized, req.query, { searchableFields: [], categoryField: '' });
    res.set('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
    res.json(result);
  } catch (err) {
    console.error('photos error', err);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

async function fetchAirtableRecords(baseId, tableName) {
  if (!AIRTABLE_TOKEN) {
    throw new Error('Missing AIRTABLE_TOKEN (or AIRTABLE_API_KEY) environment variable');
  }

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    }
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Airtable ${resp.status} ${resp.statusText}: ${text}`);
  }
  return resp.json();
}

// Video Production
app.get('/api/airtable/video-production', async (req, res) => {
  try {
    const data = await fetchAirtableRecords(AIRTABLE_BASE_PORTFOLIO, 'Portfolio');
    res.status(200).json(data);
  } catch (err) {
    console.error('Airtable video-production error:', err);
    res.status(500).json({ error: 'Failed to fetch Airtable records', message: err.message });
  }
});

// Web Development
app.get('/api/airtable/web-development', async (req, res) => {
  try {
    const data = await fetchAirtableRecords(AIRTABLE_BASE_WEB, 'Web');
    res.status(200).json(data);
  } catch (err) {
    console.error('Airtable web-development error:', err);
    res.status(500).json({ error: 'Failed to fetch Airtable records', message: err.message });
  }
});

// Photography
app.get('/api/airtable/photography', async (req, res) => {
  try {
    const data = await fetchAirtableRecords(AIRTABLE_BASE_PHOTOGRAPHY, 'Photos');
    res.status(200).json(data);
  } catch (err) {
    console.error('Airtable photography error:', err);
    res.status(500).json({ error: 'Failed to fetch Airtable records', message: err.message });
  }
});

// Stripe checkout session endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { line_items, mode, success_url, cancel_url, metadata } = req.body;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode,
      success_url,
      cancel_url,
      metadata,
      customer_email: metadata?.customer_email,
      billing_address_collection: 'required',
      shipping_address_collection: {
        allowed_countries: ['US', 'CA'],
      },
      custom_fields: [
        {
          key: 'project_details',
          label: {
            type: 'custom',
            custom: 'Project Details (Optional)',
          },
          type: 'text',
        },
      ],
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe Invoice creation endpoint
app.post('/api/create-invoice', async (req, res) => {
  try {
    const { customer: customerInput, items, metadata } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'No invoice items provided' });
    }

    // Create or reuse customer by email
    let customerId = customerInput?.id || null;
    if (!customerId) {
      const email = (customerInput?.email || '').trim();
      const name = (customerInput?.name || '').trim();
      if (!email) return res.status(400).json({ error: 'Customer email is required' });
      const existing = await stripe.customers.list({ email, limit: 1 });
      customerId = existing?.data?.[0]?.id || (await stripe.customers.create({ email, name })).id;
    }

    // Create invoice items
    for (const it of items) {
      const unitAmount = Math.round(Number(it.price) * 100);
      await stripe.invoiceItems.create({
        customer: customerId,
        currency: 'usd',
        unit_amount: unitAmount,
        quantity: Number(it.quantity || 1),
        description: it.name || 'Service',
        metadata: { ...(metadata || {}), ...(it.metadata || {}), service_id: it.id || '' },
      });
    }

    // Create draft invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      auto_advance: true,
      collection_method: 'send_invoice',
      days_until_due: 7,
      metadata,
    });

    // Finalize to generate hosted invoice URL
    const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
    res.json({ invoiceId: finalized.id, hostedInvoiceUrl: finalized.hosted_invoice_url, status: finalized.status });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Stripe public config endpoint (exposes publishable key to client)
app.get('/api/config', (req, res) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_YOUR_PUBLISHABLE_KEY_HERE';
  res.set('Cache-Control', 'public, max-age=600');
  res.json({ publishableKey });
});

// Success page
app.get('/success.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'success.html'));
});

// Cancel page
app.get('/cancel.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'cancel.html'));
});

// Do not call app.listen() in serverless. Export the app instead.
module.exports = app;

// If executed directly, start the server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
