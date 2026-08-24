/* purchases.js */
let allPurchases = [], purchaseItems = [], editingPurchaseId = null;
let purchasableItems = [];

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadPurchases() {
  console.log('Loading purchases...');
  updatePageDebug('Loading Purchases...', '#10B981');
  
  try {
    UTILS.renderTableSkeleton('purchases-table');
    await DB.initDB();
    
    console.log('Purchases: Loading purchasable items...');
    await refreshPurchasableItems();
    
    console.log('Purchases: Loading purchases from database...');
    const { data: pData, error: pErr } = await window.dbClient.from('purchases').select('*').order('date', {ascending: false});
    if (pErr) throw pErr;
    allPurchases = pData || [];

    // Removed random auto-fix for purchase_no
    
    // Retrieve supplier list to map display names
    const { data: supData } = await window.dbClient.from('suppliers').select('*');
    const suppliersList = supData || [];
    
    // Retrieve purchase items to display in the table
    const { data: piData } = await window.dbClient.from('purchase_items').select('*');
    const allItems = piData || [];
    
    allPurchases.forEach(p => {
      const match = suppliersList.find(s => s.id === p.supplier_id);
      p.supplier_display = match ? match.name : (p.supplier_name || '—');
      p.items = allItems.filter(it => it.purchase_id === p.id);
    });

    renderTable(allPurchases);
    await populateSupplierSelect();
    
    updatePageDebug('Ready (' + allPurchases.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
    
    console.log('Purchases: All data loaded successfully');

  // Attach search listener
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', filterAndRender);
  }

  } catch (err) {
    console.error('Purchases loadPurchases failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load purchases: ' + err.message, 'error');
  }
}

async function refreshPurchasableItems() {
  try {
    const { data: pData, error: pErr } = await window.dbClient.from('products').select('*');
    const p = pErr ? [] : pData || [];
    const { data: iData, error: iErr } = await window.dbClient.from('inventory_items').select('*');
    const i = iErr ? [] : iData || [];
    
    const combined = [
      ...p.map(x => ({ id: x.id, name: x.name, unit: x.unit || 'Nos', type: 'Catalog', item_size: x.item_size || x.packaging })),
      ...i.map(x => ({ id: x.id, name: x.name, unit: x.unit || 'Nos', type: 'Inventory', item_size: x.item_size }))
    ];
    
    const map = new Map();
    combined.forEach(x => {
      if (!x.name) return;
      const key = x.name.trim().toLowerCase();
      if (!map.has(key)) {
        map.set(key, { id: x.id, name: x.name.trim(), unit: x.unit || 'Nos', type: x.type, item_size: x.item_size });
      }
    });

    purchasableItems = Array.from(map.values());
  } catch (err) {
    console.error('refreshPurchasableItems failed:', err);
  }
}

function renderTable(data) {
  const tbody = document.querySelector('#purchases-table tbody');
  if (!tbody) return;
  document.getElementById('total-info').textContent = `${data.length} purchase${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="10"><div class="empty-state"><h3>No purchases found</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(p => {
    let itemsHtml = '—';
    if (p.items && p.items.length > 0) {
      itemsHtml = p.items.map(it => {
        const u = it.unit ? ` ${it.unit.trim()}` : '';
        const qtyText = it.quantity !== undefined && it.quantity !== null ? ` (${it.quantity}${u})` : '';
        return `<span style="display:inline-block; font-weight:600; color:var(--primary);">${it.item_name || 'Item'}</span><span style="font-weight:400; color:var(--text-muted);">${qtyText}</span>`;
      }).join(', ');
    }

    return `<tr>
      <td><input type="checkbox" class="row-check" value="${p.id}"></td>
      <td class="cell-bold">${p.purchase_no}</td>
      <td class="cell-mono">${p.invoice_no || '—'}</td>
      <td>${p.supplier_display || '—'}</td>
      <td style="max-width:240px; word-break:break-word; line-height:1.4;">${itemsHtml}</td>
      <td>${UTILS.fmtDate(p.date)}</td>
      <td class="cell-amount">${UTILS.fmtCurrency(p.total_amount)}</td>
      <td class="cell-amount">${UTILS.fmtCurrency(p.paid_amount || 0)}</td>
      <td class="cell-amount text-danger">${UTILS.fmtCurrency((parseFloat(p.total_amount) || 0) - (parseFloat(p.paid_amount) || 0))}</td>
      <td><div class="row-actions">
        <button class="action-btn edit" onclick="openEdit(${p.id})" title="Edit Purchase"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
        <button class="action-btn delete" onclick="deletePurchase(${p.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
      </div></td>
    </tr>`;
  }).join('');
  UTILS.applyMobileTableLabels('purchases-table');
}

function filterAndRender() {
  const q = document.getElementById('search-input')?.value.toLowerCase() || '';
  let filtered = allPurchases;
  if (q) {
    filtered = filtered.filter(p => {
      const itemsText = (p.items || []).map(it => it.item_name || '').join(' ').toLowerCase();
      return (p.purchase_no || '').toLowerCase().includes(q) || 
        (p.supplier_display || '').toLowerCase().includes(q) || 
        (p.invoice_no || '').toLowerCase().includes(q) ||
        (p.date || '').toLowerCase().includes(q) ||
        itemsText.includes(q);
    });
  }
  renderTable(filtered);
}

async function populateSupplierSelect() {
  const sel = document.getElementById('supplier-select');
  if (!sel) return;
  try {
    const { data: supData, error } = await window.dbClient.from('suppliers').select('*');
    const suppliers = error ? [] : supData || [];
    sel.innerHTML = '<option value="">Select Supplier</option>' + suppliers.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  } catch (err) {
    console.error('populateSupplierSelect failed:', err);
  }
}

async function openAdd() {
  editingPurchaseId = null;
  document.getElementById('modal-title').textContent = 'New Purchase Entry';
  const purchaseForm = document.getElementById('purchase-form');
  purchaseForm.reset();
  await refreshPurchasableItems();
  purchaseItems = [];
  renderPurchaseItems();
  UTILS.applyDefaultDateInputs(purchaseForm, { skipFieldNames: ['due_date'] });
  APP.openModal('purchase-modal');
}

async function openEdit(id) {
  editingPurchaseId = id;
  try {
    await refreshPurchasableItems();
    const { data: p, error } = await window.dbClient.from('purchases').select('*').eq('id', id).single();
    if (error) throw error;
    
    // Fetch line items for this purchase
    const { data: piData, error: piError } = await window.dbClient.from('purchase_items').select('*').eq('purchase_id', id);
    if (!piError && piData) {
      p.items = piData;
    }
    
    document.getElementById('modal-title').textContent = 'Edit Purchase';
    UTILS.populateForm('purchase-form', p);
    UTILS.applyDefaultDateInputs(document.getElementById('purchase-form'), { skipFieldNames: ['due_date'] });
    purchaseItems = p.items || [];
    
    // Map items list correctly
    purchaseItems.forEach(it => {
      it.total = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
    });

    renderPurchaseItems();
    APP.openModal('purchase-modal');
  } catch (err) {
    console.error(err);
    APP.showToast('Failed to load purchase details: ' + err.message, 'error');
  }
}

function addPurchaseItem() {
  purchaseItems.push({ id: Date.now(), item_id: '', item_name: '', item_type: 'Catalog', quantity: 1, unit_price: 0, batch_no: '', expiry_date: '', total: 0 });
  renderPurchaseItems();
}

function renderPurchaseItems() {
  const tbody = document.getElementById('purchase-items-tbody');
  if (!tbody) return;
  
  tbody.innerHTML = purchaseItems.map((it, idx) => `
    <tr>
      <td style="min-width:220px;">
        <input type="text" 
               class="form-input item-search-input" 
               value="${it.item_name || ''}" 
               placeholder="Search catalog/inventory or type name..." 
               autocomplete="off" 
               onfocus="showItemSuggestions(${idx}, this)" 
               oninput="onItemSearchInput(${idx}, this)" 
               onblur="hideItemSuggestionsLater(${idx})">
      </td>
      <td><input type="text" class="form-input" value="${it.batch_no || ''}" placeholder="Batch #" onchange="updateItem(${idx}, 'batch_no', this.value)"></td>
      <td><input type="date" class="form-input" value="${it.expiry_date ? it.expiry_date.split('T')[0] : ''}" onchange="updateItem(${idx}, 'expiry_date', this.value)"></td>
      <td><input type="number" class="form-input" value="${it.quantity}" onchange="updateItem(${idx}, 'quantity', this.value)"></td>
      <td><input type="number" class="form-input" value="${it.unit_price}" onchange="updateItem(${idx}, 'unit_price', this.value)"></td>
      <td class="cell-amount" id="item-total-${idx}">${UTILS.fmtCurrency(it.total)}</td>
      <td><button class="action-btn delete" onclick="removePurchaseItem(${idx})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button></td>
    </tr>
  `).join('');
  
  calculateTotal();
}

let activeSearchInput = null;

function getSuggestionsPortal() {
  let portal = document.getElementById('item-suggestions-portal');
  if (!portal) {
    portal = document.createElement('div');
    portal.id = 'item-suggestions-portal';
    portal.className = 'uss-portal-custom';
    portal.style.position = 'absolute';
    portal.style.zIndex = '999999';
    portal.style.background = 'var(--surface, #121e18)';
    portal.style.border = '1px solid var(--border, rgba(16, 185, 129, 0.25))';
    portal.style.borderRadius = 'var(--radius-sm, 8px)';
    portal.style.maxHeight = '240px';
    portal.style.overflowY = 'auto';
    portal.style.boxShadow = '0 12px 32px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(16, 185, 129, 0.15)';
    portal.style.backdropFilter = 'blur(12px)';
    portal.style.display = 'none';
    document.body.appendChild(portal);
  }
  return portal;
}

function showItemSuggestions(idx, inputEl) {
  renderSuggestionsList(idx, inputEl);
}

function onItemSearchInput(idx, inputEl) {
  const val = inputEl.value;
  updateItem(idx, 'item_name', val);
  renderSuggestionsList(idx, inputEl);
}

function renderSuggestionsList(idx, inputEl) {
  activeSearchInput = { idx, el: inputEl };
  const portal = getSuggestionsPortal();
  const query = inputEl.value || '';
  const q = query.trim().toLowerCase();
  
  // Filter matches
  const matches = purchasableItems.filter(m => m.name && m.name.toLowerCase().includes(q));

  // Hide portal if no relevant matching item exists
  if (matches.length === 0) {
    portal.style.display = 'none';
    portal.innerHTML = '';
    return;
  }

  // Position portal relative to inputEl in viewport
  const rect = inputEl.getBoundingClientRect();
  portal.style.top = `${rect.bottom + window.scrollY + 4}px`;
  portal.style.left = `${rect.left + window.scrollX}px`;
  portal.style.width = `${Math.max(rect.width, 240)}px`;

  portal.innerHTML = matches.map(m => {
    const safeName = m.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const typeBadge = m.type ? `<span style="font-size: 11px; font-weight: 500; padding: 2px 8px; border-radius: 999px; background: rgba(16, 185, 129, 0.12); color: var(--accent, #10b981); border: 1px solid rgba(16, 185, 129, 0.2);">${m.type}</span>` : '';
    return `<div class="suggestion-item" 
         style="padding: 10px 14px; cursor: pointer; color: var(--text-primary, #f8fafc); font-size: 13px; font-family: inherit; border-bottom: 1px solid rgba(255,255,255,0.03); display: flex; justify-content: space-between; align-items: center; transition: background 0.15s ease, color 0.15s ease;"
         onmouseenter="this.style.background='rgba(16, 185, 129, 0.12)'; this.style.color='var(--accent, #10b981)';"
         onmouseleave="this.style.background='transparent'; this.style.color='var(--text-primary, #f8fafc)';"
         onmousedown="selectItemSuggestion(${idx}, '${safeName}')">
      <span style="font-weight: 500;">${m.name}</span>
      ${typeBadge}
    </div>`;
  }).join('');
  portal.style.display = 'block';
}

function selectItemSuggestion(idx, name) {
  if (activeSearchInput && activeSearchInput.el) {
    activeSearchInput.el.value = name;
  }
  updateItem(idx, 'item_name', name);
  const portal = getSuggestionsPortal();
  portal.style.display = 'none';
}

function hideItemSuggestionsLater() {
  setTimeout(() => {
    const portal = getSuggestionsPortal();
    portal.style.display = 'none';
  }, 200);
}

function updateItem(idx, key, val) {
  const it = purchaseItems[idx];
  if (!it) return;

  if (key === 'item_name' || key === 'item_key') {
    const nameTrimmed = (val || '').trim();
    it.item_name = nameTrimmed;
    const match = purchasableItems.find(m => m.name.toLowerCase() === nameTrimmed.toLowerCase());
    if (match) {
      it.item_id = match.id;
      it.item_type = match.type;
      it.unit = match.unit || 'Nos';
    } else {
      it.item_id = '';
      it.item_type = 'Catalog';
      it.unit = 'Nos';
    }
  } else {
    it[key] = val;
  }
  
  it.total = (parseFloat(it.quantity) || 0) * (parseFloat(it.unit_price) || 0);
  const totalCell = document.getElementById(`item-total-${idx}`);
  if (totalCell) {
    totalCell.textContent = UTILS.fmtCurrency(it.total);
  }
  calculateTotal();
}

function removePurchaseItem(idx) {
  purchaseItems.splice(idx, 1);
  renderPurchaseItems();
}

function calculateTotal() {
  const total = purchaseItems.reduce((s, it) => s + it.total, 0);
  document.getElementById('purchase-total-display').textContent = UTILS.fmtCurrency(total);
}

async function savePurchase() {
  const d = UTILS.getFormData('purchase-form');
  if (!d.supplier_id) { APP.showToast('Please select a supplier', 'error'); return; }
  if (purchaseItems.length === 0) { APP.showToast('Please add at least one item', 'error'); return; }
  
  const supplierSelect = document.getElementById('supplier-select');
  const supplierName = supplierSelect ? supplierSelect.options[supplierSelect.selectedIndex].text : '';
  const total = purchaseItems.reduce((s, it) => s + it.total, 0);
  
  try {
    const rpcPayload = {
      p_invoice_no: d.invoice_no || '',
      p_supplier_id: d.supplier_id,
      p_supplier_name: supplierName,
      p_date: d.date || UTILS.todayStr(),
      p_due_date: d.due_date || null,
      p_status: d.status || 'Pending',
      p_total_amount: total,
      p_paid_amount: parseFloat(d.paid_amount) || 0.00,
      p_notes: d.notes || ''
    };

    // Prepare line items with base quantity conversion
    const itemsPayload = purchaseItems.map(it => {
      let baseQty = parseFloat(it.quantity) || 0;
      let unit = 'Nos';
      
      const match = purchasableItems.find(m => m.id === it.item_id && m.type === it.item_type);
      if (match) {
        unit = match.unit;
        if (match.item_size) {
          const packSizeMl = UTILS.parsePackSizeInMl(match.item_size);
          if (packSizeMl > 0) {
            const baseUnit = UTILS.normalizeUnit(unit);
            if (baseUnit === 'Litre' || baseUnit === 'Kg') {
              baseQty = (packSizeMl / 1000) * baseQty;
            } else if (baseUnit === 'Ml' || baseUnit === 'Gram') {
              baseQty = packSizeMl * baseQty;
            }
          }
        }
      }

      return {
        item_id: it.item_id || null,
        item_name: it.item_name,
        item_type: it.item_type || 'Inventory',
        quantity: parseFloat(it.quantity) || 0,
        base_quantity: baseQty,
        unit_price: parseFloat(it.unit_price) || 0,
        batch_no: it.batch_no || '',
        expiry_date: it.expiry_date || null,
        total: parseFloat(it.total) || 0,
        unit: unit
      };
    });

    rpcPayload.p_items = itemsPayload;

    if (editingPurchaseId) {
      rpcPayload.p_purchase_id = editingPurchaseId;
      const { data, error } = await window.dbClient.rpc('update_purchase_txn', rpcPayload);
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Failed to update purchase');
      APP.showToast('Purchase updated and inventory synced!', 'success');
    } else {
      const { data, error } = await window.dbClient.rpc('create_purchase_txn', rpcPayload);
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || 'Failed to create purchase');
      APP.showToast(`Purchase ${data.purchase_no} created and inventory synced!`, 'success');
    }

    APP.closeModal('purchase-modal');
    setTimeout(() => loadPurchases(), 100);
  } catch (err) {
    console.error('savePurchase failed:', err);
    APP.showToast('Failed to save purchase: ' + err.message, 'error');
  }
}

async function deletePurchase(id) {
  APP.showConfirm('Delete this purchase and all its line items?', async () => {
    try {
      const { data, error } = await window.dbClient.rpc('delete_purchase_txn', { p_purchase_id: id });
      if (error) throw new Error(error.message || 'Failed to delete purchase');
      if (data && !data.success) throw new Error(data.error || 'Failed to delete purchase');
      
      APP.showToast('Purchase deleted and inventory restored!', 'success');
      setTimeout(() => loadPurchases(), 100);
    } catch (err) {
      console.error('deletePurchase failed:', err);
      APP.showToast('Failed to delete purchase: ' + err.message, 'error');
    }
  });
}

loadPurchases();
