// Enhanced blog renderer: search, filter, favorites, trending sort
document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('blog-posts');
  if (!container) return;

  // UI controls container
  const controls = document.createElement('div');
  controls.id = 'blog-controls';
  controls.style.margin = '0 0 12px 0';
  container.parentElement.insertBefore(controls, container);

  const fallback = (message) => {
    container.innerHTML = `
      <div class="blog-card">
        <h2>Nothing here yet</h2>
        <p class="meta">Daily posts will appear once the scheduler is configured.</p>
        <p style="color: var(--text-muted);">${message || ''}</p>
      </div>
    `;
  };

  // Local storage helpers
  const FAVORITES_KEY = 'cf_blog_favorites';
  const READ_KEY = 'cf_blog_read_slugs';
  function loadJson(key, fallbackValue) {
    try { const v = JSON.parse(localStorage.getItem(key) || ''); return Array.isArray(v) ? v : (v || fallbackValue); } catch { return fallbackValue; }
  }
  function saveJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }

  const trendingTokens = ['apple', 'dji', 'adobe', 'sony', 'canon', 'nikon', 'vercel', 'next.js', 'react', 'tailwind', 'mdn'];

  try {
    const response = await fetch(`blog/posts.json?ts=${Date.now()}`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const allPosts = await response.json();
    if (!Array.isArray(allPosts) || allPosts.length === 0) {
      fallback('No posts have been generated yet.');
      return;
    }

    // Build facets
    const categories = Array.from(new Set(allPosts.map(p => p.category || 'general'))).sort();
    const sources = Array.from(new Set(allPosts.map(p => p.source).filter(Boolean))).sort();

    // State
    let query = '';
    let category = 'all';
    let source = 'all';
    let showOnlyFavorites = false;
    let sortBy = 'newest';
    let favorites = loadJson(FAVORITES_KEY, []);
    let readSlugs = loadJson(READ_KEY, []);

    // Render controls
    controls.innerHTML = `
      <div class="blog-card" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <input id="cf-search" type="search" placeholder="Search posts..." style="flex:1;min-width:200px;padding:8px;border-radius:8px;border:1px solid var(--border-color, #222);background:rgba(255,255,255,0.02);color:inherit;" />
        <select id="cf-category" style="padding:8px;border-radius:8px;border:1px solid var(--border-color, #222);background:rgba(255,255,255,0.02);color:inherit;">
          <option value="all">All categories</option>
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select id="cf-source" style="padding:8px;border-radius:8px;border:1px solid var(--border-color, #222);background:rgba(255,255,255,0.02);color:inherit;max-width:260px;">
          <option value="all">All sources</option>
          ${sources.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
        <select id="cf-sort" style="padding:8px;border-radius:8px;border:1px solid var(--border-color, #222);background:rgba(255,255,255,0.02);color:inherit;">
          <option value="newest">Newest</option>
          <option value="trending">Trending first</option>
        </select>
        <button id="cf-favs" style="padding:8px 12px;border-radius:999px;border:1px solid rgba(255,178,0,0.35);background:rgba(255,178,0,0.08);color:#fef3c7;font-weight:700;">Favorites: Off</button>
        <div id="cf-streak" style="margin-left:auto;color:var(--text-muted);font-size:0.9rem;"></div>
      </div>
      <div id="cf-poll" class="blog-card" style="margin-top:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
          <strong>Daily Poll</strong>
          <small id="cf-poll-status" style="color:var(--text-muted);"></small>
        </div>
        <div id="cf-poll-body" style="margin-top:8px;"></div>
      </div>
      <section id="cf-recent-rail" style="margin-top:12px;"></section>`;

    // Reading streak (local only)
    const STREAK_KEY = 'cf_read_streak';
    const LAST_READ_KEY = 'cf_last_read_date';
    const todayKey = new Date().toISOString().slice(0, 10);
    const last = localStorage.getItem(LAST_READ_KEY);
    let streak = parseInt(localStorage.getItem(STREAK_KEY) || '0', 10) || 0;
    if (last !== todayKey) {
      // If yesterday, increment; else reset
      const y = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      streak = last === y ? streak + 1 : 1;
      localStorage.setItem(STREAK_KEY, String(streak));
      localStorage.setItem(LAST_READ_KEY, todayKey);
    }
    const streakEl = document.getElementById('cf-streak');
    if (streakEl) streakEl.textContent = `Streak: ${streak} day${streak === 1 ? '' : 's'}`;

    const $search = document.getElementById('cf-search');
    const $cat = document.getElementById('cf-category');
    const $src = document.getElementById('cf-source');
    const $sort = document.getElementById('cf-sort');
    const $favs = document.getElementById('cf-favs');

    function isTrending(post) {
      const t = (post.title || '').toLowerCase();
      return trendingTokens.some(k => t.includes(k));
    }

    function render() {
      const text = query.trim().toLowerCase();
      let list = allPosts.slice();
      if (text) {
        list = list.filter(p => (`${p.title} ${p.summary} ${p.source}`.toLowerCase().includes(text)));
      }
      if (category !== 'all') list = list.filter(p => (p.category || 'general') === category);
      if (source !== 'all') list = list.filter(p => p.source === source);
      if (showOnlyFavorites) list = list.filter(p => favorites.includes(p.slug));

      if (sortBy === 'newest') {
        list.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
      } else if (sortBy === 'trending') {
        list.sort((a, b) => (isTrending(b) - isTrending(a)) || (new Date(b.publishedAt) - new Date(a.publishedAt)));
      }

      container.innerHTML = list.map((post) => {
        const title = post.title || 'Untitled';
        const summary = post.summary || '';
        const cat = post.category || 'general';
        const src = post.source || '';
        const url = post.url || '#';
        const publishedAt = post.publishedAt ? new Date(post.publishedAt) : null;
        const dateStr = publishedAt ? publishedAt.toLocaleString() : '';
        const image = post.image || '';
        const video = post.video || '';
        const slug = post.slug;
        const hasSeoPage = Boolean(slug);
        const internalUrl = hasSeoPage ? `blog/post/${slug}.html` : url;
        const isFav = favorites.includes(slug);
        const isRead = readSlugs.includes(slug);

        return `
          <article class="blog-card" data-slug="${slug}">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
              <h2 style="margin:0;">${title}${isTrending(post) ? ' <span style=\"font-size:0.8rem;color:#f59e0b;\">★</span>' : ''}</h2>
              <button class="fav" aria-label="Toggle favorite" title="Toggle favorite" data-slug="${slug}" style="border:none;background:transparent;color:${isFav ? '#fbbf24' : 'var(--text-muted)'};font-size:1.1rem;cursor:pointer;">${isFav ? '★' : '☆'}</button>
            </div>
            <div class="meta">${dateStr}${cat ? ` • ${cat}` : ''}${src ? ` • ${src}` : ''}${isRead ? ' • read' : ''}</div>
            ${image ? `<div style="margin: 8px 0 12px 0;"><img src="${image}" alt="${title}" style="width:100%;height:auto;border-radius:8px;" loading="lazy"></div>` : ''}
            ${video ? `<div style="margin: 8px 0 12px 0; position: relative; padding-bottom: 56.25%; height: 0; overflow: hidden; border-radius: 8px;"><iframe src="${video}" title="${title}" frameborder="0" allowfullscreen style="position:absolute;top:0;left:0;width:100%;height:100%;"></iframe></div>` : ''}
            <p>${summary}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;">
              <a class="read-more" href="${internalUrl}" ${hasSeoPage ? '' : 'target="_blank" rel="noopener"'}>Open post</a>
              <a class="read-more" href="${url}" target="_blank" rel="noopener">Read source</a>
              <button class="mark-read" data-slug="${slug}" style="padding:6px 10px;border-radius:999px;border:1px solid var(--border-color,#222);background:rgba(255,255,255,0.02);color:inherit;">${isRead ? 'Mark unread' : 'Mark read'}</button>
            </div>
          </article>
        `;
      }).join('');

      // Bind events for new DOM
      container.querySelectorAll('button.fav').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slug = e.currentTarget.getAttribute('data-slug');
          const idx = favorites.indexOf(slug);
          if (idx === -1) favorites.push(slug); else favorites.splice(idx, 1);
          saveJson(FAVORITES_KEY, favorites);
          render();
        });
      });
      container.querySelectorAll('button.mark-read').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const slug = e.currentTarget.getAttribute('data-slug');
          const idx = readSlugs.indexOf(slug);
          if (idx === -1) readSlugs.push(slug); else readSlugs.splice(idx, 1);
          saveJson(READ_KEY, readSlugs);
          render();
        });
      });
    }

    // Wire controls
    $search.addEventListener('input', (e) => { query = e.target.value; render(); });
    $cat.addEventListener('change', (e) => { category = e.target.value; render(); });
    $src.addEventListener('change', (e) => { source = e.target.value; render(); });
    $sort.addEventListener('change', (e) => { sortBy = e.target.value; render(); });
    $favs.addEventListener('click', () => { showOnlyFavorites = !showOnlyFavorites; $favs.textContent = `Favorites: ${showOnlyFavorites ? 'On' : 'Off'}`; render(); });

    // Daily poll (client-only)
    (function(){
      const POLL_KEY = 'cf_daily_poll_v1';
      const today = new Date().toISOString().slice(0,10);
      const questions = [
        { id: 'tool-choice', q: 'Which tool did you use most today?', opts: ['Premiere Pro','Final Cut','DaVinci Resolve','After Effects','VS Code','Cursor','Figma'] },
        { id: 'device-news', q: 'Whose news are you most excited about this week?', opts: ['Apple','DJI','Sony','Canon','Nikon','Other'] },
        { id: 'web-stack', q: 'What web stack are you building with right now?', opts: ['Next.js','Vite + React','Astro','SvelteKit','Vue','Django/Flask','Rails'] }
      ];
      const q = questions[(new Date().getDate()) % questions.length];
      const pollEl = document.getElementById('cf-poll-body');
      const statusEl = document.getElementById('cf-poll-status');
      if (!pollEl) return;
      const savedRaw = localStorage.getItem(POLL_KEY);
      let saved = null;
      try { saved = savedRaw ? JSON.parse(savedRaw) : null; } catch {}
      const alreadyAnswered = saved && saved.date === today && saved.id === q.id;
      if (alreadyAnswered) statusEl.textContent = 'Thanks for voting!';
      function renderPollResults(choice){
        try {
          let statsRaw = localStorage.getItem('cf_poll_stats_' + q.id) || '{}';
          let stats = JSON.parse(statsRaw);
          q.opts.forEach(o => { if (!stats[o]) stats[o] = 0; });
          if (choice) stats[choice] = (stats[choice] || 0) + 1;
          localStorage.setItem('cf_poll_stats_' + q.id, JSON.stringify(stats));
          const total = Object.values(stats).reduce((a,b)=>a+b,0) || 1;
          pollEl.innerHTML = `
            <div style="margin-bottom:8px;">${q.q}</div>
            ${q.opts.map(o => {
              const pct = Math.round(((stats[o]||0) / total) * 100);
              return `<div style=\"display:flex;align-items:center;gap:8px;margin:6px 0;\"><div style=\"min-width:120px;\">${o}</div><div style=\"flex:1;height:10px;border-radius:999px;background:rgba(255,255,255,0.06);overflow:hidden;\"><div style=\"width:${pct}%;height:100%;background:rgba(255,178,0,0.35);\"></div></div><div style=\"width:36px;text-align:right;color:var(--text-muted);\">${pct}%</div></div>`;
            }).join('')}
          `;
        } catch {}
      }
      if (alreadyAnswered) {
        renderPollResults();
      } else {
        pollEl.innerHTML = `
          <div style="margin-bottom:8px;">${q.q}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${q.opts.map(o => `<button class=\"cf-poll-opt\" data-opt=\"${o}\" style=\"padding:6px 10px;border-radius:999px;border:1px solid var(--border-color,#222);background:rgba(255,255,255,0.02);color:inherit;\">${o}</button>`).join('')}
          </div>
        `;
        Array.from(pollEl.querySelectorAll('.cf-poll-opt')).forEach(btn => {
          btn.addEventListener('click', (e) => {
            const choice = e.currentTarget.getAttribute('data-opt');
            localStorage.setItem(POLL_KEY, JSON.stringify({ id: q.id, date: today, choice }));
            statusEl.textContent = 'Thanks for voting!';
            renderPollResults(choice);
          });
        });
      }
    })();

    // Recently Viewed rail
    (function(){
      try {
        const rail = document.getElementById('cf-recent-rail');
        if (!rail) return;
        const recent = JSON.parse(localStorage.getItem('cf_recently_viewed') || '[]');
        if (!Array.isArray(recent) || recent.length === 0) return;
        const slugs = recent.map(r => r.slug);
        const bySlug = new Map(allPosts.map(p => [p.slug, p]));
        const items = slugs.map(s => bySlug.get(s)).filter(Boolean).slice(0, 6);
        if (!items.length) return;
        const cards = items.map(p => {
          const href = `blog/post/${p.slug}.html`;
          return `<article class=\"blog-card\" style=\"margin-top:12px;\">` +
            `${p.image ? `<div style=\\"margin: 6px 0 8px 0;\\"><img src=\\"${p.image}\\" alt=\\"${p.title}\\" style=\\"width:100%;height:auto;border-radius:8px;\\" loading=\\"lazy\\"></div>`: ''}` +
            `<h2 style=\"margin:0 0 6px 0;font-size:1.05rem;\">${p.title}</h2>` +
            `<div class=\"meta\">${p.category || ''}${p.source ? ' • ' + p.source : ''}</div>` +
            `<a class=\"read-more\" href=\"${href}\">Open post</a>` +
          `</article>`;
        }).join('');
        rail.innerHTML = `<h3 style=\"margin:8px 0 8px 0;\">Recently viewed</h3>` + cards;
      } catch {}
    })();

    // Initial render
    render();
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    fallback('Failed to load posts.');
  }
});


