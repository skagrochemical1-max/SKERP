/* production.js - Handles Production Batches and Inventory Synchronization */

let allProductions = [];
let cachedProducts = [];
let cachedInventory = [];
let editingProductionId = null;
let currentLines = [];

async function loadData() {
  try {
    updatePageDebug('Loading...', '#10B981');
    
    // Fetch Products (Finished Goods) for top-level record
    const { data: prodData } = await window.dbClient.from('products').select('id, name');
    cachedProducts = prodData || [];
    
    // Fetch Inventory (Raw Materials & Finished Goods) for line items
    const { data: invData } = await window.dbClient.from('inventory_items').select('id, name, unit');
    cachedInventory = invData || [];
    
    // Fetch Production Batches
    const { data: prodBatches, error } = await window.dbClient.from('production_batches')
      .select('*, production_ingredients(*)')
      .order('date', { ascending: false });
      
    if (error) throw error;
    allProductions = prodBatches || [];
    
    populateProductSelect();
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

function populateProductSelect() {
  const select = document.getElementById('product-select');
  if (!select) return;
  if (select._ussInstance) select._ussInstance.destroy();
  select.innerHTML = '<option value="">Select Product...</option>' + 
    cachedProducts.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  if (window.UniversalSearchSelect) new UniversalSearchSelect(select);
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
          <button class="icon-btn" onclick="editProduction(${b.id})" title="Edit"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>
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
  
  const select = document.getElementById('product-select');
  if (select._ussInstance) select._ussInstance.destroy();
  select.value = "";
  if (window.UniversalSearchSelect) new UniversalSearchSelect(select);
  
  currentLines = [];
  addIngredientRow();
  APP.openModal('production-modal');
}

async function editProduction(id) {
  const b = allProductions.find(x => x.id === id);
  if (!b) return;
  
  editingProductionId = id;
  UTILS.populateForm('production-form', b);
  
  const select = document.getElementById('product-select');
  if (select._ussInstance) select._ussInstance.destroy();
  if (window.UniversalSearchSelect) new UniversalSearchSelect(select);
  
  currentLines = (b.production_ingredients || []).map(ing => {
    // Determine action from quantity_used: negative means INCREASE, positive means DECREASE
    const isIncrease = ing.quantity_used < 0;
    return {
      id: ing.id,
      inventory_id: ing.inventory_id,
      quantity: Math.abs(ing.quantity_used),
      action: isIncrease ? 'INCREASE' : 'DECREASE'
    };
  });
  
  renderIngredientsTable();
  APP.openModal('production-modal');
}

function addIngredientRow() {
  currentLines.push({ id: 'new-' + Date.now(), inventory_id: '', quantity: 0, action: 'DECREASE' });
  renderIngredientsTable();
}

function removeIngredientRow(idx) {
  currentLines.splice(idx, 1);
  renderIngredientsTable();
}

function updateIngredient(idx, field, value) {
  currentLines[idx][field] = value;
  renderIngredientsTable(); // Re-render for unit updates if needed
}

function renderIngredientsTable() {
  const tbody = document.getElementById('ingredients-tbody');
  if (!tbody) return;
  
  if (currentLines.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="4" style="text-align:center; padding:15px; color:var(--text-muted); font-size:13px;">No items added.</td></tr>';
    return;
  }
  
  const options = '<option value="">Select Inventory Item</option>' + cachedInventory.map(i => `<option value="${i.id}">${i.name}</option>`).join('');
  
  tbody.innerHTML = currentLines.map((line, idx) => {
    const inv = cachedInventory.find(i => i.id == line.inventory_id);
    const unitLabel = inv ? inv.unit : '';
    
    return `<tr>
      <td>
        <select class="form-input uss-inventory-select" style="padding: 6px;" onchange="updateIngredient(${idx}, 'inventory_id', this.value)">
          ${options.replace(`value="${line.inventory_id}"`, `value="${line.inventory_id}" selected`)}
        </select>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 5px;">
          <input type="number" class="form-input" style="padding: 6px; width: 80px;" min="0.01" step="0.01" value="${line.quantity || ''}" onchange="updateIngredient(${idx}, 'quantity', this.value)">
          <span style="font-size: 11px; color: var(--text-muted);">${unitLabel}</span>
        </div>
      </td>
      <td>
        <select class="form-input" style="padding: 6px; font-weight: bold; color: ${line.action === 'INCREASE' ? 'var(--success)' : 'var(--danger)'};" onchange="updateIngredient(${idx}, 'action', this.value)">
          <option value="DECREASE" ${line.action === 'DECREASE' ? 'selected' : ''}>DECREASE</option>
          <option value="INCREASE" ${line.action === 'INCREASE' ? 'selected' : ''}>INCREASE</option>
        </select>
      </td>
      <td>
        <button type="button" class="icon-btn delete-btn" style="margin-top: 4px;" onclick="removeIngredientRow(${idx})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join('');
  
  setTimeout(() => {
    document.querySelectorAll('.uss-inventory-select').forEach(sel => {
       if (sel._ussInstance) sel._ussInstance.destroy();
       if (window.UniversalSearchSelect) new UniversalSearchSelect(sel);
    });
  }, 10);
}

async function saveProduction() {
  const d = UTILS.getFormData('production-form');
  if (!d.product_id) { APP.showToast('Product is required', 'error'); return; }
  const qtyProduced = parseFloat(d.quantity_produced);
  if (!qtyProduced || qtyProduced <= 0) { APP.showToast('Valid quantity is required', 'error'); return; }
  
  const validLines = currentLines.filter(i => i.inventory_id && parseFloat(i.quantity) > 0);
  
  try {
    // 1. Validate Stock for DECREASE
    const { data: currentStock } = await window.dbClient.from('inventory_items').select('id, name, stock');
    if (currentStock) {
      for (const line of validLines) {
        if (line.action === 'DECREASE') {
          const invItem = currentStock.find(i => i.id == line.inventory_id);
          const reqQty = parseFloat(line.quantity);
          const availQty = parseFloat(invItem?.stock || 0);
          
          let oldQty = 0;
          if (editingProductionId) {
             const oldBatch = allProductions.find(x => x.id === editingProductionId);
             if (oldBatch && oldBatch.production_ingredients) {
                const oldIng = oldBatch.production_ingredients.find(oi => oi.inventory_id == line.inventory_id && oi.quantity_used > 0);
                if (oldIng) oldQty = oldIng.quantity_used;
             }
          }
          
          if (reqQty > (availQty + oldQty)) {
            APP.showToast(`Not enough stock for ${invItem ? invItem.name : 'item'}. Required: ${reqQty}, Available: ${availQty + oldQty}`, 'error');
            return;
          }
        }
      }
    }
    
    const prodObj = cachedProducts.find(p => p.id == d.product_id);
    const finalBatchNo = d.batch_no || ('B-' + Date.now());
    
    const payload = {
      product_id: parseInt(d.product_id),
      product_name: prodObj ? prodObj.name : '',
      batch_no: finalBatchNo,
      formula_name: d.formula_name || '',
      quantity_produced: qtyProduced,
      date: d.date,
      notes: d.notes || ''
    };
    
    let savedId = editingProductionId;
    
    if (editingProductionId) {
      const { error } = await window.dbClient.from('production_batches').update(payload).eq('id', editingProductionId);
      if (error) throw error;
      
      // Delete old ingredients (Trigger restores stock automatically)
      await window.dbClient.from('production_ingredients').delete().eq('production_id', editingProductionId);
    } else {
      const { data, error } = await window.dbClient.from('production_batches').insert([payload]).select();
      if (error) throw error;
      savedId = data[0].id;
    }
    
    // Insert new ingredients (Trigger adjusts stock automatically)
    if (validLines.length > 0) {
      const ingPayload = validLines.map(line => {
        const invObj = cachedInventory.find(i => i.id == line.inventory_id);
        const qty = parseFloat(line.quantity) || 0;
        // If action is INCREASE, we pass a negative quantity so the DB trigger ADDS to stock
        const finalQtyUsed = line.action === 'INCREASE' ? -qty : qty;
        
        return {
          production_id: savedId,
          inventory_id: parseInt(line.inventory_id),
          inventory_name: invObj ? invObj.name : '',
          quantity_used: finalQtyUsed
        };
      });
      const { error: ingErr } = await window.dbClient.from('production_ingredients').insert(ingPayload);
      if (ingErr) throw ingErr;
    }
    
    APP.showToast('Production recorded & inventory updated!', 'success');
    APP.closeModal('production-modal');
    loadData();
    
  } catch (err) {
    console.error(err);
    APP.showToast('Error saving: ' + err.message, 'error');
  }
}

async function deleteProduction(id) {
  APP.showConfirm('Delete this production batch? All inventory changes will be reversed.', async () => {
    try {
      // Deleting production_batches cascades to production_ingredients.
      // The DB trigger on production_ingredients DELETE will automatically restore stock!
      const { error } = await window.dbClient.from('production_batches').delete().eq('id', id);
      if (error) throw error;
      
      APP.showToast('Production deleted and inventory reversed!', 'success');
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
      (b.product_name || '').toLowerCase().includes(term)
    );
    renderTable(filtered);
  });
  
  setTimeout(() => loadData(), 100);
});
