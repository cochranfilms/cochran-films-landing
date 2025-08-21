// Airtable CMS Integration for Cochran Films Portfolio
// This file integrates with your existing portfolio structure without changing the styling or layout

class AirtableCMS {
  constructor() {
    // Determine API base. When served from GitHub Pages/custom domain,
    // call the Vercel serverless API explicitly.
    const origin = (typeof window !== 'undefined' && window.location && window.location.origin)
      ? window.location.origin
      : '';
    // Prefer explicit override if provided; otherwise use same-origin
    this.apiBase = (typeof window !== 'undefined' && window.API_BASE_URL)
      ? window.API_BASE_URL
      : origin;
    // Your Airtable base IDs from the URLs you provided
    this.bases = {
      'Video Production': 'appjQxcRoClnZzghj', // Portfolio CSV
      'Web Development': 'appV5l9kZ5vAxcz4e',  // Web CSV  
      'Photography': 'appP1uFoRWjxPkQ5b'       // Photos CSV
    };
    
    // Table names (these are typically the sheet names in your Airtable)
    this.tables = {
      'Video Production': 'Imported table',
      'Web Development': 'Imported table',
      'Photography': 'Imported table'
    };
    
    // Initialize the CMS
    this.init();
  }
  
  async init() {
    console.log('🚀 Initializing Airtable CMS...');
    
    try {
      // Load all portfolio data from Airtable
      await this.loadAllPortfolioData();
      
      // Initialize the existing portfolio system with Airtable data
      this.initializePortfolioSystem();
      
      console.log('✅ Airtable CMS initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Airtable CMS:', error);
      // Do not fallback to CSV. Show an explicit error state.
      this.showPortfolioErrorState();
    }
  }
  
  async loadAllPortfolioData() {
    console.log('📊 Loading portfolio data from Airtable...');
    
    try {
      // If running from file:// or invalid origin, skip Airtable and use CSV
      if (!this.apiBase || !/^https?:\/\//.test(this.apiBase)) {
        throw new Error(`Invalid API base: ${this.apiBase || '(empty)'} – falling back to CSV`);
      }
      // Show loading state
      this.showPortfolioLoadingState();
      
      // Load data from all three Airtable bases
      const [videoData, webData, photoData] = await Promise.all([
        this.loadAirtableData('Video Production'),
        this.loadAirtableData('Web Development'),
        this.loadAirtableData('Photography')
      ]);
      
      // Combine all data and map to existing portfolio structure
      this.portfolioData = [
        ...videoData.map(item => ({ ...item, ServiceCategory: 'Video Production' })),
        ...webData.map(item => ({ ...item, ServiceCategory: 'Web Development' })),
        ...photoData.map(item => ({ ...item, ServiceCategory: 'Photography' }))
      ];
      
      console.log(`📈 Loaded ${this.portfolioData.length} total items:`, {
        'Video Production': videoData.length,
        'Web Development': webData.length,
        'Photography': photoData.length
      });

      // If Airtable returned zero usable items, trigger CSV fallback
      if (!this.portfolioData || this.portfolioData.length === 0) {
        throw new Error('Airtable returned zero items');
      }
      
      // Hide loading state
      this.hidePortfolioLoadingState();
      
    } catch (error) {
      console.error('❌ Failed to load Airtable data:', error);
      throw error;
    }
  }
  
  async loadAirtableData(category) {
    const baseId = this.bases[category];
    const tableName = this.tables[category];
    
    if (!baseId || !tableName) {
      console.warn(`⚠️ Missing base ID or table name for ${category}`);
      return [];
    }
    
    try {
      console.log(`📥 Loading ${category} data from Airtable...`);
      
      // Try to fetch from your Vercel environment
      const apiEndpoint = `${this.apiBase}/api/airtable/${category.toLowerCase().replace(' ', '-')}`;
      console.log(`🔗 Calling API endpoint: ${apiEndpoint}`);
      
      const response = await fetch(apiEndpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API Error ${response.status}: ${response.statusText}`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.records?.length || 0} records for ${category}`);
      
      // Transform Airtable data to match existing portfolio structure
      return this.transformAirtableData(data.records || [], category);
      
    } catch (error) {
      console.error(`❌ Failed to load ${category} data:`, error);
      // Rethrow to allow global fallback to CSV
      throw error;
    }
  }
  
  transformAirtableData(records, category) {
    console.log(`🔄 Transforming ${records.length} records for ${category}...`);
    
    const transformedRecords = records.map(record => {
      const fields = record.fields;
      
      // Resolve common attachment/string variations to a direct image URL
      const coerceToUrl = (value) => {
        if (!value) return '';
        if (typeof value === 'string') return value.trim();
        if (Array.isArray(value) && value.length && value[0] && typeof value[0] === 'object' && value[0].url) {
          return String(value[0].url).trim();
        }
        if (typeof value === 'object' && value.url) return String(value.url).trim();
        return '';
      };
      const rawThumb = coerceToUrl(fields['thumbnailUrl'] || fields['Thumbnail Image'] || fields.Image || fields.Thumbnail);
      
      // Normalize GitHub blob URLs to raw
      const normalizeGithub = (url) => {
        if (typeof url === 'string' && url.includes('github.com') && url.includes('/blob/')) {
          return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }
        return url;
      };
      
      // Map Airtable fields to existing portfolio structure
      const transformedItem = {
        Title: fields.Title || fields.Name || fields['Project Name'] || fields['Video'] || 
               (category === 'Photography' ? `Photo ${record.id.slice(-4)}` : 'Untitled Project'),
        Description: fields.Description || fields.Summary || fields['Project Description'] || 
                    (category === 'Photography' ? 'Photography work from Cochran Films' : ''),
        Category: fields.Category || fields.Type || category,
        'Thumbnail Image': normalizeGithub(rawThumb) || 
                          (category === 'Photography' ? fields.image_url : ''),
        'Is Featured': fields['Is Featured'] || fields.Featured || false,
        playbackUrl: fields['Playback URL'] || fields['Video URL'] || fields.URL || '',
        UploadDate: fields['Created Date'] || fields['Upload Date'] || fields.Date || new Date().toISOString(),
        URL: fields['Website URL'] || fields.URL || fields.Link || '',
        'Tech Stack': fields['Tech Stack'] || fields.Technology || fields.Tools || '',
        Role: fields.Role || fields.Position || fields['My Role'] || '',
        Client: fields.Client || fields['Client Name'] || fields.Company || '',
        Timeline: fields.Timeline || fields.Duration || fields['Project Timeline'] || '',
        Challenges: fields.Challenges || fields['Project Challenges'] || '',
        Results: fields.Results || fields['Project Results'] || '',
        ServiceCategory: category
      };
      
      // Clean up the data
      Object.keys(transformedItem).forEach(key => {
        if (typeof transformedItem[key] === 'string') {
          transformedItem[key] = transformedItem[key].trim();
        }
      });
      
      // Filter out invalid items
      if (!transformedItem.Title || (transformedItem.Title === 'Untitled Project' && category !== 'Photography')) {
        return null;
      }
      
              return transformedItem;
      }).filter(Boolean); // Remove null items
    
    console.log(`✅ Transformed ${transformedRecords.length} valid records for ${category}`);
    return transformedRecords;
    }
  
  showPortfolioLoadingState() {
    const categoryGrids = {
      'Video Production': 'videoProductionGrid',
      'Web Development': 'webDevelopmentGrid',
      'Photography': 'photographyGrid',
      'Brand Development': 'brandDevelopmentGrid'
    };
    
    Object.values(categoryGrids).forEach(gridId => {
      const grid = document.getElementById(gridId);
      if (grid) {
        grid.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-secondary);">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; margin-bottom: 16px; display: block;"></i>
            <p>Loading portfolio items from Airtable...</p>
          </div>
        `;
      }
    });
  }
  
  hidePortfolioLoadingState() {
    // Loading state will be replaced by actual content
  }
  
  showPortfolioErrorState() {
    const categoryGrids = {
      'Video Production': 'videoProductionGrid',
      'Web Development': 'webDevelopmentGrid',
      'Photography': 'photographyGrid',
      'Brand Development': 'brandDevelopmentGrid'
    };
    
    Object.values(categoryGrids).forEach(gridId => {
      const grid = document.getElementById(gridId);
      if (grid) {
        grid.innerHTML = `
          <div style="text-align: center; padding: 40px; color: var(--text-muted);">
            <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 16px; display: block; color: var(--brand-red);"></i>
            <p>Failed to load portfolio data from Airtable</p>
            <small>Please check your Airtable configuration and try refreshing the page</small>
            <br><br>
            <button onclick="window.airtableCMS.refreshData()" style="background: var(--brand-gold); color: #000; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;">
              <i class="fas fa-sync-alt"></i> Retry
            </button>
          </div>
        `;
      }
    });
  }
  
  async refreshData() {
    console.log('🔄 Refreshing Airtable data...');
    try {
      await this.loadAllPortfolioData();
      this.renderPortfolioByCategory();
      console.log('✅ Data refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh data:', error);
      this.showPortfolioErrorState();
    }
  }
  
  initializePortfolioSystem() {
    console.log('🎨 Initializing portfolio system with Airtable data...');
    
    // Set up the existing portfolio functionality
    this.setupPortfolioDisplay();
    this.setupEventHandlers();
    
    // Initialize video popup system
    this.initializeVideoPopups();
    
    // Render the portfolio
    this.renderPortfolioByCategory();
  }
  
  setupPortfolioDisplay() {
    // Portfolio display settings (matching existing code)
    this.itemsPerCategory = 6;
    this.categoryGrids = {
      'Video Production': 'videoProductionGrid',
      'Web Development': 'webDevelopmentGrid',
      'Photography': 'photographyGrid',
      'Brand Development': 'brandDevelopmentGrid'
    };
  }
  
  setupEventHandlers() {
    // Set up load more buttons for each category
    document.querySelectorAll('.load-more-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const serviceCategory = e.target.getAttribute('data-category');
        this.loadMoreForCategory(serviceCategory);
      });
    });
    
    // Set up video modal close button
    const closeVideoBtn = document.getElementById('closeVideo');
    if (closeVideoBtn) {
      closeVideoBtn.addEventListener('click', () => this.closeVideoModal());
    }
    
    // Close video modal on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const videoModal = document.getElementById('videoModal');
        if (videoModal && videoModal.classList.contains('show')) {
          this.closeVideoModal();
        }
      }
    });
    
    // Close video modal when clicking outside
    document.getElementById('videoModal')?.addEventListener('click', (e) => {
      if (e.target.id === 'videoModal') {
        this.closeVideoModal();
      }
    });
  }
  
  // Prefer a usable HTTPS thumbnail. Converts wix:image:// to static wix URLs and
  // supports CSV fields like image_url and thumbnailUrl.
  resolveThumbnailSrc(item) {
    const isHttpUrl = (value) => typeof value === 'string' && /^https?:\/\//i.test(value);
    const isWixImageScheme = (value) => typeof value === 'string' && value.startsWith('wix:image://');
    const coerceToUrl = (value) => {
      if (!value) return '';
      if (typeof value === 'string') return value.trim();
      if (Array.isArray(value) && value.length && value[0]?.url) return String(value[0].url).trim();
      if (typeof value === 'object' && value.url) return String(value.url).trim();
      return '';
    };

    const normalizeWixImageUrl = (value) => {
      if (!isWixImageScheme(value)) return '';
      // Format: wix:image://v1/<mediaIdWithExt>/... -> https://static.wixstatic.com/media/<mediaIdWithExt>
      const match = value.match(/^wix:image:\/\/v1\/([^/]+)/i);
      return match && match[1] ? `https://static.wixstatic.com/media/${match[1]}` : '';
    };
    const normalizeGithub = (url) => {
      if (typeof url === 'string' && url.includes('github.com') && url.includes('/blob/')) {
        return url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
      }
      return url;
    };

    const firstDefined = (...candidates) => {
      for (const c of candidates) {
        const url = coerceToUrl(c);
        if (typeof url === 'string' && url.trim() !== '') return url.trim();
      }
      return '';
    };

    // 1) Prefer explicit HTTPS thumbnailUrl when present
    const directThumb = coerceToUrl(item['thumbnailUrl']);
    if (isHttpUrl(directThumb)) return normalizeGithub(directThumb);

    // 2) Try CSV photography field names (support wix:image conversion too)
    const imageUrl = coerceToUrl(item['image_url']);
    if (isHttpUrl(imageUrl)) return normalizeGithub(imageUrl);
    if (isWixImageScheme(imageUrl)) return normalizeWixImageUrl(imageUrl);
    const imageUrl2 = coerceToUrl(item['Image URL']);
    if (isHttpUrl(imageUrl2)) return normalizeGithub(imageUrl2);
    if (isWixImageScheme(imageUrl2)) return normalizeWixImageUrl(imageUrl2);

    // 3) Handle Wix image scheme in "Thumbnail Image" by converting to static URL
    const thumb = firstDefined(item['Thumbnail Image'], item['Image'], item['Thumbnail']);
    if (isWixImageScheme(thumb)) return normalizeWixImageUrl(thumb);

    // 4) If any of the original fields are already HTTPS, use them
    if (isHttpUrl(thumb)) return normalizeGithub(thumb);
    const imageF = coerceToUrl(item['Image']);
    if (isHttpUrl(imageF)) return normalizeGithub(imageF);
    const thumbF = coerceToUrl(item['Thumbnail']);
    if (isHttpUrl(thumbF)) return normalizeGithub(thumbF);

    // 5) Last resort placeholder
    return 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center';
  }

  createPortfolioItem(item) {
    console.log('🎬 Creating portfolio item:', item.Title, 'Category:', item.ServiceCategory);
    
    const isFeatured = item['Is Featured'] === true || item['Is Featured'] === 'true';
    
    // Handle date parsing with fallback
    let uploadDate;
    try {
      uploadDate = new Date(item['UploadDate']);
      if (isNaN(uploadDate.getTime())) {
        uploadDate = new Date();
      }
    } catch (e) {
      console.warn('Date parsing error for', item['UploadDate'], e);
      uploadDate = new Date();
    }
    
    const formattedDate = uploadDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });

    // Determine if this is a web development item
    const isWebDev = item.ServiceCategory === 'Web Development';
    const hasURL = item.URL && item.URL.trim() !== '';
    const isPhotoOnly = item.ServiceCategory === 'Photography' && (!item.playbackUrl || item.playbackUrl === '');
    
    // Handle thumbnail image with robust resolver
    let thumbnailSrc = this.resolveThumbnailSrc(item);
    if (thumbnailSrc && thumbnailSrc.includes('drive.google.com')) {
      // Convert Google Drive sharing link to direct image URL
      const fileId = thumbnailSrc.match(/\/d\/([a-zA-Z0-9-_]+)/)?.[1];
      if (fileId) {
        thumbnailSrc = `https://drive.google.com/uc?export=view&id=${fileId}`;
      }
    }
    
    // Fallback for web development items if no valid thumbnail
    if (isWebDev && (!thumbnailSrc || thumbnailSrc === '')) {
      thumbnailSrc = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center';
    }

    // For Photography items, render image-only cards (no overlays, titles, or metadata)
    if (isPhotoOnly) {
      return `
        <div class="portfolio-item photo-only" data-category="${item.Category}" data-title="${item.Title || ''}" data-src="${thumbnailSrc}">
          <div class="portfolio-thumbnail">
            <img src="${thumbnailSrc}" alt="${item.Title || 'Photo'}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&fit=crop&crop=center'" />
          </div>
        </div>
      `;
    }

    // Default rendering for video and web items
    return `
      <div class="portfolio-item" data-category="${item.Category}" data-title="${item.Title}">
        <div class="portfolio-thumbnail">
          <img src="${thumbnailSrc}" alt="${item.Title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center'" />
          ${isWebDev && hasURL ? 
            `<div class="portfolio-play" style="background: rgba(16,185,129,0.9);">
              <i class="fa-solid fa-external-link-alt"></i>
            </div>` : 
            `<div class="portfolio-play">
              <i class="fa-solid fa-play"></i>
            </div>`
          }
          ${isFeatured ? '<div class="portfolio-featured"><i class="fa-solid fa-star"></i> Featured</div>' : ''}
        </div>
        <div class="portfolio-content">
          <div class="portfolio-category">
            <i class="fa-solid fa-tag"></i>
            ${item.Category}
          </div>
          <h3 class="portfolio-title">${item.Title}</h3>
          <p class="portfolio-description">${item.Description}</p>
          
          ${isWebDev ? `
            <div class="portfolio-web-details" style="margin: 12px 0; padding: 12px; background: rgba(99,102,241,0.1); border-radius: 8px; border: 1px solid rgba(99,102,241,0.2);">
              ${item.Role ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Role:</strong> ${item.Role}</div>` : ''}
              ${item['Tech Stack'] ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Tech:</strong> <span style="font-size: 12px; color: var(--text-secondary);">${item['Tech Stack']}</span></div>` : ''}
              ${item.Timeline ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Timeline:</strong> ${item.Timeline}</div>` : ''}
            </div>
          ` : ''}
          
          <div class="portfolio-meta">
            <span class="portfolio-date">${formattedDate}</span>
            ${isFeatured ? '<span class="portfolio-featured"><i class="fa-solid fa-star"></i> Featured</span>' : ''}
          </div>
        </div>
      </div>
    `;
  }
  
  renderPortfolioByCategory() {
    // Check if data is loaded
    if (!this.portfolioData || this.portfolioData.length === 0) {
      console.log('Portfolio data not loaded yet, showing error state');
      this.showPortfolioErrorState();
      return;
    }
    
    console.log('🎨 Rendering portfolio with', this.portfolioData.length, 'total items');
    
    // Render each service category separately
    Object.entries(this.categoryGrids).forEach(([serviceCategory, gridId]) => {
      const grid = document.getElementById(gridId);
      if (!grid) {
        console.warn(`Grid not found for category: ${serviceCategory}, gridId: ${gridId}`);
        return;
      }

      // Filter items by service category
      const categoryItems = this.portfolioData.filter(item => 
        item.ServiceCategory === serviceCategory
      );
      
      console.log(`Category: ${serviceCategory}, Items found: ${categoryItems.length}`);

      // Show initial items
      const itemsToShow = categoryItems.slice(0, this.itemsPerCategory);
      grid.innerHTML = itemsToShow.map(item => this.createPortfolioItem(item)).join('');

      // Show/hide load more button for this category
      const loadMoreBtn = grid.parentElement.querySelector('.load-more-btn');
      if (loadMoreBtn) {
        loadMoreBtn.style.display = itemsToShow.length < categoryItems.length ? 'inline-flex' : 'none';
      }

      // Add click handlers for portfolio items
      this.addPortfolioItemClickHandlers(grid);
    });
    
    // After portfolio is rendered, re-initialize video popups
    setTimeout(() => {
      this.initializeVideoPopups();
    }, 100);
  }
  
  addPortfolioItemClickHandlers(grid) {
    grid.querySelectorAll('.portfolio-item').forEach(item => {
      item.addEventListener('click', () => {
        const title = item.getAttribute('data-title');
        const portfolioItem = this.portfolioData.find(p => p.Title === title);
        
        if (portfolioItem) {
          if (portfolioItem.ServiceCategory === 'Web Development' && portfolioItem.URL) {
            // Open web development project in new tab
            window.open(portfolioItem.URL, '_blank');
          } else if (portfolioItem.ServiceCategory === 'Photography') {
            // Open image lightbox for photography
            this.openImageModal(item.getAttribute('data-src') || portfolioItem['Thumbnail Image'], portfolioItem.Title || 'Photo');
          } else if (portfolioItem.playbackUrl) {
            // Open video modal for video production items
            this.openVideoModal(portfolioItem);
          }
        }
      });
    });
  }
  
  loadMoreForCategory(serviceCategory) {
    const gridId = this.categoryGrids[serviceCategory];
    const grid = document.getElementById(gridId);
    if (!grid) return;

    const categoryItems = this.portfolioData.filter(item => 
      item.ServiceCategory === serviceCategory
    );

    const currentItems = grid.children.length;
    const itemsToShow = categoryItems.slice(0, currentItems + this.itemsPerCategory);
    
    grid.innerHTML = itemsToShow.map(item => this.createPortfolioItem(item)).join('');

    // Show/hide load more button
    const loadMoreBtn = grid.parentElement.querySelector('.load-more-btn');
    if (loadMoreBtn) {
      loadMoreBtn.style.display = itemsToShow.length < categoryItems.length ? 'inline-flex' : 'none';
    }

    // Re-add click handlers
    this.addPortfolioItemClickHandlers(grid);
  }
  
  openVideoModal(portfolioItem) {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSource = document.getElementById('videoSource');
    const videoTitleText = document.getElementById('videoTitleText');
    const videoCategory = document.getElementById('videoCategory');
    const videoDescription = document.getElementById('videoDescription');
    const videoDate = document.getElementById('videoDate');
    const videoFeatured = document.getElementById('videoFeatured');
    
    if (!modal || !videoPlayer || !videoSource) return;

    // Set video content
    videoTitleText.textContent = portfolioItem.Title;
    videoCategory.textContent = portfolioItem.Category;
    videoDescription.textContent = portfolioItem.Description;
    
    // Format date
    const uploadDate = new Date(portfolioItem['UploadDate']);
    videoDate.textContent = uploadDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    // Show/hide featured badge
    const isFeatured = portfolioItem['Is Featured'] === true || portfolioItem['Is Featured'] === 'true';
    videoFeatured.style.display = isFeatured ? 'inline-flex' : 'none';
    
    // Set video source
    videoSource.src = portfolioItem.playbackUrl;
    videoPlayer.poster = portfolioItem['Thumbnail Image'];
    
    // Load and play video
    videoPlayer.load();
    
    // Show modal
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    // Focus management
    const closeBtn = document.getElementById('closeVideo');
    if (closeBtn) closeBtn.focus();
  }
  
  openImageModal(src, altText) {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.id = 'imageModal';
    modal.setAttribute('aria-hidden','false');
    modal.innerHTML = `
      <div class="image-panel">
        <div class="image-panel-head">
          <button class="video-close" aria-label="Close image" id="closeImage"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="image-panel-body">
          <div class="photo-container"><img src="${src}" alt="${altText || 'Photo'}" /></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    modal.addEventListener('click', (e)=>{ if(e.target.id==='imageModal') this.closeImageModal(); });
    document.getElementById('closeImage')?.addEventListener('click', () => this.closeImageModal());
    document.addEventListener('keydown', (e) => { if(e.key==='Escape') this.closeImageModal(); });
  }
  
  closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
      document.body.style.overflow = '';
      modal.remove();
    }
  }
  
  closeVideoModal() {
    const modal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (!modal) return;
    
    // Pause and reset video
    if (videoPlayer) {
      videoPlayer.pause();
      videoPlayer.currentTime = 0;
    }
    
    // Hide modal
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    
    // Restore body scrolling
    document.body.style.overflow = '';
  }
  
  fallbackToCSV() {
    // Fallback disabled by request — only load from Airtable.
    console.warn('CSV fallback disabled. Displaying error state.');
    this.showPortfolioErrorState();
  }
  
  async loadCSVFallback() {
    // Disabled: CSV fallback removed. Keeping function for backward compatibility.
    console.warn('loadCSVFallback() called but CSV fallback is disabled.');
    this.showPortfolioErrorState();
  }

  // Normalize CSV rows to the same shape used by transformAirtableData
  normalizeCsvItem(row, category) {
    if (!row) return null;
    const pick = (...keys) => {
      for (const k of keys) {
        if (typeof row[k] === 'string' && row[k].trim() !== '') return row[k].trim();
      }
      return '';
    };

    const title = pick('Title', 'title', 'Name', 'name', 'Project Name', 'caption', 'Caption', 'Video');
    const description = pick('Description', 'description', 'Summary', 'Project Description');
    const categoryValue = pick('Category', 'Type') || category;
    const playbackUrl = pick('Playback URL', 'Video URL', 'URL');
    const url = pick('Website URL', 'URL', 'Link');
    const techStack = pick('Tech Stack', 'Technology', 'Tools');
    const role = pick('Role', 'Position', 'My Role');
    const client = pick('Client', 'Client Name', 'Company');
    const timeline = pick('Timeline', 'Duration', 'Project Timeline');
    const challenges = pick('Challenges', 'Project Challenges');
    const results = pick('Results', 'Project Results');
    const createdAt = pick('Created Date', 'Upload Date', 'Date');
    const isFeatured = pick('Is Featured', 'Featured');

    // Thumbnail candidates, including CSV photography fields
    const thumbnailUrl = pick('thumbnailUrl', 'Thumbnail Image', 'Image', 'Thumbnail', 'image_url', 'Image URL');

    const item = {
      Title: title || (category === 'Photography' ? 'Photo' : 'Untitled Project'),
      Description: description,
      Category: categoryValue,
      'Thumbnail Image': thumbnailUrl,
      'Is Featured': isFeatured === 'true' || isFeatured === true,
      playbackUrl: playbackUrl,
      UploadDate: createdAt || new Date().toISOString(),
      URL: url,
      'Tech Stack': techStack,
      Role: role,
      Client: client,
      Timeline: timeline,
      Challenges: challenges,
      Results: results,
      ServiceCategory: category
    };

    // Discard obviously empty items
    if (!item.Title && !item['Thumbnail Image'] && !item.URL && !item.playbackUrl) {
      return null;
    }
    return item;
  }
  
  async loadCSVFile(filePath) {
    try {
      console.log(`📖 Loading CSV file: ${filePath}`);
      const response = await fetch(filePath);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      console.log(`✅ CSV loaded: ${filePath}, length: ${csvText.length}`);
      
      // Use robust CSV parsing for fallback
      const { rows } = this.parseCSVRows(csvText);
      return rows || [];
      
    } catch (error) {
      console.warn(`⚠️ Failed to load CSV file ${filePath}:`, error);
      return [];
    }
  }
  
  // Robust CSV parser that supports quoted fields with commas and newlines
  parseCSVRows(csvText) {
    try {
      if (!csvText) return { headers: [], rows: [] };
      const rows = [];
      const headers = [];
      let currentField = '';
      let currentRow = [];
      let inQuotes = false;
      let isHeaderParsed = false;
      for (let i = 0; i < csvText.length; i++) {
        const char = csvText[i];
        const next = csvText[i + 1];
        if (char === '"') {
          if (inQuotes && next === '"') {
            currentField += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          currentRow.push(currentField);
          currentField = '';
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
          if (char === '\r' && next === '\n') {
            i++;
          }
          currentRow.push(currentField);
          currentField = '';
          if (currentRow.length > 1 || (currentRow.length === 1 && currentRow[0].trim() !== '')) {
            if (!isHeaderParsed) {
              headers.push(...currentRow.map(h => h.replace(/"/g, '').trim()));
              isHeaderParsed = true;
            } else {
              const obj = {};
              headers.forEach((h, idx) => {
                obj[h] = (currentRow[idx] || '').replace(/"/g, '').trim();
              });
              rows.push(obj);
            }
          }
          currentRow = [];
        } else {
          currentField += char;
        }
      }
      if (currentField.length > 0 || currentRow.length > 0) {
        currentRow.push(currentField);
        if (!isHeaderParsed) {
          headers.push(...currentRow.map(h => h.replace(/"/g, '').trim()));
        } else {
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = (currentRow[idx] || '').replace(/"/g, '').trim();
          });
          rows.push(obj);
        }
      }
      console.log(`📊 Parsed ${rows.length} items from CSV (robust parser)`);
      return { headers, rows };
    } catch (error) {
      console.error('❌ CSV parsing error (robust):', error);
      return { headers: [], rows: [] };
    }
  }

  // ===== VIDEO POPUP SYSTEM =====
  
  initializeVideoPopups() {
    console.log('🎥 Initializing video popup system...');
    
    // Create video popup container if it doesn't exist
    this.createVideoPopupContainer();
    
    // Add click handlers to video items
    this.addVideoClickHandlers();
  }

  createVideoPopupContainer() {
    // Remove existing popup if it exists
    const existingPopup = document.getElementById('videoPopup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup container
    const popupHTML = `
      <div id="videoPopup" class="video-popup-overlay" style="display: none;">
        <div class="video-popup-content">
          <div class="video-popup-header">
            <h2 id="popupTitle" class="popup-title"></h2>
            <button class="popup-close-btn" onclick="window.airtableCMS.closeVideoPopup()">
              <i class="fas fa-times"></i>
            </button>
          </div>
          
          <div class="video-popup-body">
            <div class="video-player-section">
              <div class="video-container">
                <video id="popupVideo" controls preload="metadata">
                  <source id="popupVideoSource" src="" type="video/mp4">
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            
            <div class="video-info-section">
              <div class="video-description">
                <h3>Project Description</h3>
                <p id="popupDescription"></p>
              </div>
              
              <div class="video-details">
                <div class="detail-item">
                  <strong>Category:</strong> <span id="popupCategory"></span>
                </div>
                <div class="detail-item">
                  <strong>Role:</strong> <span id="popupRole"></span>
                </div>
                <div class="detail-item">
                  <strong>Client:</strong> <span id="popupClient"></span>
                </div>
                <div class="detail-item">
                  <strong>Timeline:</strong> <span id="popupTimeline"></span>
                </div>
              </div>
            </div>
            
            <div class="ai-service-card">
              <div class="ai-card-header">
                <div class="ai-icon">
                  <i class="fas fa-robot"></i>
                </div>
                <h3>AI-Powered Service Recommendation</h3>
              </div>
              
              <div class="ai-card-content">
                <div class="ai-stat-grid">
                  <div class="ai-stat-item">
                    <div class="stat-number">500+</div>
                    <div class="stat-label">Happy Clients</div>
                  </div>
                  <div class="ai-stat-item">
                    <div class="stat-number">24-48h</div>
                    <div class="stat-label">Turnaround Time</div>
                  </div>
                  <div class="ai-stat-item">
                    <div class="stat-number">99.9%</div>
                    <div class="stat-label">Satisfaction Rate</div>
                  </div>
                </div>
                
                <div class="ai-recommendation">
                  <h4>Based on this project, we recommend:</h4>
                  <div class="recommendation-tags">
                    <span class="tag">Video Production</span>
                    <span class="tag">Post-Production</span>
                    <span class="tag">Color Grading</span>
                    <span class="tag">Sound Design</span>
                  </div>
                </div>
                
                <div class="ai-cta">
                  <button class="ai-cta-btn primary" onclick="window.airtableCMS.openContactForm('video-production')">
                    <i class="fas fa-play"></i> Start Your Project
                  </button>
                  <button class="ai-cta-btn secondary" onclick="window.airtableCMS.scheduleConsultation()">
                    <i class="fas fa-calendar"></i> Free Consultation
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Insert popup into body
    document.body.insertAdjacentHTML('beforeend', popupHTML);
    
    // Add popup styles
    this.addVideoPopupStyles();
  }

  addVideoPopupStyles() {
    const styleId = 'videoPopupStyles';
    if (document.getElementById(styleId)) return;

    const styles = `
      <style id="${styleId}">
        .video-popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.9);
          backdrop-filter: blur(10px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .video-popup-overlay.show {
          opacity: 1;
        }

        .video-popup-content {
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 20px;
          max-width: 1200px;
          width: 100%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(99, 102, 241, 0.3);
          position: relative;
        }

        .video-popup-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 30px;
          border-bottom: 1px solid rgba(99, 102, 241, 0.2);
          background: linear-gradient(90deg, rgba(99, 102, 241, 0.1) 0%, transparent 100%);
        }

        .popup-title {
          color: #fff;
          font-size: 28px;
          font-weight: 700;
          margin: 0;
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .popup-close-btn {
          background: rgba(99, 102, 241, 0.2);
          border: 1px solid rgba(99, 102, 241, 0.3);
          color: #fff;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 18px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .popup-close-btn:hover {
          background: rgba(99, 102, 241, 0.4);
          transform: scale(1.1);
        }

        .video-popup-body {
          padding: 30px;
        }

        .video-player-section {
          margin-bottom: 30px;
        }

        .video-container {
          position: relative;
          width: 100%;
          border-radius: 15px;
          overflow: hidden;
          background: #000;
        }

        .video-container video {
          width: 100%;
          height: auto;
          display: block;
        }

        .video-info-section {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .video-description h3 {
          color: #fff;
          font-size: 20px;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .video-description p {
          color: #cbd5e1;
          line-height: 1.6;
          font-size: 16px;
        }

        .video-details {
          background: rgba(99, 102, 241, 0.1);
          padding: 20px;
          border-radius: 12px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .detail-item {
          margin-bottom: 12px;
          color: #cbd5e1;
        }

        .detail-item strong {
          color: #fff;
          font-weight: 600;
        }

        .ai-service-card {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          border-radius: 20px;
          padding: 30px;
          border: 1px solid rgba(99, 102, 241, 0.3);
          position: relative;
          overflow: hidden;
        }

        .ai-service-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 30%, rgba(99, 102, 241, 0.05) 50%, transparent 70%);
          animation: shimmer 3s infinite;
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .ai-card-header {
          display: flex;
          align-items: center;
          margin-bottom: 25px;
        }

        .ai-icon {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 24px;
          color: #fff;
        }

        .ai-card-header h3 {
          color: #fff;
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }

        .ai-stat-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 25px;
        }

        .ai-stat-item {
          text-align: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stat-number {
          font-size: 28px;
          font-weight: 800;
          color: #6366f1;
          margin-bottom: 8px;
        }

        .stat-label {
          color: #cbd5e1;
          font-size: 14px;
          font-weight: 500;
        }

        .ai-recommendation {
          margin-bottom: 25px;
        }

        .ai-recommendation h4 {
          color: #fff;
          font-size: 18px;
          margin-bottom: 15px;
          font-weight: 600;
        }

        .recommendation-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .tag {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          color: #fff;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 500;
        }

        .ai-cta {
          display: flex;
          gap: 15px;
          flex-wrap: wrap;
        }

        .ai-cta-btn {
          padding: 12px 24px;
          border-radius: 25px;
          border: none;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .ai-cta-btn.primary {
          background: linear-gradient(45deg, #6366f1, #8b5cf6);
          color: #fff;
        }

        .ai-cta-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
        }

        .ai-cta-btn.secondary {
          background: transparent;
          color: #6366f1;
          border: 2px solid #6366f1;
          cursor: pointer;
        }

        .ai-cta-btn.secondary:hover {
          background: #6366f1;
          color: #fff;
        }

        @media (max-width: 768px) {
          .video-popup-content {
            margin: 10px;
            max-height: 95vh;
          }
          
          .video-info-section {
            grid-template-columns: 1fr;
            gap: 20px;
          }
          
          .ai-stat-grid {
            grid-template-columns: 1fr;
          }
          
          .ai-cta {
            flex-direction: column;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  addVideoClickHandlers() {
    // Specifically target Video Production category items from Portfolio Airtable base
    const videoProductionItems = document.querySelectorAll('[data-category="Video Production"], .portfolio-item[data-service-category="Video Production"], [data-service-category="Video Production"]');
    
    // Also look for items that contain video-related content or URLs
    const potentialVideoItems = document.querySelectorAll('.portfolio-item, .service-item, [class*="video"], [class*="portfolio"]');
    
    let totalVideoItems = 0;
    
    // Process Video Production category items first
    videoProductionItems.forEach(item => {
      if (this.isVideoProductionItem(item)) {
        this.addVideoClickHandler(item);
        totalVideoItems++;
        console.log(`🎬 Added video popup handler to: ${item.textContent?.substring(0, 50)}...`);
      }
    });
    
    // Process other potential video items by checking their content
    potentialVideoItems.forEach(item => {
      // Skip if already processed or if it's not a Video Production item
      if (item.dataset.hasVideoHandler || !this.isVideoProductionItem(item)) return;
      
      if (this.hasVideoContent(item)) {
        this.addVideoClickHandler(item);
        totalVideoItems++;
        console.log(`🎬 Added video popup handler to potential video item: ${item.textContent?.substring(0, 50)}...`);
      }
    });
    
    console.log(`🎬 Added click handlers to ${totalVideoItems} Video Production items`);
    
    // Debug: log what we found
    if (totalVideoItems === 0) {
      console.log('🔍 Debug: No Video Production items found. Available elements:', {
        'Video Production category': document.querySelectorAll('[data-category="Video Production"]').length,
        'Video Production service category': document.querySelectorAll('[data-service-category="Video Production"]').length,
        'portfolio items': document.querySelectorAll('.portfolio-item').length,
        'total portfolio data': this.portfolioData?.filter(item => item.ServiceCategory === 'Video Production').length || 0
      });
    }
  }

  isVideoProductionItem(item) {
    // Check if this item belongs to Video Production category
    const category = item.dataset.category || item.dataset.serviceCategory || '';
    const textContent = item.textContent?.toLowerCase() || '';
    
    // Check explicit category markers
    if (category === 'Video Production') return true;
    
    // Check if item contains video-related text
    const videoKeywords = ['video', 'production', 'film', 'cinematic', 'editing', 'post-production'];
    const hasVideoKeywords = videoKeywords.some(keyword => textContent.includes(keyword));
    
    // Check if item has video URLs or playback URLs
    const hasVideoUrls = item.querySelector('[data-video-url], [data-playback-url], video, [src*=".mp4"], [src*=".mov"]');
    
    return hasVideoKeywords || hasVideoUrls;
  }

  hasVideoContent(item) {
    // Check if item contains video-related content
    const hasVideoUrl = item.querySelector('[data-video-url], video, [src*=".mp4"], [src*=".mov"], [src*=".avi"]');
    const hasVideoText = item.textContent.toLowerCase().includes('video') || item.textContent.toLowerCase().includes('production');
    const hasPlaybackUrl = item.dataset.playbackUrl || item.querySelector('[data-playback-url]');
    
    return hasVideoUrl || hasVideoText || hasPlaybackUrl;
  }

  addVideoClickHandler(item) {
    // Skip if already has handler
    if (item.dataset.hasVideoHandler) return;
    
    item.dataset.hasVideoHandler = 'true';
    
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Extract video data from the item
      const videoData = this.extractVideoData(item);
      if (videoData) {
        this.openVideoPopup(videoData);
      }
    });
    
    // Add visual indicator that it's clickable
    item.style.cursor = 'pointer';
    item.style.transition = 'transform 0.2s ease';
    
    // Add hover effect
    item.addEventListener('mouseenter', () => {
      item.style.transform = 'scale(1.02)';
    });
    
    item.addEventListener('mouseleave', () => {
      item.style.transform = 'scale(1)';
    });
  }

  extractVideoData(item) {
    console.log('🔍 Extracting video data from item:', item);
    
    // Try to extract video data from various sources
    let videoUrl = item.dataset.videoUrl || 
                   item.querySelector('[data-video-url]')?.dataset.videoUrl ||
                   item.querySelector('video source')?.src ||
                   item.querySelector('video')?.src ||
                   item.dataset.playbackUrl ||
                   item.querySelector('[data-playback-url]')?.dataset.playbackUrl;

    // If no direct video URL, try to find it in the portfolio data
    if (!videoUrl) {
      const portfolioItem = this.findPortfolioItemByElement(item);
      if (portfolioItem) {
        videoUrl = portfolioItem.playbackUrl || portfolioItem.URL || portfolioItem['Video'];
        console.log('📹 Found video URL from portfolio data:', videoUrl);
      }
    }

    if (!videoUrl) {
      console.log('❌ No video URL found for item');
      return null;
    }

    // Find the corresponding portfolio data
    const title = item.querySelector('.title, .project-title, h3, h4, .portfolio-title')?.textContent || 
                  item.textContent?.split('\n')[0]?.trim() || 
                  'Untitled Video';
    
    const description = item.querySelector('.description, .project-description, p, .portfolio-description')?.textContent || 
                       item.textContent?.split('\n')[1]?.trim() || 
                       '';
    
    // Look for additional data in the portfolio
    const portfolioItem = this.findPortfolioItemByVideoUrl(videoUrl) || this.findPortfolioItemByElement(item);
    
    console.log('📊 Extracted video data:', {
      title: portfolioItem?.Title || title,
      description: portfolioItem?.Description || description,
      videoUrl: videoUrl,
      category: portfolioItem?.Category || 'Video Production'
    });
    
    return {
      title: portfolioItem?.Title || title,
      description: portfolioItem?.Description || description,
      videoUrl: videoUrl,
      category: portfolioItem?.Category || 'Video Production',
      role: portfolioItem?.Role || '',
      client: portfolioItem?.Client || '',
      timeline: portfolioItem?.Timeline || '',
      playbackUrl: portfolioItem?.playbackUrl || videoUrl
    };
  }

  findPortfolioItemByElement(element) {
    // Try to find portfolio item by element content or attributes
    const elementText = element.textContent?.toLowerCase() || '';
    const elementTitle = element.querySelector('.title, .project-title, h3, h4, .portfolio-title')?.textContent || '';
    
    // Prioritize Video Production items from Portfolio Airtable base
    const videoProductionItems = this.portfolioData?.filter(item => 
      item.ServiceCategory === 'Video Production' || item.Category === 'Video Production'
    ) || [];
    
    // First, try to find exact matches in Video Production category
    const exactMatch = videoProductionItems.find(item => {
      const itemTitle = item.Title?.toLowerCase() || '';
      return itemTitle && elementTitle.toLowerCase().includes(itemTitle.toLowerCase());
    });
    
    if (exactMatch) {
      console.log(`🎬 Found exact Video Production match: ${exactMatch.Title}`);
      return exactMatch;
    }
    
    // Then try to find by content similarity in Video Production category
    const contentMatch = videoProductionItems.find(item => {
      const itemTitle = item.Title?.toLowerCase() || '';
      const itemDescription = item.Description?.toLowerCase() || '';
      
      return (itemTitle && elementText.includes(itemTitle.toLowerCase())) ||
             (itemDescription && elementText.includes(itemDescription.toLowerCase()));
    });
    
    if (contentMatch) {
      console.log(`🎬 Found Video Production content match: ${contentMatch.Title}`);
      return contentMatch;
    }
    
    // Fallback to any portfolio item
    return this.portfolioData?.find(item => {
      const itemTitle = item.Title?.toLowerCase() || '';
      const itemCategory = item.Category?.toLowerCase() || '';
      
      return (itemTitle && elementTitle.toLowerCase().includes(itemTitle.toLowerCase())) ||
             (itemTitle && elementText.includes(itemTitle.toLowerCase()));
    });
  }

  findPortfolioItemByVideoUrl(videoUrl) {
    return this.portfolioData?.find(item => 
      item.playbackUrl === videoUrl || 
      item.URL === videoUrl ||
      item['Video'] === videoUrl
    );
  }

  openVideoPopup(videoData) {
    const popup = document.getElementById('videoPopup');
    if (!popup) return;

    // Populate popup with video data
    document.getElementById('popupTitle').textContent = videoData.title;
    document.getElementById('popupDescription').textContent = videoData.description;
    document.getElementById('popupCategory').textContent = videoData.category;
    document.getElementById('popupRole').textContent = videoData.role || 'Not specified';
    document.getElementById('popupClient').textContent = videoData.client || 'Not specified';
    document.getElementById('popupTimeline').textContent = videoData.timeline || 'Not specified';

    // Set video source
    const videoElement = document.getElementById('popupVideo');
    const videoSource = document.getElementById('popupVideoSource');
    
    if (videoData.playbackUrl) {
      videoSource.src = videoData.playbackUrl;
      videoElement.load();
    }

    // Show popup
    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  closeVideoPopup() {
    const popup = document.getElementById('videoPopup');
    if (!popup) return;

    // Hide popup
    popup.classList.remove('show');
    setTimeout(() => {
      popup.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);

    // Stop video
    const video = document.getElementById('popupVideo');
    if (video) {
      video.pause();
      video.currentTime = 0;
    }
  }

  openContactForm(service) {
    // Scroll to contact form
    const contactForm = document.querySelector('#contact, .contact-form, [data-contact-form]');
    if (contactForm) {
      contactForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Close popup
    this.closeVideoPopup();
  }

  scheduleConsultation() {
    // Open consultation booking or scroll to booking form
    const bookingForm = document.querySelector('#booking, .booking-form, [data-booking-form]');
    if (bookingForm) {
      bookingForm || bookingForm.scrollIntoView({ behavior: 'smooth' });
    }
    
    // Close popup
    this.closeVideoPopup();
  }
}

// Initialize Airtable CMS when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.airtableCMS = new AirtableCMS();
  });
} else {
  window.airtableCMS = new AirtableCMS();
}

// Make refresh function globally accessible
window.refreshAirtableData = function() {
  if (window.airtableCMS) {
    window.airtableCMS.refreshData();
  }
};
