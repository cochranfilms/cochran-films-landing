import { unsubscribeUrl } from './subscribers.js';

const site = 'https://www.cochranfilms.com';

function plainParagraph(html) {
  const article = html.split('<article class="article">')[1] || '';
  const match = article.match(/<p>([\s\S]*?)<\/p>/);
  if (!match) return '';
  const text = match[1]
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 420) return text;
  const cut = text.slice(0, 420);
  const sentence = cut.match(/^[\s\S]*[.!?](?=\s|$)/);
  return (sentence ? sentence[0] : cut).trim();
}

async function loadCatalog() {
  const response = await fetch(`${site}/blog/assets/js/blog.js`, { cache: 'no-store' });
  if (!response.ok) throw new Error('Journal catalog is not live.');
  const source = await response.text();
  const match = source.match(/var posts = (\[[\s\S]*?\]);/);
  if (!match) throw new Error('Journal catalog is missing.');
  return JSON.parse(match[1]);
}

function issueDate(iso) {
  const [year, month, day] = String(iso || '').split('-').map(Number);
  const date = year ? new Date(Date.UTC(year, month - 1, day)) : new Date();
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function publishedDate(html) {
  const match = html.match(/article:published_time" content="([^"]+)"/);
  return match ? match[1] : '';
}

export async function latestIssue() {
  const posts = (await loadCatalog()).slice(0, 2);
  if (posts.length < 2) throw new Error('The journal needs two essays before a letter can go out.');
  const params = {};
  const pages = [];
  for (const post of posts) {
    const response = await fetch(`${site}/blog/posts/${post.slug}.html`, { cache: 'no-store' });
    if (!response.ok) throw new Error('A journal essay is not live.');
    pages.push(await response.text());
  }
  posts.forEach((post, index) => {
    const n = index + 1;
    const html = pages[index];
    const opening = plainParagraph(html) || post.excerpt;
    params[`post_${n}_title`] = post.title;
    params[`post_${n}_category`] = post.category;
    params[`post_${n}_excerpt`] = opening;
    params[`post_${n}_url`] = `${site}/blog/posts/${post.slug}.html`;
    params[`post_${n}_image`] = `${site}/blog/assets/img/covers/${post.slug}.jpg`;
    params[`post_${n}_alt`] = post.coverAlt;
    params[`post_${n}_read`] = String(post.read);
  });
  const lead = posts[0];
  params.issue_date = issueDate(publishedDate(pages[0]));
  return { slug: lead.slug, params, posts };
}

export async function assertIssueLive(issue) {
  const urls = [
    issue.params.post_1_url,
    issue.params.post_1_image,
    issue.params.post_2_image,
  ];
  for (const url of urls) {
    const response = await fetch(url, { method: 'GET', redirect: 'follow', cache: 'no-store' });
    if (!response.ok) {
      const err = new Error(`Journal asset is not live (${response.status}).`);
      err.url = url;
      throw err;
    }
  }
}

export async function sendEmail(templateId, templateParams) {
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  if (!serviceId || !templateId || !publicKey) {
    throw new Error('EmailJS is not configured for the journal.');
  }
  const body = {
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: templateParams,
  };
  if (privateKey) body.accessToken = privateKey;
  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`EmailJS failed (${response.status}): ${text}`);
  }
}

export function issueParamsFor(email, issue) {
  return {
    ...issue.params,
    to_email: email,
    unsubscribe_url: unsubscribeUrl(email),
  };
}

export async function sendJournalIssue(email, issue) {
  const templateId = process.env.EMAILJS_JOURNAL_TEMPLATE_ID;
  if (!templateId) throw new Error('EMAILJS_JOURNAL_TEMPLATE_ID is not configured.');
  await sendEmail(templateId, issueParamsFor(email, issue));
}

export async function sendUnsubscribeReceipt(email) {
  const templateId = process.env.EMAILJS_JOURNAL_UNSUBSCRIBE_TEMPLATE_ID;
  if (!templateId) throw new Error('EMAILJS_JOURNAL_UNSUBSCRIBE_TEMPLATE_ID is not configured.');
  const when = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
  await sendEmail(templateId, {
    to_email: email,
    subscriber_email: email,
    unsubscribed_date: when,
    journal_url: 'https://www.cochranfilms.com/blog/',
  });
}
