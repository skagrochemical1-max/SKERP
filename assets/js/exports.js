/* exports.js */

function updatePageDebug(text, color) {
  const el = document.getElementById('debug-page-status');
  if (el) {
    el.textContent = 'Page: ' + text;
    if (color) el.style.color = color;
  }
}

async function loadExports() {
  updatePageDebug('Ready', '#10B981');
}

async function fetchExportData(tableName, from, to) {
  let data = [];
  
  // For transactional tables, if date ranges are provided, use the reports/summary endpoint which aggregates them.
  if (from || to) {
    if (['orders', 'daily_transactions', 'purchases', 'transactions', 'expenses'].includes(tableName)) {
      const res = await fetch(`/api/reports/summary?from=${from || ''}&to=${to || ''}`);
      if (!res.ok) throw new Error('Failed to fetch filtered records');
      const result = await res.json();
      const raw = result.raw || {};
      
      switch(tableName) {
        case 'orders':             return raw.orders || [];
        case 'daily_transactions': return raw.dailyTxns || [];
        case 'purchases':          return raw.purchases || [];
        case 'expenses':           return raw.expenses || [];
        case 'transactions':       
          // For transactions, let's fetch from the `/api/transactions` endpoint and filter client-side
          // because the reports summary doesn't return raw ledger logs, it returns raw daily_transactions.
          break;
      }
    }
  }

  // Fallback / Default fetches
  let endpoint = '';
  switch(tableName) {
    case 'clients':            endpoint = '/api/clients'; break;
    case 'products':           endpoint = '/api/products'; break;
    case 'orders':             endpoint = '/api/orders'; break;
    case 'purchases':          endpoint = '/api/purchases'; break;
    case 'transactions':       endpoint = '/api/transactions'; break;
    case 'expenses':           endpoint = '/api/expenses'; break;
    case 'suppliers':          endpoint = '/api/suppliers'; break;
    case 'daily_transactions': endpoint = '/api/daily-transactions'; break;
  }

  if (!endpoint) return [];
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Failed to fetch data for ${tableName}`);
  data = await res.json();

  // Apply manual date filters client-side
  if (from) {
    data = data.filter(row => {
      const dateVal = row.date || row.created_at;
      if (!dateVal) return true;
      return dateVal.slice(0, 10) >= from;
    });
  }
  if (to) {
    data = data.filter(row => {
      const dateVal = row.date || row.created_at;
      if (!dateVal) return true;
      return dateVal.slice(0, 10) <= to;
    });
  }

  return data;
}

async function exportTable(tableName, label) {
  try {
    APP.showSpinner();
    const data = await fetchExportData(tableName);
    if (!data.length) { 
      APP.showToast('No data to export', 'warning'); 
      return; 
    }
    
    // Select subset of columns to clean the export
    let cleanData = data;
    switch(tableName) {
      case 'clients':
        cleanData = data.map(c => ({ id: c.id, name: c.name, contact: c.contact, email: c.email, city: c.city, gst: c.gst, type: c.type, credit_limit: c.credit_limit, balance: c.balance, created_at: c.created_at }));
        break;
      case 'products':
        cleanData = data.map(p => ({ id: p.id, name: p.name, batch_no: p.batch_no, category: p.category, unit: p.unit, reorder_level: p.reorder_level, cost_price: p.purchase_price, sell_price: p.sell_price }));
        break;
      case 'orders':
        cleanData = data.map(o => ({ id: o.id, order_no: o.order_no, client_name: o.client_name, date: o.date, status: o.status, total_amount: o.total_amount, paid_amount: o.paid_amount, notes: o.notes }));
        break;
      case 'purchases':
        cleanData = data.map(p => ({ id: p.id, purchase_no: p.purchase_no, supplier_name: p.supplier_name, date: p.date, status: p.status, total_amount: p.total_amount, paid_amount: p.paid_amount, notes: p.notes }));
        break;
      case 'transactions':
        cleanData = data.map(t => ({ id: t.id, date: t.date, type: t.type, ref_no: t.ref_no, party_name: t.party_name, amount: t.amount, mode: t.mode, notes: t.notes }));
        break;
      case 'expenses':
        cleanData = data.map(e => ({ id: e.id, date: e.date, category: e.category, description: e.description, amount: e.amount, payment_mode: e.payment_mode }));
        break;
      case 'suppliers':
        cleanData = data.map(s => ({ id: s.id, name: s.name, contact: s.contact, email: s.email, city: s.city, gst: s.gst, category: s.category, payment_terms: s.payment_terms, balance: s.balance }));
        break;
      case 'daily_transactions':
        cleanData = data.map(dt => ({ id: dt.id, txn_no: dt.txn_no, client_name: dt.client_name, date: dt.date, total_amount: dt.total_amount, paid_amount: dt.paid_amount, notes: dt.notes }));
        break;
    }
    
    UTILS.exportToExcel(cleanData, label);
  } catch (err) {
    APP.showToast('Export failed: ' + err.message, 'error');
  } finally {
    APP.hideSpinner();
  }
}

async function exportCSV(tableName, label) {
  try {
    APP.showSpinner();
    const data = await fetchExportData(tableName);
    if (!data.length) { 
      APP.showToast('No data to export', 'warning'); 
      return; 
    }
    UTILS.exportToCSV(data, label);
  } catch (err) {
    APP.showToast('Export failed: ' + err.message, 'error');
  } finally {
    APP.hideSpinner();
  }
}

async function exportAllToExcel() {
  if (!window.XLSX) { APP.showToast('SheetJS not loaded', 'error'); return; }
  APP.showSpinner();
  try {
    const wb = XLSX.utils.book_new();
    const tables = ['clients', 'products', 'orders', 'purchases', 'transactions', 'expenses', 'suppliers', 'daily_transactions'];
    const names = ['Clients', 'Products', 'Orders', 'Purchases', 'Transactions', 'Expenses', 'Suppliers', 'Daily Transactions'];
    
    for (let i = 0; i < tables.length; i++) {
      const data = await fetchExportData(tables[i]);
      if (data.length) {
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, names[i]);
      }
    }
    
    XLSX.writeFile(wb, `AgroChem_ERP_Full_Export_${UTILS.todayStr()}.xlsx`);
    APP.showToast('Full database exported to Excel!', 'success');
  } catch(e) {
    APP.showToast('Export failed: ' + e.message, 'error');
  } finally {
    APP.hideSpinner();
  }
}

function importDatabase() {
  APP.showToast('Direct SQL database file import is disabled in MySQL server mode.', 'info');
}

function exportDatabase() {
  APP.showToast('Direct SQL database file export is disabled. Use Excel full export instead.', 'info');
}

function eraseAllData() {
  APP.showConfirm('⚠️ This will PERMANENTLY DELETE ALL DATA. You will be left with an empty database. Continue?', async () => {
    APP.showSpinner();
    try {
      const res = await fetch('/api/database/reset', { method: 'POST' });
      const result = await res.json();
      if (!res.ok || !result.success) throw new Error(result.message || 'Failed to erase data');
      
      APP.showToast('Database cleared. Reloading...', 'warning');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    } catch (err) {
      APP.showToast('Failed to reset database: ' + err.message, 'error');
    } finally {
      APP.hideSpinner();
    }
  });
}

function setExportPreset(type) {
  const fromEl = document.getElementById('export-date-from');
  const toEl = document.getElementById('export-date-to');
  if (!fromEl || !toEl) return;
  
  const today = new Date();
  const todayStr = UTILS.todayStr(); // YYYY-MM-DD
  
  switch(type) {
    case 'today':
      fromEl.value = todayStr;
      toEl.value = todayStr;
      break;
    case 'month':
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      fromEl.value = firstDay.toISOString().split('T')[0];
      toEl.value = todayStr;
      break;
    case 'year':
      fromEl.value = today.getFullYear() + '-01-01';
      toEl.value = todayStr;
      break;
    case 'all':
      fromEl.value = '';
      toEl.value = '';
      break;
  }
}

function selectAllExportModules(status) {
  const ids = ['orders', 'daily_transactions', 'purchases', 'transactions', 'expenses', 'products', 'clients', 'suppliers'];
  ids.forEach(id => {
    const el = document.getElementById('chk-' + id);
    if (el) el.checked = status;
  });
}

async function bulkExportCSV() {
  const fromEl = document.getElementById('export-date-from');
  const toEl = document.getElementById('export-date-to');
  const from = fromEl ? fromEl.value : '';
  const to = toEl ? toEl.value : '';
  
  const tables = [
    { id: 'orders', label: 'Sales_Orders' },
    { id: 'daily_transactions', label: 'Daily_Transactions' },
    { id: 'purchases', label: 'Purchase_Orders' },
    { id: 'transactions', label: 'Ledger_Transactions' },
    { id: 'expenses', label: 'Operational_Expenses' },
    { id: 'products', label: 'Products_Stock_Master' },
    { id: 'clients', label: 'Client_Registry_Master' },
    { id: 'suppliers', label: 'Supplier_Directory_Master' }
  ];
  
  const selectedTables = tables.filter(t => {
    const chk = document.getElementById('chk-' + t.id);
    return chk && chk.checked;
  });
  
  if (selectedTables.length === 0) {
    APP.showToast('Please select at least one module to export', 'warning');
    return;
  }
  
  APP.showSpinner();
  
  let exportCount = 0;
  
  for (let i = 0; i < selectedTables.length; i++) {
    const table = selectedTables[i];
    try {
      const data = await fetchExportData(table.id, from, to);
      
      if (data.length === 0) {
        APP.showToast(`No data found in ${table.label} for the selected dates`, 'warning');
        continue;
      }
      
      let rangeTag = 'All_Time';
      if (from && to) {
        rangeTag = `${from}_to_${to}`;
      } else if (from) {
        rangeTag = `from_${from}`;
      } else if (to) {
        rangeTag = `to_${to}`;
      }
      
      const fileName = `${table.label}_${rangeTag}`;
      UTILS.exportToCSV(data, fileName);
      exportCount++;
      
      await new Promise(resolve => setTimeout(resolve, 150));
    } catch (err) {
      console.error(`Failed to export ${table.label}:`, err);
      APP.showToast(`Failed to export ${table.label}`, 'error');
    }
  }
  
  APP.hideSpinner();
  if (exportCount > 0) {
    APP.showToast(`Successfully exported ${exportCount} modules to CSV!`, 'success');
  }
}

async function downloadBackup() {
  try {
    APP.showSpinner();
    // Directly redirect browser window to trigger file download attachment
    window.location.href = '/api/database/backup/download';
    setTimeout(() => {
      APP.hideSpinner();
      APP.showToast('Backup download initiated!', 'success');
    }, 1500);
  } catch (err) {
    APP.hideSpinner();
    console.error('Backup download error:', err);
    APP.showToast('Failed to download backup', 'error');
  }
}

// Bind to window for inline HTML access
window.setExportPreset = setExportPreset;
window.selectAllExportModules = selectAllExportModules;
window.bulkExportCSV = bulkExportCSV;
window.exportTable = exportTable;
window.exportCSV = exportCSV;
window.exportAllToExcel = exportAllToExcel;
window.importDatabase = importDatabase;
window.exportDatabase = exportDatabase;
window.downloadBackup = downloadBackup;
window.eraseAllData = eraseAllData;

loadExports();
