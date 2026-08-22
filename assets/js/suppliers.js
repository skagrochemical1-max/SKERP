/* suppliers.js */
let allSuppliers = [], editingSupplierId = null;

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadSuppliers() {
  console.log('Loading suppliers...');
  updatePageDebug('Loading Suppliers...', '#10B981');
  
  try {
    UTILS.renderTableSkeleton('suppliers-table');
    
    console.log('Suppliers: Initializing database connection...');
    await DB.initDB();
    
    console.log('Suppliers: Loading suppliers from backend API...');
    const { data: suppliersData, error } = await window.dbClient.from('suppliers').select('*');
    if (error) throw error;
    allSuppliers = suppliersData || [];
    
    renderTable(allSuppliers);
    
    updatePageDebug('Ready (' + allSuppliers.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
    
    console.log('Suppliers: All data loaded successfully');

    // Attach search listener
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', filterAndRender);
    }
  } catch (err) {
    console.error('Suppliers loadSuppliers failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load suppliers: ' + err.message, 'error');
    renderTable([]);
  }
}

function renderTable(data) {
  const tbody = document.querySelector('#suppliers-table tbody');
  if (!tbody) return;
  document.getElementById('total-info').textContent = `${data.length} supplier${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="7"><div class="empty-state"><h3>No suppliers found</h3><p>Manage your raw material sources here.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(s => `<tr>
    <td><input type="checkbox" class="row-check" value="${s.id}"></td>
    <td class="cell-bold">${s.name}</td>
    <td>${s.company_name || '—'}</td>
    <td>${s.contact || '—'}</td>
    <td>${s.city || '—'}</td>
    <td>${s.gst || '—'}</td>
    <td><div class="row-actions">
      <button class="action-btn edit" onclick="openEdit(${s.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="action-btn delete" onclick="deleteSupplier(${s.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
    </div></td>
  </tr>`).join('');
  UTILS.applyMobileTableLabels('suppliers-table');
}

function filterAndRender() {
  const q = document.getElementById('search-input')?.value.toLowerCase() || '';
  let filtered = allSuppliers;
  if (q) {
    filtered = filtered.filter(s => 
      (s.name || '').toLowerCase().includes(q) || 
      (s.company_name || '').toLowerCase().includes(q) || 
      (s.contact || '').toLowerCase().includes(q) || 
      (s.city || '').toLowerCase().includes(q)
    );
  }
  renderTable(filtered);
}

function openAdd() {
  editingSupplierId = null;
  document.getElementById('modal-title').textContent = 'New Supplier';
  document.getElementById('supplier-form').reset();
  APP.openModal('supplier-modal');
}

function openEdit(id) {
  editingSupplierId = id;
  const s = allSuppliers.find(x => x.id === id);
  if (!s) return;
  document.getElementById('modal-title').textContent = 'Edit Supplier';
  UTILS.populateForm('supplier-form', s);
  APP.openModal('supplier-modal');
}

async function saveSupplier() {
  const d = UTILS.getFormData('supplier-form');
  if (!d.name) { APP.showToast('Supplier name is required', 'error'); return; }
  
  try {
    let error;
    if (editingSupplierId) {
      const res = await window.dbClient.from('suppliers').update(d).eq('id', editingSupplierId);
      error = res.error;
    } else {
      const res = await window.dbClient.from('suppliers').insert([d]);
      error = res.error;
    }
    
    if (error) throw new Error(error.message || 'Failed to save supplier');
    
    APP.showToast(editingSupplierId ? 'Supplier updated!' : 'Supplier added!', 'success');
    APP.closeModal('supplier-modal');
    setTimeout(() => loadSuppliers(), 100);
  } catch (err) {
    console.error('saveSupplier failed:', err);
    APP.showToast('Error saving supplier: ' + err.message, 'error');
  }
}

async function deleteSupplier(id) {
  try {
    // 1. Fetch details of dependencies from stats endpoint
    const { count: purchasesCount } = await window.dbClient.from('purchases').select('*', { count: 'exact', head: true }).eq('supplier_id', id);
    const { count: batchesCount } = await window.dbClient.from('batches').select('*', { count: 'exact', head: true }).eq('supplier_id', id);
    const stats = { purchases: purchasesCount || 0, batches: batchesCount || 0 };
    
    let message = 'Delete this supplier?';
    if (stats.purchases || stats.batches) {
      message = `This supplier has ${stats.purchases || 0} linked purchase(s) and ${stats.batches || 0} batch record(s). Delete anyway?`;
    }
    
    APP.showConfirm(message, async () => {
      try {
        const { error: deleteError } = await window.dbClient.from('suppliers').delete().eq('id', id);
        if (deleteError) throw new Error(deleteError.message || 'Failed to delete supplier');
        
        APP.showToast('Supplier deleted!', 'success');
        setTimeout(() => loadSuppliers(), 100);
      } catch (e) {
        console.error(e);
        APP.showToast('Failed to delete supplier: ' + e.message, 'error');
      }
    });
  } catch (err) {
    console.error('deleteSupplier dependencies check failed:', err);
    APP.showToast('Failed to verify supplier dependencies', 'error');
  }
}

loadSuppliers();
