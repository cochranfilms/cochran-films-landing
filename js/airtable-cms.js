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

    Object.entries(categoryGrids).forEach(([cat, gridId])=>{
      const grid = document.getElementById(gridId);
      if (!grid) return;
      const list = (byCat[cat]||[]).slice(0, 6);
      grid.innerHTML = list.map(it => {
        const thumb = (it['Thumbnail Image']||'').trim() || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center';
        const isPhotoOnly = (it.ServiceCategory||it.Category)==='Photography' && !it.playbackUrl;
        const videoUrl = it.playbackUrl || '';
        
        if (isPhotoOnly){
          return `<div class="portfolio-item photo-only" data-category="${it.Category||''}" data-title="${it.Title||''}" data-src="${thumb}"><div class="portfolio-thumbnail"><img src="${thumb}" alt="${it.Title||'Photo'}" loading="lazy" /></div></div>`;
        }
        return `<div class="portfolio-item" data-category="${it.Category||''}" data-title="${it.Title||''}" data-video="${videoUrl}">
          <div class="portfolio-thumbnail">
            <img src="${thumb}" alt="${it.Title||''}" loading="lazy" />
            <div class="portfolio-play"><i class="fa-solid fa-play"></i></div>
          </div>
          <div class="portfolio-content">
            <div class="portfolio-category"><i class="fa-solid fa-tag"></i>${it.Category||''}</div>
            <h3 class="portfolio-title">${it.Title||''}</h3>
            <p class="portfolio-description">${it.Description||''}</p>
          </div>
        </div>`;
      }).join('');
    });
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

  window.airtableCMS = {
    initializePortfolioSystem(){
      // If a backend exists, hydrate from it; otherwise no-op (avoids warnings)
      fetchFromAPI();
    },
    loadMoreForCategory(category){
      // Optional: implement pagination when backend is ready
      console.log('AirtableCMS.loadMoreForCategory called for', category);
    }
  };
})();


