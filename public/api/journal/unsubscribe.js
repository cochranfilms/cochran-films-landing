import { normalizeEmail, tokenMatches, unsubscribeSubscriber } from './lib/subscribers.js';
import { sendUnsubscribeReceipt } from './lib/issue.js';

function page(title, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="noindex">
  <title>${title}</title>
  <link rel="icon" href="/C_Logo.png">
  <link rel="stylesheet" href="/blog/assets/css/blog.css?v=20260928list">
</head>
<body>
<main id="main">
  <section class="hero">
    <div class="hero-inner">
      <p class="kicker">The journal</p>
      <h1>${title}</h1>
      <p class="promise">${message}</p>
      <p><a class="btn" href="/blog/">Back to the journal</a></p>
    </div>
  </section>
</main>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const email = normalizeEmail(req.query?.e || req.body?.e || '');
  const token = String(req.query?.t || req.body?.t || '');
  if (!email || !token) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(400).send(page('That link is incomplete.', 'Open the unsubscribe link from the latest journal letter.'));
  }
  let valid = false;
  try {
    valid = tokenMatches(email, token);
  } catch (error) {
    console.error('Unsubscribe signing failed');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(page('We could not confirm that link.', 'Write info@cochranfilms.com and we will take you off the list.'));
  }
  if (!valid) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(403).send(page('That link does not match.', 'Use the unsubscribe link from your own letter, or write info@cochranfilms.com.'));
  }
  try {
    const result = await unsubscribeSubscriber(email);
    if (!result.already) {
      try {
        await sendUnsubscribeReceipt(email);
      } catch (error) {
        console.error('Unsubscribe receipt failed');
      }
    }
  } catch (error) {
    console.error('Unsubscribe save failed');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(500).send(page('We could not update the list.', 'Write info@cochranfilms.com and we will take you off.'));
  }
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  return res.status(200).send(page(
    "You're off the list.",
    'No further essays will be sent to that address. A short confirmation is on its way. The journal stays on the site if you want to read it.'
  ));
}
