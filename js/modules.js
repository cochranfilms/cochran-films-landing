// Module loading utilities for Cochran Films website
class ModuleLoader {
  constructor() {
    this.modules = [];
    this.loadedModules = new Set();
  }

  // Register a module to be loaded
  register(id, file) {
    this.modules.push({ id, file });
  }

  // Load all registered modules
  async loadAll() {
    console.log('Loading modules...');
    
    const loadPromises = this.modules.map(module => this.loadModule(module));
    
    try {
      await Promise.all(loadPromises);
      console.log('All modules loaded successfully');
      this.onAllModulesLoaded();
    } catch (error) {
      console.error('Error loading modules:', error);
    }
  }

  // Load a single module
  async loadModule(module) {
    try {
      const response = await fetch(module.file);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const html = await response.text();
      const element = document.getElementById(module.id);
      
      if (element) {
        element.innerHTML = html;
        this.loadedModules.add(module.id);
        console.log(`✅ Loaded module: ${module.file}`);
      } else {
        console.warn(`⚠️ Element not found for module: ${module.id}`);
      }
    } catch (error) {
      console.error(`❌ Failed to load module: ${module.file}`, error);
      // Show fallback content or error message
      this.showModuleError(module.id, error);
    }
  }

  // Show error message for failed modules
  showModuleError(moduleId, error) {
    const element = document.getElementById(moduleId);
    if (element) {
      element.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i class="fas fa-exclamation-triangle" style="font-size: 24px; margin-bottom: 16px; display: block; color: var(--brand-red);"></i>
          <p>Failed to load module</p>
          <small>Please refresh the page or check your connection</small>
          <br><br>
          <button onclick="location.reload()" style="background: var(--brand-gold); color: #000; border: none; padding: 8px 16px; border-radius: 8px; cursor: pointer; font-weight: 600;">
            <i class="fas fa-sync-alt"></i> Refresh Page
          </button>
        </div>
      `;
    }
  }

  // Called when all modules are loaded
  onAllModulesLoaded() {
    // Reinitialize core functionality
    if (window.CochranFilmsCore) {
      console.log('Reinitializing core functionality...');
      new window.CochranFilmsCore();
    }

    // Trigger custom event for other scripts
    const event = new CustomEvent('modulesLoaded', {
      detail: { loadedModules: Array.from(this.loadedModules) }
    });
    document.dispatchEvent(event);

    // Initialize any additional functionality
    this.initializeAdditionalFeatures();

    // After everything is in the DOM, rebind builder once more to avoid race conditions
    setTimeout(() => {
      try {
        if (document.querySelector('.service-builder-section')) {
          if (typeof window.initializeServicePackageBuilder === 'function') {
            window.initializeServicePackageBuilder();
          } else if (window.ServiceBuilder && !window.serviceBuilder) {
            window.serviceBuilder = new window.ServiceBuilder();
          }
        }
      } catch (e) {
        console.warn('Service builder post-load init failed:', e);
      }
    }, 50);
  }

  // Initialize additional features after modules are loaded
  initializeAdditionalFeatures() {
    // Mobile nav toggle (works on any page that loads the navigation module)
    try {
      const toggle = document.querySelector('.mobile-menu-toggle');
      const menu = document.querySelector('.nav-menu');
      if (toggle && menu && !toggle.__cfBound) {
        toggle.addEventListener('click', () => {
          menu.classList.toggle('show');
        });
        toggle.__cfBound = true;
      }
    } catch (e) { /* no-op */ }

    // Inject AI blog banner when on blog pages
    try {
      const path = location.pathname;
      const isBlogList = /\/blog\.html$/.test(path);
      const isBlogPost = /\/blog\/post\//.test(path);
      if (isBlogList || isBlogPost) {
        const main = document.querySelector('main.wrapper') || document.querySelector('main');
        if (main && !document.getElementById('ai-blog-banner')) {
          const banner = document.createElement('section');
          banner.id = 'ai-blog-banner';
          banner.style.cssText = 'margin-top:80px; margin-bottom:16px; border:1px solid rgba(99,102,241,0.25); background: linear-gradient(135deg, rgba(15,23,42,0.8), rgba(2,6,23,0.9)); border-radius:16px; padding:16px 18px; color:#e5e7eb';
          const meta = (document.querySelector('h1')?.textContent || '').toLowerCase();
          let tagline = 'Daily insights on web design, filmmaking, video creation, and brand development—curated for creators and founders.';
          if (isBlogPost) {
            if (meta.includes('photo') || meta.includes('aperture') || meta.includes('lens')) tagline = 'You’re reading a photography feature. Expect practical, field-tested tips you can apply on your next shoot.';
            else if (meta.includes('camera') || meta.includes('video') || meta.includes('cinema')) tagline = 'You’re reading a video production piece—gear, workflows, and storytelling that move audiences.';
            else if (meta.includes('web') || meta.includes('vue') || meta.includes('java') || meta.includes('cms')) tagline = 'You’re reading a web and software article—clean architecture, performance, and modern UX patterns.';
            else if (meta.includes('brand') || meta.includes('marketing')) tagline = 'You’re reading a branding strategy brief—positioning, messaging, and systems that scale.';
          }
          banner.innerHTML = `
            <div style="display:flex;gap:14px;align-items:flex-start;">
              <div style="width:42px;height:42px;border-radius:10px;background:rgba(255,178,0,0.15);display:grid;place-items:center;color:#FFB200"><i class="fas fa-wand-magic-sparkles"></i></div>
              <div>
                <h2 style="margin:0 0 6px 0; font-size:18px; font-weight:800; background: linear-gradient(135deg, #fff, #dbeafe); -webkit-background-clip:text; -webkit-text-fill-color:transparent;">Cochran Films Daily Brief</h2>
                <p style="margin:0; color:#cbd5e1;">${tagline}</p>
                <div style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap;">
                  <a href="/blog.html" class="nav-link" style="padding:8px 12px;border-radius:999px;background:rgba(99,102,241,0.1);border:1px solid rgba(99,102,241,0.3);color:#cbd5e1;text-decoration:none;font-weight:700">← Back to Blog</a>
                  <a href="/index2.html#home" class="nav-link" style="padding:8px 12px;border-radius:999px;background:rgba(255,178,0,0.15);border:1px solid rgba(255,178,0,0.35);color:#fef3c7;text-decoration:none;font-weight:800">Home</a>
                </div>
              </div>
            </div>`;
          main.prepend(banner);

          // Add a subtle credit strip under the banner on post pages
          if (isBlogPost) {
            const credit = document.createElement('div');
            credit.style.cssText = 'margin-top:8px;color:#94a3b8;font-size:12px;';
            const src = document.querySelector('a.read-more[href^="http"]')?.getAttribute('href') || '';
            try { const host = src ? new URL(src).hostname.replace(/^www\./,'') : ''; credit.textContent = host ? `Source: ${host} • Curated by Cochran Films` : 'Curated by Cochran Films'; } catch { credit.textContent = 'Curated by Cochran Films'; }
            banner.appendChild(credit);
          }
        }
        // Ensure top spacing so content isn't hidden under fixed nav
        document.querySelectorAll('main.wrapper').forEach(el => {
          const current = window.getComputedStyle(el).paddingTop;
          if (!current || parseInt(current) < 100) {
            el.style.paddingTop = '100px';
          }
        });
      }
    } catch (e) {
      console.warn('AI blog banner injection failed:', e);
    }
    // Portfolio functionality
    if (window.PortfolioManager) {
      new window.PortfolioManager();
    }

    // Service builder functionality (prefer index2 initializer for parity)
    if (document.querySelector('.service-builder-section')) {
      if (!document.querySelector('link[href*="font-awesome"][rel="stylesheet"]')) {
        const fa = document.createElement('link');
        fa.rel = 'stylesheet';
        fa.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css';
        document.head.appendChild(fa);
      }
      if (typeof window.initializeServicePackageBuilder === 'function') {
        window.initializeServicePackageBuilder();
      } else if (window.ServiceBuilder && !window.serviceBuilder) {
        window.serviceBuilder = new window.ServiceBuilder();
      }
    }

    // AI background is now safely auto-initialized in ai-background.js
  }

  // Check if a specific module is loaded
  isModuleLoaded(moduleId) {
    return this.loadedModules.has(moduleId);
  }

  // Get loading progress
  getLoadingProgress() {
    return (this.loadedModules.size / this.modules.length) * 100;
  }
}

// Create global instance
window.moduleLoader = new ModuleLoader();

// Auto-register modules based on DOM elements
document.addEventListener('DOMContentLoaded', () => {
  if (window.__MODULES_MANUALLY_INITIALIZED__) return;
  const moduleElements = document.querySelectorAll('[id$="-module"]');
  moduleElements.forEach(element => {
    const moduleId = element.id;
    const base = (typeof window.__MODULES_BASE_PATH__ === 'string' && window.__MODULES_BASE_PATH__) ? window.__MODULES_BASE_PATH__ : '';
    const moduleFile = `${base}modules/${moduleId.replace('-module', '')}.html`;
    window.moduleLoader.register(moduleId, moduleFile);
  });
  window.__MODULES_MANUALLY_INITIALIZED__ = true;
  window.moduleLoader.loadAll();
});
