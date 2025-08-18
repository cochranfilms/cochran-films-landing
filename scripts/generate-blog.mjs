import fs from 'fs/promises';
import path from 'path';
import RSSParser from 'rss-parser';

const rssParser = new RSSParser({ timeout: 15000, customFields: { item: [ ['content:encoded', 'contentEncoded'], ['media:content', 'mediaContent'] ] } });

const OUTPUT_FILE = path.resolve(process.cwd(), 'blog', 'posts.json');
const POSTS_DIR = path.resolve(process.cwd(), 'blog', 'post');
const SITE_BASE_URL = process.env.SITE_BASE_URL || 'https://landing.cochranfilms.com';
const PUBLISHER_NAME = 'Cochran Films';
const PUBLISHER_LOGO = 'CF_Logo_White2025.png';

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

function toYyyyMmDd(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

function slugify(input) {
  return String(input || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Build a safe, extended excerpt from the original article HTML
function buildExcerptHtml(rawHtml, sourceUrl) {
  if (!rawHtml) return '';
  let html = String(rawHtml);

  // Strip unsafe tags
  html = html.replace(/<script[\s\S]*?<\/script>/gi, '')
             .replace(/<style[\s\S]*?<\/style>/gi, '')
             .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  // Absolutize relative URLs
  html = html.replace(/\s(href|src)=("|')([^"']+)(\2)/gi, (m, attr, q, url, q2) => {
    try {
      const absolute = new URL(url, sourceUrl).href;
      return ` ${attr}=${q}${absolute}${q2}`;
    } catch {
      return m;
    }
  });

  // Safer links and images
  html = html.replace(/<a\s/gi, '<a rel="nofollow noopener" target="_blank" ')
             .replace(/<img\s/gi, '<img loading="lazy" style="max-width:100%;height:auto;border-radius:8px;" ');

  // Heuristic: take first 5 paragraphs; include first list if present
  const parts = html.split(/<\/p>/i);
  const excerptParts = parts.slice(0, 5).map(p => (p.includes('<p') ? `${p}</p>` : (p.trim() ? `<p>${p}</p>` : '')));
  const list = html.match(/<(ul|ol)[\s\S]*?<\/(ul|ol)>/i);
  if (list) excerptParts.push(list[0]);

  let excerpt = excerptParts.join('\n');
  if (excerpt.length > 5000) excerpt = excerpt.slice(0, 5000) + '…';
  return excerpt;
}

function buildPostHtml(post) {
  const {
    title,
    summary,
    image,
    video,
    url: sourceUrl,
    publishedAt,
    category,
    tags = [],
    slug
  } = post;

  const canonical = `${SITE_BASE_URL}/blog/post/${slug}.html`;
  const metaTitle = post.metaTitle || `${title} | ${PUBLISHER_NAME} Daily Brief`;
  const metaDescription = post.metaDescription || summary;
  const keywords = tags.join(', ');

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: metaDescription,
    datePublished: publishedAt,
    dateModified: publishedAt,
    mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: PUBLISHER_NAME },
    publisher: {
      '@type': 'Organization',
      name: PUBLISHER_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_BASE_URL}/${PUBLISHER_LOGO}` }
    },
    image: image ? [image] : undefined,
    url: canonical,
    isBasedOn: sourceUrl,
    articleSection: category,
    keywords
  };

  const excerptHtml = buildExcerptHtml(post.contentHtml || '', sourceUrl);
  const hostname = getHostname(sourceUrl);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(metaTitle)}</title>
  <meta name="description" content="${escapeHtml(metaDescription)}" />
  ${keywords ? `<meta name="keywords" content="${escapeHtml(keywords)}" />` : ''}
  <link rel="canonical" href="${canonical}" />

  <meta property="og:type" content="article" />
  <meta property="og:title" content="${escapeHtml(metaTitle)}" />
  <meta property="og:description" content="${escapeHtml(metaDescription)}" />
  <meta property="og:url" content="${canonical}" />
  ${image ? `<meta property="og:image" content="${image}" />` : ''}

  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${escapeHtml(metaTitle)}" />
  <meta name="twitter:description" content="${escapeHtml(metaDescription)}" />
  ${image ? `<meta name="twitter:image" content="${image}" />` : ''}

  <script type="application/ld+json">${JSON.stringify(schema)}</script>

  <link rel="stylesheet" href="../../css/base.css">
  <link rel="stylesheet" href="../../css/navigation.css">
  <link rel="stylesheet" href="../../css/responsive.css">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css">
</head>
<body>
  <script>window.__MODULES_BASE_PATH__='../../';</script>
  <div id="navigation-module"></div>
  <main class="wrapper" style="padding-top: 100px; padding-bottom: 80px;">
    <article class="blog-card" style="max-width: 900px; margin: 0 auto;">
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">${new Date(publishedAt).toLocaleString()}${category ? ` • ${escapeHtml(category)}` : ''}</div>
      ${image ? `<div style="margin: 12px 0 16px 0;"><img src="${image}" alt="${escapeHtml(title)}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"></div>` : ''}
      ${video ? `<div style=\"margin: 12px 0 16px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;\"><iframe src=\"${video}\" title=\"${escapeHtml(title)}\" frameborder=\"0\" allowfullscreen style=\"position:absolute;top:0;left:0;width:100%;height:100%;\"></iframe></div>` : ''}
      <div class="excerpt">${excerptHtml || `<p>${escapeHtml(summary)}</p>`}</div>
      <p style="margin-top: 16px;">
        <a class="read-more" href="${sourceUrl}" target="_blank" rel="noopener nofollow">Continue reading on ${escapeHtml(hostname)}</a>
      </p>
      <div style="margin-top:12px; color: var(--text-muted); font-size: 0.95rem;">
        ${tags.length ? `<div style=\"margin-bottom:6px;\">Tags: ${tags.map(t => `#${escapeHtml(t)}`).join(' ')}</div>` : ''}
        <div>Credit: Source — ${escapeHtml(hostname)} • Curated by Cochran Films Daily Brief</div>
      </div>
      <p style="margin-top: 12px;"><a href="/blog.html">← Back to Blog</a></p>
    </article>
    <section id="related-posts" style="max-width: 900px; margin: 24px auto 0;"></section>
  </main>
  <script src="../../js/modules.js"></script>
  <script>
  (function(){
    try {
      var slug = ${JSON.stringify(slug)};
      fetch('/blog/posts.json?r=' + Date.now())
        .then(function(r){ return r.json(); })
        .then(function(list){
          if(!Array.isArray(list)) return;
          var current = list.find(function(p){ return p.slug === slug; });
          var cat = current && current.category || '';
          var related = list.filter(function(p){ return p.slug !== slug && (p.category === cat || p.source === current.source); }).slice(0, 3);
          if(!related.length) return;
          var sec = document.getElementById('related-posts');
          if(!sec) return;
          var cards = related.map(function(p){
            var href = '/blog/post/' + p.slug + '.html';
            var dateStr = p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            return '<article class="blog-card" style="margin-top:12px;">\n' +
                   '  <h2 style="margin:0 0 6px 0;font-size:1.05rem;">' + (p.title || '') + '</h2>\n' +
                   '  <div class="meta">' + dateStr + (p.category ? ' • ' + p.category : '') + '</div>\n' +
                   '  <p style="margin:8px 0 10px 0;">' + (p.summary || '') + '</p>\n' +
                   '  <a class="read-more" href="' + href + '">Open post</a>\n' +
                   '</article>';
          }).join('');
          sec.innerHTML = '<h3 style="margin:8px 0 12px 0;">Related reads</h3>' + cards;
        });
    } catch(e) { console.warn(e); }
  })();
  </script>
</body>
</html>`;
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
      const tags = Array.isArray(item.categories) && item.categories.length ? item.categories.map(c => String(c)) : [];
      return {
        title: item.title || 'Untitled',
        url: link,
        publishedAt: publishedAt ? publishedAt.toISOString() : null,
        source: getHostname(link) || (feed.title || '').trim(),
        category,
        summary: summary.length > 360 ? `${summary.slice(0, 357)}...` : summary,
        image,
        video,
        tags,
        contentHtml,
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

  await fs.mkdir(POSTS_DIR, { recursive: true });
  for (const post of deduped) {
    const datePart = toYyyyMmDd(post.publishedAt);
    const baseSlug = slugify(`${datePart}-${post.title}`);
    post.slug = baseSlug || slugify(`${datePart}-${post.source}`) || String(Date.now());
    post.metaTitle = `${post.title} | ${PUBLISHER_NAME} Daily Brief`;
    post.metaDescription = post.summary;
    const html = buildPostHtml(post);
    const filePath = path.join(POSTS_DIR, `${post.slug}.html`);
    await fs.writeFile(filePath, html);
  }

  const pretty = JSON.stringify(deduped, null, 2);
  await fs.writeFile(OUTPUT_FILE, pretty);

  console.log(`Wrote ${deduped.length} posts to ${OUTPUT_FILE}`);
}

generate().catch((err) => {
  console.error('Generation failed:', err);
  process.exitCode = 1;
});


