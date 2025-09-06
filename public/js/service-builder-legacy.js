/* Legacy, DOM-driven Service Builder (parity with index2.html)
   - No classes, initializes against existing markup
   - Robust tab filtering and drag-and-drop with click-to-add fallback
*/
(function(){
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function initializeServicePackageBuilder() {
    const serviceItemsWrap = qs('#serviceItems');
    const dropzone = qs('#packageDropzone');
    const selectedServices = qs('#selectedServices');
    const quoteSummary = qs('#quoteSummary');
    const quoteTotal = qs('#quoteTotal');
    const quoteBreakdown = qs('#quoteBreakdown');
    const tabs = qsa('.category-tab');
    const createBtn = document.getElementById('generateInvoice');
    const quoteActions = document.querySelector('.quote-actions');
    const packageBuilder = document.querySelector('.package-builder');

    if (!serviceItemsWrap || !dropzone || !tabs.length) return;

    let selections = [];

    function formatCurrency(n){ return `$${Number(n||0).toFixed(2).replace(/\.00$/, '')}`; }

    function ensureContactFields(){
      // Create lightweight contact inputs below the package card (not inside it)
      let contact = document.getElementById('builderContact');
      if (!contact) {
        contact = document.createElement('div');
        contact.id = 'builderContact';
        contact.innerHTML = 
          '<div class="form-group" style="margin-top:12px;">\
            <label for="builderName">Your Name</label>\
            <input id="builderName" type="text" placeholder="Full name" class="option-input" />\
          </div>\
          <div class="form-group" style="margin-top:8px;">\
            <label for="builderPhone">Phone</label>\
            <input id="builderPhone" type="tel" placeholder="(555) 123-4567" class="option-input" />\
          </div>\
          <div class="form-group" style="margin-top:8px;">\
            <label for="builderEmail">Email</label>\
            <input id="builderEmail" type="email" placeholder="you@example.com" class="option-input" />\
          </div>\
          <div class="form-group" style="margin-top:8px;">\
            <label for="builderNotes">Notes</label>\
            <textarea id="builderNotes" rows="3" placeholder="Project details, preferred times, etc." class="option-input"></textarea>\
          </div>';
        // Insert after the package builder card
        if (packageBuilder && packageBuilder.parentElement) {
          packageBuilder.parentElement.insertBefore(contact, packageBuilder.nextSibling);
        } else if (quoteActions && quoteActions.parentElement) {
          quoteActions.parentElement.insertBefore(contact, quoteActions.nextSibling);
        } else {
          quoteSummary.parentElement.appendChild(contact);
        }
      }
      contact.style.display = 'block';
    }

    function renderSelections(){
      if (!selections.length){
        selectedServices.style.display = 'none';
        quoteSummary.style.display = 'none';
        const contact = document.getElementById('builderContact');
        if (contact) contact.style.display = 'none';
        return;
      }
      selectedServices.style.display = 'block';
      quoteSummary.style.display = 'block';
      ensureContactFields();
      selectedServices.innerHTML = selections.map(s => (
        `<div class="selected-service" data-selected-id="${s.id}">
          <div class="selected-service-info">
            <div class="selected-service-icon"><i class="fa-solid fa-layer-group"></i></div>
            <div class="selected-service-details">
              <h5>${s.name}</h5>
              <p>${formatCurrency(s.price)}</p>
            </div>
          </div>
          <div class="selected-service-actions">
            <span class="item-price">${formatCurrency(s.price)}</span>
            <button class="remove-service" data-service="${s.id}" aria-label="Remove">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>`
      )).join('');

      const total = selections.reduce((sum, s) => sum + (s.price||0), 0);
      quoteTotal.textContent = formatCurrency(total);
      quoteBreakdown.innerHTML = selections.map(s => (
        `<div class="quote-item"><span class="quote-item-label">${s.name}</span><span class="quote-item-value">${formatCurrency(s.price)}</span></div>`
      )).join('');
    }

    function addSelectionFromCard(card){
      if (!card) return;
      const id = card.dataset.service || card.dataset.package;
      const name = qs('.service-info h4', card)?.textContent?.trim() || 'Service';
      const priceText = qs('.service-price', card)?.textContent || '$0';
      const price = parseInt(String(priceText).replace(/[^0-9]/g, ''), 10) || 0;
      if (!id) return;
      if (!selections.some(s => s.id === id)) selections.push({ id, name, price });
      renderSelections();
    }

    // Tab filtering
    function filterBy(category){
      qsa('.service-item').forEach(el => {
        const match = category === 'all' || el.dataset.category === category;
        el.style.display = match ? 'flex' : 'none';
        el.classList.toggle('hidden', !match);
      });
      qsa('.service-section-header').forEach(h => {
        const match = category === 'all' || h.dataset.category === category;
        h.style.display = match ? 'block' : 'none';
        h.classList.toggle('hidden', !match);
      });
      serviceItemsWrap.scrollTop = 0;
    }

    tabs.forEach(tab => {
      if (tab.dataset.bound === '1') return;
      tab.dataset.bound = '1';
      tab.addEventListener('click', (e) => {
        e.preventDefault();
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        filterBy(tab.dataset.category || 'website');
      }, { passive: false });
    });

    // Default filter
    const active = qs('.category-tab.active');
    filterBy(active?.dataset?.category || 'website');

    // Drag handling
    qsa('.service-item').forEach(item => {
      if (!item.hasAttribute('draggable')) item.setAttribute('draggable', 'true');
      item.addEventListener('dragstart', (e) => {
        const id = item.dataset.service || '';
        const payload = { id };
        try { e.dataTransfer.setData('text/plain', JSON.stringify(payload)); } catch(_) {}
        try { e.dataTransfer.setData('text/id', id); } catch(_) {}
        e.dataTransfer.effectAllowed = 'copy';
        item.classList.add('dragging');
      });
      item.addEventListener('dragend', () => item.classList.remove('dragging'));
      // Click-to-add fallback
      item.addEventListener('click', () => addSelectionFromCard(item));
    });

    const onOver = (e) => { e.preventDefault(); dropzone.classList.add('drag-over'); };
    dropzone.addEventListener('dragenter', onOver);
    dropzone.addEventListener('dragover', onOver);
    dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
    dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropzone.classList.remove('drag-over');
      const id = e.dataTransfer.getData('text/id') || (function(){ try { return JSON.parse(e.dataTransfer.getData('text/plain')||'{}').id; } catch(_){ return ''; } })();
      const card = id ? qs(`.service-item[data-service="${id}"]`) : qs('.service-item.dragging');
      addSelectionFromCard(card);
    });

    // Remove selection
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-service');
      if (!btn) return;
      const id = btn.dataset.service;
      selections = selections.filter(s => s.id !== id);
      renderSelections();
    });

    // EmailJS submit (parity with index2)
    if (createBtn) {
      createBtn.addEventListener('click', async () => {
        if (!selections.length) return;
        try {
          if (typeof emailjs !== 'undefined') {
            const serviceId = 'service_t11yvru';
            const templateId = 'service_builder';
            const lines = selections.map(s => `- ${s.name}: ${formatCurrency(s.price)}`).join('\n');
            const total = selections.reduce((sum, s) => sum + (s.price||0), 0);
            const nameInput = document.getElementById('builderName');
            const phoneInput = document.getElementById('builderPhone');
            const emailInput = document.getElementById('builderEmail');
            const notesInput = document.getElementById('builderNotes');
            const NAME = (nameInput?.value || '').trim();
            const PHONE = (phoneInput?.value || '').trim();
            if (!NAME) { alert('Please enter your name.'); return; }
            if (!PHONE) { alert('Please enter your phone.'); return; }
            const EMAIL = (emailInput?.value || '').trim();
            const NOTES = (notesInput?.value || '').trim();
            if (!EMAIL || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) { alert('Please enter a valid email.'); return; }

            // Build simple text lines for universal EmailJS editors
            const ITEM_TEXT = selections.map(s => `${s.name} — ${formatCurrency(s.price)}`).join('\n');
            const QUOTE_TOTAL = formatCurrency(total);
            const payload = { NAME, PHONE, EMAIL, NOTES, ITEM_TEXT, QUOTE_TOTAL };
            console.log('EmailJS payload:', payload);
            await emailjs.send(serviceId, templateId, payload);
            // Clear selections on success
            selections = [];
            renderSelections();
            alert('Request sent! We will contact you shortly.');
          } else {
            alert('Email service not available.');
          }
        } catch (e) {
          console.error('EmailJS error', e);
          alert('Failed to send. Please try again.');
        }
      });
    }
  }

  // Expose globally so module loader can call it
  window.initializeServicePackageBuilder = initializeServicePackageBuilder;
})();


