import { latestIssue, assertIssueLive, sendJournalIssue } from '../../public/api/journal/lib/issue.js';
import { listSubscribers, markFailed, markSent, normalizeEmail, wasSent } from '../../public/api/journal/lib/subscribers.js';

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const issue = await latestIssue();
await assertIssueLive(issue);
const list = await listSubscribers();
if (!list.configured) {
  console.error('Journal storage is not connected.');
  process.exit(1);
}
const readers = [];
const seen = new Set();
for (const row of list.items) {
  const email = normalizeEmail(row.email);
  if (!email || row.status !== 'active' || seen.has(email)) continue;
  seen.add(email);
  readers.push(email);
}
let sent = 0;
let skipped = 0;
let failed = 0;
for (const email of readers) {
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
    try { await markFailed(issue.slug); } catch (_) { /* keep going */ }
    console.error('Send failed');
  }
  await pause(400);
}
console.log(`Journal issue ${issue.slug}: sent ${sent}, skipped ${skipped}, failed ${failed}, readers ${readers.length}`);
if (failed) process.exit(1);
