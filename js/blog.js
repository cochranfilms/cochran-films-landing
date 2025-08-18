// Simple blog renderer that reads from /blog/posts.json
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('blog-posts');
  if (!container) return;

  const fallback = (message) => {
    container.innerHTML = `
      <div class="blog-card">
        <h2>Nothing here yet</h2>
        <p class="meta">Daily posts will appear once the scheduler is configured.</p>
        <p style="color: var(--text-muted);">${message || ''}</p>
      </div>
    `;
  };

  try {
    const ts = Date.now();
    const response = await fetch(`blog/posts.json?ts=${ts}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const posts = await response.json();

    if (!Array.isArray(posts) || posts.length === 0) {
      fallback('No posts have been generated yet.');
      return;
    }

    const html = posts.map((post) => {
      const title = post.title || 'Untitled';
      const summary = post.summary || '';
      const category = post.category || 'general';
      const source = post.source || '';
      const url = post.url || '#';
      const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
      const dateStr = publishedAt ? publishedAt.toLocaleString() : '';
      const image = post.image || '';
      const video = post.video || '';

      const slug = post.slug;
      const hasSeoPage = Boolean(slug);
      const internalUrl = hasSeoPage ? `blog/post/${slug}.html` : url;

      return `
        <article class="blog-card">
          <h2>${title}</h2>
          <div class="meta">${dateStr}${category ? ` • ${category}` : ''}${source ? ` • ${source}` : ''}</div>
          ${image ? `<div style="margin: 8px 0 12px 0;"><img src="${image}" alt="${title}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"></div>` : ''}
          ${video ? `<div style="margin: 8px 0 12px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"><iframe src="${video}" title="${title}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>` : ''}
          <p>${summary}</p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
            <a class="read-more" href="${internalUrl}" ${hasSeoPage ? '' : 'target="_blank" rel="noopener"'}>Open post</a>
            <a class="read-more" href="${url}" target="_blank" rel="noopener">Read source</a>
            <a class="read-more" href="/index2.html#home">Home</a>
          </div>
        </article>
      `;
    }).join('');

    container.innerHTML = html;
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    fallback('Failed to load posts.');
  }
});


