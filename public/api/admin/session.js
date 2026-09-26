const { readSession } = require('./lib/session');

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const session = readSession(req);
  if (!session) return res.status(401).json({ error: 'Sign in required.' });
  return res.status(200).json({ ok: true, email: session.email });
}

module.exports = handler;
