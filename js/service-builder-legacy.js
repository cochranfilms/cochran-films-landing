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

    if (!serviceItemsWrap || !dropzone || !tabs.length) return;

    let selections = [];

    function formatCurrency(n){ return `$${Number(n||0).toFixed(2).replace(/\.00$/, '')}`; }

    function renderSelections(){
      if (!selections.length){
        selectedServices.style.display = 'none';
        quoteSummary.style.display = 'none';
        return;
      }
      selectedServices.style.display = 'block';
      quoteSummary.style.display = 'block';
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
  }

  // Expose globally so module loader can call it
  window.initializeServicePackageBuilder = initializeServicePackageBuilder;
})();


