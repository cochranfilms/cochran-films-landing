// Service Package Builder System (Recreated from index.html)
function initializeServicePackageBuilder() {
    const serviceItems = document.querySelectorAll('.service-item');
    const packageDropzone = document.getElementById('packageDropzone');
    const selectedServices = document.getElementById('selectedServices');
    const quoteSummary = document.getElementById('quoteSummary');
    const categoryTabs = document.querySelectorAll('.category-tab');
    const generateInvoiceBtn = document.getElementById('generateInvoice');
    const clearPackageBtn = document.getElementById('clearPackage');
    
    let selectedServicesList = [];
    let currentCategory = 'website';
    
    console.log('Initializing Service Package Builder...');
    console.log('Found elements:', {
        serviceItems: serviceItems.length,
        packageDropzone: !!packageDropzone,
        categoryTabs: categoryTabs.length
    });
    
    // Service data with complete Cochran Films pricing
    const serviceData = {
        // Website Development Packages
        'starter-site': { name: 'Starter Site', price: 750, duration: 'Basic SEO setup', icon: 'fas fa-laptop-code', category: 'website' },
        'business-pro-site': { name: 'Business Pro Site', price: 1250, duration: 'Mobile & tablet optimization', icon: 'fas fa-globe', category: 'website' },
        'brand-builder-site': { name: 'Brand Builder Site', price: 2500, duration: 'Full SEO + Analytics', icon: 'fas fa-rocket', category: 'website' },
        
        // Photography Services
        'flash-start': { name: 'Flash Start', price: 350, duration: 'Online Gallery Delivery', icon: 'fas fa-camera', category: 'photography' },
        'prime-exposure': { name: 'Prime Exposure', price: 600, duration: 'Online Gallery + Download', icon: 'fas fa-camera-retro', category: 'photography' },
        'legacy-capture': { name: 'Legacy Capture', price: 900, duration: 'Social Media Highlights', icon: 'fas fa-award', category: 'photography' },
        
        // Video Services
        'hourly-video': { name: 'Hourly Video Service', price: 250, duration: 'Per Hour', icon: 'fas fa-clock', category: 'videography' },
        'event-video-2hr': { name: 'Event Video + 60 Sec Recap', price: 500, duration: '2 Hours', icon: 'fas fa-video', category: 'videography' },
        'commercial-basic': { name: 'Basic Commercial Shoot', price: 750, duration: 'Single Camera, 3 Hours', icon: 'fas fa-ad', category: 'videography' },
        
        // Branding Services
        'logo-design': { name: 'Logo Design', price: 250, duration: 'Color palette & fonts', icon: 'fas fa-palette', category: 'branding' },
        'ignite-brand': { name: 'Ignite Package', price: 900, duration: '2 Branded Graphics', icon: 'fas fa-fire', category: 'branding' },
        'transform-brand': { name: 'Transform Package', price: 3500, duration: '2 Promotional Videos', icon: 'fas fa-magic', category: 'branding' },
        
        // Printing Services
        'quick-print-4x6': { name: 'Quick Print Booth (4x6)', price: 500, duration: '4x6 Prints', icon: 'fas fa-print', category: 'printing' },
        'signature-snap-4x6': { name: 'Signature Snap Station (4x6)', price: 800, duration: 'Table Setup & Lighting', icon: 'fas fa-images', category: 'printing' },
        'legacy-lab-4x6': { name: 'Legacy Lab Experience (4x6)', price: 1100, duration: 'Real-time photo review', icon: 'fas fa-trophy', category: 'printing' },
        
        // Retainer Services
        'fast-frame-monthly': { name: 'Fast Frame (1 Month)', price: 2500, duration: '4 Videos OR 3 Podcasts', icon: 'fas fa-bolt', category: 'retainer' },
        'cinematic-spotlight': { name: 'Cinematic Spotlight (2 Months)', price: 4800, duration: '6 Videos OR 5 Podcasts', icon: 'fas fa-star', category: 'retainer' },
        'masterpiece-collection': { name: 'Masterpiece Collection (3 Months)', price: 7000, duration: '9 Videos OR 7 Podcasts', icon: 'fas fa-trophy', category: 'retainer' }
    };
    
    // Function to filter services by category
    function filterServicesByCategory(category) {
        console.log('=== FILTERING BY CATEGORY ===');
        console.log('Selected category:', category);
        let visibleCount = 0;
        let hiddenCount = 0;
        
        // Get all service items and section headers
        const allItems = document.querySelectorAll('.service-item, .service-section-header');
        console.log(`Found ${allItems.length} total items to filter`);
        
        allItems.forEach((item, index) => {
            const itemCategory = item.dataset.category;
            const itemService = item.dataset.service || 'header';
            
            // Show item only if it matches the selected category
            const shouldShow = category === 'all' || itemCategory === category;
            
            console.log(`Item ${index}: ${itemService} (category: ${itemCategory}) - Should show: ${shouldShow}`);
            
            if (shouldShow) {
                // Force show the item
                item.style.display = 'block';
                item.style.visibility = 'visible';
                item.style.opacity = '1';
                item.classList.remove('hidden');
                
                if (item.classList.contains('service-item')) {
                    visibleCount++;
                    console.log(`✅ SHOWING: ${item.dataset.service} (category: ${itemCategory})`);
                } else {
                    console.log(`✅ SHOWING section header for category: ${itemCategory}`);
                }
            } else {
                // Force hide the item
                item.style.display = 'none';
                item.style.visibility = 'hidden';
                item.style.opacity = '0';
                item.classList.add('hidden');
                
                if (item.classList.contains('service-item')) {
                    hiddenCount++;
                    console.log(`❌ HIDING: ${item.dataset.service} (category: ${itemCategory})`);
                } else {
                    console.log(`❌ HIDING section header for category: ${itemCategory}`);
                }
            }
        });
        
        console.log(`=== FILTERING COMPLETE ===`);
        console.log(`Category: ${category}`);
        console.log(`Visible services: ${visibleCount}`);
        console.log(`Hidden services: ${hiddenCount}`);
        console.log(`Total items processed: ${allItems.length}`);
        
        // Reinitialize listeners after filtering
        setTimeout(() => {
            initializeServiceListeners();
        }, 10);
    }

    // Category tab functionality
    categoryTabs.forEach(tab => {
        console.log('Adding click listener to tab:', tab.dataset.category);
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const category = tab.dataset.category;
            console.log('=== CATEGORY TAB CLICKED ===');
            console.log('Category tab clicked:', category);
            console.log('Tab element:', tab);
            currentCategory = category;
            
            // Update active tab
            categoryTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            console.log('Set active tab to:', category);
            
            // Filter services
            console.log('Calling filterServicesByCategory with:', category);
            filterServicesByCategory(category);
        });
    });
    
    // Initialize with default category after a brief delay to ensure DOM is ready
    setTimeout(() => {
        console.log('=== INITIALIZING CATEGORY FILTER ===');
        console.log('Initial category:', currentCategory);
        
        // Make sure the correct tab is active
        categoryTabs.forEach(t => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-category="${currentCategory}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
            console.log('Set initial active tab to:', currentCategory);
        } else {
            console.log('No active tab found for category:', currentCategory);
        }
        
        // Force initial filtering
        console.log('Running initial category filter...');
        filterServicesByCategory(currentCategory);
    }, 200);
    
    // Drag and drop event handlers
    let isDragging = false;
    
    function handleDragStart(e) {
        console.log('Drag started for service:', e.target.dataset.service);
        const serviceItem = e.target.closest('.service-item');
        serviceItem.classList.add('dragging');
        isDragging = true;
        e.dataTransfer.setData('text/plain', serviceItem.dataset.service);
        e.dataTransfer.effectAllowed = 'copy';
    }
    
    function handleDragEnd(e) {
        console.log('Drag ended');
        const serviceItem = e.target.closest('.service-item');
        serviceItem.classList.remove('dragging');
        
        // Reset drag state after a short delay
        setTimeout(() => {
            isDragging = false;
        }, 100);
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    
    function handleDragEnter(e) {
        e.preventDefault();
        if (packageDropzone) {
            packageDropzone.classList.add('drag-over');
        }
    }
    
    function handleDragLeave(e) {
        if (packageDropzone && !packageDropzone.contains(e.relatedTarget)) {
            packageDropzone.classList.remove('drag-over');
        }
    }
    
    function handleDrop(e) {
        e.preventDefault();
        console.log('=== DROP EVENT TRIGGERED ===');
        console.log('Drop event:', e);
        
        if (packageDropzone) {
            packageDropzone.classList.remove('drag-over');
        }
        
        const serviceId = e.dataTransfer.getData('text/plain');
        console.log('Dropped service ID:', serviceId);
        
        if (serviceId) {
            console.log('Adding service directly to package:', serviceId);
            addServiceToPackage(serviceId);
            showNotification('Service added to package!', 'success');
        } else {
            console.log('No service ID found in drop data');
        }
    }

    // Initialize drag and drop functionality using event delegation
    function initializeServiceListeners() {
        console.log('Initializing service listeners...');
        
        // Remove existing listeners first
        const allServiceItems = document.querySelectorAll('.service-item');
        allServiceItems.forEach(item => {
            // Clone and replace to remove all listeners
            const newItem = item.cloneNode(true);
            item.parentNode.replaceChild(newItem, item);
        });
        
        // Re-get elements after cloning
        const freshServiceItems = document.querySelectorAll('.service-item');
        
        // Add fresh listeners
        freshServiceItems.forEach(item => {
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragend', handleDragEnd);
            item.addEventListener('click', handleServiceClick);
            console.log(`Added listeners to: ${item.dataset.service}`);
        });
        
        console.log(`Added drag and click listeners to ${freshServiceItems.length} service items`);
    }
    
    // Initialize listeners
    initializeServiceListeners();
    
    if (packageDropzone) {
        packageDropzone.addEventListener('dragover', handleDragOver);
        packageDropzone.addEventListener('drop', handleDrop);
        packageDropzone.addEventListener('dragenter', handleDragEnter);
        packageDropzone.addEventListener('dragleave', handleDragLeave);
        console.log('Added drop listeners to package dropzone');
    } else {
        console.error('Package dropzone not found!');
    }
    
    // Button event listeners
    if (generateInvoiceBtn) {
        generateInvoiceBtn.addEventListener('click', generateInvoice);
    }
    if (clearPackageBtn) {
        clearPackageBtn.addEventListener('click', clearPackage);
    }
    
    function addServiceToPackage(serviceId) {
        const service = serviceData[serviceId];
        if (!service) return;
        
        // Check if service is already in package
        const existingService = selectedServicesList.find(s => s.id === serviceId);
        if (existingService) {
            existingService.quantity++;
        } else {
            selectedServicesList.push({
                id: serviceId,
                name: service.name,
                price: service.price,
                duration: service.duration,
                icon: service.icon,
                category: service.category,
                quantity: 1
            });
        }
        
        updatePackageDisplay();
        updateQuoteSummary();
    }
    
    function removeServiceFromPackage(serviceId) {
        console.log('Removing service:', serviceId);
        selectedServicesList = selectedServicesList.filter(s => s.id !== serviceId);
        updatePackageDisplay();
        updateQuoteSummary();
        showNotification('Service removed from package', 'info');
    }
    
    // Make removeServiceFromPackage globally accessible for onclick handlers
    window.removeServiceFromPackage = removeServiceFromPackage;
    
    function updatePackageDisplay() {
        if (selectedServicesList.length === 0) {
            selectedServices.style.display = 'none';
            quoteSummary.style.display = 'none';
            packageDropzone.querySelector('.dropzone-placeholder').style.display = 'block';
        } else {
            selectedServices.style.display = 'block';
            quoteSummary.style.display = 'block';
            packageDropzone.querySelector('.dropzone-placeholder').style.display = 'none';
            
            selectedServices.innerHTML = selectedServicesList.map(service => `
                <div class="selected-service">
                    <div class="selected-service-info">
                        <div class="selected-service-icon">
                            <i class="${service.icon}"></i>
                        </div>
                        <div class="selected-service-details">
                            <h5>${service.name}</h5>
                            <p>${service.duration} - $${service.price}</p>
                        </div>
                    </div>
                    <button class="remove-service" onclick="removeServiceFromPackage('${service.id}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `).join('');
        }
    }
    
    function updateQuoteSummary() {
        const total = selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0);
        
        document.getElementById('quoteTotal').textContent = `${total.toFixed(2)}`;
        
        const breakdown = document.getElementById('quoteBreakdown');
        breakdown.innerHTML = `
            <div class="quote-item">
                <span class="quote-item-label">Subtotal</span>
                <span class="quote-item-value">$${total.toFixed(2)}</span>
            </div>
            <div class="quote-item">
                <span class="quote-item-label">Total</span>
                <span class="quote-item-value">$${total.toFixed(2)}</span>
            </div>
        `;
    }
    
    function clearPackage() {
        selectedServicesList = [];
        updatePackageDisplay();
        updateQuoteSummary();
    }
    
    function generateInvoice() {
        if (selectedServicesList.length === 0) {
            showNotification('Please add services to your package first!', 'error');
            return;
        }
        
        // Create project request data
        const invoiceData = {
            services: selectedServicesList,
            subtotal: selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0),
            total: selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0),
            date: new Date().toISOString(),
            invoiceNumber: 'CF-' + Date.now()
        };
        
        // Send to parent window if in iframe
        if (window.parent !== window) {
            window.parent.postMessage({
                type: 'COCHRAN_QUOTE_SUBMITTED',
                data: invoiceData
            }, '*');
        }
        
        // Show success message
        showNotification('Project request generated! Check your email for details.', 'success');
        
        // Reset package
        clearPackage();
    }
    
    // Handle service card clicks to show detailed information
    function handleServiceClick(e) {
        console.log('=== SERVICE ITEM CLICKED ===');
        console.log('Clicked element:', e.target);
        console.log('Is dragging?', isDragging);
        
        // Don't interfere with drag operations
        if (isDragging) {
            console.log('Drag in progress, skipping click');
            return;
        }
        
        const serviceItem = e.target.closest('.service-item');
        
        if (!serviceItem) {
            console.log('No service item found');
            return;
        }
        
        console.log('Service item found:', serviceItem);
        
        const serviceId = serviceItem.dataset.service;
        console.log('Service ID:', serviceId);
        
        if (serviceId) {
            e.preventDefault();
            e.stopPropagation();
            console.log('Calling addServiceToPackage for:', serviceId);
            addServiceToPackage(serviceId);
            showNotification('Service added to package!', 'success');
        } else {
            console.log('No service ID found on element');
        }
    }
    
    // Simple notification system
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 1000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize the service builder when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeServicePackageBuilder);
} else {
    initializeServicePackageBuilder();
}

// Handle messages from parent window
window.addEventListener('message', (event) => {
    if (event.data.type === 'COCHRAN_RESET_BUILDER') {
        // Reset the builder if requested
        location.reload();
    }
});
