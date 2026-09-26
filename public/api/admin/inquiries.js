const { requireAdmin } = require('./lib/session');
const { updateInquiryStatus } = require('./lib/store');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return undefined;
  try {
    const result = await updateInquiryStatus(String(req.body?.id || ''), String(req.body?.status || ''));
    return res.status(200).json(result);
  } catch (err) {
    const status = err.code === 'STORE_UNCONFIGURED' ? 503 : (err.status || 500);
    return res.status(status).json({ error: err.message || 'Could not update the inquiry.' });
  }
}

module.exports = handler;
