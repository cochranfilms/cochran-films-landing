// Vercel serverless — fetch live homepage hero data for portfolio site previews
export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
  let siteUrl;

  try {
    siteUrl = new URL(rawUrl);
  } catch {
    return res.status(400).json({ ok: false, error: 'Invalid url parameter' });
  }

  if (!['http:', 'https:'].includes(siteUrl.protocol)) {
    return res.status(400).json({ ok: false, error: 'Invalid protocol' });
  }

  try {
    const response = await fetch(siteUrl.href, {
      headers: {
        'User-Agent': 'CochranFilmsSitePreview/1.0',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return res.status(502).json({ ok: false, error: `Upstream returned ${response.status}` });
    }

    const html = await response.text();
    const preview = parseSitePreview(html, siteUrl);

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json({ ok: true, ...preview });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message || 'Failed to fetch site preview' });
  }
}

function decodeHtml(text) {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeHtml(
    html
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<[^>]+>/g, ' ')
  ).replace(/\s+([.,!?;:])/g, '$1');
}

function parseSitePreview(html, siteUrl) {
  const base = siteUrl.origin;

  let heroImage = null;
  const landingHeroPattern = /(?:%2F|\/)Landing-Hero\.(?:jpe?g|webp|png)/i;
  if (landingHeroPattern.test(html)) {
    heroImage = `${base}/Landing-Hero.jpeg`;
  }

  const nextImage = html.match(/\/_next\/image\?url=([^"&]+)/i)?.[1];
  if (!heroImage && nextImage) {
    const decoded = decodeURIComponent(nextImage.replace(/&amp;/g, '&'));
    if (/Landing-Hero/i.test(decoded)) {
      heroImage = `${base}/Landing-Hero.jpeg`;
    } else {
      heroImage = decoded.startsWith('http') ? decoded : new URL(decoded, base).href;
    }
  }

  const ogImage = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  if (!heroImage && ogImage) {
    heroImage = ogImage.startsWith('http') ? ogImage : new URL(ogImage, base).href;
  }

  const headlineBlock = html.match(/class=["']landing-hero-headline["'][^>]*>([\s\S]*?)<\/h1>/i);
  const headline = headlineBlock ? stripTags(headlineBlock[1]) : '';

  const subhead = decodeHtml(
    html.match(/class=["']landing-hero-subhead["'][^>]*>([^<]+)/i)?.[1] || ''
  );

  const primaryCta =
    html.match(/>\s*View membership\s*</i) ? 'View membership' : '';
  const secondaryCta =
    html.match(/>\s*Start your opportunity\s*</i) ? 'Start your opportunity' : '';
  const loginText = decodeHtml(
    html.match(/>\s*(Already a member\?[^<]{0,40})\s*</i)?.[1] || 'Already a member? Log in'
  );

  return {
    url: siteUrl.href,
    heroImage,
    headline,
    subhead,
    primaryCta,
    secondaryCta,
    loginText,
    fetchedAt: new Date().toISOString(),
  };
}
