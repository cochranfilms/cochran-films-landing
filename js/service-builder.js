/**
 * Service Package Builder
 * Handles dynamic service package creation and customization
 */

class ServiceBuilder {
  constructor() {
    this.basePackages = [];
    this.customPackages = [];
    this.currentPackage = null;
    this.totalPrice = 0;
    
    this.init();
  }

  init() {
    this.loadBasePackages();
    this.bindEvents();
    this.renderServiceBuilder();
  }

  loadBasePackages() {
    // Sample service packages - replace with your actual services
    this.basePackages = [
      {
        id: 'basic',
        name: 'Basic Package',
        price: 999,
        description: 'Essential services for small businesses',
        features: [
          'Website Design & Development',
          'Basic SEO Optimization',
          'Mobile Responsive Design',
          'Contact Form Integration',
          'Basic Analytics Setup',
          '1 Month Support'
        ],
        delivery: '2-3 weeks',
        featured: false
      },
      {
        id: 'professional',
        name: 'Professional Package',
        price: 2499,
        description: 'Comprehensive solution for growing businesses',
        features: [
          'Everything in Basic Package',
          'Advanced SEO & Content Strategy',
          'E-commerce Integration',
          'Social Media Integration',
          'Advanced Analytics & Reporting',
          '3 Months Support',
          'Performance Optimization',
          'Security Implementation'
        ],
        delivery: '4-6 weeks',
        featured: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise Package',
        price: 4999,
        description: 'Full-service solution for established businesses',
        features: [
          'Everything in Professional Package',
          'Custom Application Development',
          'API Integration',
          'Advanced Security Features',
          'Performance Monitoring',
          '6 Months Support',
          'Training & Documentation',
          'Ongoing Maintenance Plan'
        ],
        delivery: '6-8 weeks',
        featured: false
      }
    ];
  }

  bindEvents() {
    // Package selection
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('package-select')) {
        const packageId = e.target.dataset.package;
        this.selectPackage(packageId);
      }
      
      if (e.target.classList.contains('customize-package')) {
        this.openCustomizer();
      }
      
      if (e.target.classList.contains('add-service')) {
        const serviceId = e.target.dataset.service;
        this.addCustomService(serviceId);
      }
      
      if (e.target.classList.contains('remove-service')) {
        const serviceId = e.target.dataset.service;
        this.removeCustomService(serviceId);
      }
    });

    // Form submissions
    const quoteForm = document.querySelector('.quote-form');
    if (quoteForm) {
      quoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.submitQuote();
      });
    }
  }

  selectPackage(packageId) {
    this.currentPackage = this.basePackages.find(pkg => pkg.id === packageId);
    this.totalPrice = this.currentPackage.price;
    
    // Update UI
    document.querySelectorAll('.package-select').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-package="${packageId}"]`).classList.add('active');
    
    this.updatePriceDisplay();
    this.renderSelectedPackage();
  }

  openCustomizer() {
    if (!this.currentPackage) {
      alert('Please select a base package first');
      return;
    }
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h2 class="modal-title">Customize Your Package</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-content">
          <div class="customizer-content">
            <div class="base-package-info">
              <h3>Base Package: ${this.currentPackage.name}</h3>
              <p>Starting Price: $${this.currentPackage.price}</p>
            </div>
            
            <div class="additional-services">
              <h4>Additional Services</h4>
              <div class="service-options">
                ${this.getAdditionalServicesHTML()}
              </div>
            </div>
            
            <div class="total-price">
              <h3>Total: $<span id="custom-total">${this.totalPrice}</span></h3>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-button secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
          <button class="modal-button primary" onclick="serviceBuilder.applyCustomizations()">Apply Changes</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    modal.querySelector('.modal-close').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });
  }

  getAdditionalServicesHTML() {
    const additionalServices = [
      { id: 'seo', name: 'Advanced SEO Package', price: 299, description: 'Comprehensive SEO optimization' },
      { id: 'analytics', name: 'Analytics & Reporting', price: 199, description: 'Advanced analytics setup' },
      { id: 'security', name: 'Security Enhancement', price: 399, description: 'Enhanced security features' },
      { id: 'performance', name: 'Performance Optimization', price: 299, description: 'Speed and performance improvements' },
      { id: 'maintenance', name: 'Ongoing Maintenance', price: 99, description: 'Monthly maintenance plan' },
      { id: 'training', name: 'Training & Documentation', price: 199, description: 'User training and documentation' }
    ];
    
    return additionalServices.map(service => `
      <div class="service-option">
        <div class="service-info">
          <h5>${service.name}</h5>
          <p>${service.description}</p>
        </div>
        <div class="service-controls">
          <span class="service-price">$${service.price}</span>
          <button class="add-service" data-service="${service.id}" data-price="${service.price}">
            Add
          </button>
        </div>
      </div>
    `).join('');
  }

  addCustomService(serviceId) {
    const button = document.querySelector(`[data-service="${serviceId}"]`);
    const price = parseInt(button.dataset.price);
    
    this.totalPrice += price;
    button.textContent = 'Added';
    button.disabled = true;
    button.classList.add('added');
    
    document.getElementById('custom-total').textContent = this.totalPrice;
  }

  removeCustomService(serviceId) {
    const button = document.querySelector(`[data-service="${serviceId}"]`);
    const price = parseInt(button.dataset.price);
    
    this.totalPrice -= price;
    button.textContent = 'Add';
    button.disabled = false;
    button.classList.remove('added');
    
    document.getElementById('custom-total').textContent = this.totalPrice;
  }

  applyCustomizations() {
    // Close modal
    document.querySelector('.modal-overlay').remove();
    
    // Update main display
    this.updatePriceDisplay();
    this.renderSelectedPackage();
    
    // Show success message
    this.showNotification('Package customized successfully!', 'success');
  }

  updatePriceDisplay() {
    const priceElement = document.querySelector('.total-price');
    if (priceElement) {
      priceElement.innerHTML = `
        <h2>Total Price: $${this.totalPrice}</h2>
        <p>Base Package: ${this.currentPackage.name}</p>
      `;
    }
  }

  renderSelectedPackage() {
    const container = document.querySelector('.selected-package');
    if (!container || !this.currentPackage) return;
    
    container.innerHTML = `
      <div class="selected-package-content">
        <h3>Selected Package: ${this.currentPackage.name}</h3>
        <p class="package-description">${this.currentPackage.description}</p>
        <div class="package-details">
          <div class="detail-item">
            <strong>Delivery Time:</strong> ${this.currentPackage.delivery}
          </div>
          <div class="detail-item">
            <strong>Features:</strong> ${this.currentPackage.features.length} included
          </div>
        </div>
        <div class="package-actions">
          <button class="customize-package">Customize Package</button>
          <button class="get-quote">Get Quote</button>
        </div>
      </div>
    `;
  }

  renderServiceBuilder() {
    const container = document.querySelector('.service-builder-grid');
    if (!container) return;
    
    container.innerHTML = this.basePackages.map(pkg => `
      <div class="service-package ${pkg.featured ? 'featured' : ''}">
        <h3 class="package-name">${pkg.name}</h3>
        <div class="package-price">
          <span class="currency">$</span>${pkg.price}
          <span class="period">/one-time</span>
        </div>
        <p class="package-description">${pkg.description}</p>
        <ul class="package-features">
          ${pkg.features.map(feature => `<li>${feature}</li>`).join('')}
        </ul>
        <div class="package-delivery">
          <strong>Delivery:</strong> ${pkg.delivery}
        </div>
        <button class="package-button package-select" data-package="${pkg.id}">
          Select Package
        </button>
      </div>
    `).join('');
  }

  submitQuote() {
    if (!this.currentPackage) {
      this.showNotification('Please select a package first', 'error');
      return;
    }
    
    const formData = new FormData(document.querySelector('.quote-form'));
    const quoteData = {
      package: this.currentPackage.name,
      totalPrice: this.totalPrice,
      customerInfo: Object.fromEntries(formData),
      timestamp: new Date().toISOString()
    };
    
    // Here you would typically send this to your backend
    console.log('Quote submitted:', quoteData);
    
    this.showNotification('Quote submitted successfully! We\'ll contact you soon.', 'success');
    
    // Reset form
    document.querySelector('.quote-form').reset();
  }

  showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  // Public methods
  getPackageInfo(packageId) {
    return this.basePackages.find(pkg => pkg.id === packageId);
  }

  calculateCustomPrice(basePrice, additionalServices) {
    return basePrice + additionalServices.reduce((total, service) => total + service.price, 0);
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.service-builder-section')) {
    window.serviceBuilder = new ServiceBuilder();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceBuilder;
}

// Make the class globally available
window.ServiceBuilder = ServiceBuilder;
