/* clients.js */
let allClients = [], editingClientId = null;

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadClients() {
  console.log('Loading clients...');
  updatePageDebug('Loading Clients...', '#10B981');
  
  try {
    UTILS.renderTableSkeleton('clients-table');
    
    console.log('Clients: Initializing database connection...');
    await DB.initDB();
    
    console.log('Clients: Loading clients from backend API...');
    const { data: clientsData, error } = await window.dbClient.from('clients').select('*');
    if (error) throw error;
    allClients = clientsData || [];
    
    filterAndRender();
    
    updatePageDebug('Ready (' + allClients.length + ')', '#10B981');
    setTimeout(() => UTILS.initAllAutocompleteSelects(), 50);
    
    console.log('Clients: All data loaded successfully');
  } catch (err) {
    console.error('Clients loadClients failed:', err);
    updatePageDebug('FAILED', '#EF4444');
    APP.showToast('Failed to load clients: ' + err.message, 'error');
    renderTable([]);
  }
}

function filterAndRender() {
  const q = document.getElementById('search-input')?.value.toLowerCase() || '';
  const type = document.getElementById('type-filter')?.value || '';
  
  let filtered = allClients;
  if (q) {
    filtered = filtered.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.contact || '').toLowerCase().includes(q) || 
      (c.city || '').toLowerCase().includes(q)
    );
  }
  if (type) {
    filtered = filtered.filter(c => c.type === type);
  }
  renderTable(filtered);
}

document.getElementById('search-input')?.addEventListener('input', filterAndRender);
document.getElementById('type-filter')?.addEventListener('change', filterAndRender);

function renderTable(data) {
  const tbody = document.querySelector('#clients-table tbody');
  if (!tbody) return;
  document.getElementById('total-info').textContent = `${data.length} client${data.length !== 1 ? 's' : ''}`;
  if (!data.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8"><div class="empty-state"><h3>No clients found</h3><p>Add your first client to start selling.</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = data.map(c => `<tr>
    <td><input type="checkbox" class="row-check" value="${c.id}"></td>
    <td class="cell-bold">${c.name}</td>
    <td>${c.contact || '—'}</td>
    <td>${c.city || '—'}</td>
    <td><span class="badge badge-purple">${c.type || 'Retailer'}</span></td>
    <td>${UTILS.fmtCurrency(c.credit_limit || 0)}</td>
    <td class="cell-amount">${UTILS.fmtCurrency(c.balance || 0)}</td>
    <td><div class="row-actions">
      <button class="action-btn edit" onclick="openEdit(${c.id})"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
      <button class="action-btn delete" onclick="deleteClient(${c.id})" title="Delete"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg></button>
    </div></td>
  </tr>`).join('');
  UTILS.applyMobileTableLabels('clients-table');
}

function openAdd() {
  editingClientId = null;
  document.getElementById('modal-title').textContent = 'New Client';
  document.getElementById('client-form').reset();
  APP.openModal('client-modal');
}

function openEdit(id) {
  editingClientId = id;
  const c = allClients.find(x => x.id === id);
  if (!c) return;
  document.getElementById('modal-title').textContent = 'Edit Client';
  UTILS.populateForm('client-form', c);
  APP.openModal('client-modal');
}

async function saveClient() {
  const d = UTILS.getFormData('client-form');
  if (!d.name) { APP.showToast('Name is required', 'error'); return; }
  
  try {
    let error;
    if (editingClientId) {
      const res = await window.dbClient.from('clients').update(d).eq('id', editingClientId);
      error = res.error;
    } else {
      const res = await window.dbClient.from('clients').insert([d]);
      error = res.error;
    }
    
    if (error) throw new Error(error.message || 'Failed to save client');
    
    APP.showToast(editingClientId ? 'Client updated!' : 'Client added!', 'success');
    APP.closeModal('client-modal');
    setTimeout(() => loadClients(), 100);
  } catch (err) {
    console.error('saveClient failed:', err);
    APP.showToast('Error saving client: ' + err.message, 'error');
  }
}

async function deleteClient(id) {
  try {
    // 1. Fetch details of dependencies from stats endpoint
    const { count: ordersCount } = await window.dbClient.from('orders').select('*', { count: 'exact', head: true }).eq('client_id', id);
    const { count: salesCount } = await window.dbClient.from('sales').select('*', { count: 'exact', head: true }).eq('client_id', id);
    const stats = { orders: ordersCount || 0, sales: salesCount || 0 };
    
    let message = 'Delete this client?';
    if (stats.orders || stats.sales) {
      message = `This client has ${stats.orders || 0} linked order(s) and ${stats.sales || 0} counter sale(s). Delete anyway?`;
    }
    
    APP.showConfirm(message, async () => {
      try {
        const { error: deleteError } = await window.dbClient.from('clients').delete().eq('id', id);
        if (deleteError) throw new Error(deleteError.message || 'Failed to delete client');
        
        APP.showToast('Client deleted!', 'success');
        setTimeout(() => loadClients(), 100);
      } catch (e) {
        console.error(e);
        APP.showToast('Failed to delete client: ' + e.message, 'error');
      }
    });
  } catch (err) {
    console.error('deleteClient dependencies check failed:', err);
    APP.showToast('Failed to verify client dependencies', 'error');
  }
}

loadClients();
