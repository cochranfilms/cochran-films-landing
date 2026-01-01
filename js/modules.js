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
    const moduleFile = `modules/${moduleId.replace('-module', '')}.html`;
    window.moduleLoader.register(moduleId, moduleFile);
  });
  window.__MODULES_MANUALLY_INITIALIZED__ = true;
  window.moduleLoader.loadAll();
});
