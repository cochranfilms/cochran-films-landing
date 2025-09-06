/*
  Lightweight Airtable CMS stub for Portfolio
  - Avoids runtime warnings if Airtable module isn't present yet
  - Provides a single initializePortfolioSystem() entrypoint used in index.html
  - Optional: if you add an API route at /api/airtable/portfolio that returns
    [{ Title, Description, Category, "Thumbnail Image", playbackUrl, UploadDate, URL, ServiceCategory, "Is Featured" }],
    this stub will render items using the existing category grids.
*/
;(function(){
  const categoryGrids = {
    'Video Production': 'videoProductionGrid',
    'Web Development': 'webDevelopmentGrid',
    'Photography': 'photographyGrid',
    'Brand Development': 'brandDevelopmentGrid'
  };

  // Pagination settings
  const itemsPerPage = 6;
  const categoryData = {};
  const categoryPages = {};

  function createEl(html){
    const div = document.createElement('div');
    div.innerHTML = html.trim();
    return div.firstElementChild;
  }

  function render(items){
    if (!Array.isArray(items) || items.length === 0) return;
    const byCat = items.reduce((acc, it)=>{
      const originalCategory = it.ServiceCategory || it.Category || 'Video Production';
      
      // Map Airtable categories to portfolio sections
      let mappedCategory = 'Video Production'; // default
      if (['Corporate', 'Commercials', 'Shorts', 'Education', 'Live Broadcast', 'Events', 'Podcasts'].includes(originalCategory)) {
        mappedCategory = 'Video Production';
      } else if (['Web Development', 'Web', 'Website', 'E-Commerce', 'Media Services', 'Education', 'Marketing', 'Internal Tools'].includes(originalCategory)) {
        mappedCategory = 'Web Development';
      } else if (['Photography', 'Photo', 'Photos'].includes(originalCategory)) {
        mappedCategory = 'Photography';
      } else if (['Brand Development', 'Brand', 'Branding'].includes(originalCategory)) {
        mappedCategory = 'Brand Development';
      }
      
      (acc[mappedCategory] ||= []).push(it);
      return acc;
    }, {});

    // Store data for pagination
    Object.keys(categoryGrids).forEach(cat => {
      categoryData[cat] = byCat[cat] || [];
      categoryPages[cat] = 1;
    });

    Object.entries(categoryGrids).forEach(([cat, gridId])=>{
      renderCategoryGrid(cat, gridId, 1);
    });
  }

  function renderCategoryGrid(category, gridId, page) {
    const grid = document.getElementById(gridId);
    if (!grid) return;
    
    const items = categoryData[category] || [];
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = items.slice(0, endIndex);
    
    grid.innerHTML = pageItems.map(it => {
      const thumb = (it['Thumbnail Image']||'').trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center';
      const isPhotoOnly = (it.ServiceCategory||it.Category)==='Photography' && !it.playbackUrl;
      const videoUrl = it.playbackUrl || '';
      
      if (isPhotoOnly){
        return `<div class="portfolio-item photo-only" data-category="${it.Category||''}" data-title="${it.Title||''}" data-src="${thumb}"><div class="portfolio-thumbnail"><img src="${thumb}" alt="${it.Title||'Photo'}" loading="lazy" /></div></div>`;
      }
      // Check if this is a web development project
      const isWebProject = ['E-Commerce', 'Media Services', 'Education', 'Marketing', 'Internal Tools', 'Web Development'].includes(it.Category);
      const techStack = it['Tech Stack'] || '';
      const role = it.Role || '';
      const timeline = it.Timeline || '';
      
      return `<div class="portfolio-item ${isWebProject ? 'web-project' : ''}" data-category="${it.Category||''}" data-title="${it.Title||''}" data-video="${videoUrl}" data-url="${it.URL || ''}" data-description="${it.Description||''}">
        <div class="portfolio-thumbnail">
          <img src="${thumb}" alt="${it.Title||''}" loading="lazy" />
          <div class="portfolio-play"><i class="fa-solid fa-${isWebProject ? 'external-link-alt' : 'play'}"></i></div>
        </div>
        <div class="portfolio-content">
          <div class="portfolio-category"><i class="fa-solid fa-tag"></i>${it.Category||''}</div>
          <h3 class="portfolio-title">${it.Title||''}</h3>
          <p class="portfolio-description">${it.Description||''}</p>
          ${isWebProject && techStack ? `<div class="portfolio-tech"><i class="fa-solid fa-code"></i><span>${techStack.substring(0, 100)}${techStack.length > 100 ? '...' : ''}</span></div>` : ''}
          ${isWebProject && role ? `<div class="portfolio-role"><i class="fa-solid fa-user"></i><span>${role.substring(0, 80)}${role.length > 80 ? '...' : ''}</span></div>` : ''}
          ${isWebProject && timeline ? `<div class="portfolio-timeline"><i class="fa-solid fa-clock"></i><span>${timeline}</span></div>` : ''}
          ${it.URL ? `<div class="portfolio-link"><a href="${it.URL}" target="_blank" rel="noopener"><i class="fa-solid fa-external-link-alt"></i> View Project</a></div>` : ''}
        </div>
      </div>`;
    }).join('');

    // Add load more button if there are more items
    const totalItems = items.length;
    const currentItems = endIndex;
    
    if (currentItems < totalItems) {
      const loadMoreBtn = document.getElementById(`${gridId}-load-more`);
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.onclick = () => loadMoreItems(category, gridId);
      }
    } else {
      const loadMoreBtn = document.getElementById(`${gridId}-load-more`);
      if (loadMoreBtn) {
        loadMoreBtn.style.display = 'none';
      }
    }
  }

  function loadMoreItems(category, gridId) {
    categoryPages[category]++;
    renderCategoryGrid(category, gridId, categoryPages[category]);
  }

  async function fetchFromAPI(){
    try{
      // Fetch both portfolio and web data
      const [portfolioRes, webRes] = await Promise.all([
        fetch('/api/airtable/portfolio'),
        fetch('/api/airtable/web')
      ]);
      
      let portfolioItems = [];
      let webItems = [];
      
      if (portfolioRes.ok) {
        portfolioItems = await portfolioRes.json();
      }
      
      if (webRes.ok) {
        webItems = await webRes.json();
      }
      
      // Combine both datasets
      const allItems = [...portfolioItems, ...webItems];
      render(allItems);
    }catch(e){
      console.warn('Airtable API not available, portfolio will remain minimal until backend is added.', e);
    }
  }

  // Video popup functionality
  function createVideoPopup() {
    const popup = document.createElement('div');
    popup.id = 'video-popup';
    popup.className = 'video-popup-overlay';
    popup.innerHTML = `
      <div class="video-popup-content">
        <button class="video-popup-close" aria-label="Close video">
          <i class="fa-solid fa-times"></i>
        </button>
        <div class="video-popup-header">
          <h3 class="video-popup-title"></h3>
          <div class="video-popup-category"></div>
        </div>
        <div class="video-popup-body">
          <div class="video-popup-player">
            <video controls autoplay>
              <source src="" type="video/mp4">
              Your browser does not support the video tag.
            </video>
          </div>
          <div class="video-popup-description"></div>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    return popup;
  }

  function showVideoPopup(title, category, videoUrl, description) {
    let popup = document.getElementById('video-popup');
    if (!popup) {
      popup = createVideoPopup();
    }

    // Update content
    popup.querySelector('.video-popup-title').textContent = title;
    popup.querySelector('.video-popup-category').innerHTML = `<i class="fa-solid fa-tag"></i>${category}`;
    popup.querySelector('.video-popup-description').textContent = description;
    
    const video = popup.querySelector('video');
    video.src = videoUrl;
    video.load();

    // Show popup
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    // Close handlers
    const closeBtn = popup.querySelector('.video-popup-close');
    const overlay = popup;

    closeBtn.onclick = () => hideVideoPopup();
    overlay.onclick = (e) => {
      if (e.target === overlay) hideVideoPopup();
    };

    // ESC key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        hideVideoPopup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  function hideVideoPopup() {
    const popup = document.getElementById('video-popup');
    if (popup) {
      popup.style.display = 'none';
      document.body.style.overflow = '';
      
      // Stop video
      const video = popup.querySelector('video');
      video.pause();
      video.currentTime = 0;
    }
  }

  function initializeVideoHandlers() {
    document.addEventListener('click', (e) => {
      const portfolioItem = e.target.closest('.portfolio-item');
      if (!portfolioItem) return;

      const videoUrl = portfolioItem.dataset.video;
      const projectUrl = portfolioItem.dataset.url;
      
      // Check if this is a web project with a URL
      if (projectUrl && !videoUrl) {
        // Navigate to the web project URL
        window.open(projectUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Handle video projects
      if (videoUrl) {
        const title = portfolioItem.dataset.title;
        const category = portfolioItem.dataset.category;
        const description = portfolioItem.dataset.description;

        showVideoPopup(title, category, videoUrl, description);
      }
    });
  }

  window.airtableCMS = {
    initializePortfolioSystem(){
      // If a backend exists, hydrate from it; otherwise no-op (avoids warnings)
      fetchFromAPI();
      initializeVideoHandlers();
    },
    loadMoreForCategory(category){
      // Optional: implement pagination when backend is ready
      console.log('AirtableCMS.loadMoreForCategory called for', category);
    }
  };
})();


