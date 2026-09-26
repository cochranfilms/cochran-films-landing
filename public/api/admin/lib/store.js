const { get, put, BlobPreconditionFailedError } = require('@vercel/blob');

const PATH = 'admin/inquiries.json';
const MAX_ITEMS = 500;

function emptyDoc() {
  return { revision: 0, items: [] };
}

function configured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function readStream(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readState() {
  if (!configured()) {
    return { configured: false, etag: null, doc: emptyDoc() };
  }
  const result = await get(PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode === 304 || !result.stream) {
    return { configured: true, etag: null, doc: emptyDoc() };
  }
  const text = await readStream(result.stream);
  let doc = emptyDoc();
  try {
    const parsed = JSON.parse(text);
    if (parsed && Array.isArray(parsed.items)) doc = parsed;
  } catch (_) {
    doc = emptyDoc();
  }
  return { configured: true, etag: result.blob?.etag || null, doc };
}

async function writeDoc(doc, etag) {
  const saved = await put(PATH, JSON.stringify(doc), {
    access: 'private',
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: 'application/json',
    cacheControlMaxAge: 60,
    ...(etag ? { ifMatch: etag } : {}),
  });
  return saved.etag;
}

async function mutate(mutator) {
  if (!configured()) {
    const err = new Error('Inquiry storage is not connected.');
    err.code = 'STORE_UNCONFIGURED';
    throw err;
  }
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const state = await readState();
    const next = mutator({
      revision: state.doc.revision || 0,
      items: Array.isArray(state.doc.items) ? state.doc.items.slice() : [],
    });
    next.revision = (state.doc.revision || 0) + 1;
    if (next.items.length > MAX_ITEMS) next.items = next.items.slice(0, MAX_ITEMS);
    try {
      await writeDoc(next, state.etag);
      return next;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError || err?.name === 'BlobPreconditionFailedError') {
        continue;
      }
      throw err;
    }
  }
  throw new Error('Could not save inquiries. Try again.');
}

async function listInquiries() {
  const state = await readState();
  return {
    configured: state.configured,
    items: state.doc.items || [],
  };
}

async function appendInquiry(item) {
  if (!configured()) return { stored: false };
  const doc = await mutate((current) => {
    const items = current.items.filter((row) => row.id !== item.id);
    items.unshift(item);
    return { revision: current.revision, items };
  });
  return { stored: true, items: doc.items };
}

async function updateInquiryStatus(id, status) {
  const allowed = new Set(['new', 'reviewed', 'closed', 'spam']);
  if (!allowed.has(status)) {
    const err = new Error('Choose a valid status.');
    err.status = 400;
    throw err;
  }
  let updated = null;
  const doc = await mutate((current) => {
    const items = current.items.map((row) => {
      if (row.id !== id) return row;
      updated = { ...row, status, updatedAt: new Date().toISOString() };
      return updated;
    });
    return { revision: current.revision, items };
  });
  if (!updated) {
    const err = new Error('Inquiry not found.');
    err.status = 404;
    throw err;
  }
  return { item: updated, items: doc.items };
}

module.exports = {
  listInquiries,
  appendInquiry,
  updateInquiryStatus,
};
