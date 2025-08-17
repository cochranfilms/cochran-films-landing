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
    this.selectedItems = [];
    
    this.init();
  }

  init() {
    this.loadBasePackages();
    this.bindEvents();
    this.renderServiceBuilder();
    this.enableDragAndDrop();
    this.bindBuilderControls();
    this.bindCategoryTabs();
    // Ensure initial category matches active tab
    const active = document.querySelector('.category-tab.active');
    const initial = active?.dataset?.category || 'website';
    this.filterServicesByCategory(initial);

    // Also initialize after module injection events just in case
    document.addEventListener('modulesLoaded', () => {
      this.rebind();
    });
  }

  rebind() {
    // Re-wire DnD and tabs if markup was re-injected
    this.enableDragAndDrop();
    this.bindBuilderControls();
    this.bindCategoryTabs();
    const active = document.querySelector('.category-tab.active');
    const initial = active?.dataset?.category || 'website';
    this.filterServicesByCategory(initial);
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
    // Delegated clicks for robustness (support inner icons)
    document.addEventListener('click', (e) => {
      const selectBtn = e.target.closest('.package-select');
      if (selectBtn) {
        const packageId = selectBtn.dataset.package;
        this.selectPackage(packageId);
        this.addSelectedServiceCard(packageId);
        this.updateQuoteBreakdown();
        return;
      }

      const customizeBtn = e.target.closest('.customize-package');
      if (customizeBtn) {
        this.openCustomizer();
        return;
      }

      const addBtn = e.target.closest('.add-service');
      if (addBtn) {
        const serviceId = addBtn.dataset.service;
        this.addCustomService(serviceId);
        return;
      }

      const removeBtn = e.target.closest('.remove-service');
      if (removeBtn) {
        const serviceId = removeBtn.dataset.service;
        // Update price and UI
        if (this.currentPackage && this.currentPackage.id === serviceId) {
          this.resetBuilder();
        } else {
          this.removeCustomService(serviceId);
          removeBtn.closest('.selected-service')?.remove();
          this.updateQuoteBreakdown();
        }
        return;
      }

      // Also allow clicking an item to add it (not only drag)
      const serviceCard = e.target.closest('.service-item');
      if (serviceCard && serviceCard.dataset.service) {
        const id = serviceCard.dataset.service;
        const name = serviceCard.querySelector('.service-info h4')?.textContent?.trim() || 'Service';
        const priceText = serviceCard.querySelector('.service-price')?.textContent || '$0';
        const price = parseInt(String(priceText).replace(/[^0-9]/g, ''), 10) || 0;
        const category = serviceCard.dataset.category || '';
        this.addServiceSelection({ id, name, price, category });
        this.updateQuoteBreakdown();
        return;
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
    // If the module already provides full markup (index2 clone), do not re-render
    const hasProvidedMarkup = document.querySelector('.service-items') && document.querySelector('#packageDropzone');
    if (hasProvidedMarkup) return;
    // Otherwise, fallback to a minimal two-column builder (not used for modular index)
  }

  enableDragAndDrop() {
    const items = document.querySelectorAll('.service-item');
    items.forEach((item) => {
      // ensure draggable attributes exist
      if (!item.hasAttribute('draggable')) item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        e.dataTransfer.effectAllowed = 'copy';
        const id = item.dataset.service || item.dataset.package || '';
        const name = item.querySelector('.service-info h4')?.textContent?.trim() || item.dataset.name || '';
        const priceText = item.querySelector('.service-price')?.textContent || '';
        const price = parseInt(priceText.replace(/[^0-9]/g, ''), 10) || parseInt(item.dataset.price || '0', 10) || 0;
        const payload = { type: 'service', id, name, price };
        try { e.dataTransfer.setData('text/plain', JSON.stringify(payload)); } catch(_) {}
        try { e.dataTransfer.setData('text/id', id); } catch(_) {}
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
    });

    const dropzone = document.querySelector('.package-dropzone');
    if (!dropzone) return;
    const enter = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
    dropzone.addEventListener('dragenter', enter);
    dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropzone.classList.add('drag-over');
    });
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      let data = null;
      try { data = JSON.parse(e.dataTransfer.getData('text/plain') || '{}'); } catch (_) {}
      const dragEl = document.querySelector('.service-item.dragging');
      const id = data?.id || dragEl?.dataset.service || dragEl?.dataset.package;
      if (!id) return;
      const name = data?.name || dragEl?.querySelector('.service-info h4')?.textContent?.trim() || 'Service';
      const priceText = (data?.price ? `$${data.price}` : dragEl?.querySelector('.service-price')?.textContent) || '$0';
      const price = parseInt(String(priceText).replace(/[^0-9]/g, ''), 10) || 0;
      const category = dragEl?.dataset.category || '';
      this.addServiceSelection({ id, name, price, category });
      this.updateQuoteBreakdown();
    });
  }

  bindBuilderControls() {
    const clearBtn = document.getElementById('clearPackage');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.resetBuilder());
    }
    const genBtn = document.getElementById('generateInvoice');
    if (genBtn) {
      genBtn.addEventListener('click', () => this.generateInvoice());
    }
  }

  bindCategoryTabs() {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      if (tab.dataset.bound === '1') return;
      tab.dataset.bound = '1';
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const category = tab.dataset.category || 'website';
        document.querySelectorAll('.category-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        this.filterServicesByCategory(category);
      }, { passive: false });
    });
  }

  filterServicesByCategory(category) {
    const items = document.querySelectorAll('.service-item');
    const headers = document.querySelectorAll('.service-section-header');
    items.forEach(el => {
      const match = category === 'all' || el.dataset.category === category;
      el.style.display = match ? 'flex' : 'none';
      el.classList.toggle('hidden', !match);
    });
    headers.forEach(h => {
      const match = category === 'all' || h.dataset.category === category;
      h.style.display = match ? 'block' : 'none';
      h.classList.toggle('hidden', !match);
    });

    // Ensure service list remains scrollable and visible after filter
    const list = document.getElementById('serviceItems');
    if (list) list.scrollTop = 0;
  }

  addSelectedServiceCard(packageId) {
    const pkg = this.basePackages.find(p => p.id === packageId);
    if (!pkg) return;
    const list = document.querySelector('.selected-services');
    if (!list) return;
    // prevent duplicates
    if (list.querySelector(`[data-selected-id="${packageId}"]`)) return;
    const item = document.createElement('div');
    item.className = 'selected-service';
    item.setAttribute('data-selected-id', packageId);
    item.innerHTML = `
      <div class="selected-service-info">
        <div class="selected-service-icon"><i class="fa-solid fa-layer-group"></i></div>
        <div class="selected-service-details">
          <h5>${pkg.name}</h5>
          <p>Base package</p>
        </div>
      </div>
      <div class="selected-service-actions">
        <span class="item-price">$${pkg.price}</span>
        <button class="remove-service" data-service="${packageId}" aria-label="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    list.appendChild(item);
    this.addServiceSelection({ id: packageId, name: pkg.name, price: pkg.price });
    // hide placeholder visuals
    const placeholder = document.querySelector('.dropzone-placeholder');
    const icon = document.querySelector('.dropzone-icon');
    if (placeholder) placeholder.style.display = 'none';
    if (icon) icon.style.display = 'none';
  }

  addServiceSelection(service) {
    if (!service || !service.id) return;
    if (!Array.isArray(this.selectedItems)) this.selectedItems = [];
    const exists = this.selectedItems.some(s => s.id === service.id);
    if (!exists) this.selectedItems.push(service);
    this.totalPrice = this.selectedItems.reduce((sum, s) => sum + (s.price || 0), 0);
    const list = document.querySelector('.selected-services');
    if (!list) return;
    const already = list.querySelector(`[data-selected-id="${service.id}"]`);
    if (already) return;
    const item = document.createElement('div');
    item.className = 'selected-service';
    item.setAttribute('data-selected-id', service.id);
    item.innerHTML = `
      <div class="selected-service-info">
        <div class="selected-service-icon"><i class="fa-solid fa-layer-group"></i></div>
        <div class="selected-service-details">
          <h5>${service.name}</h5>
          <p>$${service.price}</p>
        </div>
      </div>
      <div class="selected-service-actions">
        <span class="item-price">$${service.price}</span>
        <button class="remove-service" data-service="${service.id}" aria-label="Remove">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    `;
    list.appendChild(item);
    const placeholder = document.querySelector('.dropzone-placeholder');
    const icon = document.querySelector('.dropzone-icon');
    if (placeholder) placeholder.style.display = 'none';
    if (icon) icon.style.display = 'none';
    const quoteSummary = document.getElementById('quoteSummary');
    if (quoteSummary) quoteSummary.style.display = 'block';
  }

  updateQuoteBreakdown() {
    const breakdown = document.getElementById('quoteBreakdown');
    const totalEl = document.getElementById('quoteTotal');
    if (breakdown) {
      const lines = (this.selectedItems || []).map(s => `
        <div class="quote-item">
          <span class="quote-item-label">${s.name}</span>
          <span class="quote-item-value">$${s.price}</span>
        </div>`).join('');
      breakdown.innerHTML = lines || '';
    }
    if (totalEl) totalEl.textContent = `$${this.totalPrice}`;
  }

  resetBuilder() {
    this.currentPackage = null;
    this.totalPrice = 0;
    this.selectedItems = [];
    const list = document.querySelector('.selected-services');
    if (list) list.innerHTML = '';
    document.querySelectorAll('.package-select').forEach(btn => btn.classList.remove('active'));
    const container = document.querySelector('.selected-package');
    if (container) container.innerHTML = '';
    this.updateQuoteBreakdown();
    const placeholder = document.querySelector('.dropzone-placeholder');
    const icon = document.querySelector('.dropzone-icon');
    if (placeholder) placeholder.style.display = '';
    if (icon) icon.style.display = '';
    const quoteSummary = document.getElementById('quoteSummary');
    if (quoteSummary) quoteSummary.style.display = 'none';
  }

  generateInvoice() {
    if (!this.selectedItems || this.selectedItems.length === 0) {
      this.showNotification('Please add services to your package first!', 'error');
      return;
    }
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    const serviceLines = this.selectedItems.map(s => `- ${s.name}: $${s.price}`).join('\n');
    modal.innerHTML = `
      <div class="modal-content">
        <button class="modal-close" aria-label="Close">×</button>
        <div class="modal-header">
          <div class="modal-icon"><i class="fa-solid fa-file-invoice"></i></div>
          <h2>Send Your Project Request</h2>
          <p>Enter your contact details and we'll receive your selected services instantly.</p>
        </div>
        <div class="contact-form">
          <div class="form-group"><label>Full Name</label><input type="text" id="sb_name" required placeholder="Your name"></div>
          <div class="form-group"><label>Email</label><input type="email" id="sb_email" required placeholder="you@example.com"></div>
          <div class="form-group"><label>Phone</label><input type="tel" id="sb_phone" required placeholder="(555) 123-4567"></div>
        </div>
        <div class="form-actions">
          <button class="btn-secondary" id="sb_cancel">Cancel</button>
          <button class="btn-primary" id="sb_send"><i class="fa-solid fa-paper-plane"></i> Send Project</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('.modal-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
    modal.querySelector('#sb_cancel').addEventListener('click', close);
    modal.querySelector('#sb_send').addEventListener('click', async () => {
      const name = document.getElementById('sb_name').value.trim();
      const email = document.getElementById('sb_email').value.trim();
      const phone = document.getElementById('sb_phone').value.trim();
      if (!name || !email) { this.showNotification('Please fill in your name and email.', 'error'); return; }
      try {
        if (typeof emailjs !== 'undefined') {
          await emailjs.send('service_t11yvru', 'template_aluwel1', {
            service: 'Project Generation',
            name,
            email,
            phone,
            notes: `Selected services:\n${serviceLines}\n\nTotal: $${this.totalPrice}`,
            total_amount: `$${this.totalPrice}`,
            title: 'Service Package Request'
          });
          this.showNotification('Project request sent! We\'ll reach out shortly.', 'success');
          close();
          this.resetBuilder();
        } else {
          this.showNotification('EmailJS not available. Please try again later.', 'error');
        }
      } catch (err) {
        console.error(err);
        this.showNotification('Failed to send. Please try again.', 'error');
      }
    });
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
  if (document.querySelector('.service-builder-section') && !window.serviceBuilder) {
    window.serviceBuilder = new ServiceBuilder();
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ServiceBuilder;
}

// Make the class globally available
window.ServiceBuilder = ServiceBuilder;
