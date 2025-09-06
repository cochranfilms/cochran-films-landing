/**
 * Portfolio Management and Filtering
 * Handles portfolio display, filtering, and interactions
 * Reads from Portfolio.csv (Video Production) and Web.csv (Web Development)
 */

class PortfolioManager {
  constructor() {
    this.portfolioItems = [];
    this.filteredItems = [];
    this.currentFilter = 'all';
    this.filters = ['all', 'video-production', 'web-development'];
    
    this.init();
  }

  init() {
    this.loadPortfolioData().then(() => {
      this.renderPortfolioByCategory();
      this.bindCategoryEvents();
    });
  }

  async loadPortfolioData() {
    try {
      // Load both CSV files
      const [portfolioData, webData, photoData] = await Promise.all([
        this.fetchCSV('CMS/Collections/Portfolio.csv'),
        this.fetchCSV('CMS/Collections/Web.csv'),
        this.fetchCSV('CMS/Collections/Photography.csv')
      ]);

      // Process Portfolio.csv (Video Production)
      const videoItems = this.parsePortfolioCSV(portfolioData);
      
      // Process Web.csv (Web Development)
      const webItems = this.parseWebCSV(webData);

      // Process Photography.csv (Photography)
      const photoItems = this.parsePhotographyCSV(photoData);

      // Combine all items
      this.portfolioItems = [...videoItems, ...webItems, ...photoItems];
      this.filteredItems = [...this.portfolioItems];
      
      console.log(`✅ Loaded ${videoItems.length} video projects, ${webItems.length} web projects, and ${photoItems.length} photos`);
      
    } catch (error) {
      console.error('❌ Error loading portfolio data:', error);
      // Fallback to sample data if CSV loading fails
      this.loadSampleData();
    }
  }

  async fetchCSV(filePath) {
    try {
      const url = filePath + (filePath.includes('?') ? '&' : '?') + 'v=' + Date.now();
      const response = await fetch(url, { cache: 'no-cache' });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.text();
    } catch (error) {
      console.warn(`⚠️ Could not load ${filePath}:`, error);
      return null;
    }
  }

  // Safely get a value from a parsed CSV row using multiple possible header names
  getValue(row, possibleKeys) {
    for (const key of possibleKeys) {
      if (row[key] && String(row[key]).trim() !== '') {
        return row[key];
      }
    }
    return '';
  }

  // Normalize typical boolean strings (true/TRUE/1/yes)
  toBoolean(value) {
    if (value === undefined || value === null) return false;
    const normalized = String(value).trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'y' || normalized === 't';
  }

  // Robust CSV parser that supports quoted fields with commas and newlines
  parseCSVRows(csvText) {
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
        // If doubled quote inside quoted field, add a literal quote
        if (inQuotes && next === '"') {
          currentField += '"';
          i++; // skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        currentRow.push(currentField);
        currentField = '';
      } else if ((char === '\n' || char === '\r') && !inQuotes) {
        // End of row
        if (char === '\r' && next === '\n') {
          i++; // handle CRLF
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
    // Flush last row (if file doesn't end with newline)
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
    return { headers, rows };
  }

  parsePortfolioCSV(csvData) {
    if (!csvData) return [];
    try {
      const { rows } = this.parseCSVRows(csvData);
      const items = [];
      rows.forEach((row, idx) => {
        if (row.Title && (row.Category || row.ServiceCategory)) {
          let thumbnail = this.getValue(row, ['thumbnailUrl', 'Thumbnail Image', 'Thumbnail', 'Image']);
          const isFeatured = this.toBoolean(this.getValue(row, ['Is Featured', 'IsFeatured', 'Featured']));
          const categoryText = String(row.Category || row.ServiceCategory || '').toLowerCase();
          const hasVideo = !!(row.playbackUrl || row.Video);
          const isPhoto = categoryText.includes('photo') || (!hasVideo && !!thumbnail);

          if (isPhoto) {
            items.push({
              id: row.ID || `portfolio-photo-${idx + 1}`,
              title: row.Title,
              description: row.Description || '',
              image: thumbnail || this.createPlaceholder(row.Title, '#0ea5e9'),
              category: 'photography',
              tags: [row.Category || 'Photography', 'Photography'],
              link: row.URL || '#',
              featured: isFeatured,
              uploadDate: row.UploadDate,
              ownerName: row.OwnerName
            });
          } else {
            items.push({
              id: row.ID || `portfolio-${idx + 1}`,
              title: row.Title,
              description: row.Description || 'Professional video production work',
              image: thumbnail || this.createPlaceholder(row.Title, '#6366f1'),
              category: 'video-production',
              tags: [row.Category || 'Video Production', 'Video Production'],
              link: row.playbackUrl || row.Video || '#',
              featured: isFeatured,
              categoryRef: row.CategoryRef,
              uploadDate: row.UploadDate,
              ownerName: row.OwnerName
            });
          }
        }
      });
      return items;
    } catch (error) {
      console.error('❌ Error parsing Portfolio CSV:', error);
      return [];
    }
  }

  parseWebCSV(csvData) {
    if (!csvData) return [];
    try {
      const { rows } = this.parseCSVRows(csvData);
      const items = [];
      rows.forEach((row, idx) => {
        if (row.Title && row.Category) {
          let thumb = this.getValue(row, ['Thumbnail Image', 'Thumbnail', 'Image']);
          if (thumb && thumb.includes('github.com') && thumb.includes('/blob/')) {
            thumb = thumb.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
          }
          const isFeatured = this.toBoolean(this.getValue(row, ['Is Featured', 'IsFeatured', 'Featured']));
          items.push({
            id: `web-${idx + 1}`,
            title: row.Title,
            description: row.Description || 'Professional web development project',
            image: thumb || this.createPlaceholder(row.Title, '#10b981'),
            category: 'web-development',
            tags: String(row.Category).split(',').map(cat => cat.trim()).filter(Boolean),
            link: row.URL || '#',
            featured: isFeatured,
            techStack: this.getValue(row, ['Tech Stack', 'TechStack']),
            role: row.Role,
            client: this.getValue(row, ['Client/Company', 'ClientCompany', 'Client']),
            timeline: row.Timeline,
            challenges: row.Challenges,
            results: row.Results
          });
        }
      });
      return items;
    } catch (error) {
      console.error('❌ Error parsing Web CSV:', error);
      return [];
    }
  }

  // New: parse Photography CSV
  parsePhotographyCSV(csvData) {
    if (!csvData) return [];
    try {
      const { rows } = this.parseCSVRows(csvData);
      const items = [];
      rows.forEach((row, idx) => {
        // Accept a variety of header names, including 'image_url'
        let url = this.getValue(row, ['image_url', 'Image URL', 'image', 'img', 'Thumbnail Image', 'Image', 'thumbnailUrl']);

        // If no known key, fall back to the first non-empty cell value
        if (!url) {
          const values = Object.values(row).map(v => (v || '').trim()).filter(Boolean);
          if (values.length > 0) url = values[0];
        }

        if (!url) return; // skip empty rows

        // Normalize GitHub blob URLs to raw
        if (url.includes('github.com') && url.includes('/blob/')) {
          url = url.replace('github.com', 'raw.githubusercontent.com').replace('/blob/', '/');
        }

        // Create a friendly title from filename if none provided
        const explicitTitle = row.Title && row.Title.trim();
        const fallbackTitle = (() => {
          try {
            const pathname = new URL(url).pathname;
            const file = pathname.split('/').pop() || 'Photo';
            return decodeURIComponent(file).replace(/\.[a-zA-Z0-9]+$/, '').replace(/[-_]+/g, ' ');
          } catch (_) { return 'Photo'; }
        })();

        items.push({
          id: `photo-${idx + 1}`,
          title: explicitTitle || fallbackTitle,
          description: row.Description || '',
          image: url,
          category: 'photography',
          tags: ['Photography'],
          link: row.URL || url,
          featured: this.toBoolean(this.getValue(row, ['Is Featured', 'IsFeatured', 'Featured'])),
          uploadDate: row.UploadDate
        });
      });
      return items;
    } catch (error) {
      console.error('❌ Error parsing Photography CSV:', error);
      return [];
    }
  }

  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }

  createPlaceholder(text, color = '#1e293b') {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="${color}"/>
        <text x="200" y="140" font-family="Arial" font-size="18" fill="#64748b" text-anchor="middle" font-weight="bold">
          ${text}
        </text>
        <text x="200" y="170" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle">
          Portfolio Item
        </text>
      </svg>
    `);
  }

  loadSampleData() {
    console.log('📝 Loading sample portfolio data as fallback');
    
    // Sample portfolio data with data URI images
    this.portfolioItems = [
      {
        id: 1,
        title: 'Cochran Films Website',
        description: 'Modern, responsive website showcasing our film production services',
        image: this.createPlaceholder('CF Website', '#6366f1'),
        category: 'web-development',
        tags: ['Web Development', 'Responsive Design', 'Film Production'],
        link: '#',
        featured: true
      },
      {
        id: 2,
        title: 'Corporate Brand Video',
        description: 'Professional corporate branding video for tech startup',
        image: this.createPlaceholder('Brand Video', '#10b981'),
        category: 'video-production',
        tags: ['Video Production', 'Corporate', 'Branding'],
        link: '#',
        featured: false
      }
    ];
    
    this.filteredItems = [...this.portfolioItems];
  }

  bindEvents() {
    // Filter buttons
    const filterContainer = document.querySelector('.portfolio-filters');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-btn')) {
          const filter = e.target.dataset.filter;
          this.setFilter(filter);
        }
      });
    }

    // Portfolio item interactions
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('portfolio-item')) {
        this.openPortfolioModal(e.target.dataset.id);
      }
      
      if (e.target.classList.contains('portfolio-link')) {
        e.preventDefault();
        this.openPortfolioModal(e.target.closest('.portfolio-item').dataset.id);
      }
    });

    // Search functionality
    const searchInput = document.querySelector('.portfolio-search .search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchPortfolio(e.target.value);
      });
    }
  }

  setFilter(filter) {
    this.currentFilter = filter;
    
    // Update active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
    
    // Filter items
    if (filter === 'all') {
      this.filteredItems = [...this.portfolioItems];
    } else {
      this.filteredItems = this.portfolioItems.filter(item => item.category === filter);
    }
    
    this.renderPortfolio();
    this.animatePortfolioItems();
  }

  searchPortfolio(query) {
    if (!query.trim()) {
      this.filteredItems = this.portfolioItems.filter(item => 
        this.currentFilter === 'all' || item.category === this.currentFilter
      );
    } else {
      const searchTerm = query.toLowerCase();
      this.filteredItems = this.portfolioItems.filter(item => {
        const matchesFilter = this.currentFilter === 'all' || item.category === this.currentFilter;
        const matchesSearch = 
          item.title.toLowerCase().includes(searchTerm) ||
          item.description.toLowerCase().includes(searchTerm) ||
          item.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        return matchesFilter && matchesSearch;
      });
    }
    
    this.renderPortfolio();
    this.animatePortfolioItems();
  }

  renderPortfolio() {
    const portfolioContainer = document.querySelector('.portfolio-grid');
    if (!portfolioContainer) return;
    
    if (this.filteredItems.length === 0) {
      portfolioContainer.innerHTML = `
        <div class="no-results">
          <h3>No portfolio items found</h3>
          <p>Try adjusting your search or filter criteria.</p>
        </div>
      `;
      return;
    }
    
    // Create a simple placeholder image data URI
    const placeholderImage = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#1e293b"/>
        <text x="200" y="150" font-family="Arial" font-size="16" fill="#64748b" text-anchor="middle">
          ${this.filteredItems.length} Project${this.filteredItems.length > 1 ? 's' : ''}
        </text>
      </svg>
    `);
    
    portfolioContainer.innerHTML = this.filteredItems.map(item => `
      <div class="portfolio-item" data-id="${item.id}">
        <div class="portfolio-image-container">
          <img src="${item.image}" alt="${item.title}" class="portfolio-image" 
               onerror="this.src='${placeholderImage}'">
          ${item.featured ? '<span class="featured-badge">Featured</span>' : ''}
        </div>
        <div class="portfolio-content">
          <h3 class="portfolio-title">${item.title}</h3>
          <p class="portfolio-description">${item.description}</p>
          <div class="portfolio-tags">
            ${item.tags.map(tag => `<span class="portfolio-tag">${tag}</span>`).join('')}
          </div>
          <a href="${item.link}" class="portfolio-link">View Project →</a>
        </div>
      </div>
    `).join('');
    
    // Update portfolio stats after rendering
    this.updatePortfolioStats();
  }

  // New: Render in index2-style categorized grids
  renderPortfolioByCategory() {
    const categoryGrids = {
      'video-production': document.getElementById('videoProductionGrid'),
      'web-development': document.getElementById('webDevelopmentGrid'),
      'photography': document.getElementById('photographyGrid')
    };

    const hasAnyGrid = Object.values(categoryGrids).some(Boolean);
    if (!hasAnyGrid) {
      // Fallback to original single-grid render (e.g., non-modular pages)
      this.renderPortfolio();
      return;
    }

    // Clear existing
    Object.values(categoryGrids).forEach(grid => { if (grid) grid.innerHTML = ''; });

    const placeholderImage = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="1600" height="900" xmlns="http://www.w3.org/2000/svg">
        <rect width="1600" height="900" fill="#1e293b"/>
        <text x="800" y="450" font-family="Arial" font-size="48" fill="#64748b" text-anchor="middle">Image</text>
      </svg>
    `);

    const createCard = (item) => `
      <div class="portfolio-item" data-id="${item.id}">
        <div class="portfolio-thumbnail">
          <img src="${item.image}" alt="${item.title}" loading="lazy" onerror="this.src='${placeholderImage}'" />
          <div class="portfolio-play${item.category === 'web-development' ? ' web' : ''}">
            <i class="fa-solid ${item.category === 'web-development' ? 'fa-external-link-alt' : 'fa-play'}"></i>
          </div>
          ${item.featured ? '<div class="portfolio-featured"><i class="fa-solid fa-star"></i> Featured</div>' : ''}
        </div>
        <div class="portfolio-content">
          <div class="portfolio-category"><i class="fa-solid fa-tag"></i> ${item.tags?.[0] || (item.category === 'web-development' ? 'Web' : 'Video')}</div>
          <h3 class="portfolio-title">${item.title}</h3>
          <p class="portfolio-description">${item.description}</p>
          <div class="portfolio-meta">
            <span class="portfolio-date">${new Date().toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'})}</span>
            ${item.featured ? '<span class="portfolio-featured"><i class="fa-solid fa-star"></i> Featured</span>' : ''}
          </div>
        </div>
      </div>
    `;

    const videoItems = this.portfolioItems.filter(i => i.category === 'video-production');
    const webItems = this.portfolioItems.filter(i => i.category === 'web-development');
    const photoItems = this.portfolioItems.filter(i => i.category === 'photography');

    if (categoryGrids['video-production']) {
      categoryGrids['video-production'].innerHTML = videoItems.map(createCard).join('');
    }
    if (categoryGrids['web-development']) {
      categoryGrids['web-development'].innerHTML = webItems.map(createCard).join('');
    }
    if (categoryGrids['photography']) {
      categoryGrids['photography'].innerHTML = photoItems.map(item => `
        <div class="portfolio-item photo" data-id="${item.id}" data-src="${item.image}">
          <div class="portfolio-thumbnail photo">
            <img src="${item.image}" alt="${item.title || ''}" loading="lazy" onerror="this.style.display='none'" />
          </div>
        </div>
      `).join('');
    }

    this.bindCardClicks();
  }

  bindCategoryEvents() {
    // Load more buttons (hidden by default, wired for future use)
    document.querySelectorAll('.load-more-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.getAttribute('data-category');
        console.log('Load more requested for', category);
      });
    });
  }

  bindCardClicks() {
    document.querySelectorAll('#videoProductionGrid .portfolio-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        this.openPortfolioModal(id);
      });
    });

    document.querySelectorAll('#webDevelopmentGrid .portfolio-item').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.getAttribute('data-id');
        const item = this.portfolioItems.find(x => String(x.id) === String(id));
        if (item && item.link && item.link !== '#') {
          window.open(item.link, '_blank');
        } else if (item) {
          this.openPortfolioModal(id);
        }
      });
    });

    // Photography: open lightbox
    document.querySelectorAll('#photographyGrid .portfolio-item.photo').forEach(card => {
      card.addEventListener('click', () => {
        const src = card.getAttribute('data-src');
        if (src) {
          this.openPhotoLightbox(src);
        }
      });
    });
  }

  openPhotoLightbox(imageUrl) {
    // Create overlay if not exists
    let overlay = document.getElementById('photoLightbox');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'photoLightbox';
      overlay.className = 'lightbox-overlay';
      overlay.innerHTML = `
        <button class="lightbox-close" aria-label="Close">×</button>
        <img class="lightbox-image" alt="Photography" />
      `;
      document.body.appendChild(overlay);

      // Close interactions
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay || e.target.classList.contains('lightbox-close')) {
          overlay.classList.remove('show');
          document.body.style.overflow = '';
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay.classList.contains('show')) {
          overlay.classList.remove('show');
          document.body.style.overflow = '';
        }
      });
    }

    const img = overlay.querySelector('.lightbox-image');
    if (img) {
      img.src = imageUrl;
    }
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  updatePortfolioStats() {
    const statsContainer = document.querySelector('.portfolio-stats');
    if (!statsContainer) return;
    
    const stats = this.getPortfolioStats();
    const totalProjects = stats.all || 0;
    const videoProjects = stats['video-production'] || 0;
    const webProjects = stats['web-development'] || 0;
    
    // Update the stats display
    const statNumbers = statsContainer.querySelectorAll('.stat-number');
    if (statNumbers.length >= 4) {
      statNumbers[0].textContent = `${totalProjects}+`;
      statNumbers[1].textContent = `${Math.max(25, Math.floor(totalProjects * 0.5))}+`;
      statNumbers[2].textContent = '5+';
      statNumbers[3].textContent = '100%';
    }
    
    // Update labels to be more specific
    const statLabels = statsContainer.querySelectorAll('.stat-label');
    if (statLabels.length >= 4) {
      statLabels[0].textContent = 'Projects Completed';
      statLabels[1].textContent = 'Happy Clients';
      statLabels[2].textContent = 'Years Experience';
      statLabels[3].textContent = 'Client Satisfaction';
    }
  }

  animatePortfolioItems() {
    const items = document.querySelectorAll('.portfolio-item');
    items.forEach((item, index) => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(20px)';
      
      setTimeout(() => {
        item.style.transition = 'all 0.6s ease';
        item.style.opacity = '1';
        item.style.transform = 'translateY(0)';
      }, index * 100);
    });
  }

  openPortfolioModal(itemId) {
    const item = this.portfolioItems.find(i => String(i.id) === String(itemId));
    if (!item) return;
    const modal = document.getElementById('videoModal');
    if (!modal) return;

    const titleEl = document.getElementById('videoTitleText');
    const categoryEl = document.getElementById('videoCategory');
    const descEl = document.getElementById('videoDescription');
    const dateEl = document.getElementById('videoDate');
    const featuredEl = document.getElementById('videoFeatured');
    const player = document.getElementById('videoPlayer');
    const source = document.getElementById('videoSource');

    if (titleEl) titleEl.textContent = item.title || 'Project';
    if (categoryEl) categoryEl.textContent = item.category === 'web-development' ? 'Web Development' : 'Video Production';
    if (descEl) descEl.textContent = item.description || '';
    if (dateEl) dateEl.textContent = item.uploadDate || new Date().toLocaleDateString('en-US', {year:'numeric', month:'short', day:'numeric'});
    if (featuredEl) featuredEl.style.display = item.featured ? 'inline-flex' : 'none';

    // Only set video source for video items
    if (item.category === 'video-production' && item.link && item.link !== '#') {
      if (source) source.src = item.link;
      if (player) { player.load(); }
    } else {
      if (source) source.src = '';
      if (player) { try { player.pause(); } catch(_){} }
    }

    modal.classList.add('show');
  }

  // Public methods for external use
  refreshPortfolio() {
    this.renderPortfolio();
    this.animatePortfolioItems();
  }

  getPortfolioStats() {
    const stats = {};
    this.filters.forEach(filter => {
      if (filter === 'all') {
        stats[filter] = this.portfolioItems.length;
      } else {
        stats[filter] = this.portfolioItems.filter(item => item.category === filter).length;
      }
    });
    return stats;
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.portfolio-section')) {
    window.portfolioManager = new PortfolioManager();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PortfolioManager;
}

// Make the class globally available
window.PortfolioManager = PortfolioManager;
