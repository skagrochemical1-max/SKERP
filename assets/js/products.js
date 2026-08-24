/* products.js - Enhanced with Packaging Management & Units */
let allProducts = [], allPackagingOptions = [], editingProductId = null;
let currentPackagingOptions = [];
let technicalInventoryNames = [];
let productFormStep = 1;
let activeProductTab = 'Products';
let packagingUnits = {};

async function initPackagingUnits() {
  try {
    const saved = localStorage.getItem('packagingUnits');
    if (saved) {
      packagingUnits = JSON.parse(saved);
    } else {
      packagingUnits = {
        'Litre': ['1 Litre', '500 Ml', '250 Ml', '100 Ml', '50 Ml'],
        'Kg': ['1 Kg', '500 Gram', '250 Gram', '100 Gram']
      };
      savePackagingUnits();
    }
  } catch (e) {
    packagingUnits = {
      'Litre': ['1 Litre', '500 Ml', '250 Ml', '100 Ml', '50 Ml'],
      'Kg': ['1 Kg', '500 Gram', '250 Gram', '100 Gram']
    };
  }
}

function savePackagingUnits() {
  localStorage.setItem('packagingUnits', JSON.stringify(packagingUnits));
}

function updateUnitSelect() {
  const select = document.getElementById('product-unit-select');
  if (!select) return;
  const currentValue = select.value;
  select.innerHTML = Object.keys(packagingUnits).map(unit => 
    `<option value="${unit}" ${unit === currentValue ? 'selected' : ''}>${unit}</option>`
  ).join('');
  if (!select.value && select.options.length) {
    select.selectedIndex = 0;
  }
}

function renderUnitManager() {
  const list = document.getElementById('product-unit-pill-list');
  if (!list) return;
  const currentValue = document.getElementById('product-unit-select')?.value || '';
  const units = Object.keys(packagingUnits);
  if (!units.length) {
    list.innerHTML = '<div style="color: var(--text-muted);">No units added yet. Use the form below to add one.</div>';
    return;
  }
  list.innerHTML = units.map(unit => `
    <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 10px; border:1px solid var(--border); border-radius:999px; background:${unit === currentValue ? 'var(--surface)' : 'var(--bg)'}; color:${unit === currentValue ? 'var(--text)' : 'var(--text)'}; cursor:pointer;" onclick="setSelectedUnit(${JSON.stringify(unit)})">
      <span>${unit}</span>
      <button type="button" data-unit=${JSON.stringify(unit)} onclick="deleteUnit(event)" style="border:none; background:transparent; color: var(--danger); font-weight:700; cursor:pointer; padding:0;">×</button>
    </span>
  `).join('');
}

function setSelectedUnit(unit) {
  const select = document.getElementById('product-unit-select');
  if (!select) return;
  select.value = unit;
  onUnitChange();
}

function toggleUnitManager() {
  const panel = document.getElementById('product-unit-manager');
  if (!panel) return;
  const showing = panel.style.display !== 'none';
  panel.style.display = showing ? 'none' : 'grid';
  if (!showing) {
    renderUnitManager();
  }
}

function deleteUnit(event) {
  event.stopPropagation();
  const unit = event.currentTarget.dataset.unit;
  if (!unit || !packagingUnits[unit]) return;
  delete packagingUnits[unit];
  savePackagingUnits();
  updateUnitSelect();
  const select = document.getElementById('product-unit-select');
  if (select && select.value === unit) {
    select.value = select.options.length ? select.options[0].value : '';
  }
  onUnitChange();
  APP.showToast('Unit removed', 'success');
}

function addNewUnitFromInput() {
  const nameEl = document.getElementById('new-unit-name');
  const sizesEl = document.getElementById('new-unit-sizes');
  const unitName = nameEl?.value?.trim();
  if (!unitName) {
    APP.showToast('Enter a unit name', 'warning');
    return;
  }
  if (packagingUnits[unitName]) {
    APP.showToast('Unit already exists', 'warning');
    return;
  }
  const sizes = sizesEl?.value?.split(',').map(s => s.trim()).filter(Boolean) || [];
  packagingUnits[unitName] = sizes;
  savePackagingUnits();
  updateUnitSelect();
  renderUnitManager();
  const select = document.getElementById('product-unit-select');
  if (select) {
    select.value = unitName;
    onUnitChange();
  }
  if (nameEl) nameEl.value = '';
  if (sizesEl) sizesEl.value = '';
  APP.showToast('Unit added', 'success');
}

function onUnitChange() {
  const unitSelect = document.getElementById('product-unit-select');
  if (unitSelect) {
    const newUnit = unitSelect.value;
    currentPackagingOptions.forEach(opt => {
      if (opt.packaging_size) {
        const val = opt.packaging_size.toLowerCase();
        if (newUnit === 'Kg') {
          if (val.includes('1 ltr') || val.includes('1 l')) opt.packaging_size = '1 kg';
          else if (val.includes('500 ml')) opt.packaging_size = '500 gm';
          else if (val.includes('250 ml')) opt.packaging_size = '250 gm';
          else if (val.includes('100 ml')) opt.packaging_size = '100 gm';
          else {
            const available = packagingUnits[newUnit] || [];
            if (!available.includes(opt.packaging_size)) {
              opt.packaging_size = '';
            }
          }
        } else if (newUnit === 'Litre') {
          if (val.includes('1 kg') || val.includes('1 k')) opt.packaging_size = '1 Ltr';
          else if (val.includes('500 gm') || val.includes('500 g')) opt.packaging_size = '500 ml';
          else if (val.includes('250 gm') || val.includes('250 g')) opt.packaging_size = '250 ml';
          else if (val.includes('100 gm') || val.includes('100 g')) opt.packaging_size = '100 ml';
          else {
            const available = packagingUnits[newUnit] || [];
            if (!available.includes(opt.packaging_size)) {
              opt.packaging_size = '';
            }
          }
        } else {
          const available = packagingUnits[newUnit] || [];
          if (!available.includes(opt.packaging_size)) {
            opt.packaging_size = '';
          }
        }
      }
    });
  }
  renderPackagingOptionsContainer();
  renderUnitManager();
}

function onPackagingSizeChange(idx, value) {
  if (value === 'custom') {
    currentPackagingOptions[idx].packaging_size = '';
    renderPackagingOptionsContainer();
  } else {
    currentPackagingOptions[idx].packaging_size = value;
  }
}

function getFilteredProducts(data) {
  const query = (document.getElementById('search-input')?.value || '').trim().toLowerCase();
  const activePill = document.querySelector('#cat-pill-filters .cat-pill.active');
  const category = activePill ? (activePill.dataset.cat || '') : '';
  const normalize = value => (value || '').toString().trim().toLowerCase();
  const categoryAliases = {
    insecticides: ['insecticide', 'insecticides'],
    fungicides: ['fungicide', 'fungicides'],
    herbicides: ['herbicide', 'herbicides'],
    pgr: ['pgr']
  };
  const selectedCategory = normalize(category);
  const selectedCategoryMatches = selectedCategory
    ? (categoryAliases[selectedCategory] || [selectedCategory])
    : [];

  return data.filter(p => {
    if (selectedCategory) {
      const productCategory = normalize(p.category);
      if (!selectedCategoryMatches.includes(productCategory)) return false;
    }
    if (!query) return true;
    const haystack = `${p.name} ${p.batch_no || ''} ${p.brand || ''} ${p.category || ''} ${p.composition || ''} ${p.description || ''}`.toLowerCase();
    return haystack.includes(query);
  });
}

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

let rawInventoryItems = [];
async function loadTechnicalInventorySuggestions() {
  try {
    const { data: items, error } = await window.dbClient.from('inventory').select('*');
    if (error) throw error;
    rawInventoryItems = items || [];
    technicalInventoryNames = (rawInventoryItems || [])
      .filter(item => String(item.category || '').trim().toLowerCase() === 'technical')
      .map(item => item.name)
      .filter(Boolean);

    const datalist = document.getElementById('technical-inventory-options');
    if (datalist) {
      datalist.innerHTML = technicalInventoryNames.map(name => `<option value="${name}"></option>`).join('');
    }
    // Notify any autocomplete widgets that data is ready
    try { document.dispatchEvent(new CustomEvent('technicalInventoryLoaded')); } catch (e) {}
  } catch (err) {
    console.warn('Failed to load technical inventory suggestions:', err);
    technicalInventoryNames = [];
    rawInventoryItems = [];
  }
}

async function loadProducts() {
  console.log('Loading products...');
  updatePageDebug('Loading Products...', '#10B981');
  try {
    await loadTechnicalInventorySuggestions();
    UTILS.renderTableSkeleton('products-table');
    await DB.initDB();
    
    // Fetch products
    const { data: allProductsData, error: prodError } = await window.dbClient.from('products').select('*');
    if (prodError) throw prodError;
    allProducts = allProductsData || [];
    
    // Fetch packaging options
    const { data: allPackagingOptionsData, error: packError } = await window.dbClient.from('product_packaging').select('*');
    if (packError) throw packError;
    allPackagingOptions = allPackagingOptionsData || [];

    renderProductsTable(allProducts);
    renderPackagingTable(allPackagingOptions);
    updatePageDebug('Ready (' + allProducts.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
  } catch (err) {
    console.error('loadProducts failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load products: ' + err.message, 'error');
    renderProductsTable([]);
  }
}

function renderProductsTable(data) {
  const tbody = document.querySelector('#products-table tbody');
  if (!tbody) return;
  const filtered = getFilteredProducts(data);
  document.getElementById('total-info').textContent = `${filtered.length} product${filtered.length !== 1 ? 's' : ''}`;
  if (!filtered.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="9"><div class="empty-state"><h3>No products found</h3><p>Start by adding finished goods here.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = filtered.map(p => {
    let toxBadge = '—';
    if (p.toxicity_triangle === 'Green') toxBadge = '<span class="badge badge-success">Green</span>';
    else if (p.toxicity_triangle === 'Blue') toxBadge = '<span class="badge badge-info">Blue</span>';
    else if (p.toxicity_triangle === 'Yellow') toxBadge = '<span class="badge badge-warning">Yellow</span>';
    else if (p.toxicity_triangle === 'Red') toxBadge = '<span class="badge badge-danger">Red</span>';

    return `<tr>
      <td><input type="checkbox" class="row-check" value="${p.id}"></td>
      <td class="cell-bold">${p.name}</td>
      <td class="cell-mono">${p.batch_no || '—'}</td>
      <td>${p.brand || '—'}</td>
      <td><span class="badge badge-purple">${p.category || '—'}</span></td>
      <td>${toxBadge}</td>
      <td>${UTILS.fmtCurrency(p.purchase_price || 0)}</td>
      <td>${UTILS.fmtCurrency(p.sell_price || 0)}</td>
      <td><div class="row-actions">
        <button class="action-btn edit" onclick="openEdit(${p.id})" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn delete" onclick="deleteProduct(${p.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  UTILS.applyMobileTableLabels('products-table');
}

function renderPackagingTable(data) {
  const tbody = document.querySelector('#packaging-table tbody');
  if (!tbody) return;
  const isMobileLayout = window.innerWidth <= 768;

  const query = (document.getElementById('packaging-search-input')?.value || '').trim().toLowerCase();

  const groupMap = {};
  data.forEach(pkg => {
    const product = allProducts.find(p => p.id === pkg.product_id) || { id: pkg.product_id, name: 'N/A', purchase_price: 0, sell_price: 0 };
    if (query && !product.name.toLowerCase().includes(query)) return;
    if (!groupMap[pkg.product_id]) {
      groupMap[pkg.product_id] = { product, variants: [] };
    }
    groupMap[pkg.product_id].variants.push(pkg);
  });

  const groups = Object.values(groupMap);
  const totalVariants = groups.reduce((s, g) => s + g.variants.length, 0);
  document.getElementById('packaging-total-info').textContent =
    `${groups.length} product${groups.length !== 1 ? 's' : ''} · ${totalVariants} variant${totalVariants !== 1 ? 's' : ''}`;

  if (!groups.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6"><div class="empty-state"><h3>No packaging variants</h3><p>Add packaging options to products.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = groups.map(({ product, variants }) => {
    const sortedVariants = UTILS.sortPackSizesDescending(variants, v => v.packaging_size);
    const baseVariant = sortedVariants.find(v => parseFloat(v.purchase_price) > 0) || sortedVariants[0];

    const sizeLines = sortedVariants.map(v => {
      const isBase = v.id === baseVariant.id;
      const baseBadge = isBase
        ? `<span style="display:inline-flex;align-items:center;padding:1px 7px;border-radius:999px;background:rgba(16,185,129,0.12);color:var(--success);border:1px solid rgba(16,185,129,0.25);font-size:10px;font-weight:600;margin-left:6px;">Base</span>`
        : '';
      return `<div class="pkg-variant-row${isBase ? ' pkg-variant-base' : ''}">
        <span class="pkg-variant-size">${v.packaging_size || '—'}${baseBadge}</span>
      </div>`;
    }).join('');

    const priceLines = sortedVariants.map(v => {
      const isBase = v.id === baseVariant.id;
      return `<div class="pkg-variant-row${isBase ? ' pkg-variant-base' : ''}">
        <span class="pkg-variant-price">${v.sell_price ? UTILS.fmtCurrency(v.sell_price) : '—'}</span>
      </div>`;
    }).join('');

    if (isMobileLayout) {
      const mobileVariantLines = sortedVariants.map(v => {
        const isBase = v.id === baseVariant.id;
        return `<div class="pkg-mobile-variant-row">
          <span class="pkg-mobile-variant-name">${v.packaging_size || '—'}${isBase ? '<span class="pkg-mobile-badge">Base</span>' : ''}</span>
          <span class="pkg-mobile-variant-price">${v.sell_price ? UTILS.fmtCurrency(v.sell_price) : '—'}</span>
        </div>`;
      }).join('');

      return `<tr class="pkg-group-row pkg-mobile-row">
        <td colspan="6" class="pkg-mobile-cell">
          <article class="pkg-mobile-card">
            <div class="pkg-mobile-header">
              <div class="pkg-mobile-title">${product.name}</div>
              <div class="pkg-mobile-count">${variants.length} variants</div>
            </div>
            <div class="pkg-mobile-label">Variant Size</div>
            <div class="pkg-mobile-variants">${mobileVariantLines}</div>
            <div class="pkg-mobile-meta">
              <div class="pkg-mobile-meta-row"><span>Base Purchase Price (₹)</span><strong>${baseVariant.purchase_price ? UTILS.fmtCurrency(baseVariant.purchase_price) : '—'}</strong></div>
              <div class="pkg-mobile-meta-row"><span>Base Selling Price (₹)</span><strong>${baseVariant.sell_price ? UTILS.fmtCurrency(baseVariant.sell_price) : '—'}</strong></div>
            </div>
            <div class="pkg-mobile-actions">
              <button class="action-btn edit" onclick="openEdit(${product.id})" title="Edit product"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn delete" onclick="deletePackagingGroup(${product.id})" title="Delete all variants"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
            </div>
          </article>
        </td>
      </tr>`;
    }

    return `<tr class="pkg-group-row">
      <td class="cell-bold" style="vertical-align:top;">${product.name}</td>
      <td style="vertical-align:top;padding-top:10px;padding-bottom:10px;"><div class="pkg-variant-stack">${sizeLines}</div></td>
      <td style="vertical-align:top;padding-top:10px;padding-bottom:10px;"><div class="pkg-variant-stack">${priceLines}</div></td>
      <td style="vertical-align:top;">${baseVariant.purchase_price ? UTILS.fmtCurrency(baseVariant.purchase_price) : '—'}</td>
      <td style="vertical-align:top;">${baseVariant.sell_price ? UTILS.fmtCurrency(baseVariant.sell_price) : '—'}</td>
      <td style="vertical-align:top;"><div class="row-actions">
        <button class="action-btn edit" onclick="openEdit(${product.id})" title="Edit product"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn delete" onclick="deletePackagingGroup(${product.id})" title="Delete all variants"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');

  UTILS.applyMobileTableLabels('packaging-table');
}

function openAdd() {
  editingProductId = null;
  document.getElementById('modal-title').textContent = 'New Product';
  const form = document.getElementById('product-form');
  form.reset();
  currentPackagingOptions = [];
  renderPackagingOptionsContainer();
  updateUnitSelect();
  renderUnitManager();
  loadTechnicalInventorySuggestions();
  goToProductStep(1);
  APP.openModal('product-modal');
}

function openEdit(id) {
  editingProductId = id;
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Edit Product';
  UTILS.populateForm('product-form', p);
  
  // Filter packaging options for this product
  currentPackagingOptions = (allPackagingOptions.filter(pkg => pkg.product_id === id).map(opt => ({
    ...opt,
    is_base: Boolean(parseFloat(opt.purchase_price) > 0)
  }))) || [];
  
  if (currentPackagingOptions.length) {
    const baseIndex = currentPackagingOptions.findIndex(opt => opt.is_base);
    if (baseIndex >= 0) {
      currentPackagingOptions = currentPackagingOptions.map((opt, idx) => ({
        ...opt,
        is_base: idx === baseIndex
      }));
    } else {
      currentPackagingOptions[0].is_base = true;
    }
  }
  
  renderPackagingOptionsContainer();
  updateUnitSelect();
  renderUnitManager();
  loadTechnicalInventorySuggestions();
  goToProductStep(1);
  APP.openModal('product-modal');
}

function addPackagingOption() {
  const hasBase = currentPackagingOptions.some(opt => opt.is_base);
  currentPackagingOptions.push({
    id: 'new-' + Date.now(),
    product_id: editingProductId,
    packaging_size: '',
    purchase_price: 0,
    sell_price: 0,
    is_base: !hasBase
  });
  renderPackagingOptionsContainer();
}

function setBaseVariant(idx) {
  currentPackagingOptions = currentPackagingOptions.map((opt, index) => ({
    ...opt,
    is_base: index === idx
  }));
  renderPackagingOptionsContainer();
}

function removePackagingOption(idx) {
  currentPackagingOptions.splice(idx, 1);
  if (!currentPackagingOptions.some(opt => opt.is_base) && currentPackagingOptions.length) {
    currentPackagingOptions[0].is_base = true;
  }
  renderPackagingOptionsContainer();
}

/* ------------------------- Product Name Autocomplete ------------------------- */
function setupProductNameAutocomplete() {
  const input = document.getElementById('product-name-input');
  const suggWrap = document.getElementById('product-name-suggestions');
  if (!input || !suggWrap) return;

  let activeIndex = -1;
  let suggestions = [];

  function renderSuggestions(list) {
    suggWrap.innerHTML = '';
    if (!list || !list.length) {
      suggWrap.classList.remove('active');
      return;
    }
    const frag = document.createDocumentFragment();
    list.slice(0, 12).forEach((name, idx) => {
      const div = document.createElement('div');
      div.className = 'sugg-item';
      div.tabIndex = -1;
      div.dataset.index = idx;
      div.textContent = name;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault(); // prevent blur
        selectSuggestion(idx);
      });
      frag.appendChild(div);
    });
    suggWrap.appendChild(frag);
    suggWrap.classList.add('active');
  }

  function selectSuggestion(idx) {
    const name = suggestions[idx];
    if (name) {
      input.value = name;
      // Check if product with this name already exists in allProducts (case-insensitive)
      const existsInProducts = allProducts.some(p => String(p.name).trim().toLowerCase() === name.trim().toLowerCase());
      if (!existsInProducts) {
        // Find matching inventory item to fetch price
        const invItem = rawInventoryItems.find(item => String(item.name).trim().toLowerCase() === name.trim().toLowerCase());
        if (invItem) {
          const invCost = parseFloat(invItem.avg_cost || invItem.opening_cost) || 0;
          if (invCost > 0) {
            // Check if packaging options exist; if not, create one
            if (currentPackagingOptions.length === 0) {
              currentPackagingOptions.push({
                id: 'new-' + Date.now(),
                product_id: editingProductId,
                packaging_size: '',
                purchase_price: invCost,
                sell_price: 0,
                is_base: true
              });
            } else {
              // Set the base variant purchase_price
              const baseOpt = currentPackagingOptions.find(opt => opt.is_base) || currentPackagingOptions[0];
              if (baseOpt) {
                baseOpt.purchase_price = invCost;
                baseOpt.is_base = true;
              }
            }
            renderPackagingOptionsContainer();
          }
        }
      }
    }
    hideSuggestions();
    input.focus();
  }

  function hideSuggestions() {
    activeIndex = -1;
    suggestions = [];
    suggWrap.innerHTML = '';
    suggWrap.classList.remove('active');
  }

  function onInput(e) {
    const q = String(e.target.value || '').trim().toLowerCase();
    if (!q) {
      // show top suggestions
      suggestions = technicalInventoryNames.slice(0, 12);
    } else {
      suggestions = technicalInventoryNames.filter(n => n.toLowerCase().includes(q));
    }
    renderSuggestions(suggestions);
  }

  function onKeyDown(e) {
    const items = suggWrap.querySelectorAll('.sugg-item');
    if (!items.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % items.length;
      items.forEach(it => it.classList.remove('active'));
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + items.length) % items.length;
      items.forEach(it => it.classList.remove('active'));
      items[activeIndex].classList.add('active');
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0 && items[activeIndex]) {
        e.preventDefault();
        selectSuggestion(activeIndex);
      }
    } else if (e.key === 'Escape') {
      hideSuggestions();
    }
  }

  input.addEventListener('input', onInput);
  input.addEventListener('keydown', onKeyDown);
  input.addEventListener('focus', (e) => {
    // populate suggestions when focused
    suggestions = technicalInventoryNames.slice(0, 12);
    renderSuggestions(suggestions);
  });
  // Refresh suggestions when inventory data becomes available
  document.addEventListener('technicalInventoryLoaded', () => {
    if (document.activeElement === input) {
      suggestions = technicalInventoryNames.slice(0, 12);
      renderSuggestions(suggestions);
    }
  });
  input.addEventListener('blur', () => {
    // hide after a small delay to allow click selection
    setTimeout(() => hideSuggestions(), 150);
  });
}

// Initialize autocomplete when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  setupProductNameAutocomplete();
});

function renderPackagingOptionsContainer() {
  const container = document.getElementById('packaging-options-container');
  if (!container) return;
  
  const unit = document.getElementById('product-unit-select')?.value || 'Litre';
  const availableSizes = packagingUnits[unit] || [];
  
  if (!currentPackagingOptions.length) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 13px; margin-bottom: 12px;">No packaging options added. Click "Add Packaging Option" to add one.</p>';
    return;
  }

  if (window.innerWidth <= 1024) {
    container.innerHTML = currentPackagingOptions.map((opt, idx) => {
      const isBase = Boolean(opt.is_base);
      return `<div class="packaging-card" style="border: 1px solid var(--border); border-radius: var(--radius); padding: 14px; margin-bottom: 12px; background: ${isBase ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)'}; display: grid; gap: 10px; position: relative;">
          <div class="packaging-card-head" style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-weight:700; font-size:12px; color:var(--text-secondary);">Variant #${idx + 1}</span>
            <div class="packaging-card-actions" style="display:flex; gap:8px; align-items:center;">
              ${isBase ? '<span style="padding:2px 8px; border-radius:999px; background:var(--success-light); color:var(--success); font-size:11px; font-weight:600;">Base</span>' : `<button type="button" class="btn btn-sm btn-secondary" style="font-size:11px; padding:3px 8px; height:auto;" onclick="setBaseVariant(${idx})">Set Base</button>`}
              <button type="button" class="btn btn-sm" style="background:var(--danger); color:var(--text-bright); border:none; padding:4px 8px; border-radius:4px; font-size:11px; height:auto; cursor:pointer;" onclick="removePackagingOption(${idx})">Remove</button>
            </div>
          </div>
          <div class="packaging-card-fields" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <div class="packaging-field packaging-field-size" style="grid-column: span 2;">
              <label style="font-size:11px; color:var(--text-muted); font-weight:600; display:block; margin-bottom:4px;">Packaging Size</label>
              <select class="form-select" onchange="onPackagingSizeChange(${idx}, this.value)" style="font-size: 13px; padding: 8px 12px; width: 100%;">
                <option value="">Select size...</option>
                ${availableSizes.map(size => `<option value="${size}" ${opt.packaging_size === size ? 'selected' : ''}>${size}</option>`).join('')}
                <option value="custom">Custom size...</option>
              </select>
              ${opt.packaging_size && !availableSizes.includes(opt.packaging_size) ? 
                `<input type="text" class="form-input" value="${opt.packaging_size}" onchange="currentPackagingOptions[${idx}].packaging_size = this.value" style="font-size: 13px; padding: 8px 12px; margin-top: 6px; width: 100%;" placeholder="Enter custom size">` : ''}
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-muted); font-weight:600; display:block; margin-bottom:4px;">Purchase Price (₹)</label>
              <input type="number" class="form-input" placeholder="0.00" value="${opt.purchase_price || 0}" step="0.01" 
                onchange="currentPackagingOptions[${idx}].purchase_price = parseFloat(this.value) || 0" style="font-size: 13px; padding: 8px 12px; width: 100%;" ${isBase ? '' : 'disabled'}>
            </div>
            <div>
              <label style="font-size:11px; color:var(--text-muted); font-weight:600; display:block; margin-bottom:4px;">Selling Price (₹)</label>
              <input type="number" class="form-input" placeholder="0.00" value="${opt.sell_price || 0}" step="0.01" 
                onchange="currentPackagingOptions[${idx}].sell_price = parseFloat(this.value) || 0" style="font-size: 13px; padding: 8px 12px; width: 100%;">
            </div>
          </div>
        </div>`;
    }).join('');
  } else {
    container.innerHTML = `
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: var(--bg);">
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border);">Base</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border);">Packaging Size</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border);">Purchase Price (₹)</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border);">Selling Price (₹)</th>
              <th style="padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-secondary); border-bottom: 1px solid var(--border);">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${currentPackagingOptions.map((opt, idx) => {
              const isBase = Boolean(opt.is_base);
              return `
                <tr style="border-bottom: 1px solid var(--border); background:${isBase ? 'rgba(16, 185, 129, 0.08)' : 'transparent'};">
                  <td style="padding: 8px 12px; vertical-align: middle;">
                    ${isBase ? '<span style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; border-radius:999px; background:var(--success-muted); color:var(--success); font-size:12px;">Base</span>' : `<button type="button" class="btn btn-sm btn-secondary" style="font-size:12px; padding:4px 10px;" onclick="setBaseVariant(${idx})">Set base</button>`}
                  </td>
                  <td style="padding: 8px 12px;">
                    <select class="form-select" onchange="onPackagingSizeChange(${idx}, this.value)" style="font-size: 12px; padding: 6px 8px; width: 100%;">
                      <option value="">Select size...</option>
                      ${availableSizes.map(size => `<option value="${size}" ${opt.packaging_size === size ? 'selected' : ''}>${size}</option>`).join('')}
                      <option value="custom">Custom size...</option>
                    </select>
                    ${opt.packaging_size && !availableSizes.includes(opt.packaging_size) ? 
                      `<input type="text" class="form-input" value="${opt.packaging_size}" onchange="currentPackagingOptions[${idx}].packaging_size = this.value" style="font-size: 12px; padding: 6px 8px; margin-top: 4px; width: 100%;" placeholder="Enter custom size">` : ''}
                  </td>
                  <td style="padding: 8px 12px;">
                    <input type="number" class="form-input" placeholder="0.00" value="${opt.purchase_price || 0}" step="0.01" 
                      onchange="currentPackagingOptions[${idx}].purchase_price = parseFloat(this.value) || 0" style="font-size: 12px; padding: 6px 8px; width: 100%;" ${isBase ? '' : 'disabled'}>
                  </td>
                  <td style="padding: 8px 12px;">
                    <input type="number" class="form-input" placeholder="0.00" value="${opt.sell_price || 0}" step="0.01" 
                      onchange="currentPackagingOptions[${idx}].sell_price = parseFloat(this.value) || 0" style="font-size: 12px; padding: 6px 8px; width: 100%;">
                  </td>
                  <td style="padding: 8px 12px;">
                    <button type="button" class="btn btn-sm" style="background: var(--danger); color: var(--text-bright); border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;" 
                      onclick="removePackagingOption(${idx})">Remove</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }
}

async function saveProduct() {
  const d = UTILS.getFormData('product-form');
  if (!d.name) { APP.showToast('Name is required', 'error'); return; }
  if (currentPackagingOptions.length === 0) { APP.showToast('Add at least one packaging option', 'error'); return; }
  
  const baseVariant = currentPackagingOptions.find(opt => opt.is_base);
  if (!baseVariant) { APP.showToast('Select a base variant for pricing', 'error'); return; }
  if (!baseVariant.packaging_size) { APP.showToast('Base variant must have a size', 'error'); return; }
  if (!baseVariant.sell_price || baseVariant.sell_price <= 0) { APP.showToast('Base variant selling price is required', 'error'); return; }

  try {
    const defaultGst = document.getElementById('default-gst')?.value || '';
    const productPurchasePrice = baseVariant.purchase_price || 0;
    const productSellPrice = baseVariant.sell_price || 0;

    const payload = {
      name: d.name,
      brand: d.brand || '',
      category: d.category || '',
      composition: d.composition || '',
      unit: d.unit || 'Kg',
      purchase_price: productPurchasePrice,
      sell_price: productSellPrice,
      gst: defaultGst,
      description: d.description || ''
    };
    if (d.batch_no) {
      payload.batch_no = d.batch_no;
    }

    let savedProductId = editingProductId;

    if (editingProductId) {
      const { error: prodErr } = await window.dbClient.from('products').update(payload).eq('id', editingProductId);
      if (prodErr) throw prodErr;
      
      const { error: delErr } = await window.dbClient.from('product_packaging').delete().eq('product_id', editingProductId);
      if (delErr) throw delErr;
    } else {
      const { data: prodData, error: prodErr } = await window.dbClient.from('products').insert([payload]).select();
      if (prodErr) throw prodErr;
      savedProductId = prodData[0].id;
    }

    const pkgPayload = currentPackagingOptions.map(opt => ({
      product_id: savedProductId,
      packaging_size: opt.packaging_size,
      purchase_price: opt.is_base ? (parseFloat(opt.purchase_price) || 0) : 0,
      sell_price: parseFloat(opt.sell_price) || 0
      // is_base is not in the database schema; it is inferred based on purchase_price > 0
    }));

    if (pkgPayload.length > 0) {
      const { error: pkgErr } = await window.dbClient.from('product_packaging').insert(pkgPayload);
      if (pkgErr) throw pkgErr;
    }

    APP.showToast(editingProductId ? 'Product updated!' : 'Product added!', 'success');
    APP.closeModal('product-modal');
    setTimeout(() => loadProducts(), 100);
  } catch (err) {
    console.error('saveProduct failed:', err);
    APP.showToast('Error saving product: ' + err.message, 'error');
  }
}

async function deleteProduct(id) {
  APP.showConfirm('Delete this product and its packaging variants?', async () => {
    try {
      const { error } = await window.dbClient.from('products').delete().eq('id', id);
      if (error) throw error;
      
      APP.showToast('Product deleted!', 'success');
      setTimeout(() => loadProducts(), 100);
    } catch (err) {
      console.error(err);
      APP.showToast('Failed to delete product: ' + err.message, 'error');
    }
  });
}

async function deletePackagingGroup(productId) {
  if (confirm('Delete all packaging variants for this product?')) {
    try {
      const p = allProducts.find(x => x.id === productId);
      if (!p) return;
      
      const { error } = await window.dbClient.from('product_packaging').delete().eq('product_id', productId);
      if (error) throw error;

      APP.showToast('Packaging variants deleted!', 'success');
      setTimeout(() => loadProducts(), 100);
    } catch (err) {
      console.error(err);
      APP.showToast('Error deleting packaging variants: ' + err.message, 'error');
    }
  }
}

function goToProductStep(step) {
  productFormStep = Math.max(1, Math.min(2, step));

  document.querySelectorAll('#product-modal .product-step-panel').forEach(panel => {
    panel.classList.toggle('active', Number(panel.dataset.stepPanel) === productFormStep);
  });

  const modalBody = document.querySelector('#product-modal .modal-body');
  if (modalBody) modalBody.scrollTop = 0;

  const isStepOne = productFormStep === 1;
  document.getElementById('product-step-pill-1')?.classList.toggle('active', isStepOne);
  document.getElementById('product-step-pill-2')?.classList.toggle('active', !isStepOne);

  const prevBtn = document.getElementById('product-prev-btn');
  const nextBtn = document.getElementById('product-next-btn');
  const saveBtn = document.getElementById('product-save-btn');
  if (prevBtn) prevBtn.style.display = isStepOne ? 'none' : 'inline-flex';
  if (nextBtn) nextBtn.style.display = isStepOne ? 'inline-flex' : 'none';
  if (saveBtn) saveBtn.style.display = isStepOne ? 'none' : 'inline-flex';
}

function productFormNextStep() {
  const d = UTILS.getFormData('product-form');
  if (!d.name) {
    APP.showToast('Please enter product name before continuing', 'error');
    return;
  }
  goToProductStep(2);
}

function productFormPrevStep() {
  goToProductStep(1);
}

document.addEventListener('DOMContentLoaded', () => {
  initPackagingUnits().then(() => {
    updateUnitSelect();
    renderUnitManager();
  });
  
  const tabBtns = document.querySelectorAll('.tabs .tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      activeProductTab = btn.dataset.tab;
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      document.getElementById('products-table-wrap').style.display = activeProductTab === 'Products' ? 'block' : 'none';
      document.getElementById('packaging-table-wrap').style.display = activeProductTab === 'Packaging' ? 'block' : 'none';
    });
  });

  goToProductStep(1);

  document.querySelectorAll('#cat-pill-filters .cat-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('#cat-pill-filters .cat-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      renderProductsTable(allProducts);
    });
  });

  document.getElementById('search-input')?.addEventListener('input', () => renderProductsTable(allProducts));
  document.getElementById('packaging-search-input')?.addEventListener('input', () => renderPackagingTable(allPackagingOptions));
});

loadProducts();
