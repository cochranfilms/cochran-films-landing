// Service Package Builder System
    const SPB_STORAGE_KEY = 'cf-spb-draft-v1';
    let invoiceCreateInFlight = false;

    async function initializeServicePackageBuilder() {
      const serviceItems = document.querySelectorAll('.service-item');
      const packageDropzone = document.getElementById('packageDropzone');
      const selectedServices = document.getElementById('selectedServices');
      const quoteSummary = document.getElementById('quoteSummary');
      const categoryTabs = document.querySelectorAll('.category-tab');
      const generateInvoiceBtn = document.getElementById('generateInvoice');
      const clearPackageBtn = document.getElementById('clearPackage');
      const quoteEmptyHint = document.getElementById('quoteEmptyHint');
      const catalogSearch = document.getElementById('catalogSearch');
      
      let selectedServicesList = [];
      let currentCategory = 'website';
      let lastAddedServiceId = null;
      let catalogSearchQuery = '';
      
      const dropzoneEmpty = document.getElementById('dropzoneEmpty');
      const dropzoneAddMore = document.getElementById('dropzoneAddMore');
      const packageServiceCount = document.getElementById('packageServiceCount');

      const fallbackServiceData = {
        // Website Development Packages
        'starter-site': { name: 'Starter Site', price: 750, duration: '1-page scroll layout', icon: 'fas fa-laptop-code', category: 'website' },
        'business-pro-site': { name: 'Business Pro Site', price: 1250, duration: '3–5 fully designed pages', icon: 'fas fa-globe', category: 'website' },
        'brand-builder-site': { name: 'Brand Builder Site', price: 2500, duration: '6–10 page branded website', icon: 'fas fa-rocket', category: 'website' },
        'white-label-launch': { name: 'White-Label Launch System', price: 2500, setupFee: 2500, monthlyFee: 199, duration: 'Agency partner · setup + monthly', icon: 'fas fa-users-gear', category: 'website', subcategory: 'white-label', billing: { type: 'subscription', interval: 'month', model: 'setup_then_monthly', envPriceKey: 'STRIPE_PRICE_WHITE_LABEL_LAUNCH' } },
        'white-label-growth': { name: 'White-Label Growth System', price: 4500, setupFee: 4500, monthlyFee: 349, duration: 'Agency partner · setup + monthly', icon: 'fas fa-chart-line', category: 'website', subcategory: 'white-label', featured: true, billing: { type: 'subscription', interval: 'month', model: 'setup_then_monthly', envPriceKey: 'STRIPE_PRICE_WHITE_LABEL_GROWTH' } },
        'white-label-domination': { name: 'White-Label Domination System', price: 8500, setupFee: 8500, monthlyFee: 699, duration: 'Agency partner · setup + monthly', icon: 'fas fa-crown', category: 'website', subcategory: 'white-label', billing: { type: 'subscription', interval: 'month', model: 'setup_then_monthly', envPriceKey: 'STRIPE_PRICE_WHITE_LABEL_DOMINATION' } },

        // Photography Packages
        'flash-start': { name: 'Flash Start', price: 350, duration: '1 hour coverage', icon: 'fas fa-camera', category: 'photography' },
        'prime-exposure': { name: 'Prime Exposure', price: 600, duration: '2 hours coverage', icon: 'fas fa-camera-retro', category: 'photography' },
        'legacy-capture': { name: 'Legacy Capture', price: 900, duration: '3 hours coverage', icon: 'fas fa-award', category: 'photography' },

        // Videography — Hourly & Add-ons
        'hourly-video': { name: 'General Hourly Rate', price: 250, hourly: true, hourlyRate: 250, maxHours: 16, duration: 'Per hour', icon: 'fas fa-clock', category: 'videography' },
        'raw-files': { name: 'Raw Files (Additional)', price: 300, duration: 'Full project files', icon: 'fas fa-file-video', category: 'videography' },

        // Events
        'event-video-2hr': { name: '2 Hours + 60 Sec. Recap', price: 500, duration: '2 hours', icon: 'fas fa-video', category: 'videography' },
        'event-video-3hr': { name: '3 Hours + 60 Sec. Recap', price: 750, duration: '3 hours', icon: 'fas fa-film', category: 'videography' },
        'event-video-5hr': { name: '5 Hours + 60–90 Sec. Recap', price: 1250, duration: '5 hours', icon: 'fas fa-camera', category: 'videography' },
        'event-video-8hr-no-edit': { name: '8 Hours — No Edits', price: 2000, duration: '8 hours', icon: 'fas fa-video-camera', category: 'videography' },
        'event-video-8hr-recap': { name: '8 Hours + 60 Sec. Recap', price: 2200, duration: '8 hours', icon: 'fas fa-film', category: 'videography' },

        // Live Production
        'live-production-3hr': { name: '3 Hours + Production Edit', price: 2000, duration: 'Up to 3 cameras', icon: 'fas fa-broadcast-tower', category: 'videography' },
        'live-production-5hr': { name: '5 Hours + Production Edit', price: 3000, duration: 'Up to 3 cameras', icon: 'fas fa-satellite-dish', category: 'videography' },
        'live-production-8hr': { name: '8 Hours + Production Edit', price: 4000, duration: 'Up to 3 cameras', icon: 'fas fa-tower-broadcast', category: 'videography' },

        // Podcast
        'podcast-1hr': { name: '1 Hour Podcast + Edits (2 Cams)', price: 750, duration: '1 hour', icon: 'fas fa-podcast', category: 'videography' },
        'podcast-2hr': { name: '2 Hour Podcast + Edits (2 Cams)', price: 1000, duration: '2 hours', icon: 'fas fa-microphone', category: 'videography' },
        'podcast-3hr': { name: '3 Hour Podcast + Edits (2 Cams)', price: 1500, duration: '3 hours', icon: 'fas fa-headphones', category: 'videography' },
        'podcast-shoot-only': { name: 'Podcast Shoot Only', price: 250, hourly: true, hourlyRate: 250, maxHours: 12, duration: 'Per hour', icon: 'fas fa-camera-retro', category: 'videography' },
        'podcast-extra-camera': { name: 'Podcast Extra Camera', price: 100, hourly: true, hourlyRate: 100, maxHours: 12, duration: 'Per hour', icon: 'fas fa-video', category: 'videography' },

        // Commercials
        'commercial-basic': { name: 'Basic Shoot (No Direction)', price: 750, duration: 'Single camera, 3 hrs', icon: 'fas fa-ad', category: 'videography' },
        'commercial-edit': { name: 'Shoot + Edit (No Direction)', price: 1500, duration: '3–5 hrs + edit', icon: 'fas fa-cut', category: 'videography' },
        'commercial-directed': { name: 'Directed Shoot', price: 2500, duration: 'Pre-production + 4–6 hrs + edit', icon: 'fas fa-bullhorn', category: 'videography' },
        'commercial-full': { name: 'Full Commercial Package', price: 5500, duration: 'Full creative direction + crew', icon: 'fas fa-crown', category: 'videography' },

        // Monthly Content Packages
        'fast-frame-monthly': { name: 'Fast Frame (1 Month)', price: 2500, duration: '4 videos OR 3 podcasts', icon: 'fas fa-bolt', category: 'retainer' },
        'cinematic-spotlight': { name: 'Cinematic Spotlight (2 Months)', price: 4800, duration: '6 videos OR 5 podcasts', icon: 'fas fa-star', category: 'retainer' },
        'masterpiece-collection': { name: 'Masterpiece Collection (3 Months)', price: 7000, duration: '9 videos OR 7 podcasts', icon: 'fas fa-trophy', category: 'retainer' },

        // Brand Building Packages
        'ignite-brand': { name: 'Ignite', price: 900, duration: 'Logo + landing page + strategy', icon: 'fas fa-fire', category: 'branding' },
        'collaborate-brand': { name: 'Collaborate', price: 1800, duration: 'Multi-page site + social setup', icon: 'fas fa-handshake', category: 'branding' },
        'transform-brand': { name: 'Transform', price: 3500, duration: 'E-commerce + automation', icon: 'fas fa-rocket', category: 'branding' },

        // On-Site Printing — 4×6
        'quick-print-4x6': { name: 'Quick Print Booth (4×6)', price: 500, duration: 'Up to 100 prints', icon: 'fas fa-print', category: 'printing' },
        'signature-snap-4x6': { name: 'Signature Snap Station (4×6)', price: 800, duration: 'Up to 200 prints', icon: 'fas fa-images', category: 'printing' },
        'legacy-lab-4x6': { name: 'Legacy Lab Experience (4×6)', price: 1100, duration: 'Up to 350 prints', icon: 'fas fa-trophy', category: 'printing' },

        // On-Site Printing — 5×7
        'quick-print-5x7': { name: 'Quick Print Booth (5×7)', price: 750, duration: 'Up to 75 prints', icon: 'fas fa-print', category: 'printing' },
        'signature-snap-5x7': { name: 'Signature Snap Station (5×7)', price: 1050, duration: 'Up to 175 prints', icon: 'fas fa-images', category: 'printing' },
        'legacy-lab-5x7': { name: 'Legacy Lab Experience (5×7)', price: 1400, duration: 'Up to 275 prints', icon: 'fas fa-trophy', category: 'printing' },

        // Print Add-ons (starting prices)
        'print-photo-sleeves': { name: 'Branded Photo Sleeves', price: 25, duration: 'From $25–$100', icon: 'fas fa-envelope', category: 'printing' },
        'print-backdrop-upgrade': { name: 'Premium Backdrop Upgrade', price: 50, duration: 'From $50–$150', icon: 'fas fa-image', category: 'printing' },
        'print-extra-media-roll': { name: 'Extra Media Roll', price: 175, duration: 'Adds 100+ prints', icon: 'fas fa-scroll', category: 'printing' },
        'print-extra-hour': { name: 'Additional Hour of Printing', price: 150, duration: 'From $150–$200', icon: 'fas fa-clock', category: 'printing' },
        'print-extra-staff': { name: 'Extra Staff Member', price: 100, duration: 'From $100/hr', icon: 'fas fa-user-plus', category: 'printing' },
        'print-rush-setup': { name: 'Rush Setup / Breakdown', price: 50, duration: 'From $50–$100', icon: 'fas fa-truck-fast', category: 'printing' }
      };

      let serviceData = { ...fallbackServiceData };
      try {
        const catalogRes = await fetch('/data/services-catalog.json', { cache: 'no-store' });
        if (catalogRes.ok) {
          const catalogJson = await catalogRes.json();
          if (catalogJson && typeof catalogJson === 'object' && Object.keys(catalogJson).length > 0) {
            serviceData = catalogJson;
          }
        }
      } catch (_) {
        /* use fallback catalog */
      }

      function savePackageDraft() {
        try {
          localStorage.setItem(SPB_STORAGE_KEY, JSON.stringify({
            services: selectedServicesList,
            savedAt: Date.now(),
          }));
        } catch (_) { /* storage unavailable */ }
      }

      function restorePackageDraft() {
        try {
          const raw = localStorage.getItem(SPB_STORAGE_KEY);
          if (!raw) return;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed?.services) || parsed.services.length === 0) return;
          const maxAge = 7 * 24 * 60 * 60 * 1000;
          if (Date.now() - (parsed.savedAt || 0) > maxAge) {
            localStorage.removeItem(SPB_STORAGE_KEY);
            return;
          }
          selectedServicesList = parsed.services.filter((s) => s?.id && serviceData[s.id]);
          if (selectedServicesList.length > 0) {
            updatePackageDisplay();
            updateQuoteSummary();
          }
        } catch (_) { /* ignore corrupt draft */ }
      }

      function parseServiceFeatures(rawText) {
        if (!rawText) return [];
        const normalized = rawText.replace(/\s+/g, ' ').trim();
        const parts = normalized
          .split(/,\s+(?=[A-Za-z0-9(])/)
          .map((part) => part.trim())
          .filter(Boolean);
        if (parts.length <= 1) {
          return parts.slice(0, 1);
        }
        return parts.slice(0, 4);
      }

      const DEFAULT_MAX_HOURLY = 16;

      function isHourlyService(serviceId) {
        return Boolean(serviceData[serviceId]?.hourly);
      }

      function getHoursFromServiceCard(serviceId) {
        const item = document.querySelector(`.service-item[data-service="${serviceId}"]`);
        const select = item?.querySelector('.service-hours-select');
        const max = serviceData[serviceId]?.maxHours || DEFAULT_MAX_HOURLY;
        const hours = parseInt(select?.value, 10) || 1;
        return Math.min(Math.max(1, hours), max);
      }

      function formatHourlyDuration(hours, rate) {
        return `${hours} hour${hours !== 1 ? 's' : ''} @ $${rate}/hr`;
      }

      function updateHourlyCardPriceDisplay(item, serviceId) {
        const data = serviceData[serviceId];
        if (!data?.hourly || !item) return;
        const hours = getHoursFromServiceCard(serviceId);
        const priceEl = item.querySelector('.service-price');
        if (!priceEl) return;
        const total = data.hourlyRate * hours;
        if (hours === 1) {
          priceEl.innerHTML = `<span class="price-amount">$${data.hourlyRate}</span><span class="price-sub">/hr</span>`;
        } else {
          priceEl.innerHTML = `<span class="price-amount">$${total.toLocaleString()}</span><span class="price-sub">${hours} hrs × $${data.hourlyRate}/hr</span>`;
        }
      }

      function buildHoursSelectOptions(maxHours) {
        const max = maxHours || DEFAULT_MAX_HOURLY;
        return Array.from({ length: max }, (_, i) => {
          const h = i + 1;
          return `<option value="${h}">${h} hour${h === 1 ? '' : 's'}</option>`;
        }).join('');
      }

      function parseDropServicePayload(raw) {
        if (!raw) return { serviceId: null, hours: null };
        try {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.id) {
            return { serviceId: parsed.id, hours: parsed.hours };
          }
        } catch (err) {
          /* plain service id */
        }
        return { serviceId: raw, hours: null };
      }

      const CATEGORY_SEARCH_ALIASES = {
        website: ['website', 'websites', 'web', 'site', 'sites', 'landing', 'homepage', 'page', 'pages', 'develop', 'development', 'seo', 'blog', 'ecommerce', 'white label', 'white-label', 'agency', 'reseller', 'partner', 'launch system', 'growth system', 'domination', 'crm', 'funnel', 'saas'],
        photography: ['photography', 'photographer', 'photo', 'photos', 'shoot', 'camera', 'gallery', 'coverage', 'portrait', 'wedding', 'event photos', 'digital photos'],
        videography: ['video', 'videography', 'videos', 'film', 'filming', 'filmmaker', 'event', 'events', 'podcast', 'podcasts', 'commercial', 'commercials', 'production', 'recap', 'live', 'edit', 'editing', 'raw files', 'hourly', 'camera', 'broadcast'],
        branding: ['brand', 'branding', 'logo', 'identity', 'strategy', 'social', 'ignite', 'collaborate', 'transform', 'crm'],
        printing: ['print', 'printing', 'booth', 'prints', '4x6', '5x7', 'snap', 'station', 'media roll', 'backdrop', 'sleeves', 'onsite', 'on-site'],
        retainer: ['retainer', 'monthly', 'subscription', 'content', 'package', 'packages', 'fast frame', 'cinematic', 'masterpiece', 'spotlight'],
      };

      const CATEGORY_DISPLAY_NAMES = {
        website: 'websites web development',
        photography: 'photography photos',
        videography: 'video videography film',
        branding: 'branding brand',
        printing: 'printing print booth',
        retainer: 'retainer monthly content',
      };

      function normalizeSearchText(value) {
        return String(value ?? '')
          .toLowerCase()
          .normalize('NFKD')
          .replace(/[\u2013\u2014]/g, '-')
          .replace(/[^a-z0-9$×x.@+\s-]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }

      function buildServiceSearchBlob(serviceId, data, description, features) {
        const category = data.category || '';
        const aliases = CATEGORY_SEARCH_ALIASES[category] || [];
        return normalizeSearchText([
          serviceId.replace(/-/g, ' '),
          data.name,
          data.duration,
          category,
          CATEGORY_DISPLAY_NAMES[category] || '',
          ...aliases,
          description,
          ...(features || []),
          data.hourly ? 'hourly rate per hour' : '',
          data.price != null ? `$${data.price}` : '',
          data.setupFee != null ? `$${data.setupFee} setup` : '',
          data.monthlyFee != null ? `$${data.monthlyFee} month monthly mo` : '',
          data.subcategory === 'white-label' ? 'white label agency partner reseller' : '',
          data.hourlyRate != null ? `$${data.hourlyRate} hr hour` : '',
        ].join(' '));
      }

      function getSearchTokens(query) {
        const normalized = normalizeSearchText(query);
        if (!normalized) return [];
        return normalized.split(' ').filter(Boolean);
      }

      function tokenMatchesHaystack(token, haystack) {
        if (!token) return true;
        if (haystack.includes(token)) return true;
        if (token.length >= 3) {
          const words = haystack.split(' ');
          if (words.some((word) => word.startsWith(token))) return true;
        }
        return false;
      }

      function applyServiceCardTitle(titleEl, title) {
        const match = String(title || '').match(/^(.+?)\s*(\(\d+\s*Months?\))$/i);
        if (!match) {
          titleEl.textContent = title;
          return;
        }
        titleEl.replaceChildren();
        const main = document.createElement('span');
        main.className = 'service-title-main';
        main.textContent = match[1].trim();
        const duration = document.createElement('span');
        duration.className = 'service-title-duration';
        duration.textContent = match[2];
        titleEl.appendChild(main);
        titleEl.appendChild(duration);
      }

      function formatServiceCatalogCards() {
        document.querySelectorAll('.service-item[data-service]').forEach((item) => {
          if (item.dataset.formatted === 'true') return;

          const key = item.dataset.service;
          const data = serviceData[key];
          if (!data) return;

          const header = item.querySelector('.service-item-header');
          const info = item.querySelector('.service-info');
          if (!header || !info) return;

          const description = info.querySelector('p')?.textContent || '';
          const title = info.querySelector('h4')?.textContent?.trim() || data.name;
          const isWhiteLabel =
            data.subcategory === 'white-label' || item.dataset.subcategory === 'white-label';
          let features = parseServiceFeatures(description);
          const icon = header.querySelector('.service-icon');
          const existingBadge = item.querySelector('.service-item-badge');

          if (isWhiteLabel) {
            item.classList.add('service-item--white-label');
            features = features.filter(
              (feature) => !/setup \+ first month|auto-renews monthly/i.test(feature)
            );
          }

          header.innerHTML = '';

          if (isWhiteLabel) {
            const headerTop = document.createElement('div');
            headerTop.className = 'service-item-header-top';
            if (icon) headerTop.appendChild(icon);
            if (data.featured || item.classList.contains('service-item--featured')) {
              const badge = existingBadge || document.createElement('span');
              if (!existingBadge) {
                badge.className = 'service-item-badge';
                badge.setAttribute('aria-hidden', 'true');
                badge.textContent = 'Most Popular';
              }
              headerTop.appendChild(badge);
            }
            header.appendChild(headerTop);

            const titleEl = document.createElement('h4');
            titleEl.className = 'service-item-title service-item-title--white-label';
            const shortName = title.replace(/^White-Label\s+/i, '').trim();
            titleEl.innerHTML = `<span class="service-title-eyebrow">White-Label</span><span class="service-title-main">${shortName}</span>`;
            header.appendChild(titleEl);
          } else {
            if (existingBadge) existingBadge.remove();
            if (icon) header.appendChild(icon);

            const titleEl = document.createElement('h4');
            titleEl.className = 'service-item-title';
            applyServiceCardTitle(titleEl, title);
            header.appendChild(titleEl);
          }

          let body = item.querySelector('.service-item-body');
          if (!body) {
            body = document.createElement('div');
            body.className = 'service-item-body';
            const price = item.querySelector('.service-price');
            item.insertBefore(body, price);
          }

          body.replaceChildren();

          const tagline = document.createElement('p');
          tagline.className = isWhiteLabel
            ? 'service-tagline service-tagline--white-label'
            : 'service-tagline';
          if (isWhiteLabel) {
            tagline.textContent = data.duration || 'Agency partner · setup + monthly';
          } else {
            tagline.textContent = data.duration;
          }
          body.appendChild(tagline);

          const list = document.createElement('ul');
          list.className = 'service-features';
          features.forEach((feature) => {
            const li = document.createElement('li');
            li.textContent = feature;
            list.appendChild(li);
          });
          body.appendChild(list);

          const priceEl = item.querySelector('.service-price');
          if (priceEl && data.setupFee != null && data.monthlyFee != null) {
            const setupAmount = Number(data.setupFee) || Number(data.price);
            const firstInvoice = Number(data.price) || setupAmount;
            if (isWhiteLabel) {
              priceEl.innerHTML = `<span class="price-amount">$${setupAmount.toLocaleString()}</span><span class="price-sub">setup fee</span><span class="price-monthly">$${Number(data.monthlyFee).toLocaleString()}/mo</span>`;
            } else {
              priceEl.innerHTML = `<span class="price-amount">$${firstInvoice.toLocaleString()}</span><span class="price-sub">first invoice</span><span class="price-sub">$${Number(data.setupFee).toLocaleString()} setup + $${Number(data.monthlyFee).toLocaleString()}/mo</span>`;
            }
          } else if (priceEl && !data.hourly) {
            const amount = Number(data.price);
            if (!Number.isNaN(amount)) {
              priceEl.innerHTML = `<span class="price-amount">$${amount.toLocaleString()}</span>`;
            }
          }

          if (isWhiteLabel) {
            const wlPriceEl = item.querySelector('.service-price');
            if (wlPriceEl) {
              let wlFooter = item.querySelector('.service-item-footer--white-label');
              if (!wlFooter) {
                wlFooter = document.createElement('div');
                wlFooter.className = 'service-item-footer service-item-footer--white-label';
                item.appendChild(wlFooter);
              }
              wlFooter.appendChild(wlPriceEl);
            }
          }

          if (data.hourly) {
            item.classList.add('service-item--hourly');
            const hoursRow = document.createElement('div');
            hoursRow.className = 'service-hours-row';
            const selectId = `hours-select-${key}`;
            hoursRow.innerHTML = `
              <label class="service-hours-label" for="${selectId}">Hours</label>
              <select id="${selectId}" class="service-hours-select" data-service-hours="${key}" aria-label="Number of hours for ${title}">
                ${buildHoursSelectOptions(data.maxHours)}
              </select>
            `;
            const priceEl = item.querySelector('.service-price');
            let footer = item.querySelector('.service-item-footer');
            if (!footer) {
              footer = document.createElement('div');
              footer.className = 'service-item-footer';
              item.appendChild(footer);
            }
            footer.appendChild(hoursRow);
            if (priceEl) footer.appendChild(priceEl);
            updateHourlyCardPriceDisplay(item, key);
          }

          info.remove();
          item.dataset.searchText = buildServiceSearchBlob(key, data, description, features);
          item.dataset.formatted = 'true';
        });
      }

      formatServiceCatalogCards();

      const serviceItemsEl = document.getElementById('serviceItems');
      if (serviceItemsEl) {
        serviceItemsEl.addEventListener('change', (e) => {
          const select = e.target.closest('.service-hours-select');
          if (!select) return;
          e.stopPropagation();
          const serviceId = select.dataset.serviceHours;
          const item = select.closest('.service-item');
          if (item) updateHourlyCardPriceDisplay(item, serviceId);
          if (selectedServicesList.some((s) => s.id === serviceId)) {
            const updated = addServiceToPackage(serviceId);
            if (updated) showNotification('Hours updated in your package', 'info');
          }
        });
        serviceItemsEl.addEventListener('click', (e) => {
          if (e.target.closest('.service-hours-select, .service-hours-row, .service-hours-label')) {
            e.stopPropagation();
          }
        });
      }
      
      function serviceMatchesSearch(item) {
        if (!catalogSearchQuery) return true;
        const haystack = item.dataset.searchText || normalizeSearchText(item.textContent);
        const tokens = getSearchTokens(catalogSearchQuery);
        if (tokens.length === 0) return true;
        return tokens.every((token) => tokenMatchesHaystack(token, haystack));
      }

      function filterServicesByCategory(category) {
        const isSearchActive = catalogSearchQuery.length > 0;
        const effectiveCategory = isSearchActive ? 'all' : category;
        const serviceNodes = document.querySelectorAll('.service-item');
        const sectionHeaders = document.querySelectorAll('.service-section-header');
        const categoriesEl = document.getElementById('serviceCategories');
        const statusEl = document.getElementById('catalogSearchStatus');
        const emptyEl = document.getElementById('catalogSearchEmpty');

        let visibleCount = 0;
        const visibleCategories = new Set();

        serviceNodes.forEach((item) => {
          const itemCategory = item.dataset.category;
          const categoryMatch = effectiveCategory === 'all' || itemCategory === effectiveCategory;
          const searchMatch = serviceMatchesSearch(item);
          const shouldShow = categoryMatch && searchMatch;

          item.style.display = shouldShow ? '' : 'none';
          item.classList.toggle('hidden', !shouldShow);
          if (shouldShow) {
            visibleCount += 1;
            visibleCategories.add(itemCategory);
          }
        });

        sectionHeaders.forEach((header) => {
          const headerCategory = header.dataset.category;
          const shouldShow = isSearchActive
            ? visibleCategories.has(headerCategory)
            : effectiveCategory === 'all' || headerCategory === effectiveCategory;
          header.style.display = shouldShow ? '' : 'none';
          header.classList.toggle('hidden', !shouldShow);
        });

        if (categoriesEl) {
          categoriesEl.classList.toggle('is-searching', isSearchActive);
        }

        if (statusEl) {
          if (isSearchActive) {
            statusEl.hidden = false;
            statusEl.textContent = visibleCount
              ? `${visibleCount} service${visibleCount === 1 ? '' : 's'} found across all categories`
              : 'No matches — try photo, video, wedding, podcast, print, or website';
          } else {
            statusEl.hidden = true;
            statusEl.textContent = '';
          }
        }

        if (emptyEl) {
          emptyEl.hidden = !isSearchActive || visibleCount > 0;
        }

        setTimeout(() => initializeServiceListeners(), 10);
      }

      if (catalogSearch) {
        catalogSearch.addEventListener('input', () => {
          catalogSearchQuery = catalogSearch.value.trim();
          filterServicesByCategory(currentCategory);
        });
        catalogSearch.addEventListener('search', () => {
          catalogSearchQuery = catalogSearch.value.trim();
          filterServicesByCategory(currentCategory);
        });
      }

      categoryTabs.forEach((tab) => {
        tab.addEventListener('click', (e) => {
          e.preventDefault();
          const category = tab.dataset.category;
          currentCategory = category;
          if (catalogSearch && catalogSearchQuery) {
            catalogSearch.value = '';
            catalogSearchQuery = '';
          }
          categoryTabs.forEach((t) => t.classList.remove('active'));
          tab.classList.add('active');
          filterServicesByCategory(category);
        });
      });

      setTimeout(() => {
        categoryTabs.forEach((t) => t.classList.remove('active'));
        const activeTab = document.querySelector(`[data-category="${currentCategory}"]`);
        if (activeTab) {
          activeTab.classList.add('active');
        }
        filterServicesByCategory(currentCategory);
        restorePackageDraft();
      }, 200);
      
      // Drag and drop event handlers
      let isDragging = false;
      
      function handleDragStart(e) {
        if (e.target.closest('.service-hours-select')) {
          e.preventDefault();
          return;
        }
        const serviceItem = e.target.closest('.service-item');
        const serviceId = serviceItem.dataset.service;
        if (getServiceAddBlockReason(serviceId)) {
          e.preventDefault();
          return;
        }
        console.log('Drag started for service:', serviceId);
        serviceItem.classList.add('dragging');
        isDragging = true;
        let payload = serviceId;
        if (isHourlyService(serviceId)) {
          payload = JSON.stringify({ id: serviceId, hours: getHoursFromServiceCard(serviceId) });
        }
        e.dataTransfer.setData('text/plain', payload);
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
        
        const { serviceId, hours } = parseDropServicePayload(e.dataTransfer.getData('text/plain'));
        console.log('Dropped service ID:', serviceId, hours);
        
        if (serviceId) {
          console.log('Adding service directly to package:', serviceId);
          const added = addServiceToPackage(serviceId, { hours });
          if (added) {
            const label = serviceData[serviceId]?.name || 'Service';
            showNotification(`${label} added — keep building your package!`, 'success');
          }
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
        syncCatalogSelectedState();
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
      
      function syncCatalogSelectedState() {
        const subscriptionLocked = isSubscriptionOnlyPackage(selectedServicesList);
        const hasNonSubscription =
          selectedServicesList.length > 0 &&
          selectedServicesList.some((service) => !isSubscriptionCatalogService(service.id));

        document.querySelectorAll('.service-item[data-service]').forEach((item) => {
          const serviceId = item.dataset.service;
          const inPackage = selectedServicesList.some((service) => service.id === serviceId);
          const isSubscriptionItem = isSubscriptionCatalogService(serviceId);
          const blocked =
            Boolean(getServiceAddBlockReason(serviceId)) ||
            (subscriptionLocked && inPackage) ||
            (hasNonSubscription && isSubscriptionItem);

          item.classList.toggle('in-package', inPackage);
          item.classList.toggle('add-blocked', blocked);
          item.setAttribute('aria-pressed', inPackage ? 'true' : 'false');
          item.setAttribute('aria-disabled', blocked ? 'true' : 'false');
          item.draggable = blocked ? 'false' : 'true';
        });
      }

      function updatePackageCountBadge(count) {
        if (!packageServiceCount) return;
        packageServiceCount.innerHTML = `<span class="package-count-label">Items</span><span class="package-count-value">${count}</span>`;
        packageServiceCount.classList.remove('is-pop');
        void packageServiceCount.offsetWidth;
        if (count > 0) {
          packageServiceCount.classList.add('is-pop');
        }
      }

      function isSubscriptionCatalogService(serviceId) {
        return serviceData[serviceId]?.billing?.type === 'subscription';
      }

      function isSubscriptionOnlyPackage(services) {
        return (
          Array.isArray(services) &&
          services.length > 0 &&
          services.every((service) => isSubscriptionCatalogService(service.id))
        );
      }

      function isRetainerOnlyPackage(services) {
        return (
          isSubscriptionOnlyPackage(services) &&
          services.every((service) => serviceData[service.id]?.category === 'retainer')
        );
      }

      function isWhiteLabelOnlyPackage(services) {
        return (
          isSubscriptionOnlyPackage(services) &&
          services.every((service) => serviceData[service.id]?.billing?.model === 'setup_then_monthly')
        );
      }

      function packageHasSubscription(services = selectedServicesList) {
        return services.some((service) => isSubscriptionCatalogService(service.id));
      }

      function packageHasRetainer(services = selectedServicesList) {
        return services.some((service) => service.category === 'retainer');
      }

      function getServiceAddBlockReason(serviceId) {
        const service = serviceData[serviceId];
        if (!service) return 'Unknown service.';

        const isSubscription = isSubscriptionCatalogService(serviceId);
        const inPackage = selectedServicesList.some((s) => s.id === serviceId);
        const hasSubscription = packageHasSubscription();

        if (hasSubscription) {
          if (inPackage) {
            return 'This subscription package is already in your checkout.';
          }
          return 'Subscription checkouts are limited to one package. Clear your package or refresh the page to start another invoice.';
        }

        if (selectedServicesList.length > 0 && isSubscription) {
          return 'Subscription packages must be checked out alone. Clear your package first, then select your plan.';
        }

        return null;
      }

      function updateGenerateInvoiceButtonLabel() {
        if (!generateInvoiceBtn) return;
        const isWhiteLabel = isWhiteLabelOnlyPackage(selectedServicesList);
        const isRetainer = isRetainerOnlyPackage(selectedServicesList);
        const iconClass = isWhiteLabel || isRetainer ? 'fa-repeat' : 'fa-file-invoice-dollar';
        const label = isWhiteLabel
          ? 'Start White-Label Plan'
          : isRetainer
            ? 'Start My Retainer'
            : 'Create My Invoice';
        generateInvoiceBtn.innerHTML = `<i class="fas ${iconClass}"></i> ${label}`;
      }

      function updatePackageDisplay() {
        const count = selectedServicesList.length;
        const subscriptionLocked = isSubscriptionOnlyPackage(selectedServicesList);
        const packageBuilderHint = document.getElementById('packageBuilderHint');
        const packageRetainerLockHint = document.getElementById('packageRetainerLockHint');

        if (packageDropzone) {
          packageDropzone.classList.toggle('retainer-locked', subscriptionLocked);
          packageDropzone.classList.toggle('has-items', count > 0);
          packageDropzone.setAttribute(
            'aria-label',
            count
              ? `Your package has ${count} service${count === 1 ? '' : 's'}. Drop or click more to keep building.`
              : 'Drop services here to build your package'
          );
        }

        if (count === 0) {
          if (selectedServices) {
            selectedServices.style.display = 'none';
            selectedServices.innerHTML = '';
          }
          if (quoteSummary) quoteSummary.classList.add('is-empty');
          if (quoteEmptyHint) quoteEmptyHint.hidden = false;
          const breakdownEl = document.getElementById('quoteBreakdown');
          if (breakdownEl) breakdownEl.hidden = true;
          if (generateInvoiceBtn) {
            generateInvoiceBtn.disabled = true;
            generateInvoiceBtn.setAttribute('aria-disabled', 'true');
            updateGenerateInvoiceButtonLabel();
          }
          if (packageBuilderHint) packageBuilderHint.hidden = false;
          if (packageRetainerLockHint) packageRetainerLockHint.classList.add('is-hidden');
          dropzoneEmpty?.classList.remove('is-hidden');
          dropzoneAddMore?.classList.add('is-hidden');
          if (dropzoneAddMore) dropzoneAddMore.setAttribute('aria-hidden', 'true');
          updatePackageCountBadge(0);
          syncCatalogSelectedState();
          lastAddedServiceId = null;
          updateQuoteSummary();
          return;
        }

        dropzoneEmpty?.classList.add('is-hidden');
        if (subscriptionLocked) {
          dropzoneAddMore?.classList.add('is-hidden');
          if (dropzoneAddMore) dropzoneAddMore.setAttribute('aria-hidden', 'true');
          if (packageBuilderHint) packageBuilderHint.hidden = true;
          if (packageRetainerLockHint) packageRetainerLockHint.classList.remove('is-hidden');
        } else {
          dropzoneAddMore?.classList.remove('is-hidden');
          if (dropzoneAddMore) dropzoneAddMore.setAttribute('aria-hidden', 'false');
          if (packageBuilderHint) packageBuilderHint.hidden = false;
          if (packageRetainerLockHint) packageRetainerLockHint.classList.add('is-hidden');
        }

        if (selectedServices) {
          selectedServices.style.display = 'flex';
          selectedServices.innerHTML = selectedServicesList.map((service) => `
            <div class="selected-service${service.id === lastAddedServiceId ? ' just-added' : ''}" data-service-id="${service.id}">
              <div class="selected-service-info">
                <div class="selected-service-icon">
                  <i class="${service.icon}"></i>
                </div>
                <div class="selected-service-details">
                  <h5>${service.name}${service.isHourly ? ` — ${service.quantity} hr${service.quantity !== 1 ? 's' : ''}` : service.quantity > 1 ? ` × ${service.quantity}` : ''}</h5>
                  <p>${service.duration} · $${(service.price * service.quantity).toLocaleString()}${service.isHourly ? ' total' : service.quantity > 1 ? ' each' : ''}</p>
                </div>
              </div>
              <button type="button" class="remove-service" onclick="removeServiceFromPackage('${service.id}')" aria-label="Remove ${service.name} from package">
                <i class="fas fa-times" aria-hidden="true"></i>
              </button>
            </div>
          `).join('');
        }

        if (quoteSummary) quoteSummary.classList.remove('is-empty');
        if (quoteEmptyHint) quoteEmptyHint.hidden = true;
        const breakdownEl = document.getElementById('quoteBreakdown');
        if (breakdownEl) breakdownEl.hidden = false;
        if (generateInvoiceBtn) {
          generateInvoiceBtn.disabled = false;
          generateInvoiceBtn.setAttribute('aria-disabled', 'false');
          updateGenerateInvoiceButtonLabel();
        }
        updatePackageCountBadge(count);
        syncCatalogSelectedState();

        requestAnimationFrame(() => {
          const newest = selectedServices?.querySelector('.selected-service.just-added');
          newest?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          if (count === 1 && window.matchMedia('(max-width: 900px)').matches) {
            packageDropzone?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }
      
      function addServiceToPackage(serviceId, options = {}) {
        const service = serviceData[serviceId];
        if (!service) return false;

        const blockReason = getServiceAddBlockReason(serviceId);
        if (blockReason) {
          showNotification(blockReason, 'error');
          return false;
        }

        const isHourly = Boolean(service.hourly);
        const hours = isHourly
          ? Math.min(
              Math.max(1, options.hours ?? getHoursFromServiceCard(serviceId)),
              service.maxHours || DEFAULT_MAX_HOURLY
            )
          : 1;
        const unitPrice = isHourly ? service.hourlyRate : service.price;
        const duration = isHourly ? formatHourlyDuration(hours, service.hourlyRate) : service.duration;

        const existingService = selectedServicesList.find((s) => s.id === serviceId);
        if (existingService) {
          if (isHourly) {
            existingService.quantity = hours;
            existingService.price = unitPrice;
            existingService.duration = duration;
            existingService.isHourly = true;
          } else {
            existingService.quantity++;
          }
        } else {
          selectedServicesList.push({
            id: serviceId,
            name: service.name,
            price: unitPrice,
            duration,
            icon: service.icon,
            category: service.category,
            quantity: isHourly ? hours : 1,
            isHourly,
          });
        }

        lastAddedServiceId = serviceId;
        updatePackageDisplay();
        updateQuoteSummary();
        savePackageDraft();
        return true;
      }
      
      function removeServiceFromPackage(serviceId) {
        selectedServicesList = selectedServicesList.filter(s => s.id !== serviceId);
        lastAddedServiceId = null;
        updatePackageDisplay();
        updateQuoteSummary();
        savePackageDraft();
        showNotification('Service removed from package', 'info');
      }
      
      // Make removeServiceFromPackage globally accessible for onclick handlers
      window.removeServiceFromPackage = removeServiceFromPackage;
      
      function updateQuoteSummary() {
        const total = selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0);
        const quoteTotalEl = document.getElementById('quoteTotal');
        if (quoteTotalEl) {
          quoteTotalEl.textContent = `$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        const breakdown = document.getElementById('quoteBreakdown');
        if (!breakdown) return;

        if (selectedServicesList.length === 0) {
          breakdown.innerHTML = '';
          breakdown.hidden = true;
          return;
        }

        breakdown.hidden = false;
        const lineItems = selectedServicesList.map((service) => `
          <div class="quote-item">
            <span class="quote-item-label">${service.name}${service.isHourly ? ` (${service.quantity} hrs)` : service.quantity > 1 ? ` × ${service.quantity}` : ''}</span>
            <span class="quote-item-value">$${(service.price * service.quantity).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        `).join('');

        breakdown.innerHTML = `
          ${lineItems}
          <div class="quote-item">
            <span class="quote-item-label">Total</span>
            <span class="quote-item-value">$${total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        `;
      }
      
      function clearPackage() {
        selectedServicesList = [];
        lastAddedServiceId = null;
        try {
          localStorage.removeItem(SPB_STORAGE_KEY);
        } catch (_) { /* ignore */ }
        updatePackageDisplay();
        updateQuoteSummary();
      }
      
      function generateInvoice() {
        if (selectedServicesList.length === 0) {
          showNotification('Add at least one service from the catalog to create your invoice.', 'error');
          document.getElementById('serviceItems')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          return;
        }

        if (packageHasSubscription(selectedServicesList) && !isSubscriptionOnlyPackage(selectedServicesList)) {
          showNotification(
            'Subscription packages must be checked out alone. Remove other services or keep only one subscription plan.',
            'error'
          );
          return;
        }

        if (selectedServicesList.filter((service) => isSubscriptionCatalogService(service.id)).length > 1) {
          showNotification('Please select only one subscription package per checkout.', 'error');
          return;
        }

        const invoiceData = {
          services: selectedServicesList,
          subtotal: selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0),
          total: selectedServicesList.reduce((sum, service) => sum + (service.price * service.quantity), 0),
          date: new Date().toISOString(),
          invoiceNumber: 'CF-' + Date.now()
        };

        showInvoiceModal(invoiceData);
      }

      function getBuilderPrefill() {
        const first = document.getElementById('firstName')?.value?.trim() || '';
        const last = document.getElementById('lastName')?.value?.trim() || '';
        const name = [first, last].filter(Boolean).join(' ');
        const email = document.getElementById('contactEmail')?.value?.trim() || '';
        return { name, email };
      }

      function showInvoiceModal(invoiceData) {
        document.querySelectorAll('.modal-overlay:not(.success-modal-overlay)').forEach((m) => m.remove());

        const prefill = getBuilderPrefill();
        const totalLabel = `$${invoiceData.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const isSubscriptionCheckout = isSubscriptionOnlyPackage(invoiceData.services);
        const isWhiteLabelCheckout = isWhiteLabelOnlyPackage(invoiceData.services);
        const isRetainerCheckout = isRetainerOnlyPackage(invoiceData.services);
        const modalTitle = isWhiteLabelCheckout
          ? 'Start Your White-Label Plan'
          : isRetainerCheckout
            ? 'Start Your Monthly Retainer'
            : 'Create Your Cochran Films Invoice';
        const modalIntro = isWhiteLabelCheckout
          ? 'Enter your details below. We&apos;ll email your plan summary and setup invoice—usually within a minute. After setup is paid, monthly renewals bill automatically on the same date each month.'
          : isRetainerCheckout
            ? 'Enter your details below. We&apos;ll email your retainer summary and first monthly invoice—usually within a minute. You&apos;ll be billed on the same date each month through your commitment term.'
            : 'Enter your details below. We&apos;ll email your package summary and Stripe payment link—usually within a minute.';
        const eventDateLabel = isSubscriptionCheckout
          ? 'Billing start date <span style="font-weight:500;opacity:0.7">(optional)</span>'
          : 'Event / shoot date <span style="font-weight:500;opacity:0.7">(optional)</span>';
        const submitLabel = isWhiteLabelCheckout
          ? '<i class="fas fa-repeat"></i> Start Plan &amp; Email Me'
          : isRetainerCheckout
            ? '<i class="fas fa-repeat"></i> Start Retainer &amp; Email Me'
            : '<i class="fas fa-file-invoice-dollar"></i> Create Invoice &amp; Email Me';

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active invoice-create-modal';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'invoice-modal-title');
        modal.innerHTML = `
          <div class="modal-content invoice-create-modal__panel">
            <div class="invoice-create-modal__accent" aria-hidden="true"></div>
            <button type="button" class="modal-close" aria-label="Close">&times;</button>
            <div class="invoice-create-modal__inner">
            <div class="modal-header">
              <div class="modal-icon">
                <i class="fas fa-file-invoice-dollar"></i>
              </div>
              <h2 id="invoice-modal-title">${modalTitle}</h2>
              <p>${modalIntro}</p>
            </div>

            <div class="contact-form-section">
              <h3>Your details</h3>
              <p class="modal-trust-line"><i class="fas fa-lock" aria-hidden="true"></i> Secure checkout via Stripe · No spam</p>

              <div class="contact-form">
                <div class="form-group">
                  <label for="customerName">Full Name *</label>
                  <input type="text" id="customerName" required autocomplete="name" placeholder="Your full name">
                </div>

                <div class="form-group">
                  <label for="customerEmail">Email Address *</label>
                  <input type="email" id="customerEmail" required autocomplete="email" inputmode="email" placeholder="you@example.com">
                </div>

                <div class="form-group">
                  <label for="customerPhone">Phone <span style="font-weight:500;opacity:0.7">(optional)</span></label>
                  <input type="tel" id="customerPhone" autocomplete="tel" placeholder="For scheduling follow-up">
                </div>

                <div class="form-group">
                  <label for="projectType">Project type <span style="font-weight:500;opacity:0.7">(optional)</span></label>
                  <input type="text" id="projectType" placeholder="e.g. Wedding, brand film, podcast">
                </div>

                <div class="form-group">
                  <label for="eventDate">${eventDateLabel}</label>
                  <span class="invoice-date-field">
                    <input type="date" id="eventDate" aria-label="${isRetainerCheckout ? 'Billing start date' : 'Event or shoot date'}">
                    <button type="button" class="invoice-date-picker-btn" aria-label="Open calendar">
                      <i class="fas fa-calendar" aria-hidden="true"></i>
                    </button>
                  </span>
                </div>
              </div>
            </div>

            <details class="invoice-preview-collapsible">
              <summary>Package breakdown (${totalLabel})</summary>
              <div class="invoice-details">
                <div class="invoice-header">
                  <h3>Invoice #${invoiceData.invoiceNumber}</h3>
                  <p>Date: ${new Date(invoiceData.date).toLocaleDateString()}</p>
                </div>
                <div class="invoice-items">
                  ${invoiceData.services.map(service => `
                    <div class="invoice-item">
                      <div class="item-details">
                        <h4>${service.name}</h4>
                        <p>${service.duration}</p>
                      </div>
                      <div class="item-price">
                        <span>$${(service.price * (service.quantity || 1)).toFixed(2)}</span>
                      </div>
                    </div>
                  `).join('')}
                </div>
                <div class="invoice-total">
                  <div class="total-line total">
                    <span>Total:</span>
                    <span>$${invoiceData.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </details>

            <div class="form-actions">
              <button type="button" class="btn-primary modal-submit-invoice">
                ${submitLabel}
              </button>
              <button type="button" class="btn-secondary modal-cancel">
                Cancel
              </button>
            </div>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const nameInput = modal.querySelector('#customerName');
        const emailInput = modal.querySelector('#customerEmail');
        if (prefill.name && nameInput) nameInput.value = prefill.name;
        if (prefill.email && emailInput) emailInput.value = prefill.email;
        (emailInput?.value ? emailInput : nameInput)?.focus();

        const closeModal = () => modal.remove();
        modal.querySelector('.modal-close')?.addEventListener('click', closeModal);
        modal.querySelector('.modal-cancel')?.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
          if (e.target === modal) closeModal();
        });
        const onEscape = (e) => {
          if (e.key === 'Escape') {
            closeModal();
            document.removeEventListener('keydown', onEscape);
          }
        };
        document.addEventListener('keydown', onEscape);

        const eventDateInput = modal.querySelector('#eventDate');
        const datePickerBtn = modal.querySelector('.invoice-date-picker-btn');
        const openEventDatePicker = () => {
          if (!eventDateInput) return;
          if (typeof eventDateInput.showPicker === 'function') {
            try {
              eventDateInput.showPicker();
              return;
            } catch (_) { /* fall through to focus */ }
          }
          eventDateInput.focus();
        };
        datePickerBtn?.addEventListener('click', (e) => {
          e.preventDefault();
          openEventDatePicker();
        });
        eventDateInput?.addEventListener('click', () => {
          openEventDatePicker();
        });

        modal.querySelector('.modal-submit-invoice')?.addEventListener('click', () => {
          validateAndSendProject(invoiceData);
        });
      }

      function validateAndSendProject(invoiceData) {
        const customerName = document.getElementById('customerName').value.trim();
        const customerEmail = document.getElementById('customerEmail').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        
        // Validate required fields
        if (!customerName) {
          showNotification('Please enter your full name', 'error');
          document.getElementById('customerName').focus();
          return;
        }
        
        if (!customerEmail) {
          showNotification('Please enter your email address', 'error');
          document.getElementById('customerEmail').focus();
          return;
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(customerEmail)) {
          showNotification('Please enter a valid email address', 'error');
          document.getElementById('customerEmail').focus();
          return;
        }
        
        // Add customer information to invoice data
        invoiceData.customer = {
          name: customerName,
          email: customerEmail,
          phone: customerPhone
        };
        invoiceData.projectType = document.getElementById('projectType')?.value?.trim() || '';
        invoiceData.eventDate = document.getElementById('eventDate')?.value?.trim() || '';

        sendToEmailJS(invoiceData);
      }
      
      // Make functions globally available
      window.removeServiceFromPackage = removeServiceFromPackage;
      window.validateAndSendProject = validateAndSendProject;
      
      async function postCreateInvoice(invoiceData) {
        const response = await fetch('/api/stripe/create-invoice', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Idempotency-Key': invoiceData.invoiceNumber,
          },
          body: JSON.stringify({
            customer: invoiceData.customer,
            services: invoiceData.services,
            invoiceNumber: invoiceData.invoiceNumber,
            subtotal: invoiceData.subtotal,
            total: invoiceData.total,
            date: invoiceData.date,
            projectType: invoiceData.projectType,
            eventDate: invoiceData.eventDate,
          }),
        });

        const raw = await response.text();
        let result = {};
        try {
          result = raw ? JSON.parse(raw) : {};
        } catch (parseError) {
          throw new Error(
            raw && raw.length < 300
              ? raw
              : `Server error (${response.status}). Check Vercel function logs.`
          );
        }

        return { response, result };
      }

      async function sendToEmailJS(invoiceData) {
        if (invoiceCreateInFlight) return;

        const modal = document.querySelector('.modal-overlay.active');
        const submitBtn = modal?.querySelector('.modal-submit-invoice');
        const originalText = submitBtn ? submitBtn.innerHTML : '';

        invoiceCreateInFlight = true;

        if (submitBtn) {
          submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Invoice...';
          submitBtn.disabled = true;
        }

        try {
          let { response, result } = await postCreateInvoice(invoiceData);

          if (response.status === 409 && result.retryable) {
            await new Promise((resolve) => setTimeout(resolve, 2500));
            ({ response, result } = await postCreateInvoice(invoiceData));
          }

          if (!response.ok) {
            throw new Error(result.error || `Unable to create invoice (${response.status}).`);
          }

          const emailNotes = [result.emailWarning, result.adminEmailWarning].filter(Boolean).join(' ');
          const checkoutPayload = {
            invoiceUrl: result.invoiceUrl,
            emailWarning: emailNotes || null,
            paymentDueDate: result.paymentDueDate,
            result: {
              billingMode: result.billingMode,
              subscriptionModel: result.subscriptionModel,
              nextBillingDate: result.nextBillingDate,
              commitmentTerm: result.commitmentTerm,
            },
            customer: invoiceData.customer,
            services: invoiceData.services,
            total: invoiceData.total,
            subtotal: invoiceData.subtotal,
            invoiceNumber: invoiceData.invoiceNumber,
            ts: Date.now(),
          };
          try {
            sessionStorage.setItem('cfCheckout', JSON.stringify(checkoutPayload));
          } catch (_) { /* ignore */ }
          try {
            localStorage.removeItem(SPB_STORAGE_KEY);
          } catch (_) { /* ignore */ }
          clearPackage();
          window.location.href = '/checkout';
        } catch (error) {
          console.error('Invoice submission error:', error);
          showNotification(error.message || 'Unable to create invoice. Please contact us directly.', 'error');
          if (submitBtn) {
            submitBtn.innerHTML = originalText || '<i class="fas fa-file-invoice-dollar"></i> Create Invoice &amp; Email Me';
            submitBtn.disabled = false;
          }
        } finally {
          invoiceCreateInFlight = false;
        }
      }
      
      // Show prominent success modal for project submission
      function showSuccessModal(invoiceUrl, emailWarning, paymentDueDate, result = {}) {
        const isSubscription = result.billingMode === 'subscription';
        const isWhiteLabelSuccess = result.subscriptionModel === 'setup_then_monthly';
        const isRetainer = isSubscription && !isWhiteLabelSuccess;
        // Close any existing invoice/project modal first
        const existingModals = document.querySelectorAll('.modal-overlay:not(.success-modal-overlay)');
        existingModals.forEach(modal => modal.remove());
        
        const safeInvoiceUrl = invoiceUrl && /^https:\/\/(invoice\.stripe\.com|pay\.stripe\.com)\//i.test(invoiceUrl) ? invoiceUrl : '';
        const invoiceLinkHtml = safeInvoiceUrl
          ? `<div class="success-detail-item">
              <i class="fas fa-file-invoice-dollar"></i>
              <span><a href="${safeInvoiceUrl}" target="_blank" rel="noopener noreferrer" style="color:var(--brand-gold);font-weight:700;">View your Stripe invoice</a></span>
            </div>`
          : '';
        const emailNote = emailWarning
          ? `<p style="margin:12px 0 0;font-size:13px;color:var(--text-muted);">${emailWarning}</p>`
          : '';
        const dueNote = paymentDueDate
          ? `<div class="success-detail-item"><i class="fas fa-calendar-check"></i><span>Payment due by ${paymentDueDate}</span></div>`
          : '';
        const renewalNote =
          isRetainer && result.nextBillingDate
            ? `<div class="success-detail-item"><i class="fas fa-repeat"></i><span>Next billing date: ${result.nextBillingDate}</span></div>`
            : '';
        const commitmentNote =
          isRetainer && result.commitmentTerm
            ? `<div class="success-detail-item"><i class="fas fa-calendar-alt"></i><span>Commitment term: ${result.commitmentTerm}</span></div>`
            : '';
        const copyBtnHtml = safeInvoiceUrl
          ? `<button type="button" class="btn-secondary success-copy-link" style="margin-top:12px;"><i class="fas fa-link"></i> Copy payment link</button>`
          : '';
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active success-modal-overlay';
        modal.innerHTML = `
          <div class="modal-content">
            <div class="success-modal-header">
              <div class="success-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <h2>${isWhiteLabelSuccess ? '✅ White-Label Plan Started!' : isRetainer ? '✅ Retainer Started!' : '✅ Invoice Created!'}</h2>
              <p>${
                isWhiteLabelSuccess
                  ? 'Your white-label plan summary and setup invoice have been sent to your email.'
                  : isRetainer
                    ? 'Your monthly retainer summary and first invoice have been sent to your email.'
                    : 'Your project package summary and payment link have been sent to your email.'
              }${emailNote}</p>
            </div>
            
            <div class="success-modal-body">
              <div class="success-details">
                ${invoiceLinkHtml}
                ${dueNote}
                ${renewalNote}
                ${commitmentNote}
                <div class="success-detail-item">
                  <i class="fas fa-envelope"></i>
                  <span>${
                    isWhiteLabelSuccess
                      ? 'Check your inbox for plan details &amp; setup invoice'
                      : isRetainer
                        ? 'Check your inbox for retainer details &amp; first monthly invoice'
                        : 'Check your inbox for package details &amp; payment link'
                  }</span>
                </div>
                <div class="success-detail-item">
                  <i class="fas fa-clock"></i>
                  <span>We'll follow up within 24 hours to kick off your project</span>
                </div>
                <div class="success-detail-item">
                  <i class="fas fa-phone"></i>
                  <span>Questions? Call us anytime</span>
                </div>
              </div>
            </div>
            
            <div class="success-modal-actions">
              ${copyBtnHtml}
              <button class="btn-primary success-btn" onclick="handleAwesomeClick()">
                <i class="fas fa-thumbs-up"></i>
                Awesome, Thanks!
              </button>
            </div>
          </div>
        `;
        
        document.body.appendChild(modal);

        const copyBtn = modal.querySelector('.success-copy-link');
        if (copyBtn && safeInvoiceUrl) {
          copyBtn.addEventListener('click', async () => {
            try {
              await navigator.clipboard.writeText(safeInvoiceUrl);
              showNotification('Payment link copied', 'success');
            } catch (_) {
              showNotification('Could not copy — use the link above', 'info');
            }
          });
        }
        
        // Auto-close after 8 seconds
        setTimeout(() => {
          // Check if the modal still exists before closing
          const stillExists = document.querySelector('.success-modal-overlay');
          if (stillExists) {
            console.log('Auto-closing success modal after 8 seconds');
            closeAllModalsAndReset();
          }
        }, 8000);
      }
      
      // Close all modals and reset for next project request
      function closeAllModalsAndReset() {
        console.log('Closing all modals and resetting...');
        
        // Remove ALL modal overlays to ensure clean slate
        const allModals = document.querySelectorAll('.modal-overlay');
        console.log(`Found ${allModals.length} modals to remove`);
        allModals.forEach((modal, index) => {
          console.log(`Removing modal ${index + 1}: ${modal.className}`);
          modal.remove();
        });
        
        // Reset submit button state for next request
        const submitButtons = document.querySelectorAll('.btn-primary');
        submitButtons.forEach(btn => {
          if (btn.textContent.includes('Send Your Project') || btn.textContent.includes('Sending Request') || btn.textContent.includes('Submitted')) {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Your Project';
            btn.disabled = false;
            console.log('Reset submit button');
          }
        });
        
        console.log('All modals closed, ready for next project request');
      }
      
      // Make function globally available
      window.closeAllModalsAndReset = closeAllModalsAndReset;
      
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
        
        if (e.target.closest('.service-hours-select, .service-hours-row, .service-hours-label')) {
          return;
        }

        const serviceId = serviceItem.dataset.service;
        console.log('Service ID:', serviceId);
        
        if (serviceId) {
          e.preventDefault();
          e.stopPropagation();
          console.log('Calling addServiceToPackage for:', serviceId);
          const added = addServiceToPackage(serviceId);
          if (added) {
            const label = serviceData[serviceId]?.name || 'Service';
            showNotification(`${label} added to your package`, 'success');
          }
        } else {
          console.log('No service ID found on element');
        }
      }

      updateQuoteSummary();
      
      // Handle awesome button click with proper modal cleanup
      function handleAwesomeClick() {
        console.log('Awesome button clicked');
        const awesomeBtn = event.target.closest('button');
        if (awesomeBtn) {
          awesomeBtn.innerHTML = '<i class="fas fa-check"></i> Thanks!';
          awesomeBtn.disabled = true;
        }
        
        // Small delay for visual feedback, then close all modals
        setTimeout(() => {
          closeAllModalsAndReset();
        }, 300);
      }
      
      // Make functions globally available
      window.handleAwesomeClick = handleAwesomeClick;
      
      // Simple notification system
      function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
          <div class="notification-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
          </div>
        `;
        
        // Add notification styles
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#6366f1'};
          color: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10001;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
          notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          notification.style.transform = 'translateX(100%)';
          setTimeout(() => {
            if (notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          }, 300);
        }, 3000);
      }
    }

    // Initialize service package builder when DOM is ready

    if (document.querySelector('.service-builder-section')) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          initializeServicePackageBuilder().catch(() => {});
        });
      } else {
        initializeServicePackageBuilder().catch(() => {});
      }
    }