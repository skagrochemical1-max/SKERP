/* production.js - Handles Production Batches (Stock Additions) */

let allProductions = [];
let cachedProducts = [];
let editingProductionId = null;
let currentLines = [];

async function loadData() {
  try {
    updatePageDebug('Loading...', '#10B981');
    
    // Fetch Products (Finished Goods)
    const { data: prodData } = await window.dbClient.from('products').select('*');
    cachedProducts = prodData || [];
    
    // Fetch Production Batches
    const { data: prodBatches, error } = await window.dbClient.from('production_batches')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    allProductions = prodBatches || [];
    
    renderTable(allProductions);
    updatePageDebug('Ready (' + allProductions.length + ')', '#10B981');
  } catch (err) {
    console.error('loadData failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    UTILS.showToast('Failed to load production data', 'error');
  }
}

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) { el.textContent = 'Page: ' + text; if (color) el.style.color = color; }
}

function renderTable(data) {
  const tbody = document.querySelector('#production-table tbody');
  if (!tbody) return;
  
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="empty-state"><h3>No production batches found</h3><p>Create your first batch.</p></div></td></tr>`;
    return;
  }
  
  tbody.innerHTML = data.map(b => {
    return `<tr>
      <td><input type="checkbox"></td>
      <td class="cell-bold">${b.batch_no || '-'}</td>
      <td>${b.product_name || '-'}</td>
      <td>${b.formula_name || '-'}</td>
      <td>${UTILS.fmtDate(b.date)}</td>
      <td>${b.quantity_produced || 0}</td>
      <td>
        <div class="action-btns">
          <button class="icon-btn delete-btn" onclick="deleteProduction(${b.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>
      </td>
    </tr>`;
  }).join('');
  
  UTILS.applyMobileTableLabels('production-table');
}

function openProductionModal() {
  editingProductionId = null;
  document.getElementById('production-form').reset();
  document.querySelector('[name="date"]').value = UTILS.todayStr();
  
  currentLines = [];
  addIngredientRow(); // Start with one empty row
  APP.openModal('production-modal');
}

function addIngredientRow() {
  currentLines.push({ id: 'new-' + Date.now(), product_id: '', quantity: 1, unit_price: 0 });
  renderIngredientsTable();
}

function removeIngredientRow(idx) {
  currentLines.splice(idx, 1);
  renderIngredientsTable();
}

function updateIngredient(idx, field, value) {
  currentLines[idx][field] = value;
  
  if (field === 'product_id') {
    const prod = cachedProducts.find(p => p.id == value);
    if (prod) {
      currentLines[idx].unit_price = parseFloat(prod.purchase_price) || 0;
    }
  }
  renderIngredientsTable();
}

function renderIngredientsTable() {
  const tbody = document.getElementById('ingredients-tbody');
  if (!tbody) return;
  
  if (currentLines.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted); font-size:13px;">No items added yet.</td></tr>';
    document.getElementById('production-total-display').textContent = '₹0.00';
    return;
  }
  
  const options = '<option value="">Select Product</option>' + cachedProducts.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  
  let totalCost = 0;
  
  tbody.innerHTML = currentLines.map((line, idx) => {
    const qty = parseFloat(line.quantity) || 0;
    const price = parseFloat(line.unit_price) || 0;
    const lineTotal = qty * price;
    totalCost += lineTotal;
    
    return `<tr>
      <td>
        <select class="form-input uss-product-select" style="padding: 6px;" onchange="updateIngredient(${idx}, 'product_id', this.value)">
          ${options.replace(`value="${line.product_id}"`, `value="${line.product_id}" selected`)}
        </select>
      </td>
      <td>
        <input type="number" class="form-input" style="padding: 6px;" min="0.01" step="0.01" value="${line.quantity || ''}" onchange="updateIngredient(${idx}, 'quantity', this.value)">
      </td>
      <td>
        <input type="number" class="form-input" style="padding: 6px;" min="0" step="0.01" value="${line.unit_price || ''}" onchange="updateIngredient(${idx}, 'unit_price', this.value)">
      </td>
      <td style="font-family: monospace; font-weight: bold; padding-top: 10px;">
        ₹${lineTotal.toFixed(2)}
      </td>
      <td>
        <button type="button" class="icon-btn delete-btn" style="margin-top: 4px;" onclick="removeIngredientRow(${idx})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
  
  document.getElementById('production-total-display').textContent = `₹${totalCost.toFixed(2)}`;
  
  // Re-init search selects
  setTimeout(() => {
    document.querySelectorAll('.uss-product-select').forEach(sel => {
       if (sel._ussInstance) sel._ussInstance.destroy();
       if (window.UniversalSearchSelect) new UniversalSearchSelect(sel);
    });
  }, 10);
}

async function saveProduction() {
  const d = UTILS.getFormData('production-form');
  
  const validLines = currentLines.filter(i => i.product_id && parseFloat(i.quantity) > 0);
  if (validLines.length === 0) {
    APP.showToast('Add at least one valid product line', 'error'); 
    return;
  }
  
  try {
    for (const line of validLines) {
      const prodObj = cachedProducts.find(p => p.id == line.product_id);
      const qty = parseFloat(line.quantity) || 0;
      const price = parseFloat(line.unit_price) || 0;
      const batchNo = 'PRD-' + Date.now() + Math.floor(Math.random() * 100);
      
      const payload = {
        product_id: parseInt(line.product_id),
        product_name: prodObj ? prodObj.name : '',
        batch_no: batchNo,
        formula_name: 'Direct Entry',
        quantity_produced: qty,
        date: d.date,
        notes: d.notes || ''
      };
      
      const { data, error } = await window.dbClient.from('production_batches').insert([payload]).select();
      if (error) throw error;
      
      // Add finished good to stock_batches to INCREASE inventory
      const stockBatchPayload = {
        item_id: prodObj.id,
        item_name: prodObj.name,
        item_type: 'Catalog',
        batch_no: batchNo,
        purchase_price: price,
        initial_qty: qty,
        current_qty: qty,
        unit: prodObj.unit || 'Kg',
        created_at: new Date(d.date || new Date()).toISOString()
      };
      
      await window.dbClient.from('stock_batches').insert([stockBatchPayload]);
    }
    
    APP.showToast('Production recorded successfully!', 'success');
    APP.closeModal('production-modal');
    loadData();
    
  } catch (err) {
    console.error(err);
    APP.showToast('Error saving: ' + err.message, 'error');
  }
}

async function deleteProduction(id) {
  const b = allProductions.find(x => x.id === id);
  APP.showConfirm('Delete this production batch and remove it from inventory?', async () => {
    try {
      if (b && b.batch_no) {
        await window.dbClient.from('stock_batches').delete()
          .eq('item_id', b.product_id)
          .eq('item_type', 'Catalog')
          .eq('batch_no', b.batch_no);
      }
      
      const { error } = await window.dbClient.from('production_batches').delete().eq('id', id);
      if (error) throw error;
      
      APP.showToast('Production deleted and inventory adjusted!', 'success');
      loadData();
    } catch (e) {
      console.error(e);
      APP.showToast('Delete failed: ' + e.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('production-search-input')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const filtered = allProductions.filter(b => 
      (b.batch_no || '').toLowerCase().includes(term) ||
      (b.product_name || '').toLowerCase().includes(term) ||
      (b.formula_name || '').toLowerCase().includes(term)
    );
    renderTable(filtered);
  });
  
  setTimeout(() => loadData(), 100);
});
