// Enhanced blog renderer with categories, favorites, poll, and internal read-more pages
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('blog-posts');
  if (!container) return;

  const controlsContainer = document.createElement('div');
  controlsContainer.id = 'blog-controls';
  controlsContainer.style.display = 'flex';
  controlsContainer.style.flexWrap = 'wrap';
  controlsContainer.style.gap = '10px';
  controlsContainer.style.margin = '0 0 16px 0';
  container.parentElement.insertBefore(controlsContainer, container);

  // Create a non-sticky poll container below controls so it scrolls with content
  const pollContainer = document.createElement('div');
  pollContainer.id = 'dailyPoll';
  pollContainer.className = 'blog-card';
  pollContainer.style.margin = '8px 0 16px 0';
  controlsContainer.insertAdjacentElement('afterend', pollContainer);

  const fallback = (message) => {
    container.innerHTML = `
      <div class="blog-card">
        <h2>Nothing here yet</h2>
        <p class="meta">Daily posts will appear once the scheduler is configured.</p>
        <p style="color: var(--text-muted);">${message || ''}</p>
      </div>
    `;
  };

  function getFavorites() {
    try { return JSON.parse(localStorage.getItem('cf_blog_favorites') || '[]'); } catch { return []; }
  }
  function setFavorites(ids) {
    localStorage.setItem('cf_blog_favorites', JSON.stringify(Array.from(new Set(ids))));
  }
  function isFavorited(id) {
    return getFavorites().includes(id);
  }

  function computeIdFromUrl(url) {
    try { return btoa(url).replace(/=+$/,''); } catch { return String(Math.abs(hashCode(url))); }
  }
  function hashCode(str) {
    let h = 0; for (let i=0;i<str.length;i++){ h = (h<<5) - h + str.charCodeAt(i); h |= 0; } return h;
  }

  function getSelectedCategory() {
    return new URLSearchParams(location.search).get('category') || 'all';
  }
  function setSelectedCategory(cat) {
    const params = new URLSearchParams(location.search);
    if (cat && cat !== 'all') params.set('category', cat); else params.delete('category');
    history.replaceState(null, '', `${location.pathname}?${params.toString()}`.replace(/\?$/,''));
  }

  function renderControls(categories) {
    const selected = getSelectedCategory();
    const uniqueCategories = ['all', ...Array.from(new Set(categories))];
    controlsContainer.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
        <label for="categoryFilter" style="color:#cbd5e1">Category:</label>
        <select id="categoryFilter" style="padding:8px 10px;border-radius:10px;background:rgba(255,255,255,0.04);border:1px solid rgba(148,163,184,0.25);color:#e5e7eb;">
          ${uniqueCategories.map(c => `<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('')}
        </select>
        <button id="showFavorites" style="padding:8px 10px;border-radius:10px;background:rgba(255,178,0,0.15);border:1px solid rgba(255,178,0,0.35);color:#fef3c7;font-weight:700">Favorites</button>
      </div>
    `;

    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      setSelectedCategory(e.target.value);
      render();
    });
    document.getElementById('showFavorites').addEventListener('click', () => {
      const params = new URLSearchParams(location.search);
      const fav = params.get('favorites') === '1' ? null : '1';
      if (fav) params.set('favorites','1'); else params.delete('favorites');
      history.replaceState(null, '', `${location.pathname}?${params.toString()}`.replace(/\?$/,''));
      render();
    });

    // Poll logic with localStorage tally
    const POLL_KEY = 'cf_blog_poll_v1';
    const todayKey = new Date().toISOString().slice(0,10);
    let saved = JSON.parse(localStorage.getItem(POLL_KEY) || 'null');
    if (saved && saved.day !== todayKey) { saved = null; localStorage.removeItem(POLL_KEY); }
    // Render poll into dedicated non-sticky container
    pollContainer.innerHTML = `
      <h3 style="margin-top:0">Daily Poll</h3>
      <p class="meta">What type of content do you want more of?</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${['production','web','apple','brand','photography'].map(opt => `<button class="poll-opt" data-opt="${opt}" style="padding:8px 12px;border-radius:999px;background:rgba(255,255,255,0.04);border:1px solid rgba(148,163,184,0.25);color:#e5e7eb">${opt}</button>`).join('')}
      </div>
      <div id="pollResult" class="meta" style="margin-top:8px"></div>
    `;
    const pollResult = pollContainer.querySelector('#pollResult');
    function showResult(data) {
      const total = Object.values(data).reduce((a,b)=>a+b,0) || 0;
      if (!total) { pollResult.textContent = 'No votes yet.'; return; }
      const top = Object.entries(data).sort((a,b)=>b[1]-a[1])[0][0];
      pollResult.textContent = `Top choice: ${top} • Total votes: ${total}`;
    }
    let data = saved && saved.data ? saved.data : { production:0, web:0, apple:0, brand:0, photography:0 };
    if (saved && saved.voted) showResult(data);
    pollContainer.querySelectorAll('.poll-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        if (localStorage.getItem(POLL_KEY)) { pollResult.textContent = 'You already voted today.'; return; }
        const opt = btn.dataset.opt; data[opt] = (data[opt]||0)+1;
        localStorage.setItem(POLL_KEY, JSON.stringify({ voted: true, ts: Date.now(), day: todayKey, data }));
        showResult(data);
      });
    });
  }

  function buildCard(post) {
    const title = post.title || 'Untitled';
    const summary = post.summary || '';
    const category = post.category || 'general';
    const source = post.source || '';
    const url = post.url || '#';
    const author = post.author || '';
    const tags = Array.isArray(post.tags) ? post.tags : [];
    const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
    const dateStr = publishedAt ? publishedAt.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }) : '';
    const image = post.image || '';
    const video = post.video || '';
    const id = computeIdFromUrl(url);
    const fav = isFavorited(id);

    const detailHref = `blog-post.html?id=${encodeURIComponent(id)}`;
    return `
      <article class="blog-card" data-id="${id}" data-category="${category}">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
          <h2 style="margin:0">${title}</h2>
          <button class="fav-btn" aria-label="Favorite" title="Favorite" data-id="${id}" style="background:none;border:none;color:${fav ? '#f59e0b' : '#94a3b8'};font-size:20px;cursor:pointer">${fav ? '★' : '☆'}</button>
        </div>
        <div class="meta">${dateStr}${category ? ` • ${category}` : ''}${source ? ` • ${source}` : ''}${author ? ` • by ${author}` : ''}</div>
        ${image ? `<a href="${detailHref}"><div style="margin: 8px 0 12px 0;"><img src="${image}" alt="${title}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"></div></a>` : ''}
        ${video ? `<a href="${detailHref}"><div style="margin: 8px 0 12px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"><iframe src="${video}" title="${title}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;"></iframe></div></a>` : ''}
        <p>${summary}</p>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:space-between">
          <div style="display:flex;gap:6px;flex-wrap:wrap">${tags.slice(0,4).map(t => `<span style="font-size:12px;padding:4px 8px;border-radius:999px;border:1px solid rgba(148,163,184,0.25);color:#cbd5e1">${t}</span>`).join('')}</div>
          <div style="display:flex;gap:10px;align-items:center;">
            <a class="read-more" href="${detailHref}">Read more</a>
            <a class="read-more" href="${url}" target="_blank" rel="noopener">Original</a>
          </div>
        </div>
      </article>
    `;
  }

  function attachFavHandlers() {
    container.querySelectorAll('.fav-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.dataset.id;
        const favs = getFavorites();
        if (favs.includes(id)) {
          setFavorites(favs.filter(x => x !== id));
          btn.textContent = '☆';
          btn.style.color = '#94a3b8';
        } else {
          favs.push(id); setFavorites(favs);
          btn.textContent = '★';
          btn.style.color = '#f59e0b';
        }
      });
    });
  }

  let cachedPosts = [];
  async function fetchPosts() {
    if (cachedPosts.length) return cachedPosts;
    const ts = Date.now();
    const response = await fetch(`blog/posts.json?ts=${ts}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const posts = await response.json();
    cachedPosts = Array.isArray(posts) ? posts : [];
    return cachedPosts;
  }

  function filterByParams(posts) {
    const params = new URLSearchParams(location.search);
    const selected = getSelectedCategory();
    const onlyFavs = params.get('favorites') === '1';
    const favSet = new Set(getFavorites());
    let result = posts;
    if (selected !== 'all') result = result.filter(p => (p.category || 'general') === selected);
    if (onlyFavs) result = result.filter(p => favSet.has(computeIdFromUrl(p.url || '')));
    return result;
  }

  async function render() {
    try {
      const posts = await fetchPosts();
      if (!Array.isArray(posts) || posts.length === 0) { fallback('No posts have been generated yet.'); return; }
      renderControls(posts.map(p => p.category || 'general'));
      const filtered = filterByParams(posts);
      const html = filtered.map(buildCard).join('');
      container.innerHTML = html;
      attachFavHandlers();

      // Inject schema for the list page
      injectListSchema(filtered);
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      fallback('Failed to load posts.');
    }
  }

  function injectListSchema(posts) {
    try {
      const items = posts.slice(0, 12).map(p => ({
        '@type': 'BlogPosting',
        headline: p.seoTitle || p.title,
        datePublished: p.publishedAt,
        author: p.author ? { '@type': 'Person', name: p.author } : undefined,
        image: p.image || undefined,
        mainEntityOfPage: p.url,
      }));
      const data = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        name: 'Cochran Films Daily Brief',
        url: location.href,
        blogPost: items
      };
      let el = document.getElementById('schema-blog');
      if (!el) { el = document.createElement('script'); el.type = 'application/ld+json'; el.id = 'schema-blog'; document.head.appendChild(el); }
      el.textContent = JSON.stringify(data);
    } catch {}
  }

  render();
});


