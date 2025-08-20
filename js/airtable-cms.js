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
      'Video Production': 'Portfolio',
      'Web Development': 'Web',
      'Photography': 'Photos'
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
      // Fallback to existing CSV system if Airtable fails
      this.fallbackToCSV();
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
    
    return records.map(record => {
      const fields = record.fields;
      
      // Map Airtable fields to existing portfolio structure
      const transformedItem = {
        Title: fields.Title || fields.Name || fields['Project Name'] || fields['Video'] || 'Untitled Project',
        Description: fields.Description || fields.Summary || fields['Project Description'] || '',
        Category: fields.Category || fields.Type || category,
        'Thumbnail Image': fields['thumbnailUrl'] || fields['Thumbnail Image'] || fields.Image || fields.Thumbnail || '',
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
      if (!transformedItem.Title || transformedItem.Title === 'Untitled Project') {
        return null;
      }
      
      return transformedItem;
    }).filter(Boolean); // Remove null items
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

    const normalizeWixImageUrl = (value) => {
      if (!isWixImageScheme(value)) return '';
      // Format: wix:image://v1/<mediaIdWithExt>/... -> https://static.wixstatic.com/media/<mediaIdWithExt>
      const match = value.match(/^wix:image:\/\/v1\/([^/]+)/i);
      return match && match[1] ? `https://static.wixstatic.com/media/${match[1]}` : '';
    };

    const firstDefined = (...candidates) => {
      for (const c of candidates) {
        if (typeof c === 'string' && c.trim() !== '') return c.trim();
      }
      return '';
    };

    // 1) Prefer explicit HTTPS thumbnailUrl when present
    if (isHttpUrl(item['thumbnailUrl'])) return item['thumbnailUrl'];

    // 2) Try CSV photography field names (support wix:image conversion too)
    if (isHttpUrl(item['image_url'])) return item['image_url'];
    if (isWixImageScheme(item['image_url'])) return normalizeWixImageUrl(item['image_url']);
    if (isHttpUrl(item['Image URL'])) return item['Image URL'];
    if (isWixImageScheme(item['Image URL'])) return normalizeWixImageUrl(item['Image URL']);

    // 3) Handle Wix image scheme in "Thumbnail Image" by converting to static URL
    const thumb = firstDefined(item['Thumbnail Image'], item['Image'], item['Thumbnail']);
    if (isWixImageScheme(thumb)) return normalizeWixImageUrl(thumb);

    // 4) If any of the original fields are already HTTPS, use them
    if (isHttpUrl(thumb)) return thumb;
    if (isHttpUrl(item['Image'])) return item['Image'];
    if (isHttpUrl(item['Thumbnail'])) return item['Thumbnail'];

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
    console.log('🔄 Falling back to CSV system...');
    
    // Try to load from CSV files as fallback
    this.loadCSVFallback();
  }
  
  async loadCSVFallback() {
    console.log('📁 Attempting to load portfolio data from CSV files...');
    
    try {
      // Show loading state
      this.showPortfolioLoadingState();
      
      // Try to load from existing CSV files
      const [portfolioItems, webItems, photoItems] = await Promise.all([
        this.loadCSVFile('CMS/Collections/Portfolio.csv'),
        this.loadCSVFile('CMS/Collections/Web.csv'),
        this.loadCSVFile('CMS/Collections/Photography.csv')
      ]);
      
      // Normalize and combine all data to match expected structure
      this.portfolioData = [
        ...portfolioItems.map(item => this.normalizeCsvItem(item, 'Video Production')),
        ...webItems.map(item => this.normalizeCsvItem(item, 'Web Development')),
        ...photoItems.map(item => this.normalizeCsvItem(item, 'Photography'))
      ].filter(Boolean);
      
      console.log(`📈 CSV Fallback: Loaded ${this.portfolioData.length} total items`);
      
      // Ensure portfolio display is initialized before rendering
      this.hidePortfolioLoadingState();
      this.setupPortfolioDisplay();
      this.setupEventHandlers();
      this.renderPortfolioByCategory();
      
    } catch (error) {
      console.error('❌ CSV fallback also failed:', error);
      this.showPortfolioErrorState();
    }
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
