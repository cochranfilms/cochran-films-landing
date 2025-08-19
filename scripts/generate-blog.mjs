import fs from 'fs/promises';
import path from 'path';
import RSSParser from 'rss-parser';

const rssParser = new RSSParser({ timeout: 15000, customFields: { item: [ ['content:encoded', 'contentEncoded'], ['media:content', 'mediaContent'] ] } });

const OUTPUT_FILE = path.resolve(process.cwd(), 'blog', 'posts.json');

// Curated sources per category (stable RSS feeds)
const SOURCES = {
  production: [
    'https://nofilmschool.com/rss.xml',
    'https://www.studiobinder.com/blog/feed/',
  ],
  web: [
    'https://www.smashingmagazine.com/feed/',
    'https://web.dev/feed.xml',
    'https://dev.to/feed/tag/webdev',
  ],
  brand: [
    'https://www.brandingmag.com/feed/',
    'https://www.underconsideration.com/brandnew/rss2.php',
  ],
  photography: [
    'https://petapixel.com/feed/',
    'https://fstoppers.com/feed',
  ],
};

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

function extractFirstImageFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src=["']([^"'>]+)["'][^>]*>/i);
  return match ? match[1] : null;
}

function extractEnclosureImage(item) {
  // rss-parser maps enclosure as item.enclosure?.url
  if (item && item.enclosure && item.enclosure.url) return item.enclosure.url;
  // media:content might appear in extensions
  const media = item.mediaContent;
  if (media && typeof media === 'object' && media.$ && media.$.url) return media.$.url;
  return null;
}

function extractFirstIframeSrcFromHtml(html) {
  if (!html) return null;
  const match = html.match(/<iframe[^>]+src=["']([^"'>]+)["'][^>]*><\/iframe>/i);
  return match ? match[1] : null;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return ''; }
}

async function fetchFeed(url, category) {
  try {
    const feed = await rssParser.parseURL(url);
    return (feed.items || []).map((item) => {
      const publishedAt = toDate(item.isoDate || item.pubDate);
      const contentHtml = item.contentEncoded || item['content:encoded'] || item.content || '';
      const summary = stripHtml(item.contentSnippet || item.summary || contentHtml);
      const imageFromEnclosure = extractEnclosureImage(item);
      const imageFromHtml = extractFirstImageFromHtml(contentHtml);
      const image = imageFromEnclosure || imageFromHtml || null;
      const video = extractFirstIframeSrcFromHtml(contentHtml);
      const link = item.link || '';
      return {
        title: item.title || 'Untitled',
        url: link,
        publishedAt: publishedAt ? publishedAt.toISOString() : null,
        source: getHostname(link) || (feed.title || '').trim(),
        category,
        summary: summary.length > 360 ? `${summary.slice(0, 357)}...` : summary,
        image,
        video,
      };
    });
  } catch (error) {
    console.warn(`Feed failed (${category}): ${url} →`, error.message);
    return [];
  }
}

async function generate() {
  // Optional time guard to run only at 12:00 in a specific timezone
  if (process.env.ENFORCE_LOCAL_NOON === 'true') {
    try {
      const tz = process.env.TIMEZONE || 'America/New_York';
      const fmt = new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: tz });
      const parts = fmt.formatToParts(new Date());
      const hourPart = parts.find(p => p.type === 'hour');
      const hour = hourPart ? parseInt(hourPart.value, 10) : -1;
      if (hour !== 12) {
        console.log(`Skipping generation. Current hour in ${tz} is ${hour}, not 12.`);
        return;
      }
    } catch (e) {
      console.warn('Timezone check failed, proceeding anyway:', e.message);
    }
  }

  const allEntries = [];

  for (const [category, feeds] of Object.entries(SOURCES)) {
    for (const feedUrl of feeds) {
      // Small stagger to be polite
      /* eslint-disable no-await-in-loop */
      const items = await fetchFeed(feedUrl, category);
      allEntries.push(...items);
      /* eslint-enable no-await-in-loop */
    }
  }

  // Dedupe by URL
  const dedupedMap = new Map();
  for (const item of allEntries) {
    if (!item.url) continue;
    if (!dedupedMap.has(item.url)) dedupedMap.set(item.url, item);
  }

  const deduped = Array.from(dedupedMap.values())
    .filter(p => p.publishedAt)
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    .slice(0, 36);

  const pretty = JSON.stringify(deduped, null, 2);
  await fs.writeFile(OUTPUT_FILE, pretty);

  console.log(`Wrote ${deduped.length} posts to ${OUTPUT_FILE}`);
}

generate().catch((err) => {
  console.error('Generation failed:', err);
  process.exitCode = 1;
});


