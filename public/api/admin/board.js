const { requireAdmin } = require('./lib/session');
const { listInquiries } = require('./lib/store');
const { loadBoard } = require('./lib/commerce');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!requireAdmin(req, res)) return undefined;
  try {
    const inquiryState = await listInquiries();
    const board = await loadBoard(inquiryState);
    return res.status(200).json(board);
  } catch (err) {
    console.error('Admin board error:', err);
    return res.status(500).json({ error: 'Could not load the dashboard.' });
  }
}

module.exports = handler;
