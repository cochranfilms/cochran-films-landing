import { createHmac, timingSafeEqual } from 'node:crypto';
import { get, put, BlobPreconditionFailedError } from '@vercel/blob';

const LIST_PATH = 'journal/subscribers.json';
const SEND_PATH = 'journal/sends.json';

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function signingSecret() {
  return process.env.JOURNAL_UNSUBSCRIBE_SECRET || process.env.EMAILJS_PRIVATE_KEY || '';
}

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function unsubscribeToken(email) {
  const secret = signingSecret();
  if (!secret) {
    const err = new Error('Unsubscribe signing is not configured.');
    err.code = 'SIGNING_UNCONFIGURED';
    throw err;
  }
  return createHmac('sha256', secret).update(normalizeEmail(email)).digest('hex').slice(0, 40);
}

export function tokenMatches(email, token) {
  const expected = unsubscribeToken(email);
  const given = String(token || '');
  const a = Buffer.from(expected);
  const b = Buffer.from(given);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function unsubscribeUrl(email) {
  const e = encodeURIComponent(normalizeEmail(email));
  const t = unsubscribeToken(email);
  return `https://www.cochranfilms.com/api/journal/unsubscribe?e=${e}&t=${t}`;
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readDoc(path, fallback) {
  if (!configured()) return { configured: false, etag: null, doc: fallback() };
  const result = await get(path, { access: 'private', useCache: false });
  if (!result || result.statusCode === 304 || !result.stream) {
    return { configured: true, etag: null, doc: fallback() };
  }
  const text = await readStream(result.stream);
  let doc = fallback();
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === 'object') doc = parsed;
  } catch (_) {
    doc = fallback();
  }
  return { configured: true, etag: result.blob?.etag || null, doc };
}

async function writeDoc(path, doc, etag) {
  const saved = await put(path, JSON.stringify(doc), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : {}),
  });
  return saved.etag;
}

async function mutate(path, fallback, mutator) {
  if (!configured()) {
    const err = new Error('Journal storage is not connected.');
    err.code = 'STORE_UNCONFIGURED';
    throw err;
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const state = await readDoc(path, fallback);
    const next = mutator(state.doc);
    try {
      await writeDoc(path, next, state.etag);
      return next;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError || err?.name === 'BlobPreconditionFailedError') continue;
      throw err;
    }
  }
  throw new Error('Could not save the journal list. Try again.');
}

function emptyList() {
  return { revision: 0, items: [] };
}

function emptySends() {
  return { issues: {} };
}

export async function listSubscribers() {
  const state = await readDoc(LIST_PATH, emptyList);
  const items = Array.isArray(state.doc.items) ? state.doc.items : [];
  return { configured: state.configured, items };
}

export async function upsertSubscriber(email) {
  const normalized = normalizeEmail(email);
  const token = unsubscribeToken(normalized);
  const now = new Date().toISOString();
  let row = null;
  let created = false;
  let reactivated = false;
  await mutate(LIST_PATH, emptyList, (current) => {
    const items = Array.isArray(current.items) ? current.items.slice() : [];
    const index = items.findIndex((item) => normalizeEmail(item.email) === normalized);
    if (index === -1) {
      row = { email: normalized, status: 'active', consentedAt: now, token, lastIssue: '' };
      items.unshift(row);
      created = true;
    } else {
      const previous = items[index];
      reactivated = previous.status !== 'active';
      row = {
        ...previous,
        email: normalized,
        status: 'active',
        token,
        consentedAt: previous.consentedAt || now,
        rejoinedAt: reactivated ? now : previous.rejoinedAt || '',
      };
      items[index] = row;
    }
    return { revision: (current.revision || 0) + 1, items };
  });
  return { row, created, reactivated };
}

export async function unsubscribeSubscriber(email) {
  const normalized = normalizeEmail(email);
  const now = new Date().toISOString();
  let row = null;
  let already = false;
  await mutate(LIST_PATH, emptyList, (current) => {
    const items = Array.isArray(current.items) ? current.items.slice() : [];
    const index = items.findIndex((item) => normalizeEmail(item.email) === normalized);
    if (index === -1) {
      row = { email: normalized, status: 'unsubscribed', consentedAt: '', token: '', unsubscribedAt: now };
      items.unshift(row);
    } else {
      already = items[index].status === 'unsubscribed';
      row = { ...items[index], status: 'unsubscribed', unsubscribedAt: items[index].unsubscribedAt || now };
      items[index] = row;
    }
    return { revision: (current.revision || 0) + 1, items };
  });
  return { row, already };
}

export async function wasSent(slug, email) {
  const state = await readDoc(SEND_PATH, emptySends);
  const issue = state.doc.issues?.[slug];
  const sent = Array.isArray(issue?.sent) ? issue.sent : [];
  return sent.includes(normalizeEmail(email));
}

export async function markSent(slug, email) {
  const normalized = normalizeEmail(email);
  await mutate(SEND_PATH, emptySends, (current) => {
    const issues = { ...(current.issues || {}) };
    const issue = issues[slug] || { sent: [], failed: 0 };
    const sent = Array.isArray(issue.sent) ? issue.sent.slice() : [];
    if (!sent.includes(normalized)) sent.push(normalized);
    issues[slug] = { ...issue, sent };
    return { issues };
  });
  const list = await listSubscribers();
  if (!list.configured) return;
  await mutate(LIST_PATH, emptyList, (current) => {
    const items = (current.items || []).map((item) => (
      normalizeEmail(item.email) === normalized ? { ...item, lastIssue: slug } : item
    ));
    return { revision: (current.revision || 0) + 1, items };
  });
}

export async function markFailed(slug) {
  await mutate(SEND_PATH, emptySends, (current) => {
    const issues = { ...(current.issues || {}) };
    const issue = issues[slug] || { sent: [], failed: 0 };
    issues[slug] = { ...issue, failed: (issue.failed || 0) + 1 };
    return { issues };
  });
}
