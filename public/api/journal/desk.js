import { createRequire } from 'node:module';
import { assertIssueLive, latestIssue, sendJournalIssue } from './lib/issue.js';
import { queue } from './lib/queue-public.mjs';
import {
  listIssueSends,
  listSubscribers,
  markFailed,
  markSent,
  normalizeEmail,
  publicSubscriber,
  unsubscribeSubscriber,
  upsertSubscriber,
  wasSent,
} from './lib/subscribers.js';

const require = createRequire(import.meta.url);
const { requireAdmin, expectedEmail } = require('../admin/lib/session.js');

function fail(res, error) {
  const status = error.status || (error.code === 'STORE_UNCONFIGURED' ? 503 : 500);
  return res.status(status).json({ error: error.message || 'The journal desk could not finish that.' });
}

async function snapshot() {
  const list = await listSubscribers();
  const items = list.items.map(publicSubscriber);
  const active = items.filter((row) => row.status === 'active').length;
  return {
    configured: list.configured,
    publishReady: Boolean(process.env.JOURNAL_GITHUB_TOKEN),
    counts: {
      active,
      unsubscribed: items.length - active,
      waiting: queue.length,
    },
    subscribers: items,
    sends: await listIssueSends(),
    queue,
  };
}

async function sendCurrentIssue(email) {
  const issue = await latestIssue();
  await assertIssueLive(issue);
  const already = await wasSent(issue.slug, email);
  if (!already) {
    await sendJournalIssue(email, issue);
    await markSent(issue.slug, email);
  }
  return { slug: issue.slug, already };
}

async function sendToList() {
  const issue = await latestIssue();
  await assertIssueLive(issue);
  const list = await listSubscribers();
  if (!list.configured) {
    const err = new Error('Journal storage is not connected.');
    err.status = 503;
    throw err;
  }
  const seen = new Set();
  let sent = 0;
  let skipped = 0;
  let failed = 0;
  for (const row of list.items) {
    const email = normalizeEmail(row.email);
    if (!email || row.status !== 'active' || seen.has(email)) continue;
    seen.add(email);
    if (await wasSent(issue.slug, email)) {
      skipped += 1;
      continue;
    }
    try {
      await sendJournalIssue(email, issue);
      await markSent(issue.slug, email);
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error('Journal send failed');
      try { await markFailed(issue.slug); } catch (markError) { console.error('Journal failure was not recorded'); }
    }
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  return { slug: issue.slug, sent, skipped, failed, readers: seen.size };
}

async function publishNext() {
  const token = process.env.JOURNAL_GITHUB_TOKEN;
  if (!token) {
    const err = new Error('Add JOURNAL_GITHUB_TOKEN on Vercel to publish from this dashboard. Sending the current letter still works.');
    err.status = 503;
    throw err;
  }
  const response = await fetch('https://api.github.com/repos/cochranfilms/cochran-films-landing/actions/workflows/journal-publish.yml/dispatches', {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    body: JSON.stringify({ ref: 'main' }),
  });
  if (!response.ok) {
    const err = new Error(`GitHub did not start the publisher (${response.status}).`);
    err.status = 502;
    throw err;
  }
  return { started: true };
}

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return undefined;
  try {
    if (req.method === 'GET') {
      return res.status(200).json(await snapshot());
    }
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return res.status(405).json({ error: 'Method not allowed' });
    }
    const action = String(req.body?.action || '');
    const email = normalizeEmail(req.body?.email || '');
    if (action === 'add') {
      if (!email) return res.status(400).json({ error: 'Add an email address.' });
      const saved = await upsertSubscriber(email);
      let welcome = null;
      if (req.body?.welcome && (saved.created || saved.reactivated)) {
        welcome = await sendCurrentIssue(email);
      }
      return res.status(200).json({ ...(await snapshot()), welcome });
    }
    if (action === 'remove') {
      if (!email) return res.status(400).json({ error: 'Choose a reader.' });
      await unsubscribeSubscriber(email);
      return res.status(200).json(await snapshot());
    }
    if (action === 'test') {
      const result = await sendCurrentIssue(expectedEmail());
      return res.status(200).json({ ...(await snapshot()), test: result });
    }
    if (action === 'send') {
      const result = await sendToList();
      return res.status(200).json({ ...(await snapshot()), delivery: result });
    }
    if (action === 'publish') {
      const result = await publishNext();
      return res.status(200).json({ ...(await snapshot()), publish: result });
    }
    return res.status(400).json({ error: 'Unknown journal action.' });
  } catch (error) {
    return fail(res, error);
  }
}
