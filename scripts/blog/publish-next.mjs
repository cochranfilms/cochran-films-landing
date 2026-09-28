import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { queue } from "./queue.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const blog = join(root, "public/blog");
const site = "https://www.cochranfilms.com";
const publish = process.argv.includes("--publish");
const ARROW = `<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>`;

const topics = {
  "Creator Business": "creator-business.html",
  "Systems and Automation": "systems-and-automation.html",
  "Video Production": "video-production.html",
  Podcasting: "podcasting.html",
  "Event Coverage": "event-coverage.html",
  "Web and SEO": "web-and-seo.html",
  "Atlanta production": "atlanta-production.html"
};

function esc(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function words(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/g, " ").trim().split(/\s+/).filter(Boolean);
}

function replaceOnce(html, pattern, build, label) {
  const match = html.match(pattern);
  if (!match) throw new Error(`Missing ${label}`);
  return html.replace(pattern, () => build(match));
}

function card(post) {
  return `<article class="post-card reveal" data-category="${esc(post.category)}">
  <a class="post-card-link" href="/blog/posts/${post.slug}.html">
    <div class="post-card-media">
      <img src="/blog/assets/img/covers/${post.slug}.jpg" alt="${esc(post.coverAlt)}" width="1600" height="900" loading="lazy">
    </div>
    <div class="post-card-body">
      <p class="eyebrow">${esc(post.category)}</p>
      <h2>${esc(post.title)}</h2>
      <p class="excerpt">${esc(post.excerpt)}</p>
      <p class="card-meta"><span>${post.read} min read</span><span class="read-arrow">Read ${ARROW}</span></p>
    </div>
  </a>
</article>`;
}

function featureHtml(post) {
  return `  <a class="feature-poster" data-feature data-category="${esc(post.category)}" href="/blog/posts/${post.slug}.html">
    <img src="/blog/assets/img/covers/${post.slug}.jpg" alt="${esc(post.coverAlt)}" width="1600" height="900">
    <div class="feature-shade" aria-hidden="true"></div>
    <div class="feature-copy">
      <p class="feature-kicker">Latest</p>
      <p class="eyebrow">${esc(post.category)}</p>
      <h2>${esc(post.title)}</h2>
      <p class="excerpt">${esc(post.excerpt)}</p>
      <p class="card-meta"><span>${esc(post.dateLabel)} · ${post.read} min read</span><span class="read-arrow">Read ${ARROW}</span></p>
    </div>
  </a>`;
}

function pagination(page, total) {
  const parts = [];
  if (page === 1) parts.push(`<span aria-disabled="true">Previous</span>`);
  else parts.push(`<a href="${page === 2 ? "/blog/" : `/blog/page/${page - 1}.html`}" rel="prev">Previous</a>`);
  for (let n = 1; n <= total; n += 1) {
    const href = n === 1 ? "/blog/" : `/blog/page/${n}.html`;
    parts.push(n === page ? `<a href="${href}" aria-current="page">${n}</a>` : `<a href="${href}">${n}</a>`);
  }
  if (page === total) parts.push(`<span aria-disabled="true">Next</span>`);
  else parts.push(`<a href="/blog/page/${page + 1}.html" rel="next">Next</a>`);
  return `<nav class="pagination" data-pagination aria-label="Blog pages">${parts.join("")}</nav>`;
}

function grabCards(file) {
  return [...readFileSync(file, "utf8").matchAll(/<article class="post-card reveal"[\s\S]*?<\/article>/g)].map((match) => match[0]);
}

function pageNumbers() {
  return readdirSync(join(blog, "page"))
    .filter((name) => /^\d+\.html$/.test(name))
    .map((name) => Number(name.replace(".html", "")))
    .sort((a, b) => a - b);
}

for (const item of queue) {
  const length = item.description.length;
  if (length < 145 || length > 165) throw new Error(`${item.slug} description is ${length} characters`);
}

const next = queue[0];
if (!next) {
  console.log("EMPTY");
  process.exit(0);
}

const catalog = readFileSync(join(blog, "assets/js/blog.js"), "utf8");
if (catalog.includes(`"slug":"${next.slug}"`)) throw new Error(`${next.slug} is already in the journal`);
if (!topics[next.category]) throw new Error(`No topic page for ${next.category}`);
if (!/<p>/.test(next.body)) throw new Error(`${next.slug} needs an opening paragraph`);
const descriptionLength = next.description.length;
if (descriptionLength < 145 || descriptionLength > 165) {
  throw new Error(`${next.slug} description is ${descriptionLength} characters`);
}
if (next.title.length > 70) throw new Error(`${next.slug} title is long`);
next.read = Math.max(5, Math.round(words(next.body).length / 220));
const cover = join(root, "scripts/blog/queue-covers", `${next.slug}.jpg`);
if (publish && !existsSync(cover)) throw new Error(`Missing cover ${cover}`);

const today = new Date();
const iso = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
}).format(today);
const dateLabel = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "long",
  day: "numeric",
  year: "numeric"
}).format(today);
const post = { ...next, iso, dateLabel };
const rssDate = new Date(`${iso}T13:00:00Z`).toUTCString();

console.log(`${publish ? "PUBLISH" : "DRY"} ${post.slug} · ${post.read} min · ${words(post.body).length} words · description ${descriptionLength}`);
if (!publish) process.exit(0);

copyFileSync(cover, join(blog, "assets/img/covers", `${post.slug}.jpg`));
copyFileSync(cover, join(blog, "assets/img/og", `${post.slug}.jpg`));

const sample = readFileSync(join(blog, "posts/one-cloud-for-the-whole-job.html"), "utf8");
const nav = sample.match(/<a class="skip"[\s\S]*?<\/nav>/)[0];
const footer = sample.match(/<footer class="site-footer">[\s\S]*$/)[0];
const related = post.related.map((slug) => {
  const files = [join(blog, "index.html"), ...pageNumbers().map((n) => join(blog, "page", `${n}.html`))];
  for (const file of files) {
    const html = readFileSync(file, "utf8");
    const found = html.match(new RegExp(`<article class="post-card reveal"[\\s\\S]*?href="/blog/posts/${slug}\\.html"[\\s\\S]*?</article>`));
    if (found) return found[0].replace(/<h2>/g, "<h3>").replace(/<\/h2>/g, "</h3>");
  }
  throw new Error(`Missing related card ${slug}`);
}).join("\n");

const articleJson = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "BlogPosting",
      headline: post.title,
      image: `${site}/blog/assets/img/og/${post.slug}.jpg`,
      datePublished: iso,
      dateModified: iso,
      author: {
        "@type": "Person",
        "@id": `${site}/blog/author/cody-cochran.html#person`,
        name: "Cody Cochran",
        url: `${site}/blog/author/cody-cochran.html`
      },
      publisher: { "@type": "Organization", name: "Cochran Films" },
      mainEntityOfPage: `${site}/blog/posts/${post.slug}.html`,
      description: post.description,
      articleSection: post.category
    }
  ]
};

const postHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(post.title)}</title>
  <meta name="description" content="${esc(post.description)}">
  <meta name="robots" content="index, follow">
  <link rel="alternate" type="application/rss+xml" title="Cochran Films Journal" href="${site}/blog/feed.xml">
  <link rel="canonical" href="${site}/blog/posts/${post.slug}.html">
  <meta property="og:type" content="article">
  <meta property="og:title" content="${esc(post.title)}">
  <meta property="og:description" content="${esc(post.description)}">
  <meta property="og:url" content="${site}/blog/posts/${post.slug}.html">
  <meta property="og:site_name" content="Cochran Films">
  <meta property="og:image" content="${site}/blog/assets/img/og/${post.slug}.jpg">
  <meta property="og:image:width" content="1280">
  <meta property="og:image:height" content="720">
  <meta property="og:image:alt" content="${esc(post.coverAlt)}">
  <meta property="article:published_time" content="${iso}">
  <meta property="article:modified_time" content="${iso}">
  <meta property="article:author" content="Cody Cochran">
  <meta property="article:section" content="${esc(post.category)}">
  ${post.tags.map((tag) => `<meta property="article:tag" content="${esc(tag)}">`).join("")}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(post.title)}">
  <meta name="twitter:description" content="${esc(post.description)}">
  <meta name="twitter:image" content="${site}/blog/assets/img/og/${post.slug}.jpg">
  <link rel="icon" href="/C_Logo.png">
  <meta name="theme-color" content="#0a0a0a">
  <link rel="stylesheet" href="/blog/assets/css/blog.css?v=20260925nav5">
  <script>document.documentElement.classList.add("js");</script>
</head>
<body>
${nav}
<main id="main">
  <header class="post-hero">
    <img class="post-hero-img" src="/blog/assets/img/covers/${post.slug}.jpg" alt="${esc(post.coverAlt)}" width="1600" height="900">
    <div class="post-hero-shade" aria-hidden="true"></div>
    <div class="post-hero-inner">
      <p class="eyebrow">${esc(post.category)}</p>
      <h1>${esc(post.title)}</h1>
      <p class="byline">By <a href="/blog/author/cody-cochran.html"><strong>Cody Cochran</strong></a> · ${esc(dateLabel)} · ${post.read} min read</p>
    </div>
  </header>
  <article class="article">
    ${post.body.trim()}
    <p class="tag-row">Tags: ${post.tags.map((tag) => `<span>${esc(tag)}</span>`).join(", ")}</p>
  </article>
  <aside class="cta-card">
    <div class="cta-card-inner">
      <h2>${esc(post.ctaTitle)}</h2>
      <p>${esc(post.ctaText)}</p>
      <a class="btn" href="${post.ctaHref}">${esc(post.ctaLabel)}</a>
    </div>
  </aside>
  <p class="advice-line">These are studio field notes, not tax, legal, or financial advice.</p>
  <aside class="studio-next">
    <p class="eyebrow">Cochran Films</p>
    <h2>${esc(post.studioTitle)}</h2>
    <p>${esc(post.studioText)}</p>
    <div class="actions"><a class="btn btn-ghost" href="/systems">See the systems</a><a class="btn" href="/pricing">Book Services</a></div>
  </aside>
  <section class="related" aria-labelledby="related-title">
    <h2 id="related-title">Keep reading</h2>
    <div class="post-grid">
      ${related}
    </div>
  </section>
  <div class="wrap">
    <section class="newsletter" aria-labelledby="list-title">
      <div>
        <h2 id="list-title">Join the Cochran Films list</h2>
        <p>One note when a new essay is up. Production, clients, and the systems behind the work. Unsubscribe any time from the link in the letter, or by replying.</p>
      </div>
      <form data-newsletter action="/api/contact/send-inquiry" method="post">
        <label class="visually-hidden" for="list-email-${post.slug}">Email address</label>
        <input id="list-email-${post.slug}" name="email" type="email" autocomplete="email" required placeholder="Email address">
        <button class="btn" type="submit">Join the list</button>
        <label class="consent"><input type="checkbox" name="consent" required> Send me the journal. I agree to the <a href="/privacy-policy">privacy policy</a>.</label>
        <p class="note" data-newsletter-note></p>
        <input class="hp" type="text" name="cf_leave_blank" readonly tabindex="-1" autocomplete="off" aria-hidden="true">
      </form>
    </section>
  </div>
</main>
<script type="application/ld+json">
${JSON.stringify(articleJson, null, 2)}
</script>
${footer}`;
writeFileSync(join(blog, "posts", `${post.slug}.html`), postHtml);

const indexCards = grabCards(join(blog, "index.html"));
const numbered = pageNumbers();
const rest = numbered.flatMap((n) => grabCards(join(blog, "page", `${n}.html`)));
const featureMatch = readFileSync(join(blog, "index.html"), "utf8").match(/<a class="feature-poster"[\s\S]*?<\/a>/);
if (!featureMatch) throw new Error("Missing feature poster");
const oldFeature = featureMatch[0];
const oldSlug = oldFeature.match(/\/blog\/posts\/([a-z0-9-]+)\.html/)[1];
const oldTitle = oldFeature.match(/<h2>([\s\S]*?)<\/h2>/)[1];
const oldExcerpt = oldFeature.match(/<p class="excerpt">([\s\S]*?)<\/p>/)[1];
const oldCategory = oldFeature.match(/<p class="eyebrow">([\s\S]*?)<\/p>/)[1];
const oldAlt = oldFeature.match(/alt="([^"]*)"/)[1];
const oldRead = oldFeature.match(/(\d+) min read/)[1];
const displaced = card({
  slug: oldSlug,
  title: oldTitle,
  excerpt: oldExcerpt,
  category: oldCategory,
  coverAlt: oldAlt,
  read: oldRead
});
const allCards = [displaced, ...indexCards, ...rest];
const totalPages = Math.ceil(allCards.length / 6);
const chunks = [];
for (let i = 0; i < allCards.length; i += 6) chunks.push(allCards.slice(i, i + 6));

function writeGrid(file, cards, page) {
  let html = readFileSync(file, "utf8");
  html = replaceOnce(
    html,
    /<div class="post-grid" data-post-grid>[\s\S]*?<nav class="pagination"[\s\S]*?<\/nav>/,
    () => `<div class="post-grid" data-post-grid>\n${cards.join("\n")}\n      </div>\n      ${pagination(page, totalPages)}`,
    `grid on page ${page}`
  );
  writeFileSync(file, html);
}

let index = readFileSync(join(blog, "index.html"), "utf8");
index = replaceOnce(index, /<a class="feature-poster"[\s\S]*?<\/a>/, () => featureHtml(post), "feature");
index = replaceOnce(
  index,
  /<div class="post-grid" data-post-grid>[\s\S]*?<nav class="pagination"[\s\S]*?<\/nav>/,
  () => `<div class="post-grid" data-post-grid>\n${chunks[0].join("\n")}\n      </div>\n      ${pagination(1, totalPages)}`,
  "index grid"
);
const schemaItem = `        {
          "@type": "BlogPosting",
          "headline": ${JSON.stringify(post.title)},
          "url": "${site}/blog/posts/${post.slug}.html",
          "datePublished": "${iso}"
        },
`;
index = replaceOnce(index, /"blogPost": \[\n/, () => `"blogPost": [\n${schemaItem}`, "blogPost schema");
if (totalPages > 1 && !index.includes('rel="next"')) {
  index = index.replace('<link rel="canonical" href="https://www.cochranfilms.com/blog/">', () => '<link rel="canonical" href="https://www.cochranfilms.com/blog/">\n  <link rel="next" href="https://www.cochranfilms.com/blog/page/2.html">');
}
writeFileSync(join(blog, "index.html"), index);

for (let page = 2; page <= totalPages; page += 1) {
  const file = join(blog, "page", `${page}.html`);
  if (!existsSync(file)) {
    const previous = readFileSync(join(blog, "page", `${page - 1}.html`), "utf8");
    mkdirSync(join(blog, "page"), { recursive: true });
    writeFileSync(file, previous.replaceAll(`page/${page - 1}.html`, `page/${page}.html`).replaceAll(`Page ${page - 1}`, `Page ${page}`));
  }
  writeGrid(file, chunks[page - 1], page);
}

const topicPath = join(blog, "topics", topics[post.category]);
let topic = readFileSync(topicPath, "utf8");
topic = topic.replace(/<h2 class="archive-title">(\d+) essays<\/h2>/, (_, count) => `<h2 class="archive-title">${Number(count) + 1} essays</h2>`);
topic = topic.replace('<div class="post-grid">', () => `<div class="post-grid">\n${card(post)}`);
writeFileSync(topicPath, topic);

let author = readFileSync(join(blog, "author/cody-cochran.html"), "utf8");
const latestCards = [card(post), displaced, indexCards[0]].filter(Boolean).slice(0, 3).join("\n");
author = replaceOnce(
  author,
  /(<h2 id="author-latest" class="archive-title">Latest from Cody<\/h2>\s*<div class="post-grid">)[\s\S]*?(<\/div>\s*<\/section>)/,
  (match) => `${match[1]}\n${latestCards}\n      ${match[2]}`,
  "author latest"
);
writeFileSync(join(blog, "author/cody-cochran.html"), author);

const entry = {
  slug: post.slug,
  title: post.title,
  excerpt: post.excerpt,
  category: post.category,
  read: post.read,
  coverAlt: post.coverAlt
};
let js = readFileSync(join(blog, "assets/js/blog.js"), "utf8");
js = js.replace("var posts = [", () => `var posts = [${JSON.stringify(entry)},`);
writeFileSync(join(blog, "assets/js/blog.js"), js);

const feedItem = `    <item>
      <title>${esc(post.title)}</title>
      <link>${site}/blog/posts/${post.slug}.html</link>
      <guid isPermaLink="true">${site}/blog/posts/${post.slug}.html</guid>
      <pubDate>${rssDate}</pubDate>
      <category>${esc(post.category)}</category>
      <description>${esc(post.description)}</description>
    </item>
`;
let feed = readFileSync(join(blog, "feed.xml"), "utf8");
feed = feed.replace("<item>", () => `${feedItem}    <item>`);
feed = feed.replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/, () => `<lastBuildDate>${rssDate}</lastBuildDate>`);
writeFileSync(join(blog, "feed.xml"), feed);

const mapUrl = `  <url>
    <loc>${site}/blog/posts/${post.slug}.html</loc>
    <lastmod>${iso}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;
let sitemap = readFileSync(join(root, "public/sitemap.xml"), "utf8");
sitemap = sitemap.replace(/<lastmod>[^<]*<\/lastmod>(\s*<\/url>\s*<url>\s*<loc>https:\/\/www\.cochranfilms\.com\/blog\/posts\/)/, () => `<lastmod>${iso}</lastmod>$1`);
sitemap = sitemap.replace("<loc>https://www.cochranfilms.com/blog/</loc>", () => `<loc>https://www.cochranfilms.com/blog/</loc>`);
sitemap = sitemap.replace(
  /<loc>https:\/\/www\.cochranfilms\.com\/blog\/<\/loc>\s*<lastmod>[^<]*<\/lastmod>/,
  () => `<loc>https://www.cochranfilms.com/blog/</loc>\n    <lastmod>${iso}</lastmod>`
);
sitemap = sitemap.replace(
  "<loc>https://www.cochranfilms.com/blog/posts/",
  () => `${mapUrl}  <url>\n    <loc>https://www.cochranfilms.com/blog/posts/`
);
writeFileSync(join(root, "public/sitemap.xml"), sitemap);

let home = readFileSync(join(root, "public/index.html"), "utf8");
home = replaceOnce(
  home,
  /<section class="home-journal"[\s\S]*?<\/section>/,
  () => `<section class="home-journal" aria-labelledby="home-journal-title">
        <div class="home-journal-copy">
          <p class="home-journal-kicker">The journal</p>
          <h2 id="home-journal-title">${esc(post.title)}</h2>
          <p>${esc(post.excerpt)}</p>
          <p class="home-journal-meta">Cody Cochran · ${esc(dateLabel)} · ${post.read} min</p>
          <div class="home-journal-actions">
            <a class="home-journal-btn" href="/blog/posts/${post.slug}.html">Read the essay</a>
            <a class="home-journal-text" href="/blog/">All field notes</a>
          </div>
        </div>
        <a class="home-journal-still" href="/blog/posts/${post.slug}.html">
          <img src="/blog/assets/img/covers/${post.slug}.jpg" alt="${esc(post.coverAlt)}" width="1600" height="900">
        </a>
      </section>`,
  "homepage journal"
);
writeFileSync(join(root, "public/index.html"), home);

const remaining = queue.slice(1);
writeFileSync(join(root, "scripts/blog/queue.mjs"), `export const queue = ${JSON.stringify(remaining, null, 2)};\n`);
const publicQueue = remaining.map((item) => ({
  slug: item.slug,
  title: item.title,
  description: item.description,
  excerpt: item.excerpt,
  category: item.category,
  coverAlt: item.coverAlt
}));
writeFileSync(join(root, "public/api/journal/lib/queue-public.mjs"), `export const queue = ${JSON.stringify(publicQueue, null, 2)};\n`);
console.log(`SLUG=${post.slug}`);
