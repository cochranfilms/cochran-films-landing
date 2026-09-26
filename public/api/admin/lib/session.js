const crypto = require('crypto');

const COOKIE = 'cf_admin_session';
const MAX_AGE_SEC = 7 * 24 * 60 * 60;
const SCRYPT = { N: 16384, r: 8, p: 1 };

function expectedEmail() {
  return String(process.env.ADMIN_EMAIL || 'info@cochranfilms.com').trim().toLowerCase();
}

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const out = {};
  header.split(';').forEach((part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(value);
  });
  return out;
}

function sign(payload) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    const err = new Error('Admin session is not configured.');
    err.status = 500;
    throw err;
  }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

function readSession(req) {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const raw = parseCookies(req)[COOKIE];
  if (!raw || !raw.includes('.')) return null;
  const body = raw.slice(0, raw.lastIndexOf('.'));
  const mac = raw.slice(raw.lastIndexOf('.') + 1);
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url');
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
  } catch (_) {
    return null;
  }
  if (!payload || payload.email !== expectedEmail()) return null;
  if (!payload.exp || payload.exp < Date.now()) return null;
  return payload;
}

function verifyPassword(password) {
  const stored = String(process.env.ADMIN_PASSWORD_HASH || '');
  const parts = stored.split(':');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  let salt;
  let expected;
  try {
    salt = Buffer.from(parts[1], 'hex');
    expected = Buffer.from(parts[2], 'hex');
  } catch (_) {
    return false;
  }
  if (!salt.length || !expected.length) return false;
  const actual = crypto.scryptSync(String(password || ''), salt, expected.length, SCRYPT);
  if (actual.length !== expected.length) return false;
  return crypto.timingSafeEqual(actual, expected);
}

function cookieHeader(token, maxAge) {
  const parts = [
    `${COOKIE}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  const secure = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function setSessionCookie(res, email) {
  const token = sign({ email, exp: Date.now() + MAX_AGE_SEC * 1000 });
  res.setHeader('Set-Cookie', cookieHeader(token, MAX_AGE_SEC));
}

function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

function requireAdmin(req, res) {
  const session = readSession(req);
  if (!session) {
    res.status(401).json({ error: 'Sign in required.' });
    return null;
  }
  return session;
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) return forwarded.split(',')[0].trim();
  return req.socket?.remoteAddress || 'local';
}

const attempts = new Map();

function loginAllowed(ip) {
  const now = Date.now();
  const row = attempts.get(ip);
  if (!row || row.reset < now) return true;
  return row.count < 8;
}

function noteLoginFailure(ip) {
  const now = Date.now();
  const row = attempts.get(ip);
  if (!row || row.reset < now) {
    attempts.set(ip, { count: 1, reset: now + 10 * 60 * 1000 });
    return;
  }
  row.count += 1;
}

function clearLoginFailures(ip) {
  attempts.delete(ip);
}

module.exports = {
  expectedEmail,
  verifyPassword,
  setSessionCookie,
  clearSessionCookie,
  requireAdmin,
  readSession,
  clientIp,
  loginAllowed,
  noteLoginFailure,
  clearLoginFailures,
};
