'use strict';

let currentTab = 'clients';
let productsData = [];
let clientsData = [];

function escapeHTML(value) {
  return String(value || '').replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag]));
}

function normalizeGSTIN(value) {
  return String(value || '').trim().toUpperCase();
}

// Use existing API_SECRET and APPS_SCRIPT_URL from api.js if available, or define fallback
const MASTER_API_URL = typeof APPS_SCRIPT_URL !== 'undefined' ? APPS_SCRIPT_URL : window.location.origin + '/api';
const MASTER_API_SECRET = typeof API_SECRET !== 'undefined' ? API_SECRET : 'sk_agro_secure_key_2026'; // Match Code.gs



function switchTab(tab) {
  currentTab = tab;

  document.querySelectorAll('.tab-btn-premium').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');

  document.getElementById('view-products').style.display = tab === 'products' ? 'block' : 'none';
  document.getElementById('view-clients').style.display = tab === 'clients' ? 'block' : 'none';
  
  // Clear search on tab switch
  document.getElementById('master-search').value = '';
  filterMasterTable();
}

function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.className = isError ? 'error show' : 'show';
  setTimeout(() => { t.className = ''; }, 3000);
}

function filterMasterTable() {
  const query = document.getElementById('master-search').value.toLowerCase();
  const tbody = currentTab === 'products' ? document.getElementById('products-tbody') : document.getElementById('clients-tbody');
  const rows = tbody.getElementsByTagName('tr');
  
  for (let row of rows) {
    if (row.cells.length < 2) continue; // Skip loading/empty rows
    const text = row.innerText.toLowerCase();
    row.style.display = text.includes(query) ? '' : 'none';
  }
}

// Ensure data is loaded on DOM content ready
document.addEventListener('DOMContentLoaded', () => {
  // Font loading detection
  if (document.fonts && typeof document.fonts.load === 'function') {
    document.fonts.load('24px "Material Symbols Outlined"').then(function() {
      document.body.classList.add('material-symbols-loaded');
    }).catch(function(e) {
      console.warn('Font loading failed:', e);
      document.body.classList.add('material-symbols-loaded');
    });
  } else {
    document.body.classList.add('material-symbols-loaded');
  }

  loadData();
});

// ─── API INTERACTIONS ───────────────────────────────────────

async function fetchMasterData(action) {
  try {
    const res = await fetch(`${MASTER_API_URL}?action=${action}&apiKey=${MASTER_API_SECRET}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error(`Error fetching ${action}:`, err);
    return [];
  }
}

async function postMasterData(action, data) {
  try {
    const url = new URL(MASTER_API_URL);
    url.searchParams.set('action', action);
    url.searchParams.set('apiKey', MASTER_API_SECRET);

    const res = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(data) // Send just the data in the body
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Request failed');
    return true;
  } catch (err) {
    console.error(`Error posting ${action}:`, err);
    showToast(`Error: ${err.message}`, true);
    return false;
  }
}

async function loadData() {
  document.getElementById('products-tbody').innerHTML = `<tr><td colspan="6"><div class="loading-row-content"><span class="material-symbols-outlined spinner-icon">autorenew</span> Loading...</div></td></tr>`;
  document.getElementById('clients-tbody').innerHTML = `<tr><td colspan="6"><div class="loading-row-content"><span class="material-symbols-outlined spinner-icon">autorenew</span> Loading...</div></td></tr>`;

  // Load both in parallel
  const [prods, cli] = await Promise.all([
    fetchMasterData('getProducts'),
    fetchMasterData('getClients')
  ]);

  // Normalize Products Data (Handing variations in spreadsheet column headers)
  productsData = (prods || []).map(p => {
      const findKey = (obj, k) => Object.keys(obj).find(key => key.trim().toLowerCase().replace(/\s/g,'') === k.toLowerCase());
      const getV = (obj, k) => {
          const matchedKey = findKey(obj, k);
          return matchedKey ? (obj[matchedKey] || '').toString().trim() : '';
      };

      return {
          ProductID: p.ProductID || p.id || getV(p, 'productid') || '',
          BrandName: formatText(getV(p, 'brandname') || getV(p, 'brand') || ''),
          ProductName: formatText(getV(p, 'productname') || getV(p, 'product') || getV(p, 'name') || ''),
          PackagingSize: formatText(getV(p, 'packagingsize') || getV(p, 'packaging') || getV(p, 'size') || ''),
          UnitPrice: parseFloat(getV(p, 'unitprice') || getV(p, 'price') || 0)
      };
  });

  // Normalize Clients Data
  clientsData = (cli || []).map(c => {
      const findKey = (obj, k) => Object.keys(obj).find(key => key.trim().toLowerCase().replace(/\s/g,'') === k.toLowerCase());
      const getV = (obj, k) => {
          const matchedKey = findKey(obj, k);
          return matchedKey ? (obj[matchedKey] || '').toString().trim() : '';
      };

      return {
          ClientID: c.ClientID || c.id || getV(c, 'clientid') || '',
          ClientName: formatText(getV(c, 'clientname') || getV(c, 'name') || ''),
          Address: formatText(getV(c, 'address') || ''),
          Phone: getV(c, 'phone') || getV(c, 'mobile') || '',
          GSTIN: normalizeGSTIN(getV(c, 'gstin') || ''),
          DueAmount: parseFloat(getV(c, 'dueamount') || getV(c, 'due') || 0)
      };
  });

      productsData = productsData.slice().reverse();
      clientsData = clientsData.slice().reverse();

  renderTables();
}

function renderTables() {
  // Render Products
  const ptbody = document.getElementById('products-tbody');
  if (productsData.length === 0) {
    ptbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No products found</td></tr>';
  } else {
    ptbody.innerHTML = productsData.map((p, index) => `
      <tr>
        <td data-label="ID" style="color:var(--text-muted);font-size:12px;"><span class="table-cell-text single-line mono">${index + 1}</span></td>
        <td data-label="Brand"><span class="table-cell-text single-line" style="font-weight:700;color:var(--primary);">${escapeHTML(p.BrandName || '')}</span></td>
        <td data-label="Product"><span class="table-cell-text wrap-anywhere">${escapeHTML(p.ProductName || '')}</span></td>
        <td data-label="Packaging"><span class="table-cell-text single-line info-badge" style="display:inline-block;">${escapeHTML(p.PackagingSize || '')}</span></td>
        <td data-label="Price" style="font-weight:600;"><span class="table-cell-text single-line">₹${parseFloat(p.UnitPrice || 0).toLocaleString('en-IN', {minimumFractionDigits:2})}</span></td>
        <td data-label="Actions" style="text-align:right;white-space:nowrap;">
          <button class="action-btn" title="Edit" onclick="editRecord('product', '${p.ProductID}')"><span class="material-symbols-outlined">edit</span></button>
          <button class="action-btn delete" title="Delete" onclick="deleteRecord('product', '${p.ProductID}')"><span class="material-symbols-outlined">delete</span></button>
        </td>
      </tr>
    `).join('');
  }

  // Render Clients
  const ctbody = document.getElementById('clients-tbody');
  if (clientsData.length === 0) {
    ctbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px;">No clients found</td></tr>';
  } else {
    ctbody.innerHTML = clientsData.map((c, index) => {
      const due = parseFloat(c.DueAmount || c.dueAmount || 0);
      const dueDisplay = due > 0
        ? `<span style="font-weight:700; color:#ef4444;">₹${due.toLocaleString('en-IN', {minimumFractionDigits:2})}</span>`
        : `<span style="color:var(--text-muted);">₹0.00</span>`;
      return `
      <tr>
        <td data-label="ID" style="color:var(--text-muted);font-size:12px;"><span class="table-cell-text single-line mono">${index + 1}</span></td>
        <td data-label="Name"><span class="table-cell-text wrap-anywhere" style="font-weight:700;color:var(--primary);">${escapeHTML(c.ClientName || '')}</span></td>
        <td data-label="Phone"><span class="table-cell-text single-line">${escapeHTML(c.Phone || '')}</span></td>
        <td data-label="GSTIN"><span class="table-cell-text single-line mono">${escapeHTML(normalizeGSTIN(c.GSTIN || ''))}</span></td>
        <td data-label="Due Amount" style="text-align:right;"><span class="table-cell-text single-line">${dueDisplay}</span></td>
        <td data-label="Actions" style="text-align:right;white-space:nowrap;">
          <button class="action-btn" title="Edit" onclick="editRecord('client', '${c.ClientID}')"><span class="material-symbols-outlined">edit</span></button>
          <button class="action-btn delete" title="Delete" onclick="deleteRecord('client', '${c.ClientID}')"><span class="material-symbols-outlined">delete</span></button>
        </td>
      </tr>
    `;
    }).join('');
  }
}

// ─── MODAL MANAGEMENT ───────────────────────────────────────

function addPackRowHTML() {
  const container = document.getElementById('packaging-container');
  if (!container) return;
  const HTML = `
    <div class="pack-row" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;padding:12px;background:var(--bg-banner);border-radius:8px;border:1px solid var(--border-light);">
      <div><input class="sb-input pack-size" placeholder="Size (e.g. 1 Ltr)" style="width:100%;" required /></div>
      <div style="display:flex;gap:8px;">
        <input type="number" step="0.01" class="sb-input pack-price" placeholder="Price (₹)" style="width:100%;flex:1;" required />
        <button type="button" class="btn btn-danger remove-pack-btn" onclick="this.parentElement.parentElement.remove()" style="padding:0 12px;">✕</button>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', HTML);
  
  // Make first delete button visible if more than 1 row
  const rows = container.querySelectorAll('.pack-row');
  if (rows.length > 1) {
    rows[0].querySelector('.remove-pack-btn').style.display = 'block';
  }
}

function openModal(type = currentTab, id = null) {
  const modal = document.getElementById('data-modal');
  const title = document.getElementById('modal-title');
  document.getElementById('entry-id').value = id || '';

  document.getElementById('prod-fields').style.display = type === 'products' ? 'block' : 'none';
  document.getElementById('client-fields').style.display = type === 'clients' ? 'block' : 'none';

  title.textContent = id ? `Edit ${type === 'products' ? 'Product' : 'Client'}` : `Add New ${type === 'products' ? 'Product' : 'Client'}`;

  // Clear generic
  document.getElementById('prod-brand').value = '';
  document.getElementById('prod-name').value = '';
  document.getElementById('client-name').value = '';
  document.getElementById('client-addr').value = '';
  document.getElementById('client-phone').value = '';
  document.getElementById('client-gstin').value = normalizeGSTIN('');
  const clientDueEl = document.getElementById('client-due');
  if (clientDueEl) clientDueEl.value = '';

  const packContainer = document.getElementById('packaging-container');
  if (packContainer) {
    packContainer.innerHTML = `
      <div class="pack-row" style="margin-top:12px;display:flex;flex-direction:column;gap:8px;padding:12px;background:var(--bg-banner);border-radius:8px;border:1px solid var(--border-light);">
        <div><input class="sb-input pack-size" placeholder="Size (e.g. 1 Ltr)" style="width:100%;" required /></div>
        <div style="display:flex;gap:8px;">
          <input type="number" step="0.01" class="sb-input pack-price" placeholder="Price (₹)" style="width:100%;flex:1;" required />
          <button type="button" class="btn btn-danger remove-pack-btn" onclick="this.parentElement.parentElement.remove()" style="padding:0 12px;display:none;">✕</button>
        </div>
      </div>
    `;
  }

  const addAnotherBtn = document.getElementById('save-another-btn');
  
  if (id) {
    if (addAnotherBtn) addAnotherBtn.style.display = 'none';
    if (type === 'products') {
      const p = productsData.find(x => x.ProductID == id);
      if (p) {
        document.getElementById('prod-brand').value = p.BrandName || '';
        document.getElementById('prod-name').value = p.ProductName || '';
        if (packContainer) {
          packContainer.querySelector('.pack-size').value = p.PackagingSize || '';
          packContainer.querySelector('.pack-price').value = p.UnitPrice || '';
        }
      }
    } else {
      const c = clientsData.find(x => x.ClientID == id);
      if (c) {
        document.getElementById('client-name').value = c.ClientName || '';
        document.getElementById('client-addr').value = c.Address || '';
        document.getElementById('client-phone').value = c.Phone || '';
        document.getElementById('client-gstin').value = normalizeGSTIN(c.GSTIN || '');
        const clientDueEl = document.getElementById('client-due');
        if (clientDueEl) clientDueEl.value = c.DueAmount || c.dueAmount || 0;
      }
    }
  } else {
    // Show only for new Products
    if (addAnotherBtn) addAnotherBtn.style.display = type === 'products' ? 'inline-block' : 'none';
  }

  modal.style.display = 'flex';
}

function closeModal() {
  document.getElementById('data-modal').style.display = 'none';
}

async function saveRecord(e, keepOpen = false) {
  e.preventDefault();
  
  const idInput = document.getElementById('entry-id');
  const id = idInput.value;
  const isEditing = !!id;
  const saveBtn = document.getElementById('save-btn');
  const addAnotherBtn = document.getElementById('save-another-btn');

  saveBtn.textContent = 'Saving...';
  saveBtn.disabled = true;
  if (addAnotherBtn) addAnotherBtn.disabled = true;

  // Validate ONLY visible fields in the active tab (not hidden required fields in the other tab)
  const activeFieldsId = currentTab === 'products' ? 'prod-fields' : 'client-fields';
  const activeFields = document.getElementById(activeFieldsId);
  if (activeFields) {
    const requiredInputs = activeFields.querySelectorAll('input[required]');
    for (const inp of requiredInputs) {
      if (!inp.value.trim()) {
        inp.focus();
        inp.setCustomValidity('This field is required');
        inp.reportValidity();
        inp.setCustomValidity('');
        saveBtn.textContent = 'Save changes';
        saveBtn.disabled = false;
        if (addAnotherBtn) addAnotherBtn.disabled = false;
        return;
      }
    }
  }

  // Helper: get next sequential ID (accessible to both products & clients paths)
  const getNextMasterId = (t, offset = 0) => {
    const prefix = t === 'products' ? 'P-' : 'C-';
    const data = t === 'products' ? productsData : clientsData;
    const idField = t === 'products' ? 'ProductID' : 'ClientID';
    let max = 0;
    data.forEach(item => {
      const idStr = String(item[idField] || '').toUpperCase();
      if (idStr.startsWith(prefix)) {
        const numPart = idStr.replace(prefix, '');
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num < 1000000000) {
          if (num > max) max = num;
        }
      }
    });
    return prefix + String(max + 1 + offset).padStart(3, '0');
  };

  if (currentTab === 'products') {
    const brand = formatText(document.getElementById('prod-brand').value.trim());
    const name = formatText(document.getElementById('prod-name').value.trim());
    
    const rows = document.querySelectorAll('.pack-row');
    const dataPayload = [];
    

    rows.forEach((row, i) => {
      const size = formatText(row.querySelector('.pack-size').value.trim());
      const price = row.querySelector('.pack-price').value.trim();
      if (!size || !price) return;
      
      const item = {
          // Send multiple variations of keys to ensure it hits the correct spreadsheet column
          ProductID: isEditing ? id : getNextMasterId('products', i),
          id: isEditing ? id : getNextMasterId('products', i),
          
          BrandName: brand,
          'Brand Name': brand,
          brand: brand,
          
          ProductName: name,
          'Product Name': name,
          product: name,
          name: name,
          
          PackagingSize: size,
          'Packaging Size': size,
          packaging: size,
          size: size,
          
          UnitPrice: price,
          'Unit Price': price,
          price: price
      };
      
      dataPayload.push(item);
    });
    
    if (dataPayload.length === 0) {
      saveBtn.textContent = 'Save changes';
      saveBtn.disabled = false;
      return;
    }

    try {
      if (isEditing) {
        // ID is stored in the hidden idInput
        const success = await api.updateProduct(dataPayload[0]);
        if (!success) throw new Error('Update failed');
      } else {
        // New entry with potentially multiple rows (packs)
        for (const item of dataPayload) {
          const res = await api.addProduct(item);
          if (res && res.error) throw new Error(res.error);
        }
      }
      
      showToast('Product(s) saved successfully');
      loadData();
      
      if (keepOpen) {
        // Clear only specific fields for the next pack size
        const packContainer = document.getElementById('packaging-container');
        if (packContainer) {
          packContainer.innerHTML = `
            <div class="form-grid pack-row" style="margin-top:8px;">
              <div><input class="sb-input pack-size" placeholder="Size (e.g. 1 Ltr)" style="width:100%;" required /></div>
              <div style="display:flex;gap:8px;">
                <input type="number" step="0.01" class="sb-input pack-price" placeholder="Price (₹)" style="width:100%;" required />
                <button type="button" class="btn btn-danger remove-pack-btn" onclick="this.parentElement.parentElement.remove()" style="padding:0 8px;display:none;">✕</button>
              </div>
            </div>
          `;
          packContainer.querySelector('.pack-size').focus();
        }
        idInput.value = ''; // Ensure NEXT save creates a new record
      } else {
        closeModal();
      }
    } catch (err) {
      console.error('Product save error:', err);
      showToast('Error saving products: ' + err.message, true);
    }
  } else {
    const data = {
      ClientID: id || getNextMasterId('clients'),
      ClientName: formatText(document.getElementById('client-name').value.trim()),
      Address: formatText(document.getElementById('client-addr').value.trim()),
      Phone: document.getElementById('client-phone').value.trim(),
      GSTIN: normalizeGSTIN(document.getElementById('client-gstin').value),
      DueAmount: parseFloat(document.getElementById('client-due')?.value || 0) || 0
    };

    try {
      const res = isEditing ? await api.updateClient(data) : await api.addClient(data);
      if (res && res.error) throw new Error(res.error);
      
      showToast('Client saved successfully');
      loadData();
      closeModal();
    } catch (err) {
      console.error('Client save error:', err);
      showToast('Error saving client: ' + err.message, true);
    }
  }

  saveBtn.textContent = 'Save changes';
  saveBtn.disabled = false;
  if(addAnotherBtn) addAnotherBtn.disabled = false;
}

function editRecord(type, id) {
  openModal(type + 's', id);
}

async function deleteRecord(type, id) {
  if (!confirm(`Are you sure you want to delete this ${type}?`)) return;

  if (type === 'product') {
    const success = await postMasterData('deleteProduct', { ProductID: id });
    if (success) {
      showToast('Product deleted');
      loadData();
    }
  } else {
    const success = await postMasterData('deleteClient', { ClientID: id });
    if (success) {
      showToast('Client deleted');
      loadData();
    }
  }
}
