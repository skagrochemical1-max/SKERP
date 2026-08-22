/* production.js - Handles Production Batches and Inventory Synchronization */

let allProductions = [];
let cachedProducts = [];
let cachedInventory = [];
let editingProductionId = null;
let currentIngredients = [];

async function loadData() {
  try {
    updatePageDebug('Loading...', '#10B981');
    
    const { data: prodData } = await window.dbClient.from('products').select('*');
    cachedProducts = prodData || [];
    
    // Fetch Inventory (Raw Materials) to get cost
    const { data: invData } = await window.dbClient.from('inventory_items').select('*');
    cachedInventory = invData || [];
    
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
  
  select.innerHTML = '<option value="">Select Product</option>' + 
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
  document.getElementById('modal-title').textContent = 'New Production Batch';
  document.getElementById('production-form').reset();
  document.querySelector('[name="date"]').value = UTILS.todayStr();
  
  const select = document.getElementById('product-select');
  if (select._ussInstance) select._ussInstance.destroy();
  select.value = "";
  if (window.UniversalSearchSelect) new UniversalSearchSelect(select);
  
  currentIngredients = [];
  renderIngredientsTable();
  APP.openModal('production-modal');
}

async function editProduction(id) {
  const b = allProductions.find(x => x.id === id);
  if (!b) return;
  
  editingProductionId = id;
  document.getElementById('modal-title').textContent = 'Edit Production Batch';
  UTILS.populateForm('production-form', b);
  
  const select = document.getElementById('product-select');
  if (select._ussInstance) select._ussInstance.destroy();
  if (window.UniversalSearchSelect) new UniversalSearchSelect(select);
  
  currentIngredients = (b.production_ingredients || []).map(ing => ({
    id: ing.id,
    inventory_id: ing.inventory_id,
    quantity_used: ing.quantity_used,
    unit_price: ing.unit_price || 0 // if it exists
  }));
  
  renderIngredientsTable();
  APP.openModal('production-modal');
}

function addIngredientRow() {
  currentIngredients.push({ id: 'new-' + Date.now(), inventory_id: '', quantity_used: 0, unit_price: 0 });
  renderIngredientsTable();
}

function removeIngredientRow(idx) {
  currentIngredients.splice(idx, 1);
  renderIngredientsTable();
}

function updateIngredient(idx, field, value) {
  if (field === 'inventory_id') {
    const inv = cachedInventory.find(i => i.id == value);
    currentIngredients[idx].inventory_id = value;
    // auto populate price based on inventory opening cost or reorder level etc if needed
    // Assuming inventory doesn't store direct price, we just leave it 0 or let user enter
    // Wait, stock_batches has price, but we don't have it loaded. We just leave it for user to enter or 0.
  } else {
    currentIngredients[idx][field] = value;
  }
  renderIngredientsTable();
}

function renderIngredientsTable() {
  const tbody = document.getElementById('ingredients-tbody');
  if (!tbody) return;
  
  if (currentIngredients.length === 0) {
    tbody.innerHTML = '<tr class="empty-row"><td colspan="5" style="text-align:center; padding:15px; color:var(--text-muted); font-size:13px;">No raw materials added yet.</td></tr>';
    return;
  }
  
  const options = '<option value="">Select Raw Material</option>' + cachedInventory.map(i => `<option value="${i.id}">${i.name} (${i.unit || 'unit'})</option>`).join('');
  
  let totalCost = 0;
  
  tbody.innerHTML = currentIngredients.map((ing, idx) => {
    const qty = parseFloat(ing.quantity_used) || 0;
    const price = parseFloat(ing.unit_price) || 0;
    const lineTotal = qty * price;
    totalCost += lineTotal;
    
    return `<tr>
      <td>
        <select class="form-input uss-ingredient-select" style="padding: 6px;" onchange="updateIngredient(${idx}, 'inventory_id', this.value)">
          ${options.replace(`value="${ing.inventory_id}"`, `value="${ing.inventory_id}" selected`)}
        </select>
      </td>
      <td>
        <input type="number" class="form-input" style="padding: 6px;" min="0" step="0.01" value="${ing.quantity_used || ''}" onchange="updateIngredient(${idx}, 'quantity_used', this.value)">
      </td>
      <td>
        <input type="number" class="form-input" style="padding: 6px;" min="0" step="0.01" value="${ing.unit_price || ''}" onchange="updateIngredient(${idx}, 'unit_price', this.value)">
      </td>
      <td style="font-family: monospace; text-align: right; font-weight: bold;">
        ₹${lineTotal.toFixed(2)}
      </td>
      <td>
        <button type="button" class="btn btn-sm" style="background:var(--danger); color:white; padding: 4px 8px;" onclick="removeIngredientRow(${idx})">X</button>
      </td>
    </tr>`;
  }).join('');
  
  tbody.innerHTML += `<tr>
    <td colspan="3" style="text-align: right; font-weight: bold; padding: 10px;">Total Raw Material Cost:</td>
    <td style="font-family: monospace; text-align: right; font-weight: bold; font-size: 16px; padding: 10px; color: var(--success);">₹${totalCost.toFixed(2)}</td>
    <td></td>
  </tr>`;
  
  // Re-init search selects
  setTimeout(() => {
    document.querySelectorAll('.uss-ingredient-select').forEach(sel => {
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
  
  const validIngredients = currentIngredients.filter(i => i.inventory_id && parseFloat(i.quantity_used) > 0);
  
  try {
    const prodObj = cachedProducts.find(p => p.id == d.product_id);
    let totalCost = 0;
    validIngredients.forEach(i => totalCost += (parseFloat(i.quantity_used) || 0) * (parseFloat(i.unit_price) || 0));
    
    // The calculated cost price of the new finished good batch
    const costPrice = totalCost / qtyProduced;
    const finalBatchNo = d.batch_no || ('PRD-' + Date.now());
    
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
      // Find old batch to delete from stock_batches
      const oldProd = allProductions.find(p => p.id === editingProductionId);
      if (oldProd && oldProd.batch_no) {
        await window.dbClient.from('stock_batches').delete()
          .eq('item_id', oldProd.product_id)
          .eq('item_type', 'Catalog')
          .eq('batch_no', oldProd.batch_no);
      }
      
      const { error } = await window.dbClient.from('production_batches').update(payload).eq('id', editingProductionId);
      if (error) throw error;
      
      await window.dbClient.from('production_ingredients').delete().eq('production_id', editingProductionId);
    } else {
      const { data, error } = await window.dbClient.from('production_batches').insert([payload]).select();
      if (error) throw error;
      savedId = data[0].id;
    }
    
    // Insert new ingredients (Trigger deducts stock)
    if (validIngredients.length > 0) {
      const ingPayload = validIngredients.map(ing => {
        const invObj = cachedInventory.find(i => i.id == ing.inventory_id);
        return {
          production_id: savedId,
          inventory_id: parseInt(ing.inventory_id),
          inventory_name: invObj ? invObj.name : '',
          quantity_used: parseFloat(ing.quantity_used)
        };
      });
      const { error: ingErr } = await window.dbClient.from('production_ingredients').insert(ingPayload);
      if (ingErr) throw ingErr;
    }
    
    // Add finished good to stock_batches to INCREASE inventory
    const stockBatchPayload = {
      item_id: prodObj.id,
      item_name: prodObj.name,
      item_type: 'Catalog',
      batch_no: finalBatchNo,
      purchase_price: costPrice, // cost of production
      initial_qty: qtyProduced,
      current_qty: qtyProduced,
      unit: prodObj.unit || 'Kg',
      created_at: new Date(d.date || new Date()).toISOString()
    };
    
    await window.dbClient.from('stock_batches').insert([stockBatchPayload]);
    
    APP.showToast(editingProductionId ? 'Production updated!' : 'Production recorded!', 'success');
    APP.closeModal('production-modal');
    loadData();
    
  } catch (err) {
    console.error(err);
    APP.showToast('Error saving: ' + err.message, 'error');
  }
}

async function deleteProduction(id) {
  const b = allProductions.find(x => x.id === id);
  APP.showConfirm('Delete this production batch? This will restore the used raw materials back to inventory.', async () => {
    try {
      if (b && b.batch_no) {
        await window.dbClient.from('stock_batches').delete()
          .eq('item_id', b.product_id)
          .eq('item_type', 'Catalog')
          .eq('batch_no', b.batch_no);
      }
      
      const { error } = await window.dbClient.from('production_batches').delete().eq('id', id);
      if (error) throw error;
      
      APP.showToast('Production deleted and inventory restored!', 'success');
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
