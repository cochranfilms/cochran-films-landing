const { requireAdmin } = require('./lib/session');
const {
  stripeClient,
  ownedSubscription,
  ownedInvoice,
  normalizeSubscription,
  resendInvoiceEmail,
  markInvoicePaid,
} = require('./lib/commerce');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return undefined;
  const stripe = stripeClient();
  if (!stripe) return res.status(503).json({ error: 'Stripe is not configured.' });
  const id = String(req.body?.id || '');
  const action = String(req.body?.action || '');
  try {
    const subscription = await ownedSubscription(stripe, id);
    if (subscription.status === 'canceled' && action !== 'resend') {
      return res.status(400).json({ error: 'This subscription has already ended.' });
    }

    if (action === 'pause') {
      const next = await stripe.subscriptions.update(id, {
        pause_collection: { behavior: 'keep_as_draft' },
        expand: ['latest_invoice'],
      });
      return res.status(200).json({ subscription: normalizeSubscription(next) });
    }

    if (action === 'resume') {
      const next = await stripe.subscriptions.update(id, {
        pause_collection: '',
        expand: ['latest_invoice'],
      });
      return res.status(200).json({ subscription: normalizeSubscription(next) });
    }

    if (action === 'cancel_now') {
      const next = await stripe.subscriptions.cancel(id, { expand: ['latest_invoice'] });
      return res.status(200).json({ subscription: normalizeSubscription(next) });
    }

    const latestId = typeof subscription.latest_invoice === 'string'
      ? subscription.latest_invoice
      : subscription.latest_invoice?.id;
    if (!latestId) return res.status(400).json({ error: 'This subscription has no invoice yet.' });
    const invoice = await ownedInvoice(stripe, latestId);

    if (action === 'resend') {
      await resendInvoiceEmail(stripe, invoice);
    } else if (action === 'mark_paid') {
      await markInvoicePaid(stripe, invoice);
    } else {
      return res.status(400).json({ error: 'Unknown subscription action.' });
    }

    const refreshed = await stripe.subscriptions.retrieve(id, { expand: ['latest_invoice'] });
    return res.status(200).json({ subscription: normalizeSubscription(refreshed) });
  } catch (err) {
    console.error('Admin subscription action error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Could not update the subscription.' });
  }
}

module.exports = handler;
