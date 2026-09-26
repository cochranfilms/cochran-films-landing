const { requireAdmin } = require('./lib/session');
const {
  stripeClient,
  ownedInvoice,
  resendInvoiceEmail,
  markInvoicePaid,
  voidInvoice,
  refundInvoice,
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
    const invoice = await ownedInvoice(stripe, id);
    let updated;
    if (action === 'resend') updated = await resendInvoiceEmail(stripe, invoice);
    else if (action === 'mark_paid') updated = await markInvoicePaid(stripe, invoice);
    else if (action === 'void') updated = await voidInvoice(stripe, invoice);
    else if (action === 'refund') updated = await refundInvoice(stripe, invoice);
    else return res.status(400).json({ error: 'Unknown invoice action.' });
    return res.status(200).json({ invoice: updated });
  } catch (err) {
    console.error('Admin invoice action error:', err);
    return res.status(err.status || 500).json({ error: err.message || 'Could not update the invoice.' });
  }
}

module.exports = handler;
