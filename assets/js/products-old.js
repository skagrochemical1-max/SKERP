/* products.js */
let allProducts = [], editingProductId = null;
let productFormStep = 1;

const PACKAGING_PRESETS = {
  Litre: ['1 Ltr', '500 ml', '250 ml', '100 ml', '50 ml'],
  Kg: ['1 kg', '500 gm', '250 gm', '100 gm']
};

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadProducts() {
  console.log('Loading products...');
  updatePageDebug('Loading Products...', '#10B981');
  try {
    UTILS.renderTableSkeleton('products-table');
    await DB.initDB();
    allProducts = DB.dbAll("SELECT * FROM products ORDER BY name");
    renderTable(allProducts);
    updatePageDebug('Ready (' + allProducts.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
  } catch (err) {
    console.error('loadProducts failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load products', 'error');
    renderTable([]);
  }
}

function renderTable(data) {
  const tbody = document.querySelector('#products-table tbody');
  if (!tbody) return;
  document.getElementById('total-info').textContent = `${data.length} product${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><h3>No products found</h3><p>Start by adding finished goods here.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(p => `<tr>
    <td><input type="checkbox" class="row-check" value="${p.id}"></td>
    <td class="cell-bold">${p.name}</td>
    <td class="cell-mono">${p.batch_no || '—'}</td>
    <td>${p.brand || '—'}</td>
    <td><span class="badge badge-purple">${p.category || '—'}</span></td>
    <td>${UTILS.fmtCurrency(p.purchase_price || 0)}</td>
    <td>${UTILS.fmtCurrency(p.sell_price || 0)}</td>
    <td><div class="row-actions">
      <button class="action-btn edit" onclick="openEdit(${p.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
    </div></td>
  </tr>`).join('');
  UTILS.applyMobileTableLabels('products-table');
}

function openAdd() {
  editingProductId = null;
  document.getElementById('modal-title').textContent = 'New Product';
  const form = document.getElementById('product-form');
  form.reset();
  document.getElementById('product-unit-hidden').value = 'Litre';
  document.getElementById('custom-packaging-input').value = '';
  goToProductStep(1);
  buildPackagingOptions('Litre');
  APP.openModal('product-modal');
}

function openEdit(id) {
  editingProductId = id;
  const p = allProducts.find(x => x.id === id);
  if (!p) return;
  document.getElementById('modal-title').textContent = 'Edit Product';
  UTILS.populateForm('product-form', p);
  let baseUnit = inferPackagingBase(p.packaging, p.unit);
  if (baseUnit !== 'Custom' && !isPackagingPresetValue(baseUnit, p.packaging)) {
    baseUnit = 'Custom';
  }
  document.getElementById('packaging-base-unit').value = baseUnit;
  if (baseUnit === 'Custom') {
    document.getElementById('custom-packaging-input').value = p.packaging || '';
    buildPackagingOptions('Custom');
  } else {
    document.getElementById('custom-packaging-input').value = '';
    buildPackagingOptions(baseUnit, p.packaging || '');
  }
  syncUnitFromPackaging();
  goToProductStep(1);
  APP.openModal('product-modal');
}

function saveProduct() {
  const d = UTILS.getFormData('product-form');
  d.packaging = resolvePackagingValue();
  d.unit = document.getElementById('product-unit-hidden').value;
  if (!d.name) { APP.showToast('Name is required', 'error'); return; }
  try {
    if (editingProductId) {
      DB.dbRun("UPDATE products SET name=?, batch_no=?, brand=?, category=?, unit=?, composition=?, packaging=?, purchase_price=?, sell_price=?, gst=?, description=? WHERE id=?", 
        [d.name, d.batch_no, d.brand, d.category, d.unit, d.composition, d.packaging, d.purchase_price || 0, d.sell_price || 0, d.gst || '', d.description, editingProductId]);
      APP.showToast('Product updated!', 'success');
    } else {
      DB.dbInsert("INSERT INTO products (name, batch_no, brand, category, unit, composition, packaging, purchase_price, sell_price, gst, description) VALUES (?,?,?,?,?,?,?,?,?,?,?)", 
        [d.name, d.batch_no, d.brand, d.category, d.unit, d.composition, d.packaging, d.purchase_price || 0, d.sell_price || 0, d.gst || '', d.description]);
      APP.showToast('Product added!', 'success');
    }
    APP.closeModal('product-modal');
    setTimeout(() => loadProducts(), 100);
  } catch (err) {
    console.error('saveProduct failed:', err);
    APP.showToast('Error saving product', 'error');
  }
}

function inferPackagingBase(packaging, unit) {
  const text = String(packaging || '').toLowerCase();
  const normalizedUnit = String(unit || '').toLowerCase();
  if (normalizedUnit === 'litre' || text.includes('ltr') || text.includes('ml') || text.includes(' l')) return 'Litre';
  if (normalizedUnit === 'kg' || text.includes('kg') || text.includes('gm') || text.includes(' g')) return 'Kg';
  return 'Custom';
}

function buildPackagingOptions(baseUnit, selectedValue = '') {
  const packagingSelect = document.getElementById('packaging-select');
  const customWrap = document.getElementById('custom-packaging-wrap');
  if (!packagingSelect || !customWrap) return;

  if (baseUnit === 'Custom') {
    packagingSelect.innerHTML = '<option value="">Use custom packaging below</option>';
    customWrap.style.display = 'block';
    syncUnitFromPackaging();
    return;
  }

  const options = PACKAGING_PRESETS[baseUnit] || [];
  packagingSelect.innerHTML = options.map(v => `<option value="${v}">${v}</option>`).join('');
  customWrap.style.display = 'none';

  if (selectedValue && options.includes(selectedValue)) {
    packagingSelect.value = selectedValue;
  }

  syncUnitFromPackaging();
}

function isPackagingPresetValue(baseUnit, packaging) {
  const options = PACKAGING_PRESETS[baseUnit] || [];
  return options.includes(packaging || '');
}

function syncUnitFromPackaging() {
  const baseUnit = document.getElementById('packaging-base-unit')?.value || 'Litre';
  const hiddenUnit = document.getElementById('product-unit-hidden');
  if (!hiddenUnit) return;
  hiddenUnit.value = baseUnit === 'Custom' ? '' : baseUnit;
}

function resolvePackagingValue() {
  const baseUnit = document.getElementById('packaging-base-unit')?.value || 'Litre';
  const selectedPackaging = document.getElementById('packaging-select')?.value || '';
  const customPackaging = (document.getElementById('custom-packaging-input')?.value || '').trim();
  return baseUnit === 'Custom' ? customPackaging : selectedPackaging;
}

function goToProductStep(step) {
  productFormStep = Math.max(1, Math.min(2, step));

  document.querySelectorAll('#product-modal .product-step-panel').forEach(panel => {
    panel.classList.toggle('active', Number(panel.dataset.stepPanel) === productFormStep);
  });

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
  const baseUnitSelect = document.getElementById('packaging-base-unit');
  const packagingSelect = document.getElementById('packaging-select');

  if (baseUnitSelect) {
    baseUnitSelect.addEventListener('change', () => buildPackagingOptions(baseUnitSelect.value));
  }

  if (packagingSelect) {
    packagingSelect.addEventListener('change', syncUnitFromPackaging);
  }

  buildPackagingOptions('Litre');
  goToProductStep(1);
});

loadProducts();
