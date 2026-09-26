const {
  expectedEmail,
  verifyPassword,
  setSessionCookie,
  clientIp,
  loginAllowed,
  noteLoginFailure,
  clearLoginFailures,
} = require('./lib/session');

async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const ip = clientIp(req);
  if (!loginAllowed(ip)) {
    return res.status(429).json({ error: 'Too many attempts. Wait a few minutes and try again.' });
  }
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const emailOk = email === expectedEmail();
  const passwordOk = verifyPassword(password);
  if (!emailOk || !passwordOk) {
    noteLoginFailure(ip);
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  try {
    clearLoginFailures(ip);
    setSessionCookie(res, email);
    return res.status(200).json({ ok: true, email });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(err.status || 500).json({ error: 'Sign-in is not configured yet.' });
  }
}

module.exports = handler;
