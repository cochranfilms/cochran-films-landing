const express = require('express');
const path = require('path');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_YOUR_SECRET_KEY_HERE');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ======================================
// Airtable Proxy API (used by index2.html)
// ======================================
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN || process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_PORTFOLIO = process.env.AIRTABLE_BASE_PORTFOLIO || 'appjQxcRoClnZzghj';
const AIRTABLE_BASE_WEB = process.env.AIRTABLE_BASE_WEB || 'appV5l9kZ5vAxcz4e';
const AIRTABLE_BASE_PHOTOGRAPHY = process.env.AIRTABLE_BASE_PHOTOGRAPHY || 'appP1uFoRWjxPkQ5b';

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

// Stripe webhook endpoint for handling successful payments
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_your_webhook_secret_here'; // You'll get this from Stripe Dashboard

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful for session:', session.id);
      console.log('Customer email:', session.customer_details?.email);
      console.log('Amount total:', session.amount_total);
      console.log('Metadata:', session.metadata);
      
      // Here you can:
      // 1. Send confirmation email to customer
      // 2. Update your database
      // 3. Create project tickets
      // 4. Notify your team
      break;
      
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      console.log('Payment succeeded:', paymentIntent.id);
      break;
      
    case 'payment_intent.payment_failed':
      const failedPayment = event.data.object;
      console.log('Payment failed:', failedPayment.id);
      break;
      
    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
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
