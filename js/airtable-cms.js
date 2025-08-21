// Airtable CMS Integration for Cochran Films Portfolio
// This file integrates with your existing portfolio structure without changing the styling or layout

/**
 * AirtableCache - Local storage-based caching system for Airtable data
 * Provides intelligent caching with TTL, automatic cleanup, and fallback handling
 */
class AirtableCache {
  constructor() {
    this.cachePrefix = 'airtable_cache_';
    this.defaultTTL = 30 * 60 * 1000; // 30 minutes default
    this.maxCacheSize = 10 * 1024 * 1024; // 10MB max cache size
    
    // Initialize cache cleanup
    this.cleanupExpiredCache();
  }

  /**
   * Generate cache key for a specific category
   */
  getCacheKey(category) {
    return `${this.cachePrefix}${category.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Get cached data for a category
   */
  get(category) {
    try {
      const key = this.getCacheKey(category);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      // Check if cache is expired
      if (data.expiresAt && Date.now() > data.expiresAt) {
        console.log(`🗑️ Cache expired for ${category}, removing...`);
        this.remove(category);
        return null;
      }
      
      console.log(`✅ Cache hit for ${category} (${data.records?.length || 0} records)`);
      return data;
      
    } catch (error) {
      console.warn(`⚠️ Cache read error for ${category}:`, error);
      this.remove(category); // Clean up corrupted cache
      return null;
    }
  }

  /**
   * Set cache data for a category
   */
  set(category, data, ttl = this.defaultTTL) {
    try {
      const key = this.getCacheKey(category);
      const cacheData = {
        data: data,
        expiresAt: Date.now() + ttl,
        cachedAt: Date.now(),
        category: category
      };
      
      // Check cache size before storing
      if (this.getCacheSize() > this.maxCacheSize) {
        console.log('🧹 Cache size limit reached, cleaning up...');
        this.cleanupOldestCache();
      }
      
      localStorage.setItem(key, JSON.stringify(cacheData));
      console.log(`💾 Cached ${category} data (expires in ${Math.round(ttl/1000/60)} minutes)`);
      
      // Store cache metadata for management
      this.updateCacheMetadata(category, cacheData);
      
    } catch (error) {
      console.warn(`⚠️ Cache write error for ${category}:`, error);
      // If localStorage is full, try to clean up and retry
      if (error.name === 'QuotaExceededError') {
        this.cleanupOldestCache();
        try {
          localStorage.setItem(key, JSON.stringify(cacheData));
        } catch (retryError) {
          console.error(`❌ Cache write failed after cleanup for ${category}:`, retryError);
        }
      }
    }
  }

  /**
   * Remove cache for a specific category
   */
  remove(category) {
    try {
      const key = this.getCacheKey(category);
      localStorage.removeItem(key);
      this.removeCacheMetadata(category);
      console.log(`🗑️ Removed cache for ${category}`);
    } catch (error) {
      console.warn(`⚠️ Cache removal error for ${category}:`, error);
    }
  }

  /**
   * Clear all Airtable cache
   */
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.cachePrefix));
      keys.forEach(key => localStorage.removeItem(key));
      
      // Clear cache metadata
      localStorage.removeItem('airtable_cache_metadata');
      
      console.log(`🧹 Cleared ${keys.length} cached items`);
    } catch (error) {
      console.warn('⚠️ Cache clear error:', error);
    }
  }

  /**
   * Check if cache exists and is valid for a category
   */
  has(category) {
    const cached = this.get(category);
    return cached !== null;
  }

  /**
   * Get cache metadata for management
   */
  getCacheMetadata() {
    try {
      const metadata = localStorage.getItem('airtable_cache_metadata');
      return metadata ? JSON.parse(metadata) : {};
    } catch (error) {
      console.warn('⚠️ Cache metadata read error:', error);
      return {};
    }
  }

  /**
   * Update cache metadata
   */
  updateCacheMetadata(category, cacheData) {
    try {
      const metadata = this.getCacheMetadata();
      metadata[category] = {
        cachedAt: cacheData.cachedAt,
        expiresAt: cacheData.expiresAt,
        size: JSON.stringify(cacheData).length
      };
      localStorage.setItem('airtable_cache_metadata', JSON.stringify(metadata));
    } catch (error) {
      console.warn('⚠️ Cache metadata update error:', error);
    }
  }

  /**
   * Remove cache metadata for a category
   */
  removeCacheMetadata(category) {
    try {
      const metadata = this.getCacheMetadata();
      delete metadata[category];
      localStorage.setItem('airtable_cache_metadata', JSON.stringify(metadata));
    } catch (error) {
      console.warn('⚠️ Cache metadata removal error:', error);
    }
  }

  /**
   * Get total cache size in bytes
   */
  getCacheSize() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.cachePrefix));
      return keys.reduce((total, key) => {
        return total + (localStorage.getItem(key)?.length || 0);
      }, 0);
    } catch (error) {
      console.warn('⚠️ Cache size calculation error:', error);
      return 0;
    }
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredCache() {
    try {
      const metadata = this.getCacheMetadata();
      const now = Date.now();
      let cleanedCount = 0;
      
      Object.entries(metadata).forEach(([category, info]) => {
        if (info.expiresAt && now > info.expiresAt) {
          this.remove(category);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        console.log(`🧹 Cleaned up ${cleanedCount} expired cache entries`);
      }
    } catch (error) {
      console.warn('⚠️ Cache cleanup error:', error);
    }
  }

  /**
   * Clean up oldest cache entries when size limit is reached
   */
  cleanupOldestCache() {
    try {
      const metadata = this.getCacheMetadata();
      const entries = Object.entries(metadata)
        .filter(([category, info]) => info.cachedAt)
        .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
      
      // Remove oldest 25% of entries
      const toRemove = Math.ceil(entries.length * 0.25);
      entries.slice(0, toRemove).forEach(([category]) => {
        this.remove(category);
      });
      
      console.log(`🧹 Cleaned up ${toRemove} oldest cache entries`);
    } catch (error) {
      console.warn('⚠️ Oldest cache cleanup error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    try {
      const metadata = this.getCacheMetadata();
      const now = Date.now();
      const totalEntries = Object.keys(metadata).length;
      const expiredEntries = Object.values(metadata).filter(info => 
        info.expiresAt && now > info.expiresAt
      ).length;
      const validEntries = totalEntries - expiredEntries;
      const totalSize = this.getCacheSize();
      
      return {
        totalEntries,
        validEntries,
        expiredEntries,
        totalSizeBytes: totalSize,
        totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
        maxSizeMB: (this.maxCacheSize / 1024 / 1024).toFixed(2)
      };
    } catch (error) {
      console.warn('⚠️ Cache stats error:', error);
      return {};
    }
  }
}

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
      'Photography': 'appP1uFoRWjxPkQ5b',      // Photos CSV
      'Brand Development': 'app9HS0yNn6uyFmJF'  // Brand Development
    };
    
    // Table names (these are typically the sheet names in your Airtable)
    this.tables = {
      'Video Production': 'Imported table',
      'Web Development': 'Imported table',
      'Photography': 'Imported table',
      'Brand Development': 'Brand'
    };

    // Initialize caching system
    this.cache = new AirtableCache();
    
    // Initialize the CMS
    this.init();
  }
  
  async init() {
    console.log('🚀 Initializing Airtable CMS with caching...');
    
    try {
      // Show initial loading state
      this.showPortfolioLoadingState();
      
      // Check if we have any valid cache first
      const cacheStatus = this.getCacheStatus();
      const hasValidCache = Object.values(cacheStatus).some(status => status.cached && !status.isExpired);
      
      if (hasValidCache) {
        console.log('📦 Found valid cache, loading portfolio immediately...');
        // Load portfolio data from cache first
        await this.loadAllPortfolioData();
        
        // Set up portfolio functionality
        this.setupPortfolioDisplay();
        this.setupEventHandlers();
        this.renderPortfolioByCategory();
        
        // Warm up cache in background for next time
        this.warmupCache();
      } else {
        console.log('🔄 No valid cache found, loading fresh data...');
        // Load portfolio data first
        await this.loadAllPortfolioData();
        
        // Set up the existing portfolio functionality
        this.setupPortfolioDisplay();
        this.setupEventHandlers();
        
        // Render the portfolio first
        this.renderPortfolioByCategory();
      }
      
      // Initialize video popup system AFTER portfolio is rendered
      setTimeout(() => {
        this.initializeVideoPopups();
      }, 200);
      
      // Setup cache debugging shortcuts
      this.setupCacheShortcuts();
      
      // Log cache performance metrics
      this.logCachePerformance();
      
      // Log debugging shortcuts
      console.log('🔧 Cache Debug Shortcuts:');
      console.log('   Ctrl+Shift+C: Show cache indicator');
      console.log('   Ctrl+Shift+R: Force refresh with cache clear');
      console.log('   Ctrl+Shift+T: Run performance test');
      console.log('   Ctrl+Shift+U: Run unified API performance test');
      console.log('   window.airtableCacheDebug: Access cache management functions');
      
    } catch (error) {
      console.error('❌ Error during initialization:', error);
      this.showPortfolioErrorState();
    }
  }
  
  async loadAllPortfolioData() {
    console.log('📊 Loading portfolio data from unified API...');
    
    try {
      this.showPortfolioLoadingState();
      
      // Check if we have any valid cache first
      const cacheStatus = this.getCacheStatus();
      const hasValidCache = Object.values(cacheStatus).some(status => status.cached && !status.isExpired);
      
      if (hasValidCache) {
        console.log('📦 Found valid cache, loading portfolio immediately...');
        // Load portfolio data from cache first
        await this.loadPortfolioFromCache();
        
        // Set up portfolio functionality
        this.setupPortfolioDisplay();
        this.setupEventHandlers();
        this.renderPortfolioByCategory();
        
        // Warm up cache in background for next time
        this.warmupCache();
      } else {
        console.log('🔄 No valid cache found, loading fresh data from unified API...');
        // Load portfolio data from unified API
        await this.loadPortfolioFromUnifiedAPI();
        
        // Set up the existing portfolio functionality
        this.setupPortfolioDisplay();
        this.setupEventHandlers();
        
        // Render the portfolio first
        this.renderPortfolioByCategory();
      }
      
      // Hide loading state
      this.hidePortfolioLoadingState();
      
    } catch (error) {
      console.error('❌ Failed to load unified portfolio data:', error);
      this.hidePortfolioLoadingState();
      throw error;
    }
  }

  /**
   * Load portfolio data from unified API endpoint
   */
  async loadPortfolioFromUnifiedAPI() {
    try {
      console.log('🔗 Calling unified portfolio API...');
      const startTime = performance.now();
      
      const response = await fetch(`${this.apiBase}/api/airtable/portfolio`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const loadTime = performance.now() - startTime;
      
      console.log(`✅ Unified API loaded ${data.totalRecords} total records in ${loadTime.toFixed(2)}ms`);
      console.log(`📊 Categories loaded: ${data.categories.join(', ')}`);
      
      if (data.errors && data.errors.length > 0) {
        console.warn('⚠️ Some categories had errors:', data.errors);
      }
      
      // Transform and combine all data
      this.portfolioData = [];
      
      Object.entries(data.data).forEach(([category, categoryData]) => {
        if (categoryData && categoryData.records) {
          const transformedRecords = this.transformAirtableData(categoryData.records, category);
          this.portfolioData.push(...transformedRecords);
          
          // Cache each category separately for granular control
          this.cache.set(category, categoryData, this.getCategoryCacheTTL(category));
          console.log(`💾 Cached ${category} with ${transformedRecords.length} transformed records`);
        }
      });
      
      console.log(`📈 Total portfolio items after transformation: ${this.portfolioData.length}`);
      
    } catch (error) {
      console.error('❌ Failed to load from unified API:', error);
      
      // Fallback to individual API calls if unified endpoint fails
      console.log('🔄 Falling back to individual API calls...');
      await this.loadPortfolioFromIndividualAPIs();
    }
  }

  /**
   * Load portfolio data from individual API endpoints (fallback method)
   */
  async loadPortfolioFromIndividualAPIs() {
    console.log('📊 Loading portfolio data from individual APIs (fallback)...');
    
    try {
      // Load data from all four Airtable bases
      const [videoData, webData, photoData, brandData] = await Promise.all([
        this.loadAirtableData('Video Production'),
        this.loadAirtableData('Web Development'),
        this.loadAirtableData('Photography'),
        this.loadAirtableData('Brand Development')
      ]);
      
      // Combine all data and map to existing portfolio structure
      this.portfolioData = [
        ...videoData.map(item => ({ ...item, ServiceCategory: 'Video Production' })),
        ...webData.map(item => ({ ...item, ServiceCategory: 'Web Development' })),
        ...photoData.map(item => ({ ...item, ServiceCategory: 'Photography' })),
        ...brandData.map(item => ({ ...item, ServiceCategory: 'Brand Development' }))
      ];
      
      console.log(`📈 Loaded ${this.portfolioData.length} total items from individual APIs:`, {
        'Video Production': videoData.length,
        'Web Development': webData.length,
        'Photography': photoData.length,
        'Brand Development': brandData.length
      });
      
    } catch (error) {
      console.error('❌ Failed to load from individual APIs:', error);
      throw error;
    }
  }

  /**
   * Load portfolio data from cache
   */
  async loadPortfolioFromCache() {
    console.log('📦 Loading portfolio data from cache...');
    
    try {
      const categories = Object.keys(this.bases);
      this.portfolioData = [];
      
      categories.forEach(category => {
        const cachedData = this.cache.get(category);
        if (cachedData && cachedData.data && cachedData.data.records) {
          const transformedRecords = this.transformAirtableData(cachedData.data.records, category);
          this.portfolioData.push(...transformedRecords);
          console.log(`📦 Loaded ${transformedRecords.length} ${category} items from cache`);
        }
      });
      
      console.log(`📈 Total portfolio items loaded from cache: ${this.portfolioData.length}`);
      
    } catch (error) {
      console.error('❌ Failed to load from cache:', error);
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
      console.log(`📥 Loading ${category} data...`);
      
      // Check cache first
      const cachedData = this.cache.get(category);
      if (cachedData) {
        console.log(`✅ Serving ${category} from cache (${cachedData.data?.records?.length || 0} records)`);
        return this.transformAirtableData(cachedData.data.records || [], category);
      }
      
      console.log(`🔄 Cache miss for ${category}, fetching from Airtable...`);
      
      // Try to fetch from your Vercel environment
      const apiEndpoint = `${this.apiBase}/api/airtable/${category.toLowerCase().replace(' ', '-')}`;
      console.log(`🔗 Calling API endpoint: ${apiEndpoint}`);
      
      const startTime = performance.now();
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
      const loadTime = performance.now() - startTime;
      
      console.log(`✅ Loaded ${data.records?.length || 0} records for ${category} in ${loadTime.toFixed(2)}ms`);
      
      // Cache the successful response with category-specific TTL
      const cacheTTL = this.getCategoryCacheTTL(category);
      this.cache.set(category, data, cacheTTL);
      
      // Transform Airtable data to match existing portfolio structure
      return this.transformAirtableData(data.records || [], category);
      
    } catch (error) {
      console.error(`❌ Failed to load ${category} data:`, error);
      
      // Try to serve stale cache if available (graceful degradation)
      const staleCache = this.getStaleCache(category);
      if (staleCache) {
        console.log(`⚠️ Serving stale cache for ${category} due to API failure`);
        return this.transformAirtableData(staleCache.data.records || [], category);
      }
      
      // Rethrow to allow global fallback to CSV
      throw error;
    }
  }

  /**
   * Get category-specific cache TTL (some data changes more frequently)
   */
  getCategoryCacheTTL(category) {
    const ttlMap = {
      'Video Production': 45 * 60 * 1000,    // 45 minutes (videos change less frequently)
      'Web Development': 30 * 60 * 1000,     // 30 minutes (websites change moderately)
      'Photography': 20 * 60 * 1000,         // 20 minutes (photos change more frequently)
      'Brand Development': 60 * 60 * 1000     // 60 minutes (brand assets change less frequently)
    };
    
    return ttlMap[category] || this.cache.defaultTTL;
  }

  /**
   * Get stale cache data (expired but still usable for fallback)
   */
  getStaleCache(category) {
    try {
      const key = this.cache.getCacheKey(category);
      const cached = localStorage.getItem(key);
      
      if (!cached) return null;
      
      const data = JSON.parse(cached);
      
      // Allow stale cache up to 2 hours old for fallback
      const maxStaleAge = 2 * 60 * 60 * 1000; // 2 hours
      if (data.cachedAt && (Date.now() - data.cachedAt) < maxStaleAge) {
        console.log(`📦 Found stale cache for ${category} (${Math.round((Date.now() - data.cachedAt) / 1000 / 60)} minutes old)`);
        return data;
      }
      
      return null;
    } catch (error) {
      console.warn(`⚠️ Stale cache read error for ${category}:`, error);
      return null;
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

    // For Brand Development items, render with brand-specific styling
    if (item.ServiceCategory === 'Brand Development') {
      return `
        <div class="portfolio-item brand-development" 
             data-category="${item.Category}" 
             data-service-category="${item.ServiceCategory}"
             data-title="${item.Title}"
             ${item.URL ? `data-url="${item.URL}"` : ''}>
          <div class="portfolio-thumbnail">
            <img src="${thumbnailSrc}" alt="${item.Title}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=320&h=200&fit=crop&crop=center'" />
            ${item.URL ? 
              `<div class="portfolio-play" style="background: rgba(255,178,0,0.9);">
                <i class="fa-solid fa-external-link-alt"></i>
              </div>` : 
              `<div class="portfolio-play" style="background: rgba(255,178,0,0.9);">
                <i class="fa-solid fa-eye"></i>
              </div>`
            }
            ${isFeatured ? '<div class="portfolio-featured"><i class="fa-solid fa-star"></i> Featured</div>' : ''}
          </div>
          <div class="portfolio-content">
            <div class="portfolio-category">
              <i class="fa-solid fa-palette"></i>
              ${item.Category}
            </div>
            <h3 class="portfolio-title">${item.Title}</h3>
            <p class="portfolio-description">${item.Description}</p>
            
            ${item.Client || item.Role || item['Tech Stack'] ? `
              <div class="portfolio-brand-details" style="margin: 12px 0; padding: 12px; background: rgba(255,178,0,0.1); border-radius: 8px; border: 1px solid rgba(255,178,0,0.2);">
                ${item.Client ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Client:</strong> ${item.Client}</div>` : ''}
                ${item.Role ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Role:</strong> ${item.Role}</div>` : ''}
                ${item['Tech Stack'] ? `<div style="margin-bottom: 8px;"><strong style="color: var(--brand-gold);">Tools:</strong> <span style="font-size: 12px; color: var(--text-secondary);">${item['Tech Stack']}</span></div>` : ''}
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

    // Default rendering for video and web items
    const isVideoProduction = item.ServiceCategory === 'Video Production';
    
    return `
      <div class="portfolio-item" 
           data-category="${item.Category}" 
           data-service-category="${item.ServiceCategory}"
           data-title="${item.Title}"
           ${isVideoProduction ? 'data-video-production="true"' : ''}
           ${item.playbackUrl ? `data-playback-url="${item.playbackUrl}"` : ''}
           ${item.URL ? `data-url="${item.URL}"` : ''}>
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
          } else if (portfolioItem.ServiceCategory === 'Brand Development') {
            // Open brand development item in image modal or external link
            if (portfolioItem.URL && portfolioItem.URL.trim() !== '') {
              // If there's a URL, open it in new tab
              window.open(portfolioItem.URL, '_blank');
            } else if (portfolioItem['Thumbnail Image']) {
              // If no URL but has image, open in image modal
              this.openImageModal(portfolioItem['Thumbnail Image'], portfolioItem.Title || 'Brand Development Project');
            }
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
    
    // Check if there are any Video Production items before initializing
    const hasVideoProductionItems = this.portfolioData?.some(item => 
      item.ServiceCategory === 'Video Production' || item.Category === 'Video Production'
    );
    
    if (!hasVideoProductionItems) {
      console.log('🎥 No Video Production items found, skipping video popup initialization');
      return;
    }
    
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
                  <div id="recommendationTags" class="recommendation-tags">
                    <!-- Dynamic recommendations will be populated here -->
                  </div>
                </div>
                
                <div class="ai-cta">
                  <button id="aiCtaBtn" class="ai-cta-btn primary">
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
    console.log('🎬 Starting to add video click handlers...');
    
    // Only target Video Production category items from Portfolio Airtable base
    const videoProductionItems = document.querySelectorAll('[data-video-production="true"], [data-service-category="Video Production"], .portfolio-item[data-service-category="Video Production"]');
    
    console.log('🎬 Found video production items:', videoProductionItems.length);
    
    // Also look for items that contain video-related content or URLs
    const potentialVideoItems = document.querySelectorAll('.portfolio-item, .service-item, [class*="video"], [class*="portfolio"]');
    
    console.log('🎬 Found potential video items:', potentialVideoItems.length);
    
    let totalVideoItems = 0;
    
    // Process Video Production category items first
    videoProductionItems.forEach(item => {
      console.log('🎬 Processing video production item:', item.dataset.serviceCategory, item.dataset.category);
      if (this.isVideoProductionItem(item)) {
        this.addVideoClickHandler(item);
        totalVideoItems++;
        console.log(`🎬 Added video popup handler to Video Production item: ${item.textContent?.substring(0, 50)}...`);
      }
    });
    
    // Process other potential video items by checking their content
    potentialVideoItems.forEach(item => {
      // Skip if already processed or if it's not a Video Production item
      if (item.dataset.hasVideoHandler || !this.isVideoProductionItem(item)) return;
      
      // Only add handlers to items that are actually Video Production category
      const serviceCategory = item.dataset.serviceCategory || item.dataset.category;
      if (serviceCategory && serviceCategory !== 'Video Production') {
        console.log('🎬 Skipping non-Video Production item:', serviceCategory);
        return;
      }
      
      // Additional safety check: verify this is actually a Video Production item from portfolio data
      const portfolioItem = this.findPortfolioItemByElement(item);
      if (portfolioItem && portfolioItem.ServiceCategory !== 'Video Production' && portfolioItem.Category !== 'Video Production') {
        console.log('🎬 Skipping item with non-Video Production portfolio data:', portfolioItem.ServiceCategory);
        return;
      }
      
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
        'data-video-production': document.querySelectorAll('[data-video-production="true"]').length,
        'Video Production service category': document.querySelectorAll('[data-service-category="Video Production"]').length,
        'portfolio items': document.querySelectorAll('.portfolio-item').length,
        'total portfolio data': this.portfolioData?.filter(item => item.ServiceCategory === 'Video Production').length || 0
      });
    }
  }

  isVideoProductionItem(item) {
    // Check if this item belongs to Video Production category
    const isVideoProduction = item.dataset.videoProduction === 'true';
    const serviceCategory = item.dataset.serviceCategory;
    const category = item.dataset.category;
    
    console.log('🔍 Checking if item is Video Production:', {
      isVideoProduction,
      serviceCategory,
      category,
      element: item
    });
    
    // Check explicit Video Production markers - these take priority
    if (isVideoProduction) {
      console.log('✅ Item marked as video production');
      return true;
    }
    if (serviceCategory === 'Video Production') {
      console.log('✅ Item has Video Production service category');
      return true;
    }
    if (category === 'Video Production') {
      console.log('✅ Item has Video Production category');
      return true;
    }
    
    // If we have a category that's NOT Video Production, return false
    if (serviceCategory && serviceCategory !== 'Video Production') {
      console.log('❌ Item has non-Video Production service category:', serviceCategory);
      return false;
    }
    if (category && category !== 'Video Production') {
      console.log('❌ Item has non-Video Production category:', category);
      return false;
    }
    
    // Only check for video content if no explicit category is set
    const textContent = item.textContent?.toLowerCase() || '';
    
    // Check if item contains video-related text
    const videoKeywords = ['video', 'production', 'film', 'cinematic', 'editing', 'post-production'];
    const hasVideoKeywords = videoKeywords.some(keyword => textContent.includes(keyword));
    
    // Check if item has video URLs or playback URLs
    const hasVideoUrls = item.querySelector('[data-video-url], [data-playback-url], video, [src*=".mp4"], [src*=".mov"]');
    const hasPlaybackUrl = item.dataset.playbackUrl;
    
    const result = hasVideoKeywords || hasVideoUrls || hasPlaybackUrl;
    console.log('🔍 Content-based check result:', {
      hasVideoKeywords,
      hasVideoUrls,
      hasPlaybackUrl,
      result
    });
    
    return result;
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
    
    // Additional safety check: ensure this is actually a Video Production item
    if (!this.isVideoProductionItem(item)) {
      console.log('⚠️ Skipping non-Video Production item:', item);
      return;
    }
    
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

    // Additional check: ensure this is actually a Video Production item
    const portfolioItem = this.findPortfolioItemByElement(item);
    if (portfolioItem && portfolioItem.ServiceCategory !== 'Video Production' && portfolioItem.Category !== 'Video Production') {
      console.log('❌ Item is not Video Production category:', portfolioItem.ServiceCategory);
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
    const portfolioItemData = this.findPortfolioItemByVideoUrl(videoUrl) || portfolioItem;
    
    console.log('📊 Extracted video data:', {
      title: portfolioItemData?.Title || title,
      description: portfolioItemData?.Description || description,
      videoUrl: videoUrl,
      category: portfolioItemData?.Category || 'Video Production'
    });
    
    return {
      title: portfolioItemData?.Title || title,
      description: portfolioItemData?.Description || description,
      videoUrl: videoUrl,
      category: portfolioItemData?.Category || 'Video Production',
      role: portfolioItemData?.Role || '',
      client: portfolioItemData?.Client || '',
      timeline: portfolioItemData?.Timeline || '',
      playbackUrl: portfolioItemData?.playbackUrl || videoUrl
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
    // Final safety check: only open for Video Production items
    if (videoData.category && videoData.category.toLowerCase() !== 'video production') {
      console.log('⚠️ Video popup blocked for non-Video Production category:', videoData.category);
      return;
    }
    
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

    // Dynamically populate AI recommendations based on category
    this.populateAIRecommendations(videoData.category);

    // Show popup
    popup.style.display = 'flex';
    setTimeout(() => popup.classList.add('show'), 10);

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  populateAIRecommendations(category) {
    const recommendationTags = document.getElementById('recommendationTags');
    const aiCtaBtn = document.getElementById('aiCtaBtn');
    
    if (!recommendationTags || !aiCtaBtn) return;

    let recommendations = [];
    let ctaText = 'Start Your Project';
    let ctaService = '';

    // Define recommendations based on category
    switch (category?.toLowerCase()) {
      case 'video production':
        recommendations = ['Video Production', 'Post-Production', 'Color Grading', 'Sound Design'];
        ctaText = 'Start Your Video Project';
        ctaService = 'video-production';
        break;
      case 'web development':
        recommendations = ['Web Development', 'UI/UX Design', 'E-commerce Solutions', 'Website Maintenance'];
        ctaText = 'Start Your Web Project';
        ctaService = 'web-development';
        break;
      case 'photography':
        recommendations = ['Photography', 'Photo Editing', 'Product Photography', 'Event Photography'];
        ctaText = 'Start Your Photo Project';
        ctaService = 'photography';
        break;
      case 'graphic design':
        recommendations = ['Graphic Design', 'Brand Identity', 'Marketing Materials', 'Print Design'];
        ctaText = 'Start Your Design Project';
        ctaService = 'design';
        break;
      default:
        // Fallback for unknown categories
        recommendations = ['Professional Services', 'Custom Solutions', 'Consultation', 'Project Planning'];
        ctaText = 'Start Your Project';
        ctaService = 'general';
    }

    // Populate recommendation tags
    recommendationTags.innerHTML = recommendations.map(rec => 
      `<span class="tag">${rec}</span>`
    ).join('');

    // Update CTA button
    aiCtaBtn.innerHTML = `<i class="fas fa-play"></i> ${ctaText}`;
    aiCtaBtn.onclick = () => this.openContactForm(ctaService);
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

  /**
   * Cache management methods
   */
  
  /**
   * Clear all cache data
   */
  clearCache() {
    this.cache.clear();
    console.log('🧹 All Airtable cache cleared');
  }

  /**
   * Clear cache for a specific category
   */
  clearCategoryCache(category) {
    this.cache.remove(category);
    console.log(`🧹 Cache cleared for ${category}`);
  }

  /**
   * Force refresh data for a specific category (bypass cache)
   */
  async forceRefreshCategory(category) {
    console.log(`🔄 Force refreshing ${category} data...`);
    this.cache.remove(category);
    return await this.loadAirtableData(category);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return this.cache.getStats();
  }

  /**
   * Check cache status for all categories
   */
  getCacheStatus() {
    const categories = Object.keys(this.bases);
    const status = {};
    
    categories.forEach(category => {
      const cached = this.cache.has(category);
      const data = this.cache.get(category);
      
      status[category] = {
        cached: cached,
        recordCount: data?.data?.records?.length || 0,
        cachedAt: data?.cachedAt ? new Date(data.cachedAt).toLocaleString() : null,
        expiresAt: data?.expiresAt ? new Date(data.expiresAt).toLocaleString() : null,
        isExpired: data?.expiresAt ? Date.now() > data.expiresAt : true
      };
    });
    
    return status;
  }

  /**
   * Preload all categories into cache (useful for initial page load)
   */
  async preloadCache() {
    console.log('🚀 Preloading all categories into cache...');
    const categories = Object.keys(this.bases);
    
    try {
      await Promise.all(categories.map(category => this.loadAirtableData(category)));
      console.log('✅ Cache preload completed');
    } catch (error) {
      console.warn('⚠️ Cache preload had some issues:', error);
    }
  }

  /**
   * Warm up cache with background refresh
   */
  async warmupCache() {
    console.log('🔥 Warming up cache in background...');
    
    // Don't block the UI, run in background
    setTimeout(async () => {
      try {
        // Use unified API for cache warming
        await this.loadPortfolioFromUnifiedAPI();
        console.log('✅ Cache warmup completed in background using unified API');
      } catch (error) {
        console.warn('⚠️ Background cache warmup failed:', error);
        
        // Fallback to individual APIs if unified fails
        try {
          await this.loadPortfolioFromIndividualAPIs();
          console.log('✅ Cache warmup completed using individual APIs (fallback)');
        } catch (fallbackError) {
          console.warn('⚠️ Fallback cache warmup also failed:', fallbackError);
        }
      }
    }, 1000);
  }

  /**
   * Log cache performance metrics
   */
  logCachePerformance() {
    const stats = this.getCacheStats();
    const status = this.getCacheStatus();
    
    console.log('📊 Cache Performance Summary:');
    console.log(`   Total entries: ${stats.totalEntries}`);
    console.log(`   Valid entries: ${stats.validEntries}`);
    console.log(`   Cache size: ${stats.totalSizeMB}MB / ${stats.maxSizeMB}MB`);
    
    Object.entries(status).forEach(([category, info]) => {
      const statusIcon = info.cached ? (info.isExpired ? '⚠️' : '✅') : '❌';
      console.log(`   ${statusIcon} ${category}: ${info.recordCount} records ${info.cached ? `(cached ${info.cachedAt})` : '(not cached)'}`);
    });
  }

  /**
   * Show cache performance indicator in UI (for debugging)
   */
  showCacheIndicator() {
    const stats = this.getCacheStats();
    const status = this.getCacheStatus();
    
    // Create or update cache indicator
    let indicator = document.getElementById('cache-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'cache-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 80px;
        right: 20px;
        background: rgba(15, 23, 42, 0.95);
        border: 1px solid rgba(99,102,241,0.3);
        border-radius: 12px;
        padding: 16px;
        color: var(--text-primary);
        font-family: monospace;
        font-size: 12px;
        z-index: 10000;
        max-width: 300px;
        backdrop-filter: blur(12px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(indicator);
    }
    
    // Build indicator content
    const content = `
      <div style="margin-bottom: 12px; font-weight: 600; color: var(--brand-gold);">
        🗄️ Cache Status
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: var(--text-secondary);">Size:</span> ${stats.totalSizeMB}MB / ${stats.maxSizeMB}MB
      </div>
      <div style="margin-bottom: 8px;">
        <span style="color: var(--text-secondary);">Entries:</span> ${stats.validEntries}/${stats.totalEntries}
      </div>
      <div style="margin-bottom: 12px;">
        ${Object.entries(status).map(([cat, info]) => {
          const icon = info.cached ? (info.isExpired ? '⚠️' : '✅') : '❌';
          const color = info.cached ? (info.isExpired ? 'var(--brand-amber)' : 'var(--brand-emerald)') : 'var(--text-muted)';
          return `<div style="color: ${color}; margin: 2px 0;">${icon} ${cat}: ${info.recordCount}</div>`;
        }).join('')}
      </div>
      <div style="display: flex; gap: 8px; margin-top: 12px;">
        <button onclick="window.airtableCacheDebug.clearAll()" style="
          background: rgba(239,68,68,0.2);
          border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          cursor: pointer;
        ">Clear All</button>
        <button onclick="window.airtableCacheDebug.logDetails()" style="
          background: rgba(99,102,241,0.2);
          border: 1px solid rgba(99,102,241,0.3);
          color: #6366f1;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          cursor: pointer;
        ">Log</button>
        <button onclick="window.airtableCacheDebug.runUnifiedAPITest()" style="
          background: rgba(16,185,129,0.2);
          border: 1px solid rgba(16,185,129,0.3);
          color: #10b981;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          cursor: pointer;
        ">Test API</button>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: rgba(148,163,184,0.2);
          border: 1px solid rgba(148,163,184,0.3);
          color: #94a3b8;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 10px;
          cursor: pointer;
        ">Close</button>
      </div>
    `;
    
    indicator.innerHTML = content;
  }

  /**
   * Setup keyboard shortcuts for cache debugging
   */
  setupCacheShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+C to show cache indicator
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        this.showCacheIndicator();
        console.log('🗄️ Cache indicator shown (Ctrl+Shift+C)');
      }
      
      // Ctrl+Shift+R to refresh with cache clear
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('🔄 Force refresh with cache clear (Ctrl+Shift+R)');
        this.clearCache();
        this.refreshData();
      }

      // Ctrl+Shift+T to run performance test
      if (e.ctrlKey && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        console.log('🚀 Running performance test (Ctrl+Shift+T)...');
        this.runPerformanceTest();
      }

      // Ctrl+Shift+U to run unified API performance test
      if (e.ctrlKey && e.shiftKey && e.key === 'U') {
        e.preventDefault();
        console.log('🔗 Running unified API performance test (Ctrl+Shift+U)...');
        this.runUnifiedAPITest();
      }
    });
  }

  /**
   * Run performance test to demonstrate caching benefits
   */
  async runPerformanceTest() {
    console.log('🚀 Running cache performance test...');
    
    const testCategory = 'Video Production';
    const iterations = 3;
    const results = {
      withCache: [],
      withoutCache: []
    };
    
    // Test with cache (should be fast)
    console.log('📊 Testing with cache...');
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.loadAirtableData(testCategory);
      const end = performance.now();
      results.withCache.push(end - start);
      console.log(`   Iteration ${i + 1}: ${(end - start).toFixed(2)}ms`);
    }
    
    // Clear cache and test without cache (should be slower)
    console.log('📊 Testing without cache...');
    this.cache.remove(testCategory);
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await this.loadAirtableData(testCategory);
      const end = performance.now();
      results.withoutCache.push(end - start);
      console.log(`   Iteration ${i + 1}: ${(end - start).toFixed(2)}ms`);
    }
    
    // Calculate averages
    const avgWithCache = results.withCache.reduce((a, b) => a + b, 0) / results.withCache.length;
    const avgWithoutCache = results.withoutCache.reduce((a, b) => a + b, 0) / results.withoutCache.length;
    const improvement = ((avgWithoutCache - avgWithCache) / avgWithoutCache * 100).toFixed(1);
    
    console.log('📈 Performance Test Results:');
    console.log(`   With Cache: ${avgWithCache.toFixed(2)}ms average`);
    console.log(`   Without Cache: ${avgWithoutCache.toFixed(2)}ms average`);
    console.log(`   Performance Improvement: ${improvement}% faster with cache`);
    
    // Show results in UI
    this.showPerformanceResults(avgWithCache, avgWithoutCache, improvement);
    
    return { avgWithCache, avgWithoutCache, improvement };
  }

  /**
   * Run unified API performance test
   */
  async runUnifiedAPITest() {
    console.log('🚀 Running unified API performance test...');
    
    const iterations = 3;
    const results = {
      unifiedAPI: [],
      individualAPIs: []
    };
    
    // Test unified API performance
    console.log('📊 Testing unified API...');
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.loadPortfolioFromUnifiedAPI();
        const end = performance.now();
        results.unifiedAPI.push(end - start);
        console.log(`   Iteration ${i + 1}: ${(end - start).toFixed(2)}ms`);
      } catch (error) {
        console.log(`   Iteration ${i + 1}: Failed - ${error.message}`);
        results.unifiedAPI.push(null);
      }
    }
    
    // Test individual APIs performance
    console.log('📊 Testing individual APIs...');
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      try {
        await this.loadPortfolioFromIndividualAPIs();
        const end = performance.now();
        results.individualAPIs.push(end - start);
        console.log(`   Iteration ${i + 1}: ${(end - start).toFixed(2)}ms`);
      } catch (error) {
        console.log(`   Iteration ${i + 1}: Failed - ${error.message}`);
        results.individualAPIs.push(null);
      }
    }
    
    // Calculate averages (excluding failed attempts)
    const validUnified = results.unifiedAPI.filter(time => time !== null);
    const validIndividual = results.individualAPIs.filter(time => time !== null);
    
    if (validUnified.length === 0 || validIndividual.length === 0) {
      console.log('❌ Performance test failed - insufficient valid results');
      return null;
    }
    
    const avgUnified = validUnified.reduce((a, b) => a + b, 0) / validUnified.length;
    const avgIndividual = validIndividual.reduce((a, b) => a + b, 0) / validIndividual.length;
    const improvement = ((avgIndividual - avgUnified) / avgIndividual * 100).toFixed(1);
    
    console.log('📈 Unified API Performance Test Results:');
    console.log(`   Unified API: ${avgUnified.toFixed(2)}ms average`);
    console.log(`   Individual APIs: ${avgIndividual.toFixed(2)}ms average`);
    console.log(`   Performance Improvement: ${improvement}% faster with unified API`);
    
    // Show results in UI
    this.showUnifiedAPIPerformanceResults(avgUnified, avgIndividual, improvement);
    
    return { avgUnified, avgIndividual, improvement };
  }

  /**
   * Show unified API performance test results in UI
   */
  showUnifiedAPIPerformanceResults(unified, individual, improvement) {
    const resultsDiv = document.createElement('div');
    resultsDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.98);
      border: 2px solid var(--brand-indigo);
      border-radius: 16px;
      padding: 24px;
      color: var(--text-primary);
      font-family: monospace;
      font-size: 14px;
      z-index: 10001;
      max-width: 450px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      text-align: center;
    `;
    
    resultsDiv.innerHTML = `
      <div style="margin-bottom: 20px; font-size: 24px; color: var(--brand-indigo);">
        🚀 Unified API Performance Test
      </div>
      <div style="margin-bottom: 16px; text-align: left;">
        <div style="margin-bottom: 8px;">
          <span style="color: var(--brand-indigo);">🔗 Unified API:</span> ${unified.toFixed(2)}ms
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: var(--brand-amber);">📡 Individual APIs:</span> ${individual.toFixed(2)}ms
        </div>
        <div style="margin-bottom: 16px; font-weight: 600; color: var(--brand-emerald);">
          🎯 Improvement: ${improvement}% faster with unified API
        </div>
        <div style="font-size: 12px; color: var(--text-secondary);">
          This test compares the new unified endpoint vs. the old individual API calls
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: var(--brand-indigo);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      ">Close</button>
    `;
    
    document.body.appendChild(resultsDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (resultsDiv.parentElement) {
        resultsDiv.remove();
      }
    }, 8000);
  }

  /**
   * Show performance test results in UI
   */
  showPerformanceResults(withCache, withoutCache, improvement) {
    const resultsDiv = document.createElement('div');
    resultsDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(15, 23, 42, 0.98);
      border: 2px solid var(--brand-gold);
      border-radius: 16px;
      padding: 24px;
      color: var(--text-primary);
      font-family: monospace;
      font-size: 14px;
      z-index: 10001;
      max-width: 400px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      text-align: center;
    `;
    
    resultsDiv.innerHTML = `
      <div style="margin-bottom: 20px; font-size: 24px; color: var(--brand-gold);">
        🚀 Performance Test Results
      </div>
      <div style="margin-bottom: 16px; text-align: left;">
        <div style="margin-bottom: 8px;">
          <span style="color: var(--brand-emerald);">✅ With Cache:</span> ${withCache.toFixed(2)}ms
        </div>
        <div style="margin-bottom: 8px;">
          <span style="color: var(--brand-red);">❌ Without Cache:</span> ${withoutCache.toFixed(2)}ms
        </div>
        <div style="margin-bottom: 16px; font-weight: 600; color: var(--brand-gold);">
          🎯 Improvement: ${improvement}% faster
        </div>
      </div>
      <button onclick="this.parentElement.remove()" style="
        background: var(--brand-gold);
        color: #000;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-weight: 600;
        cursor: pointer;
      ">Close</button>
    `;
    
    document.body.appendChild(resultsDiv);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
      if (resultsDiv.parentElement) {
        resultsDiv.remove();
      }
    }, 8000);
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

// Cache debugging and management functions
window.airtableCacheDebug = {
  // Get cache statistics
  getStats: () => {
    if (window.airtableCMS) {
      return window.airtableCMS.getCacheStats();
    }
    return null;
  },
  
  // Get cache status for all categories
  getStatus: () => {
    if (window.airtableCMS) {
      return window.airtableCMS.getCacheStatus();
    }
    return null;
  },
  
  // Clear all cache
  clearAll: () => {
    if (window.airtableCMS) {
      window.airtableCMS.clearCache();
      console.log('🧹 All cache cleared via debug function');
    }
  },
  
  // Clear cache for specific category
  clearCategory: (category) => {
    if (window.airtableCMS) {
      window.airtableCMS.clearCategoryCache(category);
      console.log(`🧹 Cache cleared for ${category} via debug function`);
    }
  },
  
  // Force refresh specific category
  forceRefresh: async (category) => {
    if (window.airtableCMS) {
      return await window.airtableCMS.forceRefreshCategory(category);
    }
    return null;
  },
  
  // Preload all cache
  preload: async () => {
    if (window.airtableCMS) {
      return await window.airtableCMS.preloadCache();
    }
  },
  
  // Log detailed cache information
  logDetails: () => {
    if (window.airtableCMS) {
      window.airtableCMS.logCachePerformance();
    }
  },

  // Run performance test
  runTest: async () => {
    if (window.airtableCMS) {
      return await window.airtableCMS.runPerformanceTest();
    }
    return null;
  },

  // Run unified API performance test
  runUnifiedAPITest: async () => {
    if (window.airtableCMS) {
      return await window.airtableCMS.runUnifiedAPITest();
    }
    return null;
  }
};

// Enhanced refresh function with cache management
window.refreshAirtableData = function(clearCache = false) {
  if (window.airtableCMS) {
    if (clearCache) {
      console.log('🔄 Refreshing with cache clear...');
      window.airtableCMS.clearCache();
    }
    window.airtableCMS.refreshData();
  }
};
