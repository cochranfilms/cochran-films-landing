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
  let id = params.get('id');
  const urlParam = params.get('url');
  if (!id && urlParam) { id = computeIdFromUrl(urlParam); }
  if (!id) {
    el.innerHTML = '<div class="blog-card"><p class="meta">Missing article id.</p><p><a class="read-more" href="/blog.html">Go back to Blog</a></p></div>';
    return;
  }

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
      <section id="comments" style="margin-top:24px">
        <h3 style="margin:0 0 10px">Discussion</h3>
        <div id="commentsRoot" class="blog-card" style="padding:12px"></div>
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
    return;
  }

  // ----- Comment / Message Board -----
  try {
    const commentsRoot = document.getElementById('commentsRoot');
    if (!commentsRoot) return;

    const currentUser = (window.__CFUserAPI && window.__CFUserAPI.getUser && window.__CFUserAPI.getUser()) || null;

    function renderComposer() {
      const userName = currentUser?.name || 'Guest';
      commentsRoot.insertAdjacentHTML('afterbegin', `
        <div id="composer" style="margin-bottom:12px;">
          <div class="meta" style="margin-bottom:6px">Signed in as <strong>${userName}</strong> ${currentUser ? '' : `(guest)`}</div>
          <textarea id="commentText" rows="3" placeholder="Share your thoughts..." style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(148,163,184,0.25);background:#0b1220;color:#e5e7eb"></textarea>
          <div style="display:flex;gap:10px;margin-top:8px;align-items:center">
            <button id="postComment" class="read-more" style="border:1px solid rgba(99,102,241,0.35);padding:8px 12px;border-radius:10px;background:rgba(99,102,241,0.12);color:#cbd5e1;cursor:pointer">Post Comment</button>
            ${currentUser ? '' : `<a class="read-more" href="/user.html">Sign in for a better experience</a>`}
          </div>
        </div>
      `);
    }

    function formatTime(ts){ try { return new Date(ts).toLocaleString(); } catch { return ''; } }

    function renderList(items){
      const listHtml = items.map(c => `
        <div style="border:1px solid rgba(148,163,184,0.18);border-radius:10px;padding:10px;margin:8px 0;background:rgba(2,6,23,0.35)">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <strong>${(c.user && (c.user.name||c.user.email)) || 'Anonymous'}</strong>
            <span class="meta">${formatTime(c.createdAt||Date.now())}</span>
          </div>
          <div style="margin-top:6px;white-space:pre-wrap">${(c.text||'').replace(/[<>&]/g, s=>({"<":"&lt;",">":"&gt;","&":"&amp;"}[s]))}</div>
        </div>
      `).join('');
      const containerId = 'commentItems';
      let container = document.getElementById(containerId);
      if (!container) { container = document.createElement('div'); container.id = containerId; commentsRoot.appendChild(container); }
      container.innerHTML = listHtml || '<div class="meta">No comments yet. Be the first to share.</div>';
    }

    renderComposer();

    // Storage adapters: Firestore if available, else local fallback via UserAPI
    const firebaseAvailable = Boolean(window.firebase && window.firebase.firestore);
    let dispose = () => {};

    if (firebaseAvailable && window.__CF_FIREBASE?.db) {
      // Compat API expected: window.firebase
      const db = window.__CF_FIREBASE.db;
      const colRef = db.collection('blog_posts').doc(id).collection('comments');
      dispose = colRef.orderBy('createdAt','desc').onSnapshot((snap)=>{
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderList(items);
      });
      const postBtn = document.getElementById('postComment');
      postBtn?.addEventListener('click', async ()=>{
        const text = (document.getElementById('commentText')||{}).value?.trim();
        if (!text) return;
        await colRef.add({ text, createdAt: Date.now(), postId: id, user: currentUser||{ name: 'Guest' } });
        (document.getElementById('commentText')||{}).value = '';
      });
    } else {
      // Local fallback using __CFUserAPI
      function loadLocal(){
        const items = (window.__CFUserAPI?.listComments?.()||[]).filter(c => c.postId===id || c.postUrl===location.href);
        renderList(items);
      }
      loadLocal();
      const postBtn = document.getElementById('postComment');
      postBtn?.addEventListener('click', ()=>{
        const text = (document.getElementById('commentText')||{}).value?.trim();
        if (!text) return;
        const entity = { text, postId: id, postUrl: location.href, postTitle: document.title.replace(' • Cochran Films','') };
        (window.__CFUserAPI?.addComment||(()=>{}))(entity);
        (document.getElementById('commentText')||{}).value = '';
        setTimeout(loadLocal, 10);
      });
    }

    window.addEventListener('beforeunload', () => { try { dispose(); } catch {} });
  } catch (err) {
    console.warn('Comments init failed:', err);
  }
});


