document.addEventListener('DOMContentLoaded', async () => {
  const el = document.getElementById('post');
  if (!el) return;

  function computeIdFromUrl(url) {
    try { return btoa(url).replace(/=+$/,''); } catch { return String(Math.abs(hashCode(url))); }
  }
  function hashCode(str) { let h=0; for (let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0;} return h; }
  function getFavorites(){ try { return JSON.parse(localStorage.getItem('cf_blog_favorites')||'[]'); } catch { return []; } }
  function setFavorites(ids){ localStorage.setItem('cf_blog_favorites', JSON.stringify(Array.from(new Set(ids)))); }
  function isFavorited(id){ return getFavorites().includes(id); }

  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  if (!id) { el.innerHTML = '<p class="meta">Missing article id.</p>'; return; }

  try {
    const ts = Date.now();
    const resp = await fetch(`blog/posts.json?ts=${ts}`, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const posts = await resp.json();
    const map = new Map(posts.map(p => [computeIdFromUrl(p.url||''), p]));
    const post = map.get(id);
    if (!post) { el.innerHTML = '<p class="meta">Article not found.</p>'; return; }

    const title = post.title || 'Untitled';
    const image = post.image || '';
    const video = post.video || '';
    const url = post.url || '#';
    const author = post.author || '';
    const source = post.source || '';
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
    const dateStr = publishedAt ? publishedAt.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '';
    const fav = isFavorited(id);

    // Expandable content: show a longer description by stitching summary and a hint
    const longExcerpt = `${post.summary || ''} ${post.seoDescription && post.seoDescription !== post.summary ? post.seoDescription : ''}`.trim();

    document.title = `${post.seoTitle || title} • Cochran Films`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', post.seoDescription || longExcerpt || title);

    el.innerHTML = `
      <header style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start;">
        <div>
          <h1 style="margin:0 0 4px 0;">${title}</h1>
          <div class="meta">${dateStr}${author ? ` • by ${author}` : ''}${source ? ` • ${source}` : ''}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">${tags.slice(0,6).map(t => `<span class="pill">${t}</span>`).join('')}</div>
        </div>
        <button id="favBtn" aria-label="Favorite" title="Favorite" data-id="${id}" style="background:none;border:1px solid rgba(148,163,184,0.35);border-radius:8px;padding:8px 10px;color:${fav ? '#f59e0b' : '#94a3b8'};font-size:16px;cursor:pointer">${fav ? '★ Favorited' : '☆ Favorite'}</button>
      </header>
      ${image ? `<div style="margin: 14px 0 14px 0;"><img src="${image}" alt="${title}" style="width:100%;height:auto;border-radius:10px;" loading="lazy"></div>` : ''}
      ${video ? `<div style="margin: 14px 0 14px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 10px;"><iframe src="${video}" title="${title}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%"></iframe></div>` : ''}
      <section>
        <p style="font-size:1.05rem;line-height:1.7">${longExcerpt}</p>
        <p class="meta" style="margin-top:10px">This is an excerpt of a curated article. Continue reading the full piece at the source below.</p>
        <p style="margin-top:12px"><a class="read-more" href="${url}" target="_blank" rel="noopener">Read the original article</a></p>
        <hr style="border-color:#1f2937; margin:18px 0" />
        <div class="meta">Source: ${source || 'Original publisher'}${author ? ` • Author: ${author}` : ''}${dateStr ? ` • Published: ${dateStr}` : ''}</div>
      </section>
    `;

    // JSON-LD schema
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.seoTitle || title,
      datePublished: post.publishedAt,
      author: author ? { '@type': 'Person', name: author } : undefined,
      publisher: { '@type': 'Organization', name: 'Cochran Films' },
      image: image || undefined,
      mainEntityOfPage: location.href,
      description: post.seoDescription || longExcerpt || title,
    };
    const s = document.createElement('script'); s.type='application/ld+json'; s.textContent = JSON.stringify(schema); document.head.appendChild(s);

    // Fav handler
    document.getElementById('favBtn').addEventListener('click', (e) => {
      const favs = getFavorites();
      const idx = favs.indexOf(id);
      const btn = e.currentTarget;
      if (idx >= 0) { favs.splice(idx,1); setFavorites(favs); btn.textContent = '☆ Favorite'; btn.style.color = '#94a3b8'; }
      else { favs.push(id); setFavorites(favs); btn.textContent = '★ Favorited'; btn.style.color = '#f59e0b'; }
    });
  } catch (e) {
    console.error(e);
    el.innerHTML = '<p class="meta">Failed to load article.</p>';
  }
});


